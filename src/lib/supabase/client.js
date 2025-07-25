import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return null
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { 
      hasUrl: !!url, 
      hasKey: !!key 
    })
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
  
  console.log('Creating Supabase client with URL:', url.substring(0, 30) + '...')
  
  try {
    return createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw error
  }
}