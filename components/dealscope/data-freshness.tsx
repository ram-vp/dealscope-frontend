import datasetMeta from "@/data/dataset-meta.json"
import { cn } from "@/lib/utils"

/** Format an ISO calendar date as "21 Aug 2026" without a timezone shift. */
export function formatAsOfDate(iso: string | null | undefined): string {
  if (!iso) return "N/A"
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = months[Number(match[2]) - 1]
  if (!month) return iso
  return `${Number(match[3])} ${month} ${match[1]}`
}

export const PRICES_AS_OF = formatAsOfDate(datasetMeta.prices_as_of)
export const FUNDAMENTALS_AS_OF = formatAsOfDate(datasetMeta.fundamentals_as_of)
export const FUNDAMENTALS_AS_OF_MAX = formatAsOfDate(datasetMeta.fundamentals_as_of_max)

export function DataFreshness({
  className,
  align = "start",
  compact = false,
}: {
  className?: string
  align?: "start" | "end"
  /** The one-line strip shown under the header on phones. */
  compact?: boolean
}) {
  if (compact) {
    return (
      <p
        className={cn(
          "flex flex-wrap justify-center gap-x-3 border-b border-border px-2 py-1.5 font-mono text-xs text-muted-foreground",
          className,
        )}
      >
        <span>
          Prices <strong className="font-semibold text-foreground">{PRICES_AS_OF}</strong>
        </span>
        <span>
          Fundamentals <strong className="font-semibold text-foreground">{FUNDAMENTALS_AS_OF}</strong>
        </span>
      </p>
    )
  }
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground",
        align === "end" && "sm:justify-end",
        className,
      )}
      role="group"
      aria-label={`NSE telemetry. Prices as of ${PRICES_AS_OF}. Fundamentals as of ${FUNDAMENTALS_AS_OF}.`}
    >
      {/* Prices Telemetry Chip */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border/60 bg-card/30">
        <span className="text-muted-foreground/80 text-[10px]">Prices as of:</span>
        <span className="text-foreground font-semibold tabular-nums">{PRICES_AS_OF}</span>
      </div>

      {/* Fundamentals Telemetry Chip */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border/60 bg-card/30">
        <span className="text-muted-foreground/80 text-[10px]">Fundamentals:</span>
        <span className="text-foreground font-semibold tabular-nums">{FUNDAMENTALS_AS_OF}</span>
      </div>
    </div>
  )
}

