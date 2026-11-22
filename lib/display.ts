import { formatAsOfDate } from "@/components/dealscope/data-freshness"
import type { Company } from "@/lib/dealscope-data"

/** news.json mixes "2026-07-20" with "29-Jun-2026 20:53". */
export function isoDay(value: string | null | undefined): string | null {
  if (!value) return null
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  if (iso) return iso[1]
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})/.exec(value)
  if (!m) return null
  const month = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[2]) / 3
  if (!Number.isInteger(month) || month < 0) return null
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`
}

export function displayDay(value: string): string {
  const day = isoDay(value)
  return day ? formatAsOfDate(day) : value
}

export function newestFirst<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (isoDay(b.date) ?? "").localeCompare(isoDay(a.date) ?? ""))
}

/** Feed links are untrusted: only http(s) may become an href. */
export function safeHref(link: string): string | null {
  return /^https?:\/\//i.test(link) ? link : null
}

/** valuation_note covers both methods, in backend field names. Give each card
 *  only what is about it, in plain English. */
export function valuationNotes(company: Company): { evEbitda: string | null; pe: string | null } {
  const { note, evEbitda, peImplied } = company.valuation
  if (note.includes("No sector classification")) {
    const text = "No sector classification, so there is no peer group to value against."
    return { evEbitda: text, pe: text }
  }
  return {
    evEbitda: note.includes("debt overhang")
      ? "Floored at ₹0: the peer-implied enterprise value is absorbed by this company's debt (debt overhang)."
      : evEbitda !== "N/A"
        ? null
        : note.includes("EV/EBITDA: insufficient")
          ? "Not available: too few sector peers report positive EBITDA."
          : "Not available: EBITDA is missing or not positive.",
    pe:
      peImplied !== "N/A"
        ? null
        : note.includes("P/E: insufficient")
          ? "Not available: too few sector peers report positive earnings."
          : "Not available: net income is missing or not positive.",
  }
}
