import { activeMedia, onMediaChange } from "@/lib/tv/media-registry";
import type { RemoteCommand, TvState } from "@/lib/remote/protocol";
import { route } from "./router";
import { ambient, pairing, type PairingRequest } from "./ui-state";

/**
 * This TV's identity and its live connection to the Nisbat server: phones
 * (the Android app) see it by name and send commands; the server also asks it
 * to show "Allow this phone?" prompts.
 */
const KEY = "nisbat:tv:screen";

export interface Identity {
  id: string;
  name: string;
}

function randomId() {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return "tv-" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function identity(): Identity {
  let saved: Partial<Identity> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    /* ignore */
  }
  // autocast passes the Chromecast's name: /screen?name=Dining%20Room%20TV
  const fromUrl = new URLSearchParams(location.search).get("name")?.trim().slice(0, 40);
  const id = saved.id && /^[\w-]{6,64}$/.test(saved.id) ? saved.id : randomId();
  const name = fromUrl || saved.name || "TV";
  const out = { id, name };
  try {
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* ignore */
  }
  return out;
}

export function renameScreen(name: string) {
  const me = identity();
  localStorage.setItem(KEY, JSON.stringify({ ...me, name: name.trim().slice(0, 40) || "TV" }));
}

let es: EventSource | null = null;

export function connectRemote(onCommand: (cmd: RemoteCommand) => void) {
  const me = identity();
  es?.close();
  es = new EventSource(`/api/screens/stream?id=${encodeURIComponent(me.id)}&name=${encodeURIComponent(me.name)}`);
  es.addEventListener("command", (e) => {
    try {
      onCommand(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore malformed */
    }
  });
  es.addEventListener("pairing-request", (e) => {
    const r = JSON.parse((e as MessageEvent).data) as PairingRequest;
    if (!pairing.get().some((x) => x.id === r.id)) pairing.set([...pairing.get(), r]);
  });
  es.addEventListener("pairing-resolved", (e) => {
    const r = JSON.parse((e as MessageEvent).data) as PairingRequest;
    pairing.set(pairing.get().filter((x) => x.id !== r.id));
  });
  es.addEventListener("open", () => publishState(true));
}

export async function answerPairing(id: string, allow: boolean) {
  pairing.set(pairing.get().filter((x) => x.id !== id));
  await fetch(`/api/devices/requests/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allow }) }).catch(() => undefined);
}

/* Tell watching phones what is on screen (debounced). --------------------- */
let title = "Home";
let timer: ReturnType<typeof setTimeout> | undefined;

export function setScreenTitle(t: string) {
  title = t;
  document.title = `${t} · Nisbat Home`;
  publishState();
}

export function publishState(now = false) {
  clearTimeout(timer);
  timer = setTimeout(
    () => {
      const media = activeMedia();
      const state: TvState = {
        path: route().href.slice(0, 200),
        title: title.slice(0, 120),
        media: media ? { label: media.label.slice(0, 120), playing: media.isPlaying() } : null,
        ambient: ambient.get(),
      };
      void fetch(`/api/screens/${encodeURIComponent(identity().id)}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => undefined);
    },
    now ? 0 : 400,
  );
}

onMediaChange(() => publishState());
setInterval(() => publishState(), 30_000);
