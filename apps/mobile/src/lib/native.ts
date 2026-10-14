import { App as CapApp } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Thin wrappers over native features; every one degrades gracefully in a browser. */
export const isNative = Capacitor.isNativePlatform();

export async function tap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: style === "heavy" ? ImpactStyle.Heavy : style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    /* no vibrator */
  }
}

export async function getPref(key: string): Promise<string | null> {
  if (isNative) return (await Preferences.get({ key })).value;
  try {
    return localStorage.getItem(`nisbat:app:${key}`);
  } catch {
    return null;
  }
}

export async function setPref(key: string, value: string | null) {
  if (isNative) {
    if (value == null) await Preferences.remove({ key });
    else await Preferences.set({ key, value });
    return;
  }
  try {
    if (value == null) localStorage.removeItem(`nisbat:app:${key}`);
    else localStorage.setItem(`nisbat:app:${key}`, value);
  } catch {
    /* ignore */
  }
}

/** A friendly default name for this phone ("Samsung SM-A546E"). */
export async function phoneName(): Promise<string> {
  try {
    const info = await Device.getInfo();
    const name = (info as { name?: string }).name;
    if (name && !/^(localhost|android)$/i.test(name)) return name.slice(0, 40);
    return `${info.manufacturer} ${info.model}`.trim().slice(0, 40) || "Phone";
  } catch {
    return "Phone";
  }
}

export async function share(title: string, text: string) {
  if (isNative) {
    await Share.share({ title, text }).catch(() => undefined);
  } else if (navigator.share) {
    await navigator.share({ title, text }).catch(() => undefined);
  } else {
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  }
}

export async function setupStatusBar() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    /* ignore */
  }
}

/** Android back button → our navigation stack; exits the app at the root. */
export function onBackButton(handler: () => boolean) {
  if (!isNative) return () => {};
  const sub = CapApp.addListener("backButton", () => {
    if (!handler()) void CapApp.exitApp();
  });
  return () => void sub.then((s) => s.remove());
}

export function onResume(handler: () => void) {
  if (!isNative) {
    const l = () => document.visibilityState === "visible" && handler();
    document.addEventListener("visibilitychange", l);
    return () => document.removeEventListener("visibilitychange", l);
  }
  const sub = CapApp.addListener("resume", handler);
  return () => void sub.then((s) => s.remove());
}

/* Native discovery plugin (android/.../DiscoveryPlugin.java). */
export interface FoundService {
  name: string;
  host: string;
  port: number;
}
interface DiscoveryPlugin {
  discover(opts: { timeoutMs: number }): Promise<{ services: FoundService[] }>;
  localAddress(): Promise<{ ip: string | null }>;
}
export const NisbatDiscovery = registerPlugin<DiscoveryPlugin>("NisbatDiscovery");
