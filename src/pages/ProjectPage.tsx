import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { CalendarDays, Columns3, Flame, List, Plus, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { cn, entryHours } from "@/lib/utils";
import { Avatar, AvatarStack, Popover, Segmented } from "@/components/ui";
import { ListView } from "./project/ListView";
import { BoardView } from "./project/BoardView";
import { CalendarView } from "./project/CalendarView";

type View = "lista" | "quadro" | "calendario";

export interface Filters {
  assignee: string | null;
  statuses: string[];
  urgentOnly: boolean;
}

/** hours actually tracked per task (all users) */
export function useWorkedByTask() {
  const entries = useStore((s) => s.entries);
  return useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => e.taskId && m.set(e.taskId, (m.get(e.taskId) ?? 0) + entryHours(e)));
    return m;
  }, [entries]);
}

export function applyFilters(tasks: Task[], f: Filters) {
  return tasks.filter(
    (t) => (!f.assignee || t.assigneeId === f.assignee) && (!f.statuses.length || f.statuses.includes(t.statusId)) && (!f.urgentOnly || t.urgent),
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const client = useStore((s) => s.clients.find((c) => c.id === project?.clientId));
  const users = useStore((s) => s.users);
  const statuses = useStore((s) => s.statuses);
  const allTasks = useStore((s) => s.tasks);
  const [view, setView] = useState<View>(() => (localStorage.getItem("idonea-view") as View) || "lista");
  const [filters, setFilters] = useState<Filters>({ assignee: null, statuses: [], urgentOnly: false });

  if (!project) return <Navigate to="/projetos" replace />;
  const tasks = allTasks.filter((t) => t.projectId === project.id);
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const urgentCount = tasks.filter((t) => t.urgent).length;
  const activeFilters = (filters.assignee ? 1 : 0) + filters.statuses.length + (filters.urgentOnly ? 1 : 0);
  const pickView = (v: View) => { setView(v); try { localStorage.setItem("idonea-view", v); } catch { /* ignore */ } };

  return (
    <div className="flex min-h-full flex-col">
      {/* project header */}
      <div className="border-b border-line px-4 md:px-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white font-display font-bold text-[18px] shadow-pop" style={{ background: project.color }}>
              {project.name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-ink-3">{client?.name}</div>
              <h1 className="truncate text-[22px] font-semibold leading-tight">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AvatarStack users={members} size={30} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pb-3">
          <Segmented
            value={view}
            onChange={pickView}
            options={[
              { value: "lista", label: "Lista", icon: <List className="h-4 w-4" /> },
              { value: "quadro", label: "Quadro", icon: <Columns3 className="h-4 w-4" /> },
              { value: "calendario", label: "Calendário", icon: <CalendarDays className="h-4 w-4" /> },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, urgentOnly: !f.urgentOnly }))}
              className={cn("btn h-9 border", filters.urgentOnly ? "border-danger bg-danger/15 text-danger" : "border-line text-ink-2 hover:bg-hover")}
            >
              <Flame className="h-4 w-4" />Urgentes{urgentCount > 0 && <span className="tnum">({urgentCount})</span>}
            </button>
            <Popover
              align="right"
              trigger={
                <button className={cn("btn h-9 border", activeFilters ? "border-brand bg-brand/10 text-brand" : "border-line text-ink-2 hover:bg-hover")}>
                  <SlidersHorizontal className="h-4 w-4" />Filtros{activeFilters > 0 && `: ${activeFilters}`}
                </button>
              }
            >
              {() => (
                <div className="w-72 p-3 space-y-3">
                  <div>
                    <div className="label mb-1.5">Responsável</div>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((u) => (
                        <button key={u.id} onClick={() => setFilters((f) => ({ ...f, assignee: f.assignee === u.id ? null : u.id }))} className={cn("flex items-center gap-1.5 rounded-full border pl-0.5 pr-2.5 h-7 text-[12px]", filters.assignee === u.id ? "border-brand bg-brand/10" : "border-line")}>
                          <Avatar user={u} size={22} />{u.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="label mb-1.5">Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...statuses].sort((a, b) => a.order - b.order).map((s) => {
                        const on = filters.statuses.includes(s.id);
                        return (
                          <button key={s.id} onClick={() => setFilters((f) => ({ ...f, statuses: on ? f.statuses.filter((x) => x !== s.id) : [...f.statuses, s.id] }))} className={cn("chip border", on ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-2")}>
                            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <button onClick={() => setFilters({ assignee: null, statuses: [], urgentOnly: false })} className="btn-ghost h-8 w-full"><X className="h-3.5 w-3.5" />Limpar filtros</button>
                  )}
                </div>
              )}
            </Popover>
            <button
              className="btn-primary"
              onClick={() => {
                const st = useStore.getState();
                const first = st.sections.filter((x) => x.projectId === project.id).sort((a, b) => a.order - b.order)[0];
                if (first) st.openTask(st.addTask({ projectId: project.id, sectionId: first.id, name: "Nova tarefa" }));
              }}
            >
              <Plus className="h-4 w-4" />Adicionar tarefa
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {view === "lista" && <ListView projectId={project.id} filters={filters} />}
        {view === "quadro" && <BoardView projectId={project.id} filters={filters} />}
        {view === "calendario" && <CalendarView tasks={applyFilters(tasks, filters)} />}
      </div>
    </div>
  );
}
