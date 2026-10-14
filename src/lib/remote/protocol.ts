import { z } from "zod";
import { GROCERY_UNITS } from "@/types/groceries";

/** Screens a remote may open (no arbitrary URLs). */
export const REMOTE_PATHS = ["/", "/quran", "/namaz", "/azkar", "/sunein", "/pakistan", "/news", "/mausam", "/bazaar", "/saman", "/tasks", "/tv", "/settings"] as const;

export const codeSchema = z.string().regex(/^[A-Z2-9]{6}$/);

export const remoteCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("key"), key: z.enum(["up", "down", "left", "right", "ok", "back", "home"]) }),
  z.object({ type: z.literal("navigate"), path: z.enum(REMOTE_PATHS) }),
  z.object({ type: z.literal("media"), action: z.enum(["toggle", "next", "prev"]) }),
  z.object({ type: z.literal("text"), value: z.string().max(200) }),
  z.object({ type: z.literal("search"), query: z.string().min(1).max(100) }),
  z.object({ type: z.literal("addTask"), title: z.string().trim().min(1).max(200) }),
  z.object({
    type: z.literal("addGrocery"),
    name: z.string().trim().min(1).max(80),
    quantity: z.number().positive().max(10000),
    unit: z.enum(GROCERY_UNITS),
  }),
  z.object({ type: z.literal("channel"), id: z.string().max(80) }),
  z.object({ type: z.literal("surah"), number: z.number().int().min(1).max(114) }),
  z.object({ type: z.literal("wake") }),
]);
export type RemoteCommand = z.infer<typeof remoteCommandSchema>;

export const tvStateSchema = z.object({
  path: z.string().max(200),
  title: z.string().max(120),
  media: z.object({ label: z.string().max(120), playing: z.boolean() }).nullable(),
  ambient: z.boolean(),
});
export type TvState = z.infer<typeof tvStateSchema>;

/** Avoids look-alike characters (0/O, 1/I) so codes are easy to read off a TV. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newPairingCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}
