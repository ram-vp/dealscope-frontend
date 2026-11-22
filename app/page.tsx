import { DealScopeApp } from "@/components/dealscope/dealscope-app"
import { getUniverseSummary } from "@/lib/universe-summary"

// Prerendered as the landing view with real counts. The full company list is
// downloaded by the client only when it is needed (see lib/use-universe.ts).
export default function Page() {
  return <DealScopeApp summary={getUniverseSummary()} />
}
