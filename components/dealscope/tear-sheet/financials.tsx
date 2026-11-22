import { formatAsOfDate } from "@/components/dealscope/data-freshness"
import { SectionHeader } from "@/components/ui/section"
import { type Company } from "@/lib/dealscope-data"
import { isElevatedPledge } from "@/lib/ownership-badges"
import { cn } from "@/lib/utils"

export function KeyFinancials({
  company,
}: {
  company: Company
}) {
  const fin = company.financials
  const pledgeFlagged = isElevatedPledge(company.raw.promoterPledge)
  // Key Financials grid
  const financialCards: { label: string; value: string; flagged?: boolean }[] = [
    { label: "Market Cap", value: fin.marketCap },
    { label: "Revenue (TTM)", value: company.metrics.revenue },
    { label: "EBITDA Margin", value: company.metrics.ebitdaMargin },
    { label: "ROCE", value: company.metrics.roce },
    { label: "Total Debt", value: company.metrics.totalDebt },
    { label: "P/E Ratio", value: fin.peRatio },
    { label: "ROE", value: fin.roe },
    { label: "Debt / Equity", value: fin.debtToEquity },
    { label: "Promoter Pledge", value: fin.promoterPledge, flagged: pledgeFlagged },
    { label: "Current Ratio", value: fin.currentRatio },
    { label: "Free Cash Flow", value: fin.freeCashFlow },
    { label: "Beta", value: fin.beta },
  ]

  return (
    <div className="mt-10 sm:mt-12 md:mt-16">
      <SectionHeader
        index="01"
        label="Key Financials"
        subtitle={`Market cap as of ${formatAsOfDate(fin.marketCapAsOf)} · Fundamentals as of ${formatAsOfDate(company.asOfDate)}`}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
        {financialCards.map((card) => (
          <FinancialCard
            key={card.label}
            label={card.label}
            value={card.value}
            flagged={card.flagged}
          />
        ))}
      </div>
    </div>
  )
}

function FinancialCard({
  label,
  value,
  flagged,
}: {
  label: string
  value: string
  flagged?: boolean
}) {
  return (
    <div className="border border-border/40 bg-card/25 hover:border-border/70 transition-colors p-4 sm:p-5 flex flex-col justify-between min-h-[95px] sm:min-h-[105px]">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        data-testid={`metric-${label}`}
        className={cn(
          "font-display text-2xl sm:text-3xl lg:text-4xl leading-none tracking-tight break-words",
          flagged ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}
