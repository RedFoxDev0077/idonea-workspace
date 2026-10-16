import { cn, fmtHM } from "@/lib/utils";

/**
 * Estimated vs worked hours. The estimate is the neutral track; worked time fills it
 * in brand blue. Overrun switches to the warning color and is always stated in text,
 * so the state never depends on color alone.
 */
export function EstimateBar({ estimate, worked, compact }: { estimate: number; worked: number; compact?: boolean }) {
  const over = estimate > 0 && worked > estimate;
  const scale = Math.max(estimate, worked) || 1;
  const fillPct = (Math.min(worked, estimate || worked) / scale) * 100;
  const overPct = over ? ((worked - estimate) / scale) * 100 : 0;
  const pct = estimate ? Math.round((worked / estimate) * 100) : null;

  return (
    <div className={cn("w-full", compact ? "space-y-1" : "space-y-1.5")}>
      <div className={cn("relative flex w-full overflow-hidden rounded-full bg-line/70", compact ? "h-1.5" : "h-2")}>
        <div className="h-full rounded-l-full bg-brand" style={{ width: `${fillPct}%` }} />
        {over && <div className="h-full bg-warn ml-[2px] rounded-r-full" style={{ width: `${overPct}%` }} />}
        {over && <div className="absolute top-0 h-full w-[2px] bg-ink" style={{ left: `${(estimate / scale) * 100}%` }} title="Estimativa" />}
      </div>
      {!compact && (
        <div className="flex justify-between text-[12px] text-ink-3 tnum">
          <span>{pct === null ? "Sem estimativa" : `${pct}% da estimativa`}</span>
          {over && <span className="text-warn font-medium">+{fmtHM(worked - estimate)} acima</span>}
        </div>
      )}
    </div>
  );
}
