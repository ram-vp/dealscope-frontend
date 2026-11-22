"use client"

import { SlidersHorizontal } from "lucide-react"
import { Eyebrow } from "@/components/ui/section"
import { Toggle } from "@/components/ui/toggle"
import { ArrowRight } from "lucide-react"
import { BitmapChevron } from "@/components/bitmap-chevron"
import { SectorIndustryFilter } from "@/components/dealscope/sector-industry-filter"
import type { Sector, IndustryGroup, BucketFilters } from "@/lib/dealscope-data"
import { ScreenBar } from "@/components/dealscope/screen-bar"
import { ExampleScreens } from "@/components/dealscope/example-screens"
import type { ScreenFilters, FilterChip } from "@/lib/screener"
import type { ExampleScreen } from "@/lib/example-screens"

interface LandingViewProps {
  query: string
  onQueryChange: (q: string) => void
  /** Intent signal: start downloading the universe before it's asked for. */
  onWarmUp: () => void
  selectedSectors: string[]
  onToggleSector: (sector: string) => void
  onRun: () => void
  onOpenFilters: () => void
  activeFilterCount: number
  matchingCount: number | null
  totalCount: number
  screen: ScreenFilters
  onRemoveChip: (chip: FilterChip) => void
  onClearAll: () => void
  recognised: boolean
  screens: { screen: ExampleScreen; count: number }[]
  onApplyScreen: (screen: ExampleScreen) => void
  sectors: Sector[]
  dealCount: number
  industryGroups: IndustryGroup[]
  unclassifiedCount: number
  filters: BucketFilters
  onFiltersChange: (filters: BucketFilters) => void
}

export function LandingView({
  query,
  onQueryChange,
  onWarmUp,
  selectedSectors,
  onToggleSector,
  onRun,
  onOpenFilters,
  activeFilterCount,
  matchingCount,
  totalCount,
  screen,
  onRemoveChip,
  onClearAll,
  recognised,
  screens,
  onApplyScreen,
  sectors,
  dealCount,
  industryGroups,
  unclassifiedCount,
  filters,
  onFiltersChange,
}: LandingViewProps) {
  const operatingSectorCount = sectors.filter((s) => s.name.toLowerCase() !== "unclassified").length

  const toggleIndustry = (name: string) => {
    const next = filters.industry.includes(name)
      ? filters.industry.filter((i) => i !== name)
      : [...filters.industry, name]
    onFiltersChange({ ...filters, industry: next })
  }

  const hasActiveFilters =
    activeFilterCount > 0 ||
    selectedSectors.length > 0 ||
    filters.industry.length > 0 ||
    query.trim().length > 0 ||
    matchingCount !== totalCount

  return (
    <div onPointerDown={onWarmUp} onFocus={onWarmUp}>
      {/* ---------------------------------------------------------------- */}
      {/* HERO SECTION: Phone-First Responsive Command Module              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative flex flex-col justify-center items-center px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-b border-border/40 bg-background">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Category Badge */}
          <div
            className="inline-flex items-center gap-1.5 border border-accent/30 bg-accent/5 px-2.5 py-1 mb-3 font-mono text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] text-accent max-w-full"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>FREE LISTED-INDIA COMPS &amp; M&amp;A SCREENER</span>
          </div>

          {/* Wordmark */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl tracking-tight text-foreground select-none leading-none">
            DEALSCOPE
          </h1>

          {/* Pitch / Subtitle */}
          <p className="mt-2.5 sm:mt-3 font-sans text-sm sm:text-base md:text-lg text-foreground font-medium tracking-tight max-w-xl text-balance px-2">
            Every NSE-listed company, scored within its sector the way a deal team screens targets.
          </p>

          {/* Search Module (Constrained to max-w-xl to eliminate dead space) */}
          <div
            className="mt-6 w-full max-w-xl text-left"
          >
            <ScreenBar
              query={query}
              onQueryChange={onQueryChange}
              onSubmit={onRun}
              filters={screen}
              onRemoveChip={onRemoveChip}
              onClearAll={onClearAll}
              matchCount={matchingCount}
              totalCount={totalCount}
              recognised={recognised}
              placeholder="Search company or ticker"
              hideIdleCount={true}
              trailing={
                <button
                  type="button"
                  onClick={onRun}
                  className="group inline-flex h-full w-full sm:w-auto items-center justify-center gap-2 px-6 sm:px-7 font-mono text-xs uppercase tracking-widest leading-none bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-colors duration-200 cursor-pointer min-h-[44px] min-w-11"
                >
                  <span>Screen</span>
                  <BitmapChevron className="transition-transform duration-300 ease-in-out group-hover:rotate-45" />
                </button>
              }
            />
          </div>

          {/* Action Row: Primary Filter Button + Secondary Universe Trigger */}
          <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full max-w-xl">
            <button
              onClick={onOpenFilters}
              className="group inline-flex items-center justify-center gap-2.5 border border-control bg-card/60 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Quantitative Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-accent-foreground font-mono text-xs leading-none font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters ? (
              <button
                onClick={onRun}
                className="group inline-flex items-center justify-center gap-1.5 py-2 font-mono text-xs text-foreground hover:text-accent transition-colors duration-150 cursor-pointer min-h-11 min-w-11"
              >
                <span className="text-accent font-semibold">{matchingCount?.toLocaleString("en-IN") ?? "View"}</span>
                <span className="text-muted-foreground">matching targets</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onRun}
                className="group inline-flex items-center justify-center gap-1.5 py-2 font-mono text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-150 cursor-pointer min-h-11 min-w-11"
              >
                <span>View all listed companies</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Multi-Select Sector Pills (Option A: Left-Aligned Wrap in max-w-xl) */}
          <div className="mt-6 w-full max-w-xl pt-4 border-t border-border/40 text-left">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Filter by sector:
              </span>
              {selectedSectors.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="font-mono text-xs uppercase tracking-wider text-accent hover:underline cursor-pointer min-h-11 inline-flex items-center min-w-11"
                >
                  Clear ({selectedSectors.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-start items-center gap-1.5 sm:gap-2">
              {sectors.map((sector) => (
                <Toggle
                  key={sector.name}
                  pressed={selectedSectors.includes(sector.name)}
                  onClick={() => onToggleSector(sector.name)}
                  className="px-2.5 tracking-normal"
                >
                  <span className="min-w-0 break-words">{sector.name}</span>
                  <span className="tabular-nums">{sector.count}</span>
                </Toggle>
              ))}
            </div>
          </div>

          {/* Telemetry Ribbon */}
          <div className="mt-6 sm:mt-8 w-full max-w-xl border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:flex-wrap sm:gap-y-1 items-center justify-between gap-2 sm:gap-3 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="uppercase tracking-wider text-muted-foreground text-xs">Coverage:</span>
              <span className="text-foreground font-medium">{totalCount.toLocaleString("en-IN")} NSE companies</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="uppercase tracking-wider text-muted-foreground text-xs">Sectors:</span>
              <span className="text-foreground font-medium">{operatingSectorCount} + Unclassified</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="uppercase tracking-wider text-muted-foreground text-xs">Deals:</span>
              <span className="text-accent font-medium">{dealCount.toLocaleString("en-IN")} Precedent Deals</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CHAPTER 01: Why Sector-Relative                                  */}
      {/* ---------------------------------------------------------------- */}
      <section id="chapter-01" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-b border-border/40 bg-background scroll-mt-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow index="01" label="WHY SECTOR SCORES" />
            <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-balance text-foreground">
              SCORE IT AGAINST ITS OWN SECTOR
            </h2>
            <p className="mt-2 sm:mt-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Percentile scoring against direct operating peers
            </p>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 font-sans text-base md:text-lg leading-relaxed text-foreground">
            <p>
                DealScope is a free screener for NSE-listed Indian companies. You search a name or a thesis. You get a sector score, listed-peer multiples, and the deals in that sector. No login.
              </p>
            <p className="text-muted-foreground">
                A 15% margin is ordinary in software and excellent in a factory. A single India-wide cutoff cannot tell those apart.
              </p>
            <p className="text-muted-foreground">
                DealScope ranks each factor inside the sector: 85 on ROCE means 85th percentile among peers. The composite averages the factors.
              </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CHAPTER 02: Four Factors                                         */}
      {/* ---------------------------------------------------------------- */}
      <section id="chapter-02" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-b border-border/40 bg-background scroll-mt-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow index="02" label="HOW SCORING WORKS" />
            <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-balance text-foreground">
              FOUR FACTORS, THEN ONE SCORE
            </h2>
            <p className="mt-2 sm:mt-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Missing numbers are skipped, not zeroed
            </p>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground">
              Growth, EBITDA margin, ROCE, debt. Equal weights until you move the sliders. Missing factors are dropped. Banks skip debt.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Revenue growth", factor: "01", desc: "Sales growth versus sector peers." },
                { title: "EBITDA margin", factor: "02", desc: "EBITDA divided by sales, versus the sector." },
                { title: "ROCE", factor: "03", desc: "Operating return on capital employed." },
                { title: "Debt health", factor: "04", desc: "Net debt to EBITDA. Lower debt scores higher. Banks excluded." },
              ].map((f) => (
                <div key={f.title} className="border border-border/60 bg-card/40 p-4 flex flex-col gap-1.5 transition-colors hover:border-accent/50">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-accent font-semibold">{f.title}</span>
                    <span className="text-muted-foreground text-xs">FACTOR {f.factor}</span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CHAPTER 03: Screens                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="chapter-03" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-b border-border/40 bg-background scroll-mt-14">
        <div className="max-w-5xl mx-auto">
          <Eyebrow index="03" label="PRESET SCREENS" />
          <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground">
            READY-MADE SCREENS
          </h2>
          <p className="mt-2 sm:mt-3 max-w-2xl font-sans text-sm text-muted-foreground leading-relaxed">
            Click one. It runs on the live list.
          </p>

          <div className="mt-6 sm:mt-8">
            <ExampleScreens screens={screens} onApply={onApplyScreen} variant="cards" />
          </div>

          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/40 pt-6">
            <span className="font-mono text-xs text-muted-foreground">
              Click a screen, or type your own above.
            </span>
            <button
              onClick={onRun}
              className="inline-flex items-center justify-center gap-2 border border-control bg-card/80 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
            >
              <span>View All Listed Companies</span>
              <BitmapChevron className="transition-transform duration-300 group-hover:rotate-45" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CHAPTER 04: Taxonomy                                             */}
      {/* ---------------------------------------------------------------- */}
      <section id="chapter-04" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 border-b border-border/40 bg-background scroll-mt-14">
        <div className="max-w-5xl mx-auto">
          <Eyebrow index="04" label="TAXONOMY &amp; COVERAGE" />
          <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground">
            {operatingSectorCount} SECTORS. INDUSTRY GROUPS UNDER EACH.
          </h2>
          <p className="mt-2 sm:mt-3 max-w-2xl font-sans text-sm text-muted-foreground leading-relaxed">
            A port and a packaging mill are not peers. Every listed name sits in one sector and one industry group. Unclassified names stay listed and are not scored against a made-up sector.
          </p>

          <div className="mt-6 sm:mt-8 border border-border/60 bg-card/20 p-4 sm:p-6 md:p-8">
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
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CHAPTER 05: Deals                                                */}
      {/* ---------------------------------------------------------------- */}
      <section id="chapter-05" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 bg-background scroll-mt-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow index="05" label="PRECEDENT TRANSACTIONS" />
            <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-tight text-balance text-foreground">
              {dealCount.toLocaleString("en-IN")} INDIAN DEALS, KEPT SEPARATE FROM THE TAPE
            </h2>
            <p className="mt-2 sm:mt-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              <span className="whitespace-nowrap">Historical M&amp;A transaction benchmarks</span>{" "}
              <span className="whitespace-nowrap">(2006 to 2025)</span>
            </p>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 font-sans text-base md:text-lg leading-relaxed text-foreground">
            <p>
                Trading multiples are what the market pays today. The deal table is what buyers paid. Two tables. No blended fantasy multiple.
              </p>
            <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs text-muted-foreground border border-border/60 bg-card/30 p-3 sm:p-4">
              <div>
                <span className="text-foreground font-semibold">{operatingSectorCount}</span> sectors
              </div>
              <span className="text-muted-foreground">·</span>
              <div>
                <span className="text-foreground font-semibold">Listed</span> and landmark deals
              </div>
              <span className="text-muted-foreground">·</span>
              <div>
                <span className="text-accent font-semibold">0</span> imputed multiples
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
