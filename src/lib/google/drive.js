import { google } from 'googleapis'
import { getAuthenticatedClient } from './auth'

const STATEMENT_CONVERTER_FOLDER = 'Statement Converter'

// Get or create the Statement Converter folder
export async function getOrCreateAppFolder(userId) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${STATEMENT_CONVERTER_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })
    
    if (response.data.files && response.data.files.length > 0) {
      // Folder exists
      return response.data.files[0].id
    }
    
    // Create folder
    const fileMetadata = {
      name: STATEMENT_CONVERTER_FOLDER,
      mimeType: 'application/vnd.google-apps.folder'
    }
    
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    })
    
    return folder.data.id
  } catch (error) {
    console.error('Error creating app folder:', error)
    throw new Error('Failed to create or access app folder in Google Drive')
  }
}

// Upload file to Google Drive
export async function uploadToDrive(userId, fileName, fileContent, mimeType) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    // Get or create app folder
    const folderId = await getOrCreateAppFolder(userId)
    
    // File metadata
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    }
    
    // Upload file
    const media = {
      mimeType: mimeType,
      body: fileContent
    }
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, name, mimeType, createdTime'
    })
    
    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      mimeType: response.data.mimeType,
      createdTime: response.data.createdTime
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    throw new Error('Failed to upload file to Google Drive')
  }
}

// List files from the Statement Converter folder
export async function listDriveFiles(userId, pageSize = 20, pageToken = null) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    const folderId = await getOrCreateAppFolder(userId)
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
      pageSize: pageSize,
      pageToken: pageToken,
      orderBy: 'modifiedTime desc'
    })
    
    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    }
  } catch (error) {
    console.error('Error listing Drive files:', error)
    throw new Error('Failed to list files from Google Drive')
  }
}

// Download file from Google Drive
export async function downloadFromDrive(userId, fileId) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    // Get file metadata
    const metadataResponse = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType'
    })
    
    // Download file content
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    })
    
    return {
      data: response.data,
      metadata: metadataResponse.data
    }
  } catch (error) {
    console.error('Error downloading from Drive:', error)
    throw new Error('Failed to download file from Google Drive')
  }
}

// Delete file from Google Drive
export async function deleteFromDrive(userId, fileId) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    await drive.files.delete({
      fileId: fileId
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting from Drive:', error)
    throw new Error('Failed to delete file from Google Drive')
  }
}

// Create shareable link for a file
export async function createShareableLink(userId, fileId) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    // Create permission for anyone with link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })
    
    // Get the web view link
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink'
    })
    
    return response.data.webViewLink
  } catch (error) {
    console.error('Error creating shareable link:', error)
    throw new Error('Failed to create shareable link')
  }
}