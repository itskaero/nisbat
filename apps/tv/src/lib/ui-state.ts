import { useEffect, useState } from "preact/hooks";

/* Small observable values shared across the TV app. */
function observable<T>(initial: T) {
  let value = initial;
  const ls = new Set<() => void>();
  return {
    get: () => value,
    set(v: T) {
      if (Object.is(v, value)) return;
      value = v;
      ls.forEach((l) => l());
    },
    use(): T {
      const [v, setV] = useState(value);
      useEffect(() => {
        const l = () => setV(value);
        ls.add(l);
        l();
        return () => {
          ls.delete(l);
        };
      }, []);
      return v;
    },
  };
}

/* Ambient screen (screensaver) ------------------------------------------- */
export const ambient = observable(false);
let lastActivity = Date.now();
export function markActivity() {
  lastActivity = Date.now();
}
export const idleFor = () => Date.now() - lastActivity;

/* Layers that Back closes before leaving the screen (dialogs, players). ----- */
const layers: (() => void)[] = [];
export function pushLayer(close: () => void) {
  layers.push(close);
  return () => {
    const i = layers.lastIndexOf(close);
    if (i >= 0) layers.splice(i, 1);
  };
}
export function closeTopLayer(): boolean {
  const close = layers.pop();
  if (!close) return false;
  close();
  return true;
}
export const hasLayers = () => layers.length > 0;

/* Toasts ------------------------------------------------------------------- */
export interface Toast {
  id: number;
  text: string;
  tone: "ok" | "info" | "error";
}
export const toasts = observable<Toast[]>([]);
let toastId = 0;
export function toast(text: string, tone: Toast["tone"] = "ok") {
  const t = { id: ++toastId, text, tone };
  toasts.set([...toasts.get().slice(-2), t]);
  setTimeout(() => toasts.set(toasts.get().filter((x) => x.id !== t.id)), 4000);
}

/* Phones waiting for approval (from the server's pairing events). ---------- */
export interface PairingRequest {
  id: string;
  name: string;
  platform: string;
}
export const pairing = observable<PairingRequest[]>([]);
