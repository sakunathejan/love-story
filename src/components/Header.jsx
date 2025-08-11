import { useEffect } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'

export default function Header({ theme, setTheme }) {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-gray-900/60 border-b border-gray-200/50 dark:border-gray-800/60 overflow-hidden">
      <div className="container-page flex items-center justify-between py-3">
        <div className="relative">
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
            <span className="text-brand-600 dark:text-brand-400">Saku</span>
            <span className="mx-2 text-gray-400">&</span>
            <span className="text-pink-600 dark:text-pink-400">Divya</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Our Love Story</div>
        </div>
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {theme === 'dark' ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-500" />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
        </button>
      </div>
    </header>
  )
}
