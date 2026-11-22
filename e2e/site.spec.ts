import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { open, searchBox } from "./helpers"

const BASE = "https://dealscope-screener.vercel.app"
const PAGES = ["/", "/about", "/privacy", "/terms", "/disclaimer"]

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false })
  for (const path of PAGES) {
    test(`${path} is fully server-rendered`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await expect(page.getByRole("main")).toHaveCount(1)
      await expect(page.getByRole("contentinfo")).toContainText("Not investment advice")
    })
  }
})

for (const path of PAGES) {
  test(`${path} declares itself, not the homepage`, async ({ page }) => {
    await page.goto(path)
    const url = path === "/" ? BASE : `${BASE}${path}`
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`^${url}/?$`))
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", new RegExp(`^${url}/?$`))
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/)
    for (const json of await page.locator('script[type="application/ld+json"]').allTextContents()) {
      expect(JSON.parse(json)["@context"]).toBe("https://schema.org")
    }
    await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0)
  })
}

test("robots, sitemap and manifest", async ({ request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain(`Sitemap: ${BASE}/sitemap.xml`)
  const sitemap = await (await request.get("/sitemap.xml")).text()
  for (const path of PAGES.slice(1)) expect(sitemap).toContain(`<loc>${BASE}${path}</loc>`)
  expect((await request.get("/manifest.webmanifest")).ok()).toBe(true)
})

test("unknown addresses are a branded, noindex 404", async ({ page }) => {
  const response = await page.goto("/no-such-page")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/page not found/i)
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/)
})

test("a failed data load offers a working retry", async ({ page }) => {
  await page.route("**/data/universe", (route) => route.fulfill({ status: 500 }))
  await page.goto("/?view=results")
  await expect(page.getByRole("heading", { name: /data unavailable/i })).toBeVisible()
  await page.unroute("**/data/universe")
  await page.getByRole("button", { name: "Retry" }).click()
  await expect(page.getByRole("article").first()).toBeVisible()
})

test("a failed tear-sheet load offers a working retry", async ({ page }) => {
  await page.route("**/data/company/*", (route) => route.fulfill({ status: 500 }))
  await page.goto("/?view=detail&ticker=TCS")
  await expect(page.getByText("Filings and news could not be loaded.")).toBeVisible()
  await page.unroute("**/data/company/*")
  await page.getByRole("button", { name: "Retry" }).first().click()
  await expect(page.getByText("Filings and news could not be loaded.")).toHaveCount(0)
})

// The privacy policy makes these promises.
test("no cookies, no third parties, nothing typed is sent", async ({ page, context, baseURL }) => {
  const urls: string[] = []
  page.on("request", (request) => urls.push(request.url() + (request.postData() ?? "")))
  await open(page)
  await searchBox(page).fill("secretquery")
  await searchBox(page).press("Enter")
  await expect(page).toHaveURL(/q=secretquery/)
  await page.waitForLoadState("networkidle")
  expect(await context.cookies()).toEqual([])
  expect(urls.filter((u) => !u.startsWith(baseURL!) && !u.startsWith("data:"))).toEqual([])
  expect(urls.filter((u) => u.includes("secretquery"))).toEqual([])
})

// The backend watchdog reads the live page with this exact pattern.
test("the watchdog can read the dates from the HTML", async ({ request }) => {
  const meta = JSON.parse(readFileSync("data/dataset-meta.json", "utf8"))
  const html = await (await request.get("/")).text()
  const match = html.match(/Prices as of (\d{1,2}) ([A-Z][a-z]{2}) (\d{4})\. Fundamentals as of (\d{1,2}) ([A-Z][a-z]{2}) (\d{4})/)
  expect(match?.[3]).toBe(meta.prices_as_of.slice(0, 4))
})
