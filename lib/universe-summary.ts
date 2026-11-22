import { EXAMPLE_SCREENS, type ExampleScreen } from "@/lib/example-screens"
import type { IndustryGroup, Sector } from "@/lib/dealscope-data"
import { parseQuery } from "@/lib/query-parser"
import { countScreen } from "@/lib/screener"
import { getCompanies, getDeals } from "@/lib/universe"

/** Everything the landing page shows before any company data is downloaded. */
export interface UniverseSummary {
  totalCount: number
  dealCount: number
  unclassifiedCount: number
  sectors: Sector[]
  industryGroups: IndustryGroup[]
  screens: { screen: ExampleScreen; count: number }[]
}

export function getUniverseSummary(): UniverseSummary {
  const { companies, sectors, industryGroups } = getCompanies()
  return {
    totalCount: companies.length,
    dealCount: getDeals().length,
    unclassifiedCount: sectors.find((s) => s.name === "Unclassified")?.count ?? 0,
    sectors,
    industryGroups,
    // Same parser + screener as the search bar, so a card can never advertise a
    // number the results page wouldn't return.
    screens: EXAMPLE_SCREENS.map((screen) => ({
      screen,
      count: countScreen(companies, parseQuery(screen.query).filters),
    })),
  }
}
