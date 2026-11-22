import type React from "react"
import { formatAsOfDate } from "@/components/dealscope/data-freshness"
import { JsonLd } from "@/components/site/json-ld"
import { breadcrumbJsonLd } from "@/lib/seo"
import { LEGAL_UPDATED, SITE } from "@/lib/site"

export function LegalPage({
  title,
  path,
  intro,
  children,
}: {
  title: string
  path: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(title, path)} />
      <h1 className="font-display text-5xl uppercase leading-none tracking-tight sm:text-6xl">{title}</h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Effective <time dateTime={LEGAL_UPDATED}>{formatAsOfDate(LEGAL_UPDATED)}</time>
      </p>
      <p className="mt-6 text-base leading-relaxed">{intro}</p>
      <div className="prose-ds mt-10">{children}</div>
    </article>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function ContactEmail() {
  return <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
}
