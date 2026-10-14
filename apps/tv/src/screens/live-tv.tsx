import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "preact/hooks";
import { CHANNELS } from "@/data/channels";
import { usePersisted } from "@/lib/storage/persisted-store";
import { tvStore } from "@/lib/storage/stores";
import { registerMedia, notifyMediaChange } from "@/lib/tv/media-registry";
import { focusElement } from "@/lib/tv/spatial-nav";
import type { Channel } from "@/types/domain";
import { ScreenHeader, Source, Tile, cx } from "../components/ui";
import { stop as stopAudio } from "../lib/player";
import { navigate, useRoute } from "../lib/router";
import { pushLayer } from "../lib/ui-state";

const playable = CHANNELS.filter((c) => c.stream);

export function LiveTvScreen() {
  const { query } = useRoute();
  const tv = usePersisted(tvStore);
  const id = query.get("ch");
  const current = id ? playable.find((c) => c.id === id) : undefined;
  const favs = new Set(tv.favorites);
  const ordered = [...playable].sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)));
  const unavailable = CHANNELS.filter((c) => !c.stream);

  return (
    <>
      <ScreenHeader title="Live TV" sub="Official broadcaster streams only. Back closes the player." />
      <div class="grid grid-cols-4 gap-4">
        {ordered.map((c, i) => (
          <Tile key={c.id} class="p-5" data-autofocus={i === 0 && !current ? "" : undefined} onClick={() => navigate(`/tv?ch=${c.id}`)}>
            <span class="grid size-14 place-items-center rounded-2xl bg-white/[0.08] text-xl font-semibold">{monogram(c.name)}</span>
            <p class="mt-3 text-xl font-semibold">{c.name}</p>
            <p class="text-base capitalize text-ink-3">
              {c.category}
              {c.language ? ` · ${c.language}` : ""}
              {favs.has(c.id) ? " · ★" : ""}
            </p>
          </Tile>
        ))}
      </div>
      {unavailable.length > 0 && (
        <p class="mt-6 text-lg text-ink-3">Not available on the TV (no public stream): {unavailable.map((c) => c.name).join(", ")}.</p>
      )}
      <Source>Streams are HTTPS links on each broadcaster&apos;s own domain, checked on the date listed in the channel directory.</Source>
      {current && <Player channel={current} />}
    </>
  );
}

const monogram = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function Player({ channel }: { channel: Channel }) {
  const video = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const idx = playable.findIndex((c) => c.id === channel.id);
  const go = (d: number) => navigate(`/tv?ch=${playable[(idx + d + playable.length) % playable.length].id}`);

  useEffect(() => {
    stopAudio();
    tvStore.set((s) => ({ ...s, recent: [{ id: channel.id, at: new Date().toISOString() }, ...s.recent.filter((r) => r.id !== channel.id)].slice(0, 12) }));
    const v = video.current!;
    let hls: { destroy(): void } | null = null;
    let cancelled = false;
    setStatus("loading");
    const url = channel.stream!.url;
    const start = () => v.play().catch(() => setStatus("error"));
    if (v.canPlayType("application/vnd.apple.mpegurl") || channel.stream!.type === "mp4") {
      v.src = url;
      start();
    } else {
      // hls.js is only downloaded when someone actually opens a channel.
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setStatus("error");
        const h = new Hls({ maxBufferLength: 20, backBufferLength: 10 });
        h.on(Hls.Events.ERROR, (_e, data) => data.fatal && setStatus("error"));
        h.loadSource(url);
        h.attachMedia(v);
        h.on(Hls.Events.MANIFEST_PARSED, start);
        hls = h;
      });
    }
    const onPlaying = () => setStatus("playing");
    v.addEventListener("playing", onPlaying);
    const unreg = registerMedia({
      id: `tv:${channel.id}`,
      label: channel.name,
      isPlaying: () => !v.paused,
      toggle: () => (v.paused ? void v.play() : v.pause()),
      next: () => go(1),
      prev: () => go(-1),
    });
    v.addEventListener("play", notifyMediaChange);
    v.addEventListener("pause", notifyMediaChange);
    const pop = pushLayer(() => navigate("/tv"));
    requestAnimationFrame(() => closeRef.current && focusElement(closeRef.current));
    return () => {
      cancelled = true;
      pop();
      unreg();
      v.removeEventListener("playing", onPlaying);
      hls?.destroy();
      v.removeAttribute("src");
      v.load();
    };
  }, [channel.id]);

  return (
    <div class="fixed inset-0 z-[80] bg-black">
      <video ref={video} class="h-full w-full" playsInline autoPlay />
      {status !== "playing" && (
        <div class="absolute inset-0 grid place-items-center">
          <p class={cx("card card-strong px-8 py-5 text-2xl", status === "error" && "text-coral")}>
            {status === "error" ? `${channel.name} isn't playing right now. Try another channel or come back later.` : `Loading ${channel.name}…`}
          </p>
        </div>
      )}
      <div class="absolute inset-x-0 bottom-0 flex items-center gap-4 p-6" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.75), transparent)" }}>
        <button type="button" class="tile grid size-14 place-items-center" aria-label="Previous channel" onClick={() => go(-1)}>
          <ChevronLeft size={28} />
        </button>
        <p class="flex-1 text-2xl font-semibold">{channel.name}</p>
        <button type="button" class="tile grid size-14 place-items-center" aria-label="Next channel" onClick={() => go(1)}>
          <ChevronRight size={28} />
        </button>
        <button ref={closeRef} type="button" class="tile flex items-center gap-2 px-5 py-3 text-lg" onClick={() => navigate("/tv")}>
          <X size={22} /> Close
        </button>
      </div>
    </div>
  );
}
