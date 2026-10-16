import { useState } from "react";
import { CalendarDays, Plus, AlertTriangle } from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { cn, dayLabel, fmtHM } from "@/lib/utils";
import { Segmented, UrgentTag } from "@/components/ui";
import { AssigneePicker, TaskMeta, WorkDate, useTaskDone } from "@/components/TaskBits";
import { EstimateBar } from "@/components/EstimateBar";
import { applyFilters, useWorkedByTask, type Filters } from "../ProjectPage";

function Card({ task, worked }: { task: Task; worked: number }) {
  const openTask = useStore((s) => s.openTask);
  const done = useTaskDone(task);
  const late = !!task.workDate && !!task.dueDate && task.workDate > task.dueDate;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/task", task.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={() => openTask(task.id)}
      className={cn(
        "group cursor-pointer rounded-xl border bg-surface p-3.5 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-pop hover:border-brand/40 active:cursor-grabbing",
        task.urgent ? "border-danger/40" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-[13.5px] font-medium leading-snug", done && "line-through text-ink-3")}>{task.name}</div>
        {task.urgent && <UrgentTag small />}
      </div>
      {task.tema && <p className="text-[12.5px] text-ink-2 leading-snug line-clamp-2">{task.tema}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="inline-flex items-center gap-1.5 text-ink-3"><CalendarDays className="h-3.5 w-3.5" /><WorkDate task={task} /></span>
        {task.dueDate && (
          <span className={cn("inline-flex items-center gap-1", late ? "text-danger" : "text-ink-3")}>
            {late && <AlertTriangle className="h-3 w-3" />}Prazo {dayLabel(task.dueDate)}
          </span>
        )}
      </div>
      {task.estimateHours > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px] text-ink-3 tnum"><span>{fmtHM(worked)} / {fmtHM(task.estimateHours)}</span></div>
          <EstimateBar estimate={task.estimateHours} worked={worked} compact />
        </div>
      )}
      <div className="flex items-center justify-between border-t border-line/70 pt-2.5" onClick={(e) => e.stopPropagation()}>
        <AssigneePicker task={task} withName={false} />
        <TaskMeta task={task} />
      </div>
    </div>
  );
}

export function BoardView({ projectId, filters }: { projectId: string; filters: Filters }) {
  const s = useStore();
  const me = useMe();
  const worked = useWorkedByTask();
  const [groupBy, setGroupBy] = useState<"status" | "secao">("status");
  const [over, setOver] = useState<string | null>(null);
  const tasks = applyFilters(s.tasks.filter((t) => t.projectId === projectId), filters).sort((a, b) => a.order - b.order);

  const columns =
    groupBy === "status"
      ? [...s.statuses].sort((a, b) => a.order - b.order).map((st) => ({ id: st.id, name: st.name, color: st.color, tasks: tasks.filter((t) => t.statusId === st.id) }))
      : s.sections.filter((x) => x.projectId === projectId).sort((a, b) => a.order - b.order).map((sec) => ({ id: sec.id, name: sec.name, color: "#8A94A6", tasks: tasks.filter((t) => t.sectionId === sec.id) }));

  const drop = (colId: string, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task");
    setOver(null);
    if (!id) return;
    if (groupBy === "status") s.updateTask(id, { statusId: colId });
    else s.moveTask(id, colId, null);
  };

  return (
    <div className="px-4 md:px-8 py-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[12.5px] text-ink-3">Agrupar por</span>
        <Segmented value={groupBy} onChange={setGroupBy} options={[{ value: "status", label: "Status" }, { value: "secao", label: "Seção" }]} />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-6">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
            onDrop={(e) => drop(col.id, e)}
            className={cn("flex w-[292px] shrink-0 flex-col rounded-2xl bg-raised/60 border p-2.5 transition-colors", over === col.id ? "border-brand bg-brand/5" : "border-line/60")}
          >
            <div className="flex items-center gap-2 px-1.5 pb-3 pt-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
              <span className="text-[12px] font-semibold uppercase tracking-[.06em] text-ink-2 truncate">{col.name}</span>
              <span className="ml-auto rounded-md bg-surface px-1.5 text-[11.5px] font-semibold text-ink-3 tnum">{col.tasks.length}</span>
            </div>
            <div className="flex min-h-[80px] flex-col gap-2.5">
              {col.tasks.map((t) => <Card key={t.id} task={t} worked={worked.get(t.id) ?? 0} />)}
              {!col.tasks.length && <div className="grid h-20 place-items-center rounded-xl border border-dashed border-line text-[12px] text-ink-3">Arraste tarefas aqui</div>}
            </div>
            <button
              onClick={() => {
                const firstSection = s.sections.filter((x) => x.projectId === projectId).sort((a, b) => a.order - b.order)[0]!;
                const id = s.addTask({
                  projectId, name: "Nova tarefa", assigneeId: me.id,
                  sectionId: groupBy === "secao" ? col.id : firstSection.id,
                  ...(groupBy === "status" ? { statusId: col.id } : {}),
                });
                s.openTask(id);
              }}
              className="mt-2.5 flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] text-ink-3 hover:bg-hover hover:text-ink"
            >
              <Plus className="h-4 w-4" />Adicionar tarefa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
