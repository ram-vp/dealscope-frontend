import filterBandsData from "@/data/filter-bands.json"

export interface Weights {
  revenueGrowth: number
  ebitdaMargin: number
  roce: number
  debtLevel: number
}

/** Sector-relative factor percentiles. null = the metric is missing, never 0. */
export interface FactorScores {
  revenueGrowth: number | null
  ebitdaMargin: number | null
  roce: number | null
  debtLevel: number | null
}

export const FACTOR_KEYS: (keyof FactorScores)[] = ["revenueGrowth", "ebitdaMargin", "roce", "debtLevel"]

/** Same floor as Python scoring.py MIN_POPULATED_METRICS. */
export const MIN_POPULATED_FACTORS = 2

export const DEFAULT_WEIGHTS: Weights = {
  revenueGrowth: 25,
  ebitdaMargin: 25,
  roce: 25,
  debtLevel: 25,
}

/** Weights can arrive in someone else's link, so non-default ones must be labelled. */
export function hasCustomWeights(weights: Weights): boolean {
  return FACTOR_KEYS.some((k) => weights[k] !== DEFAULT_WEIGHTS[k])
}

// ---------------------------------------------------------------------------
// Range filters -- separate from weights. Weights control ranking; these
// control which companies show up at all. Filtering is done on the same four
// sector-relative factor scores (0-100) shown as score rings in results, so a
// filter reads directly off the numbers the user already sees. debtLevel is
// "higher = healthier (lower debt)", consistent with the factor everywhere.
// ---------------------------------------------------------------------------

// Real-value bucket filters. Eight financial fields, each split into buckets
// whose boundaries are grounded in the real distribution across the full
// company dataset. Two interaction styles: multi-select pills (marketCap,
// promoterPledge) store an array of selected bucket keys; single-select
// segmented controls (the rest) store one key or null.

export type BucketFieldKey =
  | "marketCap"
  | "peRatio"
  | "revenueGrowth"
  | "ebitdaMargin"
  | "roce"
  | "roe"
  | "debtLevel"
  | "promoterPledge"

export interface Bucket {
  key: string
  name: string // "Small", "Value", "Excellent"
  range: string // real-unit range, e.g. "< ₹700 Cr", "12–28%", "> 51x"
  match: (v: number) => boolean
}

export interface BucketFieldDef {
  key: BucketFieldKey
  label: string
  select: "multi" | "single"
  getValue: (c: Company) => number | null
  buckets: Bucket[]
}

// ---------------------------------------------------------------------------
// Bucket edges for 7 of the 8 fields below are data-driven, read from
// data/filter-bands.json (winsorized p25/p50/p75 across the live company
// universe, written by the backend's compute_filter_bands.py -- see that
// script for the winsorization/rounding methodology). Bundled at build time,
// same static-import pattern as companies.json/deals.json -- no runtime
// fetch. Tier names/count and the field's label/select-mode stay hardcoded
// here (filter-bands.json only supplies the 3 numeric cutpoints + tier
// *keys*); only the numeric edges move when the underlying data does.
//
// promoterPledge is the one exception, left fully hardcoded: its real
// distribution is zero-heavy (most companies report no pledge at all), so
// filter-bands.json's own p25/p50/p75 for it collapse to 0/0/0 -- a
// confirmed, disclosed non-fit for percentile tiering (see the field's
// `note` in the JSON), not an oversight. The existing 3-tier None/Low/
// Elevated categorical split is a real distinction the data supports;
// wiring it to degenerate quartiles would not be.
// ---------------------------------------------------------------------------

interface FilterBandField {
  frontend_key: string
  unit: string
  tiers: string[]
  p25: number
  p50: number
  p75: number
  sample_size: number
  note?: string
}

interface FilterBandsFile {
  generated_at: string
  universe_size: number
  winsorize_percentiles: number[]
  fields: Record<string, FilterBandField>
}

const FILTER_BANDS = filterBandsData as FilterBandsFile

/** "highGrowth" -> "High Growth"; "small" -> "Small". Tier keys in
 *  filter-bands.json are the same camelCase strings as the old hardcoded
 *  bucket keys, just without a separate display name alongside them. */
function tierDisplayName(tierKey: string): string {
  const spaced = tierKey.replace(/([A-Z])/g, " $1")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// Bound (single-sided "< X" / "> X") and range (two-sided "X–Y") formatters
// are separate on purpose: the existing bucket convention puts the unit
// suffix once, at the end of a two-sided range ("₹700–2,900 Cr", "16–29x"),
// not on each side ("₹700 Cr–₹2,900 Cr") -- matching that exactly, not just
// "close enough", since it's copied verbatim from the previous hardcoded
// strings this replaces.
const crFormat = {
  bound: (v: number) => `₹${Math.round(v).toLocaleString("en-IN")} Cr`,
  range: (lo: number, hi: number) => `₹${Math.round(lo).toLocaleString("en-IN")}–${Math.round(hi).toLocaleString("en-IN")} Cr`,
}
const ratioFormat = {
  bound: (v: number) => `${v.toFixed(1)}x`,
  range: (lo: number, hi: number) => `${lo.toFixed(1)}–${hi.toFixed(1)}x`,
}
const pctFormat = {
  bound: (v: number) => `${v.toFixed(1)}%`,
  range: (lo: number, hi: number) => `${lo.toFixed(1)}–${hi.toFixed(1)}%`,
}

interface DataDrivenFieldSpec {
  key: Exclude<BucketFieldKey, "promoterPledge">
  label: string
  select: "multi" | "single"
  getValue: (c: Company) => number | null
  backendKey: string // key into FILTER_BANDS.fields
  format: { bound: (v: number) => string; range: (lo: number, hi: number) => string }
}

const DATA_DRIVEN_FIELD_SPECS: DataDrivenFieldSpec[] = [
  { key: "marketCap", label: "Market Cap", select: "multi", getValue: (c) => c.raw.marketCap, backendKey: "market_cap", format: crFormat },
  { key: "peRatio", label: "P/E Ratio", select: "single", getValue: (c) => c.raw.peRatio, backendKey: "trailing_pe", format: ratioFormat },
  { key: "revenueGrowth", label: "Revenue Growth", select: "single", getValue: (c) => c.raw.revenueGrowth, backendKey: "revenue_growth_pct", format: pctFormat },
  { key: "ebitdaMargin", label: "EBITDA Margin", select: "single", getValue: (c) => c.raw.ebitdaMargin, backendKey: "ebitda_margin_pct", format: pctFormat },
  { key: "roce", label: "ROCE", select: "single", getValue: (c) => c.raw.roce, backendKey: "return_on_capital_employed_pct", format: pctFormat },
  { key: "roe", label: "ROE", select: "single", getValue: (c) => c.raw.roe, backendKey: "return_on_equity_pct", format: pctFormat },
  {
    // Low debt reads as favorable, consistent with the "higher = healthier"
    // debtLevel factor convention -- but here we filter the real ₹ Cr figure.
    key: "debtLevel",
    label: "Debt Level",
    select: "single",
    getValue: (c) => c.raw.totalDebt,
    backendKey: "total_debt",
    format: crFormat,
  },
]

/** 4 half-open bands from 3 ascending cutpoints: [< c0], [c0, c1), [c1, c2),
 *  [c2, ∞) -- same boundary convention (upper-exclusive except the last
 *  band) as the previous hardcoded buckets. */
function buildDataDrivenBuckets(spec: DataDrivenFieldSpec, band: FilterBandField): Bucket[] {
  const cuts = [band.p25, band.p50, band.p75]
  return band.tiers.map((tierKey, i) => {
    const lo = i === 0 ? null : cuts[i - 1]
    const hi = i === band.tiers.length - 1 ? null : cuts[i]
    const range =
      lo === null ? `< ${spec.format.bound(hi as number)}` : hi === null ? `> ${spec.format.bound(lo)}` : spec.format.range(lo, hi)
    return {
      key: tierKey,
      name: tierDisplayName(tierKey),
      range,
      match: (v: number) => (lo === null || v >= lo) && (hi === null || v < hi),
    }
  })
}

function buildDataDrivenField(spec: DataDrivenFieldSpec): BucketFieldDef {
  const band = FILTER_BANDS.fields[spec.backendKey]
  if (!band) {
    // filter-bands.json is generated alongside companies.json by the same
    // backend export -- a missing field means that export broke, not a
    // recoverable runtime state. Warn loudly in dev, degrade to "no buckets"
    // (field never constrains) rather than crash the whole app.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`filter-bands.json has no entry for "${spec.backendKey}" -- ${spec.key} filter will not constrain anything.`)
    }
    return { key: spec.key, label: spec.label, select: spec.select, getValue: spec.getValue, buckets: [] }
  }
  if (process.env.NODE_ENV !== "production" && !(band.p25 < band.p50 && band.p50 < band.p75)) {
    console.warn(
      `filter-bands.json field "${spec.backendKey}" has non-ascending cutpoints ` +
        `(p25=${band.p25}, p50=${band.p50}, p75=${band.p75}) -- buckets may overlap or be empty.`,
    )
  }
  return {
    key: spec.key,
    label: spec.label,
    select: spec.select,
    getValue: spec.getValue,
    buckets: buildDataDrivenBuckets(spec, band),
  }
}

export const BUCKET_FIELDS: BucketFieldDef[] = [
  ...DATA_DRIVEN_FIELD_SPECS.map(buildDataDrivenField),
  {
    key: "promoterPledge",
    label: "Promoter Pledge",
    select: "multi",
    getValue: (c) => c.raw.promoterPledge,
    buckets: [
      { key: "none", name: "None", range: "0%", match: (v) => v === 0 },
      { key: "low", name: "Low", range: "0–10%", match: (v) => v > 0 && v <= 10 },
      { key: "elevated", name: "Elevated", range: "> 10%", match: (v) => v > 10 },
    ],
  },
]

export interface BucketFilters {
  marketCap: string[] // multi-select
  promoterPledge: string[] // multi-select
  revenueGrowth: string | null // single-select
  ebitdaMargin: string | null
  roce: string | null
  roe: string | null
  debtLevel: string | null
  peRatio: string | null
  // Exact-match multi-select over the ~123 raw industry labels -- doesn't fit
  // BUCKET_FIELDS' numeric-range abstraction (Bucket.match(v: number)), so
  // it's handled as its own field rather than forced into that shape.
  industry: string[]
}

export const DEFAULT_BUCKET_FILTERS: BucketFilters = {
  marketCap: [],
  promoterPledge: [],
  revenueGrowth: null,
  ebitdaMargin: null,
  roce: null,
  roe: null,
  debtLevel: null,
  peRatio: null,
  industry: [],
}

function isFieldActive(sel: string[] | string | null): boolean {
  return Array.isArray(sel) ? sel.length > 0 : sel !== null
}

export function countActiveBucketFilters(f: BucketFilters): number {
  const numericCount = BUCKET_FIELDS.reduce((n, def) => n + (isFieldActive(f[def.key]) ? 1 : 0), 0)
  return numericCount + (f.industry.length > 0 ? 1 : 0)
}

// A company passes a field's constraint if its real value falls within (any of)
// the selected bucket(s). A field with no selection never constrains. A missing
// value (null) never falls in any bucket, so such a company is simply excluded
// once that field is filtered -- it never crashes or defaults into a bucket.
function passesField(company: Company, def: BucketFieldDef, selection: string[] | string | null): boolean {
  const keys = Array.isArray(selection) ? selection : selection ? [selection] : []
  if (keys.length === 0) return true
  const v = def.getValue(company)
  if (v == null) return false
  return keys.some((k) => {
    const bucket = def.buckets.find((b) => b.key === k)
    return bucket ? bucket.match(v) : false
  })
}

export function passesBucketFilters(company: Company, filters: BucketFilters): boolean {
  const passesNumeric = BUCKET_FIELDS.every((def) => passesField(company, def, filters[def.key]))
  const passesIndustry =
    filters.industry.length === 0 || (company.industry !== null && filters.industry.includes(company.industry))
  return passesNumeric && passesIndustry
}

export function filterCompanies(companies: Company[], filters: BucketFilters): Company[] {
  return companies.filter((c) => passesBucketFilters(c, filters))
}

export interface ComparableDeal {
  target: string
  acquirer: string
  year: string
  value: string
  dealType?: string
  stakePct?: string | null
  evEbitda?: string | null
}

export interface Company {
  name: string
  ticker: string
  sector: string // 13-sector v2 display name, e.g. "Industrials & Capital Goods"
  sectorKey: string // same v2 label; used to match comparable deals on sector_v2
  // Granular yfinance-sourced fields, alongside the 13-sector v2 grouping.
  // null for companies missing them upstream.
  industry: string | null // e.g. "Specialty Chemicals" (one of 123 distinct values)
  sectorRaw: string | null // Yahoo's own 11-value sector taxonomy, e.g. "Basic Materials"
  /* Factor scores, 0-100, sector-relative. null = missing. debtLevel: higher = healthier (lower debt) */
  factors: FactorScores
  asOfDate: string | null // fundamentals as-of date for this company
  metrics: {
    revenue: string // TTM revenue
    revenueGrowth: string
    ebitdaMargin: string
    roce: string
    totalDebt: string
  }
  financials: {
    marketCap: string
    marketCapAsOf: string | null
    peRatio: string
    priceToBook: string
    roe: string
    debtToEquity: string
    currentRatio: string
    freeCashFlow: string
    promoterHolding: string
    promoterPledge: string
    beta: string
  }
  // Unformatted numeric values for real-value bucket filtering and CSV export.
  // Currency fields are in ₹ Cr, percentages are plain (e.g. 14.8), ratios are
  // plain (e.g. 0.45). null = missing: never coerced to 0.
  raw: {
    marketCap: number | null // ₹ Cr
    revenue: number | null // ₹ Cr
    ebitda: number | null // ₹ Cr
    netIncome: number | null // ₹ Cr
    peRatio: number | null
    priceToBook: number | null
    revenueGrowth: number | null // %
    ebitdaMargin: number | null // %
    roce: number | null // %
    roe: number | null // %
    totalDebt: number | null // ₹ Cr
    debtToEquity: number | null // x
    currentRatio: number | null // x
    freeCashFlow: number | null // ₹ Cr
    promoterHolding: number | null // %
    promoterPledge: number | null // %
    beta: number | null
    evEbitdaLow: number | null // ₹ Cr
    evEbitdaHigh: number | null // ₹ Cr
  }
  valuation: {
    evEbitda: string
    peImplied: string
    note: string
  }
  // Factual "what this company does" -- null until the AI content batch has
  // processed this company. No fallback-to-something-else here: unlike
  // whyThisScore below, there's no older field to fall back to for this one.
  about: string | null
  hasAbout: boolean
  // The score explanation shown under "Why This Score". Prefers the new
  // why_this_score field; falls back to the older single-field `rationale`
  // for companies processed before the about/why_this_score split (or not
  // yet reprocessed) so real, already-generated content never reads as
  // "awaiting generation" just because it's sitting under the old field
  // name. null only when neither exists.
  whyThisScore: string | null
  hasWhyThisScore: boolean
}

export interface Sector {
  name: string
  count: number
}

export interface IndustryOption {
  name: string
  count: number
}

// ---------------------------------------------------------------------------
// Formatting helpers -- raw values from data/companies.json are plain rupees
// / plain percentages; these turn them into the display strings the UI uses
// ("₹1,234 Cr", "12.9%", etc).
// ---------------------------------------------------------------------------

function isNum(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v)
}

// Guards the JSON trust boundary for the AI-content fields specifically.
// export_for_frontend.py's cache reader was, until recently, still assigning
// the *whole* {rationale, about, why_this_score} cache-entry object as the
// value of the old single `rationale` key for any company already
// reprocessed under the new two-field schema -- so `r.rationale` in real
// exported data was an object, not a string, for a large share of
// companies. TypeScript's `string | null` on CompanyRecord only describes
// the intent, not what's actually in the JSON at runtime; rendering that
// object directly in JSX crashed the whole tear sheet with "Objects are not
// valid as a React child". Treat anything that isn't actually a non-empty
// string as absent -- safe regardless of what shape a future data hiccup
// takes, not just this one.
export function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

// One formatter for the whole universe: toLocaleString() builds a new one per
// call, and mapping ~2,400 companies makes ~10,000 of those calls.
const EN_IN = new Intl.NumberFormat("en-IN")

function formatCr(value: number | null | undefined): string {
  if (!isNum(value)) return "N/A"
  const cr = Math.round(value / 1e7)
  // Only a real zero reads as ₹0: 49 live revenue and debt figures under half
  // a crore were displayed as if they were nil.
  if (cr === 0) return value > 0 ? "< ₹1 Cr" : "₹0 Cr"
  return `${cr < 0 ? "-" : ""}₹${EN_IN.format(Math.abs(cr))} Cr`
}

function formatPct(value: number | null | undefined): string {
  if (!isNum(value)) return "N/A"
  return `${value.toFixed(1)}%`
}

function formatFactor(value: number | null | undefined): number | null {
  if (!isNum(value)) return null
  return Math.round(value)
}

function formatRange(low: number | null | undefined, high: number | null | undefined): string {
  if (!isNum(low) || !isNum(high)) return "N/A"
  return `${formatCr(low)} – ${formatCr(high)}`
}

function toCr(value: number | null | undefined): number | null {
  return isNum(value) ? value / 1e7 : null
}

function toNum(value: number | null | undefined): number | null {
  return isNum(value) ? value : null
}

/** Implied equity cannot be negative. Confirmed live on IDEA: EV/EBITDA
 *  showed ₹-30,365 Cr – ₹3,84,520 Cr. Floor at 0 and flag debt overhang. */
export const DEBT_OVERHANG_NOTE =
  "Implied equity floored at ₹0. Listed-peer EV/EBITDA value is fully absorbed by this company's debt (debt overhang)."

export function formatImpliedEquityRange(
  low: number | null | undefined,
  high: number | null | undefined,
): { text: string; debtOverhang: boolean } {
  if (!isNum(low) || !isNum(high)) return { text: "N/A", debtOverhang: false }
  const debtOverhang = low < 0 || high < 0
  return {
    text: `${formatCr(Math.max(0, low))} – ${formatCr(Math.max(0, high))}`,
    debtOverhang,
  }
}

// ---------------------------------------------------------------------------
// Raw record shapes -- match data/companies.json and data/deals.json exactly
// (produced by export_for_frontend.py from the real scoring/valuation engine)
// ---------------------------------------------------------------------------

export interface CompanyRecord {
  ticker: string
  name: string
  sector: string
  sector_display: string
  ey_bucket?: string | null
  industry: string | null
  sector_raw: string | null
  revenue: number | null
  ebitda: number | null
  ebitda_margin_pct: number | null
  revenue_growth_pct: number | null
  roce_pct: number | null
  total_debt: number | null
  market_cap: number | null
  net_income: number | null
  // Extended fundamentals (Part 1) -- real values for every company.
  trailing_pe: number | null
  price_to_book: number | null
  return_on_equity_pct: number | null
  debt_to_equity: number | null
  current_ratio: number | null
  free_cash_flow: number | null
  // Optional so an older payload without the field typechecks; missing is null,
  // never coerced to 0 in mapCompanyRecord.
  promoter_holding_pct?: number | null
  promoter_pledge_pct: number | null
  beta: number | null
  market_cap_as_of: string | null
  factor_revenue_growth: number | null
  factor_ebitda_margin: number | null
  factor_roce: number | null
  factor_debt_level: number | null
  ev_ebitda_low: number | null
  ev_ebitda_high: number | null
  pe_implied_low: number | null
  pe_implied_high: number | null
  valuation_note: string | null
  as_of_date: string
}

export interface DealRow {
  target: string
  acquirer: string
  sector_raw: string | null
  ey_bucket: string
  sector_v2?: string | null
  deal_type: string
  deal_value_usdm: number | null
  stake_pct: number | null
  report_year: number
  ev_ebitda?: number | null
}

/** margin 0 with no EBITDA is the feed's "not applicable" (every bank).
 *  The backend now nulls it and scripts/validate_data.py blocks new ones;
 *  this keeps data published before that from showing a fake 0%. */
export function isPlaceholderMargin(r: Pick<CompanyRecord, "ebitda" | "ebitda_margin_pct">): boolean {
  return r.ebitda_margin_pct === 0 && r.ebitda === null
}

/** Same floor as the backend's NET_INCOME_MATERIALITY_FLOOR. */
const MIN_EARNINGS_FOR_PE = 1_000_000

export function mapCompanyRecord(r: CompanyRecord): Company {
  const noMargin = isPlaceholderMargin(r)
  const margin = noMargin ? null : r.ebitda_margin_pct
  // A P/E on losses or near-zero earnings is not a valuation.
  const pe = isNum(r.net_income) && r.net_income < MIN_EARNINGS_FOR_PE ? null : r.trailing_pe
  return {
    name: r.name,
    ticker: r.ticker,
    sector: r.sector_display,
    sectorKey: r.sector,
    industry: r.industry ?? null,
    sectorRaw: r.sector_raw ?? null,
    asOfDate: r.as_of_date || null,
    factors: {
      revenueGrowth: formatFactor(r.factor_revenue_growth),
      ebitdaMargin: noMargin ? null : formatFactor(r.factor_ebitda_margin),
      roce: formatFactor(r.factor_roce),
      debtLevel: formatFactor(r.factor_debt_level),
    },
    metrics: {
      revenue: formatCr(r.revenue),
      revenueGrowth: formatPct(r.revenue_growth_pct),
      ebitdaMargin: formatPct(margin),
      roce: formatPct(r.roce_pct),
      totalDebt: formatCr(r.total_debt),
    },
    financials: {
      marketCap: formatCr(r.market_cap),
      marketCapAsOf: r.market_cap_as_of,
      peRatio: pe != null ? pe.toFixed(1) + "x" : "N/A",
      priceToBook: r.price_to_book != null ? r.price_to_book.toFixed(1) + "x" : "N/A",
      roe: formatPct(r.return_on_equity_pct),
      debtToEquity: r.debt_to_equity != null ? r.debt_to_equity.toFixed(2) + "x" : "N/A",
      currentRatio: r.current_ratio != null ? r.current_ratio.toFixed(2) + "x" : "N/A",
      freeCashFlow: formatCr(r.free_cash_flow),
      promoterHolding: formatPct(r.promoter_holding_pct),
      promoterPledge: formatPct(r.promoter_pledge_pct),
      beta: r.beta != null ? r.beta.toFixed(2) : "N/A",
    },
    raw: {
      marketCap: toCr(r.market_cap),
      // Added for the screener: "under 2000 Cr revenue" needs revenue as a
      // filterable number, not just the pre-formatted `metrics.revenue`
      // string. Same rupees -> Rs Cr scaling as marketCap/totalDebt above.
      revenue: toCr(r.revenue),
      ebitda: toCr(r.ebitda),
      netIncome: toCr(r.net_income),
      peRatio: toNum(pe),
      priceToBook: toNum(r.price_to_book),
      revenueGrowth: toNum(r.revenue_growth_pct),
      ebitdaMargin: toNum(margin),
      roce: toNum(r.roce_pct),
      roe: toNum(r.return_on_equity_pct),
      totalDebt: toCr(r.total_debt),
      debtToEquity: toNum(r.debt_to_equity),
      currentRatio: toNum(r.current_ratio),
      freeCashFlow: toCr(r.free_cash_flow),
      promoterHolding: toNum(r.promoter_holding_pct),
      promoterPledge: toNum(r.promoter_pledge_pct),
      beta: toNum(r.beta),
      evEbitdaLow: toCr(r.ev_ebitda_low),
      evEbitdaHigh: toCr(r.ev_ebitda_high),
    },
    valuation: (() => {
      const ev = formatImpliedEquityRange(r.ev_ebitda_low, r.ev_ebitda_high)
      const existing = r.valuation_note?.trim() ?? ""
      const note = ev.debtOverhang
        ? existing
          ? `${existing} ${DEBT_OVERHANG_NOTE}`
          : DEBT_OVERHANG_NOTE
        : existing
      return {
        evEbitda: ev.text,
        peImplied: formatRange(r.pe_implied_low, r.pe_implied_high),
        note,
      }
    })(),
    about: null,
    hasAbout: false,
    whyThisScore: null,
    hasWhyThisScore: false,
  }
}

// ---------------------------------------------------------------------------
// Aggregates over a company list. The list itself comes from lib/universe.ts
// (server, tests) or lib/use-universe.ts (browser), never from this module:
// importing the JSON here would put all of it in every bundle.
// ---------------------------------------------------------------------------

export function getSectors(companies: Company[]): Sector[] {
  const counts = new Map<string, number>()
  for (const c of companies) {
    counts.set(c.sector, (counts.get(c.sector) ?? 0) + 1)
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

export function compareScores(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return b - a
}

/** Industry breakdown scoped to a set of broad sectors -- the results page's
 *  drill-down (sector chip -> its granular industries). Deliberately takes
 *  the FULL company list, not an already industry-filtered one: this counts
 *  what's available to narrow into, so selecting one industry can't shrink
 *  the very list used to offer the others. Global (no sectors given) falls
 *  back to the whole universe's counts. */
export function getIndustriesForSectors(companies: Company[], sectorNames: string[]): IndustryOption[] {
  const scoped = sectorNames.length > 0 ? companies.filter((c) => sectorNames.includes(c.sector)) : companies
  const counts = new Map<string, number>()
  for (const c of scoped) {
    if (c.industry) counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1)
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  )
}

export interface IndustryGroup {
  sector: string
  industries: IndustryOption[]
}

/** Full industry breakdown grouped under its parent sector, industries sorted
 *  by count descending within each group -- powers both the always-visible
 *  sector/industry filter (results + landing pages) and the Filters panel's
 *  grouped industry search, so there's one grouping source instead of two.
 *  Groups are ordered the same as `sectors` (count descending, matching the
 *  sector pills everywhere else). Sectors with zero industries (currently
 *  just "Unclassified" -- its companies have no industry data by definition)
 *  are omitted rather than rendered as an empty group. `sectorNames` scopes
 *  which sectors get a group at all (empty = every sector), independent of
 *  the sector-level company counts, same convention as getIndustriesForSectors. */
export function getIndustryGroups(companies: Company[], sectorNames: string[] = []): IndustryGroup[] {
  const allSectors = getSectors(companies)
  const scopedSectors = (sectorNames.length > 0 ? allSectors.filter((s) => sectorNames.includes(s.name)) : allSectors)
    .filter((s) => s.name.toLowerCase() !== "unclassified")
  return scopedSectors
    .map((sector) => ({ sector: sector.name, industries: getIndustriesForSectors(companies, [sector.name]) }))
    .filter((group) => group.industries.length > 0)
}

/** Narrow already-grouped industries to those matching a free-text query,
 *  dropping groups left with nothing. Uses the same normalizeForSearch() the
 *  company search uses (case-fold, "&"/"and" unified, punctuation stripped),
 *  so typing "oil and gas" or "Oil & Gas" behaves identically here, in the
 *  Filters drawer, and in the main search box.
 *
 *  Shared by the Filters drawer's industry typeahead and the results/landing
 *  "Browse industries" panel so the grouping + count-ordering + matching rules
 *  exist once. Pure and synchronous on purpose: this filters ~124 short
 *  strings already in memory, so there's nothing to debounce -- a timer would
 *  only add latency (unlike the 2,381-company search, which is debounced in
 *  dealscope-app.tsx). */
export function filterIndustryGroups(groups: IndustryGroup[], query: string): IndustryGroup[] {
  const q = normalizeForSearch(query)
  if (!q) return groups
  return groups
    .map((g) => ({ sector: g.sector, industries: g.industries.filter((ind) => normalizeForSearch(ind.name).includes(q)) }))
    .filter((g) => g.industries.length > 0)
}

// ---------------------------------------------------------------------------
// Company news / filings -- read from data/news.json. The file is optional and
// may arrive in either shape, so the loader tolerates both:
//   { "TICKER": { filings, bseNotices, news }, ... }   (object keyed by ticker)
//   [ { ticker, filings, bseNotices, news }, ... ]     (array of entries)
// Any missing section resolves to an empty array so the UI shows honest empty
// states rather than crashing.
// ---------------------------------------------------------------------------

export interface NseFiling {
  category: string
  date: string
  link: string
}

export interface BseNotice {
  title: string
  date: string
  link: string
}

export interface NewsItem {
  headline: string
  source: string
  date: string
  link: string
}

export interface CompanyNews {
  filings: NseFiling[]
  bseNotices: BseNotice[]
  news: NewsItem[]
}

export function comparablesForSector(sectorKey: string, deals: DealRow[]): ComparableDeal[] {
  const matched = deals.filter((d) => (d.sector_v2 || d.ey_bucket) === sectorKey)
  return matched
    .sort((a, b) => (b.report_year ?? 0) - (a.report_year ?? 0))
    .slice(0, 15)
    .map((d) => ({
      target: d.target,
      acquirer: d.acquirer,
      year: d.report_year ? String(d.report_year) : "N/A",
      value: isNum(d.deal_value_usdm) ? `US$${d.deal_value_usdm.toLocaleString("en-US")}m` : "N/A",
      dealType: d.deal_type || undefined,
      stakePct: isNum(d.stake_pct) ? `${d.stake_pct}%` : null,
      evEbitda: isNum(d.ev_ebitda) ? `${d.ev_ebitda.toFixed(1)}x` : "N/A",
    }))
}

export function comparableCountForSector(sectorKey: string, deals: DealRow[]): number {
  return deals.filter((d) => (d.sector_v2 || d.ey_bucket) === sectorKey).length
}

export interface SectorRankInfo {
  rank: number
  total: number
}

export function computeSectorRank(company: Company, companies: Company[], weights: Weights): SectorRankInfo | null {
  if (!company.sector || company.sector === "Unclassified") return null
  const currentScore = computeScore(company.factors, weights)
  if (currentScore == null) return null

  const sectorCohort = companies.filter((c) => c.sector === company.sector)
  let higherCount = 0
  let validCount = 0

  for (const c of sectorCohort) {
    const s = computeScore(c.factors, weights)
    if (s != null) {
      validCount++
      if (s > currentScore) {
        higherCount++
      }
    }
  }

  if (validCount === 0) return null
  return {
    rank: higherCount + 1,
    total: validCount,
  }
}

export function findClosestPeers(company: Company, companies: Company[], limit = 5): Company[] {
  if (!company.sector || company.sector === "Unclassified") return []

  const peers = companies.filter((c) => c.sector === company.sector && c.ticker !== company.ticker)
  if (peers.length === 0) return []

  const targetFactors = company.factors
  const factorKeys: (keyof FactorScores)[] = ["revenueGrowth", "ebitdaMargin", "roce", "debtLevel"]

  const scoredPeers = peers.map((peer) => {
    let sumSq = 0
    let count = 0
    for (const k of factorKeys) {
      const tv = targetFactors[k]
      const pv = peer.factors[k]
      if (tv != null && pv != null) {
        sumSq += Math.pow(tv - pv, 2)
        count++
      }
    }
    const distance = count > 0 ? Math.sqrt(sumSq / count) + (4 - count) * 15 : 999
    return { peer, distance }
  })

  scoredPeers.sort((a, b) => a.distance - b.distance)
  return scoredPeers.slice(0, limit).map((sp) => sp.peer)
}

// ---------------------------------------------------------------------------
// Scoring / search -- pure client-side math, unchanged. Operates on whatever
// company list is passed in (the full bundled set).
// ---------------------------------------------------------------------------

export function computeScore(factors: FactorScores, weights: Weights): number | null {
  const populated = FACTOR_KEYS.filter((k) => factors[k] != null)
  if (populated.length < MIN_POPULATED_FACTORS) return null

  let weightedSum = 0
  let weightTotal = 0
  for (const key of FACTOR_KEYS) {
    const value = factors[key]
    if (value == null) continue
    weightedSum += value * weights[key]
    weightTotal += weights[key]
  }
  if (weightTotal === 0) return null
  return Math.round(weightedSum / weightTotal)
}

export function sectorAverage(companies: Company[], sector: string, weights: Weights): number | null {
  if (sector === "Unclassified") return null
  const scores = companies
    .filter((c) => c.sector === sector)
    .map((c) => computeScore(c.factors, weights))
    .filter((s): s is number => s != null)
  if (scores.length === 0) return null
  return Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length)
}

export const FACTOR_LABELS: {
  key: keyof FactorScores
  label: string
  metricKey: keyof Company["metrics"]
  explainer: string
}[] = [
  {
    key: "revenueGrowth",
    label: "Revenue Growth",
    metricKey: "revenueGrowth",
    explainer: "YoY revenue growth trajectory relative to sector cohort.",
  },
  {
    key: "ebitdaMargin",
    label: "EBITDA Margin",
    metricKey: "ebitdaMargin",
    explainer: "Operating profitability (EBITDA / Revenue) before non-cash & capital costs.",
  },
  {
    key: "roce",
    label: "ROCE",
    metricKey: "roce",
    explainer: "Capital efficiency (EBIT / Capital Employed): returns generated on deployed capital.",
  },
  {
    key: "debtLevel",
    label: "Debt Level",
    metricKey: "totalDebt",
    explainer:
      "Balance sheet leverage (Net Debt / EBITDA; fallback D/E). Higher score indicates lower debt burden. Excluded for Financial Services.",
  },
]

// ---------------------------------------------------------------------------
// Free-text search matching. Extended 2026-07-20 from a single flat
// "does any token substring-match name+ticker+sector" pass. That original pass
// was already case-insensitive, whitespace-split and multi-field, but it was
// pure OR -- so "tata motors" returned every company matching "tata" OR
// "motors" -- had no typo tolerance, and ranked purely by composite score, so
// searching an exact ticker could bury that company far down the list.
// ---------------------------------------------------------------------------

/** Lowercase, unify "&"/"and", strip punctuation, collapse whitespace, so
 *  "M&M", "M & M" and "m and m" all normalize to the same thing. */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Levenshtein distance, bailing out early once it exceeds `max` (we only ever
 *  care whether a token is *within* a small distance, never the exact value). */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < rowMin) rowMin = curr[j]
    }
    if (rowMin > max) return max + 1
    prev = curr
  }
  return prev[b.length]
}

/** Typo tolerance scaled to token length -- 1 edit for medium words, 2 for long
 *  ones, and none below 4 characters (at 3 chars or fewer, an edit-distance-1
 *  match is mostly noise: "tcs" would fuzzily match "tata", "ics", "tvs"...). */
function fuzzyTokenMatches(token: string, words: string[]): boolean {
  if (token.length < 4) return false
  const max = token.length >= 7 ? 2 : 1
  return words.some((w) => w.length >= 3 && editDistance(token, w, max) <= max)
}

/** One token against one company's text.
 *
 *  Length 1 must match a WHOLE word, not a substring or prefix: normalizing
 *  "M&M" yields the tokens ["m","and","m"], and a bare substring test for "m"
 *  matches roughly half the universe (any name containing the letter m, most
 *  commonly via "Limited"), which swamped the results.
 *
 *  Length 2 matches a word PREFIX rather than requiring the whole word --
 *  typing the first two letters of a name ("re", "ta", "hd"...) is completely
 *  ordinary short/partial input, and the old whole-word-only rule rejected it
 *  outright (e.g. "re" matched nothing in "Reliance", since "reliance" is
 *  never its own whole word). Still anchored to a word boundary, so it can't
 *  regress to the length-1 bug -- "m" as a *prefix* would still match "Motors"
 *  etc. and stays restricted to length 1 for that reason.
 *
 *  Length 3+ keeps substring matching so "pharma" still finds "AARTIPHARM"
 *  and "reli" still finds "Reliance" mid-word matches, not just prefixes. */
function tokenMatches(token: string, haystack: string, words: string[]): boolean {
  if (token.length === 1) return words.includes(token)
  if (token.length === 2) return words.some((w) => w.startsWith(token))
  return haystack.includes(token)
}

// ---------------------------------------------------------------------------
// Per-company search index -- ticker/name/sector normalized once per company
// (on first search) instead of on every matchTier() call. Search runs against the full
// universe on every keystroke (see the debounce in dealscope-app.tsx for the
// other half of the fix), so re-running normalizeForSearch's regex chain for
// every company on every call was pure repeated work: name/ticker/sector
// never change at runtime, only the query does.
//
// Job A's granular `industry` field (123 values) was tried here too, folded
// into the same haystack -- reverted after it produced a real false positive:
// "M&M" (tokens ["m","and","m"]) started also matching G.M. Breweries, whose
// industry label "Beverages - Wineries & Distilleries" normalizes to include
// the word "and" via its own "&", combined with the lone "m" in "G.M.".
// Ampersands are common in Yahoo's industry labels, so this wasn't a one-off
// -- any "X & Y"-shaped query risked spurious matches against unrelated
// companies via their industry text. Not worth it: industry wasn't the
// diagnosed cause of any of the four reported problems, so left out.
// ---------------------------------------------------------------------------

/** What people type for companies whose ticker or legal name shares no words with it. */
export const TICKER_NICKNAMES: Record<string, string> = {
  "l and t": "LT",
  sbi: "SBIN",
  ril: "RELIANCE",
  hul: "HINDUNILVR",
}

/** normalizeForSearch, plus "ltd" and "limited" as the same word. */
export function normalizeName(value: string): string {
  return normalizeForSearch(value).replace(/\bltd\b/g, "limited")
}

/** In nearly every name, so never evidence for a match ("lt" matched every "Ltd"). */
const LEGAL_SUFFIXES = new Set(["limited", "ltd"])

interface SearchIndexEntry {
  symbol: string
  ticker: string
  name: string
  haystack: string
  words: string[]
}

function buildSearchEntry(company: Company): SearchIndexEntry {
  const ticker = normalizeForSearch(company.ticker)
  const name = normalizeName(company.name)
  const sector = normalizeForSearch(company.sector)
  const haystack = `${name} ${ticker} ${sector}`
  return { symbol: company.ticker, ticker, name, haystack, words: haystack.split(" ").filter((w) => w && !LEGAL_SUFFIXES.has(w)) }
}

const SEARCH_INDEX = new WeakMap<Company, SearchIndexEntry>()

function getSearchEntry(company: Company): SearchIndexEntry {
  const cached = SEARCH_INDEX.get(company)
  if (cached) return cached
  const entry = buildSearchEntry(company)
  SEARCH_INDEX.set(company, entry)
  return entry
}

/** Relevance tier for one company against one query. Lower is better;
 *  null means no match at all. Typo matching is a separate, later pass. */
function matchTier(company: Company, q: string, tokens: string[]): number | null {
  const { symbol, ticker, name, haystack, words } = getSearchEntry(company)

  // Exact ticker, name or nickname -- always the top hit.
  if (ticker === q || name === q || TICKER_NICKNAMES[q] === symbol) return 0
  if (ticker.startsWith(q) || name.startsWith(q)) return 1
  if (tokens.every((t) => tokenMatches(t, haystack, words))) return 2 // ALL tokens

  return null
}

/** Free-text matches within `base`, best tier first and score inside a tier.
 *  Empty when nothing matches: showing everything instead made "zzzz", a typo
 *  and "M&M" all answer with the whole universe. */
export function searchByText(base: Company[], text: string, weights: Weights): Company[] {
  const q = normalizeName(text)
  const tokens = q.split(" ").filter(Boolean)
  if (tokens.length === 0) return base

  let hits: { company: Company; tier: number }[] = []
  for (const company of base) {
    const tier = matchTier(company, q, tokens)
    if (tier !== null) hits.push({ company, tier })
  }
  // Typos only when nothing matched as typed, so "infy" never drags in "indy".
  if (hits.length === 0) {
    hits = base
      .filter((company) => {
        const { haystack, words } = getSearchEntry(company)
        return tokens.every((t) => tokenMatches(t, haystack, words) || fuzzyTokenMatches(t, words))
      })
      .map((company) => ({ company, tier: 3 }))
  }
  // Last, any one substantial word of a multi-word query.
  if (hits.length === 0 && tokens.length > 1) {
    hits = base
      .filter((company) => {
        const { words } = getSearchEntry(company)
        return tokens.some((t) => t.length >= 4 && words.some((w) => w.startsWith(t)))
      })
      .map((company) => ({ company, tier: 4 }))
  }

  return hits
    .map((hit) => ({ ...hit, score: computeScore(hit.company.factors, weights) }))
    .sort((a, b) => a.tier - b.tier || compareScores(a.score, b.score))
    .map((hit) => hit.company)
}
