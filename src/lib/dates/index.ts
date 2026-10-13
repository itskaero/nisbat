/**
 * Time-zone aware date helpers. Everything user-facing is computed in the
 * user's configured IANA zone (default Asia/Karachi), never the server's.
 */

export const PAKISTAN_TZ = "Asia/Karachi";

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function safeTz(tz: string) {
  return isValidTimeZone(tz) ? tz : PAKISTAN_TZ;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

export function zonedParts(date: Date, tz: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTz(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: weekdays.indexOf(map.weekday),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for `date` in `tz`. */
export function dateKey(date: Date, tz: string): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function todayKey(tz: string): string {
  return dateKey(new Date(), tz);
}

/** Add whole days to a YYYY-MM-DD key (calendar arithmetic, zone-free). */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function nowHHMM(tz: string): string {
  const p = zonedParts(new Date(), tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export type DayPart = "morning" | "afternoon" | "evening" | "night";

export function dayPart(tz: string, date = new Date()): DayPart {
  const h = zonedParts(date, tz).hour;
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export function formatLongDate(date: Date, tz: string, locale = "en-PK"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: safeTz(tz),
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date, tz: string, locale = "en-PK"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: safeTz(tz),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Human label for a YYYY-MM-DD key relative to today in tz. */
export function relativeDayLabel(key: string, tz: string): string {
  const today = todayKey(tz);
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  if (key === addDays(today, -1)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(y !== Number(today.slice(0, 4)) ? { year: "numeric" } : {}),
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "12:30" → "12:30 PM" without involving time zones. */
export function formatHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function timeAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.round((now - t) / 1000);
  if (s < 0) return "just now";
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(t).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export const COMMON_TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Doha",
  "Europe/London",
  "America/New_York",
  "America/Toronto",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];
