import { FactorRadarChart } from "@/components/dealscope/factor-radar-chart"
import { SectionHeader } from "@/components/ui/section"
import { type Company, type Weights, FACTOR_LABELS } from "@/lib/dealscope-data"
import { cn } from "@/lib/utils"

export function FactorBreakdown({
  company,
  weights,
}: {
  company: Company
  weights: Weights
}) {
  const unclassified = company.sector === "Unclassified"
  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="mt-12 sm:mt-16 md:mt-24 pt-10 sm:pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="02"
        label="Factor Decomposition & Operational Radar"
        subtitle={`Sector-relative percentiles (0–100) benchmarked against ${company.sector} cohort`}
      />
      <p className="font-mono text-xs leading-relaxed text-muted-foreground max-w-3xl mb-6 sm:mb-8">
        {unclassified
          ? "This company has no sector classification, so it is not ranked against a peer group. Factor scores are shown as unavailable rather than estimated."
          : `Each factor is ranked 0 to 100 against direct peers in ${company.sector}. A score of 90 means outperforming 90% of sector companies. Missing factors are excluded from weighting.`}
      </p>

      {/* Symmetrical Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Factor Decomposition Panel */}
        <div className="border border-border/40 bg-card/25 p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">

          <div>
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4 sm:mb-5 font-mono text-xs">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                02.A / Factor Drivers
              </h3>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Cohort: {company.sector}
              </span>
            </div>

            {/* 4 Factor Rows */}
            <div className="flex flex-col divide-y divide-border/20">
              {FACTOR_LABELS.map((factor) => (
                <FactorRow
                  key={factor.key}
                  label={factor.label}
                  value={company.factors[factor.key]}
                  weight={weightTotal ? Math.round((weights[factor.key] / weightTotal) * 100) : 0}
                  metric={company.metrics[factor.metricKey]}
                  explainer={factor.explainer}
                />
              ))}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between font-mono text-xs text-muted-foreground uppercase tracking-wider">
            <span>Sector-Relative Percentiles</span>
            <span>Weights normalized to 100%</span>
          </div>
        </div>

        {/* Right Column: Factor Radar Chart Box */}
        <div className="h-full flex flex-col">
          <FactorRadarChart
            factors={company.factors}
            weights={weights}
            sector={company.sector}
            unclassified={unclassified}
            rawMetrics={{
              revenueGrowth: company.metrics.revenueGrowth,
              ebitdaMargin: company.metrics.ebitdaMargin,
              roce: company.metrics.roce,
              debtLevel: company.metrics.totalDebt,
            }}
            className="w-full h-full justify-between"
          />
        </div>
      </div>
    </div>
  )
}

function FactorRow({
  label,
  value,
  weight,
  metric,
  explainer,
}: {
  label: string
  value: number | null
  weight: number
  metric: string
  explainer: string
}) {
  const missing = value == null
  return (
    <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider text-foreground font-semibold">{label}</span>
          <span className="text-xs uppercase tracking-wider border border-accent/40 bg-accent/5 text-accent px-1.5 py-0.2 font-medium">
            w {weight}%
          </span>
        </div>
        <div className="flex items-baseline gap-2 font-mono text-xs">
          <span className="text-muted-foreground">{metric}</span>
          <span className="text-muted-foreground">·</span>
          <span className={cn("font-bold tabular-nums", missing ? "text-muted-foreground" : "text-accent")}>
            {missing ? "N/A" : `${value}/100`}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-2.5 h-[3px] bg-border/40 relative overflow-hidden">
        <div
          className="bar-grow absolute inset-0 origin-left bg-accent"
          style={{ scale: `${missing ? 0 : value / 100} 1` }}
        />
      </div>

      {/* Explainer Subtitle */}
      <span className="mt-1.5 block font-mono text-xs leading-relaxed text-muted-foreground">
        {explainer}
      </span>
    </div>
  )
}
