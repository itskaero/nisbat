import { ISLAMIC_DATES, PRAYER_UR, islamicDateFor } from "@/features/namaz/islamic-dates";
import { formatHHMM, todayKey, zonedParts } from "@/lib/dates";
import { Card, Problem, ScreenHeader, Skeleton, Source, cx } from "../components/ui";
import { useCached, useNow } from "../lib/cached";
import { PRAYERS, nextPrayer, usePrayer, useSettings } from "../lib/data";

interface MonthDay {
  date: string;
  weekday: string;
  hijri: { day: number; month: number; monthName: string; monthAr: string; year: number };
  timings: Record<string, string>;
}

export function NamazScreen() {
  const s = useSettings();
  const now = useNow(1000);
  const prayer = usePrayer();
  const next = nextPrayer(prayer.data, s.timezone, now);
  const { year, month } = zonedParts(now, s.timezone);
  const loc = s.location;
  const monthData = useCached<{ days: MonthDay[]; method: string; provider: string }>(
    loc ? `/api/prayer/month?lat=${loc.latitude}&lon=${loc.longitude}&method=${s.prayerMethod}&school=${s.asrSchool}&month=${month}&year=${year}` : null,
    24 * 3600_000,
  );
  const todayStr = todayKey(s.timezone);
  const days = monthData.data?.days ?? [];
  const idx = Math.max(0, days.findIndex((d) => d.date === todayStr));
  const week = days.slice(idx, idx + 7);
  const upcoming = days
    .slice(idx)
    .map((d) => ({ d, ev: islamicDateFor(d.hijri.month, d.hijri.day) }))
    .filter((x) => x.ev)
    .slice(0, 3);

  if (!loc) return <Problem title="Choose your city in Settings to see prayer times" />;

  return (
    <>
      <ScreenHeader title="Namaz" ur="نماز" sub={`${loc.name} · ${prayer.data?.method ?? ""}`} />
      {prayer.error && !prayer.data ? (
        <Problem title="Prayer times are unavailable" text={prayer.error} onRetry={prayer.reload} />
      ) : (
        <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6">
          <Card title="Today" right={prayer.data && <span class="text-lg text-ink-2">{prayer.data.hijri}</span>}>
            {!prayer.data ? (
              <Skeleton class="h-72" />
            ) : (
              <ul class="space-y-3">
                {(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((k) => (
                  <li key={k}>
                    <button
                      type="button"
                      data-autofocus={next?.name === k ? "" : undefined}
                      class={cx("flex w-full items-center justify-between rounded-2xl px-6 py-4 text-start", next?.name === k ? "bg-emerald/15 text-emerald" : "bg-white/[0.04]")}
                    >
                      <span class="text-2xl font-medium">
                        {k}{" "}
                        <span lang="ur" class="font-urdu ms-2 text-xl opacity-75">
                          {PRAYER_UR[k]}
                        </span>
                      </span>
                      <span class="text-3xl font-semibold tabular-nums">{formatHHMM(prayer.data!.timings[k].slice(0, 5))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div class="flex flex-col gap-6">
            {next && (
              <Card title="Next prayer">
                <p class="font-display text-[4rem] font-semibold leading-none">{next.name}</p>
                <p class="mt-2 text-2xl text-emerald">
                  {formatHHMM(next.at)} · {next.inText}
                </p>
              </Card>
            )}
            <Card title="Coming days">
              {!week.length ? (
                <Skeleton class="h-48" />
              ) : (
                <table class="w-full text-lg tabular-nums">
                  <thead>
                    <tr class="text-sm uppercase tracking-wider text-ink-3">
                      <th class="pb-2 text-start font-medium">Day</th>
                      {PRAYERS.map((k) => (
                        <th key={k} class="pb-2 text-end font-medium">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {week.map((d) => (
                      <tr key={d.date} class={cx("border-t border-line", d.date === todayStr && "text-emerald")}>
                        <td class="py-2">
                          {d.weekday.slice(0, 3)} {Number(d.date.slice(8))}
                          <span class="ms-2 text-sm text-ink-3">
                            {d.hijri.day} {d.hijri.monthName.split(" ")[0]}
                          </span>
                        </td>
                        {PRAYERS.map((k) => (
                          <td key={k} class="py-2 text-end">
                            {formatHHMM(d.timings[k].slice(0, 5)).replace(/\s?[AP]M$/, "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            {upcoming.length > 0 && (
              <Card title="Islamic dates ahead">
                <ul class="space-y-2 text-lg">
                  {upcoming.map(({ d, ev }) => (
                    <li key={d.date} class="flex justify-between gap-4">
                      <span>
                        {ev!.name}{" "}
                        <span lang="ur" class="font-urdu text-base text-ink-3">
                          {ev!.nameUr}
                        </span>
                      </span>
                      <span class="text-ink-2">{d.date === todayStr ? "Today" : new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
      <Source>
        Times calculated by the AlAdhan API. Hijri dates are calculated; Pakistan&apos;s official dates follow the Ruet-e-Hilal moon sighting and can differ by a
        day. {ISLAMIC_DATES.length} key dates are tracked.
      </Source>
    </>
  );
}
