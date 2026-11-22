import Link from "next/link"
import { ContactEmail, LegalPage, LegalSection } from "@/components/site/prose-page"
import { pageMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Use",
  description: "The terms for using DealScope, a free screener for NSE-listed Indian companies.",
})

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      path="/terms"
      intro={`These terms cover your use of DealScope, a free tool run by ${SITE.owner}. By using it you accept them.`}
    >
      <LegalSection title="What the service is">
        <p>
          DealScope screens NSE-listed companies, calculates sector-relative percentiles and indicative ranges from
          listed-peer multiples, and lists historical deals for context. It is for information and research. It does not
          give advice: read the <Link href="/disclaimer">disclaimer</Link> before relying on anything here.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          You may use the site and its CSV exports for your own research and internal work. Do not attack, overload or
          try to break the service, present its output as investment advice or as a regulated research report, or resell
          the underlying third-party data. That data remains subject to its providers&apos; terms.
        </p>
      </LegalSection>

      <LegalSection title="Ownership">
        <p>
          Company names, trademarks, filings, news headlines and market data belong to their owners. Their appearance
          here does not imply endorsement by any company, exchange, regulator or data provider.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          The service is provided as is and as available. Data can be late, incomplete or wrong, and the site can change
          or stop without notice. No promise is made that it is accurate or fit for a particular purpose.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          To the extent the law allows, {SITE.owner} is not liable for any loss arising from use of the site or reliance
          on its output, including trading and transaction losses. Nothing here limits liability that cannot be limited
          under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of India.</p>
      </LegalSection>

      <LegalSection title="Contact and changes">
        <p>
          Questions: <ContactEmail />. Changes to these terms are published on this page with a new effective date.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
