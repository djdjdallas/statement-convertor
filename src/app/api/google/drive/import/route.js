import { NextResponse } from 'next/server';
import { createDriveService } from '@/lib/google/drive-service';
import { hasGoogleIntegration } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';
import { Readable } from 'stream';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to import files from Google Drive.',
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
          message: 'Please connect your Google account in Settings to import files.',
          code: 'GOOGLE_NOT_CONNECTED'
        },
        { status: 400 }
      );
    }

    // Get file ID from request body
    const body = await request.json();
    const { fileId, fileName, fileSize } = body;

    if (!fileId || !fileName) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'File information is missing. Please try selecting the file again.',
          code: 'MISSING_FILE_INFO'
        },
        { status: 400 }
      );
    }

    // Create Drive service
    const driveService = await createDriveService(user.id);
    
    // Download file from Google Drive
    const fileStream = await driveService.downloadFile(fileId);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Create a File object from the buffer
    const file = new File([fileBuffer], fileName, { type: 'application/pdf' });
    
    // Generate a unique file ID
    const newFileId = crypto.randomUUID();
    
    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        id: newFileId,
        user_id: user.id,
        filename: `${newFileId}.pdf`,
        original_filename: fileName,
        file_size: fileSize || fileBuffer.length,
        processing_status: 'pending',
        google_drive_id: fileId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: 'Unable to save file information. Please try again.',
          code: 'DB_ERROR'
        },
        { status: 500 }
      );
    }

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('statement-files')
      .upload(`${user.id}/${fileRecord.id}.pdf`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      // Clean up database record if upload fails
      await supabase.from('files').delete().eq('id', fileRecord.id);
      
      console.error('Upload error:', uploadError);
      
      if (uploadError.message?.includes('payload too large')) {
        return NextResponse.json(
          { 
            error: 'File too large',
            message: 'This file exceeds the maximum allowed size. Please upgrade your plan for larger files.',
            code: 'FILE_TOO_LARGE'
          },
          { status: 413 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Upload failed',
          message: 'Unable to save the file. Please check your connection and try again.',
          code: 'UPLOAD_ERROR'
        },
        { status: 500 }
      );
    }

    // Update file record with storage path
    const { error: updateError } = await supabase
      .from('files')
      .update({ 
        file_path: uploadData.path,
        processing_status: 'uploaded'
      })
      .eq('id', fileRecord.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileName,
        size: fileSize || fileBuffer.length,
        status: 'uploaded',
        isFromGoogleDrive: true
      }
    });

  } catch (error) {
    console.error('Error importing file from Google Drive:', error);
    
    if (error.message?.includes('File not found')) {
      return NextResponse.json(
        { 
          error: 'File not found',
          message: 'The selected file could not be found in Google Drive. It may have been deleted or moved.',
          code: 'FILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
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
    
    return NextResponse.json(
      { 
        error: 'Import failed',
        message: error.message || 'Unable to import file from Google Drive. Please try again.',
        code: 'IMPORT_ERROR'
      },
      { status: 500 }
    );
  }
}