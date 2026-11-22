import Link from "next/link"
import { LEGAL_PAGES, SITE } from "@/lib/site"

const LINK = "hover:text-accent transition-colors"

// The original homepage footer, on every page, with the legal links added.
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/40 py-8 sm:py-10 px-4 sm:px-6 md:px-12 bg-background font-mono text-xs text-muted-foreground">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <span>DEALSCOPE · Listed India comps</span>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
          <Link href="/about" className={LINK}>
            Methodology
          </Link>
          {LEGAL_PAGES.map((page) => (
            <Link key={page.href} href={page.href} className={LINK}>
              {page.label}
            </Link>
          ))}
          <span className="text-border" aria-hidden="true">·</span>
          <span>Built by Ram</span>
        </div>
      </div>
      <p className="max-w-5xl mx-auto mt-4 text-center sm:text-left leading-relaxed">
        Not investment advice. {SITE.name} is not registered with SEBI as an investment adviser or research analyst.
        Cookieless analytics only.
      </p>
    </footer>
  )
}
