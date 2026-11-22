// The AI company summaries were written in August and quote that month's
// financials: 1,608 of 2,216 do, and 204 of the 262 checkable revenue figures
// contradicted the live number. What a company does ages well and a figure
// doesn't, so every sentence stating one is dropped. The tear sheet shows the
// live figures directly above.

const FINANCIAL_CLAIM = new RegExp(
  [
    "₹",
    "\\bINR\\b",
    "\\bRs\\.?\\s?\\d",
    "\\bUS\\$|\\$\\s?\\d",
    "\\d\\s?%",
    "\\bper ?cent\\b",
    "\\bcrores?\\b",
    "\\d\\s?Cr\\b",
    "\\blakhs?\\b",
    "\\d\\s?(million|billion|trillion)\\b",
    "\\d(\\.\\d+)?x\\b",
    "percentile",
    "\\d/100",
    "\\bEBITDA\\b",
    "\\bROCE\\b",
    "\\bROE\\b",
    "market cap",
    "total debt",
    "composite score",
    "pledge",
    "net (income|profit|loss)",
    "debt-free",
  ].join("|"),
  "i",
)

const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z0-9"'“₹])/

export function quotesFinancials(text: string): boolean {
  return FINANCIAL_CLAIM.test(text)
}

export function descriptiveSummary(text: string | null): string | null {
  if (!text) return null
  const kept = text
    .split(SENTENCE_BREAK)
    .filter((sentence) => !quotesFinancials(sentence))
    .join(" ")
    .trim()
  return kept.length >= 25 ? kept : null
}
