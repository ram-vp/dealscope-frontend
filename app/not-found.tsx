import type { Metadata } from "next"
import Link from "next/link"
import { buttonClass } from "@/components/ui/button"
import { StatusPage } from "@/components/site/status-page"

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <StatusPage
      code="Error 404"
      title="Page not found"
      message="That address doesn't match a page. Company tear sheets open from the screener: search by name or NSE ticker."
    >
      <Link href="/" className={buttonClass("primary")}>
        Open the screener
      </Link>
      <Link href="/about" className={buttonClass()}>
        Read the methodology
      </Link>
    </StatusPage>
  )
}
