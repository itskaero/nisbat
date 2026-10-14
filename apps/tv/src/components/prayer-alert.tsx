import { useEffect, useRef, useState } from "preact/hooks";
import { PRAYER_UR } from "@/features/namaz/islamic-dates";
import { formatHHMM, nowHHMM, todayKey } from "@/lib/dates";
import { focusElement } from "@/lib/tv/spatial-nav";
import { PRAYERS, usePrayer, useSettings } from "../lib/data";
import { ambient, markActivity, pushLayer } from "../lib/ui-state";

const SHOWN_KEY = "nisbat:tv:prayer-shown";

function chime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.35);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.35 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.35 + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.35);
      o.stop(ctx.currentTime + i * 0.35 + 1.7);
    });
    setTimeout(() => void ctx.close(), 3000);
  } catch {
    /* audio unavailable */
  }
}

/** Full-screen card at each prayer the family enabled (Settings → Prayer reminders). */
export function PrayerAlert() {
  const s = useSettings();
  const prayer = usePrayer();
  const [due, setDue] = useState<string | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const check = () => {
      if (!prayer.data || due) return;
      const cur = nowHHMM(s.timezone);
      const today = todayKey(s.timezone);
      let shown: Record<string, string> = {};
      try {
        shown = JSON.parse(localStorage.getItem(SHOWN_KEY) ?? "{}");
      } catch {
        /* ignore */
      }
      for (const k of PRAYERS) {
        if (!(s.prayerReminders as string[]).includes(k) || shown[k] === today) continue;
        const at = prayer.data.timings[k].slice(0, 5);
        const [h, m] = at.split(":").map(Number);
        const [ch, cm] = cur.split(":").map(Number);
        const diff = ch * 60 + cm - (h * 60 + m);
        if (diff >= 0 && diff <= 3) {
          shown[k] = today;
          localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));
          markActivity();
          ambient.set(false);
          setDue(k);
          if (s.reminderChime) chime();
          return;
        }
      }
    };
    check();
    const t = setInterval(check, 20_000);
    return () => clearInterval(t);
  }, [prayer.data, s.timezone, s.prayerReminders, s.reminderChime, due]);

  useEffect(() => {
    if (!due) return;
    requestAnimationFrame(() => okRef.current && focusElement(okRef.current));
    const pop = pushLayer(() => setDue(null));
    const auto = setTimeout(() => setDue(null), 10 * 60_000);
    return () => {
      pop();
      clearTimeout(auto);
    };
  }, [due]);

  if (!due || !prayer.data) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="prayer-alert-title" class="fade-in fixed inset-0 z-[125] grid place-items-center bg-[#070c16]/90">
      <div class="text-center">
        <p class="text-2xl uppercase tracking-[0.3em] text-emerald">It&apos;s time for</p>
        <h2 id="prayer-alert-title" class="mt-4 font-display text-[7rem] font-semibold leading-none">
          {due}
        </h2>
        <p lang="ur" class="font-urdu mt-2 text-[3rem] text-ink-2">
          {PRAYER_UR[due]}
        </p>
        <p class="mt-4 text-3xl tabular-nums text-ink-2">{formatHHMM(prayer.data.timings[due as keyof typeof prayer.data.timings].slice(0, 5))}</p>
        <button ref={okRef} type="button" class="tile mt-10 px-12 py-4 text-2xl" onClick={() => setDue(null)}>
          OK
        </button>
      </div>
    </div>
  );
}
