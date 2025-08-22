'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(null)
  
  const handleSuccessfulAuth = async (session, isLinking) => {
    if (!session) return
    
    const supabase = createClient()
    const { user } = session
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token
    
    // Store Google tokens if available
    if (providerToken && user) {
      try {
        // Calculate token expiration (Google tokens typically expire in 1 hour)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1)
        
        // Extract Google user info from session/user metadata
        const googleId = user.user_metadata?.sub || user.id
        const email = user.email || user.user_metadata?.email || ''
        
        console.log('Storing Google tokens for user:', user.id)
        console.log('Provider token:', providerToken ? 'Present' : 'Missing')
        console.log('Refresh token:', providerRefreshToken ? 'Present' : 'Missing')
        
        const { error: tokenError } = await supabase.rpc('upsert_google_token', {
          p_user_id: user.id,
          p_access_token: providerToken,
          p_refresh_token: providerRefreshToken,
          p_expires_at: expiresAt.toISOString(),
          p_scopes: ['email', 'profile', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
          p_google_id: googleId,
          p_email: email
        })
        
        if (tokenError) {
          console.error('Error storing Google tokens:', tokenError)
        } else {
          console.log('Google tokens stored successfully')
        }
      } catch (err) {
        console.error('Error in token storage:', err)
      }
    } else {
      console.log('No provider token available to store')
    }
    
    // Redirect based on operation type
    if (isLinking) {
      router.push('/settings/integrations?linked=google')
    } else {
      router.push('/dashboard')
    }
  }
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // First, let Supabase handle the session detection automatically
        // This works because detectSessionInUrl is true in the client config
        const { data: { session }, error: autoError } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Session detected automatically by Supabase')
          // Handle the session (store tokens, redirect, etc.)
          handleSuccessfulAuth(session, searchParams.get('link') === 'true')
          return
        }
        
        // If auto-detection failed, try manual extraction
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        // Also check hash fragment for parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashCode = hashParams.get('code')
        const hashError = hashParams.get('error')
        
        const finalCode = code || hashCode
        const finalError = error || hashError
        
        if (finalError) {
          console.error('OAuth error:', finalError, errorDescription)
          setError(errorDescription || finalError)
          return
        }
        
        if (!finalCode) {
          console.log('Debug - Current URL:', window.location.href)
          console.log('Debug - Search params:', window.location.search)
          console.log('Debug - Hash:', window.location.hash)
          setError('No authorization code received')
          return
        }
        
        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(finalCode)
        
        if (sessionError) {
          console.error('Session exchange error:', sessionError)
          setError(sessionError.message)
          return
        }
        
        if (data.session) {
          // Handle successful authentication
          handleSuccessfulAuth(data.session, searchParams.get('link') === 'true')
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred')
      }
    }
    
    handleCallback()
  }, [router, searchParams])
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
            <CardDescription>
              There was a problem signing you in with Google
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <a
                href="/auth/signin"
                className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Completing sign in...</CardTitle>
          <CardDescription>
            Please wait while we complete your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}