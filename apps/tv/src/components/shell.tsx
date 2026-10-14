import { Pause, Play, Search, Settings, SkipBack, SkipForward, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "preact/hooks";
import { NAV_ITEMS, isActive } from "@/components/layout/nav";
import { zonedParts } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { focusElement } from "@/lib/tv/spatial-nav";
import { fmtTime, skip, toggle, usePlayer } from "../lib/player";
import { answerPairing } from "../lib/remote";
import { navigate, useRoute } from "../lib/router";
import { pairing, pushLayer, toasts } from "../lib/ui-state";
import { cx } from "./ui";

/** Time-of-day photo, pre-blurred (no live blur on the Chromecast GPU). */
export function slotFor(date: Date, tz: string) {
  const { hour, minute } = zonedParts(date, tz);
  const h = hour + minute / 60;
  return h >= 4 && h < 7 ? "dawn" : h >= 7 && h < 17 ? "day" : h >= 17 && h < 19.5 ? "dusk" : "night";
}

export function Background() {
  const { timezone } = usePersisted(settingsStore);
  const [slot, setSlot] = useState(() => slotFor(new Date(), timezone));
  const [shown, setShown] = useState<string[]>([slot]);
  useEffect(() => {
    const t = setInterval(() => setSlot(slotFor(new Date(), timezone)), 60_000);
    return () => clearInterval(t);
  }, [timezone]);
  useEffect(() => {
    if (shown[shown.length - 1] === slot) return;
    setShown((s) => [...s.slice(-1), slot]);
  }, [slot]);
  return (
    <div aria-hidden="true" class="fixed inset-0 -z-10 overflow-hidden bg-bg">
      {shown.map((s) => (
        <FadeImg key={s} src={`/backgrounds/${s}-blur.webp`} />
      ))}
      <div class="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(7,12,22,.78) 0%, rgba(7,12,22,.45) 45%, rgba(7,12,22,.3) 100%)" }} />
    </div>
  );
}

/** Fades in once decoded; later images stack on top of earlier ones (crossfade). */
export function FadeImg({ src, class: c }: { src: string; class?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current!;
    const show = () => (img.style.opacity = "1");
    if (img.complete && img.naturalWidth) show();
    else img.addEventListener("load", show, { once: true });
  }, [src]);
  return <img ref={ref} src={src} alt="" decoding="async" class={cx("layer absolute inset-0 h-full w-full object-cover", c)} style={{ opacity: 0 }} />;
}

export function Rail() {
  const { path } = useRoute();
  const items = [...NAV_ITEMS, { href: "/search", short: "Search", icon: Search }, { href: "/settings", short: "Settings", icon: Settings }];
  return (
    <nav aria-label="Screens" class="no-scrollbar flex w-[200px] shrink-0 flex-col gap-1 overflow-y-auto py-[3vh] ps-[1.6vw] pe-2">
      <div class="mb-3 flex items-center gap-3 px-3">
        <span class="size-9 rounded-xl" style={{ background: "linear-gradient(140deg,#45d49a,#65c7e8)" }} />
        <span class="text-xl font-semibold tracking-tight">Nisbat</span>
      </div>
      {items.map((it) => {
        const active = isActive(path, it.href);
        const Icon = it.icon;
        return (
          <button
            key={it.href}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(it.href)}
            class={cx(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-start text-[1.05rem] transition-colors",
              active ? "bg-emerald/15 text-emerald" : "text-ink-2",
              it.href === "/search" && "mt-auto",
            )}
          >
            <Icon size={22} aria-hidden="true" />
            {it.short}
          </button>
        );
      })}
    </nav>
  );
}

export function NowPlaying() {
  const p = usePlayer();
  if (!p.track) return null;
  const live = p.track.kind === "radio";
  return (
    <div class="card card-strong fade-in fixed bottom-5 end-6 z-40 flex w-[460px] items-center gap-4 p-3 ps-5">
      <div class="min-w-0 flex-1">
        <p class="truncate text-[1.02rem] font-medium">{p.track.title}</p>
        <p class="truncate text-sm text-ink-3">
          {p.error ?? (live ? `${p.track.sub} · live` : `${p.track.sub} · ${fmtTime(p.pos)} / ${fmtTime(p.dur)}`)}
        </p>
        {!live && p.dur > 0 && (
          <div class="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div class="h-full origin-left rounded-full bg-emerald" style={{ transform: `scaleX(${Math.min(1, p.pos / p.dur)})` }} />
          </div>
        )}
      </div>
      {p.queue.length > 1 && (
        <button type="button" class="tile grid size-11 place-items-center" aria-label="Previous" onClick={() => skip(-1)}>
          <SkipBack size={20} />
        </button>
      )}
      <button type="button" class="tile grid size-12 place-items-center !bg-emerald !text-[#06231a]" aria-label={p.playing ? "Pause" : "Play"} onClick={toggle}>
        {p.playing ? <Pause size={22} /> : <Play size={22} />}
      </button>
      {p.queue.length > 1 && (
        <button type="button" class="tile grid size-11 place-items-center" aria-label="Next" onClick={() => skip(1)}>
          <SkipForward size={20} />
        </button>
      )}
    </div>
  );
}

export function Toasts() {
  const list = toasts.use();
  return (
    <div aria-live="polite" class="pointer-events-none fixed bottom-6 start-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => (
        <p
          key={t.id}
          class={cx("card card-strong fade-in px-5 py-3 text-lg", t.tone === "error" && "!border-coral/50 text-coral", t.tone === "info" && "text-ink-2")}
        >
          {t.text}
        </p>
      ))}
    </div>
  );
}

/** "Allow Ali's phone to use Nisbat?" — the approve-once step for the Android app. */
export function PairingPrompt() {
  const list = pairing.use();
  const req = list[0];
  const allowRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!req) return;
    const prev = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => allowRef.current && focusElement(allowRef.current));
    const pop = pushLayer(() => void answerPairing(req.id, false));
    return () => {
      pop();
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, [req?.id]);
  if (!req) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pair-title" class="fixed inset-0 z-[130] grid place-items-center bg-black/55">
      <div class="card card-strong screen-enter w-[620px] p-8 text-center">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald/15 text-emerald">
          <Smartphone size={32} />
        </span>
        <h2 id="pair-title" class="mt-5 text-3xl font-semibold">
          Allow <span class="text-emerald">{req.name}</span>?
        </h2>
        <p class="mt-2 text-lg text-ink-2">This phone wants to use Nisbat: the family&apos;s lists and controlling this TV. Only allow phones you recognise.</p>
        <div class="mt-7 flex justify-center gap-4">
          <button ref={allowRef} type="button" class="tile px-8 py-3 text-xl !bg-emerald font-semibold !text-[#06231a]" onClick={() => answerPairing(req.id, true)}>
            Allow
          </button>
          <button type="button" class="tile flex items-center gap-2 px-8 py-3 text-xl" onClick={() => answerPairing(req.id, false)}>
            <X size={20} /> Not now
          </button>
        </div>
      </div>
    </div>
  );
}
