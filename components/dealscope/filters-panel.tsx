"use client"

import type React from "react"
import { useId, useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/section"
import { Toggle } from "@/components/ui/toggle"
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
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Screening Controls"
      title="Quantitative Filters"
      closeLabel="Close filters panel"
      footer={
        <>
          <p className="flex flex-col font-mono" aria-live="polite">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active Filters</span>
            <span className="text-sm font-bold text-accent">{activeCount} Selected</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onFiltersChange({ ...DEFAULT_BUCKET_FILTERS })}>
              Reset
            </Button>
            <Button variant="primary" onClick={onApply ?? onClose}>
              {matchCount != null ? `View ${matchCount.toLocaleString("en-IN")} Matches` : "Apply Filters"}
            </Button>
          </div>
        </>
      }
    >
      <p className="font-mono text-xs leading-relaxed text-muted-foreground">
        Filter the screened universe by financial metrics: size, valuation, quality, growth, and leverage. Pills accept
        several bands at once; segmented controls pick one. Fields left untouched do not filter.
      </p>

      {/* Grouped bucket controls */}
      <div className="mt-10 flex flex-col gap-10">
        {GROUPS.map((group) => (
          <div key={group.index}>
            <Eyebrow index={group.index} label={group.label} />
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
          <Eyebrow index="04" label="Industry Groups" />
          <div className="mt-5">
            <IndustryFilterControl
              industryGroups={industryGroups}
              selected={filters.industry}
              onChange={(next) => onFiltersChange({ ...filters, industry: next })}
            />
          </div>
        </div>
      </div>
    </Dialog>
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
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <span id={labelId} className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">{def.label}</span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
      {def.buckets.map((b) => (
        <Toggle key={b.key} pressed={selected.includes(b.key)} onClick={() => toggle(b.key)}>
          <span>{b.name}</span>{" "}
          <span className="normal-case tracking-normal">{b.range}</span>
        </Toggle>
      ))}
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
  // -1 until the arrow keys are used or a query is typed.
  const [highlighted, setHighlighted] = useState(-1)
  const listId = useId()
  const totalCount = useMemo(() => industryGroups.reduce((n, g) => n + g.industries.length, 0), [industryGroups])

  const filteredGroups = useMemo(() => filterIndustryGroups(industryGroups, query), [industryGroups, query])

  const flatList = useMemo(() => filteredGroups.flatMap((g) => g.industries), [filteredGroups])

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name])
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setHighlighted(value.trim() ? 0 : -1)
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
              className="inline-flex items-center gap-2 border border-accent bg-accent/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-accent hover:bg-accent/20 transition-colors duration-200 min-h-11 min-w-11"
            >
              <span>{name}</span>
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="sr-only">(remove filter)</span>
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
          name="industry-filter"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={flatList.length > 0}
          aria-controls={flatList.length > 0 ? listId : undefined}
          aria-activedescendant={highlighted >= 0 && highlighted < flatList.length ? `${listId}-${highlighted}` : undefined}
          className="w-full bg-transparent px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {flatList.length === 0 ? (
        <p role="status" className="mt-2 border border-border px-3 py-4 text-center font-mono text-xs text-muted-foreground">
          No industries match &quot;{query}&quot;
        </p>
      ) : (
        <div
          id={listId}
          role="listbox"
          aria-label="Industries"
          aria-multiselectable="true"
          tabIndex={-1}
          className="mt-2 max-h-64 overflow-y-auto border border-border"
        >
          {groupStarts.map(({ group, start }) => (
            <div key={group.sector} role="group" aria-label={group.sector}>
              <div aria-hidden="true" className="sticky top-0 bg-background px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {group.sector}
              </div>
              {group.industries.map((ind, i) => {
                const index = start + i
                const active = selected.includes(ind.name)
                return (
                  // Focus stays in the combobox; arrows and Enter operate the options.
                  <div
                    key={ind.name}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(ind.name)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 font-mono text-xs",
                      index === highlighted && "outline-2 -outline-offset-2 outline-accent",
                      active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {active && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                      {ind.name}
                    </span>
                    <span>{ind.count}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Single-select, fill-active control. Two columns on phones so the real units
// fit at 12px. Clicking the active segment clears the field back to null.
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
    <div className="grid grid-cols-2 gap-2">
      {def.buckets.map((b) => {
        const active = selected === b.key
        return (
          <button
            key={b.key}
            type="button"
            onClick={() => onChange(active ? null : b.key)}
            aria-pressed={active}
            className={cn(
              "flex min-h-11 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 border px-1 py-2 text-center font-mono text-xs transition-colors duration-200",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-control text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-1 uppercase tracking-wider">
              {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
              {b.name}
            </span>{" "}
            <span>{b.range}</span>
          </button>
        )
      })}
    </div>
  )
}
