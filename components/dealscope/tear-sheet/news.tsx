import type React from "react"
import { ArrowUpRight } from "lucide-react"
import { LoadError } from "@/components/dealscope/view-status"
import { SectionHeader } from "@/components/ui/section"
import type { DetailsStatus } from "@/lib/company-details"
import { type CompanyNews } from "@/lib/dealscope-data"
import { displayDay, newestFirst, safeHref } from "@/lib/display"

export function FilingsAndNews({
  companyNews,
  detailsStatus,
  retry,
}: {
  companyNews: CompanyNews
  detailsStatus: DetailsStatus
  retry: () => void
}) {
  return (
    <div className="mt-12 sm:mt-16 md:mt-24 pt-10 sm:pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader index="08" label="Filings, Notices & News" />
      {detailsStatus === "error" && (
        <LoadError message="Filings and news could not be loaded." onRetry={retry} className="mb-6" />
      )}
      {detailsStatus === "loading" && (
        <p role="status" className="mb-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Loading filings and news...
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8 sm:gap-y-12">
        {/* NSE regulatory filings */}
        <NewsColumn title="NSE Filings" count={companyNews.filings.length} emptyLabel={detailsStatus === "ready" ? "No recent filings found" : ""}>
          {newestFirst(companyNews.filings).map((f, i) => (
            <NewsRow key={`${f.category}-${f.date}-${i}`} href={f.link} date={f.date} title={f.category} />
          ))}
        </NewsColumn>

        {/* BSE notices */}
        <NewsColumn title="BSE Notices" count={companyNews.bseNotices.length} emptyLabel={detailsStatus === "ready" ? "No recent notices found" : ""}>
          {newestFirst(companyNews.bseNotices).map((n, i) => (
            <NewsRow key={`${n.title}-${n.date}-${i}`} href={n.link} date={n.date} title={n.title} />
          ))}
        </NewsColumn>

        {/* Press / news */}
        <NewsColumn title="News" count={companyNews.news.length} emptyLabel={detailsStatus === "ready" ? "No recent coverage found" : ""}>
          {newestFirst(companyNews.news).map((n, i) => (
            <NewsRow key={`${n.headline}-${n.date}-${i}`} href={n.link} date={n.date} title={n.headline} source={n.source} />
          ))}
        </NewsColumn>
      </div>
    </div>
  )
}

function NewsColumn({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string
  count: number
  emptyLabel: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-border/40 pb-3 mb-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
          {count > 0 ? String(count).padStart(2, "0") : "00"}
        </span>
      </div>
      {count === 0 ? (
        <p className="py-6 font-mono text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </div>
  )
}

function NewsRow({
  href,
  date,
  title,
  source,
}: {
  href: string
  date: string
  title: string
  source?: string
}) {
  const link = safeHref(href)
  return (
    <a
      href={link ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-border/25 py-4 hover:bg-accent/5 transition-colors duration-200 min-h-11 min-w-11"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{displayDay(date)}</span>
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 group-hover:text-accent" />
      </div>
      <p className="mt-2 font-mono text-xs leading-relaxed text-foreground group-hover:text-accent transition-colors duration-200 text-pretty">
        {title}
      </p>
      {link && <span className="sr-only">(opens in a new tab)</span>}
      {source && (
        <span className="mt-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {source}
        </span>
      )}
    </a>
  )
}
