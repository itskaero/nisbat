import { Shuffle } from "lucide-react";
import { useState } from "react";
import { sherForDate, upcomingDates } from "@/features/pakistan/data";
import { todayKey } from "@/lib/dates";
import { Card, Page, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";
import { tap } from "../lib/native";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PakistanScreen() {
  const { timezone } = useSettings();
  const today = todayKey(timezone);
  const [, m, d] = today.split("-").map(Number);
  const dates = upcomingDates(today);
  const todays = dates.filter((n) => n.inDays === 0);
  const next = dates.find((n) => n.inDays > 0);
  const [offset, setOffset] = useState(0);
  const sher = sherForDate(today, offset);
  const otd = useCached<{ items: { kind: string; year: number; text: string; url?: string }[] }>(`/api/onthisday?month=${m}&day=${d}`, 24 * 3600_000);

  return (
    <Page title="Tareekh & Kalam" ur="تاریخ و کلام" back>
      {todays.map((n) => (
        <div key={n.title} className="glass mb-3 !border-emerald/50 p-5">
          <p className="text-xs uppercase tracking-wider text-emerald">Today</p>
          <p className="font-display mt-1 text-3xl leading-tight">{n.title}</p>
          <p lang="ur" className="font-urdu text-lg text-ink-2">
            {n.titleUr}
          </p>
          <p className="mt-1 text-sm text-ink-2">{n.note}</p>
        </div>
      ))}
      {!todays.length && next && (
        <div className="glass mb-3 flex items-center gap-4 p-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-center">
            <span>
              <span className="block text-2xl font-semibold tabular-nums">{next.inDays}</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-3">days</span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-gold">
              Coming up · {next.day} {MONTHS[next.month - 1]}
            </p>
            <p className="font-semibold">{next.title}</p>
            <p className="line-clamp-2 text-sm text-ink-2">{next.note}</p>
          </div>
        </div>
      )}
      <div className="glass p-5 text-center">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-gold">Sher of the day</p>
          <button
            type="button"
            aria-label="Another couplet"
            className="press grid size-9 place-items-center rounded-full bg-white/[0.06]"
            onClick={() => {
              void tap();
              setOffset((o) => o + 1);
            }}
          >
            <Shuffle size={16} />
          </button>
        </div>
        <div lang="ur" dir="rtl" className="font-urdu mt-2 text-[1.35rem] leading-[2.4]">
          <p>{sher.lines[0]}</p>
          <p>{sher.lines[1]}</p>
        </div>
        <p className="text-sm text-ink-3">
          <span lang="ur" className="font-urdu">
            {sher.poetUr}
          </span>{" "}
          · {sher.poet}
        </p>
      </div>
      <Card className="mt-3" title={`On this day · ${d} ${MONTHS[m - 1]}`}>
        {!otd.data ? (
          <Skeleton className="h-24" />
        ) : otd.data.items.length === 0 ? (
          <p className="text-sm text-ink-2">No Pakistan-related events listed for today.</p>
        ) : (
          <ol className="space-y-2">
            {otd.data.items.slice(0, 8).map((it, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-11 shrink-0 font-semibold tabular-nums text-gold">{it.year}</span>
                <span className="text-ink-2">
                  {it.kind === "birth" ? "Born: " : it.kind === "death" ? "Died: " : ""}
                  {it.text}
                </span>
              </li>
            ))}
          </ol>
        )}
        <Source>Wikipedia &ldquo;On this day&rdquo;, filtered for Pakistan (CC BY-SA 4.0).</Source>
      </Card>
      <Card className="mt-3" title="National calendar">
        <ol className="divide-y divide-line">
          {dates.map((n) => (
            <li key={n.title} className={cx("flex items-center gap-3 py-2 text-sm", n.inDays === 0 && "text-emerald")}>
              <span className="w-14 shrink-0 text-xs font-semibold text-ink-2">
                {n.day} {MONTHS[n.month - 1]}
              </span>
              <span className="min-w-0 flex-1 truncate">{n.title}</span>
              <span className="text-xs tabular-nums text-ink-3">{n.inDays === 0 ? "Today" : `${n.inDays}d`}</span>
            </li>
          ))}
        </ol>
      </Card>
    </Page>
  );
}
