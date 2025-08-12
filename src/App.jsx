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
import SupabaseError from './components/SupabaseError'
// Demo content generation removed - now only shows real uploaded content

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  const [tab, setTab] = useLocalStorage('tab', 'gallery')
  const [supabaseConfigured, setSupabaseConfigured] = useState(true) // Start as true, will be checked

  useEffect(() => {
    document.title = 'Saku & Divya — Our Love Story'
    
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'YOUR_SUPABASE_URL' || 
        supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
      setSupabaseConfigured(false)
      console.error('App: Supabase not configured, showing error page')
    }
  }, [])

  // Show error page if Supabase is not configured
  if (!supabaseConfigured) {
    return <SupabaseError />
  }

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
        Built with love • Media stored in the cloud
      </footer>
    </div>
  )
}

export default App
