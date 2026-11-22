"use client"

import { useId } from "react"
import { Dialog } from "@/components/ui/dialog"
import { type Weights, DEFAULT_WEIGHTS, FACTOR_LABELS } from "@/lib/dealscope-data"

interface WeightsPanelProps {
  open: boolean
  weights: Weights
  onWeightsChange: (weights: Weights) => void
  onClose: () => void
}

export function WeightsPanel({ open, weights, onWeightsChange, onClose }: WeightsPanelProps) {
  const total = weights.revenueGrowth + weights.ebitdaMargin + weights.roce + weights.debtLevel

  return (
    <Dialog open={open} onClose={onClose} label="Weighting controls">
            {/* Sticky Header */}
            <div className="p-6 sm:p-8 border-b border-border/80 bg-background flex items-start justify-between shrink-0">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
                  Model Weights
                </span>
                <h2 className="mt-2 font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl tracking-tight text-foreground">
                  FACTOR WEIGHTS
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Esc: close weights panel"
                className="border border-border/80 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-accent hover:text-accent transition-all duration-200 cursor-pointer"
              >
                ESC ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              className="flex-1 overflow-y-auto p-6 sm:p-8 overscroll-contain space-y-8"
              data-lenis-prevent
            >
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                Adjust the relative weight of each factor. Composite scores across the screened set recalculate in real time.
              </p>

              {/* Sliders */}
              <div className="flex flex-col gap-7">
                {FACTOR_LABELS.map((factor) => (
                  <WeightSlider
                    key={factor.key}
                    label={factor.label}
                    value={weights[factor.key]}
                    onChange={(v) => onWeightsChange({ ...weights, [factor.key]: v })}
                  />
                ))}
              </div>

              <div className="border-t border-border/50 pt-6">
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  Weights are normalized: relative proportions determine the composite score. Missing
                  metrics are dropped rather than treated as zero, and remaining factors are dynamically re-weighted.
                </p>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 sm:p-6 border-t border-border/80 bg-card/95 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 shadow-lg">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Total Allocation
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  {total}% Allocated
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onWeightsChange({ ...DEFAULT_WEIGHTS })}
                  className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  // All-zero weights can't score anything.
                  disabled={total === 0}
                  className="border border-accent bg-accent text-accent-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-accent/90 transition-all cursor-pointer shadow-sm"
                >
                  Apply Weights ➔
                </button>
              </div>
            </div>
    </Dialog>
  )
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">{label}</label>
        <span className="font-mono text-xs text-accent">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} weight`}
        aria-valuetext={`${value}%`}
        className="ds-slider w-full"
      />
    </div>
  )
}
