/**
 * Promoter / pledge badge copy: missing stays hidden, a real 0 stays 0,
 * a tiny non-zero is not rounded into 0%, elevated pledge is > 10%.
 */

import { test } from "vitest"
import {
  formatBadgePct,
  isElevatedPledge,
  isPresentNumber,
  ownershipBadgeLabel,
  ownershipBadgeTitle,
} from "../ownership-badges"
import { getCompanies } from "../universe"
import { check } from "./check"

test("formatBadgePct", () => {
  check("exact 0 is 0%", formatBadgePct(0) === "0%")
  check("integer 62 is 62%", formatBadgePct(62) === "62%")
  check("62.0 is 62%", formatBadgePct(62.0) === "62%")
  check("55.16 is 55.2%", formatBadgePct(55.16) === "55.2%")
  check("71.795 is 71.8%", formatBadgePct(71.795) === "71.8%")
  check("tiny 0.01 is not 0%", formatBadgePct(0.01) === "0.01%")
  check("tiny 0.03 is not 0%", formatBadgePct(0.03) === "0.03%")
  check("0.04 is not coerced to 0%", formatBadgePct(0.04) !== "0%")
})

test("presence vs missing", () => {
  check("null is not present", isPresentNumber(null) === false)
  check("undefined is not present", isPresentNumber(undefined) === false)
  check("NaN is not present", isPresentNumber(Number.NaN) === false)
  check("0 is present", isPresentNumber(0) === true)
})

test("combined label", () => {
  check(
    "both present",
    ownershipBadgeLabel(62, 0) === "PROM 62% · PLG 0%",
  )
  check("holding only", ownershipBadgeLabel(55.16, null) === "PROM 55.2%")
  check("pledge only", ownershipBadgeLabel(null, 0) === "PLG 0%")
  check("both missing is null", ownershipBadgeLabel(null, null) === null)
  check("undefined pair is null", ownershipBadgeLabel(undefined, undefined) === null)
  check("real 0 holding is shown", ownershipBadgeLabel(0, 0) === "PROM 0% · PLG 0%")
  check(
    "missing holding is not printed as 0",
    ownershipBadgeLabel(null, 0) !== "PROM 0% · PLG 0%",
  )
})

test("elevated pledge (same >10% bucket as filters)", () => {
  check("0 is not elevated", isElevatedPledge(0) === false)
  check("10 is not elevated", isElevatedPledge(10) === false)
  check("10.01 is elevated", isElevatedPledge(10.01) === true)
  check("11.03 is elevated", isElevatedPledge(11.03) === true)
  check("null is not elevated", isElevatedPledge(null) === false)
})

test("title / aria", () => {
  check(
    "title spells the facts out",
    ownershipBadgeTitle(62, 0) === "Promoter holding 62%. Promoter pledge 0%.",
  )
  check("title is absent when both missing", ownershipBadgeTitle(null, null) === undefined)
  check("title has no buy/sell words", !/buy|attractive|target|safe|strong candidate/i.test(ownershipBadgeTitle(40, 22) ?? ""))
})

test("live records keep missing vs zero distinct", () => {
  // Picked by shape, not by ticker: the data bot changes these values.
  const { companies } = getCompanies()
  const zero = companies.find((c) => c.raw.promoterHolding === 0)
  const vacant = companies.find((c) => c.raw.promoterHolding == null && c.raw.promoterPledge != null)
  const both = companies.find((c) => (c.raw.promoterHolding ?? 0) > 0 && c.raw.promoterPledge === 0)
  const pledged = companies.find((c) => (c.raw.promoterPledge ?? 0) > 10)
  const tiny = companies.find((c) => c.raw.promoterPledge === 0.01)

  check("zero holding is a real 0", !zero || zero.raw.promoterHolding === 0)
  check(
    "zero-holding badge keeps PROM 0%",
    !zero || ownershipBadgeLabel(zero.raw.promoterHolding, zero.raw.promoterPledge)?.startsWith("PROM 0%") === true,
  )
  check("missing holding stays null", vacant?.raw.promoterHolding == null)
  check(
    "missing-holding badge has no PROM",
    ownershipBadgeLabel(vacant?.raw.promoterHolding, vacant?.raw.promoterPledge)?.includes("PROM") !== true,
  )
  check(
    "missing-holding badge still shows PLG",
    !vacant || ownershipBadgeLabel(vacant?.raw.promoterHolding, vacant?.raw.promoterPledge)?.startsWith("PLG ") === true,
  )
  check(
    "combined chip",
    !both || ownershipBadgeLabel(both.raw.promoterHolding, 0) === `PROM ${formatBadgePct(both.raw.promoterHolding as number)} · PLG 0%`,
  )
  check("pledge above 10% is elevated", !pledged || isElevatedPledge(pledged.raw.promoterPledge))
  check(
    "0.01% pledge is not 0%",
    !tiny || ownershipBadgeLabel(tiny?.raw.promoterHolding, tiny?.raw.promoterPledge)?.includes("PLG 0.01%") === true,
  )
  const bare = companies.find((c) => c.raw.promoterHolding == null && c.raw.promoterPledge == null)
  check("bare record holding is missing", bare?.raw.promoterHolding == null)
  check("bare record pledge is missing", bare?.raw.promoterPledge == null)
  check(
    "no badge when both are missing",
    ownershipBadgeLabel(bare?.raw.promoterHolding, bare?.raw.promoterPledge) === null,
  )
})
