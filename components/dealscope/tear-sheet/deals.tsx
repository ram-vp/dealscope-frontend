import { SectionHeader } from "@/components/ui/section"
import { type Company, type DealRow, comparableCountForSector, comparablesForSector } from "@/lib/dealscope-data"
import { cn } from "@/lib/utils"

export function ComparableDeals({
  company,
  deals,
}: {
  company: Company
  deals: DealRow[]
}) {
  const comparables = comparablesForSector(company.sectorKey, deals)
  const comparableCount = comparableCountForSector(company.sectorKey, deals)

  return (
    <div className="mt-12 sm:mt-16 md:mt-24 pt-10 sm:pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="07"
        label="Comparable Deals"
        subtitle={`Historical M&A: ${comparableCount} in ${company.sector} (${deals.length} precedent deals total, 2006 to 2025)`}
      />
      <p className="font-mono text-xs leading-relaxed text-muted-foreground max-w-3xl mb-6">
        Selected precedent M&amp;A transactions in {company.sector} for benchmark context only. Not the source of the listed-peer valuation range above.
      </p>

      <div className="border border-border/40 bg-card/20 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-border/40 bg-card/40 px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="col-span-4">Target Company</span>
          <span className="col-span-3">Acquiring Entity</span>
          <span className="col-span-1 text-center">Year</span>
          <span className="col-span-2 text-center">Deal Type</span>
          <span className="col-span-2 text-right">Value (US$)</span>
        </div>

        {/* Rows */}
        {comparables.length === 0 ? (
          <div className="p-6 font-mono text-xs text-muted-foreground text-center">
            No precedent transactions recorded for {company.sector} in the dataset.
          </div>
        ) : (
          comparables.map((deal, i) => (
            <div
              key={`${deal.target}-${deal.year}-${i}`}
              className="border-b last:border-b-0 border-border/25 px-4 sm:px-5 py-3 sm:py-3.5 font-mono text-xs hover:bg-accent/5 transition-colors"
            >
              {/* Desktop Row View */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                <span className="col-span-4 text-foreground font-medium truncate" title={deal.target}>
                  {deal.target}
                </span>
                <span className="col-span-3 text-muted-foreground truncate" title={deal.acquirer}>
                  {deal.acquirer}
                </span>
                <span className="col-span-1 text-center text-muted-foreground tabular-nums">
                  {deal.year}
                </span>
                <span
                  className="col-span-2 text-center text-muted-foreground uppercase text-xs truncate"
                  title={deal.dealType || "M&A"}
                >
                  {deal.dealType || "M&A"}
                </span>
                <span
                  className={cn(
                    "col-span-2 text-right tabular-nums",
                    deal.value === "N/A"
                      ? "text-muted-foreground font-normal"
                      : "text-accent font-medium",
                  )}
                >
                  {deal.value}
                </span>
              </div>

              {/* Mobile Structured Card View */}
              <div className="md:hidden flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-foreground font-medium text-xs flex-1 break-words">
                    {deal.target}
                  </span>
                  <span
                    className={cn(
                      "text-xs shrink-0 tabular-nums",
                      deal.value === "N/A"
                        ? "text-muted-foreground font-normal"
                        : "text-accent font-medium",
                    )}
                  >
                    {deal.value}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                    Buyer:
                  </span>
                  <span className="truncate text-foreground">{deal.acquirer}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="tabular-nums text-muted-foreground">{deal.year}</span>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase text-xs">{deal.dealType || "M&A"}</span>
                  {deal.stakePct && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{deal.stakePct}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
