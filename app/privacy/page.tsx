import { ContactEmail, LegalPage, LegalSection } from "@/components/site/prose-page"
import { pageMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description: "What DealScope processes, why, who processes it, and your rights under India's DPDP Act, 2023.",
})

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      intro="DealScope has no accounts, forms, advertising or tracking cookies. This page lists the little it does process."
    >
      <LegalSection title="Who is responsible">
        <p>
          DealScope is an independent project run by {SITE.owner}, who decides how and why the data below is processed
          (the &ldquo;Data Fiduciary&rdquo; in the Digital Personal Data Protection Act, 2023). Contact for any privacy
          question or grievance: <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection title="What is processed, and why">
        <dl>
          <dt>Hosting logs</dt>
          <dd>
            Vercel, the host, receives your IP address, browser details and the address you request, to deliver the site
            and keep it secure. A shared DealScope link contains its search and filters, so these are part of that
            address.
          </dd>
          <dt>Usage analytics</dt>
          <dd>
            Vercel Web Analytics records page path, referrer, approximate location (country, region, city), operating
            system, browser and device type, to count visits. It sets no cookies. It tells visitors apart with a hash of
            the request that is discarded after 24 hours. DealScope removes search terms, filters and tickers from the
            address before it is sent.
          </dd>
          <dt>Theme preference</dt>
          <dd>Your light or dark choice is saved in your browser&apos;s local storage and is never sent anywhere.</dd>
          <dt>Email you send</dt>
          <dd>If you write in, your address and message are used only to reply and to keep a record of the request.</dd>
        </dl>
      </LegalSection>

      <LegalSection title="What is not collected">
        <p>
          No names, phone numbers, financial details, portfolios or identity documents are asked for. Searching and
          ranking happen in your browser. CSV exports are created on your device and are not uploaded.
        </p>
      </LegalSection>

      <LegalSection title="Who else is involved">
        <p>
          Vercel Inc. processes hosting and analytics data on DealScope&apos;s behalf and may do so outside India. See{" "}
          <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">
            Vercel&apos;s privacy notice
          </a>{" "}
          and its{" "}
          <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
            analytics privacy documentation
          </a>
          . News and filing links open other websites, which have their own policies. DealScope does not sell personal
          data.
        </p>
      </LegalSection>

      <LegalSection title="How long it is kept">
        <p>
          Hosting logs and aggregate analytics are kept for the periods Vercel sets for the plan in use. Email is kept
          only as long as needed to handle your request or to meet a legal obligation.
        </p>
      </LegalSection>

      <LegalSection title="Your rights under the DPDP Act">
        <p>
          As the relevant provisions of the Act and the DPDP Rules, 2025 come into force (most of them from 13 May
          2027), you can:
        </p>
        <ul>
          <li>ask for a summary of the personal data processed about you and who it was shared with;</li>
          <li>ask for it to be corrected, completed, updated or erased;</li>
          <li>withdraw any consent you gave, as easily as you gave it;</li>
          <li>nominate someone to exercise these rights if you die or lose capacity;</li>
          <li>raise a grievance, and if it is not resolved, complain to the Data Protection Board of India.</li>
        </ul>
        <p>
          You can make any of these requests now by emailing <ContactEmail />. Grievances will be answered within 90
          days at the latest. Because there are no accounts, it may not be possible to link anonymous analytics to you.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          DealScope is not directed at anyone under 18 and does not knowingly process children&apos;s personal data. If
          you believe a child has emailed personal data, write in and it will be deleted.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>Changes are published on this page with a new effective date.</p>
      </LegalSection>
    </LegalPage>
  )
}
