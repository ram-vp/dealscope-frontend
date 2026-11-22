import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { open, pageTitle, resultRows, searchBox } from "./helpers"

test("search by ticker, open the tear sheet, come back and go forward", async ({ page }) => {
  await open(page)
  await searchBox(page).fill("TCS")
  await searchBox(page).press("Enter")
  await expect(page).toHaveURL(/view=results.*q=tcs/i)
  await resultRows(page).filter({ hasText: "Tata Consultancy" }).getByRole("link").click()
  await expect(page).toHaveURL(/view=detail.*ticker=TCS/)
  await expect(pageTitle(page)).toContainText(/tata consultancy/i)

  await page.goBack()
  await expect(page).toHaveURL(/view=results/)
  await expect(searchBox(page)).toHaveValue(/tcs/i)
  await page.goForward()
  await expect(pageTitle(page)).toContainText(/tata consultancy/i)
})

test("a typed screen becomes removable chips", async ({ page }) => {
  await open(page)
  await searchBox(page).fill("industrials roce over 20")
  await searchBox(page).press("Enter")
  await expect(page).toHaveURL(/num=roce/)
  const chip = page.getByRole("button", { name: /remove filter: .*roce/i })
  await chip.click()
  await expect(chip).toHaveCount(0)
  await expect(page).not.toHaveURL(/num=roce/)
  await expect(page).toHaveURL(/sectors=Industrials/)
})

test("sector pill on the landing page carries into results", async ({ page }) => {
  await open(page)
  await page.getByRole("button", { name: /^Financial Services/ }).first().click()
  await expect(page).toHaveURL(/sectors=Financial/)
  await page.getByRole("button", { name: /^Screen\b/ }).click()
  await expect(page).toHaveURL(/view=results/)
  await expect(page.getByRole("button", { name: /^Financial Services/ }).first()).toHaveAttribute("aria-pressed", "true")
  await expect(resultRows(page).first()).toContainText(/financial services/i)
})

test("industry browser narrows the screen", async ({ page }) => {
  await open(page, "/?view=results")
  await page.getByRole("button", { name: /Browse Industries/i }).click()
  await page.getByPlaceholder(/Search \d+ industries/).fill("steel")
  await page.getByRole("button", { name: /^Steel/ }).click()
  await expect(page).toHaveURL(/ind=Steel/)
  await expect(resultRows(page).first()).toContainText(/steel/i)
})

test("filters drawer applies a band", async ({ page }) => {
  await open(page, "/?view=results")
  await page.getByRole("button", { name: /^Filters/ }).click()
  const drawer = page.getByRole("dialog", { name: /filters/i })
  await drawer.getByRole("button", { name: /^Elevated\s*> 10%/ }).click()
  await drawer.getByRole("button", { name: /View [\d,]+ Match/i }).click()
  await expect(drawer).toBeHidden()
  await expect(page).toHaveURL(/bands=promoterPledge/)
})

test("filters from the landing page open results", async ({ page }) => {
  await open(page)
  await page.getByRole("button", { name: /Quantitative Filters/i }).click()
  const drawer = page.getByRole("dialog", { name: /filters/i })
  await drawer.getByRole("button", { name: /^Elevated\s*> 10%/ }).click()
  await drawer.getByRole("button", { name: /View [\d,]+ Match/i }).click()
  await expect(page).toHaveURL(/view=results/)
  await expect(page).toHaveURL(/bands=promoterPledge/)
})

test("weights re-rank the results", async ({ page }) => {
  await open(page, "/?view=results")
  const order = async () => (await resultRows(page).getByRole("heading").allTextContents()).slice(0, 20).join("|")
  await expect(resultRows(page).first()).toBeVisible()
  const before = await order()
  await page.getByRole("button", { name: /^Weights/ }).click()
  const drawer = page.getByRole("dialog", { name: /weight/i })
  await drawer.getByRole("slider", { name: /Revenue Growth/ }).fill("100")
  await drawer.getByRole("button", { name: /Apply Weights/i }).click()
  await expect.poll(order).not.toBe(before)
})

test("CSV export matches the filtered list", async ({ page }) => {
  await open(page, "/?view=results&ind=Steel")
  const heading = await page.getByRole("heading", { level: 1 }).innerText()
  const count = Number(heading.match(/[\d,]+/)![0].replace(/,/g, ""))
  const downloading = page.waitForEvent("download")
  await page.getByRole("button", { name: /Export.*CSV/i }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toMatch(/^DealScope_Comps_.*\d{8}\.csv$/)
  const lines = readFileSync(await download.path(), "utf8").trim().split(/\r?\n/)
  expect(lines[0].split(",")).toHaveLength(30)
  expect(lines).toHaveLength(count + 1)
})

test("show all reveals every result", async ({ page }) => {
  await open(page, "/?view=results&sectors=Financial+Services")
  await expect(resultRows(page)).toHaveCount(60)
  await page.getByRole("button", { name: /Show all/i }).click()
  await expect.poll(() => resultRows(page).count()).toBeGreaterThan(60)
})

test("example screens open results", async ({ page }) => {
  await open(page)
  await page.getByRole("button", { name: /High Margin Pharma/i }).click()
  await expect(page).toHaveURL(/view=results/)
  await expect(resultRows(page).first()).toBeVisible()
})

test("shared links, including legacy ones, restore the screen", async ({ page }) => {
  await open(page, "/?view=results&ticker=M%26M")
  await expect(pageTitle(page)).toContainText(/mahindra/i)
  await open(page, "/?view=results&num=roce:25..&sectors=Metals%2C+Mining+%26+Materials")
  await expect(page.getByRole("button", { name: /remove filter: .*roce/i })).toBeVisible()
  await expect(resultRows(page).first()).toContainText(/metals/i)
})

test("an unknown ticker degrades to results", async ({ page }) => {
  await open(page, "/?view=detail&ticker=NOT-A-TICKER")
  await expect(resultRows(page).first()).toBeVisible()
})

test("tear sheet loads the narrative and links between peers", async ({ page }) => {
  await open(page, "/?view=detail&ticker=RELIANCE")
  await expect(page.getByText(/Reliance Industries .{60,}/).first()).toBeVisible()
  const title = pageTitle(page)
  const before = await title.innerText()
  await page.locator('main a[href*="ticker="]').first().click()
  await expect(title).not.toHaveText(before)
})

test("no results offers a way out", async ({ page }) => {
  await open(page, "/?view=results&num=roce:99999..")
  await expect(page.getByText(/No companies match all active filters/i)).toBeVisible()
  await page.getByRole("button", { name: /Clear all filters/i }).click()
  await expect(resultRows(page).first()).toBeVisible()
})

test("the logo returns home from a tear sheet", async ({ page }) => {
  await open(page, "/?view=detail&ticker=TCS")
  await page.getByRole("link", { name: "DealScope home" }).first().click()
  await expect(page).toHaveURL(/\/$/)
  await expect(pageTitle(page)).toContainText(/dealscope/i)
})

test("theme choice survives a reload", async ({ page }) => {
  await open(page)
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: /Switch to Light mode/i }).click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
})

test("M&M finds Mahindra and nonsense finds nothing", async ({ page }) => {
  await open(page)
  await searchBox(page).fill("M&M")
  await searchBox(page).press("Enter")
  await expect(resultRows(page).first()).toContainText(/mahindra/i)
  await searchBox(page).fill("zzzzqqq")
  await expect(resultRows(page)).toHaveCount(0)
  await expect(pageTitle(page)).toContainText(/^0 compan/i)
})

test("a company name containing a screening word finds the company", async ({ page }) => {
  await open(page)
  await searchBox(page).fill("tata steel")
  await searchBox(page).press("Enter")
  await expect(resultRows(page).first()).toContainText(/tata steel/i)
})

test("changing a band keeps an industry that was typed", async ({ page }) => {
  await open(page, "/?view=results")
  await searchBox(page).fill("pharma high margin")
  await expect(page.getByRole("button", { name: /remove filter: drug manufacturers - general/i })).toBeVisible()
  await page.getByRole("button", { name: /^Filters/ }).click()
  const drawer = page.getByRole("dialog", { name: /filters/i })
  await drawer.getByRole("button", { name: /^None\s*0%/ }).click()
  await drawer.getByRole("button", { name: /View [\d,]+ Match/i }).click()
  await expect(page).toHaveURL(/ind=Drug/)
})

test("weights travel with the link", async ({ page }) => {
  await open(page, "/?view=results&w=100-0-0-0")
  await page.getByRole("button", { name: /^Weights/ }).click()
  await expect(page.getByRole("slider", { name: /Revenue Growth/ })).toHaveValue("100")
})

test("lower-case ticker links open the tear sheet", async ({ page }) => {
  await open(page, "/?view=detail&ticker=tcs")
  await expect(pageTitle(page)).toContainText(/tata consultancy/i)
})

test("an unknown pledge is not reported as unencumbered", async ({ page }) => {
  const companies: { ticker: string; promoter_pledge_pct: number | null }[] = JSON.parse(
    readFileSync("data/companies.json", "utf8"),
  )
  const unknown = companies.find((c) => c.promoter_pledge_pct === null)
  test.skip(!unknown, "every company has pledge data")
  await open(page, `/?view=detail&ticker=${encodeURIComponent(unknown!.ticker)}`)
  await expect(page.getByText("Pledge data is not available for this company")).toBeVisible()
  await expect(page.getByText("Unencumbered")).toHaveCount(0)
})
