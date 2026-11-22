import { DealScopeApp } from "@/components/dealscope/dealscope-app"
import { JsonLd } from "@/components/site/json-ld"
import { pageMetadata, siteJsonLd } from "@/lib/seo"
import { getUniverseSummary } from "@/lib/universe-summary"

export const metadata = pageMetadata({ path: "/" })

// Prerendered as the landing view with real counts. The full company list is
// downloaded by the client only when it is needed (see lib/use-universe.ts).
export default function Page() {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <DealScopeApp summary={getUniverseSummary()} />
    </>
  )
}
