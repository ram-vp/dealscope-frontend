import type { Metadata } from "next"
import Link from "next/link"
import { PRIMARY_ACTION, SECONDARY_ACTION } from "@/components/site/styles"
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
      <Link href="/" className={PRIMARY_ACTION}>
        Open the screener
      </Link>
      <Link href="/about" className={SECONDARY_ACTION}>
        Read the methodology
      </Link>
    </StatusPage>
  )
}
