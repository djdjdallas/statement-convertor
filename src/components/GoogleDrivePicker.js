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
      if (window.gapi) {
        setPickerApiLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = GOOGLE_DRIVE_PICKER_API
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true)
        })
      }
      script.onerror = () => {
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
      if (!user) return

      try {
        // First check if Google is connected
        const linkResponse = await fetch('/api/auth/google/link', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (linkResponse.ok) {
          const linkData = await linkResponse.json()
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
              setAccessToken(tokenData.accessToken)
            }
          }
        }
      } catch (error) {
        console.error('Error checking Google connection:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    checkGoogleConnection()
  }, [user])

  const handleOpenPicker = () => {
    if (!isGoogleConnected) {
      // Redirect to settings page to connect Google
      window.location.href = '/settings?tab=integrations'
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
    
    if (!accessToken) {
      toast({
        title: 'Not Connected to Google Drive',
        description: 'Please connect your Google account first in Settings.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      view.setMimeTypes(acceptedMimeTypes.join(','))

      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .setTitle('Select a file')
      
      // Only set developer key if it's defined
      if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        pickerBuilder.setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
      }
      
      const picker = pickerBuilder.build()

      picker.setVisible(true)
    } catch (error) {
      console.error('Error opening picker:', error)
      toast({
        title: 'Failed to Open Picker',
        description: 'Could not open Google Drive picker. Please try again.',
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