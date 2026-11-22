"use client"

import { useEffect } from "react"
import { Button, buttonClass } from "@/components/ui/button"
import { StatusPage } from "@/components/site/status-page"

export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      code="Error"
      title="Something broke"
      message="This page hit an unexpected error. Try again. If it keeps happening, go back to the screener and start from there."
    >
      <Button variant="primary" onClick={retry}>
        Try again
      </Button>
      {/* A full load, deliberately: client state may be what broke. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={buttonClass()}>
        Reload the screener
      </a>
    </StatusPage>
  )
}
