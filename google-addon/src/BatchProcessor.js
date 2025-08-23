/**
 * Batch processing functionality for multiple files
 * Handles queuing and processing of multiple bank statements
 */

/**
 * Process multiple files in batch with progress tracking
 * @param {Array<string>} fileIds Array of Drive file IDs
 * @param {Object} options Processing options
 * @return {Object} Batch processing result
 */
function processBatch(fileIds, options = {}) {
  const batchId = Utilities.getUuid();
  const startTime = new Date();
  const results = [];
  const errors = [];
  
  // Default options
  const processingOptions = {
    aiEnhanced: options.aiEnhanced !== false,
    exportFormat: options.exportFormat || 'xlsx',
    notifyEmail: options.notifyEmail || Session.getActiveUser().getEmail()
  };
  
  // Store batch info
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(`batch_${batchId}`, JSON.stringify({
    id: batchId,
    fileIds: fileIds,
    startTime: startTime.toISOString(),
    status: 'processing',
    totalFiles: fileIds.length,
    processedFiles: 0,
    options: processingOptions
  }));
  
  // Process files sequentially to avoid rate limits
  fileIds.forEach((fileId, index) => {
    try {
      // Update batch progress
      updateBatchProgress(batchId, index + 1, fileIds.length);
      
      // Get file info
      const file = DriveApp.getFileById(fileId);
      const fileName = file.getName();
      const blob = file.getBlob();
      
      // Process file
      const result = uploadAndProcess(blob, fileName, 
        processingOptions.aiEnhanced, 
        processingOptions.exportFormat);
      
      results.push({
        fileId: fileId,
        fileName: fileName,
        status: 'success',
        result: result
      });
      
      // Add small delay between files to avoid rate limits
      Utilities.sleep(1000);
      
    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error);
      errors.push({
        fileId: fileId,
        fileName: getFileNameSafely(fileId),
        status: 'error',
        error: error.message
      });
    }
  });
  
  // Update final batch status
  const endTime = new Date();
  const batchResult = {
    id: batchId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: (endTime - startTime) / 1000, // seconds
    totalFiles: fileIds.length,
    successCount: results.length,
    errorCount: errors.length,
    results: results,
    errors: errors
  };
  
  scriptProperties.setProperty(`batch_${batchId}`, JSON.stringify({
    ...batchResult,
    status: 'completed'
  }));
  
  // Send notification email
  if (processingOptions.notifyEmail) {
    sendBatchCompletionEmail(batchResult, processingOptions.notifyEmail);
  }
  
  return batchResult;
}

/**
 * Update batch processing progress
 * @param {string} batchId Batch ID
 * @param {number} processed Number of files processed
 * @param {number} total Total number of files
 */
function updateBatchProgress(batchId, processed, total) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const batchData = JSON.parse(scriptProperties.getProperty(`batch_${batchId}`) || '{}');
  
  batchData.processedFiles = processed;
  batchData.progress = Math.round((processed / total) * 100);
  batchData.lastUpdate = new Date().toISOString();
  
  scriptProperties.setProperty(`batch_${batchId}`, JSON.stringify(batchData));
}

/**
 * Get batch processing status
 * @param {string} batchId Batch ID
 * @return {Object} Batch status
 */
function getBatchStatus(batchId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const batchData = scriptProperties.getProperty(`batch_${batchId}`);
  
  if (!batchData) {
    return null;
  }
  
  return JSON.parse(batchData);
}

/**
 * Send email notification when batch processing completes
 * @param {Object} batchResult Batch processing result
 * @param {string} email Recipient email address
 */
function sendBatchCompletionEmail(batchResult, email) {
  const subject = `Statement Desk: Batch Processing Complete - ${batchResult.successCount}/${batchResult.totalFiles} Successful`;
  
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Statement Desk</h1>
        <p style="margin: 10px 0 0 0;">Batch Processing Complete</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>Processing Summary</h2>
        <table style="width: 100%; background-color: white; border-radius: 8px; padding: 15px;">
          <tr>
            <td><strong>Total Files:</strong></td>
            <td>${batchResult.totalFiles}</td>
          </tr>
          <tr>
            <td><strong>Successful:</strong></td>
            <td style="color: #10b981;">${batchResult.successCount}</td>
          </tr>
          <tr>
            <td><strong>Failed:</strong></td>
            <td style="color: ${batchResult.errorCount > 0 ? '#ef4444' : '#6b7280'};">${batchResult.errorCount}</td>
          </tr>
          <tr>
            <td><strong>Processing Time:</strong></td>
            <td>${formatDuration(batchResult.duration)}</td>
          </tr>
        </table>
      </div>
  `;
  
  // Add successful files section
  if (batchResult.results.length > 0) {
    htmlBody += `
      <div style="padding: 20px; background-color: #f9fafb;">
        <h3>Successfully Processed Files</h3>
        <ul style="list-style: none; padding: 0;">
    `;
    
    batchResult.results.forEach(result => {
      htmlBody += `
        <li style="background-color: white; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <strong>${result.fileName}</strong><br>
          <a href="${result.result.dashboardUrl}" style="color: #4F46E5;">View in Dashboard</a> |
          <a href="${result.result.downloadUrl}" style="color: #4F46E5;">Download</a>
        </li>
      `;
    });
    
    htmlBody += `</ul></div>`;
  }
  
  // Add error section if any
  if (batchResult.errors.length > 0) {
    htmlBody += `
      <div style="padding: 20px; background-color: #fef2f2;">
        <h3 style="color: #dc2626;">Failed Files</h3>
        <ul style="list-style: none; padding: 0;">
    `;
    
    batchResult.errors.forEach(error => {
      htmlBody += `
        <li style="background-color: white; padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #ef4444;">
          <strong>${error.fileName}</strong><br>
          <span style="color: #6b7280;">${error.error}</span>
        </li>
      `;
    });
    
    htmlBody += `</ul></div>`;
  }
  
  // Add footer
  htmlBody += `
    <div style="padding: 20px; text-align: center; color: #6b7280;">
      <p>
        <a href="https://statementdesk.com/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View All Files in Dashboard
        </a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">
        This email was sent from Statement Desk Google Drive Add-on<br>
        Batch ID: ${batchResult.id}
      </p>
    </div>
    </div>
  `;
  
  try {
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: 'Statement Desk'
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds Duration in seconds
 * @return {string} Formatted duration
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get file name safely without throwing errors
 * @param {string} fileId File ID
 * @return {string} File name or 'Unknown File'
 */
function getFileNameSafely(fileId) {
  try {
    return DriveApp.getFileById(fileId).getName();
  } catch (error) {
    return 'Unknown File';
  }
}

/**
 * Clean up old batch processing records
 * Removes records older than 7 days
 */
function cleanupOldBatchRecords() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProperties = scriptProperties.getProperties();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  Object.keys(allProperties).forEach(key => {
    if (key.startsWith('batch_')) {
      try {
        const batchData = JSON.parse(allProperties[key]);
        const startTime = new Date(batchData.startTime);
        
        if (startTime < sevenDaysAgo) {
          scriptProperties.deleteProperty(key);
        }
      } catch (error) {
        // Invalid data, remove it
        scriptProperties.deleteProperty(key);
      }
    }
  });
}