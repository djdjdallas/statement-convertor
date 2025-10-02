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
        })

        if (linkResponse.ok) {
          const linkData = await linkResponse.json()
          console.log('Google connection status:', linkData)
          setIsGoogleConnected(linkData.linked)

          // Only try to get token if Google is connected
          if (linkData.linked) {
            await refreshAccessToken()
          }
        } else {
          console.error('Failed to check Google connection status:', linkResponse.status)
        }
      } catch (error) {
        console.error('Error checking Google connection:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    checkGoogleConnection()
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
      })

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        console.log('Access token retrieved:', tokenData.accessToken ? 'Present' : 'Missing')
        if (tokenData.accessToken) {
          setAccessToken(tokenData.accessToken)
          return tokenData.accessToken
        } else {
          console.error('Token data missing access token:', tokenData)
          return null
        }
      } else {
        const errorData = await tokenResponse.json()
        console.error('Failed to get access token:', errorData)
        return null
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
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

    // EXACT COPY FROM TEST-PICKER - Use hardcoded API key
    const apiKey = 'AIzaSyBaYuZugtGye92Fgq5ufB9alGTtqAlATVE'
    console.log(`API Key: ${apiKey.substring(0, 20)}...`)

    // EXACT COPY FROM TEST-PICKER - Get access token
    try {
      const tokenResponse = await fetch('/api/google/auth/token')
      if (!tokenResponse.ok) {
        console.log(`❌ Failed to get access token: ${tokenResponse.status}`)
        toast({
          title: 'Authentication Error',
          description: 'Failed to get access token.',
          variant: 'destructive'
        })
        return
      }
      const { accessToken } = await tokenResponse.json()
      console.log(`✅ Access token retrieved: ${accessToken.substring(0, 20)}...`)

      // EXACT COPY FROM TEST-PICKER - Build picker
      console.log('🔨 Building picker...')
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      view.setMimeTypes(acceptedMimeTypes.join(','))

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data) => {
          console.log(`📞 Picker callback: action=${data.action}`)
          pickerCallback(data)
        })
        .setTitle('Select a file from Google Drive')
        .setOrigin(window.location.origin)
        .build()

      console.log('✅ Picker built successfully')
      console.log('👁️ Setting picker visible...')
      picker.setVisible(true)

      // EXACT COPY FROM TEST-PICKER - Check iframe after 1 second
      setTimeout(() => {
        const iframe = document.querySelector('iframe.picker')
        if (iframe) {
          const src = iframe.src || iframe.getAttribute('src')
          console.log(`📱 Picker iframe found: src=${src}`)

          if (src === 'about:blank') {
            console.log('⚠️ ISSUE: Iframe stuck at about:blank')
            console.log('Possible causes:')
            console.log('1. API key restrictions blocking request')
            console.log('2. Domain not authorized in API key settings')
            console.log('3. Drive API not enabled for this API key')
            console.log('4. OAuth scope missing drive.file permission')

            toast({
              title: 'Picker Loading Issue',
              description: 'Check console for details.',
              variant: 'destructive'
            })
          }
        } else {
          console.log('❌ Picker iframe not found in DOM')
        }
      }, 1000)
    } catch (error) {
      console.error('Error opening picker:', error)
      toast({
        title: 'Failed to Open Picker',
        description: `Could not open Google Drive picker: ${error.message}`,
        variant: 'destructive'
      })
      setIsLoading(false)
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

  const isReady = pickerApiLoaded && accessToken && user && isGoogleConnected

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