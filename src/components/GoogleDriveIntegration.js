'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Cloud, CheckCircle2, Link2, Unlink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GoogleErrorHandler, useGoogleErrorHandler } from '@/components/GoogleErrorHandler';
import { GOOGLE_ERROR_CODES } from '@/lib/google/error-handler';

export default function GoogleDriveIntegration() {
  const [isLinked, setIsLinked] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const router = useRouter();
  const { error: googleError, handleGoogleError, clearError, GoogleErrorDisplay } = useGoogleErrorHandler();

  useEffect(() => {
    checkGoogleLinkStatus();
  }, []);

  const checkGoogleLinkStatus = async () => {
    try {
      const response = await fetch('/api/auth/google/link', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      if (response.ok) {
        setIsLinked(data.linked);
        setGoogleAccount(data.googleAccount);
      } else if (data.code) {
        handleGoogleError(data);
      }
    } catch (error) {
      console.error('Error checking Google link status:', error);
      if (error.code) {
        handleGoogleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLink = async () => {
    try {
      // Use the new direct OAuth flow to get tokens
      window.location.href = '/api/auth/google/link-account';
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      toast.error('Failed to connect to Google');
    }
  };

  const handleGoogleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Google account?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/google/link', {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        setIsLinked(false);
        setGoogleAccount(null);
        toast.success('Google account unlinked successfully');
      } else {
        toast.error('Failed to unlink Google account');
      }
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      toast.error('Failed to unlink Google account');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Workspace Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-blue-200 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl">Google Workspace Integration</CardTitle>
              <CardDescription>
                Connect your Google account to import PDFs and export to Google Sheets
              </CardDescription>
            </div>
          </div>
          {isLinked && (
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {GoogleErrorDisplay}
        {isLinked && googleAccount ? (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {googleAccount.picture && (
                    <img
                      src={googleAccount.picture}
                      alt={googleAccount.name}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {googleAccount.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {googleAccount.email}
                    </p>
                  </div>
                </div>
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Import from Drive
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Access PDF files directly from your Google Drive
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-900/10 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                    Export to Sheets
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Save processed data directly to Google Sheets
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Permissions granted:</strong> Create and manage files in your Google Drive's "Statement Converter" folder
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleGoogleUnlink}
              variant="outline"
              className="w-full border-red-200 hover:bg-red-50 hover:text-red-700"
              disabled={unlinkLoading}
            >
              {unlinkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect Google Account
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Cloud className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Connect to Google Workspace
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Enable seamless import from Google Drive and export to Google Sheets
              </p>
              
              <Button
                onClick={handleGoogleLink}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google Account
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl mb-1">📁</div>
                <p className="text-sm font-medium">Drive Import</p>
                <p className="text-xs text-gray-500">Access PDFs directly</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-sm font-medium">Sheets Export</p>
                <p className="text-xs text-gray-500">Auto-create spreadsheets</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🔒</div>
                <p className="text-sm font-medium">Secure</p>
                <p className="text-xs text-gray-500">OAuth 2.0 protected</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}