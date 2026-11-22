// "Why this score", written from the numbers on screen.
//
// The stored AI rationales were generated in August and quote that snapshot:
// 410 of the 451 that state a score contradicted the live one. This can't
// drift, and it follows the user's weights.

import { type Company, type Weights, FACTOR_LABELS, MIN_POPULATED_FACTORS, computeScore } from "@/lib/dealscope-data"

export function ordinal(n: number): string {
  const teens = n % 100 >= 11 && n % 100 <= 13
  return `${n}${teens ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th")}`
}

function listWords(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

export function scoreRationale(company: Company, weights: Weights): string {
  if (company.sector === "Unclassified") {
    return "This company has no sector classification, so it is not ranked against peers or given a score."
  }
  const present = FACTOR_LABELS.flatMap((f) => {
    const value = company.factors[f.key]
    return value == null ? [] : [{ ...f, value }]
  })
  const missing = FACTOR_LABELS.filter((f) => company.factors[f.key] == null).map((f) =>
    f.key === "debtLevel" && company.sector === "Financial Services"
      ? `${f.label.toLowerCase()} (not scored for Financial Services)`
      : f.label.toLowerCase(),
  )
  const leftOut = missing.length ? ` Left out: ${listWords(missing)}.` : ""
  const counted = present.filter((f) => weights[f.key] > 0)
  const score = computeScore(company.factors, weights)

  if (present.length < MIN_POPULATED_FACTORS) {
    return `Not scored: a composite needs at least ${MIN_POPULATED_FACTORS} reported factors and this company has ${present.length}.${leftOut}`
  }
  if (score == null) {
    return "Not scored with the current weights: every reported factor is weighted at zero."
  }

  const ranked = [...counted].sort((a, b) => b.value - a.value)
  const parts = ranked.map((f) => `${f.label.toLowerCase()} at the ${ordinal(f.value)} percentile`)
  return `The composite is ${score}/100, the weighted average of ${listWords(parts)} within ${company.sector}.${leftOut}`
}
