import { Sunrise, Sunset } from "lucide-react";
import { describeWeather } from "@/features/dashboard/daily";
import { aqiBand } from "@/features/mausam/aqi";
import { Card, Page, Problem, Skeleton, Source } from "../components/ui";
import { useAir, useSettings, useWeather } from "../lib/data";

const t = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleTimeString("en-US", o);

export function MausamScreen() {
  const { location } = useSettings();
  const w = useWeather(24);
  const air = useAir();
  if (!location) return <Page title="Mausam" back><Problem title="Choose your city in Settings" /></Page>;
  const d = w.data ? describeWeather(w.data.code, w.data.isDay) : null;
  const Icon = d?.icon;
  const band = air.data ? aqiBand(air.data.aqi) : null;
  return (
    <Page title="Mausam" ur="موسم" back>
      <p className="-mt-1 mb-3 text-sm text-ink-2">{location.name}</p>
      {w.error && !w.data ? (
        <Problem title="The forecast is unavailable" text={w.error} onRetry={w.reload} />
      ) : !w.data ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="glass flex items-center gap-4 p-5">
            {Icon && <Icon size={64} strokeWidth={1.4} className="text-gold" />}
            <div className="flex-1">
              <p className="text-5xl font-semibold tabular-nums">{Math.round(w.data.temperature)}°</p>
              <p className="text-ink-2">{d?.label}</p>
            </div>
            <div className="text-end text-sm text-ink-2">
              <p>Feels {Math.round(w.data.feelsLike)}°</p>
              <p>Humidity {w.data.humidity}%</p>
              <p>
                H {Math.round(w.data.high)}° L {Math.round(w.data.low)}°
              </p>
            </div>
          </div>
          {band && air.data && (
            <div className="glass mt-3 p-4" style={{ borderColor: `${band.color}66` }}>
              <p className="text-xs uppercase tracking-wider text-ink-3">Air quality</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tabular-nums" style={{ color: band.color }}>
                  {air.data.aqi}
                </span>
                <span style={{ color: band.color }}>
                  {band.label}{" "}
                  <span lang="ur" className="font-urdu text-sm">
                    {band.labelUr}
                  </span>
                </span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{band.advice}</p>
              <p className="mt-1 text-xs text-ink-3">
                PM2.5 {air.data.pm25.toFixed(0)} · PM10 {air.data.pm10.toFixed(0)} µg/m³
              </p>
            </div>
          )}
          <Card className="mt-3" title="Next 24 hours">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {w.data.hourly.slice(0, 24).map((h) => {
                const hd = describeWeather(h.code, h.isDay);
                const HI = hd.icon;
                return (
                  <div key={h.time} className="w-14 shrink-0 rounded-2xl bg-white/[0.04] py-2 text-center">
                    <p className="text-[11px] text-ink-3">{t(h.time, { hour: "numeric" })}</p>
                    <HI size={20} className="mx-auto my-1 text-ink-2" />
                    <p className="text-sm tabular-nums">{Math.round(h.temperature)}°</p>
                    {h.precipitation > 0 && <p className="text-[10px] text-cyan">{h.precipitation}mm</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-sm text-ink-2">
              <span className="flex items-center gap-1.5">
                <Sunrise size={18} className="text-gold" /> {t(w.data.sunrise, { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Sunset size={18} className="text-coral" /> {t(w.data.sunset, { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          </Card>
          <Card className="mt-3" title="7 days">
            <ul className="divide-y divide-line">
              {w.data.daily.slice(0, 7).map((day, i) => {
                const dd = describeWeather(day.code, true);
                const DI = dd.icon;
                return (
                  <li key={day.date} className="flex items-center gap-3 py-2">
                    <span className="w-12 text-sm">{i === 0 ? "Today" : new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
                    <DI size={20} className="text-ink-2" />
                    <span className="flex-1 text-sm text-ink-3">{dd.label}</span>
                    <span className="text-sm tabular-nums">
                      {Math.round(day.high)}° <span className="text-ink-3">/ {Math.round(day.low)}°</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
      <Source>Open-Meteo forecast and CAMS air-quality model (CC BY 4.0). AQI is a model estimate, not a station reading.</Source>
    </Page>
  );
}
