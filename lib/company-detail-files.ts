import narrativesData from "@/data/narratives.json"
import newsData from "@/data/news.json"
import { asString, type CompanyNews } from "@/lib/dealscope-data"
import { descriptiveSummary } from "@/lib/descriptive-summary"
import type { CompanyDetails } from "@/lib/company-details"
import { DETAIL_SHARDS, detailShard } from "@/lib/data-paths"

// Build time only: turns narratives.json + news.json into per-shard files.

type NarrativeFile = Record<string, { about?: unknown }>

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function normalizeNewsEntry(raw: unknown): CompanyNews {
  const r = (raw ?? {}) as Record<string, unknown>
  return { filings: toArray(r.filings), bseNotices: toArray(r.bseNotices), news: toArray(r.news) }
}

function readNews(): Map<string, CompanyNews> {
  const raw = newsData as unknown
  const map = new Map<string, CompanyNews>()
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const ticker = (entry as { ticker?: string })?.ticker
      if (ticker) map.set(ticker, normalizeNewsEntry(entry))
    }
  } else if (raw && typeof raw === "object") {
    for (const [ticker, entry] of Object.entries(raw as Record<string, unknown>)) {
      map.set(ticker, normalizeNewsEntry(entry))
    }
  }
  return map
}

function buildShards(): Record<string, CompanyDetails>[] {
  const narratives = narrativesData as NarrativeFile
  const news = readNews()
  const shards = Array.from({ length: DETAIL_SHARDS }, (): Record<string, CompanyDetails> => ({}))
  for (const ticker of new Set([...Object.keys(narratives), ...news.keys()])) {
    const entry = narratives[ticker]
    shards[detailShard(ticker)][ticker] = {
      // why_this_score is not shipped: it quotes the snapshot it was written
      // from. lib/score-rationale.ts writes it from the live numbers instead.
      narrative: { about: descriptiveSummary(asString(entry?.about)) },
      news: news.get(ticker) ?? normalizeNewsEntry(null),
    }
  }
  return shards
}

export const DETAIL_FILES = buildShards()
