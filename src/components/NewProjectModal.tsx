import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Avatar, Modal } from "./ui";

export const PROJECT_COLORS = ["#F06A6A", "#F1A33C", "#E8618C", "#9B6BF2", "#3B7BFF", "#00AEEF", "#2BB5A0", "#34C77B", "#C9A227", "#8A94A6"];

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const addProject = useStore((s) => s.addProject);
  const addClient = useStore((s) => s.addClient);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[4]!);
  const [memberIds, setMemberIds] = useState<string[]>(users.map((u) => u.id));

  const submit = () => {
    if (!name.trim()) return;
    const cid = clientId === "__new" ? addClient(newClient.trim() || "Novo cliente") : clientId;
    const id = addProject({ name: name.trim(), clientId: cid, color, memberIds });
    onClose();
    setName("");
    navigate(`/projetos/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo projeto">
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="label">Nome do projeto</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ex.: Data Center 4 All" />
        </label>
        <label className="block space-y-1.5">
          <span className="label">Cliente</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new">+ Novo cliente…</option>
          </select>
        </label>
        {clientId === "__new" && <input value={newClient} onChange={(e) => setNewClient(e.target.value)} className="input" placeholder="Nome do cliente" />}
        <div className="space-y-1.5">
          <span className="label">Cor</span>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cn("grid h-7 w-7 place-items-center rounded-lg", color === c && "ring-2 ring-offset-2 ring-offset-surface ring-brand")} style={{ background: c }} aria-label={c}>
                {color === c && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="label">Membros</span>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const on = memberIds.includes(u.id);
              return (
                <button key={u.id} onClick={() => setMemberIds(on ? memberIds.filter((x) => x !== u.id) : [...memberIds, u.id])} className={cn("flex items-center gap-2 rounded-full border pl-1 pr-3 h-8 text-[12.5px]", on ? "border-brand bg-brand/10" : "border-line text-ink-3")}>
                  <Avatar user={u} size={22} />{u.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={!name.trim()}>Criar projeto</button>
        </div>
      </div>
    </Modal>
  );
}
