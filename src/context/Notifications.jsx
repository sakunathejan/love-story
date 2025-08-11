import { createContext, useContext, useState, useCallback } from 'react'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((text) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }, [])

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center pointer-events-none">
        <div className="space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto px-4 py-2 rounded bg-gray-900 text-white shadow-soft">
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
