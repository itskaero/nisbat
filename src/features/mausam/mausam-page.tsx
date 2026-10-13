"use client";

import { AlertTriangle, CloudSun, Droplets, MapPin, RefreshCw, Sunrise, Sunset, Thermometer, Wind } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, Panel, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { describeWeather } from "@/features/dashboard/widgets";
import { formatHHMM } from "@/lib/dates";
import { useFetch } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { AQI_BANDS, aqiBand } from "./aqi";

interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
  observedAt: string;
  sunrise: string;
  sunset: string;
  hourly: { time: string; temperature: number; code: number; isDay: boolean; precipitation: number }[];
  daily: { date: string; high: number; low: number; code: number }[];
}
interface Air {
  aqi: number;
  pm25: number;
  pm10: number;
  observedAt: string;
  next24: { time: string; aqi: number | null }[];
}

export function MausamPage() {
  const { location } = usePersisted(settingsStore);
  const q = location ? `lat=${location.latitude}&lon=${location.longitude}` : null;
  const weather = useFetch<Weather>(q ? `/api/weather?${q}&hours=24` : null);
  const air = useFetch<Air>(q ? `/api/air?${q}` : null);

  if (!location)
    return (
      <Panel className="mx-auto mt-6 max-w-lg">
        <EmptyState icon={<CloudSun className="size-5" />} title="Set your city to see the weather" action={<Link href="/settings#location" className="text-sm text-emerald underline">Choose location</Link>} />
      </Panel>
    );

  const w = weather.data;
  const d = w ? describeWeather(w.code, w.isDay) : null;
  const Icon = d?.icon ?? CloudSun;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <CloudSun className="size-7 text-emerald" aria-hidden /> Mausam <span className="font-urdu text-xl text-ink-2" lang="ur">موسم</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
            <MapPin className="size-3.5" /> {location.name}
            {location.admin ? `, ${location.admin}` : ""} ·{" "}
            <Link href="/settings#location" className="underline underline-offset-2 hover:text-ink">change</Link>
          </p>
        </div>
      </div>

      {weather.error ? (
        <Panel>
          <EmptyState tone="error" icon={<AlertTriangle className="size-5" />} title="Weather is unavailable right now" description={weather.error} action={<Button size="sm" onClick={weather.reload}><RefreshCw className="size-4" /> Try again</Button>} />
        </Panel>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel className="p-6 md:p-8" aria-label="Current weather">
            {!w || !d ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-48" />
                <Skeleton className="h-6 w-64" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-6">
                  <Icon className="size-24 text-gold" strokeWidth={1.2} aria-hidden />
                  <div>
                    <p className="font-display text-7xl font-semibold leading-none tabular-nums md:text-8xl">{Math.round(w.temperature)}°</p>
                    <p className="mt-2 text-2xl text-ink-2">{d.label}</p>
                  </div>
                  <div className="ms-auto flex gap-2 text-sm">
                    <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1">H {Math.round(w.high)}°</span>
                    <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1">L {Math.round(w.low)}°</span>
                  </div>
                </div>
                <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
                  <Stat icon={Thermometer} label="Feels like" value={`${Math.round(w.feelsLike)}°`} />
                  <Stat icon={Droplets} label="Humidity" value={`${w.humidity}%`} />
                  <Stat icon={Wind} label="Wind" value={`${Math.round(w.wind)} km/h`} />
                </dl>
                <TempCurve hours={w.hourly} />
              </>
            )}
          </Panel>
          <AirCard air={air} />
        </div>
      )}

      {w && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel className="p-4 sm:p-5" aria-labelledby="week-title">
            <h2 id="week-title" className="mb-3 text-sm font-semibold">Next 7 days</h2>
            <ol className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {w.daily.map((day, i) => {
                const dd = describeWeather(day.code, true);
                const DIcon = dd.icon;
                return (
                  <li key={day.date} className={cn("relative flex min-w-[88px] flex-1 flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center", i === 0 ? "border-emerald/30 bg-emerald/10" : "border-white/8 bg-white/[0.03]")}>
                    <span className="text-xs text-ink-2">{i === 0 ? "Today" : new Date(day.date + "T00:00:00Z").toLocaleDateString("en-PK", { weekday: "short", timeZone: "UTC" })}</span>
                    <DIcon className="size-7 text-gold" aria-hidden />
                    <span className="sr-only">{dd.label}</span>
                    <span className="text-lg font-semibold tabular-nums">{Math.round(day.high)}°</span>
                    <span className="text-xs tabular-nums text-ink-3">{Math.round(day.low)}°</span>
                  </li>
                );
              })}
            </ol>
          </Panel>
          <SunArc sunrise={w.sunrise} sunset={w.sunset} observedAt={w.observedAt} />
        </div>
      )}

      <SourceNote>
        Forecast by Open-Meteo (CC BY 4.0). Air quality is a CAMS model estimate from Open-Meteo, not a reading from a local monitoring station. Times are local to {location.name}.
      </SourceNote>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="glass-soft p-3">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">
        <Icon className="size-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** 24-hour temperature curve: single series, selective labels, hover readout. */
function TempCurve({ hours }: { hours: Weather["hourly"] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (hours.length < 2) return null;
  const W = 720;
  const H = 150;
  const pad = { l: 12, r: 12, t: 28, b: 30 };
  const temps = hours.map((h) => h.temperature);
  const min = Math.min(...temps) - 1;
  const max = Math.max(...temps) + 1;
  const x = (i: number) => pad.l + (i / (hours.length - 1)) * (W - pad.l - pad.r);
  const y = (t: number) => pad.t + (1 - (t - min) / (max - min)) * (H - pad.t - pad.b);
  // Smooth path (Catmull-Rom → cubic Bézier).
  let path = `M ${x(0)} ${y(temps[0])}`;
  for (let i = 0; i < temps.length - 1; i++) {
    const p0 = [x(Math.max(0, i - 1)), y(temps[Math.max(0, i - 1)])];
    const p1 = [x(i), y(temps[i])];
    const p2 = [x(i + 1), y(temps[i + 1])];
    const p3 = [x(Math.min(temps.length - 1, i + 2)), y(temps[Math.min(temps.length - 1, i + 2)])];
    path += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  const label = (h: Weather["hourly"][number]) => formatHHMM(h.time.slice(11, 16)).replace(":00", "");
  const hi = hover ?? 0;
  return (
    <figure className="mt-6">
      <figcaption className="mb-1 flex justify-between text-xs text-ink-3">
        <span>Next 24 hours</span>
        <span aria-live="polite">
          {label(hours[hi])}: <span className="font-semibold text-ink">{Math.round(hours[hi].temperature)}°</span>
          {hours[hi].precipitation >= 20 ? ` · ${hours[hi].precipitation}% rain` : ""}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`Temperature over the next 24 hours, from ${Math.round(temps[0])}° to between ${Math.round(Math.min(...temps))}° and ${Math.round(Math.max(...temps))}°`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (hours.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <path d={`${path} L ${x(hours.length - 1)} ${H - pad.b} L ${x(0)} ${H - pad.b} Z`} fill="url(#tempfill)" opacity="0.5" />
        <defs>
          <linearGradient id="tempfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9b66b" stopOpacity="0.35" />
            <stop offset="1" stopColor="#e9b66b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#e9b66b" strokeWidth="2" strokeLinecap="round" />
        {hours.map((h, i) =>
          i % 3 === 0 ? (
            <g key={h.time}>
              <text x={x(i)} y={y(h.temperature) - 10} textAnchor="middle" className="fill-[var(--text-2)] text-[13px]">
                {Math.round(h.temperature)}°
              </text>
              <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-[var(--text-3)] text-[12px]">
                {i === 0 ? "Now" : label(h)}
              </text>
            </g>
          ) : null,
        )}
        {hover != null && hours[hover] && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t - 8} y2={H - pad.b} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(hours[hover].temperature)} r="5" fill="#e9b66b" stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
    </figure>
  );
}

function SunArc({ sunrise, sunset, observedAt }: { sunrise: string; sunset: string; observedAt: string }) {
  const toMin = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
  const rise = toMin(sunrise);
  const set = toMin(sunset);
  const now = toMin(observedAt);
  const t = Math.min(1, Math.max(0, (now - rise) / (set - rise)));
  const up = now >= rise && now <= set;
  const angle = Math.PI * (1 - t);
  const cx = 150 + 120 * Math.cos(angle);
  const cy = 140 - 120 * Math.sin(angle);
  const daylight = set - rise;
  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="sun-title">
      <h2 id="sun-title" className="text-sm font-semibold">Sunrise &amp; sunset</h2>
      <svg viewBox="0 0 300 160" className="mt-2 h-auto w-full" role="img" aria-label={`Sunrise ${formatHHMM(sunrise.slice(11, 16))}, sunset ${formatHHMM(sunset.slice(11, 16))}`}>
        <path d="M 30 140 A 120 120 0 0 1 270 140" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeDasharray="4 6" />
        <line x1="10" x2="290" y1="140" y2="140" stroke="rgba(255,255,255,0.12)" />
        {up && <circle cx={cx} cy={cy} r="9" fill="#e9b66b" stroke="var(--bg)" strokeWidth="2" />}
      </svg>
      <div className="mt-1 flex justify-between text-sm">
        <span className="flex items-center gap-1.5"><Sunrise className="size-4 text-gold" aria-hidden /> {formatHHMM(sunrise.slice(11, 16))}</span>
        <span className="text-xs text-ink-3">{Math.floor(daylight / 60)}h {daylight % 60}m daylight</span>
        <span className="flex items-center gap-1.5"><Sunset className="size-4 text-coral" aria-hidden /> {formatHHMM(sunset.slice(11, 16))}</span>
      </div>
    </Panel>
  );
}

function AirCard({ air }: { air: ReturnType<typeof useFetch<Air>> }) {
  if (air.error)
    return (
      <Panel className="p-6">
        <p className="text-sm text-ink-2">Air quality is unavailable right now.</p>
      </Panel>
    );
  const a = air.data;
  if (!a)
    return (
      <Panel className="p-6">
        <Skeleton className="h-40" />
      </Panel>
    );
  const band = aqiBand(a.aqi);
  const pct = Math.min(1, a.aqi / 300);
  const angle = Math.PI * (1 - pct);
  return (
    <Panel className="p-6" aria-labelledby="air-title">
      <h2 id="air-title" className="text-sm font-semibold">Air quality · Smog</h2>
      <svg viewBox="0 0 240 140" className="mx-auto mt-3 h-auto w-full max-w-[280px]" role="img" aria-label={`US AQI ${a.aqi}, ${band.label}`}>
        {AQI_BANDS.slice(0, 5).map((b, i, arr) => {
          const from = i === 0 ? 0 : arr[i - 1].max;
          const to = Math.min(b.max, 300);
          const a0 = Math.PI * (1 - from / 300);
          const a1 = Math.PI * (1 - to / 300);
          const p = (ang: number) => `${120 + 95 * Math.cos(ang)} ${125 - 95 * Math.sin(ang)}`;
          return <path key={b.label} d={`M ${p(a0)} A 95 95 0 0 1 ${p(a1)}`} fill="none" stroke={b.color} strokeWidth="14" strokeLinecap="butt" opacity="0.85" />;
        })}
        <circle cx={120 + 95 * Math.cos(angle)} cy={125 - 95 * Math.sin(angle)} r="9" fill="var(--text)" stroke="var(--bg)" strokeWidth="3" />
        <text x="120" y="112" textAnchor="middle" className="fill-[var(--text)] text-[40px] font-semibold">{a.aqi}</text>
        <text x="120" y="134" textAnchor="middle" className="fill-[var(--text-3)] text-[11px]">US AQI</text>
      </svg>
      <p className="mt-2 text-center text-lg font-semibold">
        {band.label} <span lang="ur" className="font-urdu text-base font-normal text-ink-2">· {band.labelUr}</span>
      </p>
      <p className="mt-1 text-center text-sm text-ink-2">{band.advice}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="glass-soft p-3">
          <dt className="text-xs text-ink-3">PM2.5</dt>
          <dd className="mt-1 font-semibold tabular-nums">{a.pm25.toFixed(0)} µg/m³</dd>
        </div>
        <div className="glass-soft p-3">
          <dt className="text-xs text-ink-3">PM10</dt>
          <dd className="mt-1 font-semibold tabular-nums">{a.pm10.toFixed(0)} µg/m³</dd>
        </div>
      </dl>
      {a.next24.length > 0 && (
        <p className="mt-3 text-xs text-ink-3">
          Next 24h: {Math.min(...a.next24.map((h) => h.aqi ?? Infinity))}–{Math.max(...a.next24.map((h) => h.aqi ?? 0))} AQI
          {" · worst around "}
          {formatHHMM(a.next24.reduce((m, h) => ((h.aqi ?? 0) > (m.aqi ?? 0) ? h : m)).time.slice(11, 16))}
        </p>
      )}
    </Panel>
  );
}
