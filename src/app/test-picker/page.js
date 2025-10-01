'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function TestPickerPage() {
  const [logs, setLogs] = useState([])
  const [apiLoaded, setApiLoaded] = useState(false)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  useEffect(() => {
    // Check if gapi loaded
    if (window.gapi) {
      addLog('✅ gapi already loaded', 'success')
      setApiLoaded(true)
    }
  }, [])

  const handleApiLoad = () => {
    addLog('✅ Google API script loaded', 'success')
    window.gapi.load('picker', {
      callback: () => {
        addLog('✅ Google Picker library loaded', 'success')
        setApiLoaded(true)
      },
      onerror: (error) => {
        addLog(`❌ Failed to load Picker library: ${error}`, 'error')
      }
    })
  }

  const testPicker = async () => {
    addLog('🔍 Starting Google Picker test...', 'info')

    const apiKey = 'AIzaSyBaYuZugtGye92Fgq5ufB9alGTtqAlATVE'
    addLog(`API Key: ${apiKey.substring(0, 20)}...`, 'info')

    // Get access token from your API
    try {
      const tokenResponse = await fetch('/api/google/auth/token')
      if (!tokenResponse.ok) {
        addLog(`❌ Failed to get access token: ${tokenResponse.status}`, 'error')
        return
      }
      const { accessToken } = await tokenResponse.json()
      addLog(`✅ Access token retrieved: ${accessToken.substring(0, 20)}...`, 'success')

      // Build picker
      addLog('🔨 Building picker...', 'info')
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      view.setMimeTypes('application/pdf')

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data) => {
          addLog(`📞 Picker callback: action=${data.action}`, 'info')
          if (data.action === window.google.picker.Action.PICKED) {
            addLog(`✅ File picked: ${data.docs[0].name}`, 'success')
          }
        })
        .setTitle('Test Picker')
        .setOrigin(window.location.origin)
        .build()

      addLog('✅ Picker built successfully', 'success')
      addLog('👁️ Setting picker visible...', 'info')
      picker.setVisible(true)

      // Check iframe after 1 second
      setTimeout(() => {
        const iframe = document.querySelector('iframe.picker')
        if (iframe) {
          const src = iframe.src || iframe.getAttribute('src')
          addLog(`📱 Picker iframe found: src=${src}`, src === 'about:blank' ? 'error' : 'success')

          if (src === 'about:blank') {
            addLog('⚠️ ISSUE: Iframe stuck at about:blank', 'error')
            addLog('Possible causes:', 'error')
            addLog('1. API key restrictions blocking request', 'error')
            addLog('2. Domain not authorized in API key settings', 'error')
            addLog('3. Drive API not enabled for this API key', 'error')
            addLog('4. OAuth scope missing drive.file permission', 'error')
          }
        } else {
          addLog('❌ Picker iframe not found in DOM', 'error')
        }
      }, 1000)

    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={handleApiLoad}
        onError={() => addLog('❌ Failed to load Google API script', 'error')}
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Google Picker Diagnostic Test</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <button
            onClick={testPicker}
            disabled={!apiLoaded}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {apiLoaded ? 'Run Picker Test' : 'Loading Google API...'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Run Picker Test" to start.</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    log.type === 'error' ? 'bg-red-50 text-red-900' :
                    log.type === 'success' ? 'bg-green-50 text-green-900' :
                    'bg-gray-50 text-gray-900'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">Expected Results:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ All items should show green checkmarks</li>
            <li>📱 Picker iframe src should be a Google URL (not "about:blank")</li>
            <li>👁️ A Google Picker modal should appear on screen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
