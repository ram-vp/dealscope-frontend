import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { open } from "./helpers"

// What is rendered, against the backend's JSON, with formatting written here
// rather than imported from lib/. One company per sector, plus the awkward ones.
type Row = Record<string, number | string | null>
const rows: Row[] = JSON.parse(readFileSync("data/companies.json", "utf8"))
const picked = new Map<string, Row>()
for (const row of rows) if (!picked.has(row.sector as string)) picked.set(row.sector as string, row)
for (const ticker of ["HDFCBANK", "INFY", "IDEA", "M&M"]) {
  const row = rows.find((r) => r.ticker === ticker)
  if (row) picked.set(ticker, row)
}

function crore(value: unknown): string {
  if (typeof value !== "number") return "N/A"
  const cr = Math.round(value / 1e7)
  if (cr === 0) return value > 0 ? "< ₹1 Cr" : "₹0 Cr"
  return `${cr < 0 ? "-" : ""}₹${Math.abs(cr).toLocaleString("en-IN")} Cr`
}
const fixed = (value: unknown, digits: number, suffix = "") =>
  typeof value === "number" ? value.toFixed(digits) + suffix : "N/A"

for (const row of picked.values()) {
  test(`tear sheet numbers match the source: ${row.ticker}`, async ({ page }) => {
    await open(page, `/?view=detail&ticker=${encodeURIComponent(row.ticker as string)}`)
    const loss = typeof row.net_income === "number" && row.net_income < 1e6
    const placeholder = row.ebitda === null && row.ebitda_margin_pct === 0
    const cards: Record<string, string> = {
      "Market Cap": crore(row.market_cap),
      "Revenue (TTM)": crore(row.revenue),
      "EBITDA Margin": placeholder ? "N/A" : fixed(row.ebitda_margin_pct, 1, "%"),
      ROCE: fixed(row.roce_pct, 1, "%"),
      "Total Debt": crore(row.total_debt),
      "P/E Ratio": loss ? "N/A" : fixed(row.trailing_pe, 1, "x"),
      ROE: fixed(row.return_on_equity_pct, 1, "%"),
      "Debt / Equity": fixed(row.debt_to_equity, 2, "x"),
      "Promoter Pledge": fixed(row.promoter_pledge_pct, 1, "%"),
      "Current Ratio": fixed(row.current_ratio, 2, "x"),
      "Free Cash Flow": crore(row.free_cash_flow),
      Beta: fixed(row.beta, 2),
    }
    for (const [label, value] of Object.entries(cards)) {
      await expect(page.getByTestId(`metric-${label}`), label).toHaveText(value)
    }
  })
}
