import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useMe, useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { cn, dayLabel } from "@/lib/utils";
import { PageHeader, Segmented, StatusSelect, UrgentTag } from "@/components/ui";
import { DoneToggle, TaskMeta, WorkDate, useTaskDone } from "@/components/TaskBits";
import { CalendarView } from "./project/CalendarView";

function Row({ t }: { t: Task }) {
  const s = useStore();
  const done = useTaskDone(t);
  const p = s.projects.find((x) => x.id === t.projectId);
  return (
    <div onClick={() => s.openTask(t.id)} className="group flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 hover:bg-hover/60">
      <DoneToggle task={t} />
      <div className="min-w-0 flex-1 basis-56">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-[13.5px]", done && "line-through text-ink-3")}>{t.name}</span>
          {t.urgent && <UrgentTag small />}
          <TaskMeta task={t} />
        </div>
        <div className="truncate text-[12px] text-ink-3">{t.tema}</div>
      </div>
      <span className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-ink-2 w-44 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: p?.color }} />{p?.name}</span>
      <span className="w-28 text-[13px]"><WorkDate task={t} /></span>
      <span className="hidden md:block w-28 text-[12.5px] text-ink-3">{t.dueDate ? `Prazo ${dayLabel(t.dueDate)}` : ""}</span>
      <div onClick={(e) => e.stopPropagation()}><StatusSelect value={t.statusId} onChange={(v) => s.updateTask(t.id, { statusId: v })} /></div>
    </div>
  );
}

export default function MyTasks() {
  const me = useMe();
  const tasks = useStore((s) => s.tasks);
  const statuses = useStore((s) => s.statuses);
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [showDone, setShowDone] = useState(false);
  const doneIds = new Set(statuses.filter((x) => x.done).map((x) => x.id));
  const mine = tasks.filter((t) => t.assigneeId === me.id && (showDone || !doneIds.has(t.statusId)));

  const bucket = (t: Task) => {
    if (!t.workDate) return "Sem data";
    const d = differenceInCalendarDays(parseISO(t.workDate), new Date());
    if (d < 0) return "Atrasadas";
    if (d === 0) return "Hoje";
    if (d <= 7) return "Próximos 7 dias";
    return "Mais tarde";
  };
  const order = ["Atrasadas", "Hoje", "Próximos 7 dias", "Mais tarde", "Sem data"];
  const groups = order.map((g) => ({ g, list: mine.filter((t) => bucket(t) === g).sort((a, b) => Number(b.urgent) - Number(a.urgent) || (a.workDate ?? "").localeCompare(b.workDate ?? "")) }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-6 md:py-8">
      <PageHeader title="Minhas tarefas" subtitle={`${mine.length} tarefas atribuídas a você`}>
        <label className="flex items-center gap-2 text-[13px] text-ink-2 mr-2">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-[rgb(var(--brand))]" />Mostrar concluídas
        </label>
        <Segmented value={view} onChange={setView} options={[{ value: "lista", label: "Lista", icon: <List className="h-4 w-4" /> }, { value: "calendario", label: "Calendário", icon: <CalendarDays className="h-4 w-4" /> }]} />
      </PageHeader>
      {view === "calendario" ? (
        <div className="-mx-4 md:-mx-8"><CalendarView tasks={mine} showProject /></div>
      ) : (
        <div className="space-y-5">
          {groups.filter((x) => x.list.length).map(({ g, list }) => (
            <div key={g} className="card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <h3 className={cn("text-[14.5px] font-semibold", g === "Atrasadas" && "text-danger")}>{g}</h3>
                <span className="text-[12px] text-ink-3 tnum">{list.length}</span>
              </div>
              {list.map((t) => <Row key={t.id} t={t} />)}
            </div>
          ))}
          {!mine.length && <div className="card p-10 text-center text-ink-3">Nenhuma tarefa atribuída a você.</div>}
        </div>
      )}
    </div>
  );
}
