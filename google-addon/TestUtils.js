/**
 * Test utilities for Statement Desk Google Add-on
 * These functions help with testing and debugging during development
 */

/**
 * Test authentication flow
 */
function testAuthentication() {
  console.log('Testing authentication...');
  
  const isAuth = checkAuthentication();
  console.log('Authentication status:', isAuth);
  
  if (!isAuth) {
    console.log('Not authenticated. Token:', getStoredAuthToken());
  } else {
    console.log('Successfully authenticated');
  }
}

/**
 * Test file loading from Drive
 */
function testLoadFiles() {
  console.log('Testing file loading...');
  
  try {
    const files = loadPDFFiles();
    console.log('Found files:', files.length);
    
    if (files.length > 0) {
      console.log('First file:', files[0]);
    }
  } catch (error) {
    console.error('Error loading files:', error);
  }
}

/**
 * Test API connectivity
 */
function testAPIConnection() {
  console.log('Testing API connection...');
  
  try {
    const response = UrlFetchApp.fetch(CONFIG.baseUrl + '/api/health', {
      muteHttpExceptions: true
    });
    
    console.log('API Response Code:', response.getResponseCode());
    console.log('API Response:', response.getContentText());
  } catch (error) {
    console.error('API connection error:', error);
  }
}

/**
 * Clear all stored properties (for testing)
 */
function clearAllProperties() {
  console.log('Clearing all user properties...');
  PropertiesService.getUserProperties().deleteAllProperties();
  console.log('Properties cleared');
}

/**
 * Show all stored properties
 */
function showAllProperties() {
  const props = PropertiesService.getUserProperties().getProperties();
  console.log('Stored properties:', props);
}

/**
 * Test file processing with a dummy file
 */
function testFileProcessing() {
  console.log('Testing file processing...');
  
  // Create a dummy PDF content
  const dummyContent = 'JVBERi0xLjQKJeLjz9MKCg=='; // Minimal PDF header in base64
  
  const payload = {
    fileName: 'test-statement.pdf',
    fileContent: dummyContent,
    mimeType: 'application/pdf',
    exportFormat: 'excel',
    fileSize: 1024
  };
  
  try {
    const authToken = getStoredAuthToken();
    const response = UrlFetchApp.fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoints.process}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    console.log('Processing response code:', response.getResponseCode());
    console.log('Processing response:', response.getContentText());
  } catch (error) {
    console.error('Processing error:', error);
  }
}

/**
 * Generate test card UI
 */
function testCardUI() {
  console.log('Testing card UI generation...');
  
  try {
    const card = buildHomepage();
    console.log('Homepage card generated successfully');
    
    // Test with selected files
    const testFiles = [
      { id: 'test1', title: 'statement1.pdf', mimeType: 'application/pdf' },
      { id: 'test2', title: 'statement2.pdf', mimeType: 'application/pdf' }
    ];
    
    const selectionCard = buildFileSelectionCard(testFiles);
    console.log('File selection card generated successfully');
  } catch (error) {
    console.error('Card UI error:', error);
  }
}

/**
 * Test sidebar HTML generation
 */
function testSidebarHTML() {
  console.log('Testing sidebar HTML...');
  
  try {
    const html = HtmlService.createHtmlOutputFromFile('Sidebar');
    console.log('Sidebar HTML created successfully');
    console.log('HTML length:', html.getContent().length);
  } catch (error) {
    console.error('Sidebar HTML error:', error);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('=== Running all tests ===');
  
  const tests = [
    { name: 'API Connection', fn: testAPIConnection },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'File Loading', fn: testLoadFiles },
    { name: 'Card UI', fn: testCardUI },
    { name: 'Sidebar HTML', fn: testSidebarHTML }
  ];
  
  tests.forEach(test => {
    console.log(`\n--- ${test.name} ---`);
    try {
      test.fn();
      console.log(`✓ ${test.name} passed`);
    } catch (error) {
      console.error(`✗ ${test.name} failed:`, error);
    }
  });
  
  console.log('\n=== Tests complete ===');
}

/**
 * Manual token setter for testing
 */
function setTestToken(token) {
  PropertiesService.getUserProperties().setProperty('statementDeskToken', token);
  console.log('Test token set');
}