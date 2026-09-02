import { useState, useEffect } from 'react'

const STORAGE_KEY = 'contas_claras_theme'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return getSystemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    // Aplica o tema no elemento raiz
    document.documentElement.setAttribute('data-theme', theme)
    if (document.body) {
      document.body.setAttribute('data-theme', theme)
    }

    // Escuta mudanças no tema do sistema operacional apenas se não houver preferência explícita salva
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange)
      return () => mediaQuery.removeEventListener('change', handleSystemChange)
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    if (document.body) {
      document.body.setAttribute('data-theme', nextTheme)
    }
  }

  const setThemeExplicit = (newTheme) => {
    if (newTheme === 'system') {
      localStorage.removeItem(STORAGE_KEY)
      const sys = getSystemTheme()
      setTheme(sys)
      document.documentElement.setAttribute('data-theme', sys)
    } else {
      setTheme(newTheme)
      localStorage.setItem(STORAGE_KEY, newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme: setThemeExplicit,
  }
}
