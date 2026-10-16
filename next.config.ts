import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos ya se suben comprimidas en WebP desde el admin,
    // así que no gastamos optimizaciones del hosting.
    unoptimized: true,
  },
};

export default nextConfig;
