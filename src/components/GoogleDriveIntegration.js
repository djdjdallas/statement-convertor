'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function GoogleDriveIntegration() {
  const [isLinked, setIsLinked] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkGoogleLinkStatus();
  }, []);

  const checkGoogleLinkStatus = async () => {
    try {
      const response = await fetch('/api/auth/google/link');
      const data = await response.json();
      
      if (response.ok) {
        setIsLinked(data.linked);
        setGoogleAccount(data.googleAccount);
      }
    } catch (error) {
      console.error('Error checking Google link status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLink = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to initiate Google sign-in');
      }
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Google Drive Integration
      </h3>
      
      {isLinked && googleAccount ? (
        <div>
          <div className="flex items-center mb-4">
            {googleAccount.picture && (
              <img
                src={googleAccount.picture}
                alt={googleAccount.name}
                className="w-10 h-10 rounded-full mr-3"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {googleAccount.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {googleAccount.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
            <span className="text-green-700 dark:text-green-400 text-sm">
              ✓ Connected to Google Drive
            </span>
          </div>
          
          <button
            onClick={handleGoogleUnlink}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Disconnect Google Account
          </button>
          
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Your processed files can be automatically saved to your Google Drive.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your Google account to automatically save processed files to Google Drive.
          </p>
          
          <button
            onClick={handleGoogleLink}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaGoogle className="mr-2" />
            Connect Google Account
          </button>
          
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            We only request access to create and manage files in your Google Drive.
          </p>
        </div>
      )}
    </div>
  );
}