import localforage from 'localforage'
import { nanoid } from 'nanoid'

localforage.config({
  name: 'love-story',
  storeName: 'love_story_db',
})

export const mediaStore = localforage.createInstance({ name: 'love-story', storeName: 'media' })
export const metaStore = localforage.createInstance({ name: 'love-story', storeName: 'meta' })
export const messageStore = localforage.createInstance({ name: 'love-story', storeName: 'messages' })
export const settingsStore = localforage.createInstance({ name: 'love-story', storeName: 'settings' })

const INDEX_KEY = 'media:index'

export async function getMediaIndex() {
  try {
    const idx = await metaStore.getItem(INDEX_KEY)
    const result = Array.isArray(idx) ? idx : []
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
    await metaStore.setItem(INDEX_KEY, ids)
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
    let index = await getMediaIndex()
    console.log('addMediaFiles: Current index length:', index.length)
    
    for (const file of files) {
      const id = nanoid()
      const isVideo = file.type.startsWith('video')
      const meta = {
        id,
        filename: file.name,
        size: file.size,
        type: isVideo ? 'video' : 'image',
        mime: file.type,
        createdAt: Date.now(),
        favorite: false,
        tags: [...defaultTags],
        eventId: null,
        comments: [],
      }
      
      console.log('addMediaFiles: Adding file:', id, meta.filename, meta.type, meta.size)
      
      await mediaStore.setItem(`blob:${id}`, file)
      await metaStore.setItem(`meta:${id}`, meta)
      index.unshift(id)
      added.push(meta)
      
      console.log('addMediaFiles: Successfully added file:', id)
    }
    
    await setMediaIndex(index)
    console.log('addMediaFiles: Updated index, new length:', index.length)
    console.log('addMediaFiles: Returning', added.length, 'added files')
    
    return added
  } catch (error) {
    console.error('addMediaFiles: Error adding files:', error)
    throw error
  }
}

export async function getMediaMeta(id) {
  return metaStore.getItem(`meta:${id}`)
}

export async function getAllMediaMeta() {
  try {
    console.log('getAllMediaMeta: Fetching all media metadata')
    const index = await getMediaIndex()
    console.log('getAllMediaMeta: Index length:', index.length)
    
    const metas = []
    for (const id of index) {
      const m = await getMediaMeta(id)
      if (m) metas.push(m)
    }
    
    console.log('getAllMediaMeta: Returning', metas.length, 'metadata items')
    return metas
  } catch (error) {
    console.error('getAllMediaMeta: Error fetching metadata:', error)
    return []
  }
}

export async function getMediaBlob(id) {
  try {
    console.log('getMediaBlob: Fetching blob for ID:', id)
    const blob = await mediaStore.getItem(`blob:${id}`)
    console.log('getMediaBlob: Result for ID:', id, blob ? `blob size: ${blob.size}` : 'null')
    return blob
  } catch (error) {
    console.error('getMediaBlob: Error fetching blob for ID:', id, error)
    return null
  }
}

export async function toggleFavorite(id) {
  const meta = await getMediaMeta(id)
  if (!meta) return null
  meta.favorite = !meta.favorite
  await metaStore.setItem(`meta:${id}`, meta)
  return meta
}

export async function updateMeta(id, updater) {
  const meta = await getMediaMeta(id)
  if (!meta) return null
  const next = typeof updater === 'function' ? updater(meta) : { ...meta, ...updater }
  await metaStore.setItem(`meta:${id}`, next)
  return next
}

export async function deleteMedia(id) {
  let index = await getMediaIndex()
  index = index.filter((x) => x !== id)
  await setMediaIndex(index)
  await metaStore.removeItem(`meta:${id}`)
  await mediaStore.removeItem(`blob:${id}`)
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

// Test function to verify localforage is working
export async function testStorage() {
  try {
    console.log('testStorage: Testing localforage functionality...')
    
    // Test basic storage
    const testKey = 'test:key'
    const testValue = { test: 'data', timestamp: Date.now() }
    
    await metaStore.setItem(testKey, testValue)
    console.log('testStorage: Successfully wrote test data')
    
    const retrieved = await metaStore.getItem(testKey)
    console.log('testStorage: Successfully retrieved test data:', retrieved)
    
    // Clean up test data
    await metaStore.removeItem(testKey)
    console.log('testStorage: Successfully cleaned up test data')
    
    return true
  } catch (error) {
    console.error('testStorage: Error testing storage:', error)
    return false
  }
}

export async function ensureDemoContent() {
  try {
    console.log('ensureDemoContent: Starting demo content creation...')
    
    const index = await getMediaIndex()
    console.log('ensureDemoContent: Current index length:', index.length)
    
    if (index.length > 0) {
      console.log('ensureDemoContent: Demo content already exists, skipping')
      return []
    }
    
    console.log('ensureDemoContent: Creating demo content...')
    
    // Try canvas approach first
    let demoFiles = []
    
    try {
      // Create simple demo files using canvas
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      
      // Create 3 demo images with different colors
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']
      const texts = ['Love Story', 'Memories', 'Together']
      
      // Create all demo files synchronously using Promise.all
      const demoPromises = []
      
      for (let i = 0; i < 3; i++) {
        const promise = new Promise((resolve) => {
          try {
            // Clear canvas for each image
            ctx.clearRect(0, 0, 400, 300)
            
            // Fill background
            ctx.fillStyle = colors[i]
            ctx.fillRect(0, 0, 400, 300)
            
            // Add text
            ctx.fillStyle = 'white'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(texts[i], 200, 150)
            
            // Add some decorative elements
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.beginPath()
            ctx.arc(100 + i * 50, 100 + i * 30, 20, 0, 2 * Math.PI)
            ctx.fill()
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `demo-${i + 1}.png`, { type: 'image/png' })
                console.log(`ensureDemoContent: Created demo file ${i + 1}:`, file.name, file.size)
                resolve(file)
              } else {
                console.error(`ensureDemoContent: Failed to create blob for demo ${i + 1}`)
                resolve(null)
              }
            }, 'image/png')
          } catch (error) {
            console.error(`ensureDemoContent: Error creating demo ${i + 1}:`, error)
            resolve(null)
          }
        })
        
        demoPromises.push(promise)
      }
      
      // Wait for all demo files to be created
      console.log('ensureDemoContent: Waiting for all demo files to be created...')
      const createdFiles = await Promise.all(demoPromises)
      demoFiles = createdFiles.filter(file => file !== null)
      
      console.log('ensureDemoContent: Canvas approach created', demoFiles.length, 'files')
      
    } catch (canvasError) {
      console.error('ensureDemoContent: Canvas approach failed:', canvasError)
      demoFiles = []
    }
    
    // If canvas approach failed, create simple text-based demo content
    if (demoFiles.length === 0) {
      console.log('ensureDemoContent: Canvas failed, creating text-based demo content...')
      
      try {
        // Create simple text-based demo items
        const demoItems = [
          { id: 'demo-1', filename: 'demo-1.txt', type: 'text', content: 'Love Story - Our beginning' },
          { id: 'demo-2', filename: 'demo-2.txt', type: 'text', content: 'Memories - Special moments' },
          { id: 'demo-3', filename: 'demo-3.txt', type: 'text', content: 'Together - Our journey' }
        ]
        
        // Add them directly to storage
        for (const item of demoItems) {
          const meta = {
            id: item.id,
            filename: item.filename,
            size: item.content.length,
            type: 'text',
            mime: 'text/plain',
            createdAt: Date.now(),
            favorite: false,
            tags: ['demo'],
            eventId: null,
            comments: [],
            content: item.content
          }
          
          await metaStore.setItem(`meta:${item.id}`, meta)
          console.log(`ensureDemoContent: Created text demo item: ${item.filename}`)
        }
        
        // Update index
        const newIndex = ['demo-1', 'demo-2', 'demo-3']
        await setMediaIndex(newIndex)
        console.log('ensureDemoContent: Text demo content created successfully')
        
        // Return the demo items
        return demoItems.map(item => ({
          id: item.id,
          filename: item.filename,
          type: 'text',
          size: item.content.length,
          createdAt: Date.now(),
          favorite: false,
          tags: ['demo']
        }))
        
      } catch (textError) {
        console.error('ensureDemoContent: Text approach also failed:', textError)
        return []
      }
    }
    
    if (demoFiles.length > 0) {
      console.log('ensureDemoContent: Adding canvas demo files to storage:', demoFiles.length)
      
      try {
        const added = await addMediaFiles(demoFiles, ['demo'])
        console.log('ensureDemoContent: Demo content created successfully:', added.length, 'files')
        
        // Force a refresh by updating the index
        const newIndex = await getMediaIndex()
        console.log('ensureDemoContent: New index length:', newIndex.length)
        
        // Return the added files so Gallery can use them immediately
        return added
      } catch (error) {
        console.error('ensureDemoContent: Error adding files to storage:', error)
        return []
      }
    } else {
      console.error('ensureDemoContent: No demo content was created')
      return []
    }
    
  } catch (error) {
    console.error('ensureDemoContent: Error creating demo content:', error)
    return []
  }
}
