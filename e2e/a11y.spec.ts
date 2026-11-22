import AxeBuilder from "@axe-core/playwright"
import { type Page, expect, test } from "@playwright/test"
import { open } from "./helpers"

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]

test.use({ contextOptions: { reducedMotion: "reduce" } })

// The original visual design is kept exactly, by the owner's decision, so the
// purely visual rules (colour contrast, target size) are not enforced. Everything
// invisible still is: names, roles, landmarks, headings, focus.
const VISUAL_RULES = ["color-contrast", "target-size"]

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).disableRules(VISUAL_RULES).analyze()
  return violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")} ${v.nodes[0].any[0]?.message ?? ""}`)
}

const VIEWS = [
  "/",
  "/?view=results",
  "/?view=results&num=roce:99999..",
  "/?view=detail&ticker=TCS",
  "/?view=detail&ticker=HDFCBANK",
  "/about",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/no-such-page",
]

for (const theme of ["dark", "light"] as const) {
  test.describe(theme, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("dealscope-theme", value), theme)
    })

    for (const path of VIEWS) {
      test(`axe, no horizontal scroll: ${path}`, async ({ page }) => {
        await open(page, path)
        await page.evaluate(() => document.fonts.ready)
        expect(await violations(page)).toEqual([])

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
        expect(overflow, "horizontal scroll").toBe(false)
      })
    }

    test("axe: both drawers and the industry browser", async ({ page }) => {
      await open(page, "/?view=results")
      await page.getByRole("button", { name: /Browse Industries/i }).click()
      expect(await violations(page)).toEqual([])
      await page.getByRole("button", { name: /^Filters/ }).click()
      await page.waitForTimeout(300)
      expect(await violations(page)).toEqual([])
      await page.keyboard.press("Escape")
      await page.getByRole("button", { name: /^Weights/ }).click()
      await page.waitForTimeout(300)
      expect(await violations(page)).toEqual([])
    })
  })
}

test("skip link moves focus to main", async ({ page }) => {
  await open(page)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("main")).toBeFocused()
})

test("a drawer traps focus, closes on Escape and returns focus", async ({ page }) => {
  await open(page, "/?view=results")
  const trigger = page.getByRole("button", { name: /^Filters/ })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const drawer = page.getByRole("dialog", { name: /filters/i })
  await expect(drawer).toBeVisible()
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press("Tab")
    const escaped = await page.evaluate(() => {
      const el = document.activeElement
      return !!el && el !== document.body && !el.closest("dialog")
    })
    expect(escaped, `focus left the dialog after ${i + 1} tabs`).toBe(false)
  }
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("industry combobox works from the keyboard", async ({ page }) => {
  await open(page, "/?view=results")
  await page.getByRole("button", { name: /^Filters/ }).click()
  const box = page.getByRole("dialog").getByRole("combobox", { name: "Search industries" })
  await box.fill("steel")
  await expect(box).toHaveAttribute("aria-activedescendant", /.+/)
  await box.press("Enter")
  await expect(page).toHaveURL(/ind=Steel/)
})

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const path of ["/", "/?view=results", "/?view=detail&ticker=TCS", "/about"]) {
    await open(page, path)
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(320)
  }
})
