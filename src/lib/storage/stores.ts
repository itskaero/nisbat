"use client";

import { z } from "zod";
import { createPersistedStore, uid } from "./persisted-store";
import type { ActivityEvent, ActivityType } from "@/types/domain";
import { DEFAULT_PODCASTS } from "@/features/sunein/sources";
import { activitySchema, azkarSchema, suneinSchema, groceriesSchema, newsSchema, quranSchema, tasksSchema, tvSchema, type QuranState } from "./schemas";

export type { QuranState };

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const locationSchema = z.object({
  name: z.string(),
  admin: z.string().optional(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
});

export const settingsSchema = z.object({
  name: z.string().max(40),
  language: z.enum(["en", "ur"]),
  timezone: z.string(),
  textSize: z.enum(["md", "lg", "xl"]),
  motion: z.enum(["system", "reduced", "full"]),
  background: z.enum(["photo", "dusk", "night", "plain"]),
  location: locationSchema.nullable(),
  showWeather: z.boolean(),
  showPrayer: z.boolean(),
  /** AlAdhan calculation method id (1 = University of Islamic Sciences, Karachi). */
  prayerMethod: z.number().int(),
  /** 0 = Shafi'i/standard, 1 = Hanafi (later Asr). */
  asrSchool: z.union([z.literal(0), z.literal(1)]),
  quranTranslation: z.string(),
  quranReciter: z.string(),
  showSamplePrices: z.boolean(),
  communityStreams: z.boolean(),
  sidebarCollapsed: z.boolean(),
  /** "auto" switches to the TV (10-foot) layout on Chromecast/Google TV or with ?tv=1. */
  displayMode: z.enum(["auto", "standard", "tv"]),
  /** Minutes of inactivity before the ambient screen appears in TV mode (0 = never). */
  ambientMinutes: z.number().int().min(0).max(120),
  /** Show a prayer-time card on screen (and optional chime) at each enabled prayer. */
  prayerReminders: z.array(z.enum(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"])),
  reminderChime: z.boolean(),
  /** Show family photos behind the clock on the ambient screen. */
  ambientPhotos: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_LOCATION = {
  name: "Bahawalpur",
  admin: "Punjab",
  country: "Pakistan",
  latitude: 29.3956,
  longitude: 71.6836,
  timezone: "Asia/Karachi",
};

const SETTINGS_DEFAULTS: Settings = {
  name: "",
  language: "en",
  timezone: "Asia/Karachi",
  textSize: "md",
  motion: "system",
  background: "photo",
  location: DEFAULT_LOCATION,
  showWeather: true,
  showPrayer: true,
  prayerMethod: 1,
  asrSchool: 1,
  quranTranslation: "en.sahih",
  quranReciter: "ar.alafasy",
  showSamplePrices: true,
  communityStreams: false,
  sidebarCollapsed: false,
  displayMode: "auto",
  ambientMinutes: 5,
  prayerReminders: ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
  reminderChime: true,
  ambientPhotos: true,
};

export const settingsStore = createPersistedStore<Settings>({
  key: "settings",
  version: 1,
  schema: settingsSchema,
  defaults: SETTINGS_DEFAULTS,
  // Settings added after the user's data was written are filled from defaults.
  normalize: (data) => (data && typeof data === "object" ? { ...SETTINGS_DEFAULTS, ...data } : data),
});

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export const tasksStore = createPersistedStore({
  key: "tasks",
  version: 1,
  sync: true,
  schema: tasksSchema,
  defaults: [],
});

/* ------------------------------------------------------------------ */
/* Groceries                                                           */
/* ------------------------------------------------------------------ */

export const groceryStore = createPersistedStore({
  key: "groceries",
  version: 1,
  sync: true,
  schema: groceriesSchema,
  defaults: [],
});

/* ------------------------------------------------------------------ */
/* Quran                                                               */
/* ------------------------------------------------------------------ */

export const quranStore = createPersistedStore<QuranState>({
  key: "quran",
  version: 1,
  sync: true,
  schema: quranSchema,
  defaults: { lastRead: null, bookmarks: [], read: {}, reflections: [], dailyGoal: 5 },
});

/* ------------------------------------------------------------------ */
/* News                                                                */
/* ------------------------------------------------------------------ */

export const newsStore = createPersistedStore({
  key: "news",
  version: 1,
  sync: true,
  schema: newsSchema,
  defaults: { saved: [] },
});

/* ------------------------------------------------------------------ */
/* Live TV                                                             */
/* ------------------------------------------------------------------ */

export const tvStore = createPersistedStore({
  key: "tv",
  version: 1,
  sync: true,
  schema: tvSchema,
  defaults: { favorites: [], recent: [], custom: [] },
});

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

export const activityStore = createPersistedStore<ActivityEvent[]>({
  key: "activity",
  version: 1,
  sync: true,
  schema: activitySchema,
  defaults: [],
});

const MAX_ACTIVITY = 60;

export function logActivity(type: ActivityType, label: string, href?: string) {
  activityStore.set((prev) => {
    // Collapse repeats of the same event within a minute (e.g. re-opening a surah).
    const head = prev[0];
    if (head && head.type === type && head.label === label && Date.now() - Date.parse(head.at) < 60_000) {
      return prev;
    }
    return [{ id: uid("a"), type, label, href, at: new Date().toISOString() }, ...prev].slice(0, MAX_ACTIVITY);
  });
}

/* ------------------------------------------------------------------ */
/* Remote control                                                      */
/* ------------------------------------------------------------------ */

/** On the TV: the pairing code phones use to control this screen. */
export const tvRemoteStore = createPersistedStore({
  key: "tv-remote",
  version: 1,
  schema: z.object({ code: z.string().regex(/^[A-Z2-9]{6}$/).nullable() }),
  defaults: { code: null },
});

/** On the phone: the TV this remote is paired with. */
export const phoneRemoteStore = createPersistedStore({
  key: "phone-remote",
  version: 1,
  schema: z.object({ code: z.string().regex(/^[A-Z2-9]{6}$/).nullable() }),
  defaults: { code: null },
});

/* ------------------------------------------------------------------ */
/* Azkar                                                               */
/* ------------------------------------------------------------------ */

export const azkarStore = createPersistedStore({
  key: "azkar",
  version: 1,
  sync: true,
  schema: azkarSchema,
  defaults: { date: "", counts: {}, tasbeeh: { count: 0, target: 33, total: 0 } },
});

/* ------------------------------------------------------------------ */
/* Sunein (listening)                                                  */
/* ------------------------------------------------------------------ */

export const suneinStore = createPersistedStore({
  key: "sunein",
  version: 1,
  sync: true,
  schema: suneinSchema,
  defaults: { podcasts: DEFAULT_PODCASTS, channels: [], progress: {} },
});
