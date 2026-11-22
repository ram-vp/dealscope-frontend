import { SectionHeader } from "@/components/ui/section"
import { type Company } from "@/lib/dealscope-data"
import { valuationNotes } from "@/lib/display"

export function ValuationRange({
  company,
}: {
  company: Company
}) {
  const notes = valuationNotes(company)

  return (
    <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-border/30">
      <SectionHeader
        index="05"
        label="Indicative Valuation Range"
        subtitle={`Derived from ${company.sector} listed peer multiples (P25 to P75)`}
      />
      <p className="font-mono text-xs leading-relaxed text-muted-foreground max-w-3xl mb-6">
        Two independent estimates based on listed-peer trading multiples in {company.sector} applied to this company&apos;s own earnings. Both are shown as implied equity value.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EV / EBITDA Card */}
        <div className="border border-border/40 bg-card/30 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-border/30 pb-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                EV / EBITDA Implied
              </h3>
              <span className="font-mono text-xs uppercase tracking-wider text-accent border border-accent/40 bg-accent/5 px-2 py-0.5 font-medium">
                Equity Value
              </span>
            </div>
            <div className="py-5">
              <p className="font-display text-4xl sm:text-5xl tracking-tight text-accent">
                {company.valuation.evEbitda}
              </p>
            </div>
          </div>
          <p className="pt-3 border-t border-border/20 font-mono text-xs text-muted-foreground">
            {notes.evEbitda ??
              "25th to 75th percentile sector EV/EBITDA applied to TTM EBITDA, less total debt."}
          </p>
        </div>

        {/* P / E Card */}
        <div className="border border-border/40 bg-card/30 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-border/30 pb-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                P / E Implied
              </h3>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5">
                Equity Value
              </span>
            </div>
            <div className="py-5">
              <p className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
                {company.valuation.peImplied}
              </p>
            </div>
          </div>
          <p className="pt-3 border-t border-border/20 font-mono text-xs text-muted-foreground">
            {notes.pe ??
              "Derived from 25th to 75th percentile sector P/E multiples applied to net profit. Excludes debt adjustments."}
          </p>
        </div>
      </div>
    </div>
  )
}
