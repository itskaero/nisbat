"use client";

import { AlertCircle, Loader2, Pause, Play, Repeat, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { IconButton, Select, cn } from "@/components/ui/primitives";
import { RECITERS } from "./editions";
import type { VersePlayer } from "./use-verse-player";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function AudioDock({
  player,
  surahName,
  surahNumber,
  totalAyahs,
  reciterId,
  onReciterChange,
  disabled,
}: {
  player: VersePlayer;
  surahName: string;
  surahNumber: number;
  totalAyahs: number;
  reciterId: string;
  onReciterChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { status, index, time, duration, volume, rate, error } = player;
  const playing = status === "playing";
  const pct = duration ? (time / duration) * 100 : 0;
  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <section
      aria-label="Recitation player"
      className="glass sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mt-4 !rounded-2xl !bg-[rgba(14,22,35,0.94)] p-3 md:bottom-4 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1">
          <IconButton label="Previous verse" onClick={player.prev} disabled={disabled || index == null || index === 0}>
            <SkipBack className="size-4 rtl:-scale-x-100" />
          </IconButton>
          <button
            type="button"
            onClick={player.toggle}
            disabled={disabled}
            aria-label={playing ? "Pause recitation" : "Play recitation"}
            className="grid size-12 place-items-center rounded-full bg-white text-[#0b1220] shadow-lg transition-transform hover:scale-105 disabled:opacity-40"
          >
            {status === "loading" ? <Loader2 className="size-5 animate-spin" /> : playing ? <Pause className="size-5" /> : <Play className="ms-0.5 size-5" />}
          </button>
          <IconButton label="Next verse" onClick={player.next} disabled={disabled || index == null || index >= totalAyahs - 1}>
            <SkipForward className="size-4 rtl:-scale-x-100" />
          </IconButton>
        </div>

        <div className="order-last w-full min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-ink" aria-live="polite">
              {index != null ? (
                <>
                  Now reciting <span className="font-semibold">{surahName} {surahNumber}:{index + 1}</span>
                </>
              ) : (
                <span className="text-ink-2">Press play to recite from verse 1, or tap ▶ on any verse</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-ink-3">
              {fmt(time)} / {fmt(duration)}
            </span>
          </div>
          <input
            type="range"
            className="nb-range w-full"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => player.seek(Number(e.target.value))}
            disabled={!duration}
            aria-label="Seek within verse"
            aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
            style={{ ["--pct" as string]: `${pct}%` }}
          />
        </div>

        <div className="ms-auto flex items-center gap-2">
          <IconButton
            label={player.continuous ? "Continuous play on" : "Continuous play off"}
            aria-pressed={player.continuous}
            size="sm"
            className={cn(player.continuous && "!text-emerald")}
            onClick={() => player.setContinuous(!player.continuous)}
          >
            <Repeat className="size-4" />
          </IconButton>
          <button
            type="button"
            className="h-8 rounded-lg px-2 text-xs font-semibold text-ink-2 hover:bg-white/8 hover:text-ink"
            onClick={() => player.setRate(rate >= 1.5 ? 0.75 : rate + 0.25)}
            aria-label={`Playback speed ${rate}x`}
          >
            {rate}x
          </button>
          <div className="hidden items-center gap-1 md:flex">
            <IconButton label={volume === 0 ? "Unmute" : "Mute"} size="sm" onClick={() => player.setVolume(volume === 0 ? 1 : 0)}>
              <VolIcon className="size-4" />
            </IconButton>
            <input
              type="range"
              className="nb-range w-20"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              aria-label="Volume"
              style={{ ["--pct" as string]: `${volume * 100}%` }}
            />
          </div>
          <Select
            aria-label="Reciter"
            value={reciterId}
            onChange={(e) => onReciterChange(e.target.value)}
            className="h-9 w-[150px] text-xs lg:w-[190px]"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 flex items-center gap-2 text-xs text-coral">
          <AlertCircle className="size-4 shrink-0" /> {error} The text remains available to read.
        </p>
      )}
    </section>
  );
}
