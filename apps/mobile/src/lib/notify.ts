import { LocalNotifications } from "@capacitor/local-notifications";
import { PRAYER_UR } from "@/features/namaz/islamic-dates";
import { todayKey, addDays, zonedParts } from "@/lib/dates";
import { settingsStore } from "@/lib/storage/stores";
import { api } from "./cached";
import { getPref, isNative, setPref } from "./native";

/**
 * Prayer-time notifications on the phone. The next 7 days are scheduled from
 * the monthly timetable (so they still fire away from the home Wi-Fi); this
 * runs at every launch and resume, replacing the previous schedule.
 */
interface MonthDay {
  date: string;
  timings: Record<string, string>;
}

export async function notificationsEnabled() {
  return (await getPref("prayer-notifications")) !== "off";
}

export async function setNotificationsEnabled(on: boolean) {
  await setPref("prayer-notifications", on ? "on" : "off");
  await schedulePrayerNotifications();
}

/** Wall-clock time in the family's time zone → the phone's Date. */
function zonedDate(date: string, hhmm: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, h, mi));
  const p = zonedParts(guess, tz);
  const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess.getTime() - (shown - guess.getTime()));
}

export async function schedulePrayerNotifications() {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const s = settingsStore.get();
    if (!(await notificationsEnabled()) || !s.location || !s.prayerReminders.length) return;
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === "prompt" || perm.display === "prompt-with-rationale") perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    const today = todayKey(s.timezone);
    const months = new Set([today.slice(0, 7), addDays(today, 7).slice(0, 7)]);
    const days: MonthDay[] = [];
    for (const ym of months) {
      const [year, month] = ym.split("-").map(Number);
      const r = await api<{ days: MonthDay[] }>(
        `/api/prayer/month?lat=${s.location.latitude}&lon=${s.location.longitude}&method=${s.prayerMethod}&school=${s.asrSchool}&month=${month}&year=${year}`,
      );
      days.push(...r.days);
    }
    const now = Date.now();
    const notifications = days
      .filter((d) => d.date >= today && d.date <= addDays(today, 7))
      .flatMap((d) =>
        s.prayerReminders.map((p, i) => {
          const at = zonedDate(d.date, d.timings[p].slice(0, 5), s.timezone);
          return {
            id: Number(d.date.replace(/-/g, "").slice(2)) * 10 + i,
            title: `${p} · ${PRAYER_UR[p]}`,
            body: `It's time for ${p}.`,
            schedule: { at, allowWhileIdle: true },
            channelId: "prayer",
          };
        }),
      )
      .filter((n) => n.schedule.at.getTime() > now);
    await LocalNotifications.createChannel({ id: "prayer", name: "Prayer times", importance: 4, sound: undefined, vibration: true }).catch(() => undefined);
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch {
    /* offline or no permission: try again next launch */
  }
}
