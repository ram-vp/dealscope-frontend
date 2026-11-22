// Wire format for /data/universe.
//
// Columnar, so ~35 key names aren't repeated ~2,400 times, with factor
// percentiles rounded up front (the app only ever uses Math.round of them, and
// 17-digit floats don't compress). 282KB brotli against 617KB for the bundled
// JSON, and JSON.parse is much cheaper than evaluating it as JavaScript.

import type { CompanyRecord, DealRow } from "@/lib/dealscope-data"

// A Record rather than an array so a field added to CompanyRecord is a type
// error here instead of a silently missing column.
const COMPANY_COLUMNS: Record<keyof CompanyRecord, "as-is" | "round"> = {
  ticker: "as-is",
  name: "as-is",
  sector: "as-is",
  sector_display: "as-is",
  ey_bucket: "as-is",
  industry: "as-is",
  sector_raw: "as-is",
  revenue: "as-is",
  ebitda: "as-is",
  ebitda_margin_pct: "as-is",
  revenue_growth_pct: "as-is",
  roce_pct: "as-is",
  total_debt: "as-is",
  market_cap: "as-is",
  net_income: "as-is",
  trailing_pe: "as-is",
  price_to_book: "as-is",
  return_on_equity_pct: "as-is",
  debt_to_equity: "as-is",
  current_ratio: "as-is",
  free_cash_flow: "as-is",
  promoter_holding_pct: "as-is",
  promoter_pledge_pct: "as-is",
  beta: "as-is",
  market_cap_as_of: "as-is",
  factor_revenue_growth: "round",
  factor_ebitda_margin: "round",
  factor_roce: "round",
  factor_debt_level: "round",
  ev_ebitda_low: "as-is",
  ev_ebitda_high: "as-is",
  pe_implied_low: "as-is",
  pe_implied_high: "as-is",
  valuation_note: "as-is",
  as_of_date: "as-is",
}

interface Table {
  keys: string[]
  columns: unknown[][]
}

export interface UniversePayload {
  companies: Table
  deals: Table
}

function toTable(rows: object[], keys: string[], rounded = new Set<string>()): Table {
  const columns = keys.map((key) =>
    rows.map((row) => {
      const value = (row as Record<string, unknown>)[key] ?? null
      return rounded.has(key) && typeof value === "number" ? Math.round(value) : value
    }),
  )
  return { keys, columns }
}

function fromTable<T>({ keys, columns }: Table): T[] {
  const length = columns[0]?.length ?? 0
  return Array.from({ length }, (_, row) => {
    const out: Record<string, unknown> = {}
    for (let k = 0; k < keys.length; k++) out[keys[k]] = columns[k][row]
    return out as T
  })
}

export function encodeUniverse(companies: CompanyRecord[], deals: DealRow[]): UniversePayload {
  const keys = Object.keys(COMPANY_COLUMNS) as (keyof CompanyRecord)[]
  const rounded = new Set<string>(keys.filter((k) => COMPANY_COLUMNS[k] === "round"))
  const dealKeys = Array.from(new Set(deals.flatMap((d) => Object.keys(d))))
  return { companies: toTable(companies, keys, rounded), deals: toTable(deals, dealKeys) }
}

export function decodeUniverse(payload: UniversePayload): { companies: CompanyRecord[]; deals: DealRow[] } {
  return { companies: fromTable(payload.companies), deals: fromTable(payload.deals) }
}
