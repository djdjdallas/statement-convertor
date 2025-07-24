'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  // Initialize Supabase client safely on client-side only
  useEffect(() => {
    try {
      console.log('Initializing Supabase client...')
      const client = createClient()
      console.log('Supabase client created:', !!client)
      setSupabase(client)
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      setLoading(false)
    }
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}