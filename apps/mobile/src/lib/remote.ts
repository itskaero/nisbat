import { useEffect, useState } from "react";
import { streamUrl } from "@/lib/api-base";
import type { RemoteCommand, TvState } from "@/lib/remote/protocol";
import { api } from "./cached";
import { getPref, setPref } from "./native";

export interface ScreenInfo {
  id: string;
  name: string;
  online: boolean;
  state: TvState | null;
}

export async function listScreens(): Promise<ScreenInfo[]> {
  return (await api<{ screens: ScreenInfo[] }>("/api/screens")).screens;
}

export async function sendCommand(screenId: string, cmd: RemoteCommand) {
  return api(`/api/screens/${encodeURIComponent(screenId)}/command`, { body: cmd });
}

/** "Show on TV": switch an open TV, or have the NAS cast Nisbat to the Chromecast now. */
export async function showOnTv(path: string, force = false) {
  return api<{ ok: boolean; switched: number; casters: number }>("/api/cast", { body: { path, force } });
}

/** The TV this phone controls: remembered, else the only/first one online. */
export function useScreen() {
  const [screens, setScreens] = useState<ScreenInfo[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState<ScreenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const refresh = async () => {
      try {
        const list = await listScreens();
        if (stop) return;
        setScreens(list);
        setError(null);
        const saved = await getPref("remote-screen");
        setSelected((cur) => cur ?? (list.find((s) => s.id === saved) ?? list[0])?.id ?? null);
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    };
    void refresh();
    const t = setInterval(refresh, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  // Live state of the selected TV (what it shows, what's playing).
  useEffect(() => {
    if (!selected) return;
    void setPref("remote-screen", selected);
    const es = new EventSource(streamUrl(`/api/screens/${encodeURIComponent(selected)}/events`));
    es.addEventListener("screen", (e) => setLive(JSON.parse((e as MessageEvent).data)));
    return () => es.close();
  }, [selected]);

  return { screens, selected, select: setSelected, live, error };
}
