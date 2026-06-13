'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  /** When the sidebar is collapsed, show only the icon centred */
  collapsed?: boolean
}

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Avoid hydration mismatch — render nothing until mounted on the client
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Reserve space so the sidebar doesn't shift on mount
    return <div className="h-8 w-8" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-1.5 rounded-[6px] text-navy-mid hover:bg-paper-border transition-colors flex items-center gap-2 flex-shrink-0 ${
        collapsed ? 'justify-center border border-paper-border bg-paper' : ''
      }`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      )}
      {!collapsed && (
        <span className="text-[14px] font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  )
}
