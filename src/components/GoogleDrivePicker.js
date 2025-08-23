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

  // Get access token when component mounts or user changes
  useEffect(() => {
    const getToken = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/google/auth/token', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAccessToken(data.accessToken)
        } else {
          if (response.status === 401) {
            toast({
              title: 'Authentication Required',
              description: 'Please sign in to use Google Drive features.',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
        console.error('Error getting access token:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    getToken()
  }, [user])

  const handleOpenPicker = () => {
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

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setCallback(pickerCallback)
        .setTitle('Select a file')
        .build()

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

  const isReady = pickerApiLoaded && accessToken && user

  return (
    <Button
      variant={buttonVariant}
      onClick={handleOpenPicker}
      disabled={!isReady || isLoading}
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
      ) : !isReady ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          {!user ? 'Sign In Required' : 'Connect Google Drive'}
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