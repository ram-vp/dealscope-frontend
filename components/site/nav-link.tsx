"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { buttonClass } from "@/components/ui/button"

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const current = usePathname() === href
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={buttonClass("secondary", current ? "border-accent text-accent underline underline-offset-4" : "")}
    >
      {children}
    </Link>
  )
}
