'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function GoogleAddonAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('authenticating');
  const [error, setError] = useState(null);
  const [authCode, setAuthCode] = useState(null);

  useEffect(() => {
    const authenticateAddon = async () => {
      try {
        const email = searchParams.get('email');
        const addon = searchParams.get('addon');
        
        if (!email || addon !== 'drive') {
          throw new Error('Invalid authentication request');
        }

        // Generate auth code for the add-on
        const response = await fetch('/api/auth/google-addon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            addon: 'drive'
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Authentication failed');
        }

        const data = await response.json();
        setAuthCode(data.code);
        setStatus('success');

        // Auto-close after 3 seconds
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 3000);

      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    authenticateAddon();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Google Drive Add-on Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'authenticating' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-gray-600">Authenticating your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Successful!</h3>
              <p className="text-gray-600 mb-4">
                You can now use Statement Desk in Google Drive.
              </p>
              {authCode && (
                <div className="bg-gray-100 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-500 mb-1">Auth Code:</p>
                  <code className="text-xs font-mono">{authCode}</code>
                </div>
              )}
              <Button 
                onClick={() => window.close()} 
                className="w-full"
              >
                Close Window
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Failed</h3>
              <p className="text-gray-600 mb-4">
                {error || 'An error occurred during authentication.'}
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.close()} 
                  variant="outline"
                  className="w-full"
                >
                  Close Window
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleAddonAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <GoogleAddonAuthContent />
    </Suspense>
  );
}