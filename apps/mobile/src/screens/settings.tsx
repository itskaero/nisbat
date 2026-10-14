import { ImagePlus, LogOut, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NATIONAL, SPI_CITIES, nearestSpiCity, spiCityName } from "@/data/spi-cities";
import { PRAYER_METHODS } from "@/features/dashboard/prayer-methods";
import { uploadPhotos } from "@/features/photos/upload";
import { RECITERS, TRANSLATIONS } from "@/features/quran/editions";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, type Settings } from "@/lib/storage/stores";
import { Btn, Card, Field, Page, Source, inputCls } from "../components/ui";
import { api } from "../lib/cached";
import { saveConnection, useConnection } from "../lib/conn";
import { schedulePrayerNotifications } from "../lib/notify";
import { toast } from "../lib/toast";

const update = (patch: Partial<Settings>) => {
  settingsStore.set((s) => ({ ...s, ...patch }));
  if ("location" in patch || "prayerMethod" in patch || "asrSchool" in patch) void schedulePrayerNotifications();
};

export function SettingsScreen() {
  const s = usePersisted(settingsStore);
  const conn = useConnection();
  return (
    <Page title="Settings" back>
      <Card title="You">
        <Field label="Your name (for the greeting)">
          <input className={inputCls} value={s.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} placeholder="Ali" />
        </Field>
      </Card>

      <CityPicker />

      <Card className="mt-3" title="Prayer times">
        <div className="space-y-3">
          <Field label="Calculation method">
            <select className={inputCls} value={s.prayerMethod} onChange={(e) => update({ prayerMethod: Number(e.target.value) })}>
              {Object.entries(PRAYER_METHODS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Asr">
            <select className={inputCls} value={s.asrSchool} onChange={(e) => update({ asrSchool: Number(e.target.value) as 0 | 1 })}>
              <option value={1}>Hanafi (later Asr)</option>
              <option value={0}>Shafi&apos;i, Maliki, Hanbali</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="mt-3" title="Quran">
        <div className="space-y-3">
          <Field label="Translation">
            <select className={inputCls} value={s.quranTranslation} onChange={(e) => update({ quranTranslation: e.target.value })}>
              {TRANSLATIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reciter">
            <select className={inputCls} value={s.quranReciter} onChange={(e) => update({ quranReciter: e.target.value })}>
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="mt-3" title="Saman & Bazaar prices">
        <Field label="Price city" hint="Official weekly retail prices from the Pakistan Bureau of Statistics.">
          <select className={inputCls} value={s.priceCity} onChange={(e) => update({ priceCity: e.target.value })}>
            <option value="auto">Nearest to {s.location?.name ?? "my city"} ({spiCityName(nearestSpiCity(s.location))})</option>
            {SPI_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value={NATIONAL.slug}>{NATIONAL.name}</option>
          </select>
        </Field>
      </Card>

      <Photos />

      <Card className="mt-3" title="Nisbat server">
        {conn && (
          <p className="text-sm text-ink-2">
            {conn.serverName} at {conn.base.replace(/^http:\/\//, "")}. This phone is &ldquo;{conn.phoneName}&rdquo;.
          </p>
        )}
        <Btn
          tone="danger"
          className="mt-3 w-full"
          onClick={async () => {
            if (!confirm("Disconnect this phone from Nisbat? You'll need to ask to join again.")) return;
            await saveConnection(null);
            location.reload();
          }}
        >
          <LogOut size={16} /> Disconnect this phone
        </Btn>
        <Source>Family lists sync through your Nisbat server on the home Wi-Fi. Away from home the app shows the last synced data and catches up when you&apos;re back.</Source>
      </Card>
    </Page>
  );
}

interface Place {
  name: string;
  admin?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

function CityPicker() {
  const s = usePersisted(settingsStore);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const t = setTimeout(() => {
      api<{ results: Place[] }>(`/api/geocode?q=${encodeURIComponent(q.trim())}`)
        .then((r) => setResults(r.results))
        .catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Card className="mt-3" title="City (weather & prayer times)">
      <p className="mb-2 flex items-center gap-2 text-sm">
        <MapPin size={16} className="text-emerald" /> {s.location ? `${s.location.name}${s.location.admin ? `, ${s.location.admin}` : ""}` : "Not set"}
      </p>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input className={`${inputCls} ps-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a city" />
      </div>
      {results.length > 0 && (
        <ul className="mt-2 space-y-1">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                className="press w-full rounded-xl px-3 py-2 text-start hover:bg-white/[0.05]"
                onClick={() => {
                  update({ location: { name: r.name, admin: r.admin ?? "", country: r.country ?? "", latitude: r.latitude, longitude: r.longitude, timezone: r.timezone ?? s.timezone } });
                  setQ("");
                  toast(`City set to ${r.name}`);
                }}
              >
                {r.name}
                <span className="text-ink-3">
                  {r.admin ? `, ${r.admin}` : ""}
                  {r.country ? ` · ${r.country}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Photos() {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <Card className="mt-3" title="Family photo frame">
      <p className="text-sm text-ink-2">Photos you send appear on the TV&apos;s ambient screen.</p>
      <label className="press mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-white/[0.06] py-3 font-medium">
        <ImagePlus size={18} /> {busy ?? "Send photos to the TV"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={!!busy}
          onChange={async (e) => {
            const files = e.currentTarget.files;
            if (!files?.length) return;
            try {
              const r = await uploadPhotos(files, (done, total) => setBusy(`Sending ${done}/${total}…`));
              toast(r.errors.length ? `Sent ${r.uploaded}; ${r.errors.length} failed: ${r.errors[0]}` : `Sent ${r.uploaded} photo${r.uploaded === 1 ? "" : "s"} to the frame`, r.errors.length ? "error" : "ok");
            } catch (err) {
              toast((err as Error).message, "error");
            } finally {
              setBusy(null);
              e.currentTarget.value = "";
            }
          }}
        />
      </label>
    </Card>
  );
}
