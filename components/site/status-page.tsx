import type React from "react"
import { PAGE_TITLE } from "@/components/site/styles"

export function StatusPage({
  code,
  title,
  message,
  children,
}: {
  code: string
  title: string
  message: string
  children: React.ReactNode
}) {
  return (
    <section className="relative min-h-[70dvh] px-4 sm:px-6 md:px-10 lg:px-16 py-10 md:py-16 bg-background text-foreground">
      <div className="relative z-10 max-w-4xl mx-auto">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{code}</span>
        <h1 className={`mt-3 ${PAGE_TITLE}`}>{title}</h1>
        <p className="mt-3 font-sans text-sm sm:text-base leading-relaxed text-foreground/90 text-pretty">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">{children}</div>
      </div>
    </section>
  )
}
