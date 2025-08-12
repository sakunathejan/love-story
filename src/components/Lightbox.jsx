import { useEffect, useRef, useState } from 'react'
import { getMediaBlob } from '../storage'

export default function Lightbox({ items, index, onClose, setIndex }) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const current = items[index]
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1))
      if (e.key === ' ' && current.type === 'video') {
        e.preventDefault()
        togglePlayPause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length, onClose, setIndex, current.type])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    
    console.log('Lightbox: Loading media for ID:', current.id, current.filename, current.type)
    
    ;(async () => {
      try {
        const blob = await getMediaBlob(current.id)
        console.log('Lightbox: Got blob for ID:', current.id, blob ? `size: ${blob.size}` : 'null')
        
        if (!blob) {
          console.error('Lightbox: No blob returned for ID:', current.id)
          setError(true)
          setLoading(false)
          return
        }
        
        if (!cancelled) {
          // For Supabase, blob.url contains the direct public URL
          // No need to create object URL
          console.log('Lightbox: Using direct URL for ID:', current.id, blob.url)
          setUrl(blob.url)
          setLoading(false)
        }
      } catch (err) {
        console.error('Lightbox: Error loading media for ID:', current.id, err)
        setError(true)
        setLoading(false)
      }
    })()
    
    return () => { 
      cancelled = true
      // No need to revoke URL since we're not creating object URLs anymore
    }
  }, [current.id, current.filename, current.type])

  // Reset video states when video changes
  useEffect(() => {
    if (current.type === 'video') {
      setIsMuted(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setShowControls(true)
    }
  }, [current.id, current.type])

  // Auto-hide controls for video
  useEffect(() => {
    if (current.type === 'video' && isPlaying) {
      if (controlsTimeout) clearTimeout(controlsTimeout)
      const timeout = setTimeout(() => setShowControls(false), 3000)
      setControlsTimeout(timeout)
    }
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout)
    }
  }, [isPlaying, current.type])

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      videoRef.current.muted = false
      setIsMuted(false)
      console.log('Lightbox: Video loaded successfully for ID:', current.id)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const handleProgressClick = (e) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const progressWidth = rect.width
      const clickPercent = clickX / progressWidth
      const newTime = clickPercent * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Basic swipe
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0
    function start(e) { startX = e.touches?.[0]?.clientX || 0 }
    function move(e) {
      if (!startX) return
      const x = e.touches?.[0]?.clientX || 0
      const dx = x - startX
      if (Math.abs(dx) > 60) {
        if (dx > 0) setIndex((i) => Math.max(0, i - 1))
        else setIndex((i) => Math.min(items.length - 1, i + 1))
        startX = 0
      }
    }
    el.addEventListener('touchstart', start)
    el.addEventListener('touchmove', move)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
    }
  }, [items.length, setIndex])

  const renderMedia = () => {
    if (loading) {
      return (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading media...</div>
        </div>
      )
    }
    
    if (error || !url) {
      return (
        <div className="text-center text-white">
          <div className="text-2xl mb-4">⚠️</div>
          <div>Failed to load media</div>
          <div className="text-sm opacity-80 mt-2">{current.filename}</div>
        </div>
      )
    }
    
    if (current.type === 'image') {
      return (
        <img 
          src={url} 
          alt={current.filename} 
          className="max-h-full max-w-full w-full object-contain" 
          onError={() => {
            console.error('Lightbox: Image failed to load for ID:', current.id)
            setError(true)
          }}
          onLoad={() => console.log('Lightbox: Image loaded successfully for ID:', current.id)}
        />
      )
    } else {
      return (
        <div className="relative w-full h-full flex items-center justify-center group">
          <video 
            ref={videoRef}
            src={url} 
            className="max-h-full max-w-full w-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Lightbox: Video failed to load for ID:', current.id, e)
              setError(true)
            }}
            onClick={togglePlayPause}
          />
          
          {/* Custom Video Controls */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            } group-hover:opacity-100`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => {
              if (isPlaying) {
                const timeout = setTimeout(() => setShowControls(false), 3000)
                setControlsTimeout(timeout)
              }
            }}
          >
            {/* Progress Bar */}
            <div className="mb-3">
              <div 
                ref={progressRef}
                className="w-full h-2 bg-white/30 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-brand-500 rounded-full relative"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full shadow-lg"></div>
                </div>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  {isMuted ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div className="text-white text-xs opacity-80">
                Click video to play/pause • Spacebar to control
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col w-full overflow-hidden" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-3">
        <div className="text-sm opacity-80 truncate max-w-[60%]">{current.filename}</div>
        <div className="flex gap-2">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Prev</button>
          <button onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Next</button>
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Close</button>
        </div>
      </div>
      <div className="flex-1 grid place-items-center p-2 sm:p-4 w-full overflow-hidden">
        {renderMedia()}
      </div>
    </div>
  )
}
