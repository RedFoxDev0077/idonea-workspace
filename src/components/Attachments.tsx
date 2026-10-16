import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { useMe, useStore } from "@/store/useStore";
import type { Task } from "@/lib/types";
import { uid } from "@/lib/utils";

const MAX = 2 * 1024 * 1024; // demo limit (localStorage); Supabase Storage removes it

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

export function Attachments({ task }: { task: Task }) {
  const me = useMe();
  const updateTask = useStore((s) => s.updateTask);
  const ref = useRef<HTMLInputElement>(null);
  const list = task.attachments ?? [];

  const add = (files: FileList | null) => {
    [...(files ?? [])].forEach((f) => {
      if (f.size > MAX) return alert(`${f.name}: limite de 2 MB nesta versão de testes.`);
      const r = new FileReader();
      r.onload = () => {
        const cur = useStore.getState().tasks.find((t) => t.id === task.id)?.attachments ?? [];
        updateTask(task.id, { attachments: [...cur, { id: uid("f"), name: f.name, size: f.size, url: String(r.result), uploadedBy: me.id, createdAt: new Date().toISOString() }] });
      };
      r.readAsDataURL(f);
    });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Anexos</span>
        <button onClick={() => ref.current?.click()} className="btn-ghost h-7 px-2 text-[12px]"><Paperclip className="h-3.5 w-3.5" />Anexar</button>
        <input ref={ref} type="file" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
        className="flex flex-wrap gap-2"
      >
        {list.map((a) => (
          <div key={a.id} className="group flex items-center gap-2.5 rounded-xl border border-line bg-raised px-3 py-2">
            {a.url.startsWith("data:image") ? <img src={a.url} alt="" className="h-8 w-8 rounded object-cover" /> : <FileText className="h-5 w-5 text-brand" />}
            <a href={a.url} download={a.name} className="max-w-[180px] leading-tight">
              <span className="block truncate text-[12.5px] hover:underline">{a.name}</span>
              <span className="text-[11px] text-ink-3">{size(a.size)}</span>
            </a>
            <button onClick={() => updateTask(task.id, { attachments: list.filter((x) => x.id !== a.id) })} className="text-ink-3 opacity-0 group-hover:opacity-100 hover:text-danger" aria-label="Remover anexo"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {!list.length && (
          <button onClick={() => ref.current?.click()} className="w-full rounded-xl border border-dashed border-line py-3 text-[12.5px] text-ink-3 hover:border-brand hover:text-ink">
            Arraste arquivos aqui ou clique para anexar
          </button>
        )}
      </div>
    </div>
  );
}
