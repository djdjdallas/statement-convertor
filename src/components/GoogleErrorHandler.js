'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  GOOGLE_ERROR_CODES,
  getErrorDetails,
  isRecoverableError 
} from '@/lib/google/error-handler';
import {
  AlertCircle,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

// Error icon mapping
const ERROR_ICONS = {
  [GOOGLE_ERROR_CODES.INVALID_CREDENTIALS]: XCircle,
  [GOOGLE_ERROR_CODES.TOKEN_EXPIRED]: RefreshCw,
  [GOOGLE_ERROR_CODES.PERMISSION_REVOKED]: XCircle,
  [GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES]: AlertCircle,
  [GOOGLE_ERROR_CODES.QUOTA_EXCEEDED]: AlertTriangle,
  [GOOGLE_ERROR_CODES.RATE_LIMITED]: AlertTriangle,
  [GOOGLE_ERROR_CODES.STORAGE_FULL]: AlertTriangle,
  [GOOGLE_ERROR_CODES.NETWORK_ERROR]: WifiOff,
  [GOOGLE_ERROR_CODES.TIMEOUT]: RefreshCw,
  [GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE]: AlertTriangle,
  [GOOGLE_ERROR_CODES.FILE_NOT_FOUND]: HelpCircle,
  [GOOGLE_ERROR_CODES.FILE_ACCESS_DENIED]: XCircle,
  [GOOGLE_ERROR_CODES.DUPLICATE_FILE]: AlertCircle,
  [GOOGLE_ERROR_CODES.INVALID_FILE_TYPE]: AlertCircle,
  [GOOGLE_ERROR_CODES.FILE_TOO_LARGE]: AlertTriangle,
  [GOOGLE_ERROR_CODES.INVALID_REQUEST]: AlertCircle,
  [GOOGLE_ERROR_CODES.UNKNOWN_ERROR]: HelpCircle
};

export function GoogleErrorHandler({ error, onRetry, onDismiss }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(null);

  // Get error details
  const errorCode = error?.code || GOOGLE_ERROR_CODES.UNKNOWN_ERROR;
  const errorDetails = getErrorDetails(errorCode);
  const Icon = ERROR_ICONS[errorCode] || AlertCircle;
  const isRecoverable = isRecoverableError(errorCode);

  // Auto-retry countdown for rate limiting
  useEffect(() => {
    if (errorCode === GOOGLE_ERROR_CODES.RATE_LIMITED && !isRetrying) {
      let countdown = 5;
      setRetryCountdown(countdown);
      
      const interval = setInterval(() => {
        countdown -= 1;
        setRetryCountdown(countdown);
        
        if (countdown === 0) {
          clearInterval(interval);
          handleRetry();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [errorCode]);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    setRetryCountdown(null);
    
    try {
      await onRetry();
      toast({
        title: 'Success',
        description: 'Operation completed successfully',
        duration: 3000
      });
      if (onDismiss) onDismiss();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      toast({
        title: 'Retry Failed',
        description: 'The operation could not be completed. Please try again later.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, onDismiss, toast]);

  const handleRecoveryAction = useCallback(() => {
    switch (errorCode) {
      case GOOGLE_ERROR_CODES.INVALID_CREDENTIALS:
      case GOOGLE_ERROR_CODES.PERMISSION_REVOKED:
      case GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES:
        router.push('/settings?tab=integrations&reconnect=google');
        break;
        
      case GOOGLE_ERROR_CODES.TOKEN_EXPIRED:
        // Attempt automatic refresh
        window.location.reload();
        break;
        
      case GOOGLE_ERROR_CODES.QUOTA_EXCEEDED:
        window.open('https://console.cloud.google.com/apis/api/drive.googleapis.com/quotas', '_blank');
        break;
        
      case GOOGLE_ERROR_CODES.STORAGE_FULL:
        window.open('https://one.google.com/storage', '_blank');
        break;
        
      case GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE:
        window.open('https://www.google.com/appsstatus', '_blank');
        break;
        
      case GOOGLE_ERROR_CODES.DUPLICATE_FILE:
        // Handle rename dialog (would need additional UI)
        toast({
          title: 'Duplicate File',
          description: 'Please rename your file and try again.',
          duration: 5000
        });
        break;
        
      default:
        if (isRecoverable && onRetry) {
          handleRetry();
        }
    }
  }, [errorCode, router, toast, isRecoverable, onRetry, handleRetry]);

  // Determine alert variant
  const getAlertVariant = () => {
    if (isRecoverable) return 'default';
    if (errorCode === GOOGLE_ERROR_CODES.UNKNOWN_ERROR) return 'destructive';
    return 'default';
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertTitle>{errorDetails.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{errorDetails.message}</p>
        
        {/* Additional context for specific errors */}
        {errorCode === GOOGLE_ERROR_CODES.STORAGE_FULL && error.context?.fileSize && (
          <p className="mt-2 text-sm text-muted-foreground">
            File size: {(error.context.fileSize / 1024 / 1024).toFixed(2)}MB
          </p>
        )}
        
        {errorCode === GOOGLE_ERROR_CODES.RATE_LIMITED && retryCountdown && (
          <p className="mt-2 text-sm text-muted-foreground">
            Retrying in {retryCountdown} seconds...
          </p>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && error.debug && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Debug Information
            </summary>
            <pre className="mt-2 text-xs overflow-auto p-2 bg-muted rounded">
              {JSON.stringify(error.debug, null, 2)}
            </pre>
          </details>
        )}
        
        <div className="mt-4 flex gap-2">
          {/* Recovery action button */}
          <Button
            onClick={handleRecoveryAction}
            variant="default"
            size="sm"
            disabled={isRetrying}
          >
            {errorDetails.recovery}
            {errorCode === GOOGLE_ERROR_CODES.QUOTA_EXCEEDED || 
             errorCode === GOOGLE_ERROR_CODES.STORAGE_FULL || 
             errorCode === GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE ? (
              <ExternalLink className="ml-2 h-3 w-3" />
            ) : null}
          </Button>
          
          {/* Manual retry button for recoverable errors */}
          {isRecoverable && onRetry && errorCode !== GOOGLE_ERROR_CODES.RATE_LIMITED && (
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry Now
                </>
              )}
            </Button>
          )}
          
          {/* Dismiss button */}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Hook for using Google error handling in components
export function useGoogleErrorHandler() {
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  const handleGoogleError = useCallback((error) => {
    console.error('Google API Error:', error);
    
    // Set error state for display
    setError(error);
    
    // Show toast notification for quick errors
    if (error.code === GOOGLE_ERROR_CODES.NETWORK_ERROR || 
        error.code === GOOGLE_ERROR_CODES.TIMEOUT) {
      toast({
        title: error.title,
        description: error.message,
        variant: 'destructive',
        duration: 5000
      });
    }
  }, [toast]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    handleGoogleError,
    clearError,
    GoogleErrorDisplay: error ? (
      <GoogleErrorHandler 
        error={error} 
        onDismiss={clearError}
      />
    ) : null
  };
}

// Wrapper component for Google API operations
export function GoogleAPIBoundary({ children, onError }) {
  const { handleGoogleError } = useGoogleErrorHandler();
  
  useEffect(() => {
    if (onError) {
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.code?.startsWith('auth/') || 
            event.reason?.code?.startsWith('quota/') ||
            event.reason?.code?.startsWith('network/')) {
          event.preventDefault();
          handleGoogleError(event.reason);
          onError(event.reason);
        }
      });
    }
  }, [onError, handleGoogleError]);
  
  return children;
}