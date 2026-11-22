"use client"

import type React from "react"

/** An in-app view change that is still a real link: new-tab, copy-link and
 *  "link" semantics work, a plain click stays client-side. */
export function AppLink({
  href,
  onNavigate,
  ...props
}: Omit<React.ComponentProps<"a">, "href" | "onClick"> & { href: string; onNavigate: () => void }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        onNavigate()
      }}
      {...props}
    />
  )
}
