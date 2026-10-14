import path from "node:path";
import { fileURLToPath } from "node:url";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

/**
 * Nisbat's TV frontend for the Chromecast (Chrome 90): Preact, built into
 * the website's public/screen folder and served by the same Nisbat server.
 */
export default defineConfig({
  root: here,
  base: "/screen/",
  plugins: [preact()],
  resolve: { alias: { "@": path.join(root, "src") } },
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
  css: { postcss: here },
  build: {
    target: "chrome90",
    cssTarget: "chrome90",
    outDir: path.join(root, "public/screen"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5174,
    proxy: { "/api": "http://localhost:3005", "/backgrounds": "http://localhost:3005", "/groceries": "http://localhost:3005" },
  },
});
