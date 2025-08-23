/**
 * Statement Desk Google Drive Add-on
 * Main entry point and core functionality
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://statementdesk.com/api',
  API_KEY: PropertiesService.getScriptProperties().getProperty('STATEMENT_DESK_API_KEY'),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_MIME_TYPE: 'application/pdf'
};

/**
 * Homepage trigger for the add-on
 * @param {Object} e Event object
 * @return {Card} Homepage card
 */
function onHomepage(e) {
  return buildWelcomeCard();
}

/**
 * Drive homepage trigger
 * @param {Object} e Event object
 * @return {Card} Drive homepage card
 */
function onDriveHomepage(e) {
  return buildWelcomeCard();
}

/**
 * Trigger when items are selected in Drive
 * @param {Object} e Event object with Drive items
 * @return {Card} Card for selected items
 */
function onDriveItemsSelected(e) {
  const items = e.drive.selectedItems || [];
  
  if (items.length === 0) {
    return buildNoSelectionCard();
  }
  
  // Filter for PDF files
  const pdfFiles = items.filter(item => item.mimeType === CONFIG.SUPPORTED_MIME_TYPE);
  
  if (pdfFiles.length === 0) {
    return buildNoPdfCard(items.length);
  }
  
  if (pdfFiles.length === 1) {
    return buildSingleFileCard(pdfFiles[0]);
  }
  
  return buildMultipleFilesCard(pdfFiles);
}

/**
 * Build welcome card for homepage
 * @return {Card}
 */
function buildWelcomeCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Statement Desk')
      .setSubtitle('AI-Powered Bank Statement Analysis')
      .setImageUrl('https://statementdesk.com/logo.png')
      .setImageStyle(CardService.ImageStyle.SQUARE))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('Welcome to Statement Desk! Select PDF bank statements in your Drive to:'))
      .addWidget(CardService.newTextParagraph()
        .setText('• Convert to Excel/CSV format\n• Get AI-powered insights\n• Analyze spending patterns\n• Detect anomalies'))
      .addWidget(CardService.newDivider())
      .addWidget(CardService.newTextButton()
        .setText('Visit Statement Desk')
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://statementdesk.com')
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
          .setOnClose(CardService.OnClose.NOTHING))));
  
  return card.build();
}

/**
 * Build card when no files are selected
 * @return {Card}
 */
function buildNoSelectionCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('No Files Selected')
      .setImageUrl('https://statementdesk.com/logo.png'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('Please select one or more PDF bank statements to process.')));
  
  return card.build();
}

/**
 * Build card when selected files are not PDFs
 * @param {number} count Number of files selected
 * @return {Card}
 */
function buildNoPdfCard(count) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('No PDF Files Selected')
      .setImageUrl('https://statementdesk.com/logo.png'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText(`You selected ${count} file(s), but none are PDFs. Statement Desk can only process PDF bank statements.`)));
  
  return card.build();
}

/**
 * Build card for single PDF file
 * @param {Object} file Drive file object
 * @return {Card}
 */
function buildSingleFileCard(file) {
  const fileSize = formatFileSize(file.size);
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle(file.title)
      .setSubtitle(`PDF • ${fileSize}`)
      .setImageUrl(file.iconUrl || 'https://statementdesk.com/pdf-icon.png'));
  
  // Check if user is authenticated
  const isAuthenticated = checkAuthentication();
  
  if (!isAuthenticated) {
    card.addSection(buildAuthenticationSection());
  } else {
    card.addSection(buildProcessingSection(file));
  }
  
  return card.build();
}

/**
 * Build card for multiple PDF files
 * @param {Array} files Array of Drive file objects
 * @return {Card}
 */
function buildMultipleFilesCard(files) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle(`${files.length} PDF Files Selected`)
      .setSubtitle('Process multiple statements')
      .setImageUrl('https://statementdesk.com/logo.png'));
  
  const isAuthenticated = checkAuthentication();
  
  if (!isAuthenticated) {
    card.addSection(buildAuthenticationSection());
  } else {
    // List files section
    const filesSection = CardService.newCardSection()
      .setHeader('Selected Files');
    
    files.slice(0, 5).forEach(file => {
      filesSection.addWidget(CardService.newDecoratedText()
        .setText(file.title)
        .setBottomLabel(formatFileSize(file.size))
        .setIconUrl(file.iconUrl || 'https://statementdesk.com/pdf-icon.png'));
    });
    
    if (files.length > 5) {
      filesSection.addWidget(CardService.newTextParagraph()
        .setText(`... and ${files.length - 5} more files`));
    }
    
    card.addSection(filesSection);
    
    // Batch processing section
    const actionSection = CardService.newCardSection()
      .addWidget(CardService.newTextButton()
        .setText(`Process All ${files.length} Files`)
        .setBackgroundColor('#4F46E5')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('processBatchFiles')
          .setParameters({
            'fileIds': files.map(f => f.id).join(',')
          })));
    
    card.addSection(actionSection);
  }
  
  return card.build();
}

/**
 * Build authentication section
 * @return {CardSection}
 */
function buildAuthenticationSection() {
  return CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText('Connect your Statement Desk account to process files.'))
    .addWidget(CardService.newTextButton()
      .setText('Connect Account')
      .setBackgroundColor('#4F46E5')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('authenticateUser')));
}

/**
 * Build processing section for authenticated users
 * @param {Object} file Drive file object
 * @return {CardSection}
 */
function buildProcessingSection(file) {
  const section = CardService.newCardSection();
  
  // Processing options
  section.addWidget(CardService.newTextParagraph()
    .setText('Processing Options:'));
  
  // AI Enhancement toggle
  section.addWidget(CardService.newSwitch()
    .setFieldName('aiEnhanced')
    .setSelected(true)
    .setControlType(CardService.SwitchControlType.CHECK_BOX)
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('updateProcessingOptions'))
    .setValue('true')
    .setTitle('AI Enhancement')
    .setSubtitle('Extract with AI for better accuracy'));
  
  // Export format selection
  section.addWidget(CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setFieldName('exportFormat')
    .setTitle('Export Format')
    .addItem('Excel (.xlsx)', 'xlsx', true)
    .addItem('CSV (.csv)', 'csv', false));
  
  // Process button
  section.addWidget(CardService.newTextButton()
    .setText('Process Statement')
    .setBackgroundColor('#4F46E5')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('processFile')
      .setParameters({
        'fileId': file.id,
        'fileName': file.title
      })));
  
  return section;
}

/**
 * Process a single file
 * @param {Object} e Event object
 * @return {ActionResponse}
 */
function processFile(e) {
  const fileId = e.parameters.fileId;
  const fileName = e.parameters.fileName;
  const aiEnhanced = e.formInput.aiEnhanced === 'true';
  const exportFormat = e.formInput.exportFormat || 'xlsx';
  
  // Show processing notification
  const notification = CardService.newNotification()
    .setText(`Processing ${fileName}...`);
  
  try {
    // Get file content
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    // Check file size
    if (blob.getBytes().length > CONFIG.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Upload to Statement Desk API
    const result = uploadAndProcess(blob, fileName, aiEnhanced, exportFormat);
    
    // Create result card
    const resultCard = buildResultCard(result, fileName);
    
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation()
        .pushCard(resultCard))
      .setNotification(CardService.newNotification()
        .setText('Processing complete!'))
      .build();
    
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText(`Error: ${error.message}`))
      .build();
  }
}

/**
 * Process multiple files in batch
 * @param {Object} e Event object
 * @return {ActionResponse}
 */
function processBatchFiles(e) {
  const fileIds = e.parameters.fileIds.split(',');
  
  // Show processing card
  const processingCard = buildBatchProcessingCard(fileIds.length);
  
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation()
      .pushCard(processingCard))
    .build();
}

/**
 * Build batch processing card
 * @param {number} count Number of files
 * @return {Card}
 */
function buildBatchProcessingCard(count) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Batch Processing')
      .setSubtitle(`Processing ${count} files...`));
  
  const section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText('Your files are being processed. This may take a few minutes.'))
    .addWidget(CardService.newTextParagraph()
      .setText('You will receive an email notification when processing is complete.'))
    .addWidget(CardService.newTextButton()
      .setText('View Dashboard')
      .setOpenLink(CardService.newOpenLink()
        .setUrl('https://statementdesk.com/dashboard')
        .setOpenAs(CardService.OpenAs.FULL_SIZE)));
  
  card.addSection(section);
  return card.build();
}

/**
 * Build result card after processing
 * @param {Object} result Processing result
 * @param {string} fileName Original file name
 * @return {Card}
 */
function buildResultCard(result, fileName) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Processing Complete')
      .setSubtitle(fileName)
      .setImageUrl('https://statementdesk.com/success-icon.png'));
  
  // Summary section
  const summarySection = CardService.newCardSection()
    .setHeader('Summary');
  
  if (result.summary) {
    summarySection.addWidget(CardService.newDecoratedText()
      .setText(`${result.summary.transactionCount} transactions`)
      .setBottomLabel('Total transactions found')
      .setIconUrl('https://statementdesk.com/transaction-icon.png'));
    
    summarySection.addWidget(CardService.newDecoratedText()
      .setText(`$${result.summary.totalAmount.toFixed(2)}`)
      .setBottomLabel('Total amount')
      .setIconUrl('https://statementdesk.com/money-icon.png'));
    
    if (result.summary.dateRange) {
      summarySection.addWidget(CardService.newDecoratedText()
        .setText(`${result.summary.dateRange.start} - ${result.summary.dateRange.end}`)
        .setBottomLabel('Date range')
        .setIconUrl('https://statementdesk.com/calendar-icon.png'));
    }
  }
  
  card.addSection(summarySection);
  
  // AI Insights section (if available)
  if (result.insights && result.insights.length > 0) {
    const insightsSection = CardService.newCardSection()
      .setHeader('AI Insights');
    
    result.insights.slice(0, 3).forEach(insight => {
      insightsSection.addWidget(CardService.newTextParagraph()
        .setText(`• ${insight}`));
    });
    
    card.addSection(insightsSection);
  }
  
  // Actions section
  const actionsSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setText('Download Result')
      .setOpenLink(CardService.newOpenLink()
        .setUrl(result.downloadUrl)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)))
    .addWidget(CardService.newTextButton()
      .setText('View in Dashboard')
      .setOpenLink(CardService.newOpenLink()
        .setUrl(result.dashboardUrl)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)));
  
  card.addSection(actionsSection);
  
  return card.build();
}

/**
 * Check if user is authenticated with Statement Desk
 * @return {boolean}
 */
function checkAuthentication() {
  const userProperties = PropertiesService.getUserProperties();
  const authToken = userProperties.getProperty('STATEMENT_DESK_AUTH_TOKEN');
  
  if (!authToken) {
    return false;
  }
  
  // Verify token with API
  try {
    const response = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-API-Key': CONFIG.API_KEY
      }
    });
    
    return response.getResponseCode() === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Authenticate user with Statement Desk
 * @param {Object} e Event object
 * @return {ActionResponse}
 */
function authenticateUser(e) {
  const userEmail = Session.getActiveUser().getEmail();
  
  // Generate auth URL
  const authUrl = `https://statementdesk.com/auth/google-addon?email=${encodeURIComponent(userEmail)}&addon=drive`;
  
  // Open authentication window
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(authUrl)
      .setOpenAs(CardService.OpenAs.OVERLAY)
      .setOnClose(CardService.OnClose.RELOAD))
    .build();
}

/**
 * Upload and process file with Statement Desk API
 * @param {Blob} blob File blob
 * @param {string} fileName File name
 * @param {boolean} aiEnhanced Use AI enhancement
 * @param {string} exportFormat Export format
 * @return {Object} Processing result
 */
function uploadAndProcess(blob, fileName, aiEnhanced, exportFormat) {
  const userProperties = PropertiesService.getUserProperties();
  const authToken = userProperties.getProperty('STATEMENT_DESK_AUTH_TOKEN');
  
  // Create form data
  const formData = {
    'file': blob,
    'fileName': fileName,
    'aiEnhanced': aiEnhanced.toString(),
    'exportFormat': exportFormat,
    'source': 'google-addon-drive'
  };
  
  // Upload file
  const uploadResponse = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': CONFIG.API_KEY
    },
    payload: formData
  });
  
  if (uploadResponse.getResponseCode() !== 200) {
    throw new Error('Upload failed');
  }
  
  const uploadResult = JSON.parse(uploadResponse.getContentText());
  const fileId = uploadResult.fileId;
  
  // Process file
  const processResponse = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/process-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': CONFIG.API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      fileId: fileId,
      aiEnhanced: aiEnhanced
    })
  });
  
  if (processResponse.getResponseCode() !== 200) {
    throw new Error('Processing failed');
  }
  
  const processResult = JSON.parse(processResponse.getContentText());
  
  // Export file
  const exportResponse = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-API-Key': CONFIG.API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      fileId: fileId,
      format: exportFormat
    })
  });
  
  if (exportResponse.getResponseCode() !== 200) {
    throw new Error('Export failed');
  }
  
  const exportResult = JSON.parse(exportResponse.getContentText());
  
  return {
    fileId: fileId,
    summary: processResult.summary,
    insights: processResult.insights,
    downloadUrl: exportResult.downloadUrl,
    dashboardUrl: `https://statementdesk.com/preview/${fileId}`
  };
}

/**
 * Format file size for display
 * @param {number} bytes File size in bytes
 * @return {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Update processing options
 * @param {Object} e Event object
 * @return {ActionResponse}
 */
function updateProcessingOptions(e) {
  // This function is called when options change
  // Could be used to show/hide additional options based on selections
  return CardService.newActionResponseBuilder()
    .setStateChanged(true)
    .build();
}