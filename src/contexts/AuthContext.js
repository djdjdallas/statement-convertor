'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    let supabase
    
    try {
      supabase = createClient()
      
      if (!supabase) {
        setLoading(false)
        return
      }

      // Get initial session
      const getUser = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)
          setLoading(false)
        } catch (error) {
          console.error('Error getting session:', error)
          setLoading(false)
        }
      }

      getUser()

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)

          // PostHog: Identify user on sign in events
          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            posthog.identify(session.user.email || session.user.id, {
              email: session.user.email,
              provider: session.user.app_metadata?.provider,
            })

            // Capture Google sign-in completion if applicable
            if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
              posthog.capture('google_drive_connected', {
                provider: 'google',
              })
            }
          }
        }
      )

      return () => subscription?.unsubscribe()
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const signUp = async (email, password, options = {}) => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const supabase = createClient()
    if (!supabase) return { error: new Error('Supabase not initialized') }

    // PostHog: Capture signout event before signing out
    posthog.capture('user_signed_out')
    posthog.reset()

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    })
    return { data, error }
  }

  const updatePassword = async (password) => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  }

  const linkGoogleAccount = async () => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    // For linking, we need to ensure the user is already authenticated
    if (!user) {
      return { data: null, error: new Error('User must be authenticated to link Google account') }
    }

    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?link=true`,
        scopes: 'email profile https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  }

  const unlinkGoogleAccount = async () => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    // Get the user's identities
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    if (userError) return { data: null, error: userError }
    
    // Find Google identity
    const googleIdentity = currentUser?.identities?.find(identity => identity.provider === 'google')
    if (!googleIdentity) {
      return { data: null, error: new Error('No Google account linked') }
    }
    
    const { data, error } = await supabase.auth.unlinkIdentity(googleIdentity)
    return { data, error }
  }

  const getGoogleTokens = async () => {
    const supabase = createClient()
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    
    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }
    
    // Get tokens from our google_tokens table
    const { data, error } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return { data, error }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    linkGoogleAccount,
    unlinkGoogleAccount,
    getGoogleTokens
  }

  // Show error state if Supabase failed to initialize
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Configuration Error</h2>
            <p className="text-gray-600 mb-4">
              Unable to initialize the application. Please check your environment configuration.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Make sure your .env.local file contains valid Supabase credentials.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}