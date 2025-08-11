import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useLocalStorage } from './hooks/useLocalStorage'
import Header from './components/Header'
import TabNav from './components/TabNav'
import Gallery from './components/Gallery'
import Favorites from './components/Favorites'
import About from './components/About'
import Messages from './components/Messages'
import Settings from './components/Settings'
import ExportBackup from './components/ExportBackup'
import Events from './components/Events'
import { ensureDemoContent } from './storage'

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  const [tab, setTab] = useLocalStorage('tab', 'gallery')

  useEffect(() => {
    document.title = 'Saku & Divya — Our Love Story'
    ensureDemoContent()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header theme={theme} setTheme={setTheme} />
      <TabNav current={tab} onChange={setTab} />
      <main className="flex-1">
        {tab === 'gallery' && <Gallery />}
        {tab === 'favorites' && <Favorites />}
        {tab === 'events' && <Events />}
        {tab === 'about' && <About />}
        {tab === 'messages' && <Messages />}
        {tab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
        {tab === 'backup' && <ExportBackup />}
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-500">
        Built with love • All data stays in your browser
      </footer>
    </div>
  )
}

export default App
