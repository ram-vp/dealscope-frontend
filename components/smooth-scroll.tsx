"use client"

import type React from "react"
import { useEffect } from "react"
import type Lenis from "lenis"

// Module-level handle to the live Lenis instance.
//
// Lenis animates the scroll position over ~1.2s, so a plain window.scrollTo()
// doesn't reset it: on its next frame Lenis drags the page back to where it
// thinks it should be. Callers use scrollToY() below, which tells Lenis itself
// to jump, and falls back to the native call when Lenis is inactive (reduced
// motion, or before it has loaded).
let activeLenis: Lenis | null = null

export function scrollToY(top: number) {
  if (activeLenis) activeLenis.scrollTo(top, { immediate: true, force: true })
  else window.scrollTo({ top, behavior: "instant" })
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Respect users who ask for reduced motion -- native scrolling stays crisp.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let cancelled = false
    let frame = 0
    let lenis: Lenis | null = null
    // Same feel as always, without gsap: loaded after hydration, on its own rAF.
    void import("lenis").then(({ default: LenisScroll }) => {
      if (cancelled) return
      lenis = new LenisScroll({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      })
      activeLenis = lenis
      const tick = (time: number) => {
        lenis?.raf(time)
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      lenis?.destroy()
      if (activeLenis === lenis) activeLenis = null
    }
  }, [])

  return <>{children}</>
}
