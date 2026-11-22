"use client"

import { Suspense, useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { LandingView } from "@/components/dealscope/landing-view"
import { ResultsView } from "@/components/dealscope/results-view"
import { TearSheetView } from "@/components/dealscope/tear-sheet-view"
import { WeightsPanel } from "@/components/dealscope/weights-panel"
import { FiltersPanel } from "@/components/dealscope/filters-panel"
import { LoadError, ViewSkeleton } from "@/components/dealscope/view-status"
import {
  type Company,
  type Weights,
  type BucketFilters,
  DEFAULT_WEIGHTS,
  countActiveBucketFilters,
} from "@/lib/dealscope-data"
import {
  type ScreenFilters,
  type FilterChip,
  makeScreen,
  isScreenEmpty,
  runScreen,
  removeChip as removeChipFrom,
} from "@/lib/screener"
import { parseQuery, screenAfterClearedSearch, screenFromTypedQuery } from "@/lib/query-parser"
import { encodeUrlState, decodeUrlState } from "@/lib/url-state"
import type { ExampleScreen } from "@/lib/example-screens"
import { SITE } from "@/lib/site"
import type { UniverseSummary } from "@/lib/universe-summary"
import { loadUniverse, useUniverse } from "@/lib/use-universe"

type View = "landing" | "results" | "detail"

const NO_COMPANIES: Company[] = []

/** Reports URL changes made by next/link. On its own, inside Suspense, so that
 *  useSearchParams() bails only this null component out of prerendering and
 *  not the whole homepage. */
function RouterUrlListener({ onChange }: { onChange: () => void }) {
  const search = useSearchParams().toString()
  useEffect(() => {
    onChange()
  }, [search, onChange])
  return null
}

export function DealScopeApp({ summary }: { summary: UniverseSummary }) {
  // ---------------------------------------------------------------------------
  // State & URL Synchronization Architecture:
  // - The server always renders the landing view. A layout effect applies the
  //   URL before the first client paint; lib/boot-script.ts hides the landing
  //   markup until then for deep links.
  // - Every change we make goes through writeUrl(): write history, then derive
  //   state from the URL synchronously.
  // - Same-view screen edits (sector/industry/buckets) use replaceState; real
  //   view transitions (landing <-> results <-> detail) use pushState.
  // - Back/Forward arrives as popstate, next/link as RouterUrlListener. The
  //   latter only acts on a URL we haven't applied yet, so a late router update
  //   can't overwrite newer typing.
  // ---------------------------------------------------------------------------
  const [view, setView] = useState<View>("landing")
  const [tickerParam, setTickerParam] = useState<string | null>(null)
  const [committedScreen, setCommittedScreen] = useState<ScreenFilters>(() => makeScreen())
  const [rawText, setRawText] = useState("")
  const [debouncedText, setDebouncedText] = useState("")

  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS })
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const appliedSearch = useRef<string | null>(null)
  const focusHeading = useRef(false)

  const syncFromUrl = useCallback(() => {
    appliedSearch.current = window.location.search
    const decoded = decodeUrlState(new URLSearchParams(window.location.search))
    setView(decoded.view)
    setTickerParam(decoded.ticker)
    setCommittedScreen(decoded.screen)
    setRawText(decoded.screen.text)
    setDebouncedText(decoded.screen.text)
  }, [])

  const syncFromRouter = useCallback(() => {
    if (window.location.pathname === "/" && window.location.search !== appliedSearch.current) syncFromUrl()
  }, [syncFromUrl])

  const writeUrl = useCallback(
    (mode: "push" | "replace", qs: string) => {
      const url = qs ? `/?${qs}` : "/"
      if (mode === "push") window.history.pushState(null, "", url)
      else window.history.replaceState(null, "", url)
      syncFromUrl()
    },
    [syncFromUrl],
  )

  useLayoutEffect(() => {
    // Read before syncing: text typed into the prerendered box before hydration.
    const early = rootRef.current?.querySelector<HTMLInputElement>("input[data-screen-input]")?.value
    // The URL is the external system here, and is unknowable while prerendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncFromUrl()
    if (early && !window.location.search) setRawText(early)
    document.documentElement.removeAttribute("data-deeplink")

    const onPopState = () => {
      focusHeading.current = true
      syncFromUrl()
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [syncFromUrl])

  // Debounce typed text
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(rawText), 120)
    return () => clearTimeout(t)
  }, [rawText])

  const parsed = useMemo(() => parseQuery(debouncedText), [debouncedText])

  const computeScreen = useCallback(
    (text: string) => screenFromTypedQuery(text, committedScreen),
    [committedScreen],
  )
  const screen = useMemo(() => computeScreen(debouncedText), [computeScreen, debouncedText])

  const universe = useUniverse()
  const ready = universe.status === "ready"
  const companies = ready ? universe.companies : NO_COMPANIES

  const selectedCompany: Company | null = useMemo(
    () => (tickerParam ? companies.find((c) => c.ticker === tickerParam) ?? null : null),
    [companies, tickerParam],
  )
  // An unknown ticker degrades to results, but only once there is a list to check it against.
  const shownView: View = view === "detail" && ready && !selectedCompany ? "results" : view
  const shownTicker = shownView === "detail" ? tickerParam : null

  // The landing page is complete without company data, so only fetch it once
  // the visitor screens, opens the filters, or arrives on a deep link.
  const needsUniverse = view !== "landing" || filtersOpen || rawText.trim() !== "" || !isScreenEmpty(screen)
  useEffect(() => {
    if (needsUniverse) void loadUniverse()
  }, [needsUniverse])

  const { results, matchCount } = useMemo(() => {
    if (companies.length > 0) return runScreen(companies, screen, weights)
    // Until it loads: an empty screen matches everything, anything else is unknown.
    return { results: NO_COMPANIES, matchCount: isScreenEmpty(screen) ? summary.totalCount : null }
  }, [companies, screen, weights, summary.totalCount])

  // After an in-app view change, move focus to the new view's heading: the
  // control that was activated has just been unmounted.
  useEffect(() => {
    if (!focusHeading.current) return
    const heading = rootRef.current?.querySelector("h1")
    if (!heading) return // still on the skeleton; runs again once ready
    focusHeading.current = false
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }, [shownView, shownTicker, ready])

  useEffect(() => {
    document.title =
      shownView === "detail" && selectedCompany
        ? `${selectedCompany.name} (${selectedCompany.ticker}) tear sheet | ${SITE.name}`
        : shownView === "results"
          ? `Screening results | ${SITE.name}`
          : SITE.title
  }, [shownView, selectedCompany])

  // Same-view screen edits (sector pills, industry chips, bucket filters, chip removal)
  const updateScreen = useCallback(
    (next: ScreenFilters) => {
      setCommittedScreen(next)
      const qs = encodeUrlState({ view: shownView, ticker: shownTicker, screen: next })
      if (window.location.search !== (qs ? `?${qs}` : "")) writeUrl("replace", qs)
    },
    [shownView, shownTicker, writeUrl],
  )

  // Real view transitions (landing <-> results <-> detail)
  const navigate = useCallback(
    (params: { view?: View; ticker?: string | null; screen?: ScreenFilters }) => {
      const nextView = params.view ?? shownView
      const nextTicker = params.ticker !== undefined ? params.ticker : shownTicker
      if (nextView !== shownView || nextTicker !== shownTicker) focusHeading.current = true

      writeUrl("push", encodeUrlState({ view: nextView, ticker: nextTicker, screen: params.screen ?? screen }))
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }))
    },
    [shownView, shownTicker, screen, writeUrl],
  )

  const materialize = useCallback(
    (next: ScreenFilters) => {
      const cleaned = { ...next, text: "" }
      setRawText("")
      setDebouncedText("")
      updateScreen(cleaned)
    },
    [updateScreen],
  )

  const handleQueryChange = useCallback(
    (q: string) => {
      setRawText(q)
      if (!q.trim()) {
        setDebouncedText("")
        const kept = screenAfterClearedSearch(committedScreen)
        if (shownTicker) {
          navigate({ view: "results", ticker: null, screen: kept })
        } else {
          updateScreen(kept)
        }
      }
    },
    [shownTicker, navigate, updateScreen, committedScreen],
  )

  const toggleSector = useCallback(
    (sector: string) => {
      const sectorsNext = screen.sectors.includes(sector)
        ? screen.sectors.filter((s) => s !== sector)
        : [...screen.sectors, sector]
      materialize({ ...screen, sectors: sectorsNext })
    },
    [screen, materialize],
  )

  const handleRemoveChip = useCallback(
    (chip: FilterChip) => materialize(removeChipFrom(screen, chip)),
    [materialize, screen],
  )

  const handleClearAll = useCallback(() => {
    setRawText("")
    setDebouncedText("")
    const empty = makeScreen()
    if (shownView === "detail") {
      navigate({ view: "results", ticker: null, screen: empty })
    } else {
      updateScreen(empty)
    }
  }, [shownView, navigate, updateScreen])

  const handleBucketsChange = useCallback(
    (buckets: BucketFilters) => materialize({ ...screen, buckets, industries: buckets.industry }),
    [screen, materialize],
  )

  const handleRun = useCallback(
    () => navigate({ view: "results", screen: computeScreen(rawText) }),
    [navigate, computeScreen, rawText],
  )

  const handleApplyScreen = useCallback(
    (example: ExampleScreen) => {
      const next = parseQuery(example.query).filters
      setRawText(example.query)
      setDebouncedText(example.query)
      navigate({ view: "results", screen: next })
    },
    [navigate],
  )

  const handleSelectCompany = useCallback(
    (company: Company) => navigate({ view: "detail", ticker: company.ticker }),
    [navigate],
  )
  const handleBackToResults = useCallback(() => navigate({ view: "results", ticker: null }), [navigate])
  const handleBackToLanding = useCallback(() => {
    setRawText("")
    setDebouncedText("")
    navigate({ view: "landing", ticker: null, screen: makeScreen() })
  }, [navigate])

  const activeFilterCount = countActiveBucketFilters(screen.buckets)
  const queryText = rawText

  return (
    <div ref={rootRef} className="relative min-h-screen">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <Suspense fallback={null}>
        <RouterUrlListener onChange={syncFromRouter} />
      </Suspense>

      <div className="relative z-10">
        {shownView === "landing" && (
          <>
            <div className="deeplink-placeholder">
              <ViewSkeleton />
            </div>
            <div className="landing-root">
              {universe.status === "error" && (
                <LoadError
                  message="Company data could not be loaded, so match counts are unavailable."
                  onRetry={loadUniverse}
                  className="m-4"
                />
              )}
              <LandingView
                query={queryText}
                onQueryChange={handleQueryChange}
                onWarmUp={loadUniverse}
                selectedSectors={screen.sectors}
                onToggleSector={toggleSector}
                onRun={handleRun}
                onOpenFilters={() => setFiltersOpen(true)}
                activeFilterCount={activeFilterCount}
                matchingCount={matchCount}
                totalCount={summary.totalCount}
                screen={screen}
                onRemoveChip={handleRemoveChip}
                onClearAll={handleClearAll}
                recognised={parsed.recognised}
                screens={summary.screens}
                onApplyScreen={handleApplyScreen}
                sectors={summary.sectors}
                dealCount={summary.dealCount}
                industryGroups={summary.industryGroups}
                unclassifiedCount={summary.unclassifiedCount}
                filters={screen.buckets}
                onFiltersChange={handleBucketsChange}
              />
            </div>
          </>
        )}

        {shownView !== "landing" &&
          !ready &&
          (universe.status === "error" ? (
            <section className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-6">
              <h1 className="mb-6 font-display text-5xl uppercase">Data unavailable</h1>
              <LoadError
                message="Company data could not be loaded. Check your connection, then retry."
                onRetry={loadUniverse}
              />
            </section>
          ) : (
            <ViewSkeleton />
          ))}

        {shownView === "results" && ready && (
          <div key="results" className="view-enter">
            <ResultsView
              results={results}
              query={queryText}
              onQueryChange={handleQueryChange}
              onSubmitQuery={handleRun}
              selectedSectors={screen.sectors}
              onToggleSector={toggleSector}
              weights={weights}
              filters={screen.buckets}
              onFiltersChange={handleBucketsChange}
              industryGroups={summary.industryGroups}
              unclassifiedCount={summary.unclassifiedCount}
              screen={screen}
              matchCount={matchCount}
              totalCount={companies.length}
              onRemoveChip={handleRemoveChip}
              onClearAll={handleClearAll}
              recognised={parsed.recognised}
              screens={summary.screens}
              onApplyScreen={handleApplyScreen}
              onSelectCompany={handleSelectCompany}
              onOpenWeights={() => setWeightsOpen(true)}
              onOpenFilters={() => setFiltersOpen(true)}
              onBack={handleBackToLanding}
              sectors={summary.sectors}
            />
          </div>
        )}

        {shownView === "detail" && ready && selectedCompany && (
          <div key={`detail-${selectedCompany.ticker}`} className="view-enter">
            <TearSheetView
              company={selectedCompany}
              weights={weights}
              onBack={handleBackToResults}
              companies={companies}
              deals={universe.deals}
              onSelectCompany={handleSelectCompany}
            />
          </div>
        )}
      </div>

      <WeightsPanel
        open={weightsOpen}
        weights={weights}
        onWeightsChange={setWeights}
        onClose={() => setWeightsOpen(false)}
      />

      <FiltersPanel
        open={filtersOpen}
        filters={screen.buckets}
        onFiltersChange={handleBucketsChange}
        onClose={() => setFiltersOpen(false)}
        onApply={() => {
          setFiltersOpen(false)
          if (shownView === "landing") {
            handleRun()
          }
        }}
        matchCount={matchCount}
        industryGroups={summary.industryGroups}
      />
    </div>
  )
}
