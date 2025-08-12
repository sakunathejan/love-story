import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import { FaBars, FaTimes } from 'react-icons/fa'

const tabs = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'events', label: 'Events' },
  { id: 'about', label: 'About Us' },
  { id: 'messages', label: 'Guestbook' },
  { id: 'settings', label: 'Settings' },
  { id: 'backup', label: 'Backup' },
]

export default function TabNav({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const popRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 backdrop-blur">
      <div className="container-page">
        {/* Mobile hamburger */}
        <div className="relative sm:hidden py-2" ref={popRef}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {tabs.find((t) => t.id === current)?.label || 'Menu'}
            </div>
            <button
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {open ? <FaTimes /> : <FaBars />}
            </button>
          </div>
                                  {open && createPortal(
              <div className="fixed left-4 right-4 xs:left-8 xs:right-8 sm:left-16 sm:right-16 md:left-32 md:right-32 lg:left-64 lg:right-64 top-20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl overflow-hidden z-[999999] ring-1 ring-black/5 dark:ring-white/5" style={{zIndex: 999999}}>
                <div className="flex flex-col p-2">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChange(t.id)
                        setOpen(false)
                      }}
                      className={classNames(
                        'px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 mx-1',
                        current === t.id
                          ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-700 dark:text-brand-300 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:scale-[1.02]'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Desktop/tablet tabs */}
        <div className="hidden sm:flex overflow-x-auto gap-1 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={classNames(
                'px-3 sm:px-4 py-2 rounded-md text-sm whitespace-nowrap transition flex-shrink-0',
                current === t.id
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
