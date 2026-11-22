import { OwnershipBadge } from "@/components/dealscope/ownership-badges"
import { ScoreRing } from "@/components/dealscope/score-ring"
import { type Company, type SectorRankInfo } from "@/lib/dealscope-data"

export function TearSheetHeader({
  company,
  score,
  avg,
  sectorRank,
}: {
  company: Company
  score: number | null
  avg: number | null
  sectorRank: SectorRankInfo | null
}) {
  const unclassified = company.sector === "Unclassified"

  return (
    <div className="mt-6 md:mt-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 pb-8 sm:pb-10 border-b border-border/40">
      {/* Identity Column */}
      <div className="flex-1 min-w-0 max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent flex flex-wrap items-center gap-1.5">
          <span>Tear Sheet</span>
          <span className="text-muted-foreground">/</span>
          <span className="break-words">{company.sector}</span>
        </span>
        <h1
          className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[0.92] tracking-tight text-balance break-words text-foreground"
        >
          {company.name.toUpperCase()}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="border border-border bg-card/30 px-2 sm:px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            NSE: {company.ticker}
          </span>
          <OwnershipBadge
            holding={company.raw.promoterHolding}
            pledge={company.raw.promoterPledge}
          />
          {company.industry && (
            <span className="border border-border/50 bg-card/20 px-2 sm:px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground max-w-full break-words">
              {company.industry}
            </span>
          )}
          <span className="border border-border/50 bg-card/20 px-2 sm:px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            TTM {company.metrics.revenue}
          </span>
          {sectorRank && (
            <span className="border border-accent/40 bg-accent/5 px-2 sm:px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-accent font-medium">
              Ranks {sectorRank.rank} of {sectorRank.total} in {company.sector}
            </span>
          )}
        </div>
      </div>

      {/* Composite Score Pod */}
      <div
        className="flex items-center gap-4 sm:gap-5 shrink-0 pt-2 lg:pt-0"
      >
        <ScoreRing score={score} size={88} strokeWidth={3} sectorAverage={avg} />
        <div className="font-mono text-xs uppercase tracking-wider leading-relaxed">
          <span className="block text-foreground font-medium">Composite Score</span>
          <span className="block text-muted-foreground">
            Sector Avg <span className="text-accent font-medium tabular-nums">{avg == null ? "N/A" : avg}</span>
          </span>
          <span className="block text-muted-foreground text-xs mt-0.5">
            {unclassified ? "Unclassified: not scored" : score == null ? "Too few reported factors to score" : "Sector-relative · 0–100"}
          </span>
        </div>
      </div>
    </div>
  )
}
