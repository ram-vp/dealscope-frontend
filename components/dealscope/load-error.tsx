import { cn } from "@/lib/utils"

export function LoadError({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-center gap-3 border border-border/40 bg-card/20 p-4", className)}>
      <p className="font-mono text-xs leading-relaxed text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border border-border/80 bg-card/50 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
}
