import { expect, test } from "@playwright/test"
import { open } from "./helpers"

test("security headers", async ({ request }) => {
  const headers = (await request.get("/")).headers()
  const csp = headers["content-security-policy"]
  expect(csp).not.toContain("unsafe-eval")
  expect(csp).not.toContain("https:")
  for (const directive of ["script-src-attr 'none'", "frame-ancestors 'none'", "object-src 'none'"]) {
    expect(csp).toContain(directive)
  }
  expect(headers["strict-transport-security"]).toContain("max-age=63072000")
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin")
  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["x-powered-by"]).toBeUndefined()
})

test("security.txt is served and not about to expire", async ({ request }) => {
  const text = await (await request.get("/.well-known/security.txt")).text()
  expect(text).toContain("Contact: mailto:")
  const expires = new Date(text.match(/Expires: (\S+)/)![1]).getTime()
  expect(expires, "renew Expires in public/.well-known/security.txt").toBeGreaterThan(Date.now() + 30 * 86_400_000)
})

test("the image optimizer refuses remote sources and SVG", async ({ request }) => {
  const image = (url: string) => request.get(`/_next/image?url=${encodeURIComponent(url)}&w=64&q=75`)
  expect((await image("https://example.com/a.png")).status()).toBe(400)
  expect((await image("/icon.svg")).status()).toBe(400)
  expect((await image("/apple-icon.png")).status()).toBe(200)
})

for (const path of ["/", "/?view=results", "/?view=detail&ticker=TCS", "/about", "/privacy", "/terms", "/disclaimer"]) {
  test(`no CSP, hydration or console errors: ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      // /_vercel/insights only exists on Vercel.
      if (message.type() === "error" && !message.location().url.includes("/_vercel/insights") && !message.text().includes("/_vercel/insights")) {
        errors.push(message.text())
      }
    })
    await open(page, path)
    expect(errors).toEqual([])
  })
}
