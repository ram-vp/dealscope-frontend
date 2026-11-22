// ---------------------------------------------------------------------------
// ScreenFilters <-> URL search params.
//
// Before this, only `q` and `sectors` reached the URL. Everything else a user
// could build -- numeric constraints from typed queries or chip edits, and the
// bucket-drawer selections -- lived purely in React state. Three consequences,
// all confirmed on the live site:
//
//   1. Removing a chip cleared the query text in state but left the old `q=`
//      in the URL, so refreshing restored the screen the user had just edited
//      away.
//   2. A screen built entirely from the filters drawer had an empty URL, so
//      sharing that link sent the recipient to an unfiltered universe.
//   3. Back/forward moved `q` and `sectors` but silently kept the numeric and
//      bucket state from the page you were leaving.
//
// A screener whose links don't reproduce what you were looking at isn't
// shareable, and sharing is the point of a public tool. So the whole screen
// is encoded, in a form that stays readable in the address bar:
//
//   ?view=results&q=pharma&sectors=Technology&ind=Steel
//     &num=roce:18..,revenue:500..3000,totalDebt:..41
//     &bands=roce:excellent,marketCap:mid|large
//
// Encoding rules: `min..max` with either side omissible, `|` separates the
// values of a multi-select bucket, `,` separates entries. Decoding is total --
// anything malformed is skipped rather than thrown, because a hand-edited or
// truncated URL must degrade to a wider screen, never to a crash.
// ---------------------------------------------------------------------------

import {
  type ScreenFilters,
  type NumericFieldKey,
  type NumericConstraint,
  NUMERIC_FIELD_KEYS,
  MAX_QUERY_LENGTH,
  isUsableNumber,
  makeScreen,
} from "@/lib/screener"
import {
  type BucketFilters,
  type Weights,
  DEFAULT_BUCKET_FILTERS,
  DEFAULT_WEIGHTS,
  BUCKET_FIELDS,
  FACTOR_KEYS,
} from "@/lib/dealscope-data"

const NUMERIC_KEY_SET = new Set<string>(NUMERIC_FIELD_KEYS)
const MULTI_BUCKET_KEYS = new Set(["marketCap", "promoterPledge"])
const BUCKET_KEYS = new Set(BUCKET_FIELDS.map((f) => f.key as string))

function encodeNumeric(numeric: ScreenFilters["numeric"]): string {
  const parts: string[] = []
  for (const key of NUMERIC_FIELD_KEYS) {
    const c = numeric[key]
    if (!c || (c.min == null && c.max == null)) continue
    parts.push(`${key}:${c.min ?? ""}..${c.max ?? ""}`)
  }
  return parts.join(",")
}

function decodeNumeric(raw: string): Partial<Record<NumericFieldKey, NumericConstraint>> {
  const out: Partial<Record<NumericFieldKey, NumericConstraint>> = {}
  if (!raw) return out
  for (const entry of raw.split(",")) {
    const [key, range] = entry.split(":")
    if (!key || !range || !NUMERIC_KEY_SET.has(key)) continue
    const [lo, hi] = range.split("..")
    const c: NumericConstraint = {}
    const min = Number(lo)
    const max = Number(hi)
    if (lo !== "" && lo != null && isUsableNumber(min)) c.min = min
    if (hi !== "" && hi != null && isUsableNumber(max)) c.max = max
    if (c.min != null || c.max != null) out[key as NumericFieldKey] = c
  }
  return out
}

function encodeBands(buckets: BucketFilters): string {
  const parts: string[] = []
  for (const [key, sel] of Object.entries(buckets)) {
    if (key === "industry") continue // carried in `ind`, not here
    if (Array.isArray(sel)) {
      if (sel.length > 0) parts.push(`${key}:${sel.join("|")}`)
    } else if (typeof sel === "string" && sel) {
      parts.push(`${key}:${sel}`)
    }
  }
  return parts.join(",")
}

function decodeBands(raw: string, industries: string[]): BucketFilters {
  const out: BucketFilters = { ...DEFAULT_BUCKET_FILTERS, industry: industries }
  if (!raw) return out
  for (const entry of raw.split(",")) {
    const [key, value] = entry.split(":")
    if (!key || !value || !BUCKET_KEYS.has(key)) continue
    // Only real band keys: anything else was shown verbatim as a filter chip.
    const known = new Set(BUCKET_FIELDS.find((f) => f.key === key)?.buckets.map((b) => b.key))
    if (MULTI_BUCKET_KEYS.has(key)) {
      ;(out as unknown as Record<string, string[]>)[key] = [...new Set(value.split("|"))].filter((v) => known.has(v))
    } else if (known.has(value)) {
      ;(out as unknown as Record<string, string>)[key] = value
    }
  }
  return out
}

const LIST_SEP = "~"
/** Enough for every industry at once. */
const MAX_LIST_LENGTH = 8000
const MAX_TICKER_LENGTH = 32

/** Sector and industry names contain commas ("Metals, Mining & Materials") and
 *  ampersands, so a comma-joined list would corrupt them on the way back. `~`
 *  never appears in either vocabulary. */
function encodeList(values: string[]): string {
  return values.join(LIST_SEP)
}
function decodeList(raw: string): string[] {
  return raw ? raw.slice(0, MAX_LIST_LENGTH).split(LIST_SEP).filter(Boolean) : []
}

/** `w=40-20-20-20`, in FACTOR_KEYS order, omitted at the defaults. Without it
 *  a shared link showed different scores and ranks from the sender's screen. */
function encodeWeights(weights: Weights | undefined): string {
  if (!weights || FACTOR_KEYS.every((k) => weights[k] === DEFAULT_WEIGHTS[k])) return ""
  return FACTOR_KEYS.map((k) => weights[k]).join("-")
}

function decodeWeights(raw: string): Weights {
  if (!/^\d{1,3}(-\d{1,3}){3}$/.test(raw)) return { ...DEFAULT_WEIGHTS }
  const values = raw.split("-").map(Number)
  if (values.some((v) => v > 100) || values.every((v) => v === 0)) return { ...DEFAULT_WEIGHTS }
  return Object.fromEntries(FACTOR_KEYS.map((k, i) => [k, values[i]])) as unknown as Weights
}

export interface UrlState {
  view: "landing" | "results" | "detail"
  ticker: string | null
  screen: ScreenFilters
  weights?: Weights
}

/** Serialize to a stable, comparable query string. Key order is fixed so two
 *  equal screens always produce byte-identical strings -- that's what lets the
 *  caller cheaply detect "the URL already matches, don't write it again" and
 *  avoid a replace/read feedback loop. */
export function encodeUrlState(state: UrlState): string {
  const sp = new URLSearchParams()
  // Tear sheets use view=detail, not view=results. Writing "results" while a
  // ticker was present made a shareable sheet look like a results URL and
  // left a leftover view=results after the ticker was cleared.
  if (state.view === "results") sp.set("view", "results")
  if (state.view === "detail") sp.set("view", "detail")
  const s = state.screen
  if (s.text.trim()) sp.set("q", s.text.trim())
  if (s.sectors.length) sp.set("sectors", encodeList(s.sectors))
  if (s.industries.length) sp.set("ind", encodeList(s.industries))
  const num = encodeNumeric(s.numeric)
  if (num) sp.set("num", num)
  const bands = encodeBands(s.buckets)
  if (bands) sp.set("bands", bands)
  // Ticker only belongs on a tear sheet. Results and landing must not keep it.
  const ticker = state.view === "detail" ? state.ticker?.trim() : null
  if (ticker) sp.set("ticker", ticker)
  const w = encodeWeights(state.weights)
  if (w) sp.set("w", w)
  return sp.toString()
}

/** Total inverse of encodeUrlState. Never throws. */
export function decodeUrlState(sp: URLSearchParams): UrlState {
  const ticker = (sp.get("ticker") ?? "").trim().slice(0, MAX_TICKER_LENGTH) || null
  const industries = decodeList(sp.get("ind") ?? "")
  const screen = makeScreen({
    text: (sp.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    sectors: decodeList(sp.get("sectors") ?? ""),
    industries,
    numeric: decodeNumeric(sp.get("num") ?? ""),
    buckets: decodeBands(sp.get("bands") ?? "", industries),
  })
  const viewParam = sp.get("view")
  let view: UrlState["view"]
  if (ticker) {
    view = "detail"
  } else if (viewParam === "results" || viewParam === "detail") {
    // view=detail without a ticker cannot show a sheet; degrade to results.
    view = "results"
  } else {
    view = "landing"
  }
  return { view, ticker, screen, weights: decodeWeights(sp.get("w") ?? "") }
}

/** Drop unknown keys and rewrite legacy view=results&ticker=… sheet links. */
export function canonicalizeUrlState(sp: URLSearchParams): string {
  return encodeUrlState(decodeUrlState(sp))
}
