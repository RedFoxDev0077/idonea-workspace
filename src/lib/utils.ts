import clsx, { type ClassValue } from "clsx";
import { differenceInSeconds, format, isSameDay, isToday, isTomorrow, isYesterday, parseISO, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TimeEntry, User } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");

/** 1.5 -> "1,50" (Asana-style decimal hours) */
export const fmtDec = (h: number) => h.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** seconds -> "01:05:09" */
export const fmtClock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return [h, m, r].map((x) => String(x).padStart(2, "0")).join(":");
};

/** hours -> "3h 20m" */
export const fmtHM = (hours: number) => {
  const mins = Math.round(hours * 60);
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
};

export const entrySeconds = (e: TimeEntry, now = new Date()) =>
  differenceInSeconds(e.end ? parseISO(e.end) : now, parseISO(e.start));

export const entryHours = (e: TimeEntry, now = new Date()) => entrySeconds(e, now) / 3600;

/** Asana-style relative day label: "Hoje", "Amanhã", "Segunda-feira", "4 nov" */
export const dayLabel = (iso: string | null) => {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  if (isYesterday(d)) return "Ontem";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 0 && diff < 7) {
    const w = format(d, "EEEE", { locale: ptBR });
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  return format(d, "d MMM", { locale: ptBR }).replace(".", "");
};

export const isOverdue = (iso: string | null) => !!iso && differenceInCalendarDays(parseISO(iso), new Date()) < 0;

/**
 * Edit rule agreed with the client: members may edit their own entries only on the
 * same day they were recorded; afterwards only admins can change them (and every
 * change is logged with before/after).
 */
export const canEditEntry = (e: TimeEntry, user: User) =>
  user.role === "admin" || (e.userId === user.id && isSameDay(parseISO(e.start), new Date()));

export const fmtDate = (iso: string, pattern = "d MMM yyyy") => format(parseISO(iso), pattern, { locale: ptBR });

/** readable text color for a colored chip background */
export const chipStyle = (hex: string) => ({
  backgroundColor: `${hex}26`,
  color: hex,
  boxShadow: `inset 0 0 0 1px ${hex}40`,
});
