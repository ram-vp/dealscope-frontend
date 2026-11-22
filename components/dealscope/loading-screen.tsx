import { cn } from "@/lib/utils"

/**
 * Branded first-load cover.
 *
 * CSS only, over prerendered content: it fades on its own after the same 0.4s
 * hold, so it never blocks input, crawlers or visitors without JavaScript.
 * `held` keeps it up while the company universe downloads.
 */
export function LoadingScreen({ held = false }: { held?: boolean }) {
  return (
    <div
      role={held ? "status" : undefined}
      aria-label={held ? "Loading DealScope" : undefined}
      aria-hidden={held ? undefined : true}
      data-nosnippet=""
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background",
        held ? "opacity-100" : "ds-loading-cover pointer-events-none",
      )}
    >
      <div className="grid-bg absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="ds-loading-scan absolute inset-x-0 top-0 h-px bg-accent/60" aria-hidden="true" />

      {/* No <h1> here. This overlay is chrome, not content. */}
      <div className="relative flex flex-col items-center gap-7 px-6 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.4em] text-accent">Initializing</span>
        <div className="ds-loading-pulse font-[family-name:var(--font-bebas)] text-[clamp(3rem,12vw,8rem)] leading-none tracking-tight text-foreground">
          DEALSCOPE
        </div>
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span className="ds-loading-dot" aria-hidden="true" />
          Compiling screened universe
        </div>
      </div>
    </div>
  )
}
