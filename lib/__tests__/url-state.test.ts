/**
 * Landing → results → tear sheet URLs must round-trip cleanly.
 */

import { test } from "vitest"
import { makeScreen } from "../screener"
import { canonicalizeUrlState, decodeUrlState, encodeUrlState } from "../url-state"
import { check } from "./check"

function decode(qs: string) {
  return decodeUrlState(new URLSearchParams(qs))
}

test("Landing is a bare URL", () => {
  const qs = encodeUrlState({ view: "landing", ticker: null, screen: makeScreen() })
  check("empty screen encodes to empty query", qs === "")
  const round = decode(qs)
  check("empty query is landing", round.view === "landing" && round.ticker === null)
})

test("Landing must not keep a leftover ticker", () => {
  const qs = encodeUrlState({ view: "landing", ticker: "INFY", screen: makeScreen() })
  check("landing drops ticker", !qs.includes("ticker"))
  check("landing drops view", !qs.includes("view="))
})

test("Results", () => {
  const screen = makeScreen({ text: "pharma", sectors: ["Healthcare & Lifesciences"] })
  const qs = encodeUrlState({ view: "results", ticker: null, screen })
  check("results sets view=results", qs.includes("view=results"))
  check("results keeps the query", qs.includes("q=pharma"))
  check("results does not invent a ticker", !qs.includes("ticker"))
  const round = decode(qs)
  check("results round-trips view", round.view === "results")
  check("results round-trips text", round.screen.text === "pharma")
})

test("Results must not keep a leftover ticker", () => {
  const qs = encodeUrlState({ view: "results", ticker: "INFY", screen: makeScreen() })
  check("results URL has no ticker", !qs.includes("ticker"))
  check("results URL is view=results", qs === "view=results")
})

test("Tear sheet is view=detail, not view=results", () => {
  const qs = encodeUrlState({ view: "detail", ticker: "INFY", screen: makeScreen() })
  check("sheet uses view=detail", qs.includes("view=detail"))
  check("sheet does not say view=results", !qs.includes("view=results"))
  check("sheet carries ticker", qs.includes("ticker=INFY"))
  const round = decode(qs)
  check("sheet round-trips to detail", round.view === "detail" && round.ticker === "INFY")
})

test("Legacy view=results&ticker= still opens the sheet", () => {
  const round = decode("view=results&ticker=TCS")
  check("old shared links still open the tear sheet", round.view === "detail" && round.ticker === "TCS")
  const canonical = canonicalizeUrlState(new URLSearchParams("view=results&ticker=TCS"))
  check("canonical form is view=detail&ticker=TCS", canonical === "view=detail&ticker=TCS")
})

test("Broken / leftover params", () => {
  check("view=detail without ticker degrades to results", decode("view=detail").view === "results")
  check("blank ticker is treated as missing", decode("view=results&ticker=").ticker === null)
  check("whitespace ticker is treated as missing", decode("ticker=   ").ticker === null)
  const junk = canonicalizeUrlState(new URLSearchParams("view=results&foo=bar&ticker="))
  check("unknown keys are stripped", junk === "view=results", `got ${junk}`)
  const withScreen = encodeUrlState({
    view: "detail",
    ticker: "INFY",
    screen: makeScreen({ text: "pharma" }),
  })
  check("in-app sheet keeps the screen so Back can restore it", withScreen.includes("q=pharma") && withScreen.includes("view=detail"))
})

test("Encode is stable (no replace/read loop)", () => {
  const screen = makeScreen({ text: "steel", sectors: ["Metals, Mining & Materials"] })
  const a = encodeUrlState({ view: "results", ticker: null, screen })
  const b = encodeUrlState(decode(a))
  check("encode(decode(encode(x))) === encode(x)", a === b, `a=${a} b=${b}`)
})
