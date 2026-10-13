"use client";

import Link from "next/link";
import { useFetch } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { aqiBand } from "./aqi";

/** Compact AQI badge (number + category text, never colour alone). */
export function AqiChip({ className = "" }: { className?: string }) {
  const { location } = usePersisted(settingsStore);
  const { data } = useFetch<{ aqi: number }>(location ? `/api/air?lat=${location.latitude}&lon=${location.longitude}` : null);
  if (!data) return null;
  const band = aqiBand(data.aqi);
  return (
    <Link href="/mausam" className={`inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] text-ink-2 hover:text-ink ${className}`}>
      <span className="size-2 rounded-full" style={{ background: band.color }} aria-hidden />
      AQI {data.aqi} · {band.label}
    </Link>
  );
}
