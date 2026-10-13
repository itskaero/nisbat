"use client";

import { z } from "zod";
import { createPersistedStore, uid } from "./persisted-store";
import type { ActivityEvent, ActivityType } from "@/types/domain";
import { GROCERY_UNITS } from "@/types/groceries";

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
  background: z.enum(["dusk", "night", "plain"]),
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
  background: "dusk",
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

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  priority: z.enum(["low", "medium", "high"]),
  tag: z.string().max(40).optional(),
  reminder: z.string().optional(),
  completed: z.boolean(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tasksStore = createPersistedStore({
  key: "tasks",
  version: 1,
  schema: z.array(taskSchema),
  defaults: [],
});

/* ------------------------------------------------------------------ */
/* Groceries                                                           */
/* ------------------------------------------------------------------ */

export const shoppingItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  name: z.string().min(1).max(80),
  category: z.enum([
    "grains",
    "pulses",
    "essentials",
    "vegetables",
    "fruits",
    "dairy",
    "meat",
    "bakery",
    "beverages",
    "household",
    "personal",
    "baby",
    "snacks",
    "frozen",
    "other",
  ]),
  quantity: z.number().positive().max(10000),
  unit: z.enum(GROCERY_UNITS),
  unitPrice: z.number().nonnegative().optional(),
  priceIsSample: z.boolean().optional(),
  notes: z.string().max(300).optional(),
  purchased: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const groceryStore = createPersistedStore({
  key: "groceries",
  version: 1,
  schema: z.array(shoppingItemSchema),
  defaults: [],
});

/* ------------------------------------------------------------------ */
/* Quran                                                               */
/* ------------------------------------------------------------------ */

const verseRef = { surah: z.number().int().min(1).max(114), ayah: z.number().int().min(1).max(286) };

export const quranSchema = z.object({
  lastRead: z.object({ ...verseRef, at: z.string() }).nullable(),
  bookmarks: z.array(z.object({ ...verseRef, createdAt: z.string(), note: z.string().optional() })),
  /** Verses marked read, keyed "surah:ayah" → ISO date of first read. */
  read: z.record(z.string(), z.string()),
  reflections: z.array(
    z.object({
      ...verseRef,
      id: z.string(),
      arabic: z.string().optional(),
      translation: z.string().optional(),
      translationEdition: z.string().optional(),
      lesson: z.string(),
      application: z.string(),
      notes: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
  dailyGoal: z.number().int().min(1).max(100),
});
export type QuranState = z.infer<typeof quranSchema>;

export const quranStore = createPersistedStore<QuranState>({
  key: "quran",
  version: 1,
  schema: quranSchema,
  defaults: { lastRead: null, bookmarks: [], read: {}, reflections: [], dailyGoal: 5 },
});

/* ------------------------------------------------------------------ */
/* News                                                                */
/* ------------------------------------------------------------------ */

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  url: z.string().url(),
  imageUrl: z.string().optional(),
  source: z.string(),
  sourceId: z.string(),
  publishedAt: z.string().optional(),
  category: z.string(),
  lang: z.enum(["en", "ur"]),
});

export const newsStore = createPersistedStore({
  key: "news",
  version: 1,
  schema: z.object({ saved: z.array(articleSchema.extend({ savedAt: z.string() })) }),
  defaults: { saved: [] },
});

/* ------------------------------------------------------------------ */
/* Live TV                                                             */
/* ------------------------------------------------------------------ */

export const tvStore = createPersistedStore({
  key: "tv",
  version: 1,
  schema: z.object({
    favorites: z.array(z.string()),
    recent: z.array(z.object({ id: z.string(), at: z.string() })),
    custom: z.array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(60),
        category: z.enum(["news", "sports", "entertainment", "islamic", "educational", "regional", "kids", "other"]),
        url: z.string().url(),
      }),
    ),
  }),
  defaults: { favorites: [], recent: [], custom: [] },
});

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

export const activityStore = createPersistedStore<ActivityEvent[]>({
  key: "activity",
  version: 1,
  schema: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "task-completed",
        "task-created",
        "quran-read",
        "reflection-saved",
        "grocery-added",
        "grocery-purchased",
        "news-saved",
        "tv-watched",
      ]),
      label: z.string(),
      href: z.string().optional(),
      at: z.string(),
    }),
  ),
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
