import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // The TV frontend (apps/tv) is a static single-page app in public/screen.
  async rewrites() {
    return [{ source: "/screen", destination: "/screen/index.html" }];
  },
  async headers() {
    return [
      { source: "/screen", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      { source: "/screen/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
