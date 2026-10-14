"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { formatHHMM, todayKey, zonedParts } from "@/lib/dates";
import { useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { useTvMode } from "@/lib/tv/tv-mode";
import { PRAYER_UR, type PrayerName } from "./islamic-dates";
import { usePrayerToday } from "./use-prayer";

/** Soft two-note bell synthesised with Web Audio (original sound, no recording). */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [659.25, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.9;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.3);
    });
    setTimeout(() => void ctx.close(), 5000);
  } catch {
    /* audio unavailable — the card is still shown */
  }
}

const SHOWN_KEY = "nisbat:prayer-reminders-shown";

/** On-screen card at each enabled prayer time; large and focused in TV mode. */
export function PrayerReminder() {
  const settings = usePersisted(settingsStore);
  const tv = useTvMode();
  const now = useNow();
  const { data } = usePrayerToday();
  const [active, setActive] = useState<{ name: PrayerName; at: string } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!now || !data || !settings.prayerReminders.length) return;
    const p = zonedParts(now, settings.timezone);
    const mins = p.hour * 60 + p.minute;
    const day = todayKey(settings.timezone);
    let shown: string[] = [];
    try {
      shown = JSON.parse(sessionStorage.getItem(SHOWN_KEY) ?? "[]");
    } catch {
      /* ignore */
    }
    for (const name of settings.prayerReminders) {
      const at = data.timings[name]?.slice(0, 5);
      if (!at) continue;
      const [h, m] = at.split(":").map(Number);
      const delta = mins - (h * 60 + m);
      const id = `${day}:${name}`;
      // Fire within the first 3 minutes of the prayer time, once per day per prayer.
      if (delta >= 0 && delta < 3 && !shown.includes(id)) {
        try {
          sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, id].slice(-20)));
        } catch {
          /* ignore */
        }
        setActive({ name, at });
        if (settings.reminderChime) playChime();
        break;
      }
    }
  }, [now, data, settings.prayerReminders, settings.timezone, settings.reminderChime]);

  // Auto-dismiss after 10 minutes; focus the button so a TV remote's OK closes it.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), 10 * 60_000);
    requestAnimationFrame(() => btnRef.current?.focus());
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;
  return (
    <div
      role="alertdialog"
      aria-labelledby="prayer-reminder-title"
      className={
        tv
          ? "fixed inset-0 z-[95] grid place-items-center bg-[#070c16]/70 p-8"
          : "fixed bottom-[calc(84px+env(safe-area-inset-bottom))] end-4 z-[95] w-[min(360px,calc(100vw-2rem))] md:bottom-6"
      }
    >
      <div className="glass animate-fade-up !bg-[rgba(12,20,33,0.92)] p-6 text-center shadow-2xl">
        <BellRing className="mx-auto size-8 text-emerald" aria-hidden />
        <p id="prayer-reminder-title" className={tv ? "mt-3 font-display text-5xl font-semibold" : "mt-2 text-xl font-semibold"}>
          {active.name} <span lang="ur" className="font-urdu font-normal text-ink-2">{PRAYER_UR[active.name]}</span>
        </p>
        <p className={tv ? "mt-2 text-2xl text-ink-2" : "mt-1 text-sm text-ink-2"}>
          It&apos;s time for {active.name} · {formatHHMM(active.at)}
        </p>
        <Button ref={btnRef} variant="primary" size={tv ? "lg" : "md"} className="mt-5" onClick={() => setActive(null)}>
          <X className="size-4" /> Dismiss
        </Button>
      </div>
    </div>
  );
}
