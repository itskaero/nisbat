import { z } from "zod";
import { readKey, writeKey } from "@/lib/server/store";
import { SYNCED_SCHEMAS, type SyncedKey } from "@/lib/storage/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 2_000_000;

function isSynced(key: string): key is SyncedKey {
  return Object.prototype.hasOwnProperty.call(SYNCED_SCHEMAS, key);
}

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!isSynced(key)) return Response.json({ error: "Unknown store" }, { status: 404 });
  const stored = await readKey(key);
  return Response.json({ version: stored.version, updatedAt: stored.updatedAt, data: stored.data }, { headers: { "Cache-Control": "no-store" } });
}

const body = z.object({ data: z.unknown(), origin: z.string().max(40).optional() });

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!isSynced(key)) return Response.json({ error: "Unknown store" }, { status: 404 });
  const text = await req.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "Too large" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = body.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  const valid = SYNCED_SCHEMAS[key].safeParse(parsed.data.data);
  if (!valid.success) return Response.json({ error: "Data failed validation" }, { status: 422 });
  const stored = await writeKey(key, valid.data, parsed.data.origin);
  return Response.json({ version: stored.version, updatedAt: stored.updatedAt });
}
