import "server-only";
import { randomUUID } from "node:crypto";
import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dataDir, ensureDir } from "./data-dir";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTOS = 300;

const TYPES = [
  { ext: "jpg", mime: "image/jpeg", test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", test: (b: Buffer) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

export const PHOTO_ID = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export interface PhotoInfo {
  id: string;
  url: string;
  uploadedAt: string;
  bytes: number;
}

/** Detects the real image type from magic bytes (never trusts the filename). */
export function sniff(buf: Buffer) {
  return TYPES.find((t) => t.test(buf));
}

export async function listPhotos(): Promise<PhotoInfo[]> {
  const dir = await ensureDir(dataDir("photos"));
  const names = (await readdir(dir)).filter((n) => PHOTO_ID.test(n));
  const infos = await Promise.all(
    names.map(async (n) => {
      const s = await stat(dataDir("photos", n));
      return { id: n, url: `/api/photos/${n}`, uploadedAt: s.mtime.toISOString(), bytes: s.size };
    }),
  );
  return infos.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function savePhoto(buf: Buffer): Promise<PhotoInfo> {
  const type = sniff(buf);
  if (!type) throw new Error("Only JPEG, PNG or WebP images are accepted");
  if ((await listPhotos()).length >= MAX_PHOTOS) throw new Error(`The photo frame holds up to ${MAX_PHOTOS} photos — delete some first`);
  const id = `${randomUUID()}.${type.ext}`;
  await ensureDir(dataDir("photos"));
  await writeFile(dataDir("photos", id), buf);
  return { id, url: `/api/photos/${id}`, uploadedAt: new Date().toISOString(), bytes: buf.length };
}

export async function readPhoto(id: string) {
  if (!PHOTO_ID.test(id)) return null;
  try {
    const buf = await readFile(dataDir("photos", id));
    return { buf, mime: sniff(buf)?.mime ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deletePhoto(id: string) {
  if (!PHOTO_ID.test(id)) return false;
  try {
    await unlink(dataDir("photos", id));
    return true;
  } catch {
    return false;
  }
}
