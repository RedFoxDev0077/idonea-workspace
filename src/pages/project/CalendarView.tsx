import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Month calendar by "data de trabalho". Drag a task onto a day to reschedule it. */
export function CalendarView({ tasks, showProject }: { tasks: Task[]; showProject?: boolean }) {
  const statuses = useStore((s) => s.statuses);
  const projects = useStore((s) => s.projects);
  const updateTask = useStore((s) => s.updateTask);
  const openTask = useStore((s) => s.openTask);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [over, setOver] = useState<string | null>(null);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }) });
  const unscheduled = tasks.filter((t) => !t.workDate);
  const title = format(month, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="px-4 md:px-8 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[18px] font-semibold capitalize w-48">{title}</h2>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button className="btn-outline h-8" onClick={() => setMonth(startOfMonth(new Date()))}>Hoje</button>
          <button className="icon-btn" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {unscheduled.length > 0 && <span className="ml-auto text-[12.5px] text-ink-3">{unscheduled.length} tarefa(s) sem data</span>}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-7 border-b border-line bg-raised">
            {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((d) => (
              <div key={d} className="px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wider text-ink-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const list = tasks.filter((t) => t.workDate === key);
              return (
                <div
                  key={key}
                  onDragOver={(e) => { e.preventDefault(); setOver(key); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/task"); if (id) updateTask(id, { workDate: key }); setOver(null); }}
                  className={cn(
                    "min-h-[118px] border-b border-r border-line/70 p-1.5 [&:nth-child(7n)]:border-r-0 transition-colors",
                    !isSameMonth(d, month) && "bg-bg/60",
                    over === key && "bg-brand/10",
                  )}
                >
                  <div className={cn("mb-1 ml-1 inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12px] tnum", isToday(d) ? "bg-brand-strong text-white font-semibold" : isSameMonth(d, month) ? "text-ink-2" : "text-ink-3/60")}>
                    {format(d, "d")}
                  </div>
                  <div className="space-y-1">
                    {list.slice(0, 4).map((t) => {
                      const st = statuses.find((x) => x.id === t.statusId);
                      const p = projects.find((x) => x.id === t.projectId);
                      return (
                        <button
                          key={t.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                          onClick={() => openTask(t.id)}
                          className={cn("flex w-full items-center gap-1.5 rounded-md border-l-[3px] bg-surface px-1.5 py-1 text-left text-[12px] hover:bg-hover shadow-sm", st?.done && "opacity-60 line-through")}
                          style={{ borderLeftColor: st?.color }}
                          title={`${t.name} · ${st?.name}${showProject && p ? ` · ${p.name}` : ""}`}
                        >
                          {t.urgent && <Flame className="h-3 w-3 shrink-0 text-danger" />}
                          <span className="truncate">{t.name}</span>
                        </button>
                      );
                    })}
                    {list.length > 4 && <div className="px-1.5 text-[11.5px] text-ink-3">+{list.length - 4} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
