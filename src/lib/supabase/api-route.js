import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for use in API routes with proper cookie handling
 * This ensures authentication works correctly in API routes
 */
export async function createApiRouteClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // API routes can write cookies
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('Error setting cookies in API route:', error)
          }
        },
      },
    }
  )
}