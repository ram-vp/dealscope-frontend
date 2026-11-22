/**
 * Client-side score blend: missing factors are dropped and the rest reweighted.
 * Matches Python scoring.py: missing is never zero.
 */

import { test } from "vitest"
import {
  computeScore,
  DEFAULT_WEIGHTS,
  formatImpliedEquityRange,
  MIN_POPULATED_FACTORS,
  type FactorScores,
  type Weights,
} from "../dealscope-data"
import { getCompanies } from "../universe"
import { check } from "./check"

const equal: Weights = { revenueGrowth: 25, ebitdaMargin: 25, roce: 25, debtLevel: 25 }

test("Missing Factor 4 is reweighted, never treated as zero", () => {
  const three: FactorScores = { revenueGrowth: 80, ebitdaMargin: 40, roce: 20, debtLevel: null }
  const got = computeScore(three, equal)
  const expected = Math.round((80 * 25 + 40 * 25 + 20 * 25) / 75)
  const ifZero = Math.round((80 * 25 + 40 * 25 + 20 * 25 + 0 * 25) / 100)
  check("3-factor blend uses the remaining weights only", got === expected, `got ${got} expected ${expected}`)
  check("null leverage is not blended in as zero", got !== ifZero, `got ${got} ifZero ${ifZero}`)
})

test("Equal four-factor blend", () => {
  const four: FactorScores = { revenueGrowth: 100, ebitdaMargin: 50, roce: 0, debtLevel: 50 }
  check("four present factors average correctly", computeScore(four, equal) === 50)
})

test("Sparse scores stay blank", () => {
  const one: FactorScores = { revenueGrowth: 100, ebitdaMargin: null, roce: null, debtLevel: null }
  check("one factor is not a score", computeScore(one, equal) === null)
  const two: FactorScores = { revenueGrowth: 100, ebitdaMargin: 0, roce: null, debtLevel: null }
  check("two factors still produce a score (0 is a real value)", computeScore(two, equal) === 50)
  check(`MIN_POPULATED_FACTORS is ${MIN_POPULATED_FACTORS}`, MIN_POPULATED_FACTORS === 2)
})

test("All weights on a missing factor cannot invent a score", () => {
  const fsStyle: FactorScores = { revenueGrowth: 60, ebitdaMargin: 60, roce: 60, debtLevel: null }
  const onlyDebt: Weights = { revenueGrowth: 0, ebitdaMargin: 0, roce: 0, debtLevel: 25 }
  check("FS-style row with only leverage weighted is unscored, not zero", computeScore(fsStyle, onlyDebt) === null)
})

test("Live payload: Financial Services has no Factor 4", () => {
  const { companies } = getCompanies()
  const fs = companies.filter((c) => c.sectorKey === "Financial Services" || c.sector === "Financial Services")
  const fsBlank = fs.filter((c) => c.factors.debtLevel == null)
  check("FS universe is present", fs.length > 0, `n=${fs.length}`)
  check("every FS company has blank Factor 4", fsBlank.length === fs.length, `${fsBlank.length} / ${fs.length}`)
  const scoredFs = fs.filter((c) => computeScore(c.factors, DEFAULT_WEIGHTS) != null)
  check("FS companies can still score on the other three factors", scoredFs.length > 0, `n=${scoredFs.length}`)
})

test("Implied equity is never shown as negative", () => {
  const mixed = formatImpliedEquityRange(-3.036e11, 3.845e12)
  check("negative low end is floored at ₹0", mixed.text.startsWith("₹0 Cr"), `got ${mixed.text}`)
  check("positive high end is kept", mixed.text.includes("3,84,520") || mixed.text.includes("384520") || /₹[1-9]/.test(mixed.text.split("–")[1] ?? ""), `got ${mixed.text}`)
  check("debt overhang is flagged when either end is negative", mixed.debtOverhang)
  const both = formatImpliedEquityRange(-1e10, -8e9)
  check("both-negative range becomes ₹0 – ₹0", both.text === "₹0 Cr – ₹0 Cr", `got ${both.text}`)
  check("both-negative is overhang", both.debtOverhang)
  const fine = formatImpliedEquityRange(1e10, 2e10)
  check("a positive range is not overhang", !fine.debtOverhang)
  const { companies } = getCompanies()
  check("live payload is present", companies.length > 0)
  const negative = companies.filter((c) => c.valuation.evEbitda.includes("-"))
  check("no EV/EBITDA display has a minus sign", negative.length === 0, negative.map((c) => c.ticker).join(", "))
  const floored = companies.filter((c) => c.valuation.evEbitda.startsWith("₹0 Cr") && c.raw.evEbitdaLow === 0)
  // A tiny positive value can round to ₹0, hence the exact-zero condition.
  check("every floored range names debt overhang", floored.every((c) => c.valuation.note.includes("debt overhang")))
})
