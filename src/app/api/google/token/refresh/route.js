import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase-admin';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to refresh Google token.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { forceRefresh = false } = body;

    // Get current token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { 
          error: 'No Google token found',
          message: 'Please connect your Google account in Settings.',
          code: 'TOKEN_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const needsRefresh = forceRefresh || expiresAt <= now;

    if (!needsRefresh) {
      // Token is still valid
      return NextResponse.json({
        success: true,
        data: {
          accessToken: tokenData.access_token,
          expiresAt: tokenData.expires_at,
          refreshed: false
        }
      });
    }

    // Refresh the token
    if (!tokenData.refresh_token) {
      return NextResponse.json(
        { 
          error: 'No refresh token available',
          message: 'Please reconnect your Google account to get a new refresh token.',
          code: 'NO_REFRESH_TOKEN'
        },
        { status: 400 }
      );
    }

    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token in refresh response');
      }

      // Calculate new expiry time
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(
        newExpiresAt.getSeconds() + (credentials.expiry_date ? 
          Math.floor((credentials.expiry_date - Date.now()) / 1000) : 
          3600)
      );

      // Update token in database using admin client for security
      const adminSupabase = createAdminClient();
      const { error: updateError } = await adminSupabase
        .from('google_oauth_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating token:', updateError);
        throw new Error('Failed to update token in database');
      }

      // Log token refresh for monitoring
      await adminSupabase
        .from('token_refresh_logs')
        .insert({
          user_id: user.id,
          token_type: 'google',
          refreshed_at: new Date().toISOString(),
          success: true
        });

      return NextResponse.json({
        success: true,
        data: {
          accessToken: credentials.access_token,
          expiresAt: newExpiresAt.toISOString(),
          refreshed: true
        }
      });

    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);

      // Log failed refresh attempt
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from('token_refresh_logs')
        .insert({
          user_id: user.id,
          token_type: 'google',
          refreshed_at: new Date().toISOString(),
          success: false,
          error: refreshError.message
        });

      // Handle specific refresh errors
      if (refreshError.message?.includes('invalid_grant')) {
        // Mark token as invalid
        await adminSupabase
          .from('google_oauth_tokens')
          .update({
            is_valid: false,
            invalidated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        return NextResponse.json(
          { 
            error: 'Refresh token invalid',
            message: 'Your Google authorization has been revoked. Please reconnect in Settings.',
            code: 'INVALID_REFRESH_TOKEN'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Token refresh failed',
          message: refreshError.message || 'Unable to refresh Google token.',
          code: 'REFRESH_FAILED'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in token refresh endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check token status
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

    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('expires_at, is_valid, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        success: true,
        data: {
          hasToken: false,
          isValid: false,
          needsRefresh: true
        }
      });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const isExpired = expiresAt <= now;
    const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return NextResponse.json({
      success: true,
      data: {
        hasToken: true,
        isValid: tokenData.is_valid !== false,
        isExpired,
        needsRefresh: isExpired || !tokenData.is_valid,
        expiresAt: tokenData.expires_at,
        expiresIn,
        createdAt: tokenData.created_at,
        updatedAt: tokenData.updated_at
      }
    });

  } catch (error) {
    console.error('Error checking token status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check token status',
        message: error.message || 'Unable to retrieve token information.',
        code: 'STATUS_CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}