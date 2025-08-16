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
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the auth code from URL
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('OAuth error:', error, errorDescription)
          setError(errorDescription || error)
          return
        }
        
        if (!code) {
          setError('No authorization code received')
          return
        }
        
        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (sessionError) {
          console.error('Session exchange error:', sessionError)
          setError(sessionError.message)
          return
        }
        
        // Check if this was a link operation
        const isLinking = searchParams.get('link') === 'true'
        
        if (data.session) {
          // Extract Google tokens from the session
          const providerToken = data.session.provider_token
          const providerRefreshToken = data.session.provider_refresh_token
          const user = data.session.user
          
          // Store Google tokens if available
          if (providerToken && user) {
            try {
              // Calculate token expiration (Google tokens typically expire in 1 hour)
              const expiresAt = new Date()
              expiresAt.setHours(expiresAt.getHours() + 1)
              
              // Upsert tokens to our google_tokens table
              const { error: tokenError } = await supabase.rpc('upsert_google_token', {
                p_user_id: user.id,
                p_access_token: providerToken,
                p_refresh_token: providerRefreshToken,
                p_expires_at: expiresAt.toISOString(),
                p_scopes: ['email', 'profile', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets']
              })
              
              if (tokenError) {
                console.error('Error storing Google tokens:', tokenError)
                // Don't fail the auth flow for this
              }
            } catch (err) {
              console.error('Error in token storage:', err)
              // Don't fail the auth flow for this
            }
          }
          
          // Redirect based on operation type
          if (isLinking) {
            router.push('/settings/integrations?linked=google')
          } else {
            router.push('/dashboard')
          }
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