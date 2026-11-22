import type { MetadataRoute } from "next"
import datasetMeta from "@/data/dataset-meta.json"
import { LEGAL_PAGES, LEGAL_UPDATED, SITE } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: datasetMeta.prices_as_of, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: datasetMeta.fundamentals_as_of, changeFrequency: "monthly", priority: 0.8 },
    ...LEGAL_PAGES.map((page) => ({
      url: `${SITE.url}${page.href}`,
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ]
}
