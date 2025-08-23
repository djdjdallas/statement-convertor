import { NextResponse } from 'next/server';
import { createDriveService } from '@/lib/google/drive-service';
import { hasGoogleIntegration } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to access Google Drive files.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check if user has Google integration
    const hasGoogle = await hasGoogleIntegration(user.id);
    if (!hasGoogle) {
      return NextResponse.json(
        { 
          error: 'Google Drive not connected',
          message: 'Please connect your Google account in Settings to use this feature.',
          code: 'GOOGLE_NOT_CONNECTED'
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const pageToken = searchParams.get('pageToken');

    // Create Drive service and list files
    const driveService = await createDriveService(user.id);
    const result = await driveService.listStatementFiles(pageSize, pageToken);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error listing Google Drive files:', error);
    
    // Handle specific Google API errors
    if (error.message?.includes('invalid_grant')) {
      return NextResponse.json(
        { 
          error: 'Google authorization expired',
          message: 'Your Google Drive connection has expired. Please reconnect in Settings.',
          code: 'GOOGLE_AUTH_EXPIRED'
        },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('quotaExceeded')) {
      return NextResponse.json(
        { 
          error: 'API quota exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'QUOTA_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load files',
        message: error.message || 'Unable to access Google Drive files. Please try again.',
        code: 'DRIVE_ACCESS_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to access Google Drive files.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Please select at least one file to delete.',
          code: 'INVALID_FILE_IDS'
        },
        { status: 400 }
      );
    }

    // Create Drive service and delete files
    const driveService = await createDriveService(user.id);
    const result = await driveService.batchDeleteFiles(fileIds);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error deleting Google Drive files:', error);
    
    if (error.message?.includes('File not found')) {
      return NextResponse.json(
        { 
          error: 'File not found',
          message: 'One or more files could not be found. They may have been already deleted.',
          code: 'FILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Delete failed',
        message: error.message || 'Unable to delete files. Please try again.',
        code: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}