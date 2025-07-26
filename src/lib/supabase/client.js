import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let supabaseClient = null

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { 
      hasUrl: !!url, 
      hasKey: !!key 
    })
    // Return null instead of throwing during initialization
    return null
  }
  
  console.log('Creating Supabase client with URL:', url.substring(0, 30) + '...')
  
  try {
    supabaseClient = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    return supabaseClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}