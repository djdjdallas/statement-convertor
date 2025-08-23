import { NextResponse } from 'next/server';
import { createDriveService } from '@/lib/google/drive-service';
import { hasGoogleIntegration } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    // Get user session
    const supabase = createClient();
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

    // Parse request body
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName');
    const mimeType = formData.get('mimeType');
    const metadata = JSON.parse(formData.get('metadata') || '{}');

    if (!file || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, fileName, mimeType' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create Drive service and upload file
    const driveService = await createDriveService(user.id);
    
    // Check storage quota first
    const quota = await driveService.checkStorageQuota();
    if (quota.available < fileBuffer.length) {
      return NextResponse.json(
        { error: 'Insufficient Google Drive storage space' },
        { status: 507 }
      );
    }

    // Upload the file
    const uploadResult = await driveService.uploadStatementFile(
      fileBuffer,
      fileName,
      mimeType === 'text/csv' ? 'csv' : 'excel',
      metadata
    );

    // Log the export in our database
    const { error: trackingError } = await supabase
      .from('file_exports')
      .insert({
        file_id: metadata.fileId,
        user_id: user.id,
        export_format: mimeType === 'text/csv' ? 'csv' : 'excel',
        destination: 'google_drive',
        drive_file_id: uploadResult.id,
        drive_file_link: uploadResult.webViewLink
      });

    if (trackingError) {
      console.error('Error tracking export:', trackingError);
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: uploadResult.id,
        fileName: uploadResult.name,
        webViewLink: uploadResult.webViewLink,
        webContentLink: uploadResult.webContentLink,
        size: uploadResult.size,
        createdTime: uploadResult.createdTime
      }
    });

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}