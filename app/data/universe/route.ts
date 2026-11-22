import { encodeUniverse } from "@/lib/universe-payload"
import { COMPANY_RECORDS, getDeals } from "@/lib/universe"

// Prerendered to a static file at build. No request-time server work.
export const dynamic = "force-static"

export function GET() {
  return Response.json(encodeUniverse(COMPANY_RECORDS, getDeals()))
}
