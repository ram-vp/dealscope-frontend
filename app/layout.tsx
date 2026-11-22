import type React from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google"
import { DataFreshness } from "@/components/dealscope/data-freshness"
import { DealScopeLogo } from "@/components/dealscope/dealscope-logo"
import { StaleDataBanner } from "@/components/dealscope/stale-data-banner"
import { SiteAnalytics } from "@/components/site/analytics"
import { NavLink } from "@/components/site/nav-link"
import { SiteFooter } from "@/components/site/site-footer"
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
// Mono sets nearly all small text; only the weight used above the fold is preloaded.
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  preload: false,
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
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en-IN"
      className={`dark bg-background ${ibmPlexSans.variable} ${bebasNeue.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <div className="noise-overlay" aria-hidden="true" />
          <header className="sticky top-0 z-40 w-full border-b border-border bg-background pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-1.5 sm:gap-4 sm:px-6 md:px-10">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-6">
                <DealScopeLogo />
                <div className="hidden h-4 w-px bg-border md:block" />
                {/* Both dates must stay in the raw HTML as "Prices as of <date>. Fundamentals as of <date>":
                    the data bot's canary and the backend watchdog read them (e2e/canary.spec.ts). */}
                <DataFreshness className="hidden md:flex" />
              </div>
              <nav aria-label="Main" className="flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <NavLink href="/about">About</NavLink>
              </nav>
            </div>
          </header>
          {/* Outside the sticky header, so on phones it doesn't eat the viewport. */}
          <DataFreshness compact className="md:hidden" />
          <StaleDataBanner />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
          <SiteAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
