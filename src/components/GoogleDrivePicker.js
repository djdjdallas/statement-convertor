'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

const GOOGLE_DRIVE_PICKER_API = 'https://apis.google.com/js/api.js'
const PICKER_SCOPE = 'https://www.googleapis.com/auth/drive.file'

export default function GoogleDrivePicker({ 
  onFileSelect, 
  acceptedMimeTypes = ['application/pdf'],
  multipleSelection = false,
  className = '',
  buttonText = 'Select from Google Drive',
  buttonVariant = 'outline'
}) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false)
  const [accessToken, setAccessToken] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  // Load Google Picker API
  useEffect(() => {
    const loadPickerApi = async () => {
      // Check if both gapi and google.picker are already loaded
      if (window.gapi && window.google?.picker) {
        console.log('Google Picker API already loaded')
        setPickerApiLoaded(true)
        return
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]')
      if (existingScript) {
        console.log('Google API script already exists, waiting for load...')
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          if (window.gapi) {
            window.gapi.load('picker', {
              callback: () => {
                console.log('Google Picker loaded successfully')
                setPickerApiLoaded(true)
              },
              onerror: () => {
                console.error('Failed to load picker library')
                toast({
                  title: 'Failed to load Google Picker',
                  description: 'Could not load Google Drive picker library. Please refresh and try again.',
                  variant: 'destructive'
                })
                setIsInitializing(false)
              }
            })
          }
        })
        return
      }

      console.log('Loading Google API script...')
      const script = document.createElement('script')
      script.src = GOOGLE_DRIVE_PICKER_API
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log('Google API script loaded, loading picker library...')
        if (!window.gapi) {
          console.error('gapi not available after script load')
          toast({
            title: 'Failed to load Google Picker',
            description: 'Google API not available. Please refresh and try again.',
            variant: 'destructive'
          })
          setIsInitializing(false)
          return
        }

        window.gapi.load('picker', {
          callback: () => {
            console.log('Google Picker loaded successfully')
            setPickerApiLoaded(true)
          },
          onerror: () => {
            console.error('Failed to load picker library')
            toast({
              title: 'Failed to load Google Picker',
              description: 'Could not load Google Drive picker library. Please refresh and try again.',
              variant: 'destructive'
            })
            setIsInitializing(false)
          }
        })
      }

      script.onerror = (error) => {
        console.error('Failed to load Google API script:', error)
        toast({
          title: 'Failed to load Google Picker',
          description: 'Could not load Google Drive picker. Please refresh the page and try again.',
          variant: 'destructive'
        })
        setIsInitializing(false)
      }

      document.body.appendChild(script)
    }

    loadPickerApi()
  }, [])

  // Check Google connection status and get access token
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!user) {
        setIsInitializing(false)
        setIsGoogleConnected(false)
        return
      }

      try {
        console.log('Checking Google connection for user:', user.id)

        // First check if Google is connected
        const linkResponse = await fetch('/api/auth/google/link', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }).catch(err => {
          console.warn('Failed to fetch Google link status:', err.message)
          return { ok: false, status: 0 }
        })

        if (linkResponse.ok) {
          const linkData = await linkResponse.json().catch(() => ({ linked: false }))
          console.log('Google connection status:', linkData)
          setIsGoogleConnected(linkData.linked || false)

          // Only try to get token if Google is connected
          if (linkData.linked) {
            // Don't await - let it happen in background
            refreshAccessToken().catch(err => {
              console.warn('Failed to refresh access token on mount:', err.message)
              // Token refresh failure shouldn't block component mounting
            })
          }
        } else {
          console.warn('Failed to check Google connection status:', linkResponse.status)
          // Don't set error state - just mark as not connected
          setIsGoogleConnected(false)
        }
      } catch (error) {
        console.error('Error checking Google connection:', error)
        // Gracefully handle error - don't prevent component from mounting
        setIsGoogleConnected(false)
      } finally {
        setIsInitializing(false)
      }
    }

    // Only run if we have a user
    if (user) {
      checkGoogleConnection()
    } else {
      setIsInitializing(false)
      setIsGoogleConnected(false)
    }
  }, [user])

  // Function to refresh access token
  const refreshAccessToken = async () => {
    try {
      const tokenResponse = await fetch('/api/google/auth/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Force fresh token
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }).catch(err => {
        console.warn('Network error fetching token:', err.message)
        return { ok: false, status: 0 }
      })

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json().catch(() => {
          console.error('Failed to parse token response as JSON')
          return { accessToken: null }
        })

        console.log('Access token retrieved:', tokenData.accessToken ? 'Present' : 'Missing')

        if (tokenData.accessToken) {
          setAccessToken(tokenData.accessToken)
          return tokenData.accessToken
        } else {
          console.error('Token data missing access token:', tokenData)
          setAccessToken(null)
          return null
        }
      } else {
        const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to get access token:', tokenResponse.status, errorData)
        setAccessToken(null)
        return null
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      setAccessToken(null)
      // Return null instead of throwing to prevent cascade failures
      return null
    }
  }

  const handleOpenPicker = async (e) => {
    // Prevent the click from propagating to parent elements (like Dropzone)
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    console.log('🔍 Starting Google Picker...')

    // Use API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBaYuZugtGye92Fgq5ufB9alGTtqAlATVE'
    console.log(`API Key: ${apiKey.substring(0, 20)}...`)

    // Set loading state
    setIsLoading(true)

    // Get access token with proper error handling
    try {
      const tokenResponse = await fetch('/api/google/auth/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't throw on non-ok responses
        credentials: 'include'
      })

      if (!tokenResponse.ok) {
        console.log(`❌ Failed to get access token: ${tokenResponse.status}`)
        await tokenResponse.json().catch(() => ({ error: 'Unknown error' }))

        toast({
          title: 'Authentication Error',
          description: 'Your Google Drive session has expired. Please reconnect your Google account in Settings.',
          variant: 'destructive'
        })
        setIsLoading(false)
        // Don't throw - just return to prevent cascade failure
        return
      }

      const { accessToken } = await tokenResponse.json()
      if (!accessToken) {
        console.error('❌ No access token in response')
        toast({
          title: 'Authentication Error',
          description: 'Could not retrieve Google Drive access token.',
          variant: 'destructive'
        })
        setIsLoading(false)
        return
      }

      console.log(`✅ Access token retrieved: ${accessToken.substring(0, 20)}...`)

      // Build picker with proper error handling
      console.log('🔨 Building picker...')

      if (!window.google || !window.google.picker) {
        throw new Error('Google Picker API not loaded')
      }

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      view.setMimeTypes(acceptedMimeTypes.join(','))

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data) => {
          console.log(`📞 Picker callback: action=${data.action}`)
          // Wrap callback to catch any errors
          try {
            pickerCallback(data)
          } catch (callbackError) {
            console.error('Error in picker callback:', callbackError)
            // Don't propagate callback errors
          }
        })
        .setTitle('Select a file from Google Drive')
        .setOrigin(window.location.origin)
        .build()

      console.log('✅ Picker built successfully')
      console.log('👁️ Setting picker visible...')

      try {
        picker.setVisible(true)
      } catch (visibilityError) {
        console.error('❌ Failed to make picker visible:', visibilityError)
        toast({
          title: 'Google Picker Error',
          description: 'Could not open Google Drive picker. Please check your Google Cloud Console API key settings.',
          variant: 'destructive'
        })
        setIsLoading(false)
        return
      }

      // Check iframe after 2 seconds with better error messaging
      setTimeout(() => {
        const iframe = document.querySelector('iframe.picker')
        if (iframe) {
          const src = iframe.src || iframe.getAttribute('src')
          console.log(`📱 Picker iframe found: src=${src}`)

          if (src === 'about:blank') {
            console.error('⚠️ ISSUE: Iframe stuck at about:blank')
            console.error('API Key Configuration Required:')
            console.error('1. Go to https://console.cloud.google.com/apis/credentials')
            console.error('2. Find API key:', apiKey.substring(0, 20) + '...')
            console.error('3. Add HTTP referrer:', window.location.origin)
            console.error('4. Enable Google Picker API and Google Drive API')

            toast({
              title: 'Google Picker Configuration Error',
              description: 'The Google API key is not configured for this domain. Please check console for setup instructions.',
              variant: 'destructive',
              duration: 8000
            })
            setIsLoading(false)
          }
        } else {
          console.log('⚠️ Picker iframe not found in DOM after 2 seconds')
        }
      }, 2000)

    } catch (error) {
      console.error('❌ Error opening picker:', error)

      // Provide helpful error messages based on error type
      let errorMessage = 'Could not open Google Drive picker. '

      if (error.message?.includes('not loaded')) {
        errorMessage += 'Please refresh the page and try again.'
      } else if (error.message?.includes('token')) {
        errorMessage += 'Please reconnect your Google account in Settings.'
      } else {
        errorMessage += 'Please check your internet connection and try again.'
      }

      toast({
        title: 'Google Picker Error',
        description: errorMessage,
        variant: 'destructive'
      })
      setIsLoading(false)
      // Don't re-throw - handle error gracefully
    }
  }

  const pickerCallback = (data) => {
    const action = data.action
    console.log(`📞 Picker callback: action=${action}`, {
      action,
      viewToken: data[window.google.picker.Response.VIEW_TOKEN],
      docs: data.docs?.length || 0
    })

    // Handle LOADED action (picker initialized successfully)
    if (action === window.google.picker.Action.LOADED) {
      console.log('✅ Picker loaded successfully')
      return
    }

    // Stop loading indicator for user actions
    if (action === window.google.picker.Action.CANCEL || action === window.google.picker.Action.PICKED) {
      setIsLoading(false)
    }

    if (action === window.google.picker.Action.CANCEL) {
      console.log('User cancelled picker')
      return
    }

    if (action === window.google.picker.Action.PICKED) {
      const fileCount = data.docs.length
      toast({
        title: 'File Selected',
        description: `Successfully selected ${fileCount} file${fileCount > 1 ? 's' : ''} from Google Drive.`,
        variant: 'success'
      })
      const files = data.docs.map(doc => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.sizeBytes,
        url: doc.url,
        iconUrl: doc.iconUrl,
        lastModified: doc.lastEditedUtc
      }))

      if (multipleSelection) {
        onFileSelect(files)
      } else {
        onFileSelect(files[0])
      }
    }
  }

  return (
    <Button
      variant={buttonVariant}
      onClick={handleOpenPicker}
      disabled={!user || isLoading || isInitializing}
      className={`google-drive-button ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening Picker...
        </>
      ) : isInitializing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : !user ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Sign In Required
        </>
      ) : !isGoogleConnected ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Connect Google Drive
        </>
      ) : (
        <>
          <FolderOpen className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  )
}