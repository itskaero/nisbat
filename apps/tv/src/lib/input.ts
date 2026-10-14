import { GROCERY_CATALOG } from "@/data/grocery-catalog";
import { addGroceryItem } from "@/features/groceries/actions";
import { createTask } from "@/features/tasks/actions";
import { todayKey } from "@/lib/dates";
import type { RemoteCommand } from "@/lib/remote/protocol";
import { settingsStore } from "@/lib/storage/stores";
import { mediaCommand } from "@/lib/tv/media-registry";
import { focusables, focusElement, isBackKey, moveFocus, shouldNavigate, type Direction } from "@/lib/tv/spatial-nav";
import { goBack, navigate } from "./router";
import { ambient, closeTopLayer, markActivity, toast } from "./ui-state";

export type Key = Direction | "ok" | "back" | "home";

/** One handler for TV-remote keys (HDMI-CEC), a keyboard, and phone commands. */
export function handleKey(key: Key) {
  markActivity();
  if (ambient.get()) {
    // The first press only wakes the screen, like a hardware remote.
    ambient.set(false);
    return;
  }
  switch (key) {
    case "ok": {
      const el = document.activeElement as HTMLElement | null;
      if (el && el !== document.body) el.click();
      else focusFirst();
      break;
    }
    case "back":
      if (!closeTopLayer()) goBack();
      break;
    case "home":
      closeTopLayer();
      navigate("/");
      break;
    default:
      moveFocus(key);
  }
}

/** Focus the screen's preferred control, else the first one in <main>. */
export function focusFirst() {
  const preferred = document.querySelector<HTMLElement>("main [data-autofocus]");
  const list = focusables();
  const target = preferred ?? list.find((el) => el.closest("main")) ?? list[0];
  if (target) focusElement(target);
}

export function installKeyboard() {
  window.addEventListener(
    "keydown",
    (e) => {
      markActivity();
      if (ambient.get()) {
        e.preventDefault();
        ambient.set(false);
        return;
      }
      if (isBackKey(e) || e.key === "Escape") {
        e.preventDefault();
        handleKey("back");
        return;
      }
      if (e.key === "MediaPlayPause" || e.key === "MediaPlay" || e.key === "MediaPause") {
        e.preventDefault();
        mediaCommand("toggle");
        return;
      }
      if (e.key === "MediaTrackNext") return void mediaCommand("next");
      if (e.key === "MediaTrackPrevious") return void mediaCommand("prev");
      const dir = shouldNavigate(e);
      if (dir) {
        e.preventDefault();
        moveFocus(dir);
      }
    },
    true,
  );
  for (const ev of ["pointermove", "pointerdown", "wheel"]) window.addEventListener(ev, markActivity, { passive: true });
}

function typeIntoFocused(value: string): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || el.readOnly || el.disabled) return false;
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/** Commands from phones (the Android app or the web remote). */
export function handleCommand(cmd: RemoteCommand) {
  const { timezone } = settingsStore.get();
  if (cmd.type !== "key") {
    markActivity();
    ambient.set(false);
  }
  switch (cmd.type) {
    case "key":
      handleKey(cmd.key);
      break;
    case "wake":
      break;
    case "navigate":
      closeTopLayer();
      navigate(cmd.path);
      break;
    case "media":
      if (!mediaCommand(cmd.action)) toast("Nothing is playing", "info");
      break;
    case "text":
      if (!typeIntoFocused(cmd.value)) navigate(`/search?q=${encodeURIComponent(cmd.value)}`);
      break;
    case "search":
      navigate(`/search?q=${encodeURIComponent(cmd.query)}`);
      break;
    case "addTask":
      createTask({ title: cmd.title, priority: "medium", dueDate: todayKey(timezone) });
      toast(`Task added from phone: ${cmd.title}`);
      break;
    case "addGrocery": {
      const match = GROCERY_CATALOG.find((p) => p.name.toLowerCase() === cmd.name.toLowerCase() || p.nameUr === cmd.name);
      addGroceryItem({ productId: match?.id, name: match?.name ?? cmd.name, category: match?.category ?? "other", quantity: cmd.quantity, unit: cmd.unit });
      toast(`Added to Saman from phone: ${match?.name ?? cmd.name}`);
      break;
    }
    case "channel":
      closeTopLayer();
      navigate(`/tv?ch=${encodeURIComponent(cmd.id)}`);
      break;
    case "surah":
      closeTopLayer();
      navigate(`/quran?s=${cmd.number}`);
      break;
  }
}
