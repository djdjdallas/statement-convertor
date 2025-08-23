import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasGoogleIntegration } from '@/lib/google/auth';

export async function GET(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to access Google Drive picker.',
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

    // Get Google OAuth token for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { 
          error: 'Google authorization not found',
          message: 'Please reconnect your Google account in Settings.',
          code: 'GOOGLE_AUTH_NOT_FOUND'
        },
        { status: 401 }
      );
    }

    // Get configuration from query parameters
    const { searchParams } = new URL(request.url);
    const viewId = searchParams.get('viewId') || 'DOCS';
    const multiselect = searchParams.get('multiselect') === 'true';
    const mimeTypes = searchParams.get('mimeTypes') || 'application/pdf';

    // Return picker configuration
    const pickerConfig = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      appId: process.env.NEXT_PUBLIC_GOOGLE_APP_ID,
      accessToken: tokenData.access_token,
      viewId,
      multiselect,
      mimeTypes: mimeTypes.split(','),
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      locale: 'en',
      features: {
        enableTeamDrives: true,
        supportDrives: true,
        multiselect,
        navHidden: false
      },
      viewOptions: {
        showUploadView: true,
        showUploadFolders: false
      }
    };

    return NextResponse.json({
      success: true,
      config: pickerConfig
    });

  } catch (error) {
    console.error('Error initializing Google Drive picker:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize picker',
        message: error.message || 'Unable to initialize Google Drive picker.',
        code: 'PICKER_INIT_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to process selected files.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get selected files from request body
    const body = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Please select at least one file.',
          code: 'NO_FILES_SELECTED'
        },
        { status: 400 }
      );
    }

    // Validate file selection
    const validFiles = files.filter(file => {
      return file.id && file.name && file.mimeType;
    });

    if (validFiles.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid files',
          message: 'Selected files are missing required information.',
          code: 'INVALID_FILE_DATA'
        },
        { status: 400 }
      );
    }

    // Store selected files in session or database for processing
    const { error: insertError } = await supabase
      .from('pending_drive_imports')
      .insert(
        validFiles.map(file => ({
          user_id: user.id,
          drive_file_id: file.id,
          file_name: file.name,
          mime_type: file.mimeType,
          file_size: file.sizeBytes || null,
          parent_id: file.parentId || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }))
      );

    if (insertError) {
      console.error('Error storing selected files:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to store selection',
          message: 'Unable to save selected files. Please try again.',
          code: 'STORAGE_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        selectedCount: validFiles.length,
        files: validFiles.map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType
        }))
      }
    });

  } catch (error) {
    console.error('Error processing picker selection:', error);
    
    return NextResponse.json(
      { 
        error: 'Processing failed',
        message: error.message || 'Unable to process selected files.',
        code: 'PICKER_PROCESS_ERROR'
      },
      { status: 500 }
    );
  }
}