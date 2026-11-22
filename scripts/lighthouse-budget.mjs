// Lighthouse budget against a running production build.
//
//   pnpm build && pnpm start &
//   pnpm lighthouse
//
// Median of three mobile runs. Budgets sit a little under what the site scores,
// so shared-runner noise doesn't fail builds but a real regression does.

import { launch } from "chrome-launcher"
import lighthouse from "lighthouse"
import { chromium } from "@playwright/test"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const RUNS = 3
const BUDGETS = [
  { path: "/", performance: 85, lcp: 3500 },
  { path: "/?view=results", performance: 70, lcp: 5500 },
  { path: "/about", performance: 85, lcp: 3500 },
]
const FLOORS = { accessibility: 100, "best-practices": 95, seo: 100 }
const MAX_CLS = 0.1

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

async function audit(url) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", "--no-first-run"],
  })
  try {
    const { lhr } = await lighthouse(url, { port: chrome.port, logLevel: "error" })
    if (lhr.runtimeError) throw new Error(lhr.runtimeError.message)
    return lhr
  } finally {
    await chrome.kill()
  }
}

/** Chrome occasionally fails to record a trace (NO_NAVSTART). That's not a result. */
async function auditWithRetry(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await audit(url)
    } catch (error) {
      if (attempt === 3) throw error
      console.log(`  retrying ${url}: ${error.message}`)
    }
  }
}

let failed = false
for (const budget of BUDGETS) {
  const runs = []
  for (let i = 0; i < RUNS; i++) runs.push(await auditWithRetry(BASE + budget.path))
  const score = (id) => Math.round(median(runs.map((run) => run.categories[id].score)) * 100)
  const metric = (id) => median(runs.map((run) => run.audits[id].numericValue))

  const checks = [
    ["performance", score("performance"), ">=", budget.performance],
    ["LCP ms", Math.round(metric("largest-contentful-paint")), "<=", budget.lcp],
    ["CLS", +metric("cumulative-layout-shift").toFixed(3), "<=", MAX_CLS],
    ...Object.entries(FLOORS).map(([id, floor]) => [id, score(id), ">=", floor]),
  ]
  console.log(budget.path)
  for (const [name, value, op, limit] of checks) {
    const ok = op === ">=" ? value >= limit : value <= limit
    failed ||= !ok
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} ${value} (${op} ${limit})`)
  }
}
process.exit(failed ? 1 : 0)
