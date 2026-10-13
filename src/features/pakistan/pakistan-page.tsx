"use client";

import { CalendarDays, ExternalLink, Flag, History, RefreshCw, Shuffle } from "lucide-react";
import { useState } from "react";
import { Badge, Button, EmptyState, IconButton, Panel, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { todayKey } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { NATIONAL_DATES, type NationalDate, rekhtaLink, sherForDate, wikiUrl } from "./data";

interface OnThisDay {
  items: { kind: "event" | "birth" | "death"; year: number; text: string; url?: string }[];
  source: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDay = (n: NationalDate) => `${n.day} ${MONTHS[n.month - 1]}`;

/** National dates ordered from today onwards, each with days remaining. */
export function upcomingDates(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  return NATIONAL_DATES.map((n) => {
    let t = Date.UTC(y, n.month - 1, n.day);
    if (t < today) t = Date.UTC(y + 1, n.month - 1, n.day);
    return { ...n, inDays: Math.round((t - today) / 86_400_000) };
  }).sort((a, b) => a.inDays - b.inDays);
}

function useToday() {
  const { timezone } = usePersisted(settingsStore);
  const now = useNow();
  return now ? todayKey(timezone) : null;
}

export function PakistanPage() {
  const today = useToday();
  const [, m, d] = today ? today.split("-").map(Number) : [0, 0, 0];
  const { data, error, loading, reload } = useFetch<OnThisDay>(today ? `/api/onthisday?month=${m}&day=${d}` : null);
  const upcoming = today ? upcomingDates(today) : [];
  const todays = upcoming.filter((n) => n.inDays === 0);
  const next = upcoming.find((n) => n.inDays > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex flex-wrap items-center gap-x-3 text-2xl font-semibold tracking-tight md:text-3xl">
          <Flag className="size-7 text-emerald" aria-hidden /> Tareekh &amp; Kalam{" "}
          <span className="font-urdu text-xl text-ink-2" lang="ur">تاریخ و کلام</span>
        </h1>
        <p className="mt-1 text-sm text-ink-2">Pakistan&apos;s national days, this day in history, and a couplet from Iqbal or Ghalib.</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {!today ? (
            <Skeleton className="h-40" />
          ) : todays.length > 0 ? (
            todays.map((n) => <TodayHero key={n.title} n={n} />)
          ) : (
            next && <NextHero n={next} />
          )}

          <SherCard date={today} />

          <Panel className="glass-reading p-4 sm:p-5" aria-labelledby="otd-title">
            <h2 id="otd-title" className="flex items-center gap-2 text-sm font-semibold">
              <History className="size-4 text-cyan" aria-hidden /> On this day in Pakistan
              {today && <span className="font-normal text-ink-3">· {d} {MONTHS[m - 1]}</span>}
            </h2>
            {error ? (
              <EmptyState
                tone="error"
                title="Wikipedia couldn't be reached"
                description={error}
                action={
                  <Button size="sm" onClick={reload}>
                    <RefreshCw className="size-4" /> Try again
                  </Button>
                }
              />
            ) : loading || !data ? (
              <div className="mt-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data.items.length === 0 ? (
              <p className="mt-4 text-sm text-ink-2">Wikipedia lists no Pakistan-related events for today. The national calendar is alongside.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {data.items.map((it, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <span className="w-12 shrink-0 font-semibold tabular-nums text-gold">{it.year}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-ink">
                        {it.kind === "birth" && <Badge tone="emerald" className="me-2">Born</Badge>}
                        {it.kind === "death" && <Badge className="me-2">Died</Badge>}
                        {it.text}
                      </p>
                      {it.url && (
                        <a href={it.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
                          Read on Wikipedia <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <SourceNote className="mt-4">
              From Wikipedia&apos;s &ldquo;On this day&rdquo; feed, filtered for Pakistan-related entries. Text is CC BY-SA 4.0.
            </SourceNote>
          </Panel>
        </div>

        <Panel className="p-4 sm:p-5 xl:self-start" aria-labelledby="cal-title">
          <h2 id="cal-title" className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-gold" aria-hidden /> National calendar
          </h2>
          {!today ? (
            <Skeleton className="mt-4 h-96" />
          ) : (
            <ol className="mt-3 divide-y divide-white/8">
              {upcoming.map((n) => (
                <li key={n.title}>
                  <a
                    href={wikiUrl(n.wiki)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn("flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.04]", n.inDays === 0 && "bg-emerald/[0.08]")}
                  >
                    <span className="w-14 shrink-0 text-xs font-semibold text-ink-2">{fmtDay(n)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{n.title}</span>
                      <span className="block truncate font-urdu text-xs leading-loose text-ink-3" lang="ur" dir="rtl">
                        {n.titleUr}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-3">{n.inDays === 0 ? "Today" : `in ${n.inDays}d`}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
          <SourceNote className="mt-3">Each entry links to its Wikipedia article.</SourceNote>
        </Panel>
      </div>
    </div>
  );
}

function TodayHero({ n }: { n: NationalDate }) {
  return (
    <Panel className="relative overflow-hidden p-5 sm:p-7" aria-labelledby="today-title">
      <div className="absolute inset-y-0 start-0 w-1.5 bg-emerald" aria-hidden />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">Today · {fmtDay(n)}</p>
      <h2 id="today-title" className="mt-2 font-display text-3xl text-ink md:text-4xl">{n.title}</h2>
      <p className="font-urdu mt-1 text-2xl leading-loose text-ink-2" lang="ur" dir="rtl">{n.titleUr}</p>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-2">{n.note}</p>
      <a href={wikiUrl(n.wiki)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-ink-3 underline underline-offset-2 hover:text-ink">
        Read more on Wikipedia <ExternalLink className="size-3.5" />
      </a>
    </Panel>
  );
}

function NextHero({ n }: { n: NationalDate & { inDays: number } }) {
  return (
    <Panel className="flex flex-wrap items-center gap-5 p-5 sm:p-6" aria-labelledby="next-title">
      <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-center">
        <span>
          <span className="block text-3xl font-semibold tabular-nums text-ink">{n.inDays}</span>
          <span className="block text-[10px] uppercase tracking-widest text-ink-3">{n.inDays === 1 ? "day" : "days"}</span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Coming up · {fmtDay(n)}</p>
        <h2 id="next-title" className="mt-1 text-xl font-semibold text-ink">
          {n.title} <span className="font-urdu text-lg font-normal text-ink-2" lang="ur">{n.titleUr}</span>
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{n.note}</p>
      </div>
    </Panel>
  );
}

/** Couplet of the day in large Nastaliq; also used on Home. */
export function SherCard({ date, compact = false, className }: { date: string | null; compact?: boolean; className?: string }) {
  const [offset, setOffset] = useState(0);
  if (!date) return <Skeleton className={cn(compact ? "h-36" : "h-52", className)} />;
  const sher = sherForDate(date, offset);
  return (
    <Panel className={cn(compact ? "p-4 sm:p-5" : "p-5 sm:p-7", className)} aria-labelledby={compact ? "sher-home-title" : "sher-title"}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={compact ? "sher-home-title" : "sher-title"} className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Sher of the day
        </h2>
        <IconButton label="Show another couplet" size="sm" onClick={() => setOffset((o) => o + 1)}>
          <Shuffle className="size-4" />
        </IconButton>
      </div>
      <blockquote lang="ur" dir="rtl" className={cn("font-urdu mt-3 text-center text-ink", compact ? "text-xl leading-[2.4]" : "text-2xl leading-[2.4] sm:text-3xl sm:leading-[2.4]")}>
        <p>{sher.lines[0]}</p>
        <p>{sher.lines[1]}</p>
      </blockquote>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-xs text-ink-3">
        <span className="font-urdu text-sm" lang="ur">{sher.poetUr}</span>
        <span>· {sher.poet} ·</span>
        <a href={rekhtaLink(sher)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink">
          Rekhta <ExternalLink className="size-3" />
        </a>
      </p>
    </Panel>
  );
}

