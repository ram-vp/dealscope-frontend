import { formatAsOfDate } from "@/components/dealscope/data-freshness"
import { SectionHeader } from "@/components/ui/section"
import { type Company } from "@/lib/dealscope-data"
import { isElevatedPledge } from "@/lib/ownership-badges"
import { cn } from "@/lib/utils"

export function OwnershipStructure({
  company,
}: {
  company: Company
}) {
  // Ownership & pledge metrics
  const fin = company.financials
  const raw = company.raw
  const promoterHolding =
    raw.promoterHolding ??
    (fin.promoterHolding && fin.promoterHolding !== "N/A" ? Number.parseFloat(fin.promoterHolding) : null)
  const pledgeVal =
    raw.promoterPledge ??
    (fin.promoterPledge && fin.promoterPledge !== "N/A" ? Number.parseFloat(fin.promoterPledge) : null)
  const pledgeFlagged = isElevatedPledge(pledgeVal)
  const pledgeStatus = pledgeVal == null ? "Not reported" : pledgeVal > 0 ? "Encumbered" : "Unencumbered"
  const pledgeDetail =
    pledgeVal == null
      ? "Pledge data is not available for this company"
      : pledgeVal > 0
        ? "Shares encumbered as collateral"
        : "No reported encumbrance on promoter shares"
  const freeFloat = promoterHolding != null ? Math.max(0, Math.min(100, 100 - promoterHolding)) : null

  return (
    <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="06"
        label="Ownership Structure"
        subtitle={`Cap table & float breakdown · As of ${formatAsOfDate(company.asOfDate)}`}
      />
      <div className="border border-border/40 bg-card/25 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Promoter Holding
              </span>
              {promoterHolding != null && (
                <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 border border-border/60 text-muted-foreground">
                  {promoterHolding >= 50 ? "Majority" : promoterHolding >= 26 ? "Controlling" : "Minority"}
                </span>
              )}
            </div>
            <p className="mt-2.5 font-mono text-3xl md:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              {promoterHolding != null ? `${promoterHolding.toFixed(1)}%` : fin.promoterHolding || "N/A"}
            </p>
            <span className="mt-1.5 block font-mono text-xs text-muted-foreground">
              Promoter &amp; insider equity
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Promoter Pledge
              </span>
              <span
                className={cn(
                  "font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 border",
                  pledgeFlagged
                    ? "border-accent/40 bg-accent/10 text-accent font-medium"
                    : "border-border/60 text-muted-foreground",
                )}
              >
                {pledgeStatus}
              </span>
            </div>
            <p
              className={cn(
                "mt-2.5 font-mono text-3xl md:text-4xl font-semibold tracking-tight tabular-nums",
                pledgeFlagged ? "text-accent" : "text-foreground",
              )}
            >
              {fin.promoterPledge}
            </p>
            <span className="mt-1.5 block font-mono text-xs text-muted-foreground">
              {pledgeDetail}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Free Float (Est.)
              </span>
              <span className="font-mono text-xs uppercase tracking-wider px-1.5 py-0.5 border border-border/60 text-muted-foreground">
                Estimate
              </span>
            </div>
            <p className="mt-2.5 font-mono text-3xl md:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              {freeFloat != null ? `${freeFloat.toFixed(1)}%` : "N/A"}
            </p>
            <span className="mt-1.5 block font-mono text-xs text-muted-foreground">
              100% less promoter &amp; insider equity
            </span>
          </div>
        </div>

        {/* Factual distribution bar */}
        {promoterHolding != null && freeFloat != null && (
          <div className="mt-8 pt-6 border-t border-border/30">
            <div className="h-2.5 w-full bg-border/40 flex overflow-hidden">
              <div
                className="bg-accent h-full transition-colors duration-500"
                style={{ width: `${Math.min(100, Math.max(0, promoterHolding))}%` }}
              />
              <div
                className="bg-foreground/25 h-full transition-colors duration-500"
                style={{ width: `${Math.min(100, Math.max(0, freeFloat))}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-accent inline-block" /> Promoter ({promoterHolding.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-foreground/25 inline-block" /> Free Float ({freeFloat.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
