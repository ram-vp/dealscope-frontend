import { cn } from "@/lib/utils"

/** "01 / Label" above a section's heading. */
export function Eyebrow({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent", className)}>
      {index} / {label}
    </p>
  )
}

export function SectionHeader({ index, label, subtitle }: { index: string; label: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-1.5 border-b border-border pb-3 sm:flex-row sm:items-baseline">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
        <span aria-hidden="true" className="mr-2.5 font-bold text-accent">
          {index} /
        </span>
        {label}
      </h2>
      {subtitle && <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
