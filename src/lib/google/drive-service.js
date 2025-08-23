import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';
import { 
  withGoogleErrorHandling, 
  GOOGLE_ERROR_CODES,
  createErrorResponse,
  isRecoverableError,
  parseGoogleError
} from './error-handler';

const STATEMENT_FOLDER_NAME = 'Statement Converter';
const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  EXCEL_OLD: 'application/vnd.ms-excel'
};

class GoogleDriveService {
  constructor(userId, isServerSide = false) {
    this.userId = userId;
    this.isServerSide = isServerSide;
    this.drive = null;
  }

  async initialize() {
    return withGoogleErrorHandling(async () => {
      const auth = await getAuthenticatedClient(this.userId, this.isServerSide);
      if (!auth) {
        const error = new Error('No Google authentication found');
        error.code = GOOGLE_ERROR_CODES.INVALID_CREDENTIALS;
        throw error;
      }
      this.drive = google.drive({ version: 'v3', auth });
      return this;
    }, {
      context: { userId: this.userId, operation: 'initializeDriveService' }
    });
  }

  /**
   * Get or create the Statement Converter folder
   */
  async getOrCreateFolder() {
    return withGoogleErrorHandling(async () => {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: `name='${STATEMENT_FOLDER_NAME}' and mimeType='${MIME_TYPES.FOLDER}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: STATEMENT_FOLDER_NAME,
        mimeType: MIME_TYPES.FOLDER
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    }, {
      context: { operation: 'getOrCreateFolder', folderName: STATEMENT_FOLDER_NAME }
    });
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(fileData, fileName, mimeType, folderId = null) {
    return withGoogleErrorHandling(async () => {
      // Check for duplicate file names in the target folder
      if (folderId) {
        const existingFiles = await this.drive.files.list({
          q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
          fields: 'files(id, name)'
        });

        if (existingFiles.data.files && existingFiles.data.files.length > 0) {
          // Generate unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const nameParts = fileName.split('.');
          const extension = nameParts.pop();
          const baseName = nameParts.join('.');
          fileName = `${baseName}_${timestamp}.${extension}`;
        }
      }

      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : []
      };

      const media = {
        mimeType: mimeType,
        body: fileData
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink, size, createdTime'
      });

      // Make the file shareable
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        size: response.data.size,
        createdTime: response.data.createdTime
      };
    }, {
      context: { operation: 'uploadFile', fileName, mimeType }
    });
  }

  /**
   * Upload converted statement file with organized naming
   */
  async uploadStatementFile(fileBuffer, originalFileName, format, metadata = {}) {
    return withGoogleErrorHandling(async () => {
      // Check storage quota before uploading
      const quota = await this.checkStorageQuota();
      if (quota.available < fileBuffer.length) {
        const error = new Error(`Insufficient Google Drive storage. Need ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB but only ${(quota.available / 1024 / 1024).toFixed(2)}MB available.`);
        error.code = GOOGLE_ERROR_CODES.STORAGE_FULL;
        throw error;
      }

      const folderId = await this.getOrCreateFolder();
      
      // Generate organized filename
      const date = new Date().toISOString().split('T')[0];
      const bankName = metadata.bankName || 'Statement';
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      const fileName = `${bankName}_${date}_converted.${extension}`;
      
      const mimeType = format === 'csv' ? MIME_TYPES.CSV : MIME_TYPES.EXCEL;
      
      return await this.uploadFile(fileBuffer, fileName, mimeType, folderId);
    }, {
      context: { operation: 'uploadStatementFile', format, metadata }
    });
  }

  /**
   * List files in the Statement Converter folder
   */
  async listStatementFiles(pageSize = 20, pageToken = null) {
    try {
      const folderId = await this.getOrCreateFolder();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
        pageSize,
        pageToken,
        orderBy: 'createdTime desc'
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  /**
   * Rename a file in Google Drive
   */
  async renameFile(fileId, newName) {
    try {
      const response = await this.drive.files.update({
        fileId: fileId,
        resource: {
          name: newName
        },
        fields: 'id, name'
      });

      return response.data;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw new Error('Failed to rename file in Google Drive');
    }
  }

  /**
   * Batch delete multiple files
   */
  async batchDeleteFiles(fileIds) {
    try {
      const results = await Promise.allSettled(
        fileIds.map(fileId => this.deleteFile(fileId))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        successful,
        failed,
        total: fileIds.length
      };
    } catch (error) {
      console.error('Error in batch delete:', error);
      throw new Error('Failed to delete files in batch');
    }
  }

  /**
   * Check if user has sufficient Drive storage
   */
  async checkStorageQuota() {
    return withGoogleErrorHandling(async () => {
      const about = await this.drive.about.get({
        fields: 'storageQuota'
      });

      const quota = about.data.storageQuota;
      const limit = parseInt(quota.limit || 0);
      const usage = parseInt(quota.usage || 0);
      const available = limit - usage;
      
      // If no limit (unlimited storage), set a reasonable default
      const effectiveLimit = limit || 15 * 1024 * 1024 * 1024; // 15GB default
      
      return {
        limit: effectiveLimit,
        usage: usage,
        available: limit ? available : effectiveLimit - usage,
        percentUsed: limit ? ((usage / limit) * 100).toFixed(2) : ((usage / effectiveLimit) * 100).toFixed(2),
        unlimited: !limit
      };
    }, {
      context: { operation: 'checkStorageQuota' },
      throwOnError: false // Don't throw, return default values on error
    }) || {
      // Default values if error occurs
      limit: 15 * 1024 * 1024 * 1024, // 15GB
      usage: 0,
      available: 15 * 1024 * 1024 * 1024,
      percentUsed: 0,
      unlimited: false,
      error: true
    };
  }
}

/**
 * Factory function to create and initialize a GoogleDriveService instance
 */
export async function createDriveService(userId, isServerSide = false) {
  const service = new GoogleDriveService(userId, isServerSide);
  await service.initialize();
  return service;
}

// Export class and utilities
export { GoogleDriveService, MIME_TYPES };