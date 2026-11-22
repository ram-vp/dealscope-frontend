import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return <div className={cn("ds-skeleton bg-secondary", className)} />
}

/** Placeholder for results and tear sheets while the universe downloads. */
export function ViewSkeleton() {
  return (
    <section className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 md:px-12 md:py-16" aria-busy="true">
      <p role="status" className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Loading NSE companies
      </p>
      <div aria-hidden="true">
        <Bone className="mt-4 h-12 w-2/3 max-w-md" />
        <Bone className="mt-8 h-12 w-full max-w-4xl" />
        <div className="mt-10">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-border py-5">
              <Bone className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1">
                <Bone className="h-5 w-1/2 max-w-xs" />
                <Bone className="mt-2 h-3 w-1/3 max-w-[12rem]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

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
    <div role="alert" className={cn("flex flex-wrap items-center gap-3 border border-accent p-4", className)}>
      <p className="font-mono text-xs leading-relaxed text-foreground">{message}</p>
      <Button onClick={onRetry}>
        <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  )
}
