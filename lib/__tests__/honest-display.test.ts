import { expect, test } from "vitest"
import { displayDay, safeHref, valuationNotes } from "../display"
import { buildCompsCsv } from "../export-comps-csv"
import { DEFAULT_WEIGHTS, type Weights, computeScore, mapCompanyRecord } from "../dealscope-data"
import { scoreRationale } from "../score-rationale"
import { makeScreen } from "../screener"
import { decodeUrlState, encodeUrlState } from "../url-state"
import { COMPANY_RECORDS, getCompanies } from "../universe"

const { companies } = getCompanies()
const record = { ...COMPANY_RECORDS[0] }

test("a feed placeholder is never shown or scored as a 0% margin", () => {
  const c = mapCompanyRecord({ ...record, ebitda: null, ebitda_margin_pct: 0, factor_ebitda_margin: 36.5 })
  expect([c.metrics.ebitdaMargin, c.raw.ebitdaMargin, c.factors.ebitdaMargin]).toEqual(["N/A", null, null])
})

test("no P/E on losses", () => {
  const c = mapCompanyRecord({ ...record, net_income: -5e8, trailing_pe: 12 })
  expect([c.financials.peRatio, c.raw.peRatio]).toEqual(["N/A", null])
})

test("money: tiny is not nil, negatives read naturally", () => {
  expect(mapCompanyRecord({ ...record, revenue: 20000 }).metrics.revenue).toBe("< ₹1 Cr")
  expect(mapCompanyRecord({ ...record, revenue: 0 }).metrics.revenue).toBe("₹0 Cr")
  expect(mapCompanyRecord({ ...record, free_cash_flow: -280e7 }).financials.freeCashFlow).toBe("-₹280 Cr")
})

test.each<[string, Weights]>([
  ["default", DEFAULT_WEIGHTS],
  ["custom", { revenueGrowth: 70, ebitdaMargin: 10, roce: 20, debtLevel: 0 }],
])("the rationale quotes the score on screen for every company (%s weights)", (_, weights) => {
  const wrong = companies.filter((c) => {
    const score = c.sector === "Unclassified" ? null : computeScore(c.factors, weights)
    const text = scoreRationale(c, weights)
    return score == null ? text.includes("composite is") : !text.includes(`composite is ${score}/100`)
  })
  expect(wrong.map((c) => c.ticker)).toEqual([])
})

test("every unavailable valuation explains itself without backend field names", () => {
  for (const c of companies) {
    const notes = valuationNotes(c)
    if (c.valuation.evEbitda === "N/A") expect(notes.evEbitda).toBeTruthy()
    if (c.valuation.peImplied === "N/A") expect(notes.pe).toBeTruthy()
    expect(`${notes.evEbitda}${notes.pe}`).not.toMatch(/net_income|own ebitda/)
  }
})

test("weights survive a shared link", () => {
  const weights = { revenueGrowth: 100, ebitdaMargin: 25, roce: 0, debtLevel: 25 }
  const qs = encodeUrlState({ view: "results", ticker: null, screen: makeScreen(), weights })
  expect(decodeUrlState(new URLSearchParams(qs)).weights).toEqual(weights)
  expect(decodeUrlState(new URLSearchParams("w=0-0-0-0")).weights).toEqual(DEFAULT_WEIGHTS)
})

test("feed links and dates", () => {
  expect(safeHref("javascript:alert(1)")).toBeNull()
  expect(safeHref("https://example.com")).toBe("https://example.com")
  expect(displayDay("29-Jun-2026 20:53")).toBe("29 Jun 2026")
})

test("CSV text can't be a formula, numbers keep their sign", () => {
  const company = { ...companies[0], name: "=HYPERLINK(1)", raw: { ...companies[0].raw, netIncome: -12 } }
  const csv = buildCompsCsv([company], DEFAULT_WEIGHTS)
  expect(csv).toContain("'=HYPERLINK(1)")
  expect(csv).toContain(",-12.00,")
})
