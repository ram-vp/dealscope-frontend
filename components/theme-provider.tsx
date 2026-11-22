"use client"

import type React from "react"
import { createContext, useContext, useSyncExternalStore } from "react"

type Theme = "dark" | "light"

// The <html> class is the source of truth: lib/boot-script.ts sets it before
// first paint, and this provider only reads and toggles it.
const listeners = new Set<() => void>()

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function setTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  try {
    localStorage.setItem("dealscope-theme", theme)
  } catch {
    // Storage blocked: the choice still applies to this page view.
  }
  for (const notify of listeners) notify()
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark")
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
