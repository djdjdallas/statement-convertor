import { NextResponse } from 'next/server';
import { createDriveService } from '@/lib/google/drive-service';
import { hasGoogleIntegration } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';

const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder'
};

export async function POST(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to create folders in Google Drive.',
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

    // Get request body
    const body = await request.json();
    const { 
      folderName, 
      parentFolderId, 
      structure,
      description,
      color 
    } = body;

    if (!folderName) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Folder name is required.',
          code: 'FOLDER_NAME_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Create Drive service
    const driveService = await createDriveService(user.id);
    
    // Create main folder
    const mainFolderMetadata = {
      name: folderName,
      mimeType: MIME_TYPES.FOLDER,
      parents: parentFolderId ? [parentFolderId] : undefined,
      description: description || `Created by Statement Desk on ${new Date().toLocaleDateString()}`,
      folderColorRgb: color || undefined
    };

    const mainFolderResponse = await driveService.drive.files.create({
      resource: mainFolderMetadata,
      fields: 'id, name, webViewLink, parents'
    });

    const mainFolder = mainFolderResponse.data;
    const createdFolders = [mainFolder];

    // Create folder structure if specified
    if (structure && Array.isArray(structure)) {
      for (const subfolder of structure) {
        const subfolderMetadata = {
          name: subfolder.name,
          mimeType: MIME_TYPES.FOLDER,
          parents: [mainFolder.id],
          description: subfolder.description || `${subfolder.name} folder for Statement Desk`
        };

        const subfolderResponse = await driveService.drive.files.create({
          resource: subfolderMetadata,
          fields: 'id, name, webViewLink'
        });

        createdFolders.push(subfolderResponse.data);

        // Create nested subfolders if specified
        if (subfolder.children && Array.isArray(subfolder.children)) {
          for (const nestedFolder of subfolder.children) {
            const nestedMetadata = {
              name: nestedFolder.name,
              mimeType: MIME_TYPES.FOLDER,
              parents: [subfolderResponse.data.id],
              description: nestedFolder.description || `${nestedFolder.name} folder`
            };

            const nestedResponse = await driveService.drive.files.create({
              resource: nestedMetadata,
              fields: 'id, name, webViewLink'
            });

            createdFolders.push(nestedResponse.data);
          }
        }
      }
    }

    // Set permissions for domain-wide installations
    const { data: userAssociation } = await supabase
      .from('user_marketplace_associations')
      .select('domain, association_type')
      .eq('user_id', user.id)
      .single();

    if (userAssociation && userAssociation.domain) {
      // Share with domain if user is part of a domain installation
      try {
        await driveService.drive.permissions.create({
          fileId: mainFolder.id,
          requestBody: {
            type: 'domain',
            role: 'writer',
            domain: userAssociation.domain
          }
        });
      } catch (permError) {
        console.warn('Could not set domain permissions:', permError);
        // Continue even if domain permissions fail
      }
    }

    // Store folder metadata in database
    const { error: dbError } = await supabase
      .from('user_drive_folders')
      .insert({
        user_id: user.id,
        folder_id: mainFolder.id,
        folder_name: folderName,
        folder_type: 'statement_desk',
        parent_id: parentFolderId || null,
        structure: structure || null,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error storing folder metadata:', dbError);
      // Continue even if database storage fails
    }

    return NextResponse.json({
      success: true,
      data: {
        mainFolder: {
          id: mainFolder.id,
          name: mainFolder.name,
          webViewLink: mainFolder.webViewLink
        },
        createdFolders: createdFolders.map(f => ({
          id: f.id,
          name: f.name,
          webViewLink: f.webViewLink
        })),
        totalCreated: createdFolders.length
      }
    });

  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    
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

    if (error.message?.includes('insufficientPermissions')) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          message: 'You do not have permission to create folders in the selected location.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create folder',
        message: error.message || 'Unable to create folder in Google Drive.',
        code: 'FOLDER_CREATE_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper endpoint to suggest folder structures
export async function GET(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Predefined folder structure templates
    const templates = {
      basic: {
        name: 'Basic Structure',
        description: 'Simple folder organization for statements',
        structure: [
          { name: 'Original PDFs', description: 'Store original bank statement PDFs' },
          { name: 'Converted Files', description: 'Excel and CSV conversions' },
          { name: 'Reports', description: 'AI-generated financial reports' }
        ]
      },
      detailed: {
        name: 'Detailed Structure',
        description: 'Comprehensive organization by year and month',
        structure: [
          {
            name: new Date().getFullYear().toString(),
            description: 'Current year statements',
            children: [
              { name: 'January', description: 'January statements' },
              { name: 'February', description: 'February statements' },
              { name: 'March', description: 'March statements' },
              { name: 'April', description: 'April statements' },
              { name: 'May', description: 'May statements' },
              { name: 'June', description: 'June statements' },
              { name: 'July', description: 'July statements' },
              { name: 'August', description: 'August statements' },
              { name: 'September', description: 'September statements' },
              { name: 'October', description: 'October statements' },
              { name: 'November', description: 'November statements' },
              { name: 'December', description: 'December statements' }
            ]
          },
          { name: 'Converted Files', description: 'All Excel and CSV conversions' },
          { name: 'Analytics', description: 'Financial insights and reports' }
        ]
      },
      business: {
        name: 'Business Structure',
        description: 'Organization for business accounting',
        structure: [
          {
            name: 'Bank Statements',
            description: 'All bank statement files',
            children: [
              { name: 'Checking', description: 'Business checking accounts' },
              { name: 'Savings', description: 'Business savings accounts' },
              { name: 'Credit Cards', description: 'Business credit card statements' }
            ]
          },
          {
            name: 'Expense Reports',
            description: 'Categorized expense reports',
            children: [
              { name: 'Monthly', description: 'Monthly expense summaries' },
              { name: 'Quarterly', description: 'Quarterly financial reports' },
              { name: 'Annual', description: 'Yearly financial summaries' }
            ]
          },
          { name: 'Tax Documents', description: 'Tax-related exports and reports' },
          { name: 'Audits', description: 'Audit trails and compliance documents' }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error fetching folder templates:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        message: error.message || 'Unable to retrieve folder templates.',
        code: 'TEMPLATE_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}