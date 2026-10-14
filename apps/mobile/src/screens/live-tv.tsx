import { Star, Tv, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHANNELS } from "@/data/channels";
import { usePersisted } from "@/lib/storage/persisted-store";
import { tvStore } from "@/lib/storage/stores";
import type { Channel } from "@/types/domain";
import { Page, Source, cx } from "../components/ui";
import { tap } from "../lib/native";
import { pushOverlay } from "../lib/nav";
import { stop as stopAudio } from "../lib/player";
import { sendCommand, listScreens } from "../lib/remote";
import { toast } from "../lib/toast";

const playable = CHANNELS.filter((c) => c.stream);

export function LiveTvScreen() {
  const tv = usePersisted(tvStore);
  const [watching, setWatching] = useState<Channel | null>(null);
  const favs = new Set(tv.favorites);
  const list = [...playable].sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)));

  const onTv = async (c: Channel) => {
    try {
      const screens = await listScreens();
      if (!screens.length) return toast("No TV is showing Nisbat right now", "error");
      await sendCommand(screens[0].id, { type: "channel", id: c.id });
      toast(`${c.name} on ${screens[0].name}`, "info");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <Page title="Live TV" back>
      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id} className="glass flex items-center gap-3 p-3">
            <button type="button" className="press flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setWatching(c)}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-sm font-semibold">
                {c.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-xs capitalize text-ink-3">
                  {c.category}
                  {c.language ? ` · ${c.language}` : ""}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={favs.has(c.id) ? "Remove favourite" : "Favourite"}
              className="press grid size-9 place-items-center"
              onClick={() => {
                void tap();
                tvStore.set((s) => ({ ...s, favorites: favs.has(c.id) ? s.favorites.filter((f) => f !== c.id) : [...s.favorites, c.id] }));
              }}
            >
              <Star size={18} className={favs.has(c.id) ? "fill-gold text-gold" : "text-ink-3"} />
            </button>
            <button type="button" aria-label={`Watch ${c.name} on the TV`} className="press grid size-9 place-items-center rounded-full bg-white/[0.06]" onClick={() => onTv(c)}>
              <Tv size={16} />
            </button>
          </li>
        ))}
      </ul>
      <Source>Official broadcaster streams only. Tap a channel to watch here, or the TV button to put it on the big screen.</Source>
      {watching && <Player channel={watching} onClose={() => setWatching(null)} />}
    </Page>
  );
}

function Player({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  useEffect(() => pushOverlay(onClose), [onClose]);
  useEffect(() => {
    stopAudio();
    tvStore.set((s) => ({ ...s, recent: [{ id: channel.id, at: new Date().toISOString() }, ...s.recent.filter((r) => r.id !== channel.id)].slice(0, 12) }));
    const v = video.current!;
    let hls: { destroy(): void } | null = null;
    let cancelled = false;
    const url = channel.stream!.url;
    const start = () => v.play().catch(() => setStatus("error"));
    v.addEventListener("playing", () => setStatus("playing"));
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = url;
      start();
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setStatus("error");
        const h = new Hls();
        h.on(Hls.Events.ERROR, (_e, d) => d.fatal && setStatus("error"));
        h.loadSource(url);
        h.attachMedia(v);
        h.on(Hls.Events.MANIFEST_PARSED, start);
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
      v.removeAttribute("src");
      v.load();
    };
  }, [channel.id]);
  return createPortal(
    <div className="fade-in fixed inset-0 z-50 flex flex-col bg-black">
      <div className="pt-safe flex items-center gap-3 px-4 pb-2">
        <p className="flex-1 truncate font-semibold">{channel.name}</p>
        <button type="button" aria-label="Close" className="press grid size-10 place-items-center rounded-full bg-white/10" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center">
        <video ref={video} className="w-full" playsInline controls />
        {status !== "playing" && <p className={cx("absolute inset-x-0 text-center text-sm", status === "error" ? "text-coral" : "text-ink-3")}>{status === "error" ? `${channel.name} isn't playing right now.` : "Loading…"}</p>}
      </div>
    </div>,
    document.body,
  );
}
