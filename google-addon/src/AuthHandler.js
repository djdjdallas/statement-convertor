/**
 * Authentication handler for Statement Desk Add-on
 * Manages OAuth flow and token storage
 */

/**
 * Handle OAuth callback from Statement Desk
 * This function is called after user authenticates on Statement Desk website
 * @param {Object} request Request object with auth code
 * @return {HtmlOutput} Success or error page
 */
function doGet(request) {
  const code = request.parameter.code;
  const state = request.parameter.state;
  const error = request.parameter.error;
  
  if (error) {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Failed</h1>
          <p>${error}</p>
          <button onclick="google.script.host.close()">Close</button>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Request</title>
        </head>
        <body>
          <h1>Invalid Request</h1>
          <p>Missing authentication code.</p>
        </body>
      </html>
    `);
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY
      },
      payload: JSON.stringify({
        code: code,
        grantType: 'authorization_code',
        clientId: 'google-addon-drive'
      })
    });
    
    if (tokenResponse.getResponseCode() !== 200) {
      throw new Error('Failed to exchange code for token');
    }
    
    const tokenData = JSON.parse(tokenResponse.getContentText());
    
    // Store tokens securely
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('STATEMENT_DESK_AUTH_TOKEN', tokenData.accessToken);
    userProperties.setProperty('STATEMENT_DESK_REFRESH_TOKEN', tokenData.refreshToken);
    userProperties.setProperty('STATEMENT_DESK_TOKEN_EXPIRY', 
      new Date(Date.now() + tokenData.expiresIn * 1000).toISOString());
    
    // Get user info
    const userResponse = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'X-API-Key': CONFIG.API_KEY
      }
    });
    
    const userData = JSON.parse(userResponse.getContentText());
    userProperties.setProperty('STATEMENT_DESK_USER_EMAIL', userData.email);
    userProperties.setProperty('STATEMENT_DESK_USER_NAME', userData.name || '');
    
    // Return success page
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              text-align: center;
              background-color: #f3f4f6;
            }
            .success { 
              color: #10b981; 
              margin-bottom: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 400px;
              margin: 0 auto;
            }
            button {
              background-color: #4F46E5;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background-color: #4338CA;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Authentication Successful</h1>
            <p>Welcome, ${userData.email}!</p>
            <p>You can now use Statement Desk to process your bank statements.</p>
            <button onclick="google.script.host.close()">Close and Continue</button>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Authentication error:', error);
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Error</h1>
          <p>${error.message}</p>
          <button onclick="google.script.host.close()">Close</button>
        </body>
      </html>
    `);
  }
}

/**
 * Refresh access token if expired
 * @return {string} Valid access token
 */
function getValidAccessToken() {
  const userProperties = PropertiesService.getUserProperties();
  const accessToken = userProperties.getProperty('STATEMENT_DESK_AUTH_TOKEN');
  const refreshToken = userProperties.getProperty('STATEMENT_DESK_REFRESH_TOKEN');
  const tokenExpiry = userProperties.getProperty('STATEMENT_DESK_TOKEN_EXPIRY');
  
  if (!accessToken || !refreshToken) {
    throw new Error('Not authenticated');
  }
  
  // Check if token is expired
  const expiryDate = new Date(tokenExpiry);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  if (expiryDate.getTime() - now.getTime() > bufferTime) {
    // Token is still valid
    return accessToken;
  }
  
  // Refresh the token
  try {
    const response = UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEY
      },
      payload: JSON.stringify({
        refreshToken: refreshToken,
        clientId: 'google-addon-drive'
      })
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Failed to refresh token');
    }
    
    const tokenData = JSON.parse(response.getContentText());
    
    // Update stored tokens
    userProperties.setProperty('STATEMENT_DESK_AUTH_TOKEN', tokenData.accessToken);
    userProperties.setProperty('STATEMENT_DESK_TOKEN_EXPIRY', 
      new Date(Date.now() + tokenData.expiresIn * 1000).toISOString());
    
    if (tokenData.refreshToken) {
      userProperties.setProperty('STATEMENT_DESK_REFRESH_TOKEN', tokenData.refreshToken);
    }
    
    return tokenData.accessToken;
    
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid tokens
    userProperties.deleteProperty('STATEMENT_DESK_AUTH_TOKEN');
    userProperties.deleteProperty('STATEMENT_DESK_REFRESH_TOKEN');
    userProperties.deleteProperty('STATEMENT_DESK_TOKEN_EXPIRY');
    throw new Error('Authentication expired. Please reconnect your account.');
  }
}

/**
 * Sign out user and clear stored credentials
 * @return {ActionResponse}
 */
function signOut() {
  const userProperties = PropertiesService.getUserProperties();
  
  // Get current token for API signout
  const authToken = userProperties.getProperty('STATEMENT_DESK_AUTH_TOKEN');
  
  if (authToken) {
    try {
      // Notify API about signout
      UrlFetchApp.fetch(`${CONFIG.API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': CONFIG.API_KEY
        }
      });
    } catch (error) {
      console.error('API signout failed:', error);
    }
  }
  
  // Clear all stored properties
  userProperties.deleteProperty('STATEMENT_DESK_AUTH_TOKEN');
  userProperties.deleteProperty('STATEMENT_DESK_REFRESH_TOKEN');
  userProperties.deleteProperty('STATEMENT_DESK_TOKEN_EXPIRY');
  userProperties.deleteProperty('STATEMENT_DESK_USER_EMAIL');
  userProperties.deleteProperty('STATEMENT_DESK_USER_NAME');
  
  // Return to welcome card
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation()
      .popToRoot()
      .updateCard(buildWelcomeCard()))
    .setNotification(CardService.newNotification()
      .setText('Signed out successfully'))
    .build();
}

/**
 * Get current user info
 * @return {Object} User information
 */
function getCurrentUser() {
  const userProperties = PropertiesService.getUserProperties();
  
  return {
    email: userProperties.getProperty('STATEMENT_DESK_USER_EMAIL') || '',
    name: userProperties.getProperty('STATEMENT_DESK_USER_NAME') || '',
    isAuthenticated: checkAuthentication()
  };
}