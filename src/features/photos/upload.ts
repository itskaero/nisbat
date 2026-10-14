"use client";

import { apiUrl, authHeaders } from "@/lib/api-base";

/** Downscale on the device (max 1920px, JPEG) before uploading — keeps uploads small on home Wi-Fi. */
export async function prepareImage(file: File, max = 1920): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`Couldn't read ${file.name}`);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode image"))), "image/jpeg", 0.85));
}

export async function uploadPhotos(files: FileList | File[], onProgress?: (done: number, total: number) => void) {
  const list = [...files];
  let done = 0;
  const errors: string[] = [];
  for (const f of list) {
    try {
      const blob = await prepareImage(f);
      const form = new FormData();
      form.append("photo", blob, "photo.jpg");
      const r = await fetch(apiUrl("/api/photos"), { method: "POST", body: form, headers: authHeaders() });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Upload failed");
    } catch (e) {
      errors.push((e as Error).message);
    }
    onProgress?.(++done, list.length);
  }
  window.dispatchEvent(new Event("nisbat:photos-changed"));
  return { uploaded: list.length - errors.length, errors };
}
