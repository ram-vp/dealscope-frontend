import type React from "react"
import { cn } from "@/lib/utils"

const BASE =
  "group inline-flex min-h-11 items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40"

const VARIANTS = {
  primary: "border border-accent bg-accent px-6 tracking-widest font-bold text-accent-foreground hover:bg-accent-hover",
  secondary: "border border-border bg-card px-4 tracking-wider text-foreground hover:border-accent hover:text-accent",
  outline: "border border-accent px-5 tracking-widest text-accent hover:bg-accent/10",
  ghost: "px-3 tracking-wider text-muted-foreground hover:text-foreground",
} as const

export type ButtonVariant = keyof typeof VARIANTS

/** For links that should look like buttons. */
export function buttonClass(variant: ButtonVariant = "secondary", className?: string) {
  return cn(BASE, VARIANTS[variant], className)
}

export function Button({
  variant = "secondary",
  type = "button",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
