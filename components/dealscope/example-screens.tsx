"use client"

import { MobileDisclosure } from "@/components/ui/disclosure"
import { buttonClass } from "@/components/ui/button"
import { BitmapChevron } from "@/components/bitmap-chevron"
import { type ExampleScreen } from "@/lib/example-screens"

interface ExampleScreensProps {
  screens: { screen: ExampleScreen; count: number }[]
  onApply: (screen: ExampleScreen) => void
  /** Compact grid for the results page, roomy cards for the landing page. */
  variant?: "cards" | "pills"
}

/**
 * One-click screens. Each card's count is computed live from the real dataset
 * through the same parser + screener the search bar uses, so the number shown
 * is exactly what the results page will return -- never a hardcoded claim.
 */
export function ExampleScreens({ screens, onApply, variant = "cards" }: ExampleScreensProps) {
  if (variant === "pills") {
    return (
      <MobileDisclosure label={`Preset screens (${screens.length})`}>
        {screens.map(({ screen, count }) => (
          <button
            type="button"
            key={screen.id}
            onClick={() => onApply(screen)}
            title={screen.description}
            className={buttonClass("secondary", "max-w-full px-3 py-1.5 text-left")}
          >
            <span>{screen.label}</span>
            <span className="font-semibold tabular-nums text-accent">{count}</span>
          </button>
        ))}
      </MobileDisclosure>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {screens.map(({ screen, count }, i) => (
        <div
          key={screen.id}
        >
          <button
            onClick={() => onApply(screen)}
            className="group bg-card/40 border border-control h-full w-full text-left p-5 flex flex-col justify-between gap-4 hover:border-accent/60 hover:bg-accent/5 transition-colors duration-200 cursor-pointer min-w-11"
          >
            <div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2.5">
                <span className="font-display text-3xl tracking-tight leading-none text-accent">
                  {count}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {count === 1 ? "match" : "matches"} · 0{i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-foreground font-semibold leading-relaxed group-hover:text-accent transition-colors">
                {screen.label}
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
                {screen.description}
              </p>
            </div>
            <div className="pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground group-hover:text-accent transition-colors">
                Run screen
              </span>
              <BitmapChevron className="transition-transform duration-[300ms] ease-in-out group-hover:rotate-45 text-muted-foreground group-hover:text-accent" />
            </div>
          </button>
        </div>
      ))}
    </div>
  )
}
