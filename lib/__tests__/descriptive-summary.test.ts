import { expect, test } from "vitest"
import { DETAIL_FILES } from "../company-detail-files"
import { descriptiveSummary, quotesFinancials } from "../descriptive-summary"

test("figures go, description stays", () => {
  expect(
    descriptiveSummary("Acme makes industrial pumps for utilities. It reported revenue of ₹2,000 Cr. It exports to Asia."),
  ).toBe("Acme makes industrial pumps for utilities. It exports to Asia.")
  expect(descriptiveSummary("Revenue is ₹0 Cr.")).toBeNull()
})

test("no shipped summary states a financial figure", () => {
  const stale = DETAIL_FILES.flatMap((file) =>
    Object.entries(file)
      .filter(([, details]) => details.narrative.about && quotesFinancials(details.narrative.about))
      .map(([ticker]) => ticker),
  )
  expect(stale).toEqual([])
})

test("most companies still have a summary", () => {
  const entries = DETAIL_FILES.flatMap((file) => Object.values(file))
  expect(entries.filter((e) => e.narrative.about).length).toBeGreaterThan(entries.length * 0.8)
})
