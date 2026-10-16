import { useState } from "react";
import { cn, fmtHM } from "@/lib/utils";

/**
 * Single-series vertical bars (hours per day). One hue — the title names the series,
 * so no legend. 4px rounded tops anchored to the baseline, 2px gaps via column spacing,
 * recessive grid, hover tooltip with a hit target wider than the bar.
 */
export function BarChart({ data, height = 200, target }: { data: { label: string; sub?: string; value: number; highlight?: boolean }[]; height?: number; target?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value));
  const nice = Math.ceil(max / 2) * 2;
  const ticks = [0, nice / 2, nice];

  return (
    <div className="relative" style={{ height: height + 28 }}>
      {/* grid */}
      <div className="absolute inset-x-0 top-0 ml-8" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-line/60" style={{ bottom: `${(t / nice) * 100}%` }}>
            <span className="absolute -left-8 -translate-y-1/2 text-[11px] text-ink-3 tnum w-6 text-right">{t}h</span>
          </div>
        ))}
        {target !== undefined && (
          <div className="absolute inset-x-0 border-t border-dashed border-ink-3/70" style={{ bottom: `${(target / nice) * 100}%` }}>
            <span className="absolute right-0 -translate-y-full pb-0.5 text-[11px] text-ink-3">meta {target}h</span>
          </div>
        )}
      </div>
      {/* bars */}
      <div className="absolute inset-x-0 top-0 ml-8 flex items-end gap-[2px]" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div
              className={cn("w-[46%] max-w-[34px] rounded-t-[4px] transition-colors", d.highlight ? "bg-brand" : "bg-brand/70", hover === i && "bg-brand")}
              style={{ height: `${(d.value / nice) * 100}%`, minHeight: d.value ? 3 : 0 }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute z-10 -translate-y-2 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] shadow-pop whitespace-nowrap" style={{ bottom: `${(d.value / nice) * 100}%` }}>
                <div className="text-ink-3">{d.sub ?? d.label}</div>
                <div className="font-semibold tnum">{fmtHM(d.value)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* x labels */}
      <div className="absolute inset-x-0 bottom-0 ml-8 flex gap-[2px]">
        {data.map((d, i) => (
          <div key={i} className={cn("flex-1 text-center text-[11.5px]", d.highlight ? "text-ink font-semibold" : "text-ink-3")}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars for ranked categories (hours by project / client / member). Text stays in ink, the swatch carries identity. */
export function HBarList({ rows, unit = "h" }: { rows: { id: string; label: string; value: number; color?: string; sub?: string }[]; unit?: "h" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="group">
          <div className="mb-1 flex items-center gap-2 text-[13px]">
            {r.color && <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />}
            <span className="truncate">{r.label}</span>
            {r.sub && <span className="truncate text-[12px] text-ink-3">{r.sub}</span>}
            <span className="ml-auto tnum font-semibold">{unit === "h" ? fmtHM(r.value) : r.value}</span>
            <span className="w-10 text-right tnum text-[12px] text-ink-3">{Math.round((r.value / total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-line/60">
            <div className="h-full rounded-full bg-brand group-hover:brightness-110" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-[13px] text-ink-3">Sem horas no período.</p>}
    </div>
  );
}
