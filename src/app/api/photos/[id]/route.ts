import { allowed } from "@/lib/server/devices";
import { deletePhoto, readPhoto } from "@/lib/server/photos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const photo = await readPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.buf), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const { id } = await ctx.params;
  return (await deletePhoto(id)) ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
}
