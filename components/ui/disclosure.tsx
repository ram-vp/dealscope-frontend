"use client"

import type React from "react"
import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Collapsed behind a button on phones, always open from `sm` up. Replaces
 *  sideways-scrolling pill rows. */
export function MobileDisclosure({
  label,
  defaultOpen = false,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <>
      <Button aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="w-full justify-between sm:hidden">
        {label}
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </Button>
      <div id={id} className={cn("flex-wrap items-center gap-2 max-sm:mt-2 sm:flex", open ? "flex" : "hidden")}>
        {children}
      </div>
    </>
  )
}
