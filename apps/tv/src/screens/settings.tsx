import { useEffect, useState } from "preact/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { Card, Chips, ScreenHeader, Source } from "../components/ui";
import { answerPairing, identity } from "../lib/remote";
import { ambient, pairing } from "../lib/ui-state";

interface Devices {
  devices: { id: string; name: string; lastSeen: string }[];
}

/** TV-side settings. Everything else (city, prayer method…) is set on the phone app or website. */
export function SettingsScreen() {
  const s = usePersisted(settingsStore);
  const waiting = pairing.use();
  const [devices, setDevices] = useState<Devices["devices"]>([]);
  useEffect(() => {
    fetch("/api/devices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Devices | null) => d && setDevices(d.devices))
      .catch(() => undefined);
  }, [waiting.length]);
  const update = (patch: Partial<typeof s>) => settingsStore.set((x) => ({ ...x, ...patch }));
  const me = identity();

  return (
    <>
      <ScreenHeader title="Settings" sub={`This TV: ${me.name}`} />
      <div class="grid grid-cols-2 gap-6">
        <Card title="Ambient screen">
          <p class="mb-4 text-lg text-ink-2">After the TV is idle, show the clock, prayer times, ayah and family photos.</p>
          <Chips
            label="Ambient after"
            value={String(s.ambientMinutes)}
            onChange={(v) => update({ ambientMinutes: Number(v) })}
            options={[
              { value: "2", label: "2 min" },
              { value: "5", label: "5 min" },
              { value: "15", label: "15 min" },
              { value: "0", label: "Never" },
            ]}
          />
          <div class="mt-4 flex flex-wrap gap-3">
            <button type="button" data-autofocus class="chip text-lg" onClick={() => ambient.set(true)}>
              Show it now
            </button>
            <button type="button" class="chip text-lg" aria-pressed={s.ambientPhotos} onClick={() => update({ ambientPhotos: !s.ambientPhotos })}>
              Family photos {s.ambientPhotos ? "on" : "off"}
            </button>
          </div>
        </Card>
        <Card title="Motion & prayer chime">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="chip text-lg" aria-pressed={s.motion === "reduced"} onClick={() => update({ motion: s.motion === "reduced" ? "system" : "reduced" })}>
              Reduce motion {s.motion === "reduced" ? "on" : "off"}
            </button>
            <button type="button" class="chip text-lg" aria-pressed={s.reminderChime} onClick={() => update({ reminderChime: !s.reminderChime })}>
              Prayer chime {s.reminderChime ? "on" : "off"}
            </button>
          </div>
          <p class="mt-4 text-lg text-ink-2">
            City: {s.location?.name ?? "not set"} · prayer reminders: {s.prayerReminders.join(", ") || "none"}
          </p>
          <Source>City, prayer method and language are changed from the Nisbat phone app or the website.</Source>
        </Card>
        <Card title="Phones">
          {waiting.map((w) => (
            <div key={w.id} class="mb-3 flex items-center gap-3 rounded-2xl bg-gold/10 px-4 py-3">
              <span class="flex-1 text-lg">{w.name} wants to join</span>
              <button type="button" class="chip text-lg" onClick={() => answerPairing(w.id, true)}>
                Allow
              </button>
              <button type="button" class="chip text-lg" onClick={() => answerPairing(w.id, false)}>
                Deny
              </button>
            </div>
          ))}
          {devices.length === 0 ? (
            <p class="text-lg text-ink-2">No phones yet. Install the Nisbat app; the first time it opens, this TV asks you to allow it.</p>
          ) : (
            <ul class="space-y-1 text-lg">
              {devices.map((d) => (
                <li key={d.id} class="flex justify-between">
                  <span>{d.name}</span>
                  <span class="text-ink-3">{new Date(d.lastSeen).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </li>
              ))}
            </ul>
          )}
          <Source>Remove phones from the website: Settings → Phones.</Source>
        </Card>
      </div>
    </>
  );
}
