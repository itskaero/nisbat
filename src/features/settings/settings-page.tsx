"use client";

import { CheckCircle2, Download, Loader2, MapPin, RefreshCw, Search, Settings, Upload, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Button, Field, Input, Panel, Segmented, Select, Switch, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { PRAYER_METHODS } from "@/features/dashboard/prayer-methods";
import { RECITERS, TRANSLATIONS } from "@/features/quran/editions";
import { setDailyGoal } from "@/features/quran/quran-state";
import { COMMON_TIMEZONES, isValidTimeZone } from "@/lib/dates";
import { useDebounced } from "@/lib/hooks";
import { allStores, useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { setAmbientOpen } from "@/lib/tv/ambient-state";
import { tvModeReason, useTvMode } from "@/lib/tv/tv-mode";
import { PairingCard } from "@/components/tv/pairing-card";
import { PhotoManager } from "@/features/photos/photo-manager";
import backgroundCredits from "@/data/background-credits.json";
import { SyncNote } from "@/components/sync-status";
import { NATIONAL, SPI_CITIES, nearestSpiCity, spiCityName } from "@/data/spi-cities";
import { quranStore, settingsStore, type Settings as SettingsT } from "@/lib/storage/stores";
import type { SavedLocation } from "@/types/domain";

function Section({ id, title, description, children }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Panel className="scroll-mt-6 p-5 sm:p-6" aria-labelledby={`${id}-h`} id={id}>
      <h2 id={`${id}-h`} className="text-base font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-xs text-ink-2">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Panel>
  );
}

const update = (patch: Partial<SettingsT>) => settingsStore.set((s) => ({ ...s, ...patch }));

export function SettingsPage() {
  const s = usePersisted(settingsStore);
  const quran = usePersisted(quranStore);
  const id = useId();
  const tv = useTvMode();
  const reason = useHydrated() ? tvModeReason() : "";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
          <Settings className="size-7 text-emerald" aria-hidden /> Settings
        </h1>
        <p className="mt-1 text-sm text-ink-2">Preferences are saved in this browser.</p>
      </div>

      <Section id="profile" title="Profile">
        <Field label="Your name (used in the greeting)" htmlFor={`${id}-name`}>
          <Input id={`${id}-name`} value={s.name} maxLength={40} placeholder="e.g. Ali" onChange={(e) => update({ name: e.target.value })} />
        </Field>
      </Section>

      <Section
        id="tv"
        title="TV & Chromecast"
        description="TV mode uses a larger 10-foot layout with D-pad navigation for TV remotes, solid panels for Chromecast GPUs, and the ambient screen."
      >
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-2">Display mode</p>
          <Segmented
            label="Display mode"
            value={s.displayMode}
            onChange={(v) => update({ displayMode: v })}
            options={[
              { value: "auto", label: "Auto" },
              { value: "standard", label: "Standard" },
              { value: "tv", label: "TV" },
            ]}
          />
          <p className="text-[11px] text-ink-3">
            Auto turns on TV mode on Chromecast / Google TV browsers or when opened with <code>?tv=1</code>. This screen: {tv ? "TV mode" : "standard mode"} ({reason}).
          </p>
        </div>
        <Field label="Ambient screen after" htmlFor={`${id}-ambient`} hint="Clock, weather, next prayer, verse and headlines. Never covers playing video or recitation.">
          <Select id={`${id}-ambient`} value={s.ambientMinutes} onChange={(e) => update({ ambientMinutes: Number(e.target.value) })}>
            <option value={0}>Never</option>
            {[1, 2, 5, 10, 15, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m} minute{m === 1 ? "" : "s"} of inactivity
              </option>
            ))}
          </Select>
        </Field>
        {tv && s.ambientMinutes > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setAmbientOpen(true)}>
            Show ambient screen now
          </Button>
        )}
        <div id="remote" className="scroll-mt-6 space-y-2">
          <p className="text-xs font-medium text-ink-2">Phone remote</p>
          {tv ? (
            <PairingCard allowReset className="!bg-white/[0.03]" />
          ) : (
            <p className="text-xs text-ink-3">The phone remote connects to screens running in TV mode. Switch this screen to TV mode to show its pairing code.</p>
          )}
        </div>
      </Section>

      <Section id="photos" title="Family photo frame" description="Photos shared from any phone or computer appear on the TV's ambient screen, like a digital photo frame.">
        <Switch label="Show photos on the ambient screen" checked={s.ambientPhotos} onChange={(v) => update({ ambientPhotos: v })} />
        <PhotoManager />
      </Section>

      <Section id="language" title="Language & region">
        <Field label="Interface language" htmlFor={`${id}-lang`} hint="Urdu switches the layout to right-to-left and translates navigation, headings and common actions.">
          <Select id={`${id}-lang`} value={s.language} onChange={(e) => update({ language: e.target.value as SettingsT["language"] })}>
            <option value="en">English</option>
            <option value="ur">اردو (Urdu)</option>
          </Select>
        </Field>
        <Field label="Time zone" htmlFor={`${id}-tz`} hint="Used for greetings, due dates, daily progress and prayer times.">
          <Select id={`${id}-tz`} value={s.timezone} onChange={(e) => update({ timezone: e.target.value })}>
            {[...new Set([s.timezone, ...COMMON_TIMEZONES])].filter(isValidTimeZone).map((tz) => (
              <option key={tz} value={tz}>
                {tz === "Asia/Karachi" ? "Asia/Karachi (Pakistan Standard Time)" : tz}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section id="appearance" title="Appearance & accessibility">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-2">Background</p>
          <Segmented
            label="Background"
            value={s.background}
            onChange={(v) => update({ background: v })}
            options={[
              { value: "photo", label: "Photos (by time of day)" },
              { value: "dusk", label: "Dusk skyline" },
              { value: "night", label: "Night" },
              { value: "plain", label: "Plain" },
            ]}
          />
          {s.background === "photo" && (
            <p className="text-[11px] leading-relaxed text-ink-3">
              Photos:{" "}
              {Object.entries(backgroundCredits).map(([slot, c], i) => (
                <span key={slot}>
                  {i > 0 && " · "}
                  <span className="capitalize">{slot}</span> —{" "}
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {c.title}
                  </a>{" "}
                  by {c.author} ({c.license})
                </span>
              ))}
              . Cropped and resized.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-2">Text size</p>
          <Segmented
            label="Text size"
            value={s.textSize}
            onChange={(v) => update({ textSize: v })}
            options={[
              { value: "md", label: "Default" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "Extra large" },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-2">Motion</p>
          <Segmented
            label="Motion"
            value={s.motion}
            onChange={(v) => update({ motion: v })}
            options={[
              { value: "system", label: "Follow system" },
              { value: "reduced", label: "Reduce motion" },
              { value: "full", label: "Full" },
            ]}
          />
        </div>
      </Section>

      <Section id="location" title="Location, weather & prayer times" description="Weather from Open-Meteo; prayer times calculated by the AlAdhan API.">
        <LocationPicker />
        <Switch label="Show weather on Home" checked={s.showWeather} onChange={(v) => update({ showWeather: v })} />
        <Switch label="Show prayer times on Home" checked={s.showPrayer} onChange={(v) => update({ showPrayer: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Calculation method" htmlFor={`${id}-method`}>
            <Select id={`${id}-method`} value={s.prayerMethod} onChange={(e) => update({ prayerMethod: Number(e.target.value) })}>
              {Object.entries(PRAYER_METHODS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asr calculation" htmlFor={`${id}-asr`}>
            <Select id={`${id}-asr`} value={s.asrSchool} onChange={(e) => update({ asrSchool: Number(e.target.value) as 0 | 1 })}>
              <option value={1}>Hanafi (later Asr)</option>
              <option value={0}>Standard (Shafi&apos;i, Maliki, Hanbali)</option>
            </Select>
          </Field>
        </div>
        <p className="text-[11px] text-ink-3">Calculated times can differ from your local masjid by a few minutes.</p>
      </Section>

      <Section id="namaz" title="Prayer reminders" description="An on-screen card at each selected prayer time. On the TV it fills the screen until dismissed with OK.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Remind me at">
          {(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((p) => {
            const on = s.prayerReminders.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => update({ prayerReminders: on ? s.prayerReminders.filter((x) => x !== p) : [...s.prayerReminders, p] })}
                className={cn("h-9 rounded-full border px-4 text-sm", on ? "border-emerald/50 bg-emerald/15 text-emerald" : "border-white/12 text-ink-2")}
              >
                {p}
              </button>
            );
          })}
        </div>
        <Switch label="Play a soft chime" description="A short bell synthesised by Nisbat. Adhan audio isn't included because no openly licensed recording has been verified yet." checked={s.reminderChime} onChange={(v) => update({ reminderChime: v })} />
      </Section>

      <Section id="quran" title="Tadabur Quran">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Translation" htmlFor={`${id}-tr`}>
            <Select id={`${id}-tr`} value={s.quranTranslation} onChange={(e) => update({ quranTranslation: e.target.value })}>
              {TRANSLATIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reciter" htmlFor={`${id}-rec`}>
            <Select id={`${id}-rec`} value={s.quranReciter} onChange={(e) => update({ quranReciter: e.target.value })}>
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daily verse goal" htmlFor={`${id}-goal`}>
            <Input id={`${id}-goal`} type="number" min={1} max={100} value={quran.dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value) || 1)} />
          </Field>
        </div>
      </Section>

      <Section id="saman" title="Saman & Bazaar prices">
        <Field
          label="Price city"
          htmlFor={`${id}-pricecity`}
          hint="Official weekly retail prices from the Pakistan Bureau of Statistics (SPI) are collected in these 17 cities."
        >
          <Select id={`${id}-pricecity`} value={s.priceCity} onChange={(e) => update({ priceCity: e.target.value })}>
            <option value="auto">Automatic — nearest to {s.location?.name ?? "your location"} ({spiCityName(nearestSpiCity(s.location))})</option>
            {SPI_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value={NATIONAL.slug}>{NATIONAL.name}</option>
          </Select>
        </Field>
        <Switch
          label="Show sample prices for items PBS doesn't cover"
          description="PBS publishes official prices for about 25 of the catalog's staples. For other items, show rough illustrative figures (labelled est.) — turn off to enter only your own prices."
          checked={s.showSamplePrices}
          onChange={(v) => update({ showSamplePrices: v })}
        />
      </Section>

      <Section id="live-tv" title="Live TV">
        <Switch
          label="Show community-listed streams (iptv-org)"
          description={
            <>
              Adds HTTPS streams indexed by the open-source{" "}
              <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noreferrer" className="underline">
                iptv-org
              </a>{" "}
              project. They are not verified by Nisbat or the broadcasters, may stop working, and may not be licensed for your use — enable only if you
              accept that. Sports channels and token-protected links are excluded.
            </>
          }
          checked={s.communityStreams}
          onChange={(v) => update({ communityStreams: v })}
        />
      </Section>

      <SourceStatus />
      <DataControls />
    </div>
  );
}

function LocationPicker() {
  const { location } = usePersisted(settingsStore);
  const [q, setQ] = useState("");
  const debounced = useDebounced(q.trim(), 350);
  const [results, setResults] = useState<SavedLocation[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const { toast } = useToast();

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setState("loading");
    fetch(`/api/geocode?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        setState(d.error ? "error" : "idle");
      })
      .catch((e: Error) => e.name !== "AbortError" && setState("error"));
    return () => ctrl.abort();
  }, [debounced]);

  return (
    <div>
      <p className="flex items-center gap-2 text-sm">
        <MapPin className="size-4 text-emerald" />
        {location ? (
          <>
            {location.name}
            {location.admin ? `, ${location.admin}` : ""}, {location.country}
            <span className="text-xs text-ink-3">
              ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})
            </span>
          </>
        ) : (
          <span className="text-ink-2">No location set</span>
        )}
        {location && (
          <button type="button" className="ms-auto text-xs text-ink-3 underline hover:text-ink" onClick={() => update({ location: null })}>
            Clear
          </button>
        )}
      </p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a city, e.g. Lahore" aria-label="Search city" className="ps-9" />
        {state === "loading" && <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" />}
      </div>
      {state === "error" && <p className="mt-2 text-xs text-coral">Location search is unavailable right now.</p>}
      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-white/10">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-white/6"
                onClick={() => {
                  update({ location: r });
                  setQ("");
                  setResults([]);
                  toast(`Location set to ${r.name}`);
                }}
              >
                <MapPin className="size-3.5 text-ink-3" />
                {r.name}
                <span className="text-xs text-ink-3">
                  {[r.admin, r.country].filter(Boolean).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {debounced.length >= 2 && state === "idle" && results.length === 0 && <p className="mt-2 text-xs text-ink-3">No places found.</p>}
    </div>
  );
}

const CHECKS = [
  { id: "quran", label: "Quran text & audio — AlQuran Cloud", url: "/api/quran/ayah?ref=1:1" },
  { id: "news", label: "News feeds — Sixty, Dawn", url: "/api/news?category=top" },
  { id: "urdu", label: "Urdu news — Sixty (اردو), BBC Urdu", url: "/api/news?category=urdu" },
  { id: "weather", label: "Weather — Open-Meteo", url: "/api/weather?lat=31.52&lon=74.36" },
  { id: "prayer", label: "Prayer times — AlAdhan", url: "" },
  { id: "tv", label: "Community TV list — iptv-org", url: "/api/tv/community" },
];

function SourceStatus() {
  const { timezone } = usePersisted(settingsStore);
  const [status, setStatus] = useState<Record<string, { ok: boolean; detail?: string } | "loading">>({});

  const run = () => {
    for (const c of CHECKS) {
      const url = c.id === "prayer" ? `/api/prayer?lat=31.52&lon=74.36&method=1&school=1&date=${new Date().toISOString().slice(0, 10)}&tz=${encodeURIComponent(timezone)}` : c.url;
      setStatus((s) => ({ ...s, [c.id]: "loading" }));
      fetch(url)
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          let detail: string | undefined;
          if (body.sources) {
            const down = body.sources.filter((x: { ok: boolean }) => !x.ok).map((x: { publisher: string }) => x.publisher);
            detail = down.length ? `Unavailable: ${down.join(", ")}` : undefined;
          }
          setStatus((s) => ({ ...s, [c.id]: { ok: r.ok, detail: r.ok ? detail : body.error } }));
        })
        .catch(() => setStatus((s) => ({ ...s, [c.id]: { ok: false, detail: "Network error" } })));
    }
  };

  return (
    <Section id="sources" title="Data sources" description="Live check of each external service, made through Nisbat's server.">
      <ul className="divide-y divide-white/6">
        {CHECKS.map((c) => {
          const st = status[c.id];
          return (
            <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
              {st === "loading" ? (
                <Loader2 className="size-4 animate-spin text-ink-3" />
              ) : st ? (
                st.ok ? (
                  <CheckCircle2 className="size-4 text-emerald" aria-label="Available" />
                ) : (
                  <XCircle className="size-4 text-coral" aria-label="Unavailable" />
                )
              ) : (
                <span className="size-4 rounded-full border border-white/20" aria-label="Not checked" />
              )}
              <span className="flex-1">{c.label}</span>
              {st && st !== "loading" && st.detail && <span className={cn("text-xs", st.ok ? "text-gold" : "text-coral")}>{st.detail}</span>}
            </li>
          );
        })}
      </ul>
      <Button size="sm" variant="secondary" onClick={run}>
        <RefreshCw className="size-4" /> Check now
      </Button>
    </Section>
  );
}

function DataControls() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  const exportAll = () => {
    const data = Object.fromEntries(allStores().map((s) => [s.key, s.exportData()]));
    const blob = new Blob([JSON.stringify({ app: "nisbat-home", exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nisbat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
  };

  const importAll = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.app !== "nisbat-home" || typeof parsed.data !== "object") throw new Error("Not a Nisbat backup");
      const failed: string[] = [];
      for (const s of allStores()) if (s.key in parsed.data && !s.importData(parsed.data[s.key])) failed.push(s.key);
      toast(failed.length ? `Imported, but skipped invalid sections: ${failed.join(", ")}` : "Backup restored", { tone: failed.length ? "info" : "success" });
    } catch (e) {
      toast(`Couldn't import: ${(e as Error).message}`, { tone: "error" });
    }
  };

  return (
    <Section
      id="data"
      title="Your data"
      description="Tasks, the Saman list, Quran bookmarks, progress and reflections, saved news and TV favourites are shared with every Nisbat screen in your home through the Nisbat server, and also kept in this browser so they work offline. Settings on this page apply to this screen only. Export a backup to keep a copy."
    >
      <SyncNote className="text-start" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportAll}>
          <Download className="size-4" /> Export backup
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Import backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importAll(f);
            e.target.value = "";
          }}
        />
        <Button variant="danger" className="ms-auto" onClick={() => setConfirm(true)}>
          Reset all data
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          allStores().forEach((s) => s.reset());
          toast("All local data cleared", { tone: "info" });
        }}
        title="Reset all Nisbat data?"
        description="This permanently deletes your tasks, Saman list, Quran bookmarks, reflections, saved news, TV favourites and settings — on every synced Nisbat screen. Export a backup first if you might need them."
        confirmLabel="Delete everything"
      />
    </Section>
  );
}
