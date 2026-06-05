import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trincadores Mundialistas",
    short_name: "Trincadores",
    description: "Porra privada Mundial 2026",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2a1058",
    theme_color: "#2a1058",
    icons: [
      {
        src: "/icons/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/logo.png",
        sizes: "708x708",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
