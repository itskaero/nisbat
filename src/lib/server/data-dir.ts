import "server-only";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/** Where Nisbat keeps family data on the server (default ./data, override with NISBAT_DATA_DIR). */
export function dataDir(...parts: string[]) {
  return path.resolve(process.env.NISBAT_DATA_DIR || path.join(process.cwd(), "data"), ...parts);
}

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
  return dir;
}
