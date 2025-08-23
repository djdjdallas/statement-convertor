'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

function GoogleAddonAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('checking'); // checking, authenticated, unauthenticated, connecting, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      setStatus('unauthenticated');
      setMessage('Please sign in to connect Google Add-on');
      return;
    }
    
    setUser(user);
    
    // Check if email matches
    const addonEmail = searchParams.get('email');
    if (addonEmail && addonEmail !== user.email) {
      setStatus('error');
      setMessage(`Email mismatch. Add-on email: ${addonEmail}, Statement Desk email: ${user.email}`);
      return;
    }
    
    setStatus('authenticated');
  };

  const connectAddon = async () => {
    setStatus('connecting');
    setMessage('Connecting your Google Add-on...');
    
    const temporaryToken = searchParams.get('token');
    if (!temporaryToken) {
      setStatus('error');
      setMessage('Missing authentication token');
      return;
    }
    
    try {
      const response = await fetch('/api/google/addon/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          temporaryToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect add-on');
      }
      
      // Send token back to add-on
      if (window.opener) {
        window.opener.postMessage({
          type: 'statementDesk.authComplete',
          token: data.token
        }, '*');
      }
      
      setStatus('success');
      setMessage('Successfully connected! You can close this window.');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        window.close();
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  const signIn = () => {
    const returnUrl = window.location.href;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Connect Google Add-on</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          )}
          
          {status === 'unauthenticated' && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={signIn} className="w-full">
                Sign In to Statement Desk
              </Button>
            </>
          )}
          
          {status === 'authenticated' && (
            <>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Ready to connect your Google Add-on to Statement Desk.</p>
                    <p className="text-sm text-muted-foreground">
                      Logged in as: {user?.email}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <Button onClick={connectAddon} className="w-full">
                Connect Add-on
              </Button>
            </>
          )}
          
          {status === 'connecting' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={connectAddon} variant="outline" className="w-full">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleAddonAuth() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <GoogleAddonAuthContent />
    </Suspense>
  );
}