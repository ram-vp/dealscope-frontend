// Content-Security-Policy.
//
// Everything is same-origin: next/font self-hosts the fonts at build and Vercel
// Analytics 2 is served from /_vercel/insights on this domain, so no external
// origin is allowed at all.
//
// 'unsafe-inline' stays in script-src, knowingly. Pages are prerendered and
// Next inlines per-build flight scripts (68 distinct hashes across 7 pages when
// measured). Nonces need per-request rendering, which gives up the static CDN
// cache; experimental.sri was tried and leaves those inline scripts unhashed.
// What limits it: script-src-attr 'none' (no inline event handlers), no eval,
// no third-party origins to load from or send to, and the only raw-HTML sinks
// are a constant boot script and "<"-escaped JSON-LD.
//
// style-src needs 'unsafe-inline' for React style attributes (bars, rings).
//
// `next dev` needs eval for React's debugging and a websocket for HMR.
const isDev = process.env.NODE_ENV === "development"

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: https://va.vercel-scripts.com" : ""}`,
  "manifest-src 'self'",
  "media-src 'none'",
  "worker-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const SECURITY_HEADERS = [
  // Redundant with CSP's frame-ancestors above, kept for older browsers that
  // don't honour frame-ancestors. The two agree: no framing at all.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The value Vercel already adds on *.vercel.app; explicit so it survives a custom domain.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // No feature of this site uses any of these; deny by default.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: CSP },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // The optimizer only serves this site's own rasters: no remote sources, no
    // SVG, no query strings. It has had several RCE advisories, so keep it narrow.
    formats: ["image/webp"],
    localPatterns: [{ pathname: "/*.png", search: "" }],
    remotePatterns: [],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Data files are fetched by the app; they aren't search results.
      { source: "/data/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ]
  },
}

export default nextConfig
