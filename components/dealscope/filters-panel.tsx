"use client"

import type React from "react"
import { useId, useMemo, useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import {
  type BucketFilters,
  type BucketFieldDef,
  type BucketFieldKey,
  type IndustryGroup,
  BUCKET_FIELDS,
  DEFAULT_BUCKET_FILTERS,
  countActiveBucketFilters,
  filterIndustryGroups,
} from "@/lib/dealscope-data"
import { cn } from "@/lib/utils"

interface FiltersPanelProps {
  open: boolean
  filters: BucketFilters
  onFiltersChange: (filters: BucketFilters) => void
  onClose: () => void
  onApply?: () => void
  matchCount?: number | null
  industryGroups: IndustryGroup[]
}

const FIELD = Object.fromEntries(BUCKET_FIELDS.map((f) => [f.key, f])) as Record<
  BucketFieldKey,
  BucketFieldDef
>

const GROUPS: { index: string; label: string; fields: BucketFieldKey[] }[] = [
  { index: "01", label: "Size & Valuation", fields: ["marketCap", "peRatio"] },
  { index: "02", label: "Quality & Growth", fields: ["revenueGrowth", "ebitdaMargin", "roce", "roe"] },
  { index: "03", label: "Risk", fields: ["debtLevel", "promoterPledge"] },
]

export function FiltersPanel({
  open,
  filters,
  onFiltersChange,
  onClose,
  onApply,
  matchCount,
  industryGroups,
}: FiltersPanelProps) {
  const activeCount = countActiveBucketFilters(filters)

  return (
    <Dialog open={open} onClose={onClose} label="Screening filters">
            {/* 1. Sticky Header */}
            <div className="p-6 sm:p-8 border-b border-border/80 bg-background flex items-start justify-between shrink-0">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
                  Screening Controls
                </span>
                <h2 className="mt-2 font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-tight text-foreground">
                  QUANTITATIVE FILTERS
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Esc: close filters panel"
                className="border border-border/80 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-accent hover:text-accent transition-all duration-200 cursor-pointer"
              >
                ESC ✕
              </button>
            </div>

            {/* 2. Isolated Smooth Scrollable Body */}
            <div
              className="flex-1 overflow-y-auto p-6 sm:p-8 overscroll-contain space-y-10"
              data-lenis-prevent
            >
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                Filter the screened universe by financial metrics: size, valuation, quality, growth, and leverage.
                Pills accept several bands at once; segmented controls pick one. Fields left untouched do not filter.
              </p>

              {/* Grouped bucket controls */}
              <div className="flex flex-col gap-10">
                {GROUPS.map((group) => (
                  <div key={group.index}>
                    <SectionLabel index={group.index} label={group.label} />
                    <div className="mt-5 flex flex-col gap-7">
                      {group.fields.map((key) => (
                        <FieldControl
                          key={key}
                          def={FIELD[key]}
                          selection={filters[key]}
                          onChange={(next) => onFiltersChange({ ...filters, [key]: next } as BucketFilters)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Industry */}
                <div>
                  <SectionLabel index="04" label="Industry Groups" />
                  <div className="mt-5">
                    <IndustryFilterControl
                      industryGroups={industryGroups}
                      selected={filters.industry}
                      onChange={(next) => onFiltersChange({ ...filters, industry: next })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Sticky Bottom Action Footer (Always Visible!) */}
            <div className="p-4 sm:p-6 border-t border-border/80 bg-card/95 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 shadow-lg">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Active Filters
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  {activeCount} Selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...DEFAULT_BUCKET_FILTERS })}
                  className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onApply) onApply()
                    else onClose()
                  }}
                  className="border border-accent bg-accent text-accent-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-accent/90 transition-all cursor-pointer shadow-sm"
                >
                  {matchCount != null ? `View ${matchCount.toLocaleString("en-IN")} Matches ➔` : "Apply Filters"}
                </button>
              </div>
            </div>
    </Dialog>
  )
}

// Reuses the tear sheet's SectionLabel pattern for consistency.
function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
      {index} / {label}
    </span>
  )
}

function FieldControl({
  def,
  selection,
  onChange,
}: {
  def: BucketFieldDef
  selection: string[] | string | null
  onChange: (next: string[] | string | null) => void
}) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between mb-3">
        <label id={labelId} className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">{def.label}</label>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
          {def.select === "multi" ? "Select any" : "Select one"}
        </span>
      </div>
      {def.select === "multi" ? (
        <PillGroup def={def} selected={Array.isArray(selection) ? selection : []} onChange={onChange} />
      ) : (
        <SegmentedControl
          def={def}
          selected={typeof selection === "string" ? selection : null}
          onChange={onChange}
        />
      )}
    </div>
  )
}

// Multi-select, outline-active. Used for Market Cap and Promoter Pledge.
function PillGroup({
  def,
  selected,
  onChange,
}: {
  def: BucketFieldDef
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {def.buckets.map((b) => {
        const active = selected.includes(b.key)
        return (
          <button
            key={b.key}
            onClick={() => toggle(b.key)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-baseline gap-2 border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200",
              active
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:border-accent hover:text-accent",
            )}
          >
            <span>{b.name}</span>
            <span
              className={cn(
                "text-[11px] normal-case tracking-normal",
                active ? "text-accent/70" : "text-muted-foreground/80",
              )}
            >
              {b.range}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Typeahead + multi-select over the ~123 raw industry labels, grouped under
// their parent sector and sorted by company count descending within each
// group -- standard practice for a 100+-item taxonomy: it cuts scan time and
// helps a user who doesn't know the exact industry name find it via its
// sector, versus one long flat/alphabetical list. Reuses normalizeForSearch
// from dealscope-data.ts (the same normalization the main company search
// applies -- case-fold, "&"/"and" unified, punctuation stripped) so an
// industry query behaves consistently with the rest of the site rather than
// a second, differently-behaved matcher. No debounce: unlike the ~2,381-
// company main search, this filters ~124 short strings already held in
// memory -- synchronous is instant either way, so a debounce would only add
// latency with no upside.
function IndustryFilterControl({
  industryGroups,
  selected,
  onChange,
}: {
  industryGroups: IndustryGroup[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [query, setQuery] = useState("")
  const [highlighted, setHighlighted] = useState(0)
  const listId = useId()
  const totalCount = useMemo(() => industryGroups.reduce((n, g) => n + g.industries.length, 0), [industryGroups])

  const filteredGroups = useMemo(() => filterIndustryGroups(industryGroups, query), [industryGroups, query])

  const flatList = useMemo(() => filteredGroups.flatMap((g) => g.industries), [filteredGroups])

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name])
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setHighlighted(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatList.length === 0) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.max(0, Math.min(flatList.length - 1, highlighted + (e.key === "ArrowDown" ? 1 : -1)))
      setHighlighted(next)
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" })
    } else if (e.key === "Enter") {
      e.preventDefault()
      const pick = flatList[highlighted]
      if (pick) toggle(pick.name)
    }
  }

  // Each group's offset into flatList, for aria-activedescendant.
  const groupStarts = filteredGroups.map((group, g) => ({
    group,
    start: filteredGroups.slice(0, g).reduce((n, earlier) => n + earlier.industries.length, 0),
  }))

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((name) => (
            <button
              key={name}
              onClick={() => toggle(name)}
              className="inline-flex items-center gap-2 border border-accent bg-accent/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-accent hover:bg-accent/20 transition-colors duration-200"
            >
              <span>{name}</span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remove {name} filter</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative border border-border focus-within:border-accent transition-colors duration-200">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${totalCount} industries…`}
          aria-label="Search industries"
          role="combobox"
          name="industry-filter"
          maxLength={100}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={flatList.length > 0}
          aria-controls={listId}
          aria-activedescendant={flatList[highlighted] ? `${listId}-${highlighted}` : undefined}
          className="w-full bg-transparent px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div
        id={listId}
        role={flatList.length > 0 ? "listbox" : "status"}
        aria-label={flatList.length > 0 ? "Industries" : undefined}
        aria-multiselectable={flatList.length > 0 || undefined}
        tabIndex={-1}
        className="mt-2 max-h-56 overflow-y-auto border border-border/50">
        {flatList.length === 0 ? (
          <p className="px-3 py-4 font-mono text-xs text-muted-foreground/80 text-center">
            No industries match &quot;{query}&quot;
          </p>
        ) : (
          groupStarts.map(({ group, start }) => (
            <div key={group.sector} role="group" aria-label={group.sector} className="border-b border-border/30 last:border-b-0">
              <div aria-hidden="true" className="sticky top-0 bg-background px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                {group.sector}
              </div>
              <div className="divide-y divide-border/20">
                {group.industries.map((ind, i) => {
                  const rowIndex = start + i
                  const isHighlighted = rowIndex === highlighted
                  const active = selected.includes(ind.name)
                  return (
                    <button
                      key={ind.name}
                      onClick={() => toggle(ind.name)}
                      onMouseEnter={() => setHighlighted(rowIndex)}
                      id={`${listId}-${rowIndex}`}
                      role="option"
                      // Focus stays in the combobox; arrows and Enter operate the options.
                      tabIndex={-1}
                      aria-selected={active}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 font-mono text-[11px] text-left transition-colors duration-200",
                        active
                          ? "bg-accent/10 text-accent"
                          : isHighlighted
                            ? "bg-foreground/5 text-foreground"
                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{ind.name}</span>
                      <span
                        className={cn("text-[11px] shrink-0", active ? "text-accent/70" : "text-muted-foreground/80")}
                      >
                        {ind.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Single-select, fill-active connected control. Segments share borders and
// stack name over range so the real units fit without horizontal overflow on
// narrow screens. Clicking the active segment clears the field back to null.
function SegmentedControl({
  def,
  selected,
  onChange,
}: {
  def: BucketFieldDef
  selected: string | null
  onChange: (next: string | null) => void
}) {
  return (
    <div className="flex border border-border">
      {def.buckets.map((b, i) => {
        const active = selected === b.key
        return (
          <button
            key={b.key}
            onClick={() => onChange(active ? null : b.key)}
            aria-pressed={active}
            className={cn(
              "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-center transition-colors duration-200",
              i < def.buckets.length - 1 ? "border-r border-border" : "",
              active ? "bg-accent" : "hover:bg-foreground/5",
            )}
          >
            <span
              className={cn(
                "font-mono text-[11px] uppercase tracking-wider leading-tight",
                active ? "text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {b.name}
            </span>
            <span
              className={cn(
                "font-mono text-[8px] tracking-normal leading-tight",
                active ? "text-accent-foreground/80" : "text-muted-foreground/80",
              )}
            >
              {b.range}
            </span>
          </button>
        )
      })}
    </div>
  )
}
