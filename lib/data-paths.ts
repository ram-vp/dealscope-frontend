// Paths of the static data files prerendered by app/data/*.

export const UNIVERSE_PATH = "/data/universe"

/** 256 files of ~16KB brotli each, in place of one 8.8MB narratives + news download. */
export const DETAIL_SHARDS = 256

export function detailShard(ticker: string): number {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0
  return hash % DETAIL_SHARDS
}

export function detailPath(ticker: string): string {
  return `/data/company/${detailShard(ticker)}`
}
