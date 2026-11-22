import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { type Page, expect, test } from "@playwright/test"
import { open, resultRows, searchBox } from "./helpers"

// The audit items, as attacks. Numbers match RESTORE_AND_SECURITY_REPORT.md.

const PAYLOADS = [
  "<img src=x onerror=window.__pwned=1>",
  "<svg/onload=window.__pwned=1>",
  '"><script>window.__pwned=1</script>',
  "javascript:window.__pwned=1",
  "</script><script>window.__pwned=1</script>",
  "{{constructor.constructor('window.__pwned=1')()}}",
]

async function expectInert(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  await expect(page.locator('img[src="x"], svg[onload], [onerror], a[href^="javascript:" i]')).toHaveCount(0)
}

test.describe("1. XSS", () => {
  for (const [i, payload] of PAYLOADS.entries()) {
    test(`search box payload ${i}`, async ({ page }) => {
      await open(page, "/?view=results")
      await searchBox(page).fill(payload)
      await page.waitForTimeout(250)
      await expectInert(page)
    })

    for (const param of ["q", "sectors", "ind", "bands", "ticker", "theme", "view"]) {
      test(`URL ${param} payload ${i}`, async ({ page }) => {
        const value = param === "bands" ? `roce:${payload}` : payload
        await open(page, `/?view=results&${param}=${encodeURIComponent(value)}`)
        await expectInert(page)
      })
    }
  }

  test("hostile company name and sector from the data", async ({ page }) => {
    await page.route("**/data/universe", async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const column = (key: string) => body.companies.columns[body.companies.keys.indexOf(key)]
      const i = column("ticker").indexOf("TCS")
      column("name")[i] = PAYLOADS[0]
      column("industry")[i] = PAYLOADS[1]
      await route.fulfill({ response, json: body })
    })
    await open(page, "/?view=detail&ticker=TCS")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/<IMG SRC=X/i)
    await expectInert(page)
  })

  test("hostile news text, link and AI summary", async ({ page }) => {
    await page.route("**/data/company/*", (route) =>
      route.fulfill({
        json: {
          TCS: {
            narrative: { about: PAYLOADS[2] },
            news: {
              filings: [{ category: PAYLOADS[1], date: "2026-11-20", link: "JaVaScRiPt:window.__pwned=1" }],
              bseNotices: [{ title: PAYLOADS[4], date: "2026-11-20", link: "data:text/html,<script>1</script>" }],
              news: [{ headline: PAYLOADS[0], source: PAYLOADS[5], date: PAYLOADS[1], link: " javascript:void 0" }],
            },
          },
        },
      }),
    )
    await open(page, "/?view=detail&ticker=TCS")
    await expect(page.getByText(PAYLOADS[0], { exact: true })).toBeVisible()
    await expectInert(page)
    await expect(page.locator('a[href^="data:"]')).toHaveCount(0)
  })
})

test.describe("2. IDs in URLs", () => {
  for (const id of ["-1", "256", "1.5", "1e2", "0x10", "..%2F..%2Fpackage.json", "%00", "TCS", "__proto__", "constructor"]) {
    test(`shard ${id} is a plain 404`, async ({ request }) => {
      const response = await request.get(`/data/company/${id}`)
      expect([400, 404]).toContain(response.status())
      expect(await response.text()).not.toMatch(/node_modules|at Object\.|"dependencies"/)
    })
  }

  for (const ticker of ["__proto__", "constructor", "../../etc/passwd", "' OR 1=1 --"]) {
    test(`ticker ${ticker} shows no one's record`, async ({ page }) => {
      await open(page, `/?view=detail&ticker=${encodeURIComponent(ticker)}`)
      await expect(resultRows(page).first()).toBeVisible()
    })
  }
})

test.describe("3. hidden routes", () => {
  const routes = ["/admin", "/admin/login", "/dashboard", "/debug", "/api", "/api/admin", "/api/auth/session", "/graphql",
    "/.env", "/.env.local", "/.git/config", "/.git/HEAD", "/package.json", "/next.config.mjs", "/vercel.json", "/data/companies.json",
    "/_next/mcp", "/__nextjs_original-stack-frames", "/__nextjs_launch-editor", "/server.js", "/.next/BUILD_ID", "/phpinfo.php"]
  for (const route of routes) {
    test(`${route} doesn't exist`, async ({ request }) => {
      expect([400, 403, 404]).toContain((await request.get(route)).status())
    })
  }

  test("no source maps are served", async ({ request, page }) => {
    await open(page)
    const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((el) => el.getAttribute("src")!))
    const chunks = scripts.filter((src) => src.startsWith("/_next/"))
    expect(chunks.length).toBeGreaterThan(0)
    for (const src of chunks) {
      expect((await request.get(`${src.split("?")[0]}.map`)).status()).not.toBe(200)
      expect(await (await request.get(src)).text()).not.toMatch(/sourceMappingURL=(?!data:)\S+\.map/)
    }
  })
})

test("4. no secrets or public env vars in anything the browser gets", async () => {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(js|css|html|rsc|body)$/.test(name)) files.push(path)
    }
  }
  walk(".next/static")
  walk(".next/server/app")
  const secret = new RegExp(
    [
      "AIza[0-9A-Za-z_-]{35}",
      "gsk_[0-9A-Za-z]{40}",
      "csk-[0-9a-z]{40}",
      "sk-ant-[A-Za-z0-9_-]{30}",
      "(ghp|gho|ghs)_[A-Za-z0-9]{36}",
      "github_pat_[A-Za-z0-9_]{50}",
      "AKIA[0-9A-Z]{16}",
      "-----BEGIN [A-Z ]*PRIVATE KEY",
      "sb_secret_",
      "[a-z]{20}\\.supabase\\.co",
      "hc-ping\\.com/[0-9a-f]{8}",
      "(GEMINI|GROQ|CEREBRAS)_API_KEY",
      "DEALSCOPE_APP_PRIVATE_KEY",
      "postgres(ql)?://\\w+:",
    ].join("|"),
  )
  const served = files.filter((path) => !/route(\.js)?$/.test(path) && (path.includes("/static/") || /\.(html|rsc|body)$/.test(path)))
  expect(served.length).toBeGreaterThan(10)
  expect(served.filter((path) => secret.test(readFileSync(path, "utf8")))).toEqual([])

  const source: string[] = []
  const walkSource = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walkSource(path)
      else source.push(path)
    }
  }
  for (const dir of ["app", "components", "lib"]) walkSource(dir)
  expect(source.filter((path) => readFileSync(path, "utf8").includes("NEXT_PUBLIC_" + ""))).toEqual([])
})

test.describe("6, 8, 9, 11, 14. nothing accepts writes", () => {
  for (const path of ["/", "/about", "/data/universe", "/data/company/0"]) {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      test(`${method} ${path} changes nothing`, async ({ request }) => {
        const before = await (await request.get("/data/company/0")).text()
        const response = await request.fetch(path, { method, data: { admin: true, score: 100, price: -1 } })
        // Static pages may answer with the page itself; handlers refuse.
        // Prerendered files either refuse the method or replay the same bytes.
        if (path === "/data/universe") expect(response.status()).toBe(405)
        if (path === "/data/company/0" && response.status() !== 405) expect(await response.text()).toBe(before)
        expect(response.headers()["set-cookie"]).toBeUndefined()
        expect(await (await request.get("/data/company/0")).text()).toBe(before)
      })
    }
  }

  for (const path of ["/", "/?view=results", "/about"]) {
    test(`no form, password or upload on ${path}`, async ({ page }) => {
      await open(page, path)
      await expect(page.locator('form, input[type="file"], input[type="password"]')).toHaveCount(0)
    })
  }

  test("query strings can't force server work", async ({ request }) => {
    const plain = await request.get("/data/universe")
    const busted = await request.get("/data/universe?bust=123")
    expect(await busted.text()).toBe(await plain.text())
    expect(busted.headers()["x-nextjs-cache"] ?? "HIT").toMatch(/HIT|STALE/)
  })

  test("the image optimizer can't be used as a CPU amplifier", async ({ request }) => {
    for (const query of ["w=3840&q=75", "w=64&q=100", "w=64&q=1"]) {
      expect((await request.get(`/_next/image?url=%2Fapple-icon.png&${query}`)).status(), query).toBe(400)
    }
  })
})

test.describe("7. tampering with what someone else sees", () => {
  test("a link with rigged weights says so on the results", async ({ page }) => {
    await open(page, "/?view=results&w=100-0-0-0")
    await expect(page.getByText(/custom-weighted/i)).toBeVisible()
  })

  test("a link with rigged weights says so on the tear sheet", async ({ page }) => {
    await open(page, "/?view=detail&ticker=TCS&w=100-0-0-0")
    await expect(page.getByText(/custom weights/i)).toBeVisible()
  })

  test("a link can't plant its own words as a filter chip", async ({ page }) => {
    await open(page, "/?view=results&sectors=SEBI%20APPROVED%20BUY%20NOW&ind=GUARANTEED%20RETURNS&bands=roce:strongBuyNow")
    await expect(page.getByText(/SEBI APPROVED BUY|GUARANTEED RETURNS|strong buy now/i)).toHaveCount(0)
  })
})

test.describe("10. hostile numbers", () => {
  const values = ["-1..", "NaN..", "Infinity..", "1e309..", "-1e309..", "1e300..", "..-999999999999999999999", "0x10..", "9..1"]
  for (const value of values) {
    test(`num=${value}`, async ({ page }) => {
      await open(page, `/?view=results&num=roce:${value},marketCap:${value}`)
      const text = await page.locator("main").innerText()
      expect(text).not.toMatch(/NaN|Infinity|∞|undefined|\d{16,}|e\+\d\d/)
    })
  }

  for (const w of ["-1-0-0-0", "NaN-1-1-1", "999-1-1-1", "0-0-0-0", "1e3-1-1-1"]) {
    test(`w=${w} falls back to equal weights`, async ({ page }) => {
      await open(page, `/?view=results&w=${w}`)
      await page.getByRole("button", { name: /^Weights/ }).click()
      await expect(page.getByRole("slider", { name: /Revenue Growth/ })).toHaveValue("25")
    })
  }

  test("a 400-digit typed number", async ({ page }) => {
    await open(page, `/?view=results`)
    await searchBox(page).evaluate((el: HTMLInputElement) => el.removeAttribute("maxlength"))
    await searchBox(page).fill(`roce over ${"9".repeat(400)}`)
    await page.waitForTimeout(250)
    expect(await page.locator("main").innerText()).not.toMatch(/Infinity|∞|\d{16,}|e\+\d\d/)
  })

  test("a very long query from a link can't hang the tab", async ({ page }) => {
    test.setTimeout(20_000)
    const q = Array.from({ length: 1400 }, (_, i) => `zzqx${i}`).join(" ")
    await page.goto(`/?view=results&q=${encodeURIComponent(q)}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 8000 })
    expect((await searchBox(page).inputValue()).length).toBeLessThanOrEqual(200)
  })
})
