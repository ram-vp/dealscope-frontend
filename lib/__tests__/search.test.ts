import { expect, test } from "vitest"
import { isCompanyLookup } from "../company-lookup"
import { DEFAULT_WEIGHTS, normalizeName } from "../dealscope-data"
import { parseQuery, screenFromTypedQuery } from "../query-parser"
import { makeScreen, runScreen } from "../screener"
import { getCompanies } from "../universe"

const { companies } = getCompanies()

/** Exactly what the app does with typed text. */
function search(text: string) {
  const screen = isCompanyLookup(companies, text)
    ? makeScreen({ text: text.trim() })
    : screenFromTypedQuery(text, makeScreen())
  return runScreen(companies, screen, DEFAULT_WEIGHTS).results
}

const tickers = (text: string) => search(text).map((c) => c.ticker)

test("every company is the first result for its own ticker", { timeout: 120_000 }, () => {
  const wrong = companies.filter((c) => search(c.ticker)[0]?.ticker !== c.ticker).map((c) => c.ticker)
  // A ticker that is also another company's exact name or nickname may tie.
  expect(wrong.filter((t) => !tickers(t).slice(0, 2).includes(t))).toEqual([])
})

test("every company is found by its own name, above anything looser", { timeout: 120_000 }, () => {
  const wrong = companies.filter((c) => {
    const at = search(c.name).findIndex((r) => r.ticker === c.ticker)
    const sameName = companies.filter((o) => normalizeName(o.name) === normalizeName(c.name)).length
    return at < 0 || at >= sameName
  })
  expect(wrong.map((c) => c.name)).toEqual([])
})

test.each([
  ["M&M", "M&M"],
  ["l&t", "LT"],
  ["lt", "LT"],
  ["sbi", "SBIN"],
  ["tata steel", "TATASTEEL"],
  ["hdfc bank", "HDFCBANK"],
  ["power grid", "POWERGRID"],
  ["relaince", "RELIANCE"],
  ["reliance", "RELIANCE"],
])("%s finds %s first", (text, ticker) => {
  expect(tickers(text)[0]).toBe(ticker)
})

test("sun pharma is a company, pharma is a screen", () => {
  expect(tickers("sun pharma")).toContain("SUNPHARMA")
  expect(tickers("sun pharma").length).toBeLessThan(5)
  expect(isCompanyLookup(companies, "pharma")).toBe(false)
})

test.each([
  "high",
  "high margin pharma",
  "industrials roce over 20",
  "banks high roe",
  "steel companies with low leverage",
  "FMCG",
])("%s stays a screen", (text) => {
  expect(isCompanyLookup(companies, text)).toBe(false)
})

test("nonsense finds nothing instead of the whole universe", () => {
  expect(search("zzzzqqq")).toEqual([])
})

test("a typed screen still returns the screen's companies", () => {
  expect(search("high roce high roe")).toEqual(
    runScreen(companies, parseQuery("high roce high roe").filters, DEFAULT_WEIGHTS).results,
  )
})
