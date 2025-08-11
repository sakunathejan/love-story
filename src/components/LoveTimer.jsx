import { useState, useEffect } from 'react'
import { getSettings } from '../storage'

export default function LoveTimer() {
  const [timeTogether, setTimeTogether] = useState({ days: 0, months: 0, years: 0 })
  const [startDate, setStartDate] = useState('2025-05-29')

  useEffect(() => {
    // Load start date from settings
    ;(async () => {
      const settings = await getSettings()
      if (settings.loveStartDate) {
        setStartDate(settings.loveStartDate)
      }
    })()

    // Calculate time difference
    function updateTimer() {
      const start = new Date(startDate)
      const now = new Date()
      const diffTime = Math.abs(now - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Calculate years, months, and remaining days
      const years = Math.floor(diffDays / 365)
      const remainingDays = diffDays % 365
      const months = Math.floor(remainingDays / 30.44) // Average days per month
      const days = Math.floor(remainingDays % 30.44)
      
      setTimeTogether({ days, months, years })
    }

    // Update immediately and then every minute
    updateTimer()
    const interval = setInterval(updateTimer, 60000)

    return () => clearInterval(interval)
  }, [startDate])

  const formatDuration = () => {
    const parts = []
    if (timeTogether.years > 0) {
      parts.push(`${timeTogether.years} year${timeTogether.years !== 1 ? 's' : ''}`)
    }
    if (timeTogether.months > 0) {
      parts.push(`${timeTogether.months} month${timeTogether.months !== 1 ? 's' : ''}`)
    }
    if (timeTogether.days > 0) {
      parts.push(`${timeTogether.days} day${timeTogether.days !== 1 ? 's' : ''}`)
    }
    
    if (parts.length === 0) return 'Just started!'
    return parts.join(', ')
  }

  return (
    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800">
      <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">
        💕 Our Love Journey 💕
      </div>
      <div className="text-lg text-gray-700 dark:text-gray-300 mb-3">
        We've been together for
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-brand-600 dark:text-brand-400 mb-3">
        {formatDuration()}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Since {new Date(startDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        💝 Every moment with you is precious 💝
      </div>
    </div>
  )
}
