// Shared domain models. Persisted shapes are validated by the zod schemas in
// src/lib/storage/stores.ts — keep the two in sync.

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** Calendar date in the user's configured time zone, YYYY-MM-DD. */
  dueDate?: string;
  /** Local time HH:mm (optional). */
  dueTime?: string;
  priority: Priority;
  tag?: string;
  /** Reminder metadata only — no notification is scheduled by the MVP. */
  reminder?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerseRef {
  surah: number;
  ayah: number;
}

export interface Bookmark extends VerseRef {
  createdAt: string;
  note?: string;
}

export interface Reflection extends VerseRef {
  id: string;
  /** Captured at save time so notes stay readable offline. */
  arabic?: string;
  translation?: string;
  translationEdition?: string;
  lesson: string;
  application: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string;
  source: string;
  sourceId: string;
  publishedAt?: string;
  category: string;
  lang: "en" | "ur";
}

export type ChannelCategory =
  | "news"
  | "sports"
  | "entertainment"
  | "islamic"
  | "educational"
  | "regional"
  | "kids"
  | "other";

export type StreamProvenance = "broadcaster" | "community" | "user";

export interface Channel {
  id: string;
  name: string;
  category: ChannelCategory;
  language?: string;
  country?: string;
  logo?: string;
  website?: string;
  description?: string;
  stream?: {
    url: string;
    type: "hls" | "mp4";
    provenance: StreamProvenance;
    /** Where the stream URL was found/verified. */
    source: string;
    verifiedOn?: string;
  };
  /** Why a stream is not offered, when `stream` is absent. */
  unavailableReason?: string;
}

export type ActivityType =
  | "task-completed"
  | "task-created"
  | "quran-read"
  | "reflection-saved"
  | "grocery-added"
  | "grocery-purchased"
  | "news-saved"
  | "tv-watched";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  label: string;
  href?: string;
  at: string;
}

export interface SavedLocation {
  name: string;
  admin?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface NewsResponse {
  category: string;
  items: NewsArticle[];
  sources: { id: string; publisher: string; homepage: string; ok: boolean; count: number; error?: string }[];
  fetchedAt: string;
}
