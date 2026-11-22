import { DETAIL_FILES } from "@/lib/company-detail-files"

// One static file per shard, written at build. Unknown shards are a plain 404.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return DETAIL_FILES.map((_, i) => ({ shard: String(i) }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ shard: string }> }) {
  return Response.json(DETAIL_FILES[Number((await params).shard)])
}
