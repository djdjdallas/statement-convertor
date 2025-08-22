'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CallbackDebugPage() {
  const router = useRouter()
  
  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()
      
      // Log all URL information for debugging
      console.log('=== OAuth Callback Debug ===')
      console.log('Full URL:', window.location.href)
      console.log('Origin:', window.location.origin)
      console.log('Pathname:', window.location.pathname)
      console.log('Search params:', window.location.search)
      console.log('Hash:', window.location.hash)
      
      // Parse query parameters
      const queryParams = new URLSearchParams(window.location.search)
      console.log('Query params:', Object.fromEntries(queryParams))
      
      // Parse hash parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      console.log('Hash params:', Object.fromEntries(hashParams))
      
      // Try to get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Current session:', session)
      console.log('Session error:', error)
      
      // Try to exchange code if present
      const code = queryParams.get('code') || hashParams.get('code')
      if (code) {
        console.log('Found code:', code)
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        console.log('Exchange result:', data)
        console.log('Exchange error:', exchangeError)
      }
      
      // Check for access_token in hash (implicit flow)
      const accessToken = hashParams.get('access_token')
      if (accessToken) {
        console.log('Found access token in hash - this suggests implicit flow')
      }
      
      console.log('=== End Debug ===')
    }
    
    handleAuth()
  }, [router])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">OAuth Callback Debug</h1>
        <p className="mb-4">Check the browser console for detailed debug information.</p>
        <pre className="bg-white p-4 rounded shadow overflow-x-auto">
          <code>{JSON.stringify({
            url: typeof window !== 'undefined' ? window.location.href : '',
            search: typeof window !== 'undefined' ? window.location.search : '',
            hash: typeof window !== 'undefined' ? window.location.hash : ''
          }, null, 2)}</code>
        </pre>
        <button 
          onClick={() => router.push('/auth/signin')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}