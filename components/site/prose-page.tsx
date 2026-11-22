import type React from "react"
import Link from "next/link"
import { formatAsOfDate } from "@/components/dealscope/data-freshness"
import { JsonLd } from "@/components/site/json-ld"
import { BACK_LINK, PAGE_TITLE } from "@/components/site/styles"
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
    <article className="relative min-h-screen px-4 sm:px-6 md:px-10 lg:px-16 py-10 md:py-16 bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd(title, path)} />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link href="/" className={BACK_LINK}>
          ← Return to Screener
        </Link>
        <div className="mt-6 pb-6 border-b border-border/40">
          <h1 className={PAGE_TITLE}>{title}</h1>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
            Effective <time dateTime={LEGAL_UPDATED}>{formatAsOfDate(LEGAL_UPDATED)}</time>
          </p>
          <p className="mt-3 font-sans text-sm sm:text-base leading-relaxed text-foreground/90 text-pretty">{intro}</p>
        </div>
        <div className="space-y-10 md:space-y-12 mt-8">{children}</div>
      </div>
    </article>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="border-b border-border/40 pb-2 mb-4">
        <h2 className="font-mono text-sm sm:text-base uppercase tracking-wider text-foreground font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 font-sans text-sm leading-relaxed text-foreground/90 text-pretty [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:break-words [&_dd]:mt-1 [&_dd]:text-muted-foreground [&_dt]:mt-4 [&_dt]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

export function ContactEmail() {
  return <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
}
