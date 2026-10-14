import { Sunrise, Sunset } from "lucide-react";
import { describeWeather } from "@/features/dashboard/daily";
import { aqiBand } from "@/features/mausam/aqi";
import { Card, Problem, ScreenHeader, Skeleton, Source } from "../components/ui";
import { useAir, useSettings, useWeather } from "../lib/data";

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function MausamScreen() {
  const { location } = useSettings();
  const w = useWeather(24);
  const air = useAir();
  if (!location) return <Problem title="Choose your city in Settings to see the weather" />;
  const d = w.data ? describeWeather(w.data.code, w.data.isDay) : null;
  const Icon = d?.icon;
  const band = air.data ? aqiBand(air.data.aqi) : null;
  const temps = w.data?.hourly.map((h) => h.temperature) ?? [];
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);

  return (
    <>
      <ScreenHeader title="Mausam & Smog" ur="موسم" sub={location.name} />
      {w.error && !w.data ? (
        <Problem title="The forecast is unavailable" text={w.error} onRetry={w.reload} />
      ) : !w.data ? (
        <Skeleton class="h-96" />
      ) : (
        <div class="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
          <div class="flex flex-col gap-6">
            <Card title="Now">
              <div class="flex items-center gap-8">
                {Icon && <Icon size={110} strokeWidth={1.3} class="text-gold" aria-hidden="true" />}
                <div>
                  <p class="text-[5rem] font-semibold leading-none tabular-nums">{Math.round(w.data.temperature)}°</p>
                  <p class="mt-1 text-2xl text-ink-2">{d?.label}</p>
                </div>
                <div class="ms-auto space-y-1 text-end text-xl text-ink-2">
                  <p>Feels like {Math.round(w.data.feelsLike)}°</p>
                  <p>Humidity {w.data.humidity}%</p>
                  {w.data.wind != null && <p>Wind {Math.round(w.data.wind)} km/h</p>}
                  <p>
                    H {Math.round(w.data.high)}° · L {Math.round(w.data.low)}°
                  </p>
                </div>
              </div>
              <div class="mt-6 flex justify-between text-xl text-ink-2">
                <span class="flex items-center gap-2">
                  <Sunrise size={24} class="text-gold" /> {timeLabel(w.data.sunrise)}
                </span>
                <span class="flex items-center gap-2">
                  <Sunset size={24} class="text-coral" /> {timeLabel(w.data.sunset)}
                </span>
              </div>
            </Card>
            <Card title="Next 24 hours">
              <div class="grid h-44 items-end gap-1.5" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {w.data.hourly.slice(0, 24).map((h, i) => {
                  const t = hi > lo ? (h.temperature - lo) / (hi - lo) : 0.5;
                  return (
                    <div key={h.time} class="flex h-full flex-col items-center justify-end gap-1 whitespace-nowrap">
                      {i % 3 === 0 && <span class="text-sm tabular-nums">{Math.round(h.temperature)}°</span>}
                      <div class="w-full rounded-t-md bg-gold/70" style={{ height: `${20 + t * 80}%` }} />
                      {i % 3 === 0 && <span class="text-xs text-ink-3">{hourLabel(h.time)}</span>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          <div class="flex flex-col gap-6">
            <button type="button" data-autofocus class="card block p-6 text-start">
              <p class="text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-ink-2">Air quality</p>
              {!air.data || !band ? (
                <p class="mt-3 text-lg text-ink-3">{air.error ?? "Loading…"}</p>
              ) : (
                <>
                  <p class="mt-3 flex items-baseline gap-4">
                    <span class="text-[4.5rem] font-semibold leading-none tabular-nums" style={{ color: band.color }}>
                      {air.data.aqi}
                    </span>
                    <span class="text-2xl" style={{ color: band.color }}>
                      {band.label}{" "}
                      <span lang="ur" class="font-urdu text-xl">
                        {band.labelUr}
                      </span>
                    </span>
                  </p>
                  <p class="mt-3 text-xl leading-relaxed text-ink-2">{band.advice}</p>
                  <p class="mt-3 text-lg text-ink-3">
                    PM2.5 {air.data.pm25.toFixed(0)} · PM10 {air.data.pm10.toFixed(0)} µg/m³
                  </p>
                </>
              )}
            </button>
            <Card title="7 days">
              <ul class="divide-y divide-line">
                {w.data.daily.slice(0, 7).map((day, i) => {
                  const dd = describeWeather(day.code, true);
                  const DI = dd.icon;
                  return (
                    <li key={day.date} class="flex items-center gap-4 py-2.5 text-xl">
                      <span class="w-24">{i === 0 ? "Today" : new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
                      <DI size={26} class="text-ink-2" aria-hidden="true" />
                      <span class="flex-1 text-ink-3">{dd.label}</span>
                      <span class="tabular-nums">
                        {Math.round(day.high)}° <span class="text-ink-3">/ {Math.round(day.low)}°</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}
      <Source>Open-Meteo forecast and CAMS air-quality model (CC BY 4.0). AQI is a model estimate, not a station reading.</Source>
    </>
  );
}
