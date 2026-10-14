"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { notifyMediaChange, registerMedia } from "@/lib/tv/media-registry";
import type { Channel } from "@/types/domain";

type State = "idle" | "loading" | "playing" | "error";

function describeUrl(url: string): { ok: true; kind: "hls" | "mp4" } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: "This stream address isn't a valid URL." };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "Only HTTPS streams can play inside Nisbat (browsers block insecure media on secure pages)." };
  const path = u.pathname.toLowerCase();
  if (path.endsWith(".m3u8")) return { ok: true, kind: "hls" };
  if (path.endsWith(".mp4") || path.endsWith(".webm")) return { ok: true, kind: "mp4" };
  return { ok: false, reason: "This address doesn't look like a direct video stream (.m3u8, .mp4 or .webm). Web pages can't be played as video." };
}

/**
 * HTML5 video player with HLS support: native HLS where the browser has it
 * (Safari/iOS), hls.js elsewhere. Reports network/media errors and offers a
 * retry. Does not attempt to bypass DRM, tokens, referrer checks or geo-blocks.
 */
export function HlsPlayer({
  channel,
  onPlaying,
  onNext,
  onPrev,
}: {
  channel: Channel;
  onPlaying?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const url = channel.stream?.url;
  const playingRef = useRef(onPlaying);
  playingRef.current = onPlaying;

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const nav = useRef({ onNext, onPrev });
  nav.current = { onNext, onPrev };

  // Remote / media-key control: play-pause and channel up/down.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const off = registerMedia({
      id: "live-tv",
      label: `Live TV · ${channel.name}`,
      isPlaying: () => !video.paused,
      toggle: () => (video.paused ? void video.play().catch(() => undefined) : video.pause()),
      next: () => nav.current.onNext?.(),
      prev: () => nav.current.onPrev?.(),
    });
    video.addEventListener("play", notifyMediaChange);
    video.addEventListener("pause", notifyMediaChange);
    return () => {
      off();
      video.removeEventListener("play", notifyMediaChange);
      video.removeEventListener("pause", notifyMediaChange);
    };
  }, [channel.name]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;
    const check = describeUrl(url);
    if (!check.ok) {
      setState("error");
      setError(check.reason);
      return;
    }
    let destroyed = false;
    let hls: import("hls.js").default | undefined;
    setState("loading");
    setError(undefined);

    const fail = (msg: string) => {
      if (destroyed) return;
      setState("error");
      setError(msg);
    };
    const onPlayingEvt = () => {
      setState("playing");
      playingRef.current?.();
    };
    const onWaiting = () => setState((s) => (s === "error" ? s : "loading"));
    const onVideoError = () => fail("The stream couldn't be played. It may be offline, region-restricted, or blocked for third-party players.");
    video.addEventListener("playing", onPlayingEvt);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onVideoError);

    const start = () => video.play().catch((e: Error) => e.name === "NotAllowedError" && setState("idle"));

    if (check.kind === "mp4" || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      start();
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (destroyed) return;
        if (!Hls.isSupported()) {
          fail("This browser can't play HLS live streams.");
          return;
        }
        hls = new Hls({ enableWorker: true, lowLatencyMode: false, manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2 });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            const code = (data.response as { code?: number } | undefined)?.code;
            fail(
              code === 403 || code === 401
                ? "The broadcaster refused this request (access restricted). Try their official website."
                : code === 404
                  ? "The stream address no longer exists. The broadcaster may have moved it."
                  : "Couldn't reach the stream. It may be offline, or your network may block it.",
            );
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          } else {
            fail("The stream format isn't supported by this browser.");
          }
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => start());
      });
    }

    const timeout = setTimeout(() => {
      if (!destroyed && video.readyState < 2) fail("The stream is taking too long to start. It may be offline right now.");
    }, 20000);

    return () => {
      destroyed = true;
      clearTimeout(timeout);
      video.removeEventListener("playing", onPlayingEvt);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [url, attempt]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        autoPlay
        aria-label={`${channel.name} live stream`}
      />
      {state === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40" role="status">
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
            <Loader2 className="size-4 animate-spin" /> Connecting to {channel.name}…
          </span>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-[#0b1220]/92 p-6 text-center" role="alert">
          <div className="max-w-sm space-y-3">
            <AlertTriangle className="mx-auto size-8 text-coral" />
            <p className="text-sm font-semibold text-ink">Playback failed</p>
            <p className="text-xs leading-relaxed text-ink-2">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={retry}>
                <RefreshCw className="size-4" /> Retry
              </Button>
              {channel.website && (
                <a href={channel.website} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-xl border border-white/14 px-3 text-xs text-ink hover:bg-white/6">
                  Official website
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
