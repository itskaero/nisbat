import { z } from "zod";
import { GROCERY_UNITS } from "@/types/groceries";

/**
 * Schemas for data that is shared across the family's devices (validated in
 * the browser and again on the Nisbat server before it is stored).
 */

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

export const tasksSchema = z.array(taskSchema);

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

export const groceriesSchema = z.array(shoppingItemSchema);

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

export const newsSchema = z.object({ saved: z.array(articleSchema.extend({ savedAt: z.string() })) });

export const tvSchema = z.object({
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
});

export const activitySchema = z.array(
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
  );

export const azkarSchema = z.object({
  /** Day (YYYY-MM-DD) the per-dhikr counts belong to; they reset each day. */
  date: z.string(),
  counts: z.record(z.string(), z.number().int().min(0)),
  tasbeeh: z.object({ count: z.number().int().min(0), target: z.number().int().min(1).max(10000), total: z.number().int().min(0) }),
});

export const suneinSchema = z.object({
  podcasts: z.array(z.object({ feedUrl: z.string().url(), title: z.string().max(200) })).max(60),
  channels: z.array(z.object({ id: z.string().regex(/^UC[A-Za-z0-9_-]{22}$/), title: z.string().max(200) })).max(60),
  /** Listening position per episode, so playback resumes on any screen. */
  progress: z.record(
    z.string(),
    z.object({
      pos: z.number().min(0),
      dur: z.number().min(0),
      title: z.string().max(300),
      show: z.string().max(200),
      url: z.string().url(),
      feedUrl: z.string().optional(),
      at: z.string(),
    }),
  ),
});

/** Store keys synced through the Nisbat server, with their schemas. */
export const SYNCED_SCHEMAS = {
  tasks: tasksSchema,
  groceries: groceriesSchema,
  quran: quranSchema,
  news: newsSchema,
  tv: tvSchema,
  activity: activitySchema,
  azkar: azkarSchema,
  sunein: suneinSchema,
} as const;
export type SyncedKey = keyof typeof SYNCED_SCHEMAS;
