// Is this typed query a company lookup rather than a screen?
//
// Company names are full of screening words (Tata STEEL, Sun PHARMA, HDFC
// BANK, POWER Grid). Parsed as screens, 532 of ~2,400 companies' own names
// became filters and 127 of those companies vanished from their own search.

import { type Company, normalizeName, normalizeForSearch, TICKER_NICKNAMES } from "@/lib/dealscope-data"
import { parseQuery } from "@/lib/query-parser"

const NAME_INDEX = new WeakMap<Company[], { ticker: string; name: string }[]>()

function nameIndex(companies: Company[]) {
  let index = NAME_INDEX.get(companies)
  if (!index) {
    index = companies.map((c) => ({ ticker: normalizeForSearch(c.ticker), name: normalizeName(c.name) }))
    NAME_INDEX.set(companies, index)
  }
  return index
}

export function isCompanyLookup(companies: Company[], text: string): boolean {
  const q = normalizeName(text)
  if (!q) return false
  // "<" and ">" vanish in normalising, and only ever mean a screen.
  if (/[<>]/.test(text)) return false

  const index = nameIndex(companies)
  if (TICKER_NICKNAMES[q] || index.some((c) => c.ticker === q || c.name === q)) return true

  // A partial name needs a word that isn't screening vocabulary, so "pharma"
  // and "high" stay screens while "sun pharma" and "tata steel" are lookups.
  const { filters } = parseQuery(text)
  if (!filters.text || Object.keys(filters.numeric).length > 0) return false
  return index.some((c) => c.name.startsWith(q) || c.ticker.startsWith(q))
}
