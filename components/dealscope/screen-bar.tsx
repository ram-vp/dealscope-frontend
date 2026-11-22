"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { type FilterChip, type ScreenFilters, screenChips, countActiveConstraints } from "@/lib/screener"
import { cn } from "@/lib/utils"

interface ScreenBarProps {
  query: string
  onQueryChange: (q: string) => void
  onSubmit?: () => void
  filters: ScreenFilters
  onRemoveChip: (chip: FilterChip) => void
  onClearAll: () => void
  /** null while the universe is still downloading. */
  matchCount: number | null
  totalCount: number
  recognised: boolean
  placeholder?: string
  autoFocus?: boolean
  size?: "lg" | "sm"
  trailing?: React.ReactNode
  /** Landing page: do not print the raw universe size under an empty search. */
  hideIdleCount?: boolean
}

export function ScreenBar({
  query,
  onQueryChange,
  onSubmit,
  filters,
  onRemoveChip,
  onClearAll,
  matchCount,
  totalCount,
  recognised,
  placeholder = "Search company or ticker",
  autoFocus = false,
  size = "lg",
  trailing,
  hideIdleCount = false,
}: ScreenBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const chips = screenChips(filters)
  const activeCount = countActiveConstraints(filters)
  const isFiltered = matchCount !== null && matchCount !== totalCount
  const hasQuery = query.trim().length > 0
  const showCount =
    !hideIdleCount || isFiltered || hasQuery || recognised || activeCount > 0 || chips.length > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      onSubmit?.()
    }
  }

  const rowH = size === "lg" ? "h-12 sm:h-13" : "h-11 sm:h-12"

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-stretch border bg-card/60 transition-colors duration-200",
          trailing ? "flex-col sm:flex-row" : "flex-row",
          recognised
            ? "border-accent/80 ring-1 ring-accent/40"
            : "border-control focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40",
        )}
      >
        <div
          className={cn(
            "relative min-w-0 flex items-center",
            rowH,
            trailing ? "w-full sm:flex-1 sm:min-w-0" : "flex-1",
          )}
        >
          <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none select-none">
            {recognised ? (
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-accent bg-accent/15 px-1.5 py-0.5 border border-accent/40">
                SCREEN
              </span>
            ) : (
              <Search aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <input
            ref={inputRef}
            data-screen-input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search company or ticker"
            enterKeyHint="search"
            name="screen"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus={autoFocus}
            className={cn(
              "box-border w-full h-full bg-transparent pr-12 font-mono text-base text-foreground placeholder:text-muted-foreground",
              // Room for the SCREEN tag, which is wider than the icon.
              recognised ? "pl-24" : "pl-11 sm:pl-12",
            )}
          />

          {query ? (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search input"
                className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-w-11"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>

        {trailing ? (
          <div
            className={cn(
              "flex shrink-0 items-stretch",
              rowH,
              "w-full sm:w-auto",
              "border-t sm:border-t-0 sm:border-l",
              recognised ? "border-accent/80" : "border-border/80",
            )}
          >
            {trailing}
          </div>
        ) : null}
      </div>

      {(showCount || chips.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {showCount && (
            <span role="status" className="font-mono text-xs">
              {matchCount === null ? (
                <span className="text-muted-foreground">Counting matches…</span>
              ) : (
                <>
              <span className={cn(isFiltered ? "text-accent font-semibold" : "text-foreground font-medium")}>
                {matchCount.toLocaleString("en-IN")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                {matchCount === 1 ? "company" : "companies"}
                {isFiltered && ` of ${totalCount.toLocaleString("en-IN")}`}
              </span>
                </>
              )}
            </span>
          )}

          {recognised && (
            <span className="font-mono text-xs uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 border border-accent/30 font-semibold">
              Screen Applied
            </span>
          )}

          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer min-h-11 inline-flex items-center min-w-11"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onRemoveChip(chip)}
              className="group inline-flex max-w-full items-center gap-2 border border-accent/60 bg-accent/10 px-3 py-1 font-mono text-xs text-accent hover:bg-accent/20 hover:border-accent transition-colors duration-200 cursor-pointer min-h-11 min-w-11"
              aria-label={`Remove filter: ${chip.label}`}
            >
              <span className="truncate">{chip.label}</span>
              <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {matchCount === 0 && activeCount > 0 && (
        <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
          Nothing matches every condition. Drop a chip above to widen the screen.
        </p>
      )}
    </div>
  )
}
