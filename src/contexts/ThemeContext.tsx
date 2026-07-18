import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { ThemeContext, type ThemeMode, type ThemeTransitionOrigin } from './themeContextValue'

const THEME_STORAGE_KEY = 'cms:theme'

const getInitialTheme = (): ThemeMode => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  } catch {
    // 浏览器禁用存储时继续使用系统主题
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const saveTheme = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // 存储不可用不影响当前会话切换
  }
}

const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}

const getMaximumRadius = ({ x, y }: ThemeTransitionOrigin) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme)
  const [transitioning, setTransitioning] = useState(false)
  const transitioningRef = useRef(false)

  useLayoutEffect(() => {
    applyTheme(mode)
  }, [mode])

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      if (transitioningRef.current) return

      const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark'
      const center = origin ?? { x: window.innerWidth - 44, y: 32 }
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const startViewTransition = document.startViewTransition?.bind(document)

      saveTheme(nextMode)

      if (!startViewTransition || reduceMotion) {
        applyTheme(nextMode)
        setMode(nextMode)
        return
      }

      const radius = getMaximumRadius(center)
      document.documentElement.style.setProperty('--theme-transition-x', `${center.x}px`)
      document.documentElement.style.setProperty('--theme-transition-y', `${center.y}px`)
      document.documentElement.style.setProperty('--theme-transition-radius', `${radius}px`)

      transitioningRef.current = true
      setTransitioning(true)

      const transition = startViewTransition(() => {
        flushSync(() => setMode(nextMode))
        applyTheme(nextMode)
      })

      void transition.finished
        .catch(() => applyTheme(nextMode))
        .finally(() => {
          transitioningRef.current = false
          setTransitioning(false)
          document.documentElement.style.removeProperty('--theme-transition-x')
          document.documentElement.style.removeProperty('--theme-transition-y')
          document.documentElement.style.removeProperty('--theme-transition-radius')
        })
    },
    [mode],
  )

  const value = useMemo(
    () => ({ mode, isDark: mode === 'dark', transitioning, toggleTheme }),
    [mode, transitioning, toggleTheme],
  )

  return (
    <ThemeContext value={value}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext>
  )
}
