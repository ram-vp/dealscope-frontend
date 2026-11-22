import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

// Manifests can't read CSS variables: this is the dark --background token as hex.
const BACKGROUND = "#03070b"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
