"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

/** The query string holds search terms, filters and tickers, none of which
 *  analytics or Speed Insights needs (and the privacy policy says it doesn't get). */
function withoutQuery<T extends { url: string }>(event: T): T {
  return { ...event, url: event.url.split(/[?#]/)[0] }
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={withoutQuery} />
      <SpeedInsights beforeSend={withoutQuery} />
    </>
  )
}
