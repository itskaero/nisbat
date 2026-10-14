import "./polyfills";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./tv.css";
import { render } from "preact";
import { startSync } from "@/lib/storage/sync";
import { settingsStore } from "@/lib/storage/stores";
import { App } from "./app";
import { handleCommand, installKeyboard } from "./lib/input";
import { connectRemote } from "./lib/remote";

// Arabic/Urdu faces are large: load them after first paint.
requestIdleCallbackSafe(() => {
  void import("@fontsource/amiri/arabic-400.css");
  void import("@fontsource/noto-nastaliq-urdu/arabic-400.css");
});

function requestIdleCallbackSafe(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
  else setTimeout(fn, 1200);
}

const s = settingsStore.get();
document.documentElement.dataset.motion = s.motion === "reduced" ? "reduced" : "full";

installKeyboard();
startSync();
connectRemote(handleCommand);
render(<App />, document.getElementById("app")!);

// Hand over from the HTML splash once the first frame of the app is painted.
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    splash.classList.add("done");
    setTimeout(() => splash.remove(), 500);
  }),
);
