'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function GoogleSignInButton({ 
  mode = 'signin', 
  className = '',
  variant = 'outline',
  showIcon = true,
  text = null 
}) {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('Google sign-in error:', error)
        // Error handling is done by parent component
      }
      // Success handling is done through auth state change listener
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (text) return text
    if (mode === 'signup') return 'Sign up with Google'
    if (mode === 'signin') return 'Sign in with Google'
    return 'Continue with Google'
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`w-full ${className}`}
    >
      {showIcon && (
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          />
        </svg>
      )}
      {isLoading ? 'Connecting...' : getButtonText()}
    </Button>
  )
}