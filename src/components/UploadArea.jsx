import { useRef, useState } from 'react'

export default function UploadArea({ onFiles }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')

  function onChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      handleFileUpload(files)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFileUpload = async (files) => {
    setUploading(true)
    setProgress(0)
    
    // Simulate progress for large files
    const totalFiles = files.length
    let completedFiles = 0
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFile(file.name)
      
      // Show progress based on file size
      if (file.size > 1024 * 1024) { // Files larger than 1MB
        // Simulate processing progress for large files
        for (let p = 0; p <= 100; p += 10) {
          setProgress(p)
          await new Promise(resolve => setTimeout(resolve, 50)) // Small delay for visual effect
        }
      } else {
        // Small files complete quickly
        setProgress(100)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      completedFiles++
      setProgress((completedFiles / totalFiles) * 100)
    }
    
    // Call the original onFiles function
    onFiles(files)
    
    // Reset progress
    setTimeout(() => {
      setUploading(false)
      setProgress(0)
      setCurrentFile('')
    }, 1000)
  }

  return (
    <div className="text-center py-6">
      {!uploading ? (
        <>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
               onClick={() => inputRef.current?.click()}>
            <span className="text-base sm:text-lg">📸</span>
            <span className="text-xs sm:text-sm md:text-base">Add Memories</span>
            <span className="text-base sm:text-lg">✨</span>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Click to upload photos & videos
          </p>
        </>
      ) : (
        <div className="max-w-sm sm:max-w-md mx-auto space-y-3 sm:space-y-4">
          <div className="text-center">
            <div className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              📤 Uploading...
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate px-2" title={currentFile}>
              {currentFile}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress)}% Complete
          </div>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
