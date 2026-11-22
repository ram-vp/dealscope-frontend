import { expect } from "vitest"

/** Soft assertion, so one run reports every failing check in a group. */
export function check(name: string, cond: boolean, detail = "") {
  expect.soft(cond, detail ? `${name} -- ${detail}` : name).toBe(true)
}
