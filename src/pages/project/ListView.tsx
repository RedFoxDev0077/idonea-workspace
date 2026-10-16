import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, MoreHorizontal, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import type { Section, Task } from "@/lib/types";
import { cn, dayLabel, fmtDec } from "@/lib/utils";
import { Popover, StatusSelect, UrgentTag } from "@/components/ui";
import { AssigneePicker, DoneToggle, TaskMeta, WorkDate, useTaskDone } from "@/components/TaskBits";
import { HoursInput } from "@/components/HoursInput";
import { applyFilters, useWorkedByTask, type Filters } from "../ProjectPage";

// Same column set the team uses today in Asana, plus "Trabalhado" from the native timer.
const COLS = "grid-cols-[minmax(250px,2.2fr)_minmax(160px,1.5fr)_156px_112px_184px_72px_92px_96px]";

function HeaderRow() {
  const th = "px-3 text-[12px] font-medium text-ink-3 truncate";
  return (
    <div className={cn("grid sticky top-0 z-10 h-10 items-center border-b border-line bg-bg", COLS)}>
      <div className={cn(th, "pl-10")}>Nome</div>
      <div className={th}>Tema</div>
      <div className={th}>Responsável</div>
      <div className={th}>Data de trabalho</div>
      <div className={th}>Status</div>
      <div className={cn(th, "text-right")}>Horas</div>
      <div className={cn(th, "text-right")}>Trabalhado</div>
      <div className={th}>Prazo máx.</div>
    </div>
  );
}

function Row({ task, worked, onDragOver, dropBefore }: { task: Task; worked: number; onDragOver: (e: React.DragEvent) => void; dropBefore: boolean }) {
  const updateTask = useStore((s) => s.updateTask);
  const openTask = useStore((s) => s.openTask);
  const done = useTaskDone(task);
  const late = !!task.workDate && !!task.dueDate && task.workDate > task.dueDate;
  const over = task.estimateHours > 0 && worked > task.estimateHours;
  const cell = "px-3 h-full flex items-center border-r border-line/60 min-w-0";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/task", task.id); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={onDragOver}
      onClick={() => openTask(task.id)}
      className={cn("group relative grid h-11 items-center border-b border-line/60 text-[13.5px] hover:bg-hover/60 cursor-pointer", COLS, dropBefore && "before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:bg-brand")}
    >
      <div className={cn(cell, "gap-2 pl-1")}>
        <GripVertical className="h-4 w-4 shrink-0 text-ink-3 opacity-0 group-hover:opacity-100 cursor-grab" />
        <DoneToggle task={task} />
        <span className={cn("truncate", done && "text-ink-3 line-through")}>{task.name}</span>
        {task.urgent && <UrgentTag small />}
        <TaskMeta task={task} />
      </div>
      <div className={cn(cell, "text-ink-2")}><span className="truncate">{task.tema}</span></div>
      <div className={cell} onClick={(e) => e.stopPropagation()}><AssigneePicker task={task} /></div>
      <div className={cell}><WorkDate task={task} /></div>
      <div className={cell} onClick={(e) => e.stopPropagation()}><StatusSelect value={task.statusId} onChange={(v) => updateTask(task.id, { statusId: v })} /></div>
      <div className={cn(cell, "justify-end")} onClick={(e) => e.stopPropagation()}>
<HoursInput value={task.estimateHours} onChange={(v) => updateTask(task.id, { estimateHours: v })} />
      </div>
      <div className={cn(cell, "justify-end tnum", over ? "text-warn font-medium" : worked ? "text-ink" : "text-ink-3")} title={over ? "Acima da estimativa" : undefined}>
        {worked ? fmtDec(worked) : "—"}
      </div>
      <div className={cn(cell, "border-r-0 gap-1.5", late && "text-danger")}>
        {late && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
        {task.dueDate ? dayLabel(task.dueDate) : ""}
      </div>
    </div>
  );
}

function SectionBlock({ section, tasks, worked, isFirst, isLast, filtered }: { section: Section; tasks: Task[]; worked: Map<string, number>; isFirst: boolean; isLast: boolean; filtered: boolean }) {
  const s = useStore();
  const me = useMe();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [adding, setAdding] = useState("");
  const [dragOver, setDragOver] = useState<string | null | undefined>(undefined); // undefined = no drag; null = end

  const totalEst = tasks.reduce((a, t) => a + t.estimateHours, 0);
  const totalWorked = tasks.reduce((a, t) => a + (worked.get(t.id) ?? 0), 0);

  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task");
    if (id) s.moveTask(id, section.id, dragOver ?? null);
    setDragOver(undefined);
  };

  return (
    <div onDragOver={(e) => { e.preventDefault(); }} onDrop={drop} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(undefined); }}>
      <div className="group flex items-center gap-2 pt-7 pb-2 pl-1 sticky left-0">
        <button onClick={() => setOpen(!open)} className="icon-btn h-7 w-7"><ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} /></button>
        {editing ? (
          <input
            autoFocus value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { s.renameSection(section.id, name.trim() || section.name); setEditing(false); }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="input h-8 w-72 font-display font-semibold text-[16px]"
          />
        ) : (
          <h3 onDoubleClick={() => setEditing(true)} className="text-[16px] font-semibold">{section.name}</h3>
        )}
        <span className="text-[12px] text-ink-3 tnum">{tasks.length}</span>
        <Popover trigger={<button className="icon-btn h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"><MoreHorizontal className="h-4 w-4" /></button>}>
          {(close) => (
            <div className="w-48 p-1 text-[13px]">
              <button onClick={() => { setEditing(true); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-hover"><Pencil className="h-3.5 w-3.5" />Renomear seção</button>
              {!isFirst && <button onClick={() => { s.moveSection(section.id, -1); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-hover"><ChevronUp className="h-3.5 w-3.5" />Mover para cima</button>}
              {!isLast && <button onClick={() => { s.moveSection(section.id, 1); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-hover"><ChevronDown className="h-3.5 w-3.5" />Mover para baixo</button>}
              {me.role === "admin" && !(isFirst && isLast) && (
                <button onClick={() => { if (confirm(`Excluir a seção "${section.name}"? As tarefas vão para a primeira seção.`)) s.deleteSection(section.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-3.5 w-3.5" />Excluir seção</button>
              )}
            </div>
          )}
        </Popover>
      </div>

      {open && (
        <>
          {tasks.map((t) => (
            <Row
              key={t.id}
              task={t}
              worked={worked.get(t.id) ?? 0}
              dropBefore={dragOver === t.id}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(t.id); }}
            />
          ))}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(null); }}
            className={cn("grid h-11 items-center border-b border-line/60 text-[13.5px] relative", COLS, dragOver === null && "before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:bg-brand")}
          >
            <div className="flex items-center gap-2 pl-10 pr-3">
              {!filtered && (
                <>
                  <Plus className="h-4 w-4 text-ink-3" />
                  <input
                    value={adding}
                    onChange={(e) => setAdding(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && adding.trim()) {
                        s.addTask({ projectId: section.projectId, sectionId: section.id, name: adding.trim(), assigneeId: me.id });
                        setAdding("");
                      }
                    }}
                    placeholder="Adicionar uma tarefa"
                    className="w-full bg-transparent outline-none placeholder:text-ink-3"
                  />
                </>
              )}
            </div>
            <div /><div /><div />
            <div className="px-3 text-right text-[11px] font-semibold text-ink-3 tracking-wider">TOT</div>
            <div className="px-3 text-right font-semibold tnum">{fmtDec(totalEst)}</div>
            <div className={cn("px-3 text-right font-semibold tnum", totalWorked > totalEst && totalEst > 0 ? "text-warn" : "text-ink-2")}>{fmtDec(totalWorked)}</div>
            <div />
          </div>
        </>
      )}
    </div>
  );
}

export function ListView({ projectId, filters }: { projectId: string; filters: Filters }) {
  const sections = useStore((s) => s.sections.filter((x) => x.projectId === projectId).sort((a, b) => a.order - b.order));
  const tasks = useStore((s) => s.tasks.filter((t) => t.projectId === projectId));
  const addSection = useStore((s) => s.addSection);
  const worked = useWorkedByTask();
  const filtered = applyFilters(tasks, filters);
  const isFiltered = filtered.length !== tasks.length;

  return (
    <div className="overflow-x-auto px-4 md:px-8 pb-16">
      <div className="min-w-[1100px]">
        <HeaderRow />
        {sections.map((sec, i) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            tasks={filtered.filter((t) => t.sectionId === sec.id).sort((a, b) => a.order - b.order)}
            worked={worked}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            filtered={isFiltered}
          />
        ))}
        <button onClick={() => addSection(projectId, "Nova seção")} className="btn-ghost mt-6"><Plus className="h-4 w-4" />Adicionar seção</button>
      </div>
    </div>
  );
}
