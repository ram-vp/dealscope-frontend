"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

const EXIT_MS = 250

/**
 * Right-hand drawer on a native <dialog>: showModal() is the focus trap and
 * makes the page behind inert. The dialog itself is an invisible full-screen
 * box; what you see is the backdrop and panel inside it.
 */
export function Dialog({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  // Stays mounted for the slide-out.
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (open || !mounted) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = setTimeout(() => setMounted(false), reduced ? 0 : EXIT_MS)
    return () => clearTimeout(timer)
  }, [open, mounted])

  useEffect(() => {
    const dialog = ref.current
    if (!mounted || !dialog) return
    const trigger = document.activeElement as HTMLElement | null
    dialog.showModal()
    // Focus the panel, so no button wears a focus ring just for having opened it.
    panelRef.current?.focus({ preventScroll: true })
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = ""
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [mounted])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-closing={!open || undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={() => {
        // The browser can close it without a cancel event (a second Esc).
        if (open && !ref.current?.open) onClose()
      }}
      className="ds-drawer fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-foreground"
    >
      {mounted && (
        <>
          {/* Backdrop */}
          <div className="ds-drawer-backdrop fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          {/* Panel */}
          <section
            ref={panelRef}
            tabIndex={-1}
            data-lenis-prevent
            className="ds-drawer-panel fixed right-0 top-0 z-[70] h-full w-full max-w-lg bg-background border-l border-border flex flex-col shadow-2xl"
          >
            {children}
          </section>

          {/* The top layer sits above the page's grain, so it carries its own. */}
          <div className="noise-overlay" aria-hidden="true" />
        </>
      )}
    </dialog>
  )
}
