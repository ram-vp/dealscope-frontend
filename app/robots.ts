import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

// /data/* stays crawlable (Google needs it to render results); it is kept out
// of the index by the X-Robots-Tag in next.config.mjs.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.url}/sitemap.xml` }
}
