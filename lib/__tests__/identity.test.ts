import { execFileSync } from "node:child_process"
import { expect, test } from "vitest"
import { siteJsonLd } from "../seo"
import { SITE } from "../site"

test("the owner's name is spelled the owner's way", () => {
  expect(SITE.owner).toBe("Ramsuthakaran VP")
  expect(JSON.stringify(siteJsonLd())).toContain('"name":"Ramsuthakaran VP"')
})

test("the wrong spelling is in no tracked file", () => {
  let hits = ""
  try {
    // Split so this file doesn't match itself. Exit status 1 means no match.
    hits = execFileSync("git", ["grep", "-n", "-I", "-i", "-E", "ram[[:space:]]+" + "suthakaran", "--", ".", ":!*_REPORT.md"], {
      encoding: "utf8",
    })
  } catch (error) {
    if ((error as { status?: number }).status !== 1) throw error
  }
  expect(hits).toBe("")
})
