"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { GROCERY_CATALOG } from "@/data/grocery-catalog";
import { addGroceryItem } from "@/features/groceries/actions";
import { useCommandPalette } from "@/features/search/command-palette";
import { createTask } from "@/features/tasks/actions";
import { todayKey } from "@/lib/dates";
import { newPairingCode, type RemoteCommand, type TvState } from "@/lib/remote/protocol";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, tvRemoteStore } from "@/lib/storage/stores";
import { runKey } from "@/lib/tv/actions";
import { isAmbientOpen, markActivity, setAmbientOpen, useAmbientOpen } from "@/lib/tv/ambient-state";
import { activeMedia, mediaCommand, onMediaChange } from "@/lib/tv/media-registry";
import { useTvMode } from "@/lib/tv/tv-mode";

/** Ensure this screen has a pairing code (generated once, kept locally). */
export function usePairingCode(): string | null {
  const { code } = usePersisted(tvRemoteStore);
  useEffect(() => {
    if (!tvRemoteStore.get().code) tvRemoteStore.set({ code: newPairingCode() });
  }, []);
  return code;
}

function typeIntoFocused(value: string): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || el.readOnly || el.disabled) return false;
  // Use the native setter so React's onChange sees the change.
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/**
 * Listens for commands from paired phone remotes (via the Nisbat server relay)
 * and reports what the TV is showing back to them. Active in TV mode.
 */
export function RemoteReceiver() {
  const tv = useTvMode();
  const code = usePairingCode();
  const router = useRouter();
  const pathname = usePathname();
  const ambient = useAmbientOpen();
  const { toast } = useToast();
  const { open: openSearch } = useCommandPalette();
  const { timezone } = usePersisted(settingsStore);
  const ctx = useRef({ router, toast, openSearch, timezone });
  ctx.current = { router, toast, openSearch, timezone };

  useEffect(() => {
    if (!tv || !code) return;
    const es = new EventSource(`/api/remote/stream?role=tv&code=${code}`);
    es.addEventListener("command", (ev) => {
      let cmd: RemoteCommand;
      try {
        cmd = JSON.parse((ev as MessageEvent).data);
      } catch {
        return;
      }
      const { router, toast, openSearch, timezone } = ctx.current;
      const wasAmbient = isAmbientOpen();
      markActivity();
      if (wasAmbient) setAmbientOpen(false);
      switch (cmd.type) {
        case "wake":
          break;
        case "key":
          // First press only wakes the ambient screen, like a hardware remote.
          if (!wasAmbient) runKey(cmd.key, router);
          break;
        case "navigate":
          router.push(cmd.path);
          break;
        case "media":
          if (!mediaCommand(cmd.action)) toast("Nothing is playing", { tone: "info" });
          break;
        case "text":
          if (!typeIntoFocused(cmd.value)) openSearch(cmd.value);
          break;
        case "search":
          openSearch(cmd.query);
          break;
        case "addTask":
          createTask({ title: cmd.title, priority: "medium", dueDate: todayKey(timezone) });
          toast(`Task added from phone: ${cmd.title}`);
          break;
        case "addGrocery": {
          const match = GROCERY_CATALOG.find((p) => p.name.toLowerCase() === cmd.name.toLowerCase() || p.nameUr === cmd.name);
          addGroceryItem({
            productId: match?.id,
            name: match?.name ?? cmd.name,
            category: match?.category ?? "other",
            quantity: cmd.quantity,
            unit: cmd.unit,
          });
          toast(`Added to Saman from phone: ${match?.name ?? cmd.name}`);
          break;
        }
        case "channel":
          router.push(`/tv?ch=${encodeURIComponent(cmd.id)}`);
          break;
        case "surah":
          router.push(`/quran?s=${cmd.number}`);
          break;
      }
    });
    return () => es.close();
  }, [tv, code]);

  // Report TV state to phones whenever the screen, media or ambient state changes.
  useEffect(() => {
    if (!tv || !code) return;
    let t: ReturnType<typeof setTimeout>;
    const publish = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const media = activeMedia();
        const state: TvState = {
          path: window.location.pathname + window.location.search,
          title: document.title.replace(/ · Nisbat Home$/, "") || "Home",
          media: media ? { label: media.label, playing: media.isPlaying() } : null,
          ambient: isAmbientOpen(),
        };
        void fetch("/api/remote/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        }).catch(() => undefined);
      }, 400);
    };
    publish();
    const off = onMediaChange(publish);
    const interval = setInterval(publish, 30_000); // covers relay restarts
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      off();
    };
  }, [tv, code, pathname, ambient]);

  return null;
}

