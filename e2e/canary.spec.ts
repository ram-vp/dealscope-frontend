import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

// apply-data-bot.yml rolls a data release back when scripts/canary_check.py
// can't find both dates in the raw HTML of `/`. Run that exact script here so a
// markup change can never turn into an automatic rollback of good data.
test("the data bot's canary passes on the served HTML", async ({ request }, info) => {
  const html = info.outputPath("page.html")
  writeFileSync(html, await (await request.get("/?canary=e2e")).text())
  const out = execFileSync("python3", ["-B", "scripts/canary_check.py", "data/dataset-meta.json", html], {
    encoding: "utf8",
  })
  expect(out).toContain("Canary OK")
})
