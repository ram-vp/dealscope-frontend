"use client"

import type React from "react"
import { useEffect, useId, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DialogProps {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  closeLabel: string
  footer: React.ReactNode
  children: React.ReactNode
}

/**
 * Right-hand drawer on a native <dialog>. showModal() makes the rest of the
 * page inert, which is the focus trap, and puts it in the top layer. What the
 * platform doesn't cover is handled here: returning focus to the trigger and
 * closing on a backdrop click. Body scroll lock is in globals.css.
 */
export function Dialog({ open, onClose, eyebrow, title, closeLabel, footer, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const trigger = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => {
      dialog.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={() => {
        // The browser can close it without a cancel event (a second Esc).
        if (open && !ref.current?.open) onClose()
      }}
      onClick={(e) => {
        // The panel fills the dialog, so only a backdrop click targets it.
        if (e.target === e.currentTarget) onClose()
      }}
      className="ds-drawer fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-lg border-l border-border bg-background p-0 text-foreground"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:p-8">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
              <h2 id={titleId} className="mt-2 font-display text-3xl uppercase tracking-tight sm:text-4xl">
                {title}
              </h2>
            </div>
            <Button onClick={onClose} aria-label={closeLabel} className="min-w-11 shrink-0 px-0">
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">{children}</div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            {footer}
          </div>
        </div>
      )}
    </dialog>
  )
}
