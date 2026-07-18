import { createContext, use } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeTransitionOrigin {
  x: number
  y: number
}

export interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean
  transitioning: boolean
  toggleTheme: (origin?: ThemeTransitionOrigin) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useThemeMode = () => {
  const context = use(ThemeContext)
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider')
  return context
}
