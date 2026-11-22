import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google"
import { SmoothScroll } from "@/components/smooth-scroll"
import { DataFreshness, PRICES_AS_OF, FUNDAMENTALS_AS_OF } from "@/components/dealscope/data-freshness"
import { DealScopeLogo } from "@/components/dealscope/dealscope-logo"
import { SiteAnalytics } from "@/components/site/analytics"
import { SiteFooter } from "@/components/site/site-footer"
import { StaleDataBanner } from "@/components/dealscope/stale-data-banner"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { BOOT_SCRIPT } from "@/lib/boot-script"
import { SITE } from "@/lib/site"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
})
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" })

// Canonical, OG and Twitter are per route (lib/seo.ts). A canonical here is
// inherited by every page: it told search engines /about was the homepage.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.owner, url: SITE.linkedin }],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-IN" className="dark bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${bebasNeue.variable} ${ibmPlexMono.variable} font-sans antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <div className="noise-overlay" aria-hidden="true" />
          <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/60 transition-colors">
            <div className="flex min-h-13 sm:min-h-14 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 md:px-10 py-2 sm:py-2.5 max-w-7xl mx-auto">
              <div className="flex items-center gap-2.5 sm:gap-6 min-w-0">
                <DealScopeLogo />
                <div className="hidden md:block h-4 w-px bg-border/80" />
                {/* Both dates must stay in the raw HTML as "Prices as of <date>. Fundamentals as of <date>":
                    the data bot's canary and the backend watchdog read them (e2e/canary.spec.ts). */}
                <DataFreshness className="hidden md:flex" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <ThemeToggle />
                <Link
                  href="/about"
                  className="inline-flex shrink-0 items-center border border-border/60 bg-card/30 px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:border-accent hover:bg-accent/5 transition-colors duration-200 font-medium"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Mobile Sub-Header Telemetry Strip (visible on < md so dates are NEVER hidden) */}
            <div className="md:hidden border-t border-border/40 bg-card/20 px-2 py-1.5 flex items-center justify-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground overflow-hidden">
              <div className="flex items-center gap-1.5 text-muted-foreground/90 whitespace-nowrap">
                <span>Prices as of: <strong className="text-foreground font-semibold">{PRICES_AS_OF}</strong></span>
                <span className="text-border">·</span>
                <span>Fundamentals: <strong className="text-foreground font-semibold">{FUNDAMENTALS_AS_OF}</strong></span>
              </div>
            </div>
          </header>
          <StaleDataBanner />
          <SmoothScroll>
            <main id="main" tabIndex={-1}>
              {children}
            </main>
          </SmoothScroll>
          <SiteFooter />
          <SiteAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
