import { useState } from "preact/hooks";
import { sherForDate, upcomingDates } from "@/features/pakistan/data";
import { todayKey } from "@/lib/dates";
import { Card, ScreenHeader, Skeleton, Source, cx } from "../components/ui";
import { useCached } from "../lib/cached";
import { useSettings } from "../lib/data";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function PakistanScreen() {
  const { timezone } = useSettings();
  const today = todayKey(timezone);
  const [, m, d] = today.split("-").map(Number);
  const dates = upcomingDates(today);
  const todays = dates.filter((n) => n.inDays === 0);
  const next = dates.find((n) => n.inDays > 0);
  const [offset, setOffset] = useState(0);
  const sher = sherForDate(today, offset);
  const otd = useCached<{ items: { kind: string; year: number; text: string }[] }>(`/api/onthisday?month=${m}&day=${d}`, 24 * 3600_000);

  return (
    <>
      <ScreenHeader title="Tareekh & Kalam" ur="تاریخ و کلام" sub="Pakistan's national days, this day in history, and a couplet from Iqbal or Ghalib." />
      <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
        <div class="flex flex-col gap-6">
          {todays.length > 0
            ? todays.map((n) => (
                <Card key={n.title} title={`Today · ${n.day} ${MONTHS[n.month - 1]}`} class="!border-emerald/50">
                  <p class="font-display text-[2.8rem] leading-tight">{n.title}</p>
                  <p lang="ur" class="font-urdu text-2xl text-ink-2">
                    {n.titleUr}
                  </p>
                  <p class="mt-2 text-xl text-ink-2">{n.note}</p>
                </Card>
              ))
            : next && (
                <Card title={`Coming up · ${next.day} ${MONTHS[next.month - 1]}`}>
                  <div class="flex items-center gap-6">
                    <div class="grid size-28 shrink-0 place-items-center rounded-3xl bg-white/[0.05] text-center">
                      <span>
                        <span class="block text-5xl font-semibold tabular-nums">{next.inDays}</span>
                        <span class="text-sm uppercase tracking-widest text-ink-3">{next.inDays === 1 ? "day" : "days"}</span>
                      </span>
                    </div>
                    <div>
                      <p class="text-3xl font-semibold">{next.title}</p>
                      <p lang="ur" class="font-urdu text-xl text-ink-2">
                        {next.titleUr}
                      </p>
                      <p class="mt-1 text-lg text-ink-2">{next.note}</p>
                    </div>
                  </div>
                </Card>
              )}
          <button type="button" data-autofocus class="card block p-7 text-center" onClick={() => setOffset((o) => o + 1)}>
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Sher of the day · OK for another</p>
            <div lang="ur" dir="rtl" class="font-urdu mt-3 text-[2.2rem] leading-[2.4]">
              <p>{sher.lines[0]}</p>
              <p>{sher.lines[1]}</p>
            </div>
            <p class="text-lg text-ink-3">
              <span lang="ur" class="font-urdu">
                {sher.poetUr}
              </span>{" "}
              · {sher.poet}
            </p>
          </button>
          <Card title={`On this day in Pakistan · ${d} ${MONTHS[m - 1]}`}>
            {!otd.data ? (
              <Skeleton class="h-32" />
            ) : otd.data.items.length === 0 ? (
              <p class="text-lg text-ink-2">Wikipedia lists no Pakistan-related events for today.</p>
            ) : (
              <ol class="space-y-3">
                {otd.data.items.slice(0, 6).map((it, i) => (
                  <li key={i} class="flex gap-4 text-lg">
                    <span class="w-16 shrink-0 font-semibold tabular-nums text-gold">{it.year}</span>
                    <span class="text-ink-2">
                      {it.kind === "birth" ? "Born: " : it.kind === "death" ? "Died: " : ""}
                      {it.text}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <Source>From Wikipedia&apos;s &ldquo;On this day&rdquo; feed, filtered for Pakistan (CC BY-SA 4.0).</Source>
          </Card>
        </div>
        <Card title="National calendar" class="h-fit">
          <ol class="divide-y divide-line">
            {dates.map((n) => (
              <li key={n.title} class={cx("flex items-center gap-4 py-3", n.inDays === 0 && "text-emerald")}>
                <span class="w-24 shrink-0 text-base font-semibold text-ink-2">
                  {n.day} {MONTHS[n.month - 1].slice(0, 3)}
                </span>
                <span class="min-w-0 flex-1 truncate text-lg">{n.title}</span>
                <span class="text-base tabular-nums text-ink-3">{n.inDays === 0 ? "Today" : `${n.inDays}d`}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
