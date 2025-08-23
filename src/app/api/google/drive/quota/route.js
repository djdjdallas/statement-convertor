import { NextResponse } from 'next/server';
import { createDriveService } from '@/lib/google/drive-service';
import { hasGoogleIntegration } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/google/error-handler';

export async function GET(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has Google integration
    const hasGoogle = await hasGoogleIntegration(user.id);
    if (!hasGoogle) {
      return NextResponse.json(
        { error: 'Google Drive not connected. Please connect your Google account first.' },
        { status: 400 }
      );
    }

    // Create Drive service and check quota
    const driveService = await createDriveService(user.id);
    const quota = await driveService.checkStorageQuota();

    return NextResponse.json({
      success: true,
      quota: {
        limit: quota.limit,
        usage: quota.usage,
        available: quota.available,
        percentUsed: parseFloat(quota.percentUsed),
        unlimited: quota.unlimited,
        error: quota.error || false,
        // Human readable values
        limitFormatted: formatBytes(quota.limit),
        usageFormatted: formatBytes(quota.usage),
        availableFormatted: formatBytes(quota.available)
      }
    });

  } catch (error) {
    console.error('Error checking Google Drive quota:', error);
    
    // Create standardized error response
    const errorResponse = createErrorResponse(error, {
      operation: 'checkDriveQuota'
    });
    
    // Return error with appropriate status code
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}