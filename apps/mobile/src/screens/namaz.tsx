import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { PRAYER_UR, islamicDateFor } from "@/features/namaz/islamic-dates";
import { formatHHMM, todayKey, zonedParts } from "@/lib/dates";
import { settingsStore } from "@/lib/storage/stores";
import { Card, Page, Problem, Skeleton, Source, cx } from "../components/ui";
import { useNow } from "../lib/cached";
import { PRAYERS, nextPrayer, usePrayer, usePrayerMonth, useSettings } from "../lib/data";
import { isNative, tap } from "../lib/native";
import { notificationsEnabled, schedulePrayerNotifications, setNotificationsEnabled } from "../lib/notify";
import { toast } from "../lib/toast";

export function NamazScreen() {
  const s = useSettings();
  const now = useNow(15_000);
  const prayer = usePrayer();
  const next = nextPrayer(prayer.data, s.timezone, now);
  const { year, month } = zonedParts(now, s.timezone);
  const monthData = usePrayerMonth(year, month);
  const today = todayKey(s.timezone);
  const days = monthData.data?.days ?? [];
  const idx = Math.max(0, days.findIndex((d) => d.date === today));
  const [notify, setNotify] = useState(true);
  useEffect(() => {
    void notificationsEnabled().then(setNotify);
  }, []);

  if (!s.location) return <Page title="Namaz" ur="نماز"><Problem title="Choose your city in Settings to see prayer times" /></Page>;

  const toggleReminder = (k: (typeof PRAYERS)[number]) => {
    void tap();
    settingsStore.set((x) => ({ ...x, prayerReminders: x.prayerReminders.includes(k) ? x.prayerReminders.filter((p) => p !== k) : [...x.prayerReminders, k] }));
    void schedulePrayerNotifications();
  };

  return (
    <Page title="Namaz" ur="نماز">
      {next && (
        <div className="glass p-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Next prayer</p>
          <p className="font-display mt-1 text-5xl font-semibold">{next.name}</p>
          <p className="mt-1 text-emerald">
            {formatHHMM(next.at)} · {next.inText}
          </p>
          <p className="mt-1 text-xs text-ink-3">{prayer.data?.hijri}</p>
        </div>
      )}
      {prayer.error && !prayer.data ? (
        <div className="mt-3">
          <Problem title="Prayer times are unavailable" text={prayer.error} onRetry={prayer.reload} />
        </div>
      ) : !prayer.data ? (
        <Skeleton className="mt-3 h-64" />
      ) : (
        <Card className="mt-3" title={`Today · ${s.location.name}`}>
          <ul className="space-y-1.5">
            {(["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((k) => {
              const isPrayer = k !== "Sunrise";
              const on = isPrayer && s.prayerReminders.includes(k);
              return (
                <li key={k} className={cx("flex items-center gap-3 rounded-2xl px-3 py-2.5", next?.name === k ? "bg-emerald/15 text-emerald" : "bg-white/[0.04]")}>
                  <span className="flex-1 text-lg">
                    {k}{" "}
                    <span lang="ur" className="font-urdu ms-1 text-sm opacity-70">
                      {PRAYER_UR[k]}
                    </span>
                  </span>
                  <span className="text-lg font-semibold tabular-nums">{formatHHMM(prayer.data!.timings[k].slice(0, 5))}</span>
                  {isPrayer && isNative && (
                    <button type="button" aria-label={on ? `Turn off ${k} reminder` : `Remind me at ${k}`} className="press grid size-9 place-items-center rounded-full bg-white/[0.06]" onClick={() => toggleReminder(k)}>
                      {on && notify ? <Bell size={16} /> : <BellOff size={16} className="opacity-50" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {isNative && (
            <button
              type="button"
              className="chip press mt-3"
              aria-pressed={notify}
              onClick={async () => {
                await setNotificationsEnabled(!notify);
                setNotify(!notify);
                toast(!notify ? "Prayer notifications on" : "Prayer notifications off", "info");
              }}
            >
              {notify ? "Notifications on" : "Notifications off"}
            </button>
          )}
        </Card>
      )}
      <Card className="mt-3" title="This month">
        {!days.length ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="no-scrollbar -mx-1 max-h-[26rem] overflow-y-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-[#111a2a]">
                <tr className="text-[10px] uppercase tracking-wider text-ink-3">
                  <th className="py-2 text-start font-medium">Day</th>
                  {PRAYERS.map((k) => (
                    <th key={k} className="py-2 text-end font-medium">
                      {k.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.slice(idx).map((d) => {
                  const ev = islamicDateFor(d.hijri.month, d.hijri.day);
                  return (
                    <tr key={d.date} className={cx("border-t border-line", d.date === today && "text-emerald")}>
                      <td className="py-2">
                        {Number(d.date.slice(8))} {d.weekday.slice(0, 2)}
                        <span className="ms-1 text-[10px] text-ink-3">{d.hijri.day}</span>
                        {ev && <span className="block text-[10px] text-gold">{ev.name}</span>}
                      </td>
                      {PRAYERS.map((k) => (
                        <td key={k} className="py-2 text-end">
                          {d.timings[k].slice(0, 5)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Source>
        AlAdhan API · {prayer.data?.method}. Hijri dates are calculated; Pakistan&apos;s official dates follow the Ruet-e-Hilal moon sighting and can differ by a day.
      </Source>
    </Page>
  );
}
