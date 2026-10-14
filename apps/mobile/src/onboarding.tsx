import { CheckCircle2, Loader2, Search, Server, Smartphone, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { Btn, Field, inputCls } from "./components/ui";
import { checkPairing, discover, normaliseAddress, probe, requestPairing, saveConnection, type ServerInfo } from "./lib/conn";
import { phoneName, tap } from "./lib/native";

type Step = { s: "find" } | { s: "name"; server: ServerInfo } | { s: "wait"; server: ServerInfo; requestId: string; name: string } | { s: "done" };

/**
 * First run: find Nisbat on the Wi-Fi (no typing), ask once to join, and
 * wait for someone at home to press OK on the TV (or enter the household PIN).
 */
export function Onboarding({ onDone, reason }: { onDone: () => void; reason?: string }) {
  const [step, setStep] = useState<Step>({ s: "find" });
  return (
    <div className="pt-safe pb-safe flex min-h-full flex-col px-5">
      <div className="mt-8 flex items-center gap-3">
        <span className="size-11 rounded-2xl" style={{ background: "linear-gradient(140deg,#45d49a,#65c7e8)" }} />
        <div>
          <p className="text-2xl font-semibold">Nisbat</p>
          <p lang="ur" className="font-urdu -mt-1 text-ink-2">
            نسبت
          </p>
        </div>
      </div>
      {reason && <p className="glass mt-6 p-3 text-sm text-gold">{reason}</p>}
      <div className="mt-8 flex-1">
        {step.s === "find" && <Find onFound={(server) => setStep({ s: "name", server })} />}
        {step.s === "name" && <Name server={step.server} onAsked={(requestId, name) => setStep({ s: "wait", server: step.server, requestId, name })} onApproved={() => setStep({ s: "done" })} />}
        {step.s === "wait" && <Wait {...step} onApproved={() => setStep({ s: "done" })} onRestart={() => setStep({ s: "find" })} />}
        {step.s === "done" && <Done onDone={onDone} />}
      </div>
    </div>
  );
}

function Find({ onFound }: { onFound: (s: ServerInfo) => void }) {
  const [status, setStatus] = useState<"idle" | "searching" | "none">("idle");
  const [progress, setProgress] = useState("");
  const [found, setFound] = useState<ServerInfo[]>([]);
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const search = async () => {
    setStatus("searching");
    setFound([]);
    const list = await discover(setProgress);
    setFound(list);
    setStatus(list.length ? "idle" : "none");
    if (list.length === 1) void tap("medium");
  };
  useEffect(() => {
    void search();
  }, []);

  const tryManual = async () => {
    setManualError(null);
    const base = normaliseAddress(manual);
    if (!base) return setManualError("Enter the address on your home network, e.g. 192.168.1.42:3080");
    const s = await probe(base, 4000);
    if (!s) return setManualError("Nisbat didn't answer there. Check the address and that this phone is on the home Wi-Fi.");
    onFound(s);
  };

  return (
    <>
      <h1 className="text-3xl font-semibold leading-tight">Connect to your family&apos;s Nisbat</h1>
      <p className="mt-2 text-ink-2">Your Nisbat server keeps the family&apos;s lists, Quran progress and settings. This phone talks to it over your home Wi-Fi.</p>
      <div className="mt-6 space-y-3">
        {status === "searching" && (
          <p className="glass flex items-center gap-3 p-4 text-ink-2">
            <Loader2 className="animate-spin" size={20} /> {progress || "Looking…"}
          </p>
        )}
        {found.map((s) => (
          <button key={s.id} type="button" className="glass press flex w-full items-center gap-3 p-4 text-start" onClick={() => onFound(s)}>
            <Server className="text-emerald" size={24} />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{s.name}</span>
              <span className="block text-sm text-ink-3">{s.base.replace(/^http:\/\//, "")}</span>
            </span>
            <span className="text-sm text-emerald">Connect</span>
          </button>
        ))}
        {status === "none" && <p className="glass p-4 text-sm text-ink-2">Couldn&apos;t find Nisbat automatically. Make sure this phone is on the home Wi-Fi, or type the address below.</p>}
        {status !== "searching" && (
          <Btn className="w-full" onClick={search}>
            <Search size={18} /> Search again
          </Btn>
        )}
      </div>
      <div className="mt-8">
        <Field label="Or type the address" hint="Shown on the website: Settings → Phones.">
          <div className="flex gap-2">
            <input className={inputCls} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="192.168.1.42:3080" value={manual} onChange={(e) => setManual(e.target.value)} />
            <Btn tone="primary" onClick={tryManual} disabled={!manual.trim()}>
              Go
            </Btn>
          </div>
        </Field>
        {manualError && <p className="mt-2 text-sm text-coral">{manualError}</p>}
      </div>
    </>
  );
}

function Name({ server, onAsked, onApproved }: { server: ServerInfo; onAsked: (requestId: string, name: string) => void; onApproved: () => void }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void phoneName().then((n) => setName((cur) => cur || n));
  }, []);
  const ask = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await requestPairing(server.base, name.trim() || "Phone", pin || undefined);
      if (r.status === "approved") {
        await saveConnection({ base: server.base, token: r.token, serverName: server.name, serverId: server.id, phoneName: name.trim() || "Phone" });
        onApproved();
      } else if (r.status === "waiting") onAsked(r.requestId, name.trim() || "Phone");
      else setError("That didn't work. Try again.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="flex items-center gap-2 text-sm text-emerald">
        <CheckCircle2 size={18} /> Found {server.name}
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight">Name this phone</h1>
      <p className="mt-2 text-ink-2">The family will see this name when the phone asks to join.</p>
      <div className="mt-6 space-y-4">
        <Field label="Phone name">
          <input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Ali's phone" />
        </Field>
        <Field label="Household PIN (optional)" hint="If the family set one, this phone joins straight away. Otherwise someone allows it on the TV.">
          <input className={inputCls} inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="Leave empty to ask on the TV" />
        </Field>
        {error && <p className="text-sm text-coral">{error}</p>}
        <Btn tone="primary" className="w-full py-3.5 text-base" onClick={ask} disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />} Ask to join
        </Btn>
      </div>
    </>
  );
}

function Wait({ server, requestId, name, onApproved, onRestart }: { server: ServerInfo; requestId: string; name: string; onApproved: () => void; onRestart: () => void }) {
  const [state, setState] = useState<"waiting" | "denied" | "expired">("waiting");
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const r = await checkPairing(server.base, requestId);
        if (r.status === "approved") {
          await saveConnection({ base: server.base, token: r.token, serverName: server.name, serverId: server.id, phoneName: name });
          void tap("heavy");
          onApproved();
          return;
        }
        if (r.status === "denied" || r.status === "expired") return setState(r.status);
      } catch {
        /* wifi blip: keep polling */
      }
      setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [requestId]);
  return (
    <>
      {state === "waiting" ? (
        <>
          <div className="glass mx-auto grid size-24 place-items-center rounded-3xl">
            <Tv size={44} className="text-emerald" />
          </div>
          <h1 className="mt-6 text-center text-3xl font-semibold leading-tight">Press OK on the TV</h1>
          <p className="mt-3 text-center text-ink-2">
            The TV is asking <strong className="text-ink">&ldquo;Allow {name}?&rdquo;</strong>. Someone at home can also allow it on the website: Settings → Phones.
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-3">
            <Loader2 className="animate-spin" size={16} /> Waiting…
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">{state === "denied" ? "Not allowed" : "The request timed out"}</h1>
          <p className="mt-2 text-ink-2">{state === "denied" ? "Someone at home chose not to allow this phone." : "Nobody answered within 10 minutes."}</p>
          <Btn tone="primary" className="mt-6 w-full" onClick={onRestart}>
            Try again
          </Btn>
        </>
      )}
    </>
  );
}

function Done({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="mt-16 text-center">
      <CheckCircle2 size={64} className="mx-auto text-emerald" />
      <h1 className="mt-4 text-3xl font-semibold">You&apos;re in</h1>
      <p className="mt-2 text-ink-2">This phone now shares the family&apos;s Nisbat.</p>
    </div>
  );
}
