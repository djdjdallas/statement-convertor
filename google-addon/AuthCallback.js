/**
 * Handle authentication callback from Statement Desk
 * This file handles the message passing between the auth window and the add-on
 */

/**
 * Set up message listener for auth callback
 */
function setupAuthListener() {
  // This function will be called from the sidebar to set up the listener
  return `
    <script>
      window.addEventListener('message', function(event) {
        // Verify the message is from Statement Desk
        if (event.data && event.data.type === 'statementDesk.authComplete') {
          // Store the token
          google.script.run
            .withSuccessHandler(function(result) {
              if (result) {
                // Refresh the UI
                checkAuthentication();
                showStatus('Authentication successful!', 'success');
              }
            })
            .withFailureHandler(function(error) {
              showStatus('Failed to store authentication token', 'error');
            })
            .handleAuthCallback(event.data.token);
        }
      });
    </script>
  `;
}

/**
 * Complete OAuth flow with Google Add-on
 */
function completeOAuthFlow() {
  const userEmail = Session.getActiveUser().getEmail();
  const scriptId = ScriptApp.getScriptId();
  
  // Generate state token for security
  const stateToken = Utilities.getUuid();
  PropertiesService.getUserProperties().setProperty('oauth_state', stateToken);
  
  // Build OAuth URL
  const params = {
    client_id: CONFIG.googleClientId,
    redirect_uri: `https://script.google.com/macros/d/${scriptId}/usercallback`,
    response_type: 'code',
    scope: 'email profile',
    state: stateToken,
    access_type: 'offline',
    prompt: 'consent',
    login_hint: userEmail
  };
  
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
    Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  
  return authUrl;
}

/**
 * Handle OAuth callback
 */
function authCallback(request) {
  const code = request.parameter.code;
  const state = request.parameter.state;
  const error = request.parameter.error;
  
  if (error) {
    return HtmlService.createHtmlOutput('Authentication failed: ' + error);
  }
  
  // Verify state token
  const savedState = PropertiesService.getUserProperties().getProperty('oauth_state');
  if (state !== savedState) {
    return HtmlService.createHtmlOutput('Invalid state token');
  }
  
  try {
    // Exchange code for tokens
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        code: code,
        client_id: CONFIG.googleClientId,
        client_secret: CONFIG.googleClientSecret,
        redirect_uri: `https://script.google.com/macros/d/${ScriptApp.getScriptId()}/usercallback`,
        grant_type: 'authorization_code'
      }
    });
    
    const tokens = JSON.parse(response.getContentText());
    
    // Store tokens
    PropertiesService.getUserProperties().setProperties({
      'access_token': tokens.access_token,
      'refresh_token': tokens.refresh_token,
      'token_expiry': String(Date.now() + (tokens.expires_in * 1000))
    });
    
    // Create success page
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
            }
            .success {
              color: #4CAF50;
              font-size: 24px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success">✓ Authentication Successful!</div>
          <p>You can close this window and return to the add-on.</p>
          <script>
            setTimeout(function() {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    return HtmlService.createHtmlOutput('Authentication error: ' + error.toString());
  }
}

/**
 * Refresh access token if needed
 */
function refreshAccessToken() {
  const refreshToken = PropertiesService.getUserProperties().getProperty('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        refresh_token: refreshToken,
        client_id: CONFIG.googleClientId,
        client_secret: CONFIG.googleClientSecret,
        grant_type: 'refresh_token'
      }
    });
    
    const tokens = JSON.parse(response.getContentText());
    
    // Update stored tokens
    PropertiesService.getUserProperties().setProperties({
      'access_token': tokens.access_token,
      'token_expiry': String(Date.now() + (tokens.expires_in * 1000))
    });
    
    return tokens.access_token;
  } catch (error) {
    throw new Error('Failed to refresh token: ' + error.toString());
  }
}

/**
 * Get valid access token
 */
function getValidAccessToken() {
  const tokenExpiry = PropertiesService.getUserProperties().getProperty('token_expiry');
  const accessToken = PropertiesService.getUserProperties().getProperty('access_token');
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  
  // Check if token is expired
  if (tokenExpiry && parseInt(tokenExpiry) < Date.now()) {
    return refreshAccessToken();
  }
  
  return accessToken;
}