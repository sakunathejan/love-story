import { useEffect, useMemo, useState } from 'react'
import UploadArea from './UploadArea'
import MediaCard from './MediaCard'
import Lightbox from './Lightbox'
import { addMediaFiles, deleteMedia, getAllMediaMeta, toggleFavorite, addComment, ensureDemoContent, testStorage } from '../storage'
import { useNotifications } from '../context/Notifications.jsx'

export default function Gallery() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [subTab, setSubTab] = useState('all') // all | image | video
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [processingFiles, setProcessingFiles] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const { notify } = useNotifications()
  const pageSize = 24

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        console.log('Gallery: Starting initialization...')
        
        // Test storage first
        console.log('Gallery: Testing storage...')
        const storageWorking = await testStorage()
        console.log('Gallery: Storage test result:', storageWorking)
        
        if (!storageWorking) {
          console.error('Gallery: Storage is not working, cannot proceed')
          setLoading(false)
          return
        }
        
        // Check if we already have media
        console.log('Gallery: Checking existing media...')
        const existingMetas = await getAllMediaMeta()
        console.log('Gallery: Existing media count:', existingMetas.length)
        
        if (existingMetas.length > 0) {
          console.log('Gallery: Using existing media')
          setItems(existingMetas)
          setLoading(false)
          return
        }
        
        // Ensure demo content exists first
        console.log('Gallery: Creating demo content...')
        const demoContent = await ensureDemoContent()
        console.log('Gallery: Demo content result:', demoContent.length, 'items')
        
        // If we got demo content, use it immediately
        if (demoContent && demoContent.length > 0) {
          console.log('Gallery: Using demo content immediately')
          setItems(demoContent)
          setLoading(false)
          return
        }
        
        // If no demo content was created, try to load again
        console.log('Gallery: No demo content, trying to load media again...')
        const retryMetas = await getAllMediaMeta()
        console.log('Gallery: Retry media count:', retryMetas.length)
        
        if (retryMetas.length > 0) {
          console.log('Gallery: Found media on retry')
          setItems(retryMetas)
        } else {
          console.log('Gallery: No media found, showing empty state')
          setItems([])
        }
        
        setLoading(false)
        
      } catch (error) {
        console.error('Gallery: Error during initialization:', error)
        setLoading(false)
        setItems([])
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((m) => {
      if (subTab !== 'all' && m.type !== subTab) return false
      if (!q) return true
      const hay = `${m.filename} ${m.tags?.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query, subTab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function handleUpload(files) {
    setProcessingFiles(true)
    setProcessingProgress(0)
    
    try {
      // Show progress for large files
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const largeFiles = files.filter(file => file.size > 1024 * 1024) // > 1MB
      
      if (largeFiles.length > 0) {
        // Process large files with progress
        for (let i = 0; i < largeFiles.length; i++) {
          const file = largeFiles[i]
          const fileProgress = (i / largeFiles.length) * 100
          setProcessingProgress(fileProgress)
          
          // Simulate processing time based on file size
          const processingTime = Math.min(file.size / (1024 * 1024) * 100, 500) // Max 500ms
          await new Promise(resolve => setTimeout(resolve, processingTime))
        }
      }
      
      setProcessingProgress(100)
      
      // Add the files to storage
      const added = await addMediaFiles(files)
      setItems((prev) => [...added, ...prev])
      notify(`Uploaded ${added.length} item(s)`)
      
    } catch (error) {
      notify('Error uploading files')
      console.error('Upload error:', error)
    } finally {
      // Hide progress after a short delay
      setTimeout(() => {
        setProcessingFiles(false)
        setProcessingProgress(0)
      }, 1000)
    }
  }

  async function handleToggleFavorite(meta) {
    const next = await toggleFavorite(meta.id)
    setItems((prev) => prev.map((m) => (m.id === next.id ? next : m)))
  }

  async function handleDelete(meta) {
    await deleteMedia(meta.id)
    setItems((prev) => prev.filter((m) => m.id !== meta.id))
    notify('Deleted')
  }

  async function handleComment(meta) {
    const text = prompt('Write a comment:')
    if (!text) return
    const next = await addComment(meta.id, text)
    setItems((prev) => prev.map((m) => (m.id === next.id ? next : m)))
    notify('Comment added')
  }

  async function handleUpdate(updatedMeta) {
    setItems((prev) => prev.map((m) => (m.id === updatedMeta.id ? updatedMeta : m)))
    notify('Media updated successfully')
  }

  return (
    <div className="container-page py-6 space-y-6">
      <UploadArea onFiles={handleUpload} />

      {/* Processing Progress Indicator */}
      {processingFiles && (
        <div className="max-w-sm sm:max-w-md mx-auto p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">
              🚀 Processing Files...
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {Math.round(processingProgress)}% Complete
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          aria-label="Search"
          placeholder="Search by filename or tag"
          className="w-full sm:w-72 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
        />
        <div className="flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
          {['all','image','video'].map((t) => (
            <button 
              key={t} 
              onClick={() => { setSubTab(t); setPage(1) }} 
              className={`flex-1 sm:flex-none px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                subTab===t
                  ? 'bg-brand-600 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t === 'all' ? 'All' : t === 'image' ? 'Photos' : 'Videos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
            {pageItems.map((m, i) => (
              <MediaCard
                key={m.id}
                meta={m}
                onToggleFavorite={handleToggleFavorite}
                onOpen={() => setLightboxIndex((page - 1) * pageSize + i)}
                onDelete={handleDelete}
                onComment={handleComment}
                onUpdate={handleUpdate}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 pt-4">
            <div className="flex items-center gap-2">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </div>
          </div>
        </>
      )}

      {lightboxIndex >= 0 && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </div>
  )
}
