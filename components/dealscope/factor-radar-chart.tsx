"use client"

import { useState } from "react"
import { Chip } from "@/components/ui/chip"
import type { FactorScores, Weights } from "@/lib/dealscope-data"
import { cn } from "@/lib/utils"

interface FactorRadarChartProps {
  factors: FactorScores
  weights: Weights
  sector: string
  unclassified?: boolean
  rawMetrics: Record<keyof FactorScores, string>
  className?: string
}

// The SVG holds only geometry. Labels are HTML around it: inside the viewBox
// they scaled with the chart and rendered at 4 to 6px on a phone.
const SIZE = 240
const CENTER = SIZE / 2
const MAX_RADIUS = 106
const MIN_RADIUS = MAX_RADIUS * 0.08

const AXES = [
  {
    key: "revenueGrowth",
    label: "Revenue Growth",
    short: "Growth",
    angle: -Math.PI / 2,
    place: "col-start-2 row-start-1",
    explainer: "Sales growth momentum relative to sector peers",
  },
  {
    key: "ebitdaMargin",
    label: "EBITDA Margin",
    short: "Margin",
    angle: 0,
    place: "col-start-3 row-start-2",
    explainer: "Operating profitability before non-cash and capital costs",
  },
  {
    key: "roce",
    label: "ROCE",
    short: "ROCE",
    angle: Math.PI / 2,
    place: "col-start-2 row-start-3",
    explainer: "Efficiency of turning invested capital into operating profit",
  },
  {
    key: "debtLevel",
    label: "Debt Health",
    short: "Debt",
    angle: Math.PI,
    place: "col-start-1 row-start-2",
    explainer: "Lower leverage scores higher",
  },
] as const

function pointAt(score: number, angle: number) {
  const r = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * (Math.max(0, Math.min(100, score)) / 100)
  // Rounded so server and client print identical coordinates.
  return { x: +(CENTER + r * Math.cos(angle)).toFixed(1), y: +(CENTER + r * Math.sin(angle)).toFixed(1) }
}

const ring = (score: number) =>
  AXES.map((axis) => {
    const { x, y } = pointAt(score, axis.angle)
    return `${x},${y}`
  }).join(" ")

/** A plain-language label. These are claims, so never made from a guess. */
function archetype(f: FactorScores, financials: boolean): { label: string; highlight: boolean } {
  const { revenueGrowth: g, ebitdaMargin: m, roce: r } = f
  if (g == null || m == null || r == null) return { label: "Incomplete factor data", highlight: false }
  const d = f.debtLevel ?? 0
  if (g >= 75 && m >= 70 && r >= 70) return { label: "Top-Quartile Compounder", highlight: true }
  if (r >= 80 && (financials || d >= 75)) return { label: "High-Return Capital Efficient", highlight: true }
  if (g >= 75 && m < 45) return { label: "High-Growth Expansion Play", highlight: true }
  if (m >= 75 && g < 40) return { label: "High-Margin, Slower Growth", highlight: true }
  if (r < 35 && m < 35) return { label: "Operational Turnaround", highlight: false }
  return { label: "Sector-Balanced Performer", highlight: false }
}

export function FactorRadarChart({
  factors,
  weights,
  sector,
  unclassified = false,
  rawMetrics,
  className,
}: FactorRadarChartProps) {
  const [active, setActive] = useState<number | null>(null)

  if (unclassified) {
    return (
      <div className={cn("flex flex-col items-center justify-center border border-border p-8 text-center", className)}>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Radar unavailable</p>
        <p className="mt-2 max-w-xs font-mono text-xs leading-relaxed text-muted-foreground">
          This company has no sector cohort, so peer-relative percentiles cannot be formed.
        </p>
      </div>
    )
  }

  const financials = sector === "Financial Services"
  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0)
  // A missing factor is left out of the shape; drawn at the centre it read as 0.
  const plotted = AXES.flatMap((axis) => {
    const score = factors[axis.key]
    return score == null ? [] : [{ axis, score, ...pointAt(score, axis.angle) }]
  })
  const valueText = (key: keyof FactorScores) =>
    financials && key === "debtLevel" ? "Exempt" : factors[key] == null ? "N/A" : String(factors[key])
  const summary = AXES.map((axis) => `${axis.label} ${valueText(axis.key)}`).join(", ")
  const type = archetype(factors, financials)
  const shown = active === null ? null : AXES[active]

  return (
    <div className={cn("flex flex-col border border-border bg-card/30 p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest">Factor Radar</h3>
        <Chip tone={type.highlight ? "accent" : "neutral"}>{type.label}</Chip>
      </div>

      <div className="mx-auto my-3 grid w-full max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-1">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Sector percentiles out of 100: ${summary}. The dashed ring is the sector median.`}
          className="col-start-2 row-start-2 h-auto w-full max-w-[240px]"
        >
          <polygon points={ring(100)} fill="none" stroke="var(--control)" />
          <polygon points={ring(75)} fill="none" stroke="var(--control)" strokeDasharray="1 3" />
          <polygon points={ring(50)} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" />
          {AXES.map((axis, i) => {
            const end = pointAt(100, axis.angle)
            return (
              <line
                key={axis.key}
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                stroke={active === i ? "var(--accent)" : "var(--border)"}
              />
            )
          })}
          <polygon
            points={plotted.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="var(--accent)"
            fillOpacity="0.16"
            stroke="var(--accent)"
            strokeWidth="2.5"
          />
          {plotted.map((p) => (
            <circle key={p.axis.key} cx={p.x} cy={p.y} r="4.5" fill="var(--accent)" stroke="var(--background)" strokeWidth="2" />
          ))}
        </svg>

        {AXES.map((axis, i) => (
          <button
            key={axis.key}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(active === i ? null : i)}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center px-1 font-mono text-xs uppercase hover:text-accent",
              active === i ? "text-accent underline underline-offset-4" : "text-muted-foreground",
              axis.place,
            )}
          >
            <span>{axis.short}</span>
            <span className="font-semibold text-foreground">{valueText(axis.key)}</span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="min-h-14 border-t border-border pt-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {shown ? (
          <>
            <strong className="text-foreground">{shown.label}:</strong> {valueText(shown.key)}
            {factors[shown.key] != null && "/100"}, reported {rawMetrics[shown.key]}, weight{" "}
            {weightTotal ? Math.round((weights[shown.key] / weightTotal) * 100) : 0}%. {shown.explainer}.
          </>
        ) : (
          "Select a factor for its reported value and weight."
        )}
      </p>

      <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-2 border-accent" />
          This company
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-muted-foreground" />
          Median
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-2 border-dotted border-control" />
          Top quartile
        </li>
      </ul>
    </div>
  )
}
