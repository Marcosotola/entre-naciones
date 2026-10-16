import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos ya se suben comprimidas en WebP desde el admin,
    // así que no gastamos optimizaciones del hosting.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // El service worker nunca se cachea, así las actualizaciones llegan enseguida
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
