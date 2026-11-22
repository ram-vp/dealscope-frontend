import type React from "react"

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
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{code}</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-none tracking-tight sm:text-7xl">{title}</h1>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </section>
  )
}
