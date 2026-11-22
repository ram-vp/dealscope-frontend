"use client"

import React from "react"
import { Sun, Moon } from "lucide-react"
import { buttonClass } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={buttonClass("secondary", `min-w-11 px-3 ${className}`)}
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
    >
      {theme === "dark" ? (
        <>
          <Sun aria-hidden="true" className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon aria-hidden="true" className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  )
}
