"use client";

import { AlertTriangle, BellRing, CalendarDays, ChevronLeft, ChevronRight, Moon, MoonStar, RefreshCw, Sun, Sunrise, Sunset } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, EmptyState, IconButton, Panel, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { PRAYER_METHODS } from "@/features/dashboard/prayer-methods";
import { formatHHMM, todayKey, zonedParts } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { ISLAMIC_DATES, PRAYER_NAMES, PRAYER_UR, islamicDateFor } from "./islamic-dates";
import { formatCountdown, minutesUntil, usePrayerToday } from "./use-prayer";

interface MonthDay {
  date: string;
  weekday: string;
  hijri: { day: number; month: number; monthName: string; monthAr: string; year: number };
  timings: Record<string, string>;
}

const ICONS = { Fajr: Sunrise, Sunrise: Sun, Dhuhr: Sun, Asr: Sun, Maghrib: Sunset, Isha: Moon } as const;

export function NamazPage() {
  const settings = usePersisted(settingsStore);
  const now = useNow();
  const tz = settings.timezone;
  const today = now ? todayKey(tz) : null;
  const parts = now ? zonedParts(now, tz) : null;
  const { data, error, loading, reload } = usePrayerToday();

  const [offset, setOffset] = useState(0);
  const month = useMemo(() => {
    if (!parts) return null;
    const d = new Date(Date.UTC(parts.year, parts.month - 1 + offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }, [parts?.year, parts?.month, offset]); // eslint-disable-line react-hooks/exhaustive-deps
  const loc = settings.location;
  const cal = useFetch<{ days: MonthDay[]; method: string }>(
    loc && month
      ? `/api/prayer/month?lat=${loc.latitude}&lon=${loc.longitude}&method=${settings.prayerMethod}&school=${settings.asrSchool}&year=${month.year}&month=${month.month}&tz=${encodeURIComponent(tz)}`
      : null,
  );

  if (!loc) {
    return (
      <Panel className="mx-auto mt-6 max-w-lg">
        <EmptyState icon={<MoonStar className="size-5" />} title="Set your city for prayer times" action={<Link href="/settings#location" className="text-sm text-emerald underline">Choose location</Link>} />
      </Panel>
    );
  }

  const current = parts ? `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}` : "";
  const next = data ? (PRAYER_NAMES.find((p) => data.timings[p].slice(0, 5) > current) ?? "Fajr") : undefined;
  const nextAt = data && next ? data.timings[next].slice(0, 5) : undefined;
  const countdown = nextAt && parts ? formatCountdown(minutesUntil(nextAt, parts)) : "";
  const upcoming = cal.data?.days.filter((d) => islamicDateFor(d.hijri.month, d.hijri.day) && (!today || d.date >= today)) ?? [];
  const monthLabel = month ? new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(month.year, month.month - 1, 1))) : "";
  const hijriSpan = cal.data?.days.length ? `${cal.data.days[0].hijri.monthName} – ${cal.data.days.at(-1)!.hijri.monthName} ${cal.data.days.at(-1)!.hijri.year} AH` : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <MoonStar className="size-7 text-emerald" aria-hidden /> Namaz <span className="font-urdu text-xl text-ink-2" lang="ur">نماز</span>
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {loc.name} · {PRAYER_METHODS[settings.prayerMethod]} · {settings.asrSchool === 1 ? "Hanafi Asr" : "Standard Asr"}
          </p>
        </div>
        <Link href="/settings#location" className="text-xs text-ink-2 underline underline-offset-2 hover:text-ink">
          Change location or method
        </Link>
      </div>

      {error ? (
        <Panel>
          <EmptyState tone="error" icon={<AlertTriangle className="size-5" />} title="Prayer times are unavailable right now" description="Please rely on your local masjid timetable." action={<Button size="sm" onClick={reload}><RefreshCw className="size-4" /> Try again</Button>} />
        </Panel>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Panel className="relative overflow-hidden p-6 md:p-8" aria-label="Next prayer">
            <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-emerald/10 blur-3xl" />
            {loading && !data ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-64" />
              </div>
            ) : data && next && nextAt ? (
              <>
                <p className="text-sm text-ink-2">{data.hijri}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">Next prayer</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-4">
                  <span className="font-display text-5xl font-semibold md:text-6xl">{next}</span>
                  <span lang="ur" className="font-urdu text-3xl text-ink-2">{PRAYER_UR[next]}</span>
                </p>
                <p className="mt-2 text-2xl tabular-nums text-ink md:text-3xl">
                  {formatHHMM(nextAt)} <span className="text-base text-ink-2">· in {countdown}</span>
                </p>
                <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((p) => {
                    const Icon = ICONS[p];
                    const active = p === next;
                    return (
                      <li key={p} className={cn("flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center", active ? "border-emerald/40 bg-emerald/12 text-emerald" : "border-white/8 bg-white/[0.03] text-ink-2", p === "Sunrise" && "opacity-70")}>
                        <Icon className="size-5" aria-hidden />
                        <span className="text-xs">{p}</span>
                        <span className={cn("text-sm font-semibold tabular-nums", active ? "text-emerald" : "text-ink")}>{formatHHMM(data.timings[p].slice(0, 5))}</span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-4 flex items-center gap-2 text-xs text-ink-3">
                  <BellRing className="size-3.5" />
                  {settings.prayerReminders.length
                    ? `On-screen reminder at ${settings.prayerReminders.join(", ")}${settings.reminderChime ? " with a soft chime" : ""}.`
                    : "Prayer reminders are off."}{" "}
                  <Link href="/settings#namaz" className="underline underline-offset-2">Change</Link>
                </p>
              </>
            ) : null}
          </Panel>

          <Panel className="p-5 md:p-6" aria-labelledby="dates-title">
            <h2 id="dates-title" className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-gold" /> Islamic dates
            </h2>
            {upcoming.length ? (
              <ul className="mt-3 space-y-2">
                {upcoming.map((d) => {
                  const ev = islamicDateFor(d.hijri.month, d.hijri.day)!;
                  return (
                    <li key={d.date} className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/8 px-3 py-2.5">
                      <span>
                        <span className="block text-sm text-ink">{ev.name}</span>
                        <span lang="ur" className="font-urdu text-sm text-ink-2">{ev.nameUr}</span>
                      </span>
                      <span className="text-end text-xs text-ink-2">
                        {new Date(d.date + "T00:00:00Z").toLocaleDateString("en-PK", { day: "numeric", month: "short", timeZone: "UTC" })}
                        <br />
                        {d.hijri.day} {d.hijri.monthName}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-2">No major Islamic dates {offset === 0 ? "left this month" : "in this month"}.</p>
            )}
            <details className="mt-4 text-xs text-ink-3">
              <summary className="cursor-pointer hover:text-ink-2">Dates we mark</summary>
              <p className="mt-2">{ISLAMIC_DATES.map((d) => d.name).join(" · ")}.</p>
            </details>
            <p className="mt-3 text-[11px] text-ink-3">Calculated Hijri dates — Pakistan&apos;s official dates follow the Ruet-e-Hilal moon sighting and can differ by a day.</p>
          </Panel>
        </div>
      )}

      <Panel className="glass-reading p-4 sm:p-5" aria-labelledby="timetable-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="timetable-title" className="text-sm font-semibold">
            Monthly timetable · {monthLabel} <span className="font-normal text-ink-3">{hijriSpan}</span>
          </h2>
          <div className="flex items-center gap-1">
            <IconButton label="Previous month" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft className="size-4 rtl:-scale-x-100" />
            </IconButton>
            <Button size="sm" variant="ghost" onClick={() => setOffset(0)} disabled={offset === 0}>
              This month
            </Button>
            <IconButton label="Next month" onClick={() => setOffset((o) => o + 1)}>
              <ChevronRight className="size-4 rtl:-scale-x-100" />
            </IconButton>
          </div>
        </div>
        {cal.error ? (
          <p className="mt-4 text-sm text-coral">Timetable unavailable: {cal.error}</p>
        ) : !cal.data ? (
          <div className="mt-4 space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8" />)}</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-3 rtl:text-right">
                  <th className="py-2 pe-3 font-semibold">Date</th>
                  <th className="py-2 pe-3 font-semibold">Hijri</th>
                  {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => (
                    <th key={p} className="py-2 pe-3 font-semibold">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cal.data.days.map((d) => {
                  const isToday = d.date === today;
                  const ev = islamicDateFor(d.hijri.month, d.hijri.day);
                  return (
                    <tr key={d.date} className={cn("border-t border-white/6", isToday && "bg-emerald/10 text-ink", d.weekday === "Friday" && !isToday && "bg-white/[0.025]")} aria-current={isToday ? "date" : undefined}>
                      <td className="py-2 pe-3 whitespace-nowrap">
                        {Number(d.date.slice(8))} {d.weekday.slice(0, 3)}
                        {isToday && <Badge tone="emerald" className="ms-2">Today</Badge>}
                      </td>
                      <td className="py-2 pe-3 whitespace-nowrap text-ink-2">
                        {d.hijri.day} {d.hijri.monthName.split(" ")[0]}
                        {ev && <Badge tone="gold" className="ms-2">{ev.name}</Badge>}
                      </td>
                      {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => (
                        <td key={p} className={cn("py-2 pe-3", p === "Sunrise" ? "text-ink-3" : "text-ink")}>{formatHHMM(d.timings[p]).replace(/ (AM|PM)/, "")}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <SourceNote className="mt-3">
          Calculated by the AlAdhan API ({cal.data?.method ?? PRAYER_METHODS[settings.prayerMethod]}). Fridays are shaded. Times can differ from your local masjid by a few minutes.
        </SourceNote>
      </Panel>
    </div>
  );
}
