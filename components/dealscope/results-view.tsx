"use client"

import type React from "react"
import { ArrowLeft } from "lucide-react"
import { AppLink } from "@/components/dealscope/app-link"
import { Chip } from "@/components/ui/chip"
import { BitmapChevron } from "@/components/bitmap-chevron"
import { ScoreRing } from "@/components/dealscope/score-ring"
import { SectorIndustryFilter } from "@/components/dealscope/sector-industry-filter"
import { ScreenBar } from "@/components/dealscope/screen-bar"
import { ExampleScreens } from "@/components/dealscope/example-screens"
import { OwnershipBadge } from "@/components/dealscope/ownership-badges"
import {
  type ScreenFilters,
  type FilterChip,
  passReasons,
} from "@/lib/screener"
import { type ExampleScreen } from "@/lib/example-screens"
import { cn } from "@/lib/utils"
import {
  type Company,
  type Sector,
  type Weights,
  type BucketFilters,
  type IndustryGroup,
  computeScore,
  countActiveBucketFilters,
} from "@/lib/dealscope-data"
import { buildCompsCsv, compsCsvFilename, downloadCompsCsv } from "@/lib/export-comps-csv"

interface ResultsViewProps {
  results: Company[]
  query: string
  onQueryChange: (q: string) => void
  /** Commit the typed query (Enter). Without this the refine box updated the
   *  list as you typed but pressing Enter did nothing and the URL never
   *  captured the query, so refreshing or sharing lost it. */
  onSubmitQuery: () => void
  selectedSectors: string[]
  onToggleSector: (sector: string) => void
  weights: Weights
  filters: BucketFilters
  onFiltersChange: (filters: BucketFilters) => void
  industryGroups: IndustryGroup[]
  unclassifiedCount: number
  screen: ScreenFilters
  matchCount: number | null
  totalCount: number
  onRemoveChip: (chip: FilterChip) => void
  onClearAll: () => void
  recognised: boolean
  screens: { screen: ExampleScreen; count: number }[]
  onApplyScreen: (screen: ExampleScreen) => void
  onSelectCompany: (company: Company) => void
  onOpenWeights: () => void
  onOpenFilters: () => void
  onBack: () => void
  showAll: boolean
  onShowAll: () => void
  sectors: Sector[]
}

const RENDER_CAP = 60

export function ResultsView({
  results,
  query,
  onQueryChange,
  onSubmitQuery,
  selectedSectors,
  onToggleSector,
  weights,
  filters,
  onFiltersChange,
  industryGroups,
  unclassifiedCount,
  screen,
  matchCount,
  totalCount,
  onRemoveChip,
  onClearAll,
  recognised,
  screens,
  onApplyScreen,
  onSelectCompany,
  onOpenWeights,
  onOpenFilters,
  onBack,
  showAll,
  onShowAll,
  sectors,
}: ResultsViewProps) {
  const visibleResults = showAll ? results : results.slice(0, RENDER_CAP)
  const activeFilters = countActiveBucketFilters(filters)

  const toggleIndustry = (name: string) => {
    const next = filters.industry.includes(name)
      ? filters.industry.filter((i) => i !== name)
      : [...filters.industry, name]
    onFiltersChange({ ...filters, industry: next })
  }

  const handleExportCsv = () => {
    if (results.length === 0) return
    const csv = buildCompsCsv(results, weights)
    const filename = compsCsvFilename({
      resultCount: results.length,
      universeCount: totalCount,
      query,
      sectors: selectedSectors,
    })
    downloadCompsCsv(filename, csv)
  }

  return (
    <section className="relative min-h-screen px-4 sm:px-6 md:px-12 py-10 md:py-16 max-w-7xl mx-auto">
      {/* Header Band */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 mb-6 sm:mb-8 border-b border-border/40">
        <div className="flex-1 min-w-0">
          {/* Eyebrow label doubles as the back control */}
          <button
            onClick={onBack}
            className="font-mono text-xs uppercase tracking-[0.25em] text-accent hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5 cursor-pointer min-h-11 min-w-11"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Overview
          </button>
          <h1 className="mt-2.5 font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-balance text-foreground leading-none">
            {results.length.toLocaleString("en-IN")}{" "}
            {results.length === 1 ? "Company Matches" : "Companies Match"}
          </h1>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">
            {screen.text ? "Ranked by name match, then composite score" : "Ranked by sector composite score"} · Missing metrics excluded from weighting · Unclassified tickers not scored
          </p>
        </div>

        {/* Action Row: Desktop 1-row aligned; Mobile 3 equal buttons */}
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 max-[419px]:[&>:last-child]:col-span-2 sm:flex sm:flex-row items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenFilters}
            className="group inline-flex items-center justify-center gap-2 border border-control bg-card/50 px-3 sm:px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
          >
            <span>Filters</span>
            {activeFilters > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-accent-foreground font-mono text-xs leading-none font-bold">
                {activeFilters}
              </span>
            ) : (
              <BitmapChevron className="transition-transform duration-[300ms] ease-in-out group-hover:rotate-45" />
            )}
          </button>

          <button
            onClick={onOpenWeights}
            className="group inline-flex items-center justify-center gap-2 border border-control bg-card/50 px-3 sm:px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
          >
            <span>Weights</span>
            <BitmapChevron className="transition-transform duration-[300ms] ease-in-out group-hover:rotate-45" />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={results.length === 0}
            title="Export current screened companies as CSV"
            className="group inline-flex items-center justify-center gap-2 border border-control bg-card/50 px-3 sm:px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer min-h-11 min-w-11"
          >
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Screening bar: natural-language query, active-filter chips, live count */}
      <div className="mb-5 sm:mb-6 w-full max-w-4xl">
        <ScreenBar
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmitQuery}
          filters={screen}
          onRemoveChip={onRemoveChip}
          onClearAll={onClearAll}
          matchCount={matchCount}
          totalCount={totalCount}
          recognised={recognised}
          size="sm"
          placeholder="Name, ticker or screen"
        />
      </div>

      {/* Example screens, compact ribbon on this view */}
      <div className="mb-4 sm:mb-6">
        <span className="hidden sm:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Preset Screens
        </span>
        <ExampleScreens screens={screens} onApply={onApplyScreen} variant="pills" />
      </div>

      {/* Sector + industry filter */}
      <div className="mb-6 sm:mb-8">
        <SectorIndustryFilter
          sectors={sectors}
          selectedSectors={selectedSectors}
          onToggleSector={onToggleSector}
          industryGroups={industryGroups}
          unclassifiedCount={unclassifiedCount}
          selectedIndustries={filters.industry}
          onToggleIndustry={toggleIndustry}
          onClearIndustries={() => onFiltersChange({ ...filters, industry: [] })}
        />
      </div>

      {/* Results list */}
      {results.length === 0 ? (
        <div className="border border-border/40 p-12 sm:p-16 text-center bg-card/20">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            No companies match all active filters
            {screen.text && ` and "${screen.text}"`}
          </p>
          <p className="mt-3 mx-auto max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
            Conditions combine with AND, so each one narrows the set further. Remove a chip above to
            widen the screen, or clear all filters to start again.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-2 border border-accent/60 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-accent hover:bg-accent/10 transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
            >
              Clear all filters
            </button>
            {activeFilters > 0 && (
              <button
                onClick={onOpenFilters}
                className="inline-flex items-center gap-2 border border-control px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
              >
                Adjust filters ({activeFilters})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {visibleResults.map((company, index) => (
            <ResultRow
              key={company.ticker}
              company={company}
              index={index}
              weights={weights}
              reasons={passReasons(company, screen)}
              onSelect={() => onSelectCompany(company)}
            />
          ))}
        </div>
      )}

      {!showAll && results.length > RENDER_CAP && (
        <div className="mt-8 text-center sm:text-left">
          <button
            onClick={onShowAll}
            className="border border-control bg-card/40 px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer min-h-11 inline-flex items-center min-w-11"
          >
            Show all {results.length} results
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 sm:mt-16 flex items-center justify-end">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {showAll || results.length <= RENDER_CAP ? `Showing all ${results.length}` : `Showing top ${Math.min(RENDER_CAP, results.length)} of ${results.length}`}
        </span>
      </div>
    </section>
  )
}

function ResultRow({
  company,
  index,
  weights,
  reasons,
  onSelect,
}: {
  company: Company
  index: number
  weights: Weights
  reasons: ReturnType<typeof passReasons>
  onSelect: () => void
}) {
  const score = computeScore(company.factors, weights)

  // The heading holds the link and the link's ::after covers the row, so the
  // whole row is one target without nesting headings inside a button.
  return (
    <article className="result-row group relative flex items-start gap-3.5 border-t border-border px-2 py-4 transition-colors duration-200 last:border-b hover:bg-accent/5 focus-within:bg-accent/5 sm:items-center sm:gap-6 sm:px-4 sm:py-5">
      {/* Index */}
      <span className="hidden w-7 shrink-0 font-mono text-xs tabular-nums text-muted-foreground md:block">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Score ring */}
      <ScoreRing score={score} size={46} strokeWidth={2.5} className="shrink-0" />

      {/* Name + sector + metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="min-w-0 break-words font-display text-xl tracking-tight text-foreground sm:text-2xl md:text-3xl">
            <AppLink
              href={`/?view=detail&ticker=${encodeURIComponent(company.ticker)}`}
              onNavigate={onSelect}
              className="inline-flex min-h-11 min-w-11 items-center transition-colors duration-200 after:absolute after:inset-0 group-hover:text-accent"
            >
              {company.name}
            </AppLink>
          </h2>
          <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground">{company.ticker}</span>
          <OwnershipBadge holding={company.raw.promoterHolding} pledge={company.raw.promoterPledge} className="shrink-0" />
        </div>

        <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {company.sector}
          {company.industry && ` · ${company.industry}`}
        </p>

        {/* Why this company passed */}
        {reasons.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {reasons.map((r) => (
              <li key={r.label}>
                <Chip tone={r.tone === "good" ? "accent" : "neutral"}>{r.label}</Chip>
              </li>
            ))}
          </ul>
        )}

        {/* Mobile / tablet metrics 2x2 */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2 sm:grid-cols-4 lg:hidden">
          <Metric label="Revenue" value={company.metrics.revenue} />
          <Metric label="Margin" value={company.metrics.ebitdaMargin} />
          <Metric label="ROCE" value={company.metrics.roce} />
          <Metric label="Debt" value={company.metrics.totalDebt} />
        </div>
      </div>

      {/* Desktop 4-col Metrics */}
      <div className="hidden shrink-0 grid-cols-4 gap-6 text-right lg:grid">
        <Metric label="Revenue" value={company.metrics.revenue} align="right" />
        <Metric label="Margin" value={company.metrics.ebitdaMargin} align="right" />
        <Metric label="ROCE" value={company.metrics.roce} align="right" />
        <Metric label="Debt" value={company.metrics.totalDebt} align="right" />
      </div>

      {/* Chevron */}
      <BitmapChevron className="shrink-0 self-center text-muted-foreground transition-transform duration-300 group-hover:rotate-45 group-hover:text-accent" />
    </article>
  )
}

function Metric({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" ? "text-right w-20 xl:w-24" : "text-left")}>
      <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="block mt-0.5 font-mono text-xs text-foreground font-medium tabular-nums">{value}</span>
    </div>
  )
}
