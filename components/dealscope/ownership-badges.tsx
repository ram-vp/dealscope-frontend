import { Chip } from "@/components/ui/chip"
import { isElevatedPledge, ownershipBadgeLabel, ownershipBadgeTitle } from "@/lib/ownership-badges"

/**
 * Native DealScope chip: PROM / PLG percents already on the company record.
 * Elevated pledge (> 10%) uses the accent tone: factual emphasis, not a
 * warning product.
 */
export function OwnershipBadge({
  holding,
  pledge,
  className,
}: {
  holding: number | null | undefined
  pledge: number | null | undefined
  className?: string
}) {
  const label = ownershipBadgeLabel(holding, pledge)
  if (!label) return null
  const title = ownershipBadgeTitle(holding, pledge)

  return (
    <Chip tone={isElevatedPledge(pledge) ? "accent" : "neutral"} title={title} className={className}>
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{title}</span>
    </Chip>
  )
}
