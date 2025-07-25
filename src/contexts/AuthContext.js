'use client'

import { createContext, useContext, useEffect, useState } from 'react'

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
  const [supabase, setSupabase] = useState(null)
  const [error, setError] = useState(null)

  // Initialize Supabase client safely on client-side only
  useEffect(() => {
    const initSupabase = async () => {
      try {
        console.log('Initializing Supabase client...')
        
        // Dynamic import to avoid SSR issues
        const { createClient } = await import('@/lib/supabase/client')
        const client = createClient()
        
        if (!client) {
          console.log('Supabase client creation returned null (likely server-side)')
          setLoading(false)
          return
        }
        
        console.log('Supabase client created:', !!client)
        setSupabase(client)
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    initSupabase()
  }, [])

  useEffect(() => {
    if (!supabase) return

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
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signUp = async (email, password, options = {}) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    })
    return { data, error }
  }

  const updatePassword = async (password) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase.auth.updateUser({
      password
    })
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
    updatePassword
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