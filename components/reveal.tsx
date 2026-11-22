"use client"

import type React from "react"
import { useEffect, useRef } from "react"

/** Fade-and-rise as it scrolls into view. Prerendered visible, so it needs no
 *  JavaScript to be read; only what is still below the fold gets animated. */
export function Reveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return
    el.style.opacity = "0"
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        el.style.opacity = ""
        el.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], {
          duration: 200,
          delay: delay * 1000,
          easing: "ease-out",
          fill: "backwards",
        })
      },
      { rootMargin: "-40px" },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      el.style.opacity = ""
    }
  }, [delay])

  return <div ref={ref}>{children}</div>
}
