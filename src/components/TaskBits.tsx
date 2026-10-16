import { Check, MessageSquare, ListChecks, Link2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { cn, dayLabel, isOverdue } from "@/lib/utils";
import { Avatar, Popover } from "./ui";

export function DoneToggle({ task, size = 18 }: { task: Task; size?: number }) {
  const statuses = useStore((s) => s.statuses);
  const updateTask = useStore((s) => s.updateTask);
  const done = statuses.find((x) => x.id === task.statusId)?.done;
  const doneId = statuses.find((x) => x.done)?.id;
  const firstId = [...statuses].sort((a, b) => a.order - b.order)[0]?.id;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { statusId: (done ? firstId : doneId) ?? task.statusId }); }}
      className={cn("grid shrink-0 place-items-center rounded-full border transition-colors", done ? "bg-ok border-ok text-white" : "border-ink-3 text-transparent hover:border-ok hover:text-ok")}
      style={{ width: size, height: size }}
      aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  );
}

export function useTaskDone(task: Task) {
  return useStore((s) => s.statuses.find((x) => x.id === task.statusId)?.done ?? false);
}

/** Work date, Asana-style: green "Hoje", red when overdue and not finished. */
export function WorkDate({ task }: { task: Task }) {
  const done = useTaskDone(task);
  const label = dayLabel(task.workDate);
  if (!label) return <span className="text-ink-3">—</span>;
  return (
    <span className={cn("text-[13px]", !done && label === "Hoje" && "text-ok font-medium", !done && isOverdue(task.workDate) && "text-danger")}>{label}</span>
  );
}

export function AssigneePicker({ task, withName = true }: { task: Task; withName?: boolean }) {
  const users = useStore((s) => s.users);
  const project = useStore((s) => s.projects.find((p) => p.id === task.projectId));
  const updateTask = useStore((s) => s.updateTask);
  const u = users.find((x) => x.id === task.assigneeId);
  return (
    <Popover
      trigger={
        <button className="flex min-w-0 items-center gap-2 rounded-md px-1 h-7 hover:bg-hover">
          <Avatar user={u} size={22} />
          {withName && <span className="truncate text-[13px]">{u?.name ?? ""}</span>}
        </button>
      }
    >
      {(close) => (
        <div className="w-56 p-1">
          {users.filter((x) => project?.memberIds.includes(x.id)).map((x) => (
            <button key={x.id} onClick={() => { updateTask(task.id, { assigneeId: x.id }); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-hover">
              <Avatar user={x} size={22} />{x.name}
              {x.id === task.assigneeId && <Check className="ml-auto h-3.5 w-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

export function TaskMeta({ task }: { task: Task }) {
  const comments = useStore((s) => s.comments.filter((c) => c.taskId === task.id).length);
  const subDone = task.subtasks.filter((x) => x.done).length;
  return (
    <span className="inline-flex items-center gap-2.5 text-[12px] text-ink-3">
      {task.subtasks.length > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{subDone}/{task.subtasks.length}</span>}
      {comments > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{comments}</span>}
      {task.dependsOn.length > 0 && <span className="inline-flex items-center gap-1" title="Possui dependências"><Link2 className="h-3.5 w-3.5" />{task.dependsOn.length}</span>}
    </span>
  );
}
