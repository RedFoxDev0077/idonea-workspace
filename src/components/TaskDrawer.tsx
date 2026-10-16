import { useMemo, useState } from "react";
import { AtSign, CalendarDays, CalendarClock, Flame, Link2, Play, Send, Square, Trash2, X, Plus, Check, Clock3, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMe, useRunning, useStore } from "@/store/useStore";
import { cn, entryHours, fmtDec, fmtHM, uid } from "@/lib/utils";
import { Avatar, Popover, StatusSelect, useNow } from "./ui";
import { EstimateBar } from "./EstimateBar";
import { HoursInput } from "./HoursInput";
import { Attachments } from "./Attachments";

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3 min-h-9">
      <span className="flex items-center gap-2 text-[13px] text-ink-3">{icon}{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function TaskDrawer() {
  const id = useStore((s) => s.openTaskId);
  const close = () => useStore.getState().openTask(null);
  if (!id) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={close} />
      <TaskPanel key={id} id={id} onClose={close} />
    </div>
  );
}

function TaskPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useStore();
  const me = useMe();
  const running = useRunning();
  const now = useNow();
  const task = s.tasks.find((t) => t.id === id);
  const [comment, setComment] = useState("");
  const [newSub, setNewSub] = useState("");
  const [tab, setTab] = useState<"comentarios" | "atividade" | "horas">("comentarios");

  const entries = useMemo(() => s.entries.filter((e) => e.taskId === id), [s.entries, id]);
  if (!task) return null;

  const project = s.projects.find((p) => p.id === task.projectId);
  const sections = s.sections.filter((x) => x.projectId === task.projectId).sort((a, b) => a.order - b.order);
  const members = s.users.filter((u) => project?.memberIds.includes(u.id));
  const worked = entries.reduce((a, e) => a + entryHours(e, now), 0);
  const runningHere = running?.taskId === id;
  const late = task.workDate && task.dueDate && task.workDate > task.dueDate;
  const up = (patch: Parameters<typeof s.updateTask>[1]) => s.updateTask(id, patch);
  const comments = s.comments.filter((c) => c.taskId === id);
  const activity = s.activity.filter((a) => a.taskId === id);

  const sendComment = () => {
    if (!comment.trim()) return;
    s.addComment(id, comment.trim());
    setComment("");
  };

  return (
    <div className="relative flex h-full w-full max-w-[640px] flex-col border-l border-line bg-surface shadow-pop animate-slide-in">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-4 sm:px-5 h-14 shrink-0">
        <button
          onClick={() => up({ statusId: s.statuses.find((x) => x.done)?.id ?? task.statusId })}
          className="btn-outline h-8 text-[12.5px]"
        >
          <Check className="h-3.5 w-3.5" /><span className="hidden sm:inline">Concluir</span>
        </button>
        <button
          onClick={() => up({ urgent: !task.urgent })}
          className={cn("btn h-8 text-[12.5px]", task.urgent ? "bg-danger text-white" : "border border-line text-ink-2 hover:bg-hover")}
        >
          <Flame className="h-3.5 w-3.5" />{task.urgent ? "Urgente" : "Marcar urgente"}
        </button>
        <div className="flex-1" />
        {runningHere ? (
          <button onClick={s.stopTimer} className="btn h-8 bg-danger text-white text-[12.5px]"><Square className="h-3 w-3 fill-current" />Parar<span className="hidden sm:inline"> timer</span></button>
        ) : (
          <button onClick={() => s.startTimer({ description: task.name, projectId: task.projectId, taskId: id, tagIds: [] })} className="btn-primary h-8 text-[12.5px]">
            <Play className="h-3 w-3 fill-current" /><span className="hidden sm:inline">Iniciar </span>timer
          </button>
        )}
        {me.role === "admin" && (
          <button className="icon-btn" onClick={() => { if (confirm("Excluir esta tarefa?")) s.deleteTask(id); }} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
        )}
        <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-5 pb-6 space-y-5">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: project?.color }} />
            {project?.name}
            <span>/</span>
            <select value={task.sectionId} onChange={(e) => s.moveTask(id, e.target.value, null)} className="bg-transparent text-ink-2 outline-none hover:text-ink cursor-pointer">
              {sections.map((x) => <option key={x.id} value={x.id} className="bg-raised">{x.name}</option>)}
            </select>
          </div>

          <input
            value={task.name}
            onChange={(e) => up({ name: e.target.value })}
            className="w-full bg-transparent font-display text-[22px] font-semibold outline-none rounded-md -mx-1 px-1 hover:bg-hover focus:bg-hover"
          />

          <div className="space-y-1.5">
            <Field label="Status"><StatusSelect value={task.statusId} onChange={(v) => up({ statusId: v })} /></Field>
            <Field label="Responsável">
              <Popover
                trigger={
                  <button className="flex items-center gap-2 rounded-lg px-1.5 h-8 hover:bg-hover text-[13px]">
                    <Avatar user={s.users.find((u) => u.id === task.assigneeId)} size={24} />
                    {s.users.find((u) => u.id === task.assigneeId)?.name ?? <span className="text-ink-3">Sem responsável</span>}
                  </button>
                }
              >
                {(c) => (
                  <div className="w-56 p-1">
                    {members.map((u) => (
                      <button key={u.id} onClick={() => { up({ assigneeId: u.id }); c(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-hover">
                        <Avatar user={u} size={22} />{u.name}
                      </button>
                    ))}
                    <button onClick={() => { up({ assigneeId: null }); c(); }} className="w-full rounded-md px-2 py-1.5 text-left text-[13px] text-ink-3 hover:bg-hover">Remover responsável</button>
                  </div>
                )}
              </Popover>
            </Field>
            <Field label="Data de trabalho" icon={<CalendarDays className="h-3.5 w-3.5" />}>
              <input type="date" value={task.workDate ?? ""} onChange={(e) => up({ workDate: e.target.value || null })} className="input h-8 w-44" />
            </Field>
            <Field label="Prazo máx." icon={<CalendarClock className="h-3.5 w-3.5" />}>
              <div className="flex items-center gap-2">
                <input type="date" value={task.dueDate ?? ""} onChange={(e) => up({ dueDate: e.target.value || null })} className={cn("input h-8 w-44", late && "border-danger text-danger")} />
                {late && <span className="flex items-center gap-1 text-[12px] text-danger"><AlertTriangle className="h-3.5 w-3.5" />Data de trabalho após o prazo</span>}
              </div>
            </Field>
            <Field label="Tema"><input value={task.tema} onChange={(e) => up({ tema: e.target.value })} placeholder="Ex.: Out - Market - Grandes Marcas" className="input h-8" /></Field>
            <Field label="Estimativa (h)" icon={<Clock3 className="h-3.5 w-3.5" />}>
              <HoursInput value={task.estimateHours} onChange={(v) => up({ estimateHours: v })} className="input h-8 w-28 text-left" />
            </Field>
            <Field label="Depende de" icon={<Link2 className="h-3.5 w-3.5" />}>
              <div className="flex flex-wrap items-center gap-1.5">
                {task.dependsOn.map((d) => {
                  const dt = s.tasks.find((x) => x.id === d);
                  const done = s.statuses.find((x) => x.id === dt?.statusId)?.done;
                  return (
                    <span key={d} className={cn("chip bg-raised border border-line", done ? "text-ok" : "text-ink-2")}>
                      {done ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}{dt?.name}
                      <button onClick={() => up({ dependsOn: task.dependsOn.filter((x) => x !== d) })} className="ml-0.5 text-ink-3 hover:text-ink"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
                <Popover trigger={<button className="chip text-ink-3 hover:text-ink hover:bg-hover"><Plus className="h-3 w-3" />Adicionar</button>}>
                  {(c) => (
                    <div className="w-64 max-h-64 overflow-y-auto p-1">
                      {s.tasks.filter((x) => x.projectId === task.projectId && x.id !== id && !task.dependsOn.includes(x.id)).map((x) => (
                        <button key={x.id} onClick={() => { up({ dependsOn: [...task.dependsOn, x.id] }); c(); }} className="w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-hover truncate">{x.name}</button>
                      ))}
                    </div>
                  )}
                </Popover>
              </div>
            </Field>
          </div>

          {/* estimate vs worked */}
          <div className="rounded-xl border border-line bg-raised p-4">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="label">Estimado × trabalhado</span>
              <span className="text-[13px] text-ink-2 tnum">
                <b className="text-ink">{fmtHM(worked)}</b> de {fmtHM(task.estimateHours)}
              </span>
            </div>
            <EstimateBar estimate={task.estimateHours} worked={worked} />
          </div>

          <div>
            <div className="label mb-2">Descrição</div>
            <textarea
              value={task.description}
              onChange={(e) => up({ description: e.target.value })}
              placeholder="Adicione detalhes, links do briefing, referências…"
              rows={3}
              className="input h-auto py-2.5 leading-relaxed resize-y"
            />
          </div>

          <Attachments task={task} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label">Subtarefas</span>
              <span className="text-[12px] text-ink-3 tnum">{task.subtasks.filter((x) => x.done).length}/{task.subtasks.length}</span>
            </div>
            <div className="space-y-0.5">
              {task.subtasks.map((st) => (
                <div key={st.id} className="group flex items-center gap-2.5 rounded-lg px-2 h-9 hover:bg-hover">
                  <button
                    onClick={() => up({ subtasks: task.subtasks.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)) })}
                    className={cn("grid h-[18px] w-[18px] place-items-center rounded-full border", st.done ? "bg-ok border-ok" : "border-ink-3")}
                  >
                    {st.done && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className={cn("flex-1 text-[13.5px]", st.done && "line-through text-ink-3")}>{st.title}</span>
                  <button onClick={() => up({ subtasks: task.subtasks.filter((x) => x.id !== st.id) })} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <div className="flex items-center gap-2.5 px-2 h-9">
                <Plus className="h-4 w-4 text-ink-3" />
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSub.trim()) {
                      up({ subtasks: [...task.subtasks, { id: uid("sb"), title: newSub.trim(), done: false }] });
                      setNewSub("");
                    }
                  }}
                  placeholder="Adicionar subtarefa e pressionar Enter"
                  className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="border-t border-line bg-bg/40">
          <div className="flex gap-1 px-5 pt-3">
            {([["comentarios", `Comentários (${comments.length})`], ["atividade", "Histórico"], ["horas", `Registros de horas (${entries.length})`]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={cn("h-9 px-3 text-[13px] font-medium border-b-2 -mb-px", tab === k ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink")}>{l}</button>
            ))}
          </div>
          <div className="px-6 py-4 space-y-4">
            {tab === "comentarios" && comments.map((c) => {
              const u = s.users.find((x) => x.id === c.userId);
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar user={u} size={30} />
                  <div className="min-w-0">
                    <div className="text-[13px]"><b className="font-semibold">{u?.name}</b> <span className="text-ink-3 text-[12px]">· {formatDistanceToNow(parseISO(c.createdAt), { locale: ptBR, addSuffix: true })}</span></div>
                    <p className="text-[13.5px] text-ink-2 mt-0.5 whitespace-pre-wrap">
                      {c.text.split(/(@[A-ZÀ-Ú][\wÀ-ú]+(?: [A-ZÀ-Ú][\wÀ-ú]+)?)/g).map((part, i) =>
                        part.startsWith("@") ? <span key={i} className="rounded bg-brand/15 px-1 text-brand font-medium">{part}</span> : part,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            {tab === "atividade" && (
              <ol className="relative border-l border-line ml-2 space-y-3">
                {[...activity].map((a) => (
                  <li key={a.id} className="ml-4 text-[13px]">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-line" />
                    <b className="font-medium">{s.users.find((u) => u.id === a.userId)?.name}</b> <span className="text-ink-2">{a.text}</span>
                    <span className="text-ink-3 text-[12px]"> · {formatDistanceToNow(parseISO(a.createdAt), { locale: ptBR, addSuffix: true })}</span>
                  </li>
                ))}
                {!activity.length && <li className="ml-4 text-ink-3 text-[13px]">Sem histórico ainda.</li>}
              </ol>
            )}
            {tab === "horas" && (
              <div className="divide-y divide-line rounded-xl border border-line">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
                    <Avatar user={s.users.find((u) => u.id === e.userId)} size={22} />
                    <span className="flex-1 truncate">{e.description}</span>
                    <span className="text-ink-3">{formatDistanceToNow(parseISO(e.start), { locale: ptBR, addSuffix: true })}</span>
                    <span className="tnum font-medium w-14 text-right">{e.end ? fmtDec(entryHours(e)) : <span className="text-danger">ativo</span>}</span>
                  </div>
                ))}
                {!entries.length && <p className="p-3 text-ink-3 text-[13px]">Nenhuma hora registrada nesta tarefa.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* comment composer */}
      <div className="border-t border-line p-4 flex items-end gap-2 shrink-0 bg-surface">
        <Avatar user={me} size={30} />
        <div className="flex-1 rounded-xl border border-line bg-raised focus-within:border-brand">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendComment(); }}
            placeholder="Comente ou mencione alguém com @…"
            rows={1}
            className="w-full resize-none bg-transparent px-3 pt-2.5 text-[13.5px] outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-between px-2 pb-1.5">
            <Popover trigger={<button className="icon-btn h-7 w-7" aria-label="Mencionar"><AtSign className="h-4 w-4" /></button>}>
              {(c) => (
                <div className="w-52 p-1">
                  {s.users.map((u) => (
                    <button key={u.id} onClick={() => { setComment((v) => `${v}${v && !v.endsWith(" ") ? " " : ""}@${u.name} `); c(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-hover">
                      <Avatar user={u} size={20} />{u.name}
                    </button>
                  ))}
                </div>
              )}
            </Popover>
            <button onClick={sendComment} disabled={!comment.trim()} className="btn-primary h-7 px-3 text-[12px]"><Send className="h-3.5 w-3.5" />Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
