import type React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/** A pressable pill. Pressed shows a tick as well as colour. */
export function Toggle({
  pressed,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-11 min-w-11 max-w-full items-center gap-2 border px-3 py-1.5 text-left font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors duration-150",
        pressed
          ? "border-accent bg-accent/10 font-semibold text-accent"
          : "border-control text-muted-foreground hover:border-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {pressed && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  )
}
