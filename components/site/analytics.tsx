"use client"

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next"

/** The query string holds search terms, filters and tickers, none of which
 *  analytics needs (and the privacy policy says it doesn't get). */
function withoutQuery(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: event.url.split(/[?#]/)[0] }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={withoutQuery} />
}
