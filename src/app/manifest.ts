import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Entre Naciones",
    short_name: "Entre Naciones",
    description: "Comida y productos de Venezuela y Argentina",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8ec",
    theme_color: "#e3241b",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "Mi carrito", url: "/carrito", icons: [{ src: "/icon-192.png", sizes: "192x192" }] }],
  };
}
