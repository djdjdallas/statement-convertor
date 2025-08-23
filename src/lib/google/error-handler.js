/**
 * Google API Error Handler
 * Provides comprehensive error handling for all Google Workspace API interactions
 */

// Error codes mapping
export const GOOGLE_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  TOKEN_EXPIRED: 'auth/token-expired',
  PERMISSION_REVOKED: 'auth/permission-revoked',
  INSUFFICIENT_SCOPES: 'auth/insufficient-scopes',
  
  // Quota errors
  QUOTA_EXCEEDED: 'quota/exceeded',
  RATE_LIMITED: 'quota/rate-limited',
  STORAGE_FULL: 'storage/full',
  
  // Network errors
  NETWORK_ERROR: 'network/error',
  TIMEOUT: 'network/timeout',
  SERVICE_UNAVAILABLE: 'service/unavailable',
  
  // File operation errors
  FILE_NOT_FOUND: 'file/not-found',
  FILE_ACCESS_DENIED: 'file/access-denied',
  DUPLICATE_FILE: 'file/duplicate',
  INVALID_FILE_TYPE: 'file/invalid-type',
  FILE_TOO_LARGE: 'file/too-large',
  
  // General errors
  INVALID_REQUEST: 'request/invalid',
  UNKNOWN_ERROR: 'error/unknown'
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [GOOGLE_ERROR_CODES.INVALID_CREDENTIALS]: {
    title: 'Authentication Failed',
    message: 'Your Google credentials are invalid. Please reconnect your Google account.',
    recovery: 'Reconnect Google Account'
  },
  [GOOGLE_ERROR_CODES.TOKEN_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your Google session has expired. We\'ll try to refresh it automatically.',
    recovery: 'Refresh Session'
  },
  [GOOGLE_ERROR_CODES.PERMISSION_REVOKED]: {
    title: 'Permissions Revoked',
    message: 'You\'ve revoked permissions for this app. Please grant access again to continue.',
    recovery: 'Grant Permissions'
  },
  [GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES]: {
    title: 'Additional Permissions Required',
    message: 'This operation requires additional Google permissions. Please authorize the requested access.',
    recovery: 'Update Permissions'
  },
  [GOOGLE_ERROR_CODES.QUOTA_EXCEEDED]: {
    title: 'Google API Quota Exceeded',
    message: 'You\'ve reached your Google API quota limit. Please try again later or upgrade your plan.',
    recovery: 'View Quota Status'
  },
  [GOOGLE_ERROR_CODES.RATE_LIMITED]: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    recovery: 'Retry Operation'
  },
  [GOOGLE_ERROR_CODES.STORAGE_FULL]: {
    title: 'Google Drive Storage Full',
    message: 'Your Google Drive is full. Please free up space or upgrade your storage.',
    recovery: 'Manage Storage'
  },
  [GOOGLE_ERROR_CODES.NETWORK_ERROR]: {
    title: 'Network Connection Error',
    message: 'Unable to connect to Google services. Please check your internet connection.',
    recovery: 'Retry Connection'
  },
  [GOOGLE_ERROR_CODES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    recovery: 'Retry Request'
  },
  [GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE]: {
    title: 'Google Service Unavailable',
    message: 'Google services are temporarily unavailable. Please try again later.',
    recovery: 'Check Status'
  },
  [GOOGLE_ERROR_CODES.FILE_NOT_FOUND]: {
    title: 'File Not Found',
    message: 'The requested file could not be found. It may have been deleted or moved.',
    recovery: 'Browse Files'
  },
  [GOOGLE_ERROR_CODES.FILE_ACCESS_DENIED]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this file.',
    recovery: 'Request Access'
  },
  [GOOGLE_ERROR_CODES.DUPLICATE_FILE]: {
    title: 'Duplicate File Name',
    message: 'A file with this name already exists. Would you like to rename it?',
    recovery: 'Rename File'
  },
  [GOOGLE_ERROR_CODES.INVALID_FILE_TYPE]: {
    title: 'Invalid File Type',
    message: 'This file type is not supported. Please use PDF, CSV, or Excel files.',
    recovery: 'View Supported Types'
  },
  [GOOGLE_ERROR_CODES.FILE_TOO_LARGE]: {
    title: 'File Too Large',
    message: 'This file exceeds the maximum size limit. Please use a smaller file.',
    recovery: 'Compress File'
  },
  [GOOGLE_ERROR_CODES.INVALID_REQUEST]: {
    title: 'Invalid Request',
    message: 'The request contains invalid data. Please check your input and try again.',
    recovery: 'Review Request'
  },
  [GOOGLE_ERROR_CODES.UNKNOWN_ERROR]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
    recovery: 'Contact Support'
  }
};

/**
 * Parse Google API error and return standardized error object
 */
export function parseGoogleError(error) {
  // Handle null/undefined errors
  if (!error) {
    return {
      code: GOOGLE_ERROR_CODES.UNKNOWN_ERROR,
      originalError: null,
      statusCode: 500
    };
  }

  // Extract error details from various formats
  const errorMessage = error.message || error.error?.message || '';
  const statusCode = error.code || error.response?.status || error.status || 500;
  const errorCode = error.error?.code || error.code;
  const errors = error.errors || error.error?.errors || [];

  // Map Google API errors to our error codes
  let mappedCode = GOOGLE_ERROR_CODES.UNKNOWN_ERROR;

  // Authentication errors
  if (statusCode === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('unauthenticated')) {
    mappedCode = GOOGLE_ERROR_CODES.INVALID_CREDENTIALS;
  } else if (errorMessage.includes('token') && (errorMessage.includes('expired') || errorMessage.includes('invalid'))) {
    mappedCode = GOOGLE_ERROR_CODES.TOKEN_EXPIRED;
  } else if (errorMessage.includes('revoked') || errorMessage.includes('permission denied')) {
    mappedCode = GOOGLE_ERROR_CODES.PERMISSION_REVOKED;
  } else if (errorMessage.includes('insufficient') && errorMessage.includes('scope')) {
    mappedCode = GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES;
  }
  
  // Quota errors
  else if (statusCode === 429 || errorCode === 429 || errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
    mappedCode = GOOGLE_ERROR_CODES.QUOTA_EXCEEDED;
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    mappedCode = GOOGLE_ERROR_CODES.RATE_LIMITED;
  } else if (statusCode === 507 || errorMessage.includes('storage') && errorMessage.includes('full')) {
    mappedCode = GOOGLE_ERROR_CODES.STORAGE_FULL;
  }
  
  // Network errors
  else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
    mappedCode = GOOGLE_ERROR_CODES.NETWORK_ERROR;
  } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    mappedCode = GOOGLE_ERROR_CODES.TIMEOUT;
  } else if (statusCode === 503 || errorMessage.includes('service unavailable')) {
    mappedCode = GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE;
  }
  
  // File errors
  else if (statusCode === 404 || errorMessage.includes('not found')) {
    mappedCode = GOOGLE_ERROR_CODES.FILE_NOT_FOUND;
  } else if (statusCode === 403 || errorMessage.includes('access denied') || errorMessage.includes('forbidden')) {
    mappedCode = GOOGLE_ERROR_CODES.FILE_ACCESS_DENIED;
  } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
    mappedCode = GOOGLE_ERROR_CODES.DUPLICATE_FILE;
  } else if (errorMessage.includes('invalid file') || errorMessage.includes('unsupported')) {
    mappedCode = GOOGLE_ERROR_CODES.INVALID_FILE_TYPE;
  } else if (errorMessage.includes('too large') || errorMessage.includes('size limit')) {
    mappedCode = GOOGLE_ERROR_CODES.FILE_TOO_LARGE;
  }
  
  // Request errors
  else if (statusCode === 400 || errorMessage.includes('invalid request')) {
    mappedCode = GOOGLE_ERROR_CODES.INVALID_REQUEST;
  }

  // Check for specific Google error reasons
  if (errors.length > 0) {
    const firstError = errors[0];
    if (firstError.reason === 'userRateLimitExceeded') {
      mappedCode = GOOGLE_ERROR_CODES.RATE_LIMITED;
    } else if (firstError.reason === 'quotaExceeded') {
      mappedCode = GOOGLE_ERROR_CODES.QUOTA_EXCEEDED;
    } else if (firstError.reason === 'insufficientPermissions') {
      mappedCode = GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES;
    }
  }

  return {
    code: mappedCode,
    originalError: error,
    statusCode,
    details: errors
  };
}

/**
 * Get user-friendly error details
 */
export function getErrorDetails(errorCode) {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[GOOGLE_ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error, additionalContext = {}) {
  const parsedError = parseGoogleError(error);
  const errorDetails = getErrorDetails(parsedError.code);
  
  return {
    error: true,
    code: parsedError.code,
    statusCode: parsedError.statusCode,
    title: errorDetails.title,
    message: errorDetails.message,
    recovery: errorDetails.recovery,
    context: additionalContext,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        originalError: parsedError.originalError?.message || parsedError.originalError,
        stack: parsedError.originalError?.stack,
        details: parsedError.details
      }
    })
  };
}

/**
 * Retry configuration for different error types
 */
export const RETRY_CONFIG = {
  [GOOGLE_ERROR_CODES.RATE_LIMITED]: {
    shouldRetry: true,
    maxRetries: 3,
    baseDelay: 2000, // 2 seconds
    backoffMultiplier: 2
  },
  [GOOGLE_ERROR_CODES.TIMEOUT]: {
    shouldRetry: true,
    maxRetries: 2,
    baseDelay: 1000,
    backoffMultiplier: 1.5
  },
  [GOOGLE_ERROR_CODES.NETWORK_ERROR]: {
    shouldRetry: true,
    maxRetries: 3,
    baseDelay: 1500,
    backoffMultiplier: 1.5
  },
  [GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE]: {
    shouldRetry: true,
    maxRetries: 3,
    baseDelay: 5000,
    backoffMultiplier: 2
  },
  [GOOGLE_ERROR_CODES.TOKEN_EXPIRED]: {
    shouldRetry: true,
    maxRetries: 1,
    baseDelay: 0,
    backoffMultiplier: 1
  }
};

/**
 * Determine if an error should be retried
 */
export function shouldRetryError(errorCode) {
  const config = RETRY_CONFIG[errorCode];
  return config ? config.shouldRetry : false;
}

/**
 * Get retry configuration for an error
 */
export function getRetryConfig(errorCode) {
  return RETRY_CONFIG[errorCode] || {
    shouldRetry: false,
    maxRetries: 0,
    baseDelay: 0,
    backoffMultiplier: 1
  };
}

/**
 * Execute a Google API operation with retry logic
 */
export async function executeWithRetry(operation, context = {}) {
  let lastError;
  let attempt = 0;
  
  while (true) {
    try {
      // Execute the operation
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      const parsedError = parseGoogleError(error);
      const retryConfig = getRetryConfig(parsedError.code);
      
      // Check if we should retry
      if (!retryConfig.shouldRetry || attempt >= retryConfig.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
      
      // Log retry attempt
      console.log(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`, {
        error: parsedError.code,
        context
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

/**
 * Handle token refresh for expired tokens
 */
export async function handleTokenRefresh(userId, refreshFn) {
  try {
    const newToken = await refreshFn(userId);
    return {
      success: true,
      token: newToken
    };
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return {
      success: false,
      error: parseGoogleError(error)
    };
  }
}

/**
 * Log error to monitoring service (if configured)
 */
export async function logError(error, context = {}) {
  const parsedError = parseGoogleError(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Google API Error:', {
      code: parsedError.code,
      statusCode: parsedError.statusCode,
      context,
      error: parsedError.originalError
    });
  }
  
  // TODO: Add integration with error monitoring service (e.g., Sentry, LogRocket)
  // This is where you would send errors to your monitoring service
  
  return parsedError;
}

/**
 * Create a user-friendly error notification
 */
export function createErrorNotification(error) {
  const errorDetails = getErrorDetails(error.code || GOOGLE_ERROR_CODES.UNKNOWN_ERROR);
  
  return {
    type: 'error',
    title: errorDetails.title,
    message: errorDetails.message,
    action: {
      label: errorDetails.recovery,
      handler: getRecoveryHandler(error.code)
    },
    duration: 8000 // Show for 8 seconds
  };
}

/**
 * Get recovery handler function name for specific error codes
 */
function getRecoveryHandler(errorCode) {
  const handlers = {
    [GOOGLE_ERROR_CODES.INVALID_CREDENTIALS]: 'reconnectGoogle',
    [GOOGLE_ERROR_CODES.TOKEN_EXPIRED]: 'refreshSession',
    [GOOGLE_ERROR_CODES.PERMISSION_REVOKED]: 'requestPermissions',
    [GOOGLE_ERROR_CODES.INSUFFICIENT_SCOPES]: 'updateScopes',
    [GOOGLE_ERROR_CODES.QUOTA_EXCEEDED]: 'viewQuotaStatus',
    [GOOGLE_ERROR_CODES.RATE_LIMITED]: 'retryOperation',
    [GOOGLE_ERROR_CODES.STORAGE_FULL]: 'manageStorage',
    [GOOGLE_ERROR_CODES.NETWORK_ERROR]: 'retryConnection',
    [GOOGLE_ERROR_CODES.TIMEOUT]: 'retryRequest',
    [GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE]: 'checkServiceStatus',
    [GOOGLE_ERROR_CODES.FILE_NOT_FOUND]: 'browseFiles',
    [GOOGLE_ERROR_CODES.FILE_ACCESS_DENIED]: 'requestAccess',
    [GOOGLE_ERROR_CODES.DUPLICATE_FILE]: 'renameFile',
    [GOOGLE_ERROR_CODES.INVALID_FILE_TYPE]: 'viewSupportedTypes',
    [GOOGLE_ERROR_CODES.FILE_TOO_LARGE]: 'compressFile',
    [GOOGLE_ERROR_CODES.INVALID_REQUEST]: 'reviewRequest',
    [GOOGLE_ERROR_CODES.UNKNOWN_ERROR]: 'contactSupport'
  };
  
  return handlers[errorCode] || 'contactSupport';
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(errorCode) {
  const recoverableErrors = [
    GOOGLE_ERROR_CODES.TOKEN_EXPIRED,
    GOOGLE_ERROR_CODES.RATE_LIMITED,
    GOOGLE_ERROR_CODES.NETWORK_ERROR,
    GOOGLE_ERROR_CODES.TIMEOUT,
    GOOGLE_ERROR_CODES.SERVICE_UNAVAILABLE,
    GOOGLE_ERROR_CODES.DUPLICATE_FILE
  ];
  
  return recoverableErrors.includes(errorCode);
}

/**
 * Error boundary wrapper for Google API operations
 */
export async function withGoogleErrorHandling(operation, options = {}) {
  const {
    context = {},
    onError = null,
    throwOnError = true,
    retryEnabled = true
  } = options;
  
  try {
    if (retryEnabled) {
      return await executeWithRetry(operation, context);
    } else {
      return await operation();
    }
  } catch (error) {
    // Log the error
    const parsedError = await logError(error, context);
    
    // Call custom error handler if provided
    if (onError) {
      await onError(parsedError);
    }
    
    // Create error response
    const errorResponse = createErrorResponse(error, context);
    
    if (throwOnError) {
      throw errorResponse;
    }
    
    return errorResponse;
  }
}