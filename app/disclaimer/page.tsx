import Link from "next/link"
import { ContactEmail, LegalPage, LegalSection } from "@/components/site/prose-page"
import { pageMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = pageMetadata({
  path: "/disclaimer",
  title: "Disclaimer",
  description: "DealScope is not investment advice and is not registered with SEBI. Data sources and known limits.",
})

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      path="/disclaimer"
      intro="DealScope is not investment advice. Nothing on this site is a recommendation to buy, sell or hold any security."
    >
      <LegalSection title="Not registered with SEBI">
        <p>
          DealScope and {SITE.owner} are not registered with the Securities and Exchange Board of India (SEBI) as an
          Investment Adviser under the SEBI (Investment Advisers) Regulations, 2013, or as a Research Analyst under the
          SEBI (Research Analysts) Regulations, 2014. Consult a SEBI-registered professional before making an investment
          decision.
        </p>
      </LegalSection>

      <LegalSection title="What scores and ranges mean">
        <p>
          Scores are arithmetic: percentile ranks inside a sector, averaged with the weights you choose. A high score is
          not a view on a company&apos;s prospects or share price. Valuation ranges apply sector peer multiples to
          reported earnings. They are not price targets, forecasts, valuations for a transaction or fairness opinions.
        </p>
      </LegalSection>

      <LegalSection title="Where the data comes from, and its limits">
        <ul>
          <li>Market capitalisation and fundamentals come from Yahoo Finance, which can be late or wrong.</li>
          <li>
            Fundamentals are trailing figures as of the pull date in the header, which is not the date of the financial
            statements.
          </li>
          <li>
            Promoter holding uses Yahoo Finance&apos;s insider holding as a proxy. It can differ from the shareholding
            pattern filed with the exchange.
          </li>
          <li>Promoter pledge comes from NSE disclosures and is refreshed less often than other fields.</li>
          <li>Deals are a hand-compiled, incomplete set. One transaction can appear in more than one annual report.</li>
          <li>Company summaries are written by AI and may be dated or wrong.</li>
          <li>
            News and filings are matched to companies by name, so some will be irrelevant. They are not endorsements.
          </li>
        </ul>
        <p>
          Check every figure against the company&apos;s own filings. The calculations are described in the{" "}
          <Link href="/about">methodology</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Investment risk">
        <p>
          Investments in securities are subject to market risks, including loss of capital. Past performance does not
          indicate future results.
        </p>
      </LegalSection>

      <LegalSection title="Report an error">
        <p>
          If a number looks wrong, email <ContactEmail /> with the ticker and the field.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
