import Link from "next/link"
import { LEGAL_PAGES, SITE } from "@/lib/site"

const LINK = "inline-flex min-h-11 min-w-11 items-center hover:text-accent"

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] font-mono text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:px-10">
        <p className="max-w-3xl leading-relaxed">
          <strong className="font-semibold text-foreground">Not investment advice.</strong> {SITE.name} is not
          registered with SEBI as an investment adviser or research analyst. Scores and ranges are automated
          calculations from third-party data and may be wrong. Cookieless analytics only.
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 uppercase tracking-wider">
              <li>
                <Link href="/about" className={LINK}>
                  Methodology
                </Link>
              </li>
              {LEGAL_PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={LINK}>
                    {page.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.email}`} className={LINK}>
                  Contact
                </a>
              </li>
            </ul>
          </nav>
          <p>Built by Ram · Listed India comps</p>
        </div>
      </div>
    </footer>
  )
}
