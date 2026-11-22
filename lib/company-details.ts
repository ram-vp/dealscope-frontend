"use client"

import { useCallback, useEffect, useState } from "react"
import type { CompanyNews } from "@/lib/dealscope-data"
import { detailPath } from "@/lib/data-paths"

export interface CompanyNarrative {
  about: string | null
  whyThisScore: string | null
}

export interface CompanyDetails {
  narrative: CompanyNarrative
  news: CompanyNews
}

const EMPTY: CompanyDetails = {
  narrative: { about: null, whyThisScore: null },
  news: { filings: [], bseNotices: [], news: [] },
}

const requests = new Map<string, Promise<Record<string, CompanyDetails>>>()

function loadShard(path: string): Promise<Record<string, CompanyDetails>> {
  let request = requests.get(path)
  if (!request) {
    request = fetch(path).then((res) => {
      if (!res.ok) throw new Error(`${path} returned ${res.status}`)
      return res.json()
    })
    // Never cache a failure, or Retry would replay it.
    request.catch(() => requests.delete(path))
    requests.set(path, request)
  }
  return request
}

export type DetailsStatus = "loading" | "ready" | "error"

export function useCompanyDetails(ticker: string): CompanyDetails & { status: DetailsStatus; retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const key = `${ticker}#${attempt}`
  const [result, setResult] = useState<{ key: string; status: DetailsStatus; details: CompanyDetails } | null>(null)

  useEffect(() => {
    let cancelled = false
    loadShard(detailPath(ticker)).then(
      (shard) => {
        const details = Object.hasOwn(shard, ticker) ? shard[ticker] : EMPTY
        if (!cancelled) setResult({ key, status: "ready", details })
      },
      () => {
        if (!cancelled) setResult({ key, status: "error", details: EMPTY })
      },
    )
    return () => {
      cancelled = true
    }
  }, [ticker, key])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = result?.key === key ? result : null

  return { ...(current?.details ?? EMPTY), status: current?.status ?? "loading", retry }
}
