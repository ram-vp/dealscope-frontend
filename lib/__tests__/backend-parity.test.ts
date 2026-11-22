// The numbers the site shows, re-derived independently from the backend's
// definitions (src/logic/scoring.py, src/logic/valuation.py, compute_*_bands.py)
// for every company. Deliberately shares no code with lib/: if the export, the
// data bot or the mapping corrupts a number, it fails here.

import { expect, test } from "vitest"
import rawCompanies from "@/data/companies.json"
import rawDeals from "@/data/deals.json"
import filterBands from "@/data/filter-bands.json"
import meta from "@/data/dataset-meta.json"
import sectorBands from "@/data/sector-bands.json"
import { DEFAULT_WEIGHTS, computeScore } from "../dealscope-data"
import { getCompanies } from "../universe"

type Row = Record<string, number | string | boolean | null>
const rows = rawCompanies as unknown as Row[]

const num = (row: Row, key: string): number | null => (typeof row[key] === "number" ? (row[key] as number) : null)
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a))

const bySector = new Map<string, Row[]>()
for (const row of rows) {
  const sector = row.sector as string
  bySector.set(sector, [...(bySector.get(sector) ?? []), row])
}

/** pandas / numpy linear-interpolation quantile. */
function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (sorted.length - 1) * q
  const lo = Math.floor(at)
  return sorted[lo] + (sorted[Math.ceil(at)] - sorted[lo]) * (at - lo)
}

test.each([
  ["revenue_growth_pct", "factor_revenue_growth"],
  ["ebitda_margin_pct", "factor_ebitda_margin"],
  ["roce_pct", "factor_roce"],
])("%s percentiles are the rank inside each sector", (metric, factor) => {
  const wrong: string[] = []
  for (const [sector, group] of bySector) {
    const values = group.flatMap((r) => num(r, metric) ?? [])
    for (const row of group) {
      const v = num(row, metric)
      let expected: number | null = null
      if (v !== null && sector !== "Unclassified") {
        const below = values.filter((x) => x < v).length
        const ties = values.filter((x) => x === v).length
        expected = ((below + (ties + 1) / 2) / values.length) * 100 // rank(pct=True), average ties
      }
      const actual = num(row, factor)
      if (expected === null ? actual !== null : actual === null || !close(expected, actual)) {
        wrong.push(`${row.ticker}: ${actual} != ${expected}`)
      }
    }
  }
  expect(wrong).toEqual([])
})

test.each([
  ["EV/EBITDA", "ebitda", "ev_ebitda"],
  ["P/E", "net_income", "pe_implied"],
])("%s implied ranges are the P25 to P75 sector multiple applied to the company", (_, earnings, out) => {
  const wrong: string[] = []
  for (const [sector, group] of bySector) {
    const debt = (r: Row) => (out === "ev_ebitda" ? (num(r, "total_debt") ?? 0) : 0)
    const peers = group.filter((r) => (num(r, earnings) ?? 0) > 0)
    const multiples = peers.flatMap((r) => {
      const cap = num(r, "market_cap")
      return cap === null ? [] : [(cap + debt(r)) / (num(r, earnings) as number)]
    })
    for (const row of group) {
      const own = num(row, earnings)
      const valued = sector !== "Unclassified" && own !== null && own > 0 && peers.length >= 3 && multiples.length > 0
      for (const [end, q] of [["low", 0.25], ["high", 0.75]] as const) {
        const actual = num(row, `${out}_${end}`)
        const expected = valued ? Math.max(0, own * quantile(multiples, q) - debt(row)) : null
        if (expected === null ? actual !== null : actual === null || !close(expected, actual)) {
          wrong.push(`${row.ticker} ${end}: ${actual} != ${expected}`)
        }
      }
    }
  }
  expect(wrong).toEqual([])
})

const IN_CRORE = new Set(["market_cap", "total_debt", "revenue"])
const COLUMN: Record<string, string> = { return_on_capital_employed_pct: "roce_pct" }
const SECTOR_FIELD: Record<string, string> = {
  roce: "roce_pct",
  roe: "return_on_equity_pct",
  ebitdaMargin: "ebitda_margin_pct",
  revenueGrowth: "revenue_growth_pct",
  totalDebt: "total_debt",
  peRatio: "trailing_pe",
  revenue: "revenue",
  marketCap: "market_cap",
}

/** Winsorised at 1/99, then p25/p50/p75, rounded: what both band scripts publish. */
function expectBand(group: Row[], column: string, band: { p25: number; p50: number; p75: number }, label: string) {
  const scale = IN_CRORE.has(column) ? 1e7 : 1
  const values = group.flatMap((r) => {
    const v = num(r, column)
    return v === null ? [] : [v / scale]
  })
  const lo = quantile(values, 0.01)
  const hi = quantile(values, 0.99)
  const clipped = values.map((v) => Math.min(hi, Math.max(lo, v)))
  const tolerance = scale === 1 ? 0.0501 : 0.501
  for (const p of [25, 50, 75] as const) {
    expect(Math.abs(quantile(clipped, p / 100) - band[`p${p}`]), `${label} p${p}`).toBeLessThanOrEqual(tolerance)
  }
}

test("filter band edges come from the published companies", () => {
  for (const [field, band] of Object.entries(filterBands.fields)) {
    expectBand(rows, COLUMN[field] ?? field, band, field)
  }
})

test("sector band edges come from the published companies", () => {
  for (const [sector, fields] of Object.entries(sectorBands.sectors)) {
    const group = sector === "__all__" ? rows : (bySector.get(sector) ?? [])
    for (const [field, band] of Object.entries(fields)) {
      expectBand("fallback" in band && band.fallback ? rows : group, SECTOR_FIELD[field], band, `${sector} ${field}`)
    }
  }
})

test("leverage is never ranked for Financial Services or Unclassified", () => {
  const ranked = rows.filter(
    (r) => (r.sector === "Financial Services" || r.sector === "Unclassified") && r.factor_debt_level !== null,
  )
  expect(ranked).toEqual([])
})

test("dataset-meta describes the files next to it", () => {
  const count = new Map<string, number>()
  for (const r of rows) count.set(r.as_of_date as string, (count.get(r.as_of_date as string) ?? 0) + 1)
  expect(meta.universe_size).toBe(rows.length)
  expect(meta.deal_count).toBe(rawDeals.length)
  expect(meta.unclassified_count).toBe(bySector.get("Unclassified")?.length ?? 0)
  expect(meta.fundamentals_as_of_counts).toEqual(Object.fromEntries(count))
  expect(meta.prices_as_of).toBe(rows.map((r) => r.market_cap_as_of ?? "").sort().at(-1))
})

test("every number the app maps equals its source", () => {
  const wrong: string[] = []
  getCompanies().companies.forEach((c, i) => {
    const r = rows[i]
    const placeholder = r.ebitda === null && r.ebitda_margin_pct === 0
    const lossOrTiny = typeof r.net_income === "number" && r.net_income < 1e6
    const crore = (key: string) => {
      const v = num(r, key)
      return v === null ? null : v / 1e7
    }
    const expected = {
      marketCap: crore("market_cap"),
      revenue: crore("revenue"),
      ebitda: crore("ebitda"),
      netIncome: crore("net_income"),
      totalDebt: crore("total_debt"),
      freeCashFlow: crore("free_cash_flow"),
      evEbitdaLow: crore("ev_ebitda_low"),
      evEbitdaHigh: crore("ev_ebitda_high"),
      peRatio: lossOrTiny ? null : num(r, "trailing_pe"),
      priceToBook: num(r, "price_to_book"),
      revenueGrowth: num(r, "revenue_growth_pct"),
      ebitdaMargin: placeholder ? null : num(r, "ebitda_margin_pct"),
      roce: num(r, "roce_pct"),
      roe: num(r, "return_on_equity_pct"),
      debtToEquity: num(r, "debt_to_equity"),
      currentRatio: num(r, "current_ratio"),
      promoterHolding: num(r, "promoter_holding_pct"),
      promoterPledge: num(r, "promoter_pledge_pct"),
      beta: num(r, "beta"),
    }
    for (const [key, value] of Object.entries(expected)) {
      const actual = c.raw[key as keyof typeof c.raw]
      if (actual !== value && !(actual === 0 && value === 0)) wrong.push(`${r.ticker} ${key}`)
    }

    const factors = [
      num(r, "factor_revenue_growth"),
      placeholder ? null : num(r, "factor_ebitda_margin"),
      num(r, "factor_roce"),
      num(r, "factor_debt_level"),
    ].flatMap((v) => (v === null ? [] : [Math.round(v)]))
    const score = factors.length < 2 ? null : Math.round(factors.reduce((a, b) => a + b, 0) / factors.length)
    if (computeScore(c.factors, DEFAULT_WEIGHTS) !== score) wrong.push(`${r.ticker} score`)
  })
  expect(wrong).toEqual([])
})
