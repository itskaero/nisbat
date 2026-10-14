import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

/** Nisbat's Android app UI, bundled into the APK by Capacitor (dist/). */
export default defineConfig({
  root: here,
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.join(root, "src") } },
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
  css: { postcss: here },
  build: { outDir: path.join(here, "dist"), emptyOutDir: true, target: "chrome100", chunkSizeWarningLimit: 900 },
  server: { port: 5175 },
});
