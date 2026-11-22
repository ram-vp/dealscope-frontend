import type { Metadata } from "next"
import { SITE } from "@/lib/site"

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE.title }

/** Per-route metadata. A route that sets openGraph replaces the parent's whole
 *  object, image included, so every route builds it here. */
export function pageMetadata(page: { path: string; title?: string; description?: string }): Metadata {
  const title = page.title ? `${page.title} | ${SITE.name}` : SITE.title
  const description = page.description ?? SITE.description
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      url: page.path,
      siteName: SITE.name,
      title,
      description,
      locale: "en_IN",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  }
}

export function siteJsonLd() {
  const person = { "@type": "Person", "@id": `${SITE.url}/#creator`, name: SITE.owner, sameAs: [SITE.linkedin] }
  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en-IN",
        publisher: { "@id": person["@id"] },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE.url}/#app`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        creator: { "@id": person["@id"] },
      },
    ],
  }
}

export function breadcrumbJsonLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
      { "@type": "ListItem", position: 2, name, item: `${SITE.url}${path}` },
    ],
  }
}
