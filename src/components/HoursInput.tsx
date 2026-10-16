import { useState } from "react";
import { cn, fmtDec } from "@/lib/utils";

/** Decimal hours shown pt-BR style ("0,75"), accepts "0,75", "0.75" or "45m" / "1h30". */
export function HoursInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const t = draft.trim().toLowerCase();
    const hm = t.match(/^(\d+)\s*h\s*(\d+)?\s*m?$/);
    const m = t.match(/^(\d+)\s*m(in)?$/);
    const v = hm ? Number(hm[1]) + Number(hm[2] ?? 0) / 60 : m ? Number(m[1]) / 60 : Number(t.replace(",", "."));
    if (!Number.isNaN(v) && v >= 0) onChange(Math.round(v * 100) / 100);
    setDraft(null);
  };
  return (
    <input
      inputMode="decimal"
      value={draft ?? fmtDec(value)}
      onFocus={(e) => { setDraft(fmtDec(value)); requestAnimationFrame(() => e.target.select()); }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
      className={cn(className ?? "w-full text-right", "bg-transparent tnum outline-none rounded px-1 hover:bg-hover focus:bg-raised focus:ring-1 focus:ring-brand")}
      aria-label="Horas estimadas"
    />
  );
}
