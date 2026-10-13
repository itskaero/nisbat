"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  Link2Off,
  Newspaper,
  Pause,
  Play,
  Search,
  Send,
  Settings,
  ShoppingCart,
  SkipBack,
  SkipForward,
  SquareCheckBig,
  Tv,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand";
import { Button, IconButton, Input, Segmented, Select, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CHANNELS } from "@/data/channels";
import quranMeta from "@/data/quran-meta.json";
import type { REMOTE_PATHS, RemoteCommand, TvState } from "@/lib/remote/protocol";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { phoneRemoteStore } from "@/lib/storage/stores";
import { GROCERY_UNITS, type GroceryUnit } from "@/types/groceries";

type Send = (cmd: RemoteCommand) => Promise<boolean>;

export function PhoneRemote() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const { code } = usePersisted(phoneRemoteStore);

  // A code in the URL (from the TV's QR) pairs immediately.
  useEffect(() => {
    const fromUrl = params.get("code")?.toUpperCase();
    if (fromUrl && /^[A-Z2-9]{6}$/.test(fromUrl)) phoneRemoteStore.set({ code: fromUrl });
  }, [params]);

  if (!hydrated) return null;
  return code ? <Controller code={code} /> : <Pairing />;
}

function Pairing() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <BrandMark />
        <div>
          <h1 className="text-xl font-semibold">Nisbat Remote</h1>
          <p className="text-xs text-ink-2">Control Nisbat on your TV from this phone.</p>
        </div>
      </div>
      <form
        className="glass space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const c = value.trim().toUpperCase();
          if (!/^[A-Z2-9]{6}$/.test(c)) {
            setError("Enter the 6-character code shown on the TV.");
            return;
          }
          phoneRemoteStore.set({ code: c });
        }}
      >
        <label htmlFor="pair-code" className="text-sm font-medium">
          Pairing code
        </label>
        <Input
          id="pair-code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
            setError(undefined);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          placeholder="e.g. K7P3QX"
          className="h-14 text-center font-mono text-2xl tracking-[0.3em]"
          aria-invalid={!!error}
        />
        {error && (
          <p role="alert" className="text-xs text-coral">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Pair
        </Button>
        <p className="text-xs leading-relaxed text-ink-3">
          The code is on the TV under Settings → Phone remote, on the Home screen in TV mode, and at the bottom of the ambient screen. Or scan
          the QR code shown there.
        </p>
      </form>
    </div>
  );
}

function useRemoteLink(code: string) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [state, setState] = useState<TvState | null>(null);
  useEffect(() => {
    const es = new EventSource(`/api/remote/stream?role=phone&code=${code}`);
    es.addEventListener("presence", (e) => {
      const { connected } = JSON.parse((e as MessageEvent).data);
      setConnected(connected);
      if (!connected) setState(null);
    });
    es.addEventListener("state", (e) => setState(JSON.parse((e as MessageEvent).data)));
    es.onerror = () => setConnected(null);
    return () => es.close();
  }, [code]);
  return { connected, state };
}

function Controller({ code }: { code: string }) {
  const { toast } = useToast();
  const { connected, state } = useRemoteLink(code);
  const lastError = useRef(0);

  const send = useCallback<Send>(
    async (command) => {
      if (navigator.vibrate) navigator.vibrate(12);
      try {
        const r = await fetch("/api/remote/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, command }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Couldn't reach the TV");
        }
        return true;
      } catch (e) {
        // Don't flood toasts while someone is pressing the D-pad.
        if (Date.now() - lastError.current > 2500) {
          lastError.current = Date.now();
          toast((e as Error).message, { tone: "error" });
        }
        return false;
      }
    },
    [code, toast],
  );

  const playing = state?.media?.playing;

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <BrandMark className="size-8" />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold">Nisbat Remote</h1>
          <p className={cn("flex items-center gap-1.5 truncate text-xs", connected ? "text-emerald" : "text-ink-3")} aria-live="polite">
            {connected ? <Wifi className="size-3.5 shrink-0" /> : <WifiOff className="size-3.5 shrink-0" />}
            {connected === null
              ? "Connecting…"
              : connected
                ? state
                  ? state.ambient
                    ? "TV is on the ambient screen"
                    : `TV showing ${state.title}`
                  : "Connected to TV"
                : "TV not connected — open Nisbat on the TV"}
          </p>
        </div>
        <IconButton label="Unpair this phone" onClick={() => phoneRemoteStore.set({ code: null })}>
          <Link2Off className="size-4" />
        </IconButton>
      </header>

      {state?.media && (
        <div className="glass flex items-center gap-3 p-3">
          <span className={cn("size-2 shrink-0 rounded-full", playing ? "animate-pulse bg-emerald" : "bg-ink-3")} aria-hidden />
          <p className="min-w-0 flex-1 truncate text-sm">{state.media.label}</p>
          <span className="text-xs text-ink-3">{playing ? "Playing" : "Paused"}</span>
        </div>
      )}

      <DPad send={send} />

      <div className="grid grid-cols-5 gap-2">
        <PadButton label="Back" onPress={() => send({ type: "key", key: "back" })}>
          <ArrowLeft className="size-5 rtl:-scale-x-100" />
        </PadButton>
        <PadButton label="Home" onPress={() => send({ type: "key", key: "home" })}>
          <Home className="size-5" />
        </PadButton>
        <PadButton label="Previous" onPress={() => send({ type: "media", action: "prev" })}>
          <SkipBack className="size-5" />
        </PadButton>
        <PadButton label={playing ? "Pause" : "Play"} accent onPress={() => send({ type: "media", action: "toggle" })}>
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </PadButton>
        <PadButton label="Next" onPress={() => send({ type: "media", action: "next" })}>
          <SkipForward className="size-5" />
        </PadButton>
      </div>

      <Section title="Screens">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["/", "Home", Home],
              ["/quran", "Quran", BookOpen],
              ["/news", "News", Newspaper],
              ["/saman", "Saman", ShoppingCart],
              ["/tasks", "Tasks", SquareCheckBig],
              ["/tv", "Live TV", Tv],
            ] as [(typeof REMOTE_PATHS)[number], string, LucideIcon][]
          ).map(([path, label, Icon]) => (
            <button
              key={path}
              type="button"
              onClick={() => send({ type: "navigate", path })}
              className={cn(
                "glass-soft flex flex-col items-center gap-1.5 py-3 text-xs active:scale-95",
                state?.path.split("?")[0] === path && "border-emerald/40 bg-emerald/10 text-emerald",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <TypeOnTv send={send} />
      <QuickAdd send={send} />
      <Channels send={send} />
      <SurahJump send={send} />

      <button type="button" onClick={() => send({ type: "navigate", path: "/settings" })} className="mx-auto flex items-center gap-2 text-xs text-ink-3">
        <Settings className="size-3.5" /> Open settings on TV
      </button>
      <p className="text-center text-[11px] text-ink-3">Paired with code {code}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">{title}</h2>
      {children}
    </section>
  );
}

function PadButton({ label, onPress, children, accent }: { label: string; onPress: () => void; children: ReactNode; accent?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={cn(
        "grid h-14 place-items-center rounded-2xl border transition-transform active:scale-95",
        accent ? "border-emerald/40 bg-emerald text-[#06231a]" : "border-white/10 bg-white/[0.06] text-ink",
      )}
    >
      {children}
    </button>
  );
}

/** Circular D-pad with press-and-hold repeat. */
function DPad({ send }: { send: Send }) {
  const repeat = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
  const stop = () => {
    clearTimeout(repeat.current.t);
    clearInterval(repeat.current.i);
  };
  useEffect(() => stop, []);
  const press = (key: "up" | "down" | "left" | "right") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      void send({ type: "key", key });
      stop();
      repeat.current.t = setTimeout(() => {
        repeat.current.i = setInterval(() => void send({ type: "key", key }), 160);
      }, 450);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        void send({ type: "key", key });
      }
    },
  });
  const arm = "absolute grid place-items-center text-ink-2 active:text-emerald size-[30%]";
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px] touch-none select-none rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_40%,#1b2a40,#0f1828)] shadow-[inset_0_2px_0_rgba(255,255,255,0.06),0_20px_50px_-20px_rgba(0,0,0,0.8)]">
      <button type="button" aria-label="Up" className={cn(arm, "start-[35%] top-[2%]")} {...press("up")}>
        <ChevronUp className="size-9" />
      </button>
      <button type="button" aria-label="Down" className={cn(arm, "bottom-[2%] start-[35%]")} {...press("down")}>
        <ChevronDown className="size-9" />
      </button>
      <button type="button" aria-label="Left" className={cn(arm, "start-[2%] top-[35%]")} {...press("left")}>
        <ChevronLeft className="size-9" />
      </button>
      <button type="button" aria-label="Right" className={cn(arm, "end-[2%] top-[35%]")} {...press("right")}>
        <ChevronRight className="size-9" />
      </button>
      <button
        type="button"
        aria-label="OK"
        onClick={() => send({ type: "key", key: "ok" })}
        className="absolute inset-[31%] grid place-items-center rounded-full border border-white/15 bg-white/[0.08] text-base font-semibold active:scale-95 active:bg-emerald active:text-[#06231a]"
      >
        OK
      </button>
    </div>
  );
}

function TypeOnTv({ send }: { send: Send }) {
  const [text, setText] = useState("");
  return (
    <Section title="Type on TV">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (text.trim() && (await send({ type: "search", query: text.trim().slice(0, 100) }))) setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search, or fill the focused field" aria-label="Text to send to the TV" />
        <IconButton label="Fill the focused field on TV" className="border-white/10 bg-white/5" onClick={() => text && send({ type: "text", value: text })}>
          <Send className="size-4" />
        </IconButton>
        <IconButton label="Search on TV" type="submit" tone="accent">
          <Search className="size-4" />
        </IconButton>
      </form>
    </Section>
  );
}

function QuickAdd({ send }: { send: Send }) {
  const [mode, setMode] = useState<"task" | "item">("task");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<GroceryUnit>("kg");
  return (
    <Section title="Quick add">
      <form
        className="glass space-y-3 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const value = name.trim();
          if (!value) return;
          const ok =
            mode === "task"
              ? await send({ type: "addTask", title: value.slice(0, 200) })
              : await send({ type: "addGrocery", name: value.slice(0, 80), quantity: Math.max(0.01, Number(qty) || 1), unit });
          if (ok) setName("");
        }}
      >
        <Segmented
          label="What to add"
          value={mode}
          onChange={setMode}
          options={[
            { value: "task", label: "Task for today" },
            { value: "item", label: "Saman item" },
          ]}
        />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={mode === "task" ? "e.g. Pay electricity bill" : "e.g. Tomato"} aria-label={mode === "task" ? "Task title" : "Grocery item"} />
        {mode === "item" && (
          <div className="grid grid-cols-2 gap-2">
            <Input value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" aria-label="Quantity" />
            <Select value={unit} onChange={(e) => setUnit(e.target.value as GroceryUnit)} aria-label="Unit">
              {GROCERY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={!name.trim()}>
          Add on TV
        </Button>
      </form>
    </Section>
  );
}

function Channels({ send }: { send: Send }) {
  const playable = CHANNELS.filter((c) => c.stream);
  return (
    <Section title="Live TV">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {playable.map((c) => (
          <button key={c.id} type="button" onClick={() => send({ type: "channel", id: c.id })} className="glass-soft shrink-0 px-4 py-3 text-sm active:scale-95">
            {c.name}
          </button>
        ))}
      </div>
    </Section>
  );
}

function SurahJump({ send }: { send: Send }) {
  const [n, setN] = useState(67);
  return (
    <Section title="Open a surah">
      <div className="flex gap-2">
        <Select value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Surah">
          {quranMeta.surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.englishName}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => send({ type: "surah", number: n })}>
          Open
        </Button>
      </div>
    </Section>
  );
}
