"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { StatusPage } from "@/components/site/status-page"
import "./globals.css"

// Replaces the root layout, so it brings its own document, theme and title.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en-IN" className="dark">
      <body>
        <title>Something broke | DealScope</title>
        <main>
          <StatusPage code="Error" title="Something broke" message="DealScope could not load. Try again in a moment.">
            <Button variant="primary" onClick={retry}>
              Try again
            </Button>
          </StatusPage>
        </main>
      </body>
    </html>
  )
}
