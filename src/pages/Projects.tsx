import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock3, Plus } from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import { entryHours, fmtHM, isOverdue } from "@/lib/utils";
import { AvatarStack, PageHeader } from "@/components/ui";
import { NewProjectModal } from "@/components/NewProjectModal";

export default function Projects() {
  const s = useStore();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const doneIds = new Set(s.statuses.filter((x) => x.done).map((x) => x.id));
  const visible = s.projects.filter((p) => !p.archived && (me.role === "admin" || p.memberIds.includes(me.id)));

  return (
    <div className="mx-auto max-w-[1300px] px-4 md:px-8 py-6 md:py-8">
      <PageHeader title="Projetos" subtitle={`${visible.length} projetos ativos · ${s.clients.length} clientes`}>
        {me.role === "admin" && <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Novo projeto</button>}
      </PageHeader>

      <div className="space-y-8">
        {s.clients.map((c) => {
          const list = visible.filter((p) => p.clientId === c.id);
          if (!list.length) return null;
          return (
            <section key={c.id}>
              <h2 className="mb-3 text-[15px] font-semibold text-ink-2">{c.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => {
                  const pt = s.tasks.filter((t) => t.projectId === p.id);
                  const done = pt.filter((t) => doneIds.has(t.statusId)).length;
                  const late = pt.filter((t) => !doneIds.has(t.statusId) && (isOverdue(t.dueDate) || isOverdue(t.workDate))).length;
                  const est = pt.reduce((a, t) => a + t.estimateHours, 0);
                  const hours = s.entries.filter((e) => e.projectId === p.id).reduce((a, e) => a + entryHours(e), 0);
                  const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
                  return (
                    <Link key={p.id} to={`/projetos/${p.id}`} className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-pop">
                      <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl font-display text-[18px] font-bold text-white" style={{ background: p.color }}>{p.name[0]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold">{p.name}</div>
                          <div className="text-[12.5px] text-ink-3">{s.sections.filter((x) => x.projectId === p.id).length} seções · {pt.length} tarefas</div>
                        </div>
                        {late > 0 && <span className="chip bg-danger/15 text-danger text-[11px]"><AlertTriangle className="h-3 w-3" />{late} atrasada{late > 1 && "s"}</span>}
                      </div>
                      <div className="mt-5 flex justify-between text-[12px] text-ink-3 tnum"><span>Progresso</span><span className="font-medium text-ink">{pct}%</span></div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-line/70"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
                      <div className="mt-4 flex items-center justify-between">
                        <AvatarStack users={s.users.filter((u) => p.memberIds.includes(u.id))} size={26} />
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 tnum"><Clock3 className="h-3.5 w-3.5" />{fmtHM(hours)} <span className="text-ink-3">/ {fmtHM(est)} est.</span></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <NewProjectModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
