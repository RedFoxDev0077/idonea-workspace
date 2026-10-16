import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, ImageUp, Plus, RotateCcw, Trash2, Upload, Database, ShieldCheck } from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Avatar, BrandLogo, PageHeader, StatusPill, onColor } from "@/components/ui";

type Tab = "marca" | "status" | "etiquetas" | "equipe" | "migracao";

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-line" style={{ background: value }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
    </label>
  );
}

function Brand() {
  const logo = useStore((s) => s.logo);
  const setLogo = useStore((s) => s.setLogo);
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-[15px] font-semibold">Logotipo</h3>
        <p className="mt-1 text-[13px] text-ink-3">Aparece no menu lateral e nos relatórios. PNG ou SVG com fundo transparente.</p>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div className="grid h-24 w-64 place-items-center rounded-xl border border-dashed border-line bg-raised"><BrandLogo /></div>
          <div className="flex flex-wrap gap-2">
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <button className="btn-primary" onClick={() => ref.current?.click()}><ImageUp className="h-4 w-4" />Enviar novo logo</button>
            {logo && <button className="btn-outline" onClick={() => setLogo(null)}><RotateCcw className="h-4 w-4" />Restaurar padrão</button>}
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-[15px] font-semibold">Identidade</h3>
        <p className="mt-1 text-[13px] text-ink-3">Cores e tipografia do manual da Idônea aplicadas à interface.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Navy", "#000F45"], ["Azul", "#1E5EEB"], ["Azul escuro", "#0B4294"], ["Ciano", "#00AEEF"], ["Grafite", "#1A1F2B"]].map(([n, c]) => (
            <div key={c} className="overflow-hidden rounded-xl border border-line">
              <div className="h-14" style={{ background: c }} />
              <div className="px-3 py-2"><div className="text-[12.5px] font-medium">{n}</div><div className="text-[11.5px] text-ink-3 tnum">{c}</div></div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          <div><div className="label">Títulos</div><div className="font-display text-[26px] font-semibold">Sora</div></div>
          <div><div className="label">Texto</div><div className="text-[26px]">Archivo</div></div>
        </div>
      </div>
    </div>
  );
}

function Statuses() {
  const statuses = useStore((s) => s.statuses);
  const tasks = useStore((s) => s.tasks);
  const { upsertStatus, deleteStatus, moveStatus } = useStore.getState();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B7BFF");
  const sorted = [...statuses].sort((a, b) => a.order - b.order);
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[15px] font-semibold">Status de tarefa</h3>
        <p className="mt-1 text-[13px] text-ink-3">A ordem aqui define as colunas do quadro. Marque “Finaliza” nos status que contam como tarefa concluída. “Urgente” é uma etiqueta de prioridade separada, não um status.</p>
      </div>
      {sorted.map((st, i) => {
        const count = tasks.filter((t) => t.statusId === st.id).length;
        return (
          <div key={st.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
            <div className="flex flex-col">
              <button disabled={i === 0} onClick={() => moveStatus(st.id, -1)} className="text-ink-3 hover:text-ink disabled:opacity-30" aria-label="Subir"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button disabled={i === sorted.length - 1} onClick={() => moveStatus(st.id, 1)} className="text-ink-3 hover:text-ink disabled:opacity-30" aria-label="Descer"><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>
            <ColorInput value={st.color} onChange={(c) => upsertStatus({ ...st, color: c })} />
            <input value={st.name} onChange={(e) => upsertStatus({ ...st, name: e.target.value })} className="input h-8 max-w-[260px]" />
            <StatusPill status={st} className="hidden md:inline-flex" />
            <label className="ml-auto flex items-center gap-2 text-[12.5px] text-ink-2">
              <button onClick={() => upsertStatus({ ...st, done: !st.done })} className={cn("grid h-4 w-4 place-items-center rounded border", st.done ? "border-ok bg-ok" : "border-line")} aria-label="Finaliza">{st.done && <Check className="h-3 w-3 text-white" />}</button>
              Finaliza
            </label>
            <span className="w-20 text-right text-[12px] text-ink-3 tnum">{count} tarefa{count !== 1 && "s"}</span>
            <button className="icon-btn hover:text-danger" onClick={() => { if (confirm(`Excluir "${st.name}"? ${count} tarefa(s) irão para o primeiro status.`)) deleteStatus(st.id); }} aria-label="Excluir status"><Trash2 className="h-4 w-4" /></button>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-raised/50">
        <ColorInput value={color} onChange={setColor} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo status" className="input h-8 max-w-[260px]" />
        {name && <span className="chip" style={{ background: color, color: onColor(color) }}>{name}</span>}
        <button className="btn-primary h-8 ml-auto" disabled={!name.trim()} onClick={() => { upsertStatus({ name: name.trim(), color }); setName(""); }}><Plus className="h-4 w-4" />Adicionar</button>
      </div>
    </div>
  );
}

function Tags() {
  const tags = useStore((s) => s.tags);
  const { upsertTag, deleteTag } = useStore.getState();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#00AEEF");
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[15px] font-semibold">Etiquetas de horas</h3>
        <p className="mt-1 text-[13px] text-ink-3">Usadas nos lançamentos do cronômetro, como no Clockify (ex.: Atendimento, Reunião).</p>
      </div>
      {tags.map((t) => (
        <div key={t.id} className="flex items-center gap-3 border-b border-line px-5 py-3">
          <ColorInput value={t.color} onChange={(c) => upsertTag({ ...t, color: c })} />
          <input value={t.name} onChange={(e) => upsertTag({ ...t, name: e.target.value })} className="input h-8 max-w-[260px]" />
          <button className="icon-btn ml-auto hover:text-danger" onClick={() => deleteTag(t.id)} aria-label="Excluir etiqueta"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex items-center gap-3 px-5 py-4 bg-raised/50">
        <ColorInput value={color} onChange={setColor} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova etiqueta" className="input h-8 max-w-[260px]" />
        <button className="btn-primary h-8 ml-auto" disabled={!name.trim()} onClick={() => { upsertTag({ name: name.trim(), color }); setName(""); }}><Plus className="h-4 w-4" />Adicionar</button>
      </div>
    </div>
  );
}

function Team() {
  const users = useStore((s) => s.users);
  const me = useMe();
  const { upsertUser } = useStore.getState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[15px] font-semibold">Equipe e permissões</h3>
        <p className="mt-1 text-[13px] text-ink-3"><b>Administrador</b>: gerencia projetos, status, equipe e pode corrigir horas de qualquer dia. <b>Membro</b>: trabalha nas tarefas e edita as próprias horas apenas no mesmo dia.</p>
      </div>
      {users.map((u) => (
        <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <Avatar user={u} size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-medium">{u.name}{u.id === me.id && <span className="text-ink-3 font-normal"> (você)</span>}</div>
            <div className="text-[12.5px] text-ink-3">{u.email}</div>
          </div>
          <select value={u.role} disabled={u.id === me.id} onChange={(e) => upsertUser({ ...u, role: e.target.value as "admin" | "membro" })} className="input h-8 w-40">
            <option value="admin">Administrador</option>
            <option value="membro">Membro</option>
          </select>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-raised/50">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="input h-8 max-w-[220px]" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="input h-8 max-w-[260px]" />
        <button className="btn-primary h-8 ml-auto" disabled={!name.trim() || !email.includes("@")} onClick={() => { upsertUser({ name: name.trim(), email: email.trim() }); setName(""); setEmail(""); }}><Plus className="h-4 w-4" />Convidar</button>
      </div>
    </div>
  );
}

function Migration() {
  const resetDemo = useStore((s) => s.resetDemo);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "Asana", color: "#F06A6A", what: "Projetos, seções, tarefas, subtarefas, responsáveis, datas, status, comentários e anexos", field: "Personal Access Token" },
          { name: "Clockify", color: "#03A9F4", what: "Registros de horas, projetos, clientes, etiquetas e usuários", field: "API Key" },
        ].map((x) => (
          <div key={x.name} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white font-bold" style={{ background: x.color }}>{x.name[0]}</span>
              <div><h3 className="text-[15px] font-semibold">Importar do {x.name}</h3><p className="text-[12.5px] text-ink-3">{x.what}</p></div>
            </div>
            <label className="mt-4 block space-y-1.5"><span className="label">{x.field}</span><input type="password" placeholder="Cole aqui o token" className="input" /></label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" disabled title="Disponível após conectar o backend"><Database className="h-4 w-4" />Conectar e importar</button>
              <button className="btn-outline"><Upload className="h-4 w-4" />Enviar backup ({x.name === "Asana" ? "JSON" : "CSV"})</button>
            </div>
          </div>
        ))}
      </div>
      <div className="card flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
        <p className="text-[13px] text-ink-2">Após a importação é gerado um relatório de validação (totais de tarefas e horas por projeto, origem × destino). Os tokens podem ser revogados logo depois.</p>
      </div>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h3 className="text-[15px] font-semibold">Dados de demonstração</h3><p className="text-[12.5px] text-ink-3">Restaura os dados de exemplo desta versão de testes.</p></div>
        <button className="btn-outline" onClick={() => confirm("Restaurar os dados de demonstração?") && resetDemo()}><RotateCcw className="h-4 w-4" />Restaurar</button>
      </div>
    </div>
  );
}

export default function Settings() {
  const me = useMe();
  const [tab, setTab] = useState<Tab>("marca");
  if (me.role !== "admin") return <Navigate to="/" replace />;
  const tabs: [Tab, string][] = [["marca", "Marca"], ["status", "Status"], ["etiquetas", "Etiquetas"], ["equipe", "Equipe"], ["migracao", "Migração"]];
  return (
    <div className="mx-auto max-w-[1000px] px-4 md:px-8 py-6 md:py-8">
      <PageHeader title="Configurações" subtitle="Disponível apenas para administradores" />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("h-10 px-4 text-[13.5px] font-medium border-b-2 -mb-px whitespace-nowrap", tab === k ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink")}>{l}</button>
        ))}
      </div>
      {tab === "marca" && <Brand />}
      {tab === "status" && <Statuses />}
      {tab === "etiquetas" && <Tags />}
      {tab === "equipe" && <Team />}
      {tab === "migracao" && <Migration />}
    </div>
  );
}
