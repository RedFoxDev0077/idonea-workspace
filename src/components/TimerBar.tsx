import { useState } from "react";
import { FolderOpen, Play, Square, Tag as TagIcon, Check, ListPlus } from "lucide-react";
import { parseISO, differenceInSeconds } from "date-fns";
import { useRunning, useStore } from "@/store/useStore";
import { cn, fmtClock } from "@/lib/utils";
import { Popover, useNow } from "./ui";

export function ProjectPicker({ value, onChange, compact }: { value: string | null; onChange: (id: string | null) => void; compact?: boolean }) {
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const p = projects.find((x) => x.id === value);
  return (
    <Popover
      trigger={
        <button className={cn("inline-flex items-center gap-2 h-9 px-2.5 rounded-lg text-[13px] font-medium hover:bg-hover whitespace-nowrap", p ? "text-ink" : "text-brand")}>
          {p ? <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: p.color }} /> : <FolderOpen className="h-4 w-4" />}
          {!compact && (p ? p.name : "Projeto")}
        </button>
      }
    >
      {(close) => (
        <div className="w-64 p-1 max-h-80 overflow-y-auto">
          <button onClick={() => { onChange(null); close(); }} className="w-full rounded-md px-3 py-1.5 text-left text-[13px] text-ink-3 hover:bg-hover">Sem projeto</button>
          {clients.map((c) => {
            const list = projects.filter((x) => x.clientId === c.id);
            if (!list.length) return null;
            return (
              <div key={c.id}>
                <div className="px-3 pt-2 pb-1 label">{c.name}</div>
                {list.map((x) => (
                  <button key={x.id} onClick={() => { onChange(x.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] hover:bg-hover">
                    <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: x.color }} />
                    <span className="flex-1">{x.name}</span>
                    {x.id === value && <Check className="h-3.5 w-3.5 text-brand" />}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

export function TagPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const tags = useStore((s) => s.tags);
  const active = tags.filter((t) => value.includes(t.id));
  return (
    <Popover
      align="right"
      trigger={
        <button className={cn("icon-btn h-9 w-auto px-2 gap-1", active.length && "text-brand")} aria-label="Etiquetas">
          <TagIcon className="h-4 w-4" />
          {active.length > 0 && <span className="text-[12px] font-medium">{active.length}</span>}
        </button>
      }
    >
      {() => (
        <div className="w-52 p-1">
          {tags.map((t) => {
            const on = value.includes(t.id);
            return (
              <button key={t.id} onClick={() => onChange(on ? value.filter((x) => x !== t.id) : [...value, t.id])} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] hover:bg-hover">
                <span className={cn("grid h-4 w-4 place-items-center rounded border", on ? "bg-brand-strong border-brand-strong" : "border-line")}>{on && <Check className="h-3 w-3 text-white" />}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

/** Task picker for linking a quick entry to an existing task (optional). */
export function TaskLinkPicker({ projectId, value, onChange }: { projectId: string | null; value: string | null; onChange: (id: string | null, projectId?: string) => void }) {
  const tasks = useStore((s) => s.tasks);
  const list = tasks.filter((t) => !projectId || t.projectId === projectId);
  const cur = tasks.find((t) => t.id === value);
  return (
    <Popover
      trigger={
        <button className={cn("inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[13px] hover:bg-hover max-w-[180px]", cur ? "text-ink" : "text-ink-3")} title="Vincular a uma tarefa">
          <ListPlus className="h-4 w-4 shrink-0" />
          <span className="truncate hidden lg:inline">{cur ? cur.name : "Tarefa"}</span>
        </button>
      }
    >
      {(close) => (
        <div className="w-72 p-1 max-h-72 overflow-y-auto">
          <button onClick={() => { onChange(null); close(); }} className="w-full rounded-md px-3 py-1.5 text-left text-[13px] text-ink-3 hover:bg-hover">Sem tarefa (registro rápido)</button>
          {list.map((t) => (
            <button key={t.id} onClick={() => { onChange(t.id, t.projectId); close(); }} className="flex w-full flex-col rounded-md px-3 py-1.5 text-left hover:bg-hover">
              <span className="text-[13px]">{t.name}</span>
              <span className="text-[11.5px] text-ink-3 truncate">{t.tema}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/**
 * Clockify-style quick bar: log time without creating a task first
 * (e.g. "atender um cliente"), optionally linked to a task later.
 */
export function TimerBar() {
  const running = useRunning();
  const tasks = useStore((s) => s.tasks);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const now = useNow();
  const [desc, setDesc] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const start = () => {
    const t = tasks.find((x) => x.id === taskId);
    startTimer({ description: desc.trim() || t?.name || "Sem descrição", projectId, taskId, tagIds });
    setDesc(""); setProjectId(null); setTaskId(null); setTagIds([]);
  };

  if (running) {
    const p = useStore.getState().projects.find((x) => x.id === running.projectId);
    return (
      <div className="card flex flex-wrap items-center gap-3 p-2 pl-4 ring-1 ring-brand/40">
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-danger animate-pulse2" /><span className="relative h-2.5 w-2.5 rounded-full bg-danger" /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium">{running.description}</div>
          {p && <div className="flex items-center gap-1.5 text-[12px] text-ink-2"><span className="h-2 w-2 rounded-[3px]" style={{ background: p.color }} />{p.name}</div>}
        </div>
        <span className="font-display tnum text-[22px] font-semibold tracking-tight px-2">{fmtClock(differenceInSeconds(now, parseISO(running.start)))}</span>
        <button onClick={stopTimer} className="btn h-10 px-5 bg-danger text-white hover:brightness-110"><Square className="h-4 w-4 fill-current" />Parar</button>
      </div>
    );
  }

  return (
    <div className="card flex flex-wrap items-center gap-1 p-2 sm:flex-nowrap">
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && start()}
        placeholder="Em que você está trabalhando?"
        className="h-10 min-w-0 flex-1 basis-full sm:basis-auto bg-transparent px-3 text-[14px] outline-none placeholder:text-ink-3"
      />
      <TaskLinkPicker projectId={projectId} value={taskId} onChange={(id, pid) => { setTaskId(id); if (pid) setProjectId(pid); }} />
      <ProjectPicker value={projectId} onChange={(id) => { setProjectId(id); setTaskId(null); }} />
      <TagPicker value={tagIds} onChange={setTagIds} />
      <span className="mx-2 hidden sm:block h-6 w-px bg-line" />
      <span className="font-display tnum text-[18px] font-semibold text-ink-2 px-2">00:00:00</span>
      <button onClick={start} className="btn-primary h-10 px-5 ml-auto sm:ml-0"><Play className="h-4 w-4 fill-current" />Iniciar</button>
    </div>
  );
}

/** Compact running-timer indicator for the top bar. */
export function TimerChip() {
  const running = useRunning();
  const stopTimer = useStore((s) => s.stopTimer);
  const now = useNow();
  if (!running) {
    return (
      <a href="#/horas" className="btn-outline h-9 hidden sm:inline-flex">
        <Play className="h-3.5 w-3.5 fill-current text-brand" />Iniciar timer
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-brand/10 ring-1 ring-brand/30 pl-3 pr-1 h-9">
      <span className="h-2 w-2 rounded-full bg-danger animate-pulse2" />
      <span className="hidden md:block max-w-[160px] truncate text-[12.5px] text-ink-2">{running.description}</span>
      <span className="tnum font-display text-[14px] font-semibold">{fmtClock(differenceInSeconds(now, parseISO(running.start)))}</span>
      <button onClick={stopTimer} className="grid h-7 w-7 place-items-center rounded-md bg-danger text-white hover:brightness-110" aria-label="Parar timer">
        <Square className="h-3 w-3 fill-current" />
      </button>
    </div>
  );
}
