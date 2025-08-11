import { useEffect, useState } from 'react'
import { getAllMediaMeta } from '../storage'
import MediaCard from './MediaCard'
import Lightbox from './Lightbox'

export default function Events() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [allItems, setAllItems] = useState([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const items = await getAllMediaMeta()
      setAllItems(items)
      
      const byDate = new Map()
      
      for (const m of items) {
        const date = new Date(m.createdAt)
        const key = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD for sorting
        
        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, { 
            displayDate: key, 
            items: [],
            timestamp: date.getTime()
          })
        }
        byDate.get(dateKey).items.push(m)
      }
      
      // Sort by date (newest first) and convert to array
      const sortedGroups = Array.from(byDate.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([_, group]) => group)
      
      setGroups(sortedGroups)
      setLoading(false)
    })()
  }, [])

  const handleOpenMedia = (item) => {
    const index = allItems.findIndex(m => m.id === item.id)
    setLightboxIndex(index)
  }

  if (loading) {
    return (
      <div className="container-page py-6">
        <div className="text-center text-gray-500">Loading events...</div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="container-page py-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Events Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start adding photos and videos to see them organized by date!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          📅 Our Timeline
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Relive your precious moments organized by date
        </p>
      </div>

      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {group.displayDate}
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {group.items.length} {group.items.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {group.items.map((m) => (
              <div key={m.id} className="group cursor-pointer" onClick={() => handleOpenMedia(m)}>
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 hover:border-brand-300 dark:hover:border-brand-600 transition-colors">
                  {m.type === 'image' ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-brand-400 transition-colors">
                      📷
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-brand-400 transition-colors">
                      🎥
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate" title={m.filename}>
                    {m.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.type === 'image' ? 'Photo' : 'Video'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox for viewing media */}
      {lightboxIndex >= 0 && (
        <Lightbox
          items={allItems}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </div>
  )
}
