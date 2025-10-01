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
            const tokenResponse = await fetch('/api/google/auth/token', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json()
              console.log('Access token retrieved:', tokenData.accessToken ? 'Present' : 'Missing')
              if (tokenData.accessToken) {
                setAccessToken(tokenData.accessToken)
              } else {
                console.error('Token data missing access token:', tokenData)
              }
            } else {
              const errorData = await tokenResponse.json()
              console.error('Failed to get access token:', errorData)
            }
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

  const handleOpenPicker = (e) => {
    // Prevent the click from propagating to parent elements (like Dropzone)
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    console.log('=== Opening Google Picker ===')
    console.log('Google connected:', isGoogleConnected)
    console.log('Picker API loaded:', pickerApiLoaded)
    console.log('Access token present:', !!accessToken)
    console.log('API key present:', !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
    console.log('window.google available:', !!window.google)
    console.log('window.google.picker available:', !!window.google?.picker)

    if (!isGoogleConnected) {
      toast({
        title: 'Google Account Not Connected',
        description: 'Please connect your Google account in Settings first.',
        variant: 'destructive'
      })
      // Redirect to settings page to connect Google
      setTimeout(() => {
        window.location.href = '/settings?tab=integrations'
      }, 2000)
      return
    }

    if (!pickerApiLoaded) {
      toast({
        title: 'Google Picker Not Ready',
        description: 'The Google Drive picker is still loading. Please try again in a moment.',
        variant: 'destructive'
      })
      return
    }

    if (!window.google || !window.google.picker) {
      console.error('Google Picker API not available:', { google: !!window.google, picker: !!window.google?.picker })
      toast({
        title: 'Google Picker Not Available',
        description: 'The Google Picker API did not load correctly. Please refresh the page.',
        variant: 'destructive'
      })
      return
    }

    if (!accessToken) {
      console.error('Access token missing')
      toast({
        title: 'Not Connected to Google Drive',
        description: 'Please reconnect your Google account in Settings.',
        variant: 'destructive'
      })
      return
    }

    // Try multiple ways to get the API key (webpack config might be blocking process.env)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
                   (typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_GOOGLE_API_KEY) ||
                   'AIzaSyBaYuZugtGye92Fgq5ufB9alGTtqAlATVE' // Fallback to hardcoded key for production

    console.log('API Key check:', {
      fromProcessEnv: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      fromWindow: !!(typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_GOOGLE_API_KEY),
      finalKey: apiKey ? 'Present (' + apiKey.substring(0, 15) + '...)' : 'Missing'
    })

    if (!apiKey) {
      console.error('Google API key not configured')
      toast({
        title: 'Configuration Error',
        description: 'Google API key is not configured. Please contact support.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('Creating picker view...')
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      view.setMimeTypes(acceptedMimeTypes.join(','))

      console.log('Building picker...')
      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback(pickerCallback)
        .setTitle('Select a file from Google Drive')
        .setOrigin(window.location.origin)

      const picker = pickerBuilder.build()
      console.log('Picker built, showing...')

      // Ensure picker appears (Google Picker creates a modal with specific z-index)
      picker.setVisible(true)
      console.log('Picker visibility set to true')

      // Add a timeout to check if picker appeared
      setTimeout(() => {
        const pickerDialog = document.querySelector('.picker-dialog, .picker, [role="dialog"]')
        if (pickerDialog) {
          console.log('✅ Picker dialog found in DOM:', pickerDialog)
          // Ensure it's on top
          pickerDialog.style.zIndex = '999999'
        } else {
          console.error('❌ Picker dialog NOT found in DOM - might be blocked by popup blocker or CSP')
          toast({
            title: 'Picker May Be Blocked',
            description: 'If you don\'t see the picker, please check your popup blocker settings.',
            variant: 'destructive'
          })
        }
      }, 500)
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
    setIsLoading(false)

    if (data.action === window.google.picker.Action.PICKED) {
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