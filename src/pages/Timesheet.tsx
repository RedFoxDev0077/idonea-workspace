import { useState } from "react";
import { Lock, MoreVertical, Play, Plus, Trash2, History, CalendarRange, List as ListIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addWeeks, format, isSameDay, isToday, isYesterday, parseISO, set as setTime, startOfDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMe, useStore } from "@/store/useStore";
import type { TimeEntry } from "@/lib/types";
import { canEditEntry, chipStyle, cn, entryHours, fmtClock, fmtHM, entrySeconds } from "@/lib/utils";
import { Avatar, Modal, PageHeader, Popover, Segmented, useNow } from "@/components/ui";
import { ProjectPicker, TagPicker, TaskLinkPicker, TimerBar } from "@/components/TimerBar";

const hhmm = (iso: string) => format(parseISO(iso), "HH:mm");
const withTime = (iso: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return setTime(parseISO(iso), { hours: h, minutes: m, seconds: 0 }).toISOString();
};

/** 24h "HH:mm" field — native time inputs follow the OS locale and may show AM/PM. Accepts "930", "9:30", "09h30". */
function TimeField({ value, onCommit, className }: { value: string; onCommit: (v: string) => void; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const digits = draft.replace(/\D/g, "");
    const d = (digits.length <= 2 ? digits.padStart(2, "0") + "00" : digits.slice(-4)).padStart(4, "0");
    const h = Number(d.slice(0, 2)), m = Number(d.slice(2));
    const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (h < 24 && m < 60 && v !== value) onCommit(v);
    setDraft(null);
  };
  return (
    <input
      value={draft ?? value}
      onFocus={(e) => { setDraft(value); requestAnimationFrame(() => e.target.select()); }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      inputMode="numeric"
      className={cn("w-[52px] rounded-md bg-transparent px-1 py-1 text-center tnum outline-none hover:bg-hover focus:bg-raised focus:ring-1 focus:ring-brand", className)}
    />
  );
}

function EntryRow({ e }: { e: TimeEntry }) {
  const s = useStore();
  const me = useMe();
  const now = useNow();
  const editable = canEditEntry(e, me);
  const running = !e.end;
  const owner = s.users.find((u) => u.id === e.userId);
  const up = (patch: Partial<TimeEntry>) => s.updateEntry(e.id, patch);

  return (
    <div className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {e.userId !== me.id && <Avatar user={owner} size={24} />}
        {editable ? (
          <input defaultValue={e.description} onBlur={(ev) => ev.target.value !== e.description && up({ description: ev.target.value })} className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1 py-1 text-[13.5px] outline-none hover:bg-hover focus:bg-raised focus:ring-1 focus:ring-brand" />
        ) : (
          <span className="min-w-0 flex-1 truncate px-1 text-[13.5px]">{e.description}</span>
        )}
        {e.edits.length > 0 && (
          <Popover trigger={<button className="chip h-5 px-1.5 text-[10.5px] bg-warn/15 text-warn" title="Registro alterado"><History className="h-3 w-3" />editado</button>}>
            {() => (
              <div className="w-72 p-3 space-y-2 text-[12.5px]">
                <div className="label">Histórico de alterações</div>
                {e.edits.map((x, i) => (
                  <div key={i} className="rounded-lg bg-surface p-2">
                    <b>{s.users.find((u) => u.id === x.byId)?.name}</b> alterou <i>{x.field}</i>
                    <div className="text-ink-3">{format(parseISO(x.at), "dd/MM HH:mm")}</div>
                    <div className="mt-1 tnum"><span className="text-danger line-through">{x.field === "start" || x.field === "end" ? hhmm(x.before) : x.before}</span> → <span className="text-ok">{x.field === "start" || x.field === "end" ? hhmm(x.after) : x.after}</span></div>
                  </div>
                ))}
              </div>
            )}
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-1 justify-self-end md:justify-self-auto">
        {editable ? (
          <>
            <TaskLinkPicker projectId={e.projectId} value={e.taskId} onChange={(id, pid) => up({ taskId: id, ...(pid ? { projectId: pid } : {}) })} />
            <ProjectPicker value={e.projectId} onChange={(id) => up({ projectId: id, taskId: null })} />
            <TagPicker value={e.tagIds} onChange={(ids) => up({ tagIds: ids })} />
          </>
        ) : (
          <span className="flex items-center gap-2 text-[13px] text-ink-2">
            {(() => { const p = s.projects.find((x) => x.id === e.projectId); return p ? <><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: p.color }} />{p.name}</> : <span className="text-ink-3">Sem projeto</span>; })()}
          </span>
        )}
      </div>
      <div className="hidden md:flex flex-wrap gap-1">
        {e.tagIds.map((id) => { const t = s.tags.find((x) => x.id === id); return t ? <span key={id} className="chip h-5 text-[11px]" style={chipStyle(t.color)}>{t.name}</span> : null; })}
      </div>

      <div className="flex items-center gap-1 text-[13px] tnum text-ink-2">
        {editable && !running ? (
          <>
            <TimeField value={hhmm(e.start)} onCommit={(v) => up({ start: withTime(e.start, v) })} />
            <span>–</span>
            <TimeField value={hhmm(e.end!)} onCommit={(v) => up({ end: withTime(e.end!, v) })} />
          </>
        ) : (
          <span className="px-1">{hhmm(e.start)} – {running ? "agora" : hhmm(e.end!)}</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        <span className={cn("w-[76px] text-right font-display font-semibold tnum text-[14px]", running && "text-danger")}>{fmtClock(entrySeconds(e, now))}</span>
        {!editable && <span className="grid h-8 w-8 place-items-center text-ink-3" title="Somente administradores alteram registros de dias anteriores"><Lock className="h-3.5 w-3.5" /></span>}
        {editable && (
          <Popover align="right" trigger={<button className="icon-btn" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></button>}>
            {(close) => (
              <div className="w-48 p-1 text-[13px]">
                {e.userId === me.id && !running && (
                  <button onClick={() => { s.startTimer({ description: e.description, projectId: e.projectId, taskId: e.taskId, tagIds: e.tagIds }); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-hover"><Play className="h-3.5 w-3.5" />Continuar</button>
                )}
                <button onClick={() => { if (confirm("Excluir este registro?")) s.deleteEntry(e.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
              </div>
            )}
          </Popover>
        )}
      </div>
    </div>
  );
}

function ManualEntryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe();
  const addEntry = useStore((s) => s.addEntry);
  const [desc, setDesc] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("10:00");
  const isAdmin = me.role === "admin";
  const valid = from < to && (isAdmin || date === format(new Date(), "yyyy-MM-dd"));

  const save = () => {
    const base = startOfDay(parseISO(date)).toISOString();
    addEntry({ description: desc.trim() || "Sem descrição", projectId, taskId, tagIds, start: withTime(base, from), end: withTime(base, to) });
    onClose();
    setDesc("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar horas manualmente">
      <div className="space-y-4">
        <input autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição (ex.: Atendimento ao cliente)" className="input" />
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-raised px-1">
          <TaskLinkPicker projectId={projectId} value={taskId} onChange={(id, pid) => { setTaskId(id); if (pid) setProjectId(pid); }} />
          <ProjectPicker value={projectId} onChange={setProjectId} />
          <TagPicker value={tagIds} onChange={setTagIds} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1.5"><span className="label">Data</span>
            <input type="date" value={date} max={format(new Date(), "yyyy-MM-dd")} min={isAdmin ? undefined : format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>
          <label className="space-y-1.5"><span className="label">Início</span><TimeField value={from} onCommit={setFrom} className="input w-full text-left" /></label>
          <label className="space-y-1.5"><span className="label">Fim</span><TimeField value={to} onCommit={setTo} className="input w-full text-left" /></label>
        </div>
        {!isAdmin && <p className="flex items-center gap-2 text-[12.5px] text-ink-3"><Lock className="h-3.5 w-3.5" />Membros lançam e editam horas apenas no dia atual.</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={!valid}>Salvar registro</button>
        </div>
      </div>
    </Modal>
  );
}

function WeekGrid({ entries }: { entries: TimeEntry[] }) {
  const projects = useStore((s) => s.projects);
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const inWeek = entries.filter((e) => { const d = parseISO(e.start); return d >= week && d < addDays(week, 7); });
  const rows = [...new Set(inWeek.map((e) => e.projectId ?? "none"))].map((pid) => ({
    p: projects.find((x) => x.id === pid),
    cells: days.map((d) => inWeek.filter((e) => (e.projectId ?? "none") === pid && isSameDay(parseISO(e.start), d)).reduce((a, e) => a + entryHours(e), 0)),
  }));
  const colTotals = days.map((_, i) => rows.reduce((a, r) => a + r.cells[i]!, 0));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <button className="icon-btn" onClick={() => setWeek((w) => addWeeks(w, -1))} aria-label="Semana anterior"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[13.5px] font-medium">{format(week, "d MMM", { locale: ptBR })} – {format(addDays(week, 6), "d MMM yyyy", { locale: ptBR })}</span>
        <button className="icon-btn" onClick={() => setWeek((w) => addWeeks(w, 1))} aria-label="Próxima semana"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="text-ink-3 text-[12px]">
              <th className="px-4 py-2.5 text-left font-medium">Projeto</th>
              {days.map((d) => <th key={d.toISOString()} className={cn("px-2 py-2.5 text-right font-medium first-letter:uppercase", isToday(d) && "text-brand")}>{format(d, "EEE d", { locale: ptBR }).replace(".", "")}</th>)}
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-4 py-2.5"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: r.p?.color ?? "#8A94A6" }} />{r.p?.name ?? "Sem projeto"}</span></td>
                {r.cells.map((c, j) => <td key={j} className={cn("px-2 py-2.5 text-right tnum", !c && "text-ink-3/50")}>{c ? fmtHM(c) : "—"}</td>)}
                <td className="px-4 py-2.5 text-right font-semibold tnum">{fmtHM(r.cells.reduce((a, b) => a + b, 0))}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-3">Sem registros nesta semana.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-raised/60 font-semibold">
              <td className="px-4 py-2.5">Total</td>
              {colTotals.map((c, j) => <td key={j} className="px-2 py-2.5 text-right tnum">{c ? fmtHM(c) : "—"}</td>)}
              <td className="px-4 py-2.5 text-right tnum text-brand">{fmtHM(colTotals.reduce((a, b) => a + b, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function Timesheet() {
  const me = useMe();
  const s = useStore();
  const now = useNow(30000);
  const [view, setView] = useState<"lista" | "semana">("lista");
  const [userFilter, setUserFilter] = useState<string>(me.id);
  const [manual, setManual] = useState(false);

  const entries = s.entries
    .filter((e) => (me.role === "admin" ? userFilter === "all" || e.userId === userFilter : e.userId === me.id))
    .sort((a, b) => b.start.localeCompare(a.start));
  const byDay = new Map<string, TimeEntry[]>();
  entries.forEach((e) => { const k = format(parseISO(e.start), "yyyy-MM-dd"); byDay.set(k, [...(byDay.get(k) ?? []), e]); });
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekTotal = entries.filter((e) => parseISO(e.start) >= weekStart).reduce((a, e) => a + entryHours(e, now), 0);

  const dayTitle = (k: string) => {
    const d = parseISO(k);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "EEE, d 'de' MMM", { locale: ptBR });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-6 md:py-8">
      <PageHeader title="Controle de horas" subtitle="Cronômetro, lançamentos rápidos e registros da equipe">
        {me.role === "admin" && (
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="input h-9 w-48">
            <option value="all">Toda a equipe</option>
            {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <Segmented value={view} onChange={setView} options={[{ value: "lista", label: "Registros", icon: <ListIcon className="h-4 w-4" /> }, { value: "semana", label: "Semana", icon: <CalendarRange className="h-4 w-4" /> }]} />
        <button className="btn-outline" onClick={() => setManual(true)}><Plus className="h-4 w-4" />Lançar manualmente</button>
      </PageHeader>

      <TimerBar />

      <div className="mt-6 mb-3 flex items-center justify-between">
        <span className="text-[13px] text-ink-2">Esta semana</span>
        <span className="text-[13px] text-ink-2">Total da semana: <b className="font-display text-[18px] text-ink tnum">{fmtClock(weekTotal * 3600)}</b></span>
      </div>

      {view === "semana" ? (
        <WeekGrid entries={entries} />
      ) : (
        <div className="space-y-4">
          {[...byDay.entries()].map(([k, list]) => (
            <div key={k} className="card overflow-hidden">
              <div className="flex items-center justify-between bg-raised/60 px-4 py-2.5">
                <span className="text-[13px] font-semibold first-letter:uppercase">{dayTitle(k)}</span>
                <span className="text-[12.5px] text-ink-3">Total: <b className="text-ink tnum">{fmtClock(list.reduce((a, e) => a + entrySeconds(e, now), 0))}</b></span>
              </div>
              {list.map((e) => <EntryRow key={e.id} e={e} />)}
            </div>
          ))}
          {!entries.length && <div className="card p-10 text-center text-ink-3">Nenhum registro ainda. Inicie o cronômetro acima.</div>}
        </div>
      )}
      <ManualEntryModal open={manual} onClose={() => setManual(false)} />
    </div>
  );
}
