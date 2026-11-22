"use client"

import { useSyncExternalStore } from "react"
import { type Company, type DealRow, mapCompanyRecord } from "@/lib/dealscope-data"
import { UNIVERSE_PATH } from "@/lib/data-paths"
import { type UniversePayload, decodeUniverse } from "@/lib/universe-payload"

export type UniverseState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ready"; companies: Company[]; deals: DealRow[] }

const IDLE: UniverseState = { status: "idle" }

let state: UniverseState = IDLE
const listeners = new Set<() => void>()

function setState(next: UniverseState) {
  state = next
  for (const notify of listeners) notify()
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

/** Idempotent: a no-op while loading or once loaded, a retry after a failure. */
export async function loadUniverse(): Promise<void> {
  if (state.status === "loading" || state.status === "ready") return
  setState({ status: "loading" })
  try {
    const res = await fetch(UNIVERSE_PATH)
    if (!res.ok) throw new Error(`${UNIVERSE_PATH} returned ${res.status}`)
    const { companies, deals } = decodeUniverse((await res.json()) as UniversePayload)
    setState({ status: "ready", companies: companies.map(mapCompanyRecord), deals })
  } catch (error) {
    console.error("Could not load the company universe", error)
    setState({ status: "error" })
  }
}

export function useUniverse(): UniverseState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => IDLE,
  )
}
