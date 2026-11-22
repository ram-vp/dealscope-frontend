import { AppLink } from "@/components/dealscope/app-link"
import { SectionHeader } from "@/components/ui/section"
import { type Company, type Weights, computeScore } from "@/lib/dealscope-data"

export function SectorPeers({
  company,
  score,
  peers,
  weights,
  onSelectCompany,
}: {
  company: Company
  score: number | null
  peers: Company[]
  weights: Weights
  onSelectCompany?: (company: Company) => void
}) {
  if (peers.length === 0) return null

  return (
    <div className="mt-12 sm:mt-16 md:mt-24 pt-10 sm:pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="03"
        label="Sector Peers"
        subtitle={`Closest ${peers.length} peers in ${company.sector} by factor profile`}
      />

      {/* Closest Peers Table */}
      <div className="border border-border/40 bg-card/20 overflow-hidden">
        <div className="border-b border-border/40 bg-card/40 px-4 sm:px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span>Most Similar Factor Profiles</span>
          <span className="text-xs text-muted-foreground">Sector: {company.sector}</span>
        </div>
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-border/40 bg-card/30 px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="col-span-5">Company</span>
          <span className="col-span-2">Ticker</span>
          <span className="col-span-2 text-right">Composite Score</span>
          <span className="col-span-3 text-right">EBITDA Margin</span>
        </div>
        {/* Target company row */}
        <div className="border-b border-border/40 bg-accent/[0.04] border-l-2 border-l-accent px-4 sm:px-5 py-3 font-mono text-xs">
          {/* Desktop View */}
          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 flex items-center gap-2">
              <span className="text-foreground font-semibold truncate">{company.name}</span>
              <span className="text-xs uppercase tracking-wider border border-accent/40 text-accent px-1.5 py-0.5 bg-accent/5 font-medium">
                Target
              </span>
            </div>
            <span className="col-span-2 text-muted-foreground">{company.ticker}</span>
            <span className="col-span-2 text-right text-accent font-bold tabular-nums">
              {score != null ? `${score} / 100` : "N/A"}
            </span>
            <span className="col-span-3 text-right text-foreground font-medium tabular-nums">
              {company.metrics.ebitdaMargin}
            </span>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <span className="text-foreground font-bold break-words">{company.name}</span>
                <span className="text-xs uppercase tracking-wider border border-accent/40 text-accent px-1 py-0.5 bg-accent/10 font-bold shrink-0">
                  Target
                </span>
              </div>
              <span className="text-accent font-bold text-sm shrink-0 tabular-nums">
                {score != null ? `${score} / 100` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/20">
              <span className="font-mono">{company.ticker}</span>
              <span className="font-mono text-foreground font-medium">Margin: {company.metrics.ebitdaMargin}</span>
            </div>
          </div>
        </div>

        {/* Peer rows */}
        {peers.map((peer) => {
          const peerScore = computeScore(peer.factors, weights)
          return (
            <AppLink
              key={peer.ticker}
              href={`/?view=detail&ticker=${encodeURIComponent(peer.ticker)}`}
              onNavigate={() => onSelectCompany?.(peer)}
              className="w-full text-left border-b last:border-b-0 border-border/25 px-4 sm:px-5 py-3 font-mono text-xs hover:bg-accent/5 transition-colors cursor-pointer block group min-h-11 min-w-11"
            >
              {/* Desktop View */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                <span className="col-span-5 text-foreground truncate group-hover:text-accent transition-colors">{peer.name}</span>
                <span className="col-span-2 text-muted-foreground">{peer.ticker}</span>
                <span className="col-span-2 text-right text-muted-foreground tabular-nums">
                  {peerScore != null ? `${peerScore} / 100` : "N/A"}
                </span>
                <span className="col-span-3 text-right text-muted-foreground tabular-nums">
                  {peer.metrics.ebitdaMargin}
                </span>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-foreground font-medium break-words flex-1 min-w-0 group-hover:text-accent transition-colors">{peer.name}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums font-semibold">
                    {peerScore != null ? `${peerScore} / 100` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/15">
                  <span className="font-mono">{peer.ticker}</span>
                  <span className="font-mono">Margin: {peer.metrics.ebitdaMargin}</span>
                </div>
              </div>
            </AppLink>
          )
        })}
      </div>
    </div>
  )
}
