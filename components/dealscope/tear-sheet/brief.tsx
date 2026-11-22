import { LoadError } from "@/components/dealscope/view-status"
import { SectionHeader } from "@/components/ui/section"
import type { CompanyNarrative, DetailsStatus } from "@/lib/company-details"
import { type Company, type Weights } from "@/lib/dealscope-data"
import { scoreRationale } from "@/lib/score-rationale"

export function CompanyBrief({
  company,
  weights,
  score,
  narrative,
  detailsStatus,
  retry,
}: {
  company: Company
  weights: Weights
  score: number | null
  narrative: CompanyNarrative
  detailsStatus: DetailsStatus
  retry: () => void
}) {
  const hasAbout = Boolean(narrative.about)

  return (
    <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="04"
        label="Executive Brief & Thesis"
        subtitle="Company profile & score driver analysis"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Company Profile */}
        <div className="border border-border/40 bg-card/20 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent font-medium">
                04.A / Business Model
              </h3>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {company.industry || company.sector}
              </span>
            </div>
            {hasAbout ? (
              <p
                className="font-sans text-base leading-relaxed text-foreground text-pretty"
              >
                {narrative.about}
              </p>
            ) : detailsStatus === "error" ? (
              <LoadError message="This section could not be loaded." onRetry={retry} />
            ) : detailsStatus === "loading" ? (
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground py-4">
                Loading profile...
              </p>
            ) : (
              <p className="font-mono text-xs leading-relaxed text-muted-foreground py-4">
                Company profile is currently being compiled. Financial metrics and factor rankings above are live.
              </p>
            )}
          </div>
          <div className="mt-6 pt-3 border-t border-border/20 flex justify-between font-mono text-xs text-muted-foreground uppercase tracking-wider">
            <span>NSE: {company.ticker}</span>
            <span>AI-written summary, may be dated</span>
          </div>
        </div>

        {/* Right: Score Thesis */}
        <div className="border border-border/40 bg-card/20 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent font-medium">
                04.B / Score Rationale
              </h3>
              <span className="font-mono text-xs uppercase tracking-wider text-accent font-medium">
                Score: {score != null ? `${score}/100` : "N/A"}
              </span>
            </div>
            <p className="font-sans text-base leading-relaxed text-foreground text-pretty" data-testid="score-rationale">
              {scoreRationale(company, weights)}
            </p>
          </div>
          <div className="mt-6 pt-3 border-t border-border/20 flex justify-between font-mono text-xs text-muted-foreground uppercase tracking-wider">
            <span>Calculated from the figures above</span>
            <span>Non-advisory</span>
          </div>
        </div>
      </div>
    </div>
  )
}
