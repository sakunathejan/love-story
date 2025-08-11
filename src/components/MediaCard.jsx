import { useEffect, useState } from 'react'
import { FaHeart, FaRegHeart, FaShareAlt, FaTrash, FaCommentAlt, FaEdit, FaReply, FaSmile, FaTimes, FaEllipsisH } from 'react-icons/fa'
import { getMediaBlob, updateMeta, addComment, addMediaReply, addMediaReaction, getClientId } from '../storage'

export default function MediaCard({ meta, onToggleFavorite, onOpen, onDelete, onComment, onUpdate }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [currentMedia, setCurrentMedia] = useState(meta)

  useEffect(() => {
    setCurrentMedia(meta)
  }, [meta])

  useEffect(() => {
    let revoked = false
    setLoading(true)
    setError(false)
    
    console.log('MediaCard: Loading media for', meta.id, meta.filename, meta.type)
    
    ;(async () => {
      try {
        const blob = await getMediaBlob(meta.id)
        console.log('MediaCard: Got blob for', meta.id, blob ? 'success' : 'null')
        
        if (!blob) {
          console.error('MediaCard: No blob returned for', meta.id)
          setError(true)
          setLoading(false)
          return
        }
        
        if (!revoked) {
          const objectUrl = URL.createObjectURL(blob)
          console.log('MediaCard: Created object URL for', meta.id, objectUrl)
          setUrl(objectUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error('MediaCard: Error loading media for', meta.id, err)
        setError(true)
        setLoading(false)
      }
    })()
    
    return () => { 
      revoked = true
      if (url) { 
        console.log('MediaCard: Revoking URL for', meta.id)
        URL.revokeObjectURL(url) 
      }
    }
  }, [meta.id, meta.filename, meta.type])

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditModal) {
      setEditTitle(meta.filename)
      setEditDate(new Date(meta.createdAt).toISOString().split('T')[0])
    }
  }, [showEditModal, meta.filename, meta.createdAt])

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsMenu && !event.target.closest('.actions-menu-container')) {
        setShowActionsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionsMenu])

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!editTitle.trim()) return
    
    setSaving(true)
    try {
      const updatedMeta = await updateMeta(meta.id, (current) => ({
        ...current,
        filename: editTitle.trim(),
        createdAt: new Date(editDate).getTime()
      }))
      
      if (onUpdate) {
        onUpdate(updatedMeta)
      }
      
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating media:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowEditModal(false)
    setEditTitle(meta.filename)
    setEditDate(new Date(meta.createdAt).toISOString().split('T')[0])
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    try {
      const updatedMeta = await addComment(meta.id, newComment.trim())
      if (updatedMeta) {
        setCurrentMedia(updatedMeta)
        setNewComment('')
        if (onUpdate) {
          onUpdate(updatedMeta)
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return
    
    try {
      const updatedMeta = await addMediaReply(meta.id, commentId, { text: replyText.trim() })
      if (updatedMeta) {
        setCurrentMedia(updatedMeta)
        setReplyText('')
        setReplyingTo(null)
        if (onUpdate) {
          onUpdate(updatedMeta)
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleReaction = async (commentId, emoji) => {
    try {
      const updatedMeta = await addMediaReaction(meta.id, commentId, emoji)
      if (updatedMeta) {
        setCurrentMedia(updatedMeta)
        // Hide the emoji picker after adding a reaction
        setShowEmojiPicker(null)
        if (onUpdate) {
          onUpdate(updatedMeta)
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const updatedMeta = await updateMeta(meta.id, (current) => ({
        ...current,
        comments: (current.comments || []).filter(c => c.id !== commentId)
      }))
      if (updatedMeta) {
        setCurrentMedia(updatedMeta)
        if (onUpdate) {
          onUpdate(updatedMeta)
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const updatedMeta = await updateMeta(meta.id, (current) => ({
        ...current,
        comments: (current.comments || []).map(c => 
          c.id === commentId 
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) }
            : c
        )
      }))
      if (updatedMeta) {
        setCurrentMedia(updatedMeta)
        if (onUpdate) {
          onUpdate(updatedMeta)
        }
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      // Don't crash the app, just log the error
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const handleNativeShare = async () => {
    try {
      if (navigator.share && url) {
        await navigator.share({
          title: meta.filename,
          text: `Check out this ${meta.type}: ${meta.filename}`,
          url: url
        })
        // Close the modal after successful share
        setShowShareModal(false)
      } else {
        // Fallback for browsers without native share
        console.log('Native sharing not supported, falling back to copy link')
        await handleCopyLink()
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // If user cancels share, don't show error
      if (error.name !== 'AbortError') {
        // Fallback to copy link if share fails
        await handleCopyLink()
      }
    }
  }

  const handleCopyLink = async () => {
    try {
      if (url) {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url)
          console.log('Link copied to clipboard via modern API')
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea')
          textArea.value = url
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          
          try {
            document.execCommand('copy')
            console.log('Link copied to clipboard via fallback method')
          } catch (err) {
            console.error('Fallback copy failed:', err)
            // Last resort: show the URL to user
            alert(`Copy this link manually: ${url}`)
            return
          } finally {
            document.body.removeChild(textArea)
          }
        }
        
        // Show success feedback (you could add a toast notification here)
        console.log('Link copied successfully!')
        
        // Show success feedback
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
        
        // Close the modal after successful copy
        setShowShareModal(false)
      } else {
        console.error('No URL available to copy')
      }
    } catch (error) {
      console.error('Error copying link:', error)
      // Show error to user
      alert('Failed to copy link. Please try again.')
    }
  }

  const handleDownload = () => {
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = meta.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const emojis = ['❤️', '👍', '😊', '🎉', '🔥', '💯', '👏', '😍', '🤔', '😂']

  const renderMedia = () => {
    if (loading) {
      return (
        <div className="w-full h-full grid place-items-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto mb-2"></div>
            Loading...
          </div>
        </div>
      )
    }
    
    if (error || !url) {
      // Handle text-based demo content
      if (meta.type === 'text' && meta.content) {
        return (
          <div className="w-full h-full grid place-items-center text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 p-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium text-xs leading-tight">{meta.content}</div>
            </div>
          </div>
        )
      }
      
      return (
        <div className="w-full h-full grid place-items-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            Failed to load
            <div className="text-xs mt-1">{meta.type}</div>
          </div>
        </div>
      )
    }
    
    if (meta.type === 'image') {
      return (
        <img 
          src={url} 
          alt={meta.filename} 
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" 
          onError={(e) => {
            console.error('MediaCard: Image failed to load for', meta.id, e)
            setError(true)
          }}
          onLoad={() => console.log('MediaCard: Image loaded successfully for', meta.id)}
        />
      )
    } else if (meta.type === 'video') {
      return (
        <video 
          src={url} 
          className="w-full h-full object-cover" 
          muted 
          onError={(e) => {
            console.error('MediaCard: Video failed to load for', meta.id, e)
            setError(true)
          }}
          onLoadedData={() => console.log('MediaCard: Video loaded successfully for', meta.id)}
        />
      )
    } else {
      // Fallback for other types
      return (
        <div className="w-full h-full grid place-items-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-xs">{meta.type}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <div className="group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
        <div className="relative">
          <button className="block w-full aspect-video overflow-hidden" onClick={() => onOpen(meta)}>
            {renderMedia()}
          </button>
          
          {/* Three Dots Menu - Top Right Corner */}
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 actions-menu-container">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
            >
              <FaEllipsisH className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            
            {/* Actions Dropdown */}
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 sm:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    handleEdit()
                  }}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <FaEdit className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    handleShare()
                  }}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <FaShareAlt className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  Share
                </button>
                <button
                  onClick={() => {
                    setShowActionsMenu(false)
                    onDelete(meta)
                  }}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                >
                  <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-2 sm:p-3">
          {/* Title and Date Row */}
          <div className="mb-2 sm:mb-3">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-medium truncate" title={meta.filename}>{meta.filename}</div>
              <div className="text-xs text-gray-500">{new Date(meta.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
           
           {/* Favorite and Comments Row */}
           <div className="flex items-center gap-1 sm:gap-2">
             <button 
               aria-label="Favorite" 
               onClick={() => onToggleFavorite(meta)} 
               className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center"
             >
               {meta.favorite ? <FaHeart className="text-pink-500 w-3 h-3 sm:w-4 sm:h-4" /> : <FaRegHeart className="text-gray-500 w-3 h-3 sm:w-4 sm:h-4" />}
               <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                 {meta.favorite ? 'Favorited' : 'Favorite'}
               </span>
             </button>
             
             <button 
               aria-label="Comments" 
               onClick={() => setShowComments(!showComments)} 
               className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center ${
                 showComments ? 'bg-gray-100 dark:bg-gray-800' : ''
               }`}
             >
               <FaCommentAlt className="text-gray-500 w-3 h-3 sm:w-4 sm:h-4" />
               <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                 {currentMedia.comments && currentMedia.comments.length > 0 
                   ? `${currentMedia.comments.length} comment${currentMedia.comments.length === 1 ? '' : 's'}`
                   : 'Comment'
                 }
               </span>
             </button>
           </div>
         </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-2 sm:p-3">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Comments ({currentMedia.comments?.length || 0})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Add Comment */}
            <div className="flex gap-2 mb-2 sm:mb-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>

            {/* Comments List with Fixed Height */}
            <div className="max-h-48 sm:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
              {currentMedia.comments && currentMedia.comments.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {currentMedia.comments.map((comment) => (
                    <div key={comment.id} className="space-y-1.5 sm:space-y-2">
                      {/* Main Comment */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {comment.author || 'Guest'}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {comment.text || ''}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
                              >
                                <FaReply className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Reply
                              </button>
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                                className="text-xs text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
                              >
                                <FaSmile className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                React
                              </button>
                              <span className="text-xs text-gray-400">
                                {comment.at ? new Date(comment.at).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>

                            {/* Reactions */}
                            {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                                {Object.entries(comment.reactions).map(([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300"
                                  >
                                    {emoji} {count}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Emoji Picker */}
                            {showEmojiPicker === comment.id && (
                              <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {emojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(comment.id, emoji)}
                                      className="text-base sm:text-lg hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <FaTimes className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                              />
                              <button
                                onClick={() => handleAddReply(comment.id)}
                                disabled={!replyText.trim()}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="ml-3 sm:ml-4 bg-white dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 border-l-2 border-brand-200 dark:border-brand-800">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                      {reply.name || 'Guest'}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
                                      {reply.text || ''}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {reply.at ? new Date(reply.at).toLocaleDateString() : 'Unknown date'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteReply(comment.id, reply.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <FaTimes className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm py-3 sm:py-4">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show Comment Toggle Button when Comments are Hidden */}
        {!showComments && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-2 sm:p-3">
            <button
              onClick={() => setShowComments(true)}
              className="w-full text-xs sm:text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            >
              <FaCommentAlt className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">
                {currentMedia.comments && currentMedia.comments.length > 0 
                  ? `View ${currentMedia.comments.length} comment${currentMedia.comments.length === 1 ? '' : 's'}`
                  : 'Add a comment'
                }
              </span>
              <span className="xs:hidden">
                {currentMedia.comments && currentMedia.comments.length > 0 
                  ? `${currentMedia.comments.length} comment${currentMedia.comments.length === 1 ? '' : 's'}`
                  : 'Comment'
                }
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Edit Media Details
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter title..."
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Share {meta.filename}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {/* Native Share (if available) */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-100 dark:bg-brand-800 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">Share via...</div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Use your device's share options</div>
                  </div>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left border rounded-lg transition-colors ${
                  copySuccess 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  copySuccess 
                    ? 'bg-green-100 dark:bg-green-800' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {copySuccess ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {copySuccess ? 'Link Copied!' : 'Copy Link'}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {copySuccess ? 'Link copied to clipboard' : 'Copy the media URL to clipboard'}
                  </div>
                </div>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Download</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Save the media file to your device</div>
                </div>
              </button>

              {/* Media Info */}
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{meta.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{(meta.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(meta.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
