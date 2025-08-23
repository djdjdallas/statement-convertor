/**
 * Statement Desk Google Workspace Add-on
 * Main Apps Script code
 */

// Configuration
const CONFIG = {
  baseUrl: 'https://your-domain.com', // Replace with your actual domain
  apiEndpoints: {
    auth: '/api/google/addon/auth',
    process: '/api/google/addon/process',
    export: '/api/google/addon/export',
    status: '/api/google/addon/status'
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: ['application/pdf']
};

/**
 * Homepage handler for the add-on
 */
function onHomepage(e) {
  return buildHomepage();
}

/**
 * Drive-specific homepage handler
 */
function onDriveHomepage(e) {
  return buildHomepage();
}

/**
 * Handler for when items are selected in Drive
 */
function onDriveItemsSelected(e) {
  const items = e.drive.selectedItems || [];
  
  if (items.length === 0) {
    return buildCard('No Files Selected', 'Please select PDF bank statements to process.');
  }
  
  // Filter for PDF files
  const pdfFiles = items.filter(item => 
    item.mimeType === 'application/pdf' && 
    item.title.toLowerCase().includes('.pdf')
  );
  
  if (pdfFiles.length === 0) {
    return buildCard('No PDF Files', 'Please select PDF bank statement files.');
  }
  
  return buildFileSelectionCard(pdfFiles);
}

/**
 * Build the main homepage card
 */
function buildHomepage() {
  const userEmail = Session.getActiveUser().getEmail();
  const isAuthenticated = checkAuthentication();
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Statement Desk')
      .setSubtitle('Convert bank statements to Excel/CSV')
      .setImageUrl('https://your-domain.com/logo.png')
      .setImageStyle(CardService.ImageStyle.SQUARE))
    .addSection(buildWelcomeSection(userEmail, isAuthenticated));
  
  if (!isAuthenticated) {
    card.addSection(buildAuthSection());
  } else {
    card.addSection(buildInstructionsSection());
  }
  
  return card.build();
}

/**
 * Build welcome section
 */
function buildWelcomeSection(userEmail, isAuthenticated) {
  const section = CardService.newCardSection()
    .setHeader('Welcome to Statement Desk');
  
  section.addWidget(CardService.newTextParagraph()
    .setText(`Logged in as: ${userEmail}`));
  
  section.addWidget(CardService.newTextParagraph()
    .setText(`Status: ${isAuthenticated ? '✅ Connected' : '❌ Not connected'}`));
  
  return section;
}

/**
 * Build authentication section
 */
function buildAuthSection() {
  const section = CardService.newCardSection()
    .setHeader('Connect Your Account');
  
  section.addWidget(CardService.newTextParagraph()
    .setText('Connect your Statement Desk account to start processing bank statements.'));
  
  const authButton = CardService.newTextButton()
    .setText('Connect Statement Desk')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleAuthentication'));
  
  section.addWidget(CardService.newButtonSet()
    .addButton(authButton));
  
  return section;
}

/**
 * Build instructions section
 */
function buildInstructionsSection() {
  const section = CardService.newCardSection()
    .setHeader('How to Use');
  
  section.addWidget(CardService.newTextParagraph()
    .setText('1. Select PDF bank statements in Google Drive\n' +
             '2. Click "Process Selected Files"\n' +
             '3. Choose export format (Excel or CSV)\n' +
             '4. Files will be saved back to your Drive'));
  
  const refreshButton = CardService.newTextButton()
    .setText('Refresh')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('onHomepage'));
  
  section.addWidget(CardService.newButtonSet()
    .addButton(refreshButton));
  
  return section;
}

/**
 * Build file selection card
 */
function buildFileSelectionCard(files) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Process Bank Statements')
      .setSubtitle(`${files.length} PDF file(s) selected`));
  
  // Files section
  const filesSection = CardService.newCardSection()
    .setHeader('Selected Files');
  
  files.forEach((file, index) => {
    if (index < 5) { // Show max 5 files
      filesSection.addWidget(CardService.newTextParagraph()
        .setText(`📄 ${file.title}`));
    }
  });
  
  if (files.length > 5) {
    filesSection.addWidget(CardService.newTextParagraph()
      .setText(`... and ${files.length - 5} more files`));
  }
  
  card.addSection(filesSection);
  
  // Options section
  const optionsSection = CardService.newCardSection()
    .setHeader('Export Options');
  
  const formatGroup = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setFieldName('exportFormat')
    .addItem('Excel (.xlsx)', 'excel', true)
    .addItem('CSV (.csv)', 'csv', false);
  
  optionsSection.addWidget(CardService.newTextParagraph()
    .setText('Select export format:'));
  optionsSection.addWidget(formatGroup);
  
  // Action buttons
  const processButton = CardService.newTextButton()
    .setText('Process Files')
    .setBackgroundColor('#4CAF50')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('processSelectedFiles')
      .setParameters({
        'fileIds': files.map(f => f.id).join(',')
      }));
  
  const cancelButton = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('onHomepage'));
  
  optionsSection.addWidget(CardService.newButtonSet()
    .addButton(processButton)
    .addButton(cancelButton));
  
  card.addSection(optionsSection);
  
  return card.build();
}

/**
 * Build simple card with title and message
 */
function buildCard(title, message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(title))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(message)))
    .build();
}

/**
 * Handle authentication flow
 */
function handleAuthentication(e) {
  const userEmail = Session.getActiveUser().getEmail();
  const authToken = Utilities.getUuid(); // Generate temporary auth token
  
  // Store auth token temporarily
  PropertiesService.getUserProperties().setProperty('authToken', authToken);
  
  // Build auth URL
  const authUrl = `${CONFIG.baseUrl}/auth/google-addon?` + 
    `email=${encodeURIComponent(userEmail)}&` +
    `token=${encodeURIComponent(authToken)}`;
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(authUrl)
      .setOpenAs(CardService.OpenAs.OVERLAY)
      .setOnClose(CardService.OnClose.RELOAD))
    .build();
}

/**
 * Process selected files
 */
function processSelectedFiles(e) {
  const fileIds = e.parameters.fileIds.split(',');
  const exportFormat = e.formInput.exportFormat || 'excel';
  
  if (!checkAuthentication()) {
    return buildCard('Not Authenticated', 'Please connect your Statement Desk account first.');
  }
  
  // Create processing status card
  const statusCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Processing Files')
      .setSubtitle('Please wait...'));
  
  const statusSection = CardService.newCardSection();
  statusSection.addWidget(CardService.newTextParagraph()
    .setText('🔄 Processing bank statements...'));
  
  // Start processing
  try {
    const results = processFiles(fileIds, exportFormat);
    return buildResultsCard(results);
  } catch (error) {
    return buildCard('Processing Error', `Failed to process files: ${error.message}`);
  }
}

/**
 * Process files through Statement Desk API
 */
function processFiles(fileIds, exportFormat) {
  const results = [];
  const authToken = getStoredAuthToken();
  
  fileIds.forEach(fileId => {
    try {
      // Get file metadata
      const file = Drive.Files.get(fileId);
      
      // Check file size
      if (file.fileSize > CONFIG.maxFileSize) {
        results.push({
          fileName: file.title,
          status: 'error',
          message: 'File too large (max 10MB)'
        });
        return;
      }
      
      // Get file content
      const blob = DriveApp.getFileById(fileId).getBlob();
      
      // Send to Statement Desk API
      const response = UrlFetchApp.fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoints.process}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({
          fileName: file.title,
          fileContent: Utilities.base64Encode(blob.getBytes()),
          mimeType: file.mimeType,
          exportFormat: exportFormat
        }),
        muteHttpExceptions: true
      });
      
      const result = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        // Save processed file back to Drive
        const processedBlob = Utilities.newBlob(
          Utilities.base64Decode(result.fileContent),
          result.mimeType,
          result.fileName
        );
        
        const newFile = DriveApp.createFile(processedBlob);
        
        // Move to same folder as original
        const originalFile = DriveApp.getFileById(fileId);
        const parents = originalFile.getParents();
        if (parents.hasNext()) {
          const folder = parents.next();
          folder.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
        }
        
        results.push({
          fileName: file.title,
          status: 'success',
          message: 'Processed successfully',
          newFileId: newFile.getId(),
          newFileName: newFile.getName()
        });
      } else {
        results.push({
          fileName: file.title,
          status: 'error',
          message: result.error || 'Processing failed'
        });
      }
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
 * Build results card
 */
function buildResultsCard(results) {
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Processing Complete')
      .setSubtitle(`✅ ${successCount} succeeded, ❌ ${errorCount} failed`));
  
  // Results section
  const resultsSection = CardService.newCardSection()
    .setHeader('Results');
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    let text = `${icon} ${result.fileName}`;
    
    if (result.status === 'success' && result.newFileName) {
      text += `\n   → ${result.newFileName}`;
    } else if (result.message) {
      text += `\n   → ${result.message}`;
    }
    
    resultsSection.addWidget(CardService.newTextParagraph().setText(text));
  });
  
  card.addSection(resultsSection);
  
  // Action buttons
  const actionsSection = CardService.newCardSection();
  
  const doneButton = CardService.newTextButton()
    .setText('Done')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('onHomepage'));
  
  actionsSection.addWidget(CardService.newButtonSet()
    .addButton(doneButton));
  
  card.addSection(actionsSection);
  
  return card.build();
}

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
  const authToken = getStoredAuthToken();
  if (!authToken) return false;
  
  try {
    const response = UrlFetchApp.fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoints.auth}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      muteHttpExceptions: true
    });
    
    return response.getResponseCode() === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Get stored auth token
 */
function getStoredAuthToken() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty('statementDeskToken');
}

/**
 * Store auth token from callback
 */
function storeAuthToken(token) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('statementDeskToken', token);
}

/**
 * Show help information
 */
function showHelp() {
  return buildCard(
    'Statement Desk Help',
    'Statement Desk converts PDF bank statements to Excel or CSV format.\n\n' +
    'How to use:\n' +
    '1. Connect your Statement Desk account\n' +
    '2. Select PDF files in Google Drive\n' +
    '3. Choose export format\n' +
    '4. Process files\n\n' +
    'For support, visit: https://your-domain.com/support'
  );
}