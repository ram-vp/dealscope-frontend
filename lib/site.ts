// One source for identity, URLs and contact details used in metadata,
// structured data, the footer and the legal pages.

export const SITE = {
  name: "DealScope",
  url: "https://dealscope-screener.vercel.app",
  title: "DealScope: Sector-relative comps and screening for NSE companies",
  description:
    "Screen NSE-listed Indian companies by sector-relative operating percentiles, peer trading multiples, and promoter pledge telemetry. Free, no account required.",
  owner: "Ramsuthakaran VP",
  email: "ramsuthakaran.vp@gmail.com",
  linkedin: "https://www.linkedin.com/in/ramsuthakaran-vp-778b4731b/",
} as const

/** The date the legal pages took effect. Change it whenever their substance changes. */
export const LEGAL_UPDATED = "2026-11-22"

export const LEGAL_PAGES = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const
