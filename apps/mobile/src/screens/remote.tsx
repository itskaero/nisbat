import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Keyboard, Pause, Play, Plus, SkipBack, SkipForward, Tv } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { NAV_ITEMS } from "@/components/layout/nav";
import { GROCERY_CATALOG } from "@/data/grocery-catalog";
import { addGroceryItem } from "@/features/groceries/actions";
import { createTask } from "@/features/tasks/actions";
import { todayKey } from "@/lib/dates";
import type { REMOTE_PATHS, RemoteCommand } from "@/lib/remote/protocol";
import { settingsStore } from "@/lib/storage/stores";
import { Btn, Chips, Page, Sheet, cx, inputCls } from "../components/ui";
import { tap } from "../lib/native";
import { sendCommand, showOnTv, useScreen } from "../lib/remote";
import { toast } from "../lib/toast";

type RemotePath = (typeof REMOTE_PATHS)[number];

/**
 * The TV remote. No QR codes or pairing codes: this phone is already trusted,
 * so it just lists the TVs that have Nisbat open and controls the chosen one.
 */
export function RemoteScreen() {
  const { screens, selected, select, live, error } = useScreen();
  const [mode, setMode] = useState<"pad" | "touch">("pad");
  const [typing, setTyping] = useState(false);
  const [adding, setAdding] = useState(false);
  const send = async (cmd: RemoteCommand) => {
    if (!selected) return;
    try {
      await sendCommand(selected, cmd);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  const key = (k: "up" | "down" | "left" | "right" | "ok" | "back" | "home") => {
    void tap(k === "ok" ? "medium" : "light");
    void send({ type: "key", key: k });
  };
  const playing = live?.state?.media?.playing;

  return (
    <Page title="Remote" back>
      {error && !screens ? (
        <p className="glass p-4 text-sm text-coral">{error}</p>
      ) : screens && screens.length === 0 ? (
        <NoTv />
      ) : (
        <>
          {screens && screens.length > 1 && <Chips label="TV" value={selected ?? ""} onChange={select} options={screens.map((s) => ({ value: s.id, label: s.name }))} />}
          <div className="glass mt-3 flex items-center gap-3 p-3">
            <span className={cx("size-2.5 rounded-full", live?.online ? "bg-emerald" : "bg-ink-3")} />
            <span className="min-w-0 flex-1 truncate text-sm">
              <strong>{live?.name ?? screens?.find((s) => s.id === selected)?.name ?? "TV"}</strong>
              <span className="text-ink-3"> · {live?.online ? (live.state?.ambient ? "ambient screen" : live.state?.title ?? "Nisbat") : "not showing Nisbat"}</span>
            </span>
          </div>
          {live?.state?.media && <p className="mt-2 truncate px-1 text-xs text-ink-3">Playing: {live.state.media.label}</p>}

          <div className="mt-4 flex justify-center">
            <Chips
              label="Control style"
              value={mode}
              onChange={setMode}
              options={[
                { value: "pad", label: "D-pad" },
                { value: "touch", label: "Swipe" },
              ]}
            />
          </div>
          {mode === "pad" ? <DPad onKey={key} /> : <Trackpad onKey={key} />}

          <div className="mt-5 grid grid-cols-5 gap-2">
            <Round label="Back" onClick={() => key("back")}>
              <ArrowLeft size={22} />
            </Round>
            <Round label="Home" onClick={() => key("home")}>
              <Home size={22} />
            </Round>
            <Round label="Previous" onClick={() => void send({ type: "media", action: "prev" })}>
              <SkipBack size={20} />
            </Round>
            <Round label={playing ? "Pause" : "Play"} accent onClick={() => void send({ type: "media", action: "toggle" })}>
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </Round>
            <Round label="Next" onClick={() => void send({ type: "media", action: "next" })}>
              <SkipForward size={20} />
            </Round>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Btn onClick={() => setTyping(true)}>
              <Keyboard size={18} /> Type on TV
            </Btn>
            <Btn onClick={() => setAdding(true)}>
              <Plus size={18} /> Quick add
            </Btn>
          </div>

          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-ink-2">Open on the TV</h2>
          <div className="grid grid-cols-4 gap-2">
            {NAV_ITEMS.map((n) => {
              const Icon = n.icon;
              const on = live?.state?.path?.split("?")[0] === n.href;
              return (
                <button
                  key={n.href}
                  type="button"
                  className={cx("glass press flex flex-col items-center gap-1.5 px-1 py-3 text-xs", on && "!border-emerald/60 text-emerald")}
                  onClick={() => {
                    void tap();
                    void send({ type: "navigate", path: n.href as RemotePath });
                  }}
                >
                  <Icon size={22} />
                  {n.short}
                </button>
              );
            })}
          </div>
        </>
      )}
      <TypeSheet open={typing} onClose={() => setTyping(false)} onSend={(v) => void send({ type: "text", value: v })} />
      <AddSheet open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}

function NoTv() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="glass p-5 text-center">
      <Tv size={40} className="mx-auto text-ink-3" />
      <p className="mt-3 font-medium">No TV is showing Nisbat right now</p>
      <p className="mt-1 text-sm text-ink-2">Turn the TV to the Chromecast input, or put Nisbat on it now.</p>
      <Btn
        tone="primary"
        className="mt-4 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await showOnTv("/");
            toast("Putting Nisbat on the TV…", "info");
          } catch (e) {
            toast((e as Error).message, "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Tv size={18} /> Show Nisbat on the TV
      </Btn>
    </div>
  );
}

function Round({ label, children, onClick, accent }: { label: string; children: ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx("press grid aspect-square place-items-center rounded-full border border-line", accent ? "bg-emerald text-[#06231a]" : "bg-white/[0.06]")}
      onClick={() => {
        void tap();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

/** Hold to repeat, like a real remote. */
function useRepeat(fn: () => void) {
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const start = () => {
    fn();
    t.current = setTimeout(function again() {
      fn();
      t.current = setTimeout(again, 110);
    }, 420);
  };
  const end = () => clearTimeout(t.current);
  return { onPointerDown: start, onPointerUp: end, onPointerLeave: end, onPointerCancel: end };
}

function DPad({ onKey }: { onKey: (k: "up" | "down" | "left" | "right" | "ok") => void }) {
  const up = useRepeat(() => onKey("up"));
  const down = useRepeat(() => onKey("down"));
  const left = useRepeat(() => onKey("left"));
  const right = useRepeat(() => onKey("right"));
  const arrow = "absolute grid place-items-center text-ink-2 active:text-emerald";
  return (
    <div className="relative mx-auto mt-4 size-64 select-none rounded-full border border-line bg-white/[0.05]" style={{ touchAction: "none" }}>
      <button type="button" aria-label="Up" className={`${arrow} inset-x-0 top-0 h-1/3`} {...up}>
        <ChevronUp size={34} />
      </button>
      <button type="button" aria-label="Down" className={`${arrow} inset-x-0 bottom-0 h-1/3`} {...down}>
        <ChevronDown size={34} />
      </button>
      <button type="button" aria-label="Left" className={`${arrow} inset-y-0 left-0 w-1/3`} {...left}>
        <ChevronLeft size={34} />
      </button>
      <button type="button" aria-label="Right" className={`${arrow} inset-y-0 right-0 w-1/3`} {...right}>
        <ChevronRight size={34} />
      </button>
      <button type="button" aria-label="OK" className="press absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-emerald text-lg font-semibold text-[#06231a]" onClick={() => onKey("ok")}>
        OK
      </button>
    </div>
  );
}

/** Swipe to move, tap to select. */
function Trackpad({ onKey }: { onKey: (k: "up" | "down" | "left" | "right" | "ok") => void }) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  return (
    <div
      role="application"
      aria-label="Trackpad: swipe to move, tap to select"
      className="mx-auto mt-4 grid h-64 w-full place-items-center rounded-3xl border border-line bg-white/[0.04] text-sm text-ink-3"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY, t: Date.now() })}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.hypot(dx, dy) < 18) return onKey("ok");
        onKey(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
      }}
    >
      Swipe to move · tap to select
    </div>
  );
}

function TypeSheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Type on TV">
      <p className="mb-3 text-sm text-ink-2">Fills the box selected on the TV, or searches if none is.</p>
      <form
        className="flex gap-2 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!v.trim()) return;
          onSend(v.trim().slice(0, 200));
          setV("");
          onClose();
        }}
      >
        <input autoFocus className={inputCls} value={v} onChange={(e) => setV(e.target.value)} placeholder="Surah, channel, anything…" />
        <Btn tone="primary" type="submit">
          Send
        </Btn>
      </form>
    </Sheet>
  );
}

function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<"task" | "item">("task");
  const [v, setV] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Quick add">
      <Chips
        label="Add"
        value={kind}
        onChange={setKind}
        options={[
          { value: "task", label: "Task for today" },
          { value: "item", label: "Saman item" },
        ]}
      />
      <form
        className="mt-3 flex gap-2 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = v.trim();
          if (!t) return;
          // Straight into the family's shared lists; the TV updates on its own.
          if (kind === "task") {
            createTask({ title: t.slice(0, 200), priority: "medium", dueDate: todayKey(settingsStore.get().timezone) });
            toast(`Task added: ${t}`);
          } else {
            const p = GROCERY_CATALOG.find((x) => x.name.toLowerCase() === t.toLowerCase() || x.nameUr === t);
            addGroceryItem({ productId: p?.id, name: p?.name ?? t.slice(0, 80), category: p?.category ?? "other", quantity: 1, unit: p?.unit ?? "piece" });
            toast(`Added to Saman: ${p?.name ?? t}`);
          }
          setV("");
          onClose();
        }}
      >
        <input autoFocus className={inputCls} value={v} onChange={(e) => setV(e.target.value)} placeholder={kind === "task" ? "Call Phuppo" : "Tomatoes"} />
        <Btn tone="primary" type="submit">
          Add
        </Btn>
      </form>
    </Sheet>
  );
}
