import { useEffect, useMemo, useState } from 'react'
import UploadArea from './UploadArea'
import MediaCard from './MediaCard'
import Lightbox from './Lightbox'
import { addMediaFiles, deleteMedia, getAllMediaMeta, toggleFavorite, addComment } from '../storage'
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
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const { notify } = useNotifications()
  const pageSize = 16

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        console.log('Gallery: Starting initialization...')
        
        // Load existing media from Supabase
        console.log('Gallery: Loading media from Supabase...')
        const existingMetas = await getAllMediaMeta()
        console.log('Gallery: Existing media count:', existingMetas.length)
        console.log('Gallery: Media data:', existingMetas)
        
        if (existingMetas.length > 0) {
          console.log('Gallery: Using existing media')
          setItems(existingMetas)
        } else {
          console.log('Gallery: No media found, showing empty state')
          setItems([])
        }
        
        setLoading(false)
        
      } catch (error) {
        console.error('Gallery: Error during initialization:', error)
        console.error('Gallery: Error details:', error.message, error.stack)
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
        // Process large files with gradual progress
        for (let i = 0; i < largeFiles.length; i++) {
          const file = largeFiles[i]
          
          // Calculate progress for this file
          const startProgress = (i / largeFiles.length) * 100
          const endProgress = ((i + 1) / largeFiles.length) * 100
          
          // Gradually increase progress for this file
          for (let step = 0; step <= 10; step++) {
            const currentProgress = startProgress + (step / 10) * (endProgress - startProgress)
            setProcessingProgress(currentProgress)
            await new Promise(resolve => setTimeout(resolve, 100)) // 100ms per step
          }
          
          // Simulate actual file processing time
          const processingTime = Math.min(file.size / (1024 * 1024) * 200, 1000) // Max 1 second
          await new Promise(resolve => setTimeout(resolve, processingTime))
        }
      } else {
        // For small files, show gradual progress
        for (let step = 0; step <= 20; step++) {
          setProcessingProgress((step / 20) * 100)
          await new Promise(resolve => setTimeout(resolve, 50)) // 50ms per step
        }
      }
      
      // Final 100% completion
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
      }, 1500)
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

  // Bulk delete functions
  function toggleBulkDeleteMode() {
    setBulkDeleteMode(!bulkDeleteMode)
    setSelectedItems(new Set())
  }

  function toggleItemSelection(id) {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  function selectAllOnPage() {
    const pageIds = pageItems.map(item => item.id)
    setSelectedItems(new Set(pageIds))
  }

  function clearSelection() {
    setSelectedItems(new Set())
  }

  async function handleBulkDelete() {
    if (selectedItems.size === 0) return
    
    setShowBulkDeleteConfirm(true)
  }

  async function confirmBulkDelete() {
    setShowBulkDeleteConfirm(false)
    setProcessingFiles(true)
    setProcessingProgress(0)
    
    try {
      const itemsToDelete = Array.from(selectedItems)
      let deletedCount = 0
      
      for (let i = 0; i < itemsToDelete.length; i++) {
        const id = itemsToDelete[i]
        
        // Calculate progress for this item
        const startProgress = (i / itemsToDelete.length) * 100
        const endProgress = ((i + 1) / itemsToDelete.length) * 100
        
        // Gradually increase progress for this item
        for (let step = 0; step <= 8; step++) {
          const currentProgress = startProgress + (step / 8) * (endProgress - startProgress)
          setProcessingProgress(currentProgress)
          await new Promise(resolve => setTimeout(resolve, 80)) // 80ms per step
        }
        
        // Actually delete the item
        const success = await deleteMedia(id)
        if (success) {
          deletedCount++
        }
        
        // Final progress for this item
        setProcessingProgress(endProgress)
      }
      
      // Remove deleted items from state
      setItems((prev) => prev.filter((m) => !selectedItems.has(m.id)))
      setSelectedItems(new Set())
      setBulkDeleteMode(false)
      
      notify(`Successfully deleted ${deletedCount} item(s)`)
      
    } catch (error) {
      notify('Error during bulk delete')
      console.error('Bulk delete error:', error)
    } finally {
      setTimeout(() => {
        setProcessingFiles(false)
        setProcessingProgress(0)
      }, 1500)
    }
  }

  // Debug logging
  console.log('Gallery render state:', { loading, itemsCount: items.length, filteredCount: filtered.length, pageItemsCount: pageItems.length })

  return (
    <div className="container-page py-6 space-y-6">
      <UploadArea onFiles={handleUpload} />

                           {/* Processing Progress Indicator */}
        {processingFiles && (
          <div className="max-w-sm sm:max-w-md mx-auto bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="text-center space-y-4">
                {/* Icon and Title */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">
                      {selectedItems.size > 0 ? '🗑️' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedItems.size > 0 ? 'Deleting Files' : 'Processing Files'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please wait while we {selectedItems.size > 0 ? 'remove' : 'upload'} your files
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {Math.round(processingProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700"
                      style={{ width: `${processingProgress}%` }}
                    >
                      {/* Animated Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      
                      {/* Progress Animation Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                      
                      {/* Moving Light Effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                          animation: 'moveLight 2s ease-in-out infinite',
                          transform: `translateX(${processingProgress > 0 ? (processingProgress - 100) : -100}%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Status Text */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {processingProgress < 100 ? 'Processing...' : 'Complete!'}
                </div>
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

                                                               {/* Bulk Delete Controls */}
          {filtered.length > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Header - Desktop Layout */}
              <div className="hidden sm:block px-4 py-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleBulkDeleteMode}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        bulkDeleteMode
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/25'
                      }`}
                    >
                      {bulkDeleteMode ? '✕ Cancel' : '🗑️ Bulk Delete'}
                    </button>
                    
                    {bulkDeleteMode && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllOnPage}
                          className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                          ✓ Select All
                        </button>
                        <button
                          onClick={clearSelection}
                          className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-gray-500/25"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {bulkDeleteMode && selectedItems.size > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 dark:bg-gray-700/70 rounded-full border border-gray-200/50 dark:border-gray-600/50">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {selectedItems.size} selected
                        </span>
                      </div>
                      
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center gap-2"
                      >
                        🗑️ Delete {selectedItems.size}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header - Tablet Layout */}
              <div className="hidden xs:block sm:hidden px-4 py-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleBulkDeleteMode}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        bulkDeleteMode
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/25'
                      }`}
                    >
                      {bulkDeleteMode ? '✕ Cancel' : '🗑️ Bulk Delete'}
                    </button>
                    
                    {bulkDeleteMode && selectedItems.size > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center gap-2"
                      >
                        🗑️ Delete {selectedItems.size}
                      </button>
                    )}
                  </div>
                  
                  {bulkDeleteMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllOnPage}
                        className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                      >
                        ✓ Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-gray-500/25"
                      >
                        Clear
                      </button>
                      {selectedItems.size > 0 && (
                        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400 font-medium">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 dark:bg-gray-700/70 rounded-full border border-gray-200/50 dark:border-gray-600/50">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {selectedItems.size} selected
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header - Mobile Layout */}
              <div className="xs:hidden px-4 py-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleBulkDeleteMode}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                        bulkDeleteMode
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/25'
                      }`}
                    >
                      {bulkDeleteMode ? '✕ Cancel' : '🗑️ Bulk'}
                    </button>
                    
                    {bulkDeleteMode && selectedItems.size > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-red-500/25"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  
                  {bulkDeleteMode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllOnPage}
                          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                          ✓ All
                        </button>
                        <button
                          onClick={clearSelection}
                          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-gray-500/25"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {selectedItems.size > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 dark:bg-gray-700/70 rounded-full border border-gray-200/50 dark:border-gray-600/50">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {selectedItems.size}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile Actions - Extra Small Screens */}
              {bulkDeleteMode && selectedItems.size > 0 && (
                <div className="xs:hidden px-4 py-2 bg-white/30 dark:bg-gray-800/30 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded transition-all duration-200"
                    >
                      Clear All
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

      {loading ? (
        <div className="text-center text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No memories yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start building your love story by uploading your first photo or video
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
               onClick={() => document.querySelector('input[type="file"]')?.click()}>
            <span className="text-lg">📸</span>
            <span className="text-sm sm:text-base">Upload First Memory</span>
            <span className="text-lg">✨</span>
          </div>
        </div>
      ) : (
        <>
                     <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
             {pageItems.map((m, i) => (
               <div key={m.id} className="relative">
                 {/* Bulk Delete Checkbox */}
                 {bulkDeleteMode && (
                   <div className="absolute top-2 left-2 z-10">
                     <input
                       type="checkbox"
                       checked={selectedItems.has(m.id)}
                       onChange={() => toggleItemSelection(m.id)}
                       className="w-5 h-5 text-brand-600 bg-white border-2 border-gray-300 rounded focus:ring-brand-500 focus:ring-2 cursor-pointer"
                     />
                   </div>
                 )}
                 
                 <MediaCard
                   meta={m}
                   onToggleFavorite={handleToggleFavorite}
                   onOpen={() => setLightboxIndex((page - 1) * pageSize + i)}
                   onDelete={handleDelete}
                   onComment={handleComment}
                   onUpdate={handleUpdate}
                 />
               </div>
             ))}
           </div>

          {totalPages > 1 && (
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
          )}
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

                                                               {/* Bulk Delete Confirmation Modal */}
          {showBulkDeleteConfirm && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 xs:p-3 sm:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[280px] xs:max-w-sm sm:max-w-md p-4 xs:p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center space-y-4 xs:space-y-5 sm:space-y-6">
                  {/* Warning Icon */}
                  <div className="mx-auto w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <div className="space-y-2 xs:space-y-3">
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Confirm Bulk Delete
                    </h3>
                    <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      Are you sure you want to delete <span className="font-bold text-red-500 dark:text-red-400">{selectedItems.size}</span> item{selectedItems.size !== 1 ? 's' : ''}?
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 xs:px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <span className="text-red-500 dark:text-red-400 text-xs xs:text-sm">⚠️</span>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">This action cannot be undone</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-2">
                    <button
                      onClick={() => setShowBulkDeleteConfirm(false)}
                      className="w-full xs:flex-1 px-4 xs:px-6 py-2.5 xs:py-3 text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 hover:shadow-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmBulkDelete}
                      className="w-full xs:flex-1 px-4 xs:px-6 py-2.5 xs:py-3 text-xs xs:text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 hover:shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                    >
                      <span className="hidden sm:inline">🗑️ Delete {selectedItems.size} Items</span>
                      <span className="sm:hidden">🗑️ Delete {selectedItems.size}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
     </div>
   )
 }
