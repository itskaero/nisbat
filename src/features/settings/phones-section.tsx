"use client";

import { Check, Smartphone, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Field, Input, Panel } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/dates";

interface Device {
  id: string;
  name: string;
  platform: string;
  createdAt: string;
  lastSeen: string;
}
interface Pending {
  id: string;
  name: string;
  platform: string;
}

/** Settings → Phones: approve the Nisbat Android app, see trusted phones, household PIN. */
export function PhonesSection() {
  const { toast } = useToast();
  const [data, setData] = useState<{ devices: Device[]; pending: Pending[]; hasPin: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPinValue] = useState("");

  const load = () =>
    fetch("/api/devices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(() => setError("Couldn't load phones from the Nisbat server."));

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000); // new requests appear without a reload
    return () => clearInterval(t);
  }, []);

  const resolve = async (id: string, allow: boolean, name: string) => {
    const r = await fetch(`/api/devices/requests/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allow }) });
    toast(r.ok ? (allow ? `${name} can now use Nisbat` : `${name} was turned away`) : "That request has expired", { tone: r.ok ? "success" : "error" });
    void load();
  };
  const revoke = async (d: Device) => {
    await fetch(`/api/devices/${d.id}`, { method: "DELETE" });
    toast(`${d.name} is no longer trusted`);
    void load();
  };
  const savePin = async (value: string | null) => {
    const r = await fetch("/api/devices/pin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: value }) });
    toast(r.ok ? (value ? "Household PIN saved" : "Household PIN removed") : "The PIN must be 4 to 8 digits", { tone: r.ok ? "success" : "error" });
    setPinValue("");
    void load();
  };

  return (
    <Panel className="scroll-mt-6 p-5 sm:p-6" aria-labelledby="phones-h" id="phones">
      <h2 id="phones-h" className="text-base font-semibold">
        Phones (Nisbat app)
      </h2>
      <p className="mt-1 text-xs text-ink-2">
        The Android app asks once to join. Allow it here or on the TV; after that it connects to the TV and the family&apos;s lists on its own.
      </p>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}

      {!!data?.pending.length && (
        <ul className="mt-4 space-y-2" aria-label="Phones waiting for approval">
          {data.pending.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/30 bg-gold/8 p-3">
              <Smartphone className="size-5 text-gold" aria-hidden />
              <span className="min-w-0 flex-1 text-sm">
                <strong>{p.name}</strong> wants to use Nisbat
              </span>
              <Button size="sm" variant="primary" onClick={() => resolve(p.id, true, p.name)}>
                <Check className="size-4" /> Allow
              </Button>
              <Button size="sm" variant="ghost" onClick={() => resolve(p.id, false, p.name)}>
                <X className="size-4" /> Deny
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-4 divide-y divide-white/8" aria-label="Trusted phones">
        {data?.devices.length === 0 && <li className="py-2 text-sm text-ink-3">No phones yet.</li>}
        {data?.devices.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5">
            <Smartphone className="size-4 text-ink-3" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{d.name}</span>
              <span className="block text-[11px] text-ink-3" suppressHydrationWarning>
                Last used {timeAgo(d.lastSeen)}
              </span>
            </span>
            <Button size="sm" variant="ghost" onClick={() => revoke(d)} aria-label={`Remove ${d.name}`}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </li>
        ))}
      </ul>

      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void savePin(pin);
        }}
      >
        <Field label={data?.hasPin ? "Household PIN (set)" : "Household PIN (optional)"} htmlFor="household-pin">
          <Input id="household-pin" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))} placeholder="4–8 digits" className="w-40" />
        </Field>
        <Button type="submit" size="sm" disabled={pin.length < 4} className="mb-0.5">
          Save PIN
        </Button>
        {data?.hasPin && (
          <Button type="button" size="sm" variant="ghost" className="mb-0.5" onClick={() => savePin(null)}>
            Remove PIN
          </Button>
        )}
      </form>
      <p className="mt-1.5 text-[11px] text-ink-3">A phone that enters the household PIN joins without waiting for approval.</p>
    </Panel>
  );
}
