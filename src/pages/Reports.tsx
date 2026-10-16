import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { addDays, differenceInCalendarDays, endOfMonth, format, isSameDay, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMe, useStore } from "@/store/useStore";
import { cn, entryHours, fmtDec, fmtHM } from "@/lib/utils";
import { PageHeader, Popover, Segmented } from "@/components/ui";
import { BarChart, HBarList } from "@/components/Charts";
import type { Cell } from "@/lib/export";

type Preset = "semana" | "semana-passada" | "mes" | "mes-passado" | "custom";
type GroupBy = "projeto" | "cliente" | "colaborador" | "tarefa";

const rangeFor = (p: Preset): [Date, Date] => {
  const n = new Date();
  switch (p) {
    case "semana": { const s = startOfWeek(n, { weekStartsOn: 1 }); return [s, addDays(s, 6)]; }
    case "semana-passada": { const s = startOfWeek(subWeeks(n, 1), { weekStartsOn: 1 }); return [s, addDays(s, 6)]; }
    case "mes": return [startOfMonth(n), endOfMonth(n)];
    case "mes-passado": { const m = subMonths(n, 1); return [startOfMonth(m), endOfMonth(m)]; }
    default: return [startOfMonth(n), n];
  }
};

export default function Reports() {
  const s = useStore();
  const me = useMe();
  const [mode, setMode] = useState<"resumido" | "detalhado">("resumido");
  const [preset, setPreset] = useState<Preset>("semana");
  const [custom, setCustom] = useState(() => ({ from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }));
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState(me.role === "admin" ? "" : me.id);
  const [groupBy, setGroupBy] = useState<GroupBy>("projeto");

  const [from, to] = preset === "custom" ? [parseISO(custom.from), parseISO(custom.to)] : rangeFor(preset);
  const toEnd = addDays(to, 1);

  const rows = useMemo(
    () =>
      s.entries
        .filter((e) => {
          const d = parseISO(e.start);
          if (d < from || d >= toEnd || !e.end) return false;
          const p = s.projects.find((x) => x.id === e.projectId);
          if (projectId && e.projectId !== projectId) return false;
          if (clientId && p?.clientId !== clientId) return false;
          if (userId && e.userId !== userId) return false;
          return true;
        })
        .sort((a, b) => a.start.localeCompare(b.start)),
    [s.entries, s.projects, from.getTime(), toEnd.getTime(), projectId, clientId, userId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const total = rows.reduce((a, e) => a + entryHours(e), 0);
  const nDays = differenceInCalendarDays(to, from) + 1;
  const daily = Array.from({ length: Math.min(nDays, 31) }, (_, i) => addDays(from, i)).map((d) => ({
    label: nDays > 10 ? format(d, "d") : format(d, "EEE d", { locale: ptBR }).replace(".", ""),
    sub: format(d, "EEEE, d MMM", { locale: ptBR }),
    value: rows.filter((e) => isSameDay(parseISO(e.start), d)).reduce((a, e) => a + entryHours(e), 0),
  }));

  const groups = useMemo(() => {
    const m = new Map<string, { id: string; label: string; value: number; color?: string; sub?: string }>();
    rows.forEach((e) => {
      const p = s.projects.find((x) => x.id === e.projectId);
      let key = "", label = "", color: string | undefined, sub: string | undefined;
      if (groupBy === "projeto") { key = p?.id ?? "none"; label = p?.name ?? "Sem projeto"; color = p?.color ?? "#8A94A6"; }
      if (groupBy === "cliente") { const c = s.clients.find((x) => x.id === p?.clientId); key = c?.id ?? "none"; label = c?.name ?? "Sem cliente"; }
      if (groupBy === "colaborador") { const u = s.users.find((x) => x.id === e.userId); key = e.userId; label = u?.name ?? "?"; color = u?.color; }
      if (groupBy === "tarefa") { const t = s.tasks.find((x) => x.id === e.taskId); key = t?.id ?? `desc:${e.description}`; label = t?.name ?? e.description; sub = t ? t.tema : "registro rápido"; color = p?.color; }
      const g = m.get(key) ?? { id: key, label, value: 0, color, sub };
      g.value += entryHours(e);
      m.set(key, g);
    });
    return [...m.values()].sort((a, b) => b.value - a.value);
  }, [rows, groupBy, s.projects, s.clients, s.users, s.tasks]);

  // estimated vs worked for tasks touched in the period
  const taskTable = useMemo(() => {
    const ids = [...new Set(rows.map((e) => e.taskId).filter(Boolean))] as string[];
    return ids.map((id) => {
      const t = s.tasks.find((x) => x.id === id)!;
      const all = s.entries.filter((e) => e.taskId === id && e.end).reduce((a, e) => a + entryHours(e), 0);
      return { t, worked: all, project: s.projects.find((p) => p.id === t?.projectId) };
    }).filter((x) => x.t);
  }, [rows, s.tasks, s.entries, s.projects]);

  const periodLabel = `${format(from, "dd/MM/yyyy")} – ${format(to, "dd/MM/yyyy")}`;
  const fileBase = `relatorio-${mode}-${format(from, "yyyyMMdd")}-${format(to, "yyyyMMdd")}`;
  const groupLabel = { projeto: "Projeto", cliente: "Cliente", colaborador: "Colaborador", tarefa: "Tarefa" }[groupBy];

  const tableData = (): { head: string[]; body: Cell[][]; foot: Cell[] } => {
    if (mode === "resumido") {
      return {
        head: [groupLabel, "Horas (decimal)", "Horas", "%"],
        body: groups.map((g) => [g.label, Number(g.value.toFixed(2)), fmtHM(g.value), `${Math.round((g.value / (total || 1)) * 100)}%`]),
        foot: ["Total", Number(total.toFixed(2)), fmtHM(total), "100%"],
      };
    }
    return {
      head: ["Data", "Colaborador", "Cliente", "Projeto", "Tarefa", "Descrição", "Etiquetas", "Início", "Fim", "Horas"],
      body: rows.map((e) => {
        const p = s.projects.find((x) => x.id === e.projectId);
        return [
          format(parseISO(e.start), "dd/MM/yyyy"),
          s.users.find((u) => u.id === e.userId)?.name ?? "",
          s.clients.find((c) => c.id === p?.clientId)?.name ?? "",
          p?.name ?? "",
          s.tasks.find((t) => t.id === e.taskId)?.name ?? "",
          e.description,
          e.tagIds.map((id) => s.tags.find((t) => t.id === id)?.name).filter(Boolean).join(", "),
          format(parseISO(e.start), "HH:mm"),
          format(parseISO(e.end!), "HH:mm"),
          Number(entryHours(e).toFixed(2)),
        ];
      }),
      foot: ["Total", "", "", "", "", "", "", "", "", Number(total.toFixed(2))],
    };
  };

  const doExport = async (kind: "csv" | "xlsx" | "pdf") => {
    const { head, body, foot } = tableData();
    const { exportCSV, exportPDF, exportXLSX } = await import("@/lib/export"); // heavy libs load on demand
    if (kind === "csv") exportCSV(fileBase, head, [...body, foot]);
    if (kind === "xlsx") exportXLSX(fileBase, mode === "resumido" ? "Resumo" : "Detalhado", head, [...body, foot]);
    if (kind === "pdf") exportPDF(fileBase, `Relatório ${mode} de horas`, `Idônea Comunicação · ${periodLabel} · Total ${fmtHM(total)}`, head, body, foot);
  };

  const sel = "input h-9 w-auto min-w-[150px]";

  return (
    <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-6 md:py-8">
      <PageHeader title="Relatórios" subtitle={`Horas por cliente, projeto, colaborador e período · ${periodLabel}`}>
        <Segmented value={mode} onChange={setMode} options={[{ value: "resumido", label: "Resumido" }, { value: "detalhado", label: "Detalhado" }]} />
        <Popover
          align="right"
          trigger={<button className="btn-primary"><Download className="h-4 w-4" />Exportar</button>}
        >
          {(close) => (
            <div className="w-48 p-1 text-[13px]">
              <button onClick={() => { doExport("csv"); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-hover"><FileText className="h-4 w-4 text-ink-3" />CSV</button>
              <button onClick={() => { doExport("xlsx"); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-hover"><FileSpreadsheet className="h-4 w-4 text-ok" />Excel (XLSX)</button>
              <button onClick={() => { doExport("pdf"); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-hover"><FileDown className="h-4 w-4 text-danger" />PDF</button>
            </div>
          )}
        </Popover>
      </PageHeader>

      {/* filters — one row above the charts */}
      <div className="card mb-6 flex flex-wrap items-center gap-2 p-3">
        <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)} className={sel}>
          <option value="semana">Esta semana</option>
          <option value="semana-passada">Semana passada</option>
          <option value="mes">Este mês</option>
          <option value="mes-passado">Mês passado</option>
          <option value="custom">Personalizado</option>
        </select>
        {preset === "custom" && (
          <>
            <input type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="input h-9 w-40" />
            <input type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="input h-9 w-40" />
          </>
        )}
        <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(""); }} className={sel}>
          <option value="">Todos os clientes</option>
          {s.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={sel}>
          <option value="">Todos os projetos</option>
          {s.projects.filter((p) => !clientId || p.clientId === clientId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {me.role === "admin" && (
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={sel}>
            <option value="">Toda a equipe</option>
            {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <div className="ml-auto flex items-baseline gap-2 pr-2">
          <span className="text-[12.5px] text-ink-3">Total</span>
          <span className="font-display text-[22px] font-semibold tnum">{fmtHM(total)}</span>
          <span className="text-[12.5px] text-ink-3 tnum">({fmtDec(total)} h)</span>
        </div>
      </div>

      {mode === "resumido" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="card p-5">
              <h2 className="mb-5 text-[16px] font-semibold">Horas por dia</h2>
              <BarChart data={daily} height={220} />
            </div>
            <div className="card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[16px] font-semibold">Distribuição</h2>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="input h-8 w-auto">
                  <option value="projeto">por projeto</option>
                  <option value="cliente">por cliente</option>
                  <option value="colaborador">por colaborador</option>
                  <option value="tarefa">por tarefa</option>
                </select>
              </div>
              <HBarList rows={groups.slice(0, 8)} />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="text-[16px] font-semibold">Estimado × realizado por tarefa</h2>
              <p className="text-[12.5px] text-ink-3">Tarefas com horas no período · realizado considera todo o histórico da tarefa</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead className="text-[12px] text-ink-3">
                  <tr><th className="px-5 py-2.5 text-left font-medium">Tarefa</th><th className="px-3 text-left font-medium">Projeto</th><th className="px-3 text-right font-medium">Estimado</th><th className="px-3 text-right font-medium">Realizado</th><th className="px-5 text-right font-medium">Diferença</th></tr>
                </thead>
                <tbody>
                  {taskTable.map(({ t, worked, project }) => {
                    const diff = worked - t.estimateHours;
                    return (
                      <tr key={t.id} onClick={() => s.openTask(t.id)} className="cursor-pointer border-t border-line hover:bg-hover/60">
                        <td className="px-5 py-2.5"><div>{t.name}</div><div className="text-[12px] text-ink-3 truncate max-w-[360px]">{t.tema}</div></td>
                        <td className="px-3"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: project?.color }} />{project?.name}</span></td>
                        <td className="px-3 text-right tnum">{fmtHM(t.estimateHours)}</td>
                        <td className="px-3 text-right tnum font-medium">{fmtHM(worked)}</td>
                        <td className={cn("px-5 text-right tnum font-medium", t.estimateHours ? (diff > 0 ? "text-warn" : "text-ok") : "text-ink-3")}>
                          {t.estimateHours ? `${diff > 0 ? "+" : "−"}${fmtHM(Math.abs(diff))}` : "sem estimativa"}
                        </td>
                      </tr>
                    );
                  })}
                  {!taskTable.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-3">Nenhuma tarefa com horas no período.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[13px]">
              <thead className="bg-raised/60 text-[12px] text-ink-3">
                <tr>
                  {["Data", "Colaborador", "Projeto", "Tarefa / descrição", "Etiquetas", "Horário", "Horas"].map((h, i) => (
                    <th key={h} className={cn("px-4 py-3 font-medium", i === 6 ? "text-right" : "text-left")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const p = s.projects.find((x) => x.id === e.projectId);
                  const t = s.tasks.find((x) => x.id === e.taskId);
                  return (
                    <tr key={e.id} className="border-t border-line">
                      <td className="px-4 py-2.5 tnum whitespace-nowrap">{format(parseISO(e.start), "dd/MM/yyyy")}</td>
                      <td className="px-4">{s.users.find((u) => u.id === e.userId)?.name}</td>
                      <td className="px-4"><span className="flex items-center gap-2 whitespace-nowrap"><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: p?.color ?? "#8A94A6" }} />{p?.name ?? "—"}</span></td>
                      <td className="px-4"><div>{e.description}</div>{t && t.name !== e.description && <div className="text-[12px] text-ink-3">{t.name}</div>}</td>
                      <td className="px-4 text-ink-2">{e.tagIds.map((id) => s.tags.find((x) => x.id === id)?.name).filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 tnum whitespace-nowrap text-ink-2">{format(parseISO(e.start), "HH:mm")} – {format(parseISO(e.end!), "HH:mm")}</td>
                      <td className="px-4 text-right tnum font-medium">{fmtDec(entryHours(e))}</td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-3">Nenhum registro no período.</td></tr>}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-raised/60 font-semibold"><td className="px-4 py-3" colSpan={6}>Total ({rows.length} registros)</td><td className="px-4 text-right tnum">{fmtDec(total)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
