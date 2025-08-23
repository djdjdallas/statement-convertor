'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  parseGoogleError,
  isRecoverableError,
  getRetryConfig,
  GOOGLE_ERROR_CODES 
} from '@/lib/google/error-handler';

/**
 * Hook for handling long-running Google API operations with proper error handling,
 * retry logic, and progress tracking
 */
export function useGoogleOperation(options = {}) {
  const {
    onSuccess,
    onError,
    autoRetry = true,
    timeout = 300000, // 5 minutes default
    progressInterval = 1000 // Update progress every second
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { toast } = useToast();
  const operationRef = useRef(null);
  const timeoutRef = useRef(null);
  const progressRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const startProgressSimulation = useCallback((estimatedDuration = 10000) => {
    let currentProgress = 0;
    const increment = 100 / (estimatedDuration / progressInterval);
    
    progressRef.current = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 90) {
        // Keep at 90% until operation completes
        currentProgress = 90;
        clearInterval(progressRef.current);
      }
      setProgress(Math.min(currentProgress, 100));
    }, progressInterval);
  }, [progressInterval]);

  const stopProgressSimulation = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  }, []);

  const handleError = useCallback((error) => {
    const parsedError = parseGoogleError(error);
    setError(parsedError);
    
    // Show appropriate toast based on error type
    if (parsedError.code === GOOGLE_ERROR_CODES.NETWORK_ERROR) {
      toast({
        title: 'Network Error',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive',
        duration: 5000
      });
    } else if (parsedError.code === GOOGLE_ERROR_CODES.QUOTA_EXCEEDED) {
      toast({
        title: 'Quota Exceeded',
        description: 'You have exceeded your Google API quota. Please try again later.',
        variant: 'destructive',
        duration: 8000
      });
    }
    
    if (onError) onError(parsedError);
    return parsedError;
  }, [toast, onError]);

  const executeWithRetry = useCallback(async (operation, maxRetries = 3) => {
    let lastError;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        abortControllerRef.current = new AbortController();
        const result = await operation(abortControllerRef.current.signal);
        return result;
      } catch (error) {
        lastError = error;
        const parsedError = parseGoogleError(error);
        
        // Don't retry if operation was aborted
        if (error.name === 'AbortError') {
          throw error;
        }
        
        // Check if error is retryable
        if (!autoRetry || !isRecoverableError(parsedError.code) || attempt >= maxRetries) {
          throw error;
        }
        
        // Get retry configuration
        const retryConfig = getRetryConfig(parsedError.code);
        const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        
        // Show retry toast
        toast({
          title: 'Retrying...',
          description: `Attempt ${attempt + 1} of ${maxRetries}. Waiting ${delay / 1000}s...`,
          duration: delay
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        setRetryCount(attempt);
      }
    }
    
    throw lastError;
  }, [autoRetry, toast]);

  const execute = useCallback(async (operation, options = {}) => {
    const {
      estimatedDuration = 10000,
      maxRetries = 3,
      showProgress = true
    } = options;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRetryCount(0);
    
    if (showProgress) {
      startProgressSimulation(estimatedDuration);
    }
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      handleError({
        code: GOOGLE_ERROR_CODES.TIMEOUT,
        message: 'Operation timed out'
      });
      setIsLoading(false);
      stopProgressSimulation();
    }, timeout);
    
    try {
      const result = await executeWithRetry(operation, maxRetries);
      
      clearTimeout(timeoutRef.current);
      setResult(result);
      setIsLoading(false);
      stopProgressSimulation();
      
      if (onSuccess) onSuccess(result);
      
      return result;
    } catch (error) {
      clearTimeout(timeoutRef.current);
      const parsedError = handleError(error);
      setIsLoading(false);
      stopProgressSimulation();
      
      throw parsedError;
    }
  }, [executeWithRetry, handleError, startProgressSimulation, stopProgressSimulation, timeout, onSuccess]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    stopProgressSimulation();
    setIsLoading(false);
    setError({
      code: GOOGLE_ERROR_CODES.OPERATION_CANCELLED,
      message: 'Operation cancelled by user'
    });
  }, [stopProgressSimulation]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setRetryCount(0);
  }, []);

  return {
    execute,
    cancel,
    reset,
    isLoading,
    progress,
    error,
    result,
    retryCount
  };
}

/**
 * Hook specifically for Google Drive operations
 */
export function useGoogleDriveOperation(options = {}) {
  const googleOperation = useGoogleOperation({
    ...options,
    timeout: options.timeout || 600000 // 10 minutes for Drive operations
  });
  
  const uploadFile = useCallback(async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);
    formData.append('metadata', JSON.stringify(metadata));
    
    return googleOperation.execute(
      async (signal) => {
        const response = await fetch('/api/google/drive/upload', {
          method: 'POST',
          body: formData,
          signal
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw data;
        }
        
        return data;
      },
      {
        estimatedDuration: Math.max(10000, file.size / 1000), // Estimate based on file size
        showProgress: true
      }
    );
  }, [googleOperation]);
  
  const exportToSheets = useCallback(async (transactions, insights, metadata = {}) => {
    return googleOperation.execute(
      async (signal) => {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: metadata.fileId,
            format: 'sheets',
            destination: 'drive',
            transactions,
            insights,
            metadata
          }),
          signal
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw data;
        }
        
        return data;
      },
      {
        estimatedDuration: 20000, // Sheets creation takes longer
        showProgress: true
      }
    );
  }, [googleOperation]);
  
  return {
    ...googleOperation,
    uploadFile,
    exportToSheets
  };
}

/**
 * Hook for checking Google API quotas
 */
export function useGoogleQuotaCheck() {
  const [quota, setQuota] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  
  const checkQuota = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/google/drive/quota');
      const data = await response.json();
      
      if (response.ok) {
        setQuota(data);
        
        // Warn if storage is low
        if (data.percentUsed > 90) {
          toast({
            title: 'Low Storage Warning',
            description: `Your Google Drive is ${data.percentUsed}% full. Consider freeing up space.`,
            variant: 'destructive',
            duration: 8000
          });
        }
      }
    } catch (error) {
      console.error('Failed to check quota:', error);
    } finally {
      setIsChecking(false);
    }
  }, [toast]);
  
  useEffect(() => {
    checkQuota();
  }, [checkQuota]);
  
  return { quota, isChecking, checkQuota };
}