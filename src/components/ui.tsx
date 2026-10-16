import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Flame, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Status, User } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/* ---------- hooks ---------- */

/** Re-renders every `ms` — drives live timers. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, cb: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && cb();
    const k = (e: KeyboardEvent) => e.key === "Escape" && cb();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [ref, cb, active]);
}

/* ---------- brand ---------- */

/** Idônea globe mark, redrawn as SVG from the brand PDF. */
export function IdoneaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="idn-g" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#00AEEF" />
          <stop offset="0.55" stopColor="#1E5EEB" />
          <stop offset="1" stopColor="#0B4294" />
        </linearGradient>
        <clipPath id="idn-c"><circle cx="27" cy="31" r="19" /></clipPath>
      </defs>
      <circle cx="27" cy="31" r="19" fill="url(#idn-g)" />
      <g clipPath="url(#idn-c)" stroke="#000F45" strokeOpacity=".55" strokeWidth="1.6" fill="none">
        {[18, 25, 32, 39, 46].map((y) => (
          <path key={y} d={`M4 ${y - 4} Q27 ${y + 4} 50 ${y - 4}`} />
        ))}
      </g>
      <path d="M38 6.5a26 26 0 0 1 -6 49" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <circle cx="13" cy="54" r="3" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const logo = useStore((s) => s.logo);
  if (logo) return <img src={logo} alt="Logo" className={cn("object-contain", compact ? "h-8 w-8" : "h-9 max-w-[150px]")} />;
  return (
    <div className="flex items-center gap-2.5 text-[#2A2A4A] dark:text-white">
      <IdoneaMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[19px] font-bold tracking-tight">Idônea</div>
          <div className="text-[10.5px] text-ink-3 mt-0.5 tracking-wide">Workspace</div>
        </div>
      )}
    </div>
  );
}

/* ---------- people ---------- */

export function Avatar({ user, size = 24, ring }: { user?: User | null; size?: number; ring?: boolean }) {
  if (!user)
    return <span className="inline-block rounded-full border border-dashed border-ink-3" style={{ width: size, height: size }} />;
  return (
    <span
      title={user.name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", ring && "ring-2 ring-surface")}
      style={{ width: size, height: size, background: user.color, fontSize: size * 0.4 }}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({ users, size = 24, max = 4 }: { users: User[]; size?: number; max?: number }) {
  const shown = users.slice(0, max);
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u) => <Avatar key={u.id} user={u} size={size} ring />)}
      {users.length > max && (
        <span className="inline-flex items-center justify-center rounded-full bg-raised text-ink-2 ring-2 ring-surface text-[10px] font-semibold" style={{ width: size, height: size }}>
          +{users.length - max}
        </span>
      )}
    </div>
  );
}

/* ---------- status & urgency ---------- */

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
/** pick black or white text for a solid chip */
export const onColor = (hex: string) => (lum(hex) > 0.36 ? "#111626" : "#fff");

export function StatusPill({ status, className }: { status?: Status; className?: string }) {
  if (!status) return null;
  return (
    <span className={cn("chip", className)} style={{ background: status.color, color: onColor(status.color) }}>
      {status.done && <Check className="h-3 w-3" />}
      {status.name}
    </span>
  );
}

export function StatusSelect({ value, onChange, className }: { value: string; onChange: (id: string) => void; className?: string }) {
  const statuses = useStore((s) => s.statuses);
  const sorted = [...statuses].sort((a, b) => a.order - b.order);
  return (
    <Popover
      className={className}
      trigger={<StatusPill status={statuses.find((s) => s.id === value)} className="cursor-pointer hover:brightness-110" />}
    >
      {(close) => (
        <div className="p-1 w-56">
          {sorted.map((s) => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-hover"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="flex-1">{s.name}</span>
              {s.id === value && <Check className="h-3.5 w-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/** URGENTE is a priority flag (not a status), so a task can be urgent AND "Em revisão". */
export function UrgentTag({ small }: { small?: boolean }) {
  return (
    <span className={cn("chip bg-danger/15 text-danger ring-1 ring-inset ring-danger/30 font-semibold uppercase tracking-wide", small ? "h-5 px-1.5 text-[10px]" : "text-[11px]")}>
      <Flame className={small ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Urgente
    </span>
  );
}

/* ---------- overlays ---------- */

export function Popover({
  trigger, children, align = "left", className,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="inline-flex">{trigger}</div>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn("absolute top-full z-50 mt-1.5 rounded-xl border border-line bg-raised shadow-pop animate-fade-in", align === "right" ? "right-0" : "left-0")}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 480 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-[2px] p-4 pt-[10vh] animate-fade-in">
      <div ref={ref} className="card w-full shadow-pop" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children, icon }: { title: string; subtitle?: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h1 className="text-[22px] font-semibold">{title}</h1>
          {subtitle && <p className="text-ink-2 text-[13px] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-raised border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-colors",
            value === o.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
