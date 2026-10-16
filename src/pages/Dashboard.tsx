import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CalendarCheck2, Clock3, Flame, Sparkles, TrendingUp, Gauge } from "lucide-react";
import { addDays, format, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMe, useStore } from "@/store/useStore";
import { cn, entryHours, fmtHM, isOverdue } from "@/lib/utils";
import { Avatar, AvatarStack, StatusPill, UrgentTag, useNow } from "@/components/ui";
import { TimerBar } from "@/components/TimerBar";
import { BarChart } from "@/components/Charts";
import { DoneToggle, WorkDate } from "@/components/TaskBits";
import { useWorkedByTask } from "./ProjectPage";

const WEEK_CAPACITY = 40;

function Stat({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: "danger" | "brand" | "warn" }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tone === "danger" ? "bg-danger/15 text-danger" : tone === "warn" ? "bg-warn/15 text-warn" : "bg-brand/15 text-brand")}>{icon}</span>
        <span className="text-[13px] text-ink-2">{label}</span>
      </div>
      <div className="mt-3 font-display text-[28px] font-semibold tnum leading-none">{value}</div>
      {hint && <div className="mt-1.5 text-[12px] text-ink-3">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const me = useMe();
  const s = useStore();
  const now = useNow(30000);
  const worked = useWorkedByTask();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const doneIds = new Set(s.statuses.filter((x) => x.done).map((x) => x.id));

  const myEntries = s.entries.filter((e) => e.userId === me.id);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const perDay = days.map((d) => myEntries.filter((e) => isSameDay(parseISO(e.start), d)).reduce((a, e) => a + entryHours(e, now), 0));
  const weekHours = perDay.reduce((a, b) => a + b, 0);
  const todayHours = perDay[days.findIndex((d) => isToday(d))] ?? 0;

  const myOpen = s.tasks.filter((t) => t.assigneeId === me.id && !doneIds.has(t.statusId));
  const todayTasks = myOpen.filter((t) => t.workDate && (isToday(parseISO(t.workDate)) || isOverdue(t.workDate))).sort((a, b) => Number(b.urgent) - Number(a.urgent));
  const scope = me.role === "admin" ? s.tasks : s.tasks.filter((t) => t.assigneeId === me.id);
  const overdue = scope.filter((t) => !doneIds.has(t.statusId) && (isOverdue(t.dueDate) || (t.workDate && t.dueDate && t.workDate > t.dueDate)));
  const urgent = scope.filter((t) => t.urgent && !doneIds.has(t.statusId));

  // Rule-based risk radar (the AI layer will replace these heuristics with summaries & predictions).
  const risks = useMemo(() => {
    const r: { id: string; text: string; taskId: string; kind: "prazo" | "estimativa" | "dependencia" }[] = [];
    scope.forEach((t) => {
      if (doneIds.has(t.statusId)) return;
      if (t.workDate && t.dueDate && t.workDate > t.dueDate) r.push({ id: t.id + "p", taskId: t.id, kind: "prazo", text: `${t.name} está agendada para depois do prazo máximo.` });
      const w = worked.get(t.id) ?? 0;
      if (t.estimateHours && w > t.estimateHours) r.push({ id: t.id + "e", taskId: t.id, kind: "estimativa", text: `${t.name} já usou ${fmtHM(w)} de ${fmtHM(t.estimateHours)} estimadas.` });
      const blocked = t.dependsOn.some((d) => { const dt = s.tasks.find((x) => x.id === d); return dt && !doneIds.has(dt.statusId); });
      if (blocked && t.workDate && isOverdue(format(addDays(parseISO(t.workDate), -2), "yyyy-MM-dd"))) r.push({ id: t.id + "d", taskId: t.id, kind: "dependencia", text: `${t.name} depende de tarefa ainda não concluída.` });
    });
    return r.slice(0, 5);
  }, [scope, worked, s.tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const team = s.users.map((u) => {
    const h = s.entries.filter((e) => e.userId === u.id && parseISO(e.start) >= weekStart).reduce((a, e) => a + entryHours(e, now), 0);
    const open = s.tasks.filter((t) => t.assigneeId === u.id && !doneIds.has(t.statusId));
    return { u, h, open: open.length, est: open.reduce((a, t) => a + t.estimateHours, 0) };
  });

  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-3 first-letter:uppercase">{format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="text-[26px] font-semibold">{greeting}, {me.name.split(" ")[0]}</h1>
        </div>
      </div>

      <TimerBar />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Clock3 className="h-[18px] w-[18px]" />} label="Horas esta semana" value={fmtHM(weekHours)} hint={`Hoje: ${fmtHM(todayHours)}`} />
        <Stat icon={<CalendarCheck2 className="h-[18px] w-[18px]" />} label="Minhas tarefas hoje" value={String(todayTasks.length)} hint={`${myOpen.length} abertas no total`} />
        <Stat icon={<AlertTriangle className="h-[18px] w-[18px]" />} label="Atrasadas / em risco" value={String(overdue.length)} hint={me.role === "admin" ? "Toda a equipe" : "Atribuídas a você"} tone="warn" />
        <Stat icon={<Flame className="h-[18px] w-[18px]" />} label="Urgentes" value={String(urgent.length)} hint="Etiqueta de prioridade" tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-semibold">Suas horas na semana</h2>
              <p className="text-[12.5px] text-ink-3">Total {fmtHM(weekHours)} · meta diária 8h</p>
            </div>
            <Link to="/horas" className="btn-ghost h-8 text-[12.5px]">Ver registros<ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <BarChart
            target={8}
            data={days.map((d, i) => ({
              label: format(d, "EEE", { locale: ptBR }).replace(".", ""),
              sub: format(d, "EEEE, d MMM", { locale: ptBR }),
              value: perDay[i]!,
              highlight: isToday(d),
            }))}
          />
        </div>

        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold">Para hoje</h2>
            <Link to="/minhas-tarefas" className="text-[12.5px] text-brand hover:underline">Minhas tarefas</Link>
          </div>
          <div className="-mx-2 flex-1 space-y-0.5">
            {todayTasks.slice(0, 6).map((t) => {
              const p = s.projects.find((x) => x.id === t.projectId);
              return (
                <button key={t.id} onClick={() => s.openTask(t.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-hover">
                  <DoneToggle task={t} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="truncate text-[13.5px]">{t.name}</span>{t.urgent && <UrgentTag small />}</span>
                    <span className="flex items-center gap-1.5 text-[12px] text-ink-3"><span className="h-2 w-2 rounded-[3px]" style={{ background: p?.color }} />{p?.name} · <WorkDate task={t} /></span>
                  </span>
                  <StatusPill status={s.statuses.find((x) => x.id === t.statusId)} />
                </button>
              );
            })}
            {!todayTasks.length && <p className="px-2 py-6 text-center text-[13px] text-ink-3">Nada pendente para hoje. 🎉</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold">Projetos</h2>
            <Link to="/projetos" className="text-[12.5px] text-brand hover:underline">Ver todos</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.projects.filter((p) => !p.archived && (me.role === "admin" || p.memberIds.includes(me.id))).map((p) => {
              const pt = s.tasks.filter((t) => t.projectId === p.id);
              const done = pt.filter((t) => doneIds.has(t.statusId)).length;
              const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
              const hours = pt.reduce((a, t) => a + (worked.get(t.id) ?? 0), 0);
              return (
                <Link key={p.id} to={`/projetos/${p.id}`} className="group rounded-xl border border-line bg-raised/50 p-4 hover:border-brand/50 hover:bg-raised transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg text-[13px] font-bold text-white" style={{ background: p.color }}>{p.name[0]}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
                      <div className="truncate text-[11.5px] text-ink-3">{s.clients.find((c) => c.id === p.clientId)?.name}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-[12px] text-ink-3 tnum"><span>{done}/{pt.length} concluídas</span><span className="font-medium text-ink">{pct}%</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-line/70"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-3.5 flex items-center justify-between">
                    <AvatarStack users={s.users.filter((u) => p.memberIds.includes(u.id))} size={24} max={3} />
                    <span className="inline-flex items-center gap-1 text-[12px] text-ink-3 tnum"><Clock3 className="h-3.5 w-3.5" />{fmtHM(hours)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/15 blur-3xl" />
          <div className="flex items-center gap-2.5 mb-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan to-brand-strong text-white"><Sparkles className="h-4 w-4" /></span>
            <h2 className="text-[16px] font-semibold">Radar de riscos</h2>
            <span className="chip ml-auto bg-brand/15 text-brand text-[11px]">IA · beta</span>
          </div>
          <p className="mb-4 text-[12.5px] text-ink-3">Tarefas que podem atrasar, com base em prazo, estimativa e dependências.</p>
          <div className="space-y-2">
            {risks.map((r) => (
              <button key={r.id} onClick={() => s.openTask(r.taskId)} className="flex w-full items-start gap-3 rounded-xl border border-line bg-raised/50 p-3 text-left hover:border-brand/40">
                <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md", r.kind === "prazo" ? "bg-danger/15 text-danger" : r.kind === "estimativa" ? "bg-warn/15 text-warn" : "bg-brand/15 text-brand")}>
                  {r.kind === "prazo" ? <AlertTriangle className="h-3.5 w-3.5" /> : r.kind === "estimativa" ? <TrendingUp className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
                </span>
                <span className="text-[13px] leading-snug">{r.text}</span>
              </button>
            ))}
            {!risks.length && <p className="py-6 text-center text-[13px] text-ink-3">Nenhum risco identificado agora.</p>}
          </div>
        </div>
      </div>

      {me.role === "admin" && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-semibold">Capacidade da equipe</h2>
              <p className="text-[12.5px] text-ink-3">Horas registradas na semana × capacidade de {WEEK_CAPACITY}h</p>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {team.map(({ u, h, open, est }) => {
              const pct = Math.min(100, (h / WEEK_CAPACITY) * 100);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar user={u} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium">{u.name}</span>
                      <span className="text-[12.5px] tnum"><b>{fmtHM(h)}</b><span className="text-ink-3"> / {WEEK_CAPACITY}h</span></span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-line/70"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 text-[11.5px] text-ink-3 tnum">{open} tarefas abertas · {fmtHM(est)} estimadas</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
