import type React from "react"
import { cn } from "@/lib/utils"

const TONES = {
  neutral: "border-border text-muted-foreground",
  accent: "border-accent text-accent",
} as const

/** A static label. Anything clickable is a Button or a Toggle instead. */
export function Chip({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof TONES }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center break-words border px-2 py-1 font-mono text-xs uppercase tracking-wider",
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
