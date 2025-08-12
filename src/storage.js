import { supabase, uploadFile, deleteFile, getPublicUrl, initializeStorage } from './supabase'
import { nanoid } from 'nanoid'

// Check if Supabase is properly configured
function checkSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'YOUR_SUPABASE_URL' || 
      supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
}

// Initialize Supabase storage on first load
try {
  checkSupabaseConfig()
  initializeStorage()
} catch (error) {
  console.error('Storage initialization failed:', error.message)
}

// For guestbook messages and settings (still using localStorage for now)
const messageStore = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

const settingsStore = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

export async function getMediaIndex() {
  try {
    // Check Supabase configuration first
    checkSupabaseConfig()
    
    // Get all media IDs from Supabase
    const { data, error } = await supabase
      .from('media')
      .select('id')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('getMediaIndex: Error retrieving index:', error)
      return []
    }
    
    const result = data.map(item => item.id)
    console.log('getMediaIndex: Retrieved index:', result.length, 'items')
    return result
  } catch (error) {
    console.error('getMediaIndex: Error retrieving index:', error)
    return []
  }
}

export async function setMediaIndex(ids) {
  try {
    console.log('setMediaIndex: Setting index with', ids.length, 'items')
    // Note: With Supabase, we don't need to manually manage an index
    // The database handles this automatically
    console.log('setMediaIndex: Index updated successfully')
  } catch (error) {
    console.error('setMediaIndex: Error setting index:', error)
    throw error
  }
}

export async function addMediaFiles(files, defaultTags = []) {
  try {
    console.log('addMediaFiles: Adding', files.length, 'files with tags:', defaultTags)
    const added = []
    
    for (const file of files) {
      try {
        const id = nanoid()
        const isVideo = file.type.startsWith('video')
        const fileName = `${id}-${file.name}`
        
        console.log('addMediaFiles: Adding file:', id, fileName, isVideo ? 'video' : 'image', file.size)
        
        // Upload file to Supabase storage
        console.log('addMediaFiles: Starting file upload...')
        const { publicUrl } = await uploadFile(file, fileName)
        console.log('addMediaFiles: File upload completed, publicUrl:', publicUrl)
        
        // Create metadata record in database
        console.log('addMediaFiles: Creating database record...')
        const { data: meta, error } = await supabase
          .from('media')
          .insert({
            id,
            filename: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
            media_type: isVideo ? 'video' : 'image',
            tags: defaultTags,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) {
          console.error('addMediaFiles: Error inserting metadata:', error)
          console.error('addMediaFiles: Error details:', error.message, error.details, error.hint)
          console.error('addMediaFiles: Attempted to insert:', {
            id,
            filename: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
            media_type: isVideo ? 'video' : 'image',
            tags: defaultTags,
            created_at: new Date().toISOString()
          })
          // Clean up uploaded file if metadata insertion fails
          console.log('addMediaFiles: Cleaning up uploaded file due to database error...')
          await deleteFile(fileName)
          continue
        }
        
        console.log('addMediaFiles: Database record created successfully:', meta)
        
        // Transform to match expected format
        const transformedMeta = {
          id: meta.id,
          filename: meta.filename,
          size: meta.file_size,
          type: meta.media_type,
          mime: meta.mime_type,
          createdAt: new Date(meta.created_at).getTime(),
          favorite: meta.is_favorite,
          tags: meta.tags || [],
          eventId: meta.event_id,
          comments: [],
          file_path: meta.file_path, // Include file_path for getMediaBlob
          url: publicUrl
        }
        
        added.push(transformedMeta)
        console.log('addMediaFiles: Successfully added file:', id)
        
      } catch (fileError) {
        console.error('addMediaFiles: Error processing file:', file.name, fileError)
        console.error('addMediaFiles: File error details:', fileError.message, fileError.details, fileError.hint)
        // Continue with next file instead of failing completely
        continue
      }
    }
    
    console.log('addMediaFiles: Returning', added.length, 'added files')
    return added
  } catch (error) {
    console.error('addMediaFiles: Error adding files:', error)
    throw error
  }
}

export async function getMediaMeta(id) {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Transform to match expected format
    return {
      id: data.id,
      filename: data.filename,
      size: data.file_size,
      type: data.media_type,
      mime: data.mime_type,
      createdAt: new Date(data.created_at).getTime(),
      favorite: data.is_favorite,
      tags: data.tags || [],
      eventId: data.event_id,
      comments: [],
      file_path: data.file_path, // Include file_path for getMediaBlob
      url: getPublicUrl(data.file_path)
    }
  } catch (error) {
    console.error('getMediaMeta: Error fetching metadata:', error)
    return null
  }
}

export async function getAllMediaMeta() {
  try {
    console.log('getAllMediaMeta: Fetching all media metadata')
    console.log('getAllMediaMeta: Supabase client:', supabase)
    console.log('getAllMediaMeta: Supabase URL:', supabase.supabaseUrl)
    
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('getAllMediaMeta: Supabase response:', { data, error })
    
    if (error) {
      console.error('getAllMediaMeta: Error fetching metadata:', error)
      console.error('getAllMediaMeta: Error details:', error.message, error.details, error.hint)
      return []
    }
    
    // Transform to match expected format
    const metas = data.map(meta => ({
      id: meta.id,
      filename: meta.filename,
      size: meta.file_size,
      type: meta.media_type,
      mime: meta.mime_type,
      createdAt: new Date(meta.created_at).getTime(),
      favorite: meta.is_favorite,
      tags: meta.tags || [],
      eventId: meta.event_id,
      comments: [],
      file_path: meta.file_path, // Include file_path for getMediaBlob
      url: getPublicUrl(meta.file_path)
    }))
    
    console.log('getAllMediaMeta: Returning', metas.length, 'metadata items')
    console.log('getAllMediaMeta: Transformed data:', metas)
    return metas
  } catch (error) {
    console.error('getAllMediaMeta: Error fetching metadata:', error)
    console.error('getAllMediaMeta: Error details:', error.message, error.stack)
    return []
  }
}

export async function getMediaBlob(id) {
  try {
    console.log('getMediaBlob: Fetching blob for ID:', id)
    
    // Get metadata to find file path
    const meta = await getMediaMeta(id)
    if (!meta) {
      console.log('getMediaBlob: No metadata found for ID:', id)
      return null
    }
    
    console.log('getMediaBlob: Meta for ID:', id, meta)
    console.log('getMediaBlob: file_path:', meta.file_path)
    
    // For Supabase, we return the public URL instead of blob
    // The MediaCard component will use this URL directly
    const url = getPublicUrl(meta.file_path)
    console.log('getMediaBlob: Generated URL for ID:', id, url)
    
    if (!url) {
      console.error('getMediaBlob: Failed to generate URL for ID:', id)
      return null
    }
    
    // Create a fake blob object with the URL for compatibility
    return { url, size: meta.size }
  } catch (error) {
    console.error('getMediaBlob: Error fetching blob for ID:', id, error)
    return null
  }
}

export async function toggleFavorite(id) {
  try {
    // Get current metadata
    const meta = await getMediaMeta(id)
    if (!meta) return null
    
    const newFavoriteState = !meta.favorite
    
    // Update in database
    const { data, error } = await supabase
      .from('media')
      .update({ is_favorite: newFavoriteState })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('toggleFavorite: Error updating favorite:', error)
      return null
    }
    
    // Return updated metadata
    return {
      ...meta,
      favorite: newFavoriteState
    }
  } catch (error) {
    console.error('toggleFavorite: Error:', error)
    return null
  }
}

export async function updateMeta(id, updater) {
  try {
    const meta = await getMediaMeta(id)
    if (!meta) return null
    
    const next = typeof updater === 'function' ? updater(meta) : { ...meta, ...updater }
    
    // Map the fields to database columns
    const updateData = {}
    if (next.filename !== undefined) updateData.filename = next.filename
    if (next.createdAt !== undefined) updateData.created_at = new Date(next.createdAt).toISOString()
    if (next.favorite !== undefined) updateData.is_favorite = next.favorite
    if (next.tags !== undefined) updateData.tags = next.tags
    
    // Update in database
    const { data, error } = await supabase
      .from('media')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('updateMeta: Error updating metadata:', error)
      return null
    }
    
    // Return updated metadata
    return {
      ...meta,
      ...next
    }
  } catch (error) {
    console.error('updateMeta: Error:', error)
    return null
  }
}

export async function deleteMedia(id) {
  try {
    // Get metadata to find file path
    const meta = await getMediaMeta(id)
    if (!meta) return false
    
    // Delete from database first
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', id)
    
    if (dbError) {
      console.error('deleteMedia: Error deleting from database:', dbError)
      return false
    }
    
    // Delete file from storage
    const fileName = `${id}-${meta.filename}`
    await deleteFile(fileName)
    
    console.log('deleteMedia: Successfully deleted media:', id)
    return true
  } catch (error) {
    console.error('deleteMedia: Error:', error)
    return false
  }
}

export async function addComment(id, text, author = 'Guest') {
  return updateMeta(id, (m) => ({ ...m, comments: [...(m.comments || []), { id: nanoid(), text, author, at: Date.now(), replies: [], reactions: {} }] }))
}

// Add reply to a media comment
export async function addMediaReply(mediaId, commentId, { name, text }) {
  return updateMeta(mediaId, (m) => {
    const updatedComments = m.comments.map(c => 
      c.id === commentId 
        ? { ...c, replies: [...(c.replies || []), { id: nanoid(), name: name || 'Guest', text, at: Date.now() }] }
        : c
    )
    return { ...m, comments: updatedComments }
  })
}

// Add reaction to a media comment
export async function addMediaReaction(mediaId, commentId, emoji) {
  return updateMeta(mediaId, (m) => {
    const updatedComments = m.comments.map(c => {
      if (c.id === commentId) {
        const reactions = { ...c.reactions } || {}
        reactions[emoji] = (reactions[emoji] || 0) + 1
        return { ...c, reactions }
      }
      return c
    })
    return { ...m, comments: updatedComments }
  })
}

export async function listMessages() {
  const arr = (await messageStore.getItem('list')) || []
  return arr
}

export async function addMessage({ name, text }) {
  const msg = {
    id: nanoid(),
    name: name || 'Guest',
    text,
    at: Date.now(),
    // new fields for guestbook interactions
    replies: [], // each reply: { id, name, text, at }
    reactions: {}, // map of emoji -> count
    reactedBy: {}, // map of clientId -> emoji
  }
  const arr = await listMessages()
  arr.unshift(msg)
  await messageStore.setItem('list', arr)
  return msg
}

// Guestbook: delete a message by id
export async function deleteMessage(id) {
  const arr = await listMessages()
  const next = arr.filter((m) => m.id !== id)
  await messageStore.setItem('list', next)
  return true
}

// Guestbook: add a reply to a message
export async function addReply(messageId, { name, text }) {
  const arr = await listMessages()
  const index = arr.findIndex((m) => m.id === messageId)
  if (index === -1) return null
  const reply = { id: nanoid(), name: name || 'Guest', text, at: Date.now() }
  const target = arr[index]
  if (!Array.isArray(target.replies)) target.replies = []
  target.replies.unshift(reply)
  await messageStore.setItem('list', arr)
  return reply
}

// Guestbook: react to a message with an emoji (increments count)
export function getClientId() {
  try {
    let id = localStorage.getItem('client-id')
    if (!id) {
      id = nanoid()
      localStorage.setItem('client-id', id)
    }
    return id
  } catch {
    // fallback non-persistent id
    return 'anon'
  }
}

export async function addReaction(messageId, emoji) {
  const arr = await listMessages()
  const index = arr.findIndex((m) => m.id === messageId)
  if (index === -1) return null
  const target = arr[index]
  if (!target.reactions || typeof target.reactions !== 'object') target.reactions = {}
  if (!target.reactedBy || typeof target.reactedBy !== 'object') target.reactedBy = {}

  const clientId = getClientId()
  const prev = target.reactedBy[clientId]

  // If previously reacted with a different emoji, decrement that count
  if (prev && prev !== emoji) {
    if (target.reactions[prev] > 0) target.reactions[prev] -= 1
  }

  // If clicking the same emoji again, do nothing (still one reaction)
  if (prev === emoji) {
    await messageStore.setItem('list', arr)
    return { reactions: { ...target.reactions }, userReaction: emoji }
  }

  // Set/Change the reaction to the new emoji
  target.reactedBy[clientId] = emoji
  target.reactions[emoji] = (target.reactions[emoji] || 0) + 1
  await messageStore.setItem('list', arr)
  return { reactions: { ...target.reactions }, userReaction: emoji }
}

export async function getSettings() {
  return (await settingsStore.getItem('settings')) || { theme: 'light', uploadLimit: 100, privacy: { password: '' }, loveStartDate: '2025-05-29' }
}

export async function setSettings(next) {
  await settingsStore.setItem('settings', next)
  return next
}

// Note: Demo content generation has been removed
// The website now only shows real media uploaded by users
