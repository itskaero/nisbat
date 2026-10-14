import { MAX_PHOTO_BYTES, listPhotos, savePhoto } from "@/lib/server/photos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ photos: await listPhotos() }, { headers: { "Cache-Control": "no-store" } });
}

/** Upload one photo as multipart/form-data field "photo". */
export async function POST(req: Request) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_PHOTO_BYTES + 64 * 1024) return Response.json({ error: "Photo is larger than 10 MB" }, { status: 413 });
  let file: File | null = null;
  try {
    file = (await req.formData()).get("photo") as File | null;
  } catch {
    return Response.json({ error: "Expected a photo upload" }, { status: 400 });
  }
  if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "Expected a photo upload" }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES) return Response.json({ error: "Photo is larger than 10 MB" }, { status: 413 });
  try {
    const photo = await savePhoto(Buffer.from(await file.arrayBuffer()));
    return Response.json({ photo }, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
