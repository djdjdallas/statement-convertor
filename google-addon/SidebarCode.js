/**
 * Sidebar-specific functions for Statement Desk Google Add-on
 */

/**
 * Show the sidebar
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Statement Desk')
    .setWidth(300);
  
  DriveApp.getUi().showSidebar(html);
}

/**
 * Load PDF files from user's Drive
 */
function loadPDFFiles() {
  try {
    const files = [];
    const query = "mimeType='application/pdf' and trashed=false";
    const filesIterator = DriveApp.searchFiles(query);
    
    let count = 0;
    while (filesIterator.hasNext() && count < 50) { // Limit to 50 files
      const file = filesIterator.next();
      files.push({
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        dateCreated: file.getDateCreated().toISOString(),
        lastUpdated: file.getLastUpdated().toISOString()
      });
      count++;
    }
    
    // Sort by last updated date (newest first)
    files.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    return files;
  } catch (error) {
    console.error('Error loading PDF files:', error);
    throw new Error('Failed to load PDF files from Drive');
  }
}

/**
 * Process files from sidebar
 */
function processFilesFromSidebar(fileIds, exportFormat) {
  const results = [];
  const totalFiles = fileIds.length;
  
  // Validate authentication
  if (!checkAuthentication()) {
    throw new Error('Not authenticated. Please connect your Statement Desk account.');
  }
  
  // Process each file
  fileIds.forEach((fileId, index) => {
    try {
      // Update progress (this won't show in real-time, but helps with debugging)
      const progress = Math.round(((index + 1) / totalFiles) * 100);
      console.log(`Processing file ${index + 1} of ${totalFiles} (${progress}%)`);
      
      // Get file
      const file = DriveApp.getFileById(fileId);
      
      // Check file size
      if (file.getSize() > CONFIG.maxFileSize) {
        results.push({
          fileName: file.getName(),
          status: 'error',
          message: 'File too large (max 10MB)'
        });
        return;
      }
      
      // Process file
      const result = processFile(file, exportFormat);
      results.push(result);
      
    } catch (error) {
      results.push({
        fileName: fileId,
        status: 'error',
        message: error.message
      });
    }
  });
  
  return results;
}

/**
 * Process a single file
 */
function processFile(file, exportFormat) {
  const authToken = getStoredAuthToken();
  
  try {
    // Get file content
    const blob = file.getBlob();
    
    // Prepare request payload
    const payload = {
      fileName: file.getName(),
      fileContent: Utilities.base64Encode(blob.getBytes()),
      mimeType: file.getMimeType(),
      exportFormat: exportFormat,
      fileSize: file.getSize()
    };
    
    // Send to Statement Desk API
    const response = UrlFetchApp.fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoints.process}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      // Create processed file
      const processedBlob = Utilities.newBlob(
        Utilities.base64Decode(responseData.fileContent),
        responseData.mimeType,
        responseData.fileName
      );
      
      const newFile = DriveApp.createFile(processedBlob);
      
      // Move to same folder as original file
      const parents = file.getParents();
      if (parents.hasNext()) {
        const folder = parents.next();
        folder.addFile(newFile);
        DriveApp.getRootFolder().removeFile(newFile);
      }
      
      // Create or update Statement Desk folder for organization
      const statementFolder = getOrCreateStatementFolder();
      statementFolder.addFile(newFile);
      
      return {
        fileName: file.getName(),
        status: 'success',
        message: 'Processed successfully',
        newFileId: newFile.getId(),
        newFileName: newFile.getName(),
        transactionCount: responseData.transactionCount || 0
      };
    } else {
      return {
        fileName: file.getName(),
        status: 'error',
        message: responseData.error || 'Processing failed'
      };
    }
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      fileName: file.getName(),
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Get or create Statement Desk folder
 */
function getOrCreateStatementFolder() {
  const folderName = 'Statement Desk Exports';
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Handle authentication callback
 */
function handleAuthCallback(token) {
  if (token) {
    storeAuthToken(token);
    return true;
  }
  return false;
}

/**
 * Clear stored authentication
 */
function clearAuthentication() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('statementDeskToken');
  return true;
}

/**
 * Get processing status
 */
function getProcessingStatus(processId) {
  const authToken = getStoredAuthToken();
  
  try {
    const response = UrlFetchApp.fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoints.status}/${processId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    
    return null;
  } catch (error) {
    console.error('Error getting processing status:', error);
    return null;
  }
}