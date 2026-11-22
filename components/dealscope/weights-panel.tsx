"use client"

import { useId } from "react"
import { Button } from "@/components/ui/button"
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
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Model Weights"
      title="Factor Weights"
      closeLabel="Close weights panel"
      footer={
        <>
          <p className="flex flex-col font-mono">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Allocation</span>
            <span className="text-sm font-bold text-accent">{total}% Allocated</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onWeightsChange({ ...DEFAULT_WEIGHTS })}>
              Reset
            </Button>
            <Button variant="primary" onClick={onClose}>
              Apply Weights
            </Button>
          </div>
        </>
      }
    >
      <p className="font-mono text-xs leading-relaxed text-muted-foreground">
        Adjust the relative weight of each factor. Composite scores across the screened set recalculate in real time.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {FACTOR_LABELS.map((factor) => (
          <WeightSlider
            key={factor.key}
            label={factor.label}
            value={weights[factor.key]}
            onChange={(v) => onWeightsChange({ ...weights, [factor.key]: v })}
          />
        ))}
      </div>

      <p className="mt-8 border-t border-border pt-6 font-mono text-xs leading-relaxed text-muted-foreground">
        Weights are normalized: relative proportions determine the composite score. Missing metrics are dropped rather
        than treated as zero, and remaining factors are dynamically re-weighted.
      </p>
    </Dialog>
  )
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = useId()
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-accent">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-valuetext={`${value}%`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ds-slider w-full"
      />
    </div>
  )
}
