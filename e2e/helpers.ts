import type { Page } from "@playwright/test"

export async function open(page: Page, path = "/") {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
}

export const searchBox = (page: Page) => page.getByRole("textbox", { name: "Search company or ticker" })

/** A result row opens the company's tear sheet. */
export const resultRows = (page: Page) => page.getByRole("article")

/** Views crossfade, so briefly there can be two; the incoming one is last. */
export const pageTitle = (page: Page) => page.getByRole("heading", { level: 1 }).last()
