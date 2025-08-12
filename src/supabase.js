import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase: Initializing with URL:', supabaseUrl)
console.log('Supabase: Initializing with key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined')

// Check if environment variables are properly set
let supabase

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'YOUR_SUPABASE_URL' || 
    supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Supabase: Environment variables not properly configured!')
  console.error('Supabase: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment')
  
  // Create a mock client that will show appropriate error messages
  supabase = {
    storage: {
      from: () => ({
        upload: async () => {
          throw new Error('Supabase not configured. Please set environment variables.')
        },
        remove: async () => {
          throw new Error('Supabase not configured. Please set environment variables.')
        },
        getPublicUrl: () => ({
          data: { publicUrl: null }
        }),
        listBuckets: async () => ({
          data: [],
          error: new Error('Supabase not configured. Please set environment variables.')
        }),
        createBucket: async () => ({
          data: null,
          error: new Error('Supabase not configured. Please set environment variables.')
        })
      }),
      listBuckets: async () => ({
        data: [],
        error: new Error('Supabase not configured. Please set environment variables.')
      }),
      createBucket: async () => ({
        data: null,
        error: new Error('Supabase not configured. Please set environment variables.')
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: null,
            error: new Error('Supabase not configured. Please set environment variables.')
          }),
          then: async () => ({
            data: [],
            error: new Error('Supabase not configured. Please set environment variables.')
          })
        }),
        insert: async () => ({
          data: null,
          error: new Error('Supabase not configured. Please set environment variables.')
        }),
        update: async () => ({
          data: null,
          error: new Error('Supabase not configured. Please set environment variables.')
        }),
        delete: async () => ({
          data: null,
          error: new Error('Supabase not configured. Please set environment variables.')
        })
      })
    })
  }
} else {
  // Create the real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Storage bucket name for images
const STORAGE_BUCKET = 'love-story-images'

// Initialize storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    console.log('initializeStorage: Starting storage initialization...')
    console.log('initializeStorage: Target bucket:', STORAGE_BUCKET)
    
    // Check if bucket exists
    console.log('initializeStorage: Checking existing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('initializeStorage: Error listing buckets:', listError)
      return false
    }
    
    console.log('initializeStorage: Existing buckets:', buckets?.map(b => b.name) || [])
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET)
    console.log('initializeStorage: Bucket exists?', bucketExists)
    
    if (!bucketExists) {
      console.log('initializeStorage: Creating new bucket...')
      // Create bucket with public access
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 52428800 // 50MB limit
      })
      
      if (error) {
        console.error('initializeStorage: Error creating storage bucket:', error)
        console.error('initializeStorage: Error details:', error.message, error.details, error.hint)
        return false
      }
      
      console.log('initializeStorage: Storage bucket created successfully:', data)
    } else {
      console.log('initializeStorage: Bucket already exists')
    }
    
    console.log('initializeStorage: Storage initialization completed successfully')
    return true
  } catch (error) {
    console.error('initializeStorage: Error initializing storage:', error)
    console.error('initializeStorage: Error details:', error.message, error.details, error.hint)
    return false
  }
}

// Upload file to Supabase storage
export async function uploadFile(file, fileName) {
  try {
    console.log('uploadFile: Starting upload for', fileName, 'to bucket', STORAGE_BUCKET)
    console.log('uploadFile: File details:', { name: file.name, size: file.size, type: file.type })
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('uploadFile: Error uploading file:', error)
      console.error('uploadFile: Error details:', error.message, error.details, error.hint)
      throw error
    }
    
    console.log('uploadFile: File uploaded successfully:', data)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)
    
    console.log('uploadFile: Generated public URL:', publicUrl)
    
    return { data, publicUrl }
  } catch (error) {
    console.error('uploadFile: Upload failed:', error)
    console.error('uploadFile: Error details:', error.message, error.details, error.hint)
    throw error
  }
}

// Delete file from Supabase storage
export async function deleteFile(fileName) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName])
    
    if (error) {
      console.error('Error deleting file:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Delete failed:', error)
    throw error
  }
}

// Get public URL for a file
export function getPublicUrl(fileName) {
  if (!fileName) {
    console.error('getPublicUrl: fileName is undefined or null')
    return null
  }
  
  try {
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)
    
    return publicUrl
  } catch (error) {
    console.error('getPublicUrl: Error generating public URL for', fileName, error)
    return null
  }
}
