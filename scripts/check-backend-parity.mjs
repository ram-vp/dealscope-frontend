// Is the site serving exactly what the backend published?
//
//   node scripts/check-backend-parity.mjs
//
// Compares data/*.json here with data/frontend/*.json on the backend's main.
// The backend merges its half a minute or two after this repo merges the bot's,
// so a small date gap is a release in flight. Same dates must mean same numbers.

import { readFileSync } from "node:fs"
import { isDeepStrictEqual } from "node:util"

const REPO = process.env.BACKEND_REPO ?? "ram-vp/dealscope"
const REF = process.env.BACKEND_REF ?? "main"
const FILES = ["companies", "deals", "narratives", "filter-bands", "sector-bands"]
const MAX_GAP_DAYS = 4

async function backend(name) {
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/data/frontend/${name}.json`
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} returned ${res.status}`)
      return await res.json()
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000))
    }
  }
}

const local = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8"))

/** Regenerated daily, and not a number anyone sees. */
function withoutStamp(value) {
  if (!value || Array.isArray(value) || !("generated_at" in value)) return value
  const copy = { ...value }
  delete copy.generated_at
  return copy
}

const here = local("dataset-meta")
const there = await backend("dataset-meta")

if (here.prices_as_of !== there.prices_as_of || here.fundamentals_as_of !== there.fundamentals_as_of) {
  const gap = Math.abs(Date.parse(here.prices_as_of) - Date.parse(there.prices_as_of)) / 86_400_000
  const message = `site has prices ${here.prices_as_of} / fundamentals ${here.fundamentals_as_of}; backend has ${there.prices_as_of} / ${there.fundamentals_as_of}`
  if (gap > MAX_GAP_DAYS) {
    console.error(`::error::Out of sync for more than ${MAX_GAP_DAYS} days: ${message}`)
    process.exit(1)
  }
  console.log(`::warning::A release is in flight (or this branch is behind main): ${message}`)
  process.exit(0)
}

let failed = false
for (const name of FILES) {
  const mine = withoutStamp(local(name))
  const theirs = withoutStamp(await backend(name))
  if (isDeepStrictEqual(mine, theirs)) {
    console.log(`ok    ${name}`)
    continue
  }
  failed = true
  let detail = ""
  if (Array.isArray(mine) && Array.isArray(theirs)) {
    const i = mine.findIndex((row, j) => !isDeepStrictEqual(row, theirs[j]))
    if (i >= 0) detail = ` (first at row ${i}: ${mine[i]?.ticker ?? mine[i]?.target})`
  }
  console.error(`::error::${name}.json differs from the backend for the same dates${detail}`)
}
process.exit(failed ? 1 : 0)
