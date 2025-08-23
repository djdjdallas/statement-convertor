import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasGoogleIntegration, getAuthenticatedClient } from '@/lib/google/auth';
import { createErrorResponse, GOOGLE_ERROR_CODES } from '@/lib/google/error-handler';

export async function GET(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has Google integration
    const hasGoogle = await hasGoogleIntegration(user.id);
    if (!hasGoogle) {
      return NextResponse.json({
        connectionStatus: 'not_connected',
        hasIntegration: false,
        warnings: ['Google account not connected']
      });
    }

    // Get token status
    const { data: tokenData } = await supabase
      .from('google_oauth_tokens')
      .select('token_expires_at, updated_at, scopes')
      .eq('user_id', user.id)
      .single();

    // Check token expiry
    const now = new Date();
    const expiresAt = new Date(tokenData.token_expires_at);
    const isExpired = now >= expiresAt;
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('usage_tracking')
      .select('action, details, created_at')
      .eq('user_id', user.id)
      .in('action', ['export', 'import_drive'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Get API quota usage (estimate based on recent activity)
    const { data: todayUsage } = await supabase
      .from('usage_tracking')
      .select('action')
      .eq('user_id', user.id)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .in('action', ['export', 'import_drive', 'process_pdf']);

    // Try to make a simple API call to verify connection
    let connectionStatus = 'operational';
    let apiError = null;
    
    try {
      const auth = await getAuthenticatedClient(user.id, true);
      // Simple about.get call to verify connection
      const { google } = await import('googleapis');
      const drive = google.drive({ version: 'v3', auth });
      await drive.about.get({ fields: 'user' });
    } catch (error) {
      console.error('Google API health check failed:', error);
      connectionStatus = 'error';
      apiError = error.message;
      
      // Check for specific error types
      if (error.message?.includes('invalid_grant')) {
        connectionStatus = 'permission_revoked';
      } else if (error.message?.includes('quota')) {
        connectionStatus = 'quota_exceeded';
      } else if (error.message?.includes('network')) {
        connectionStatus = 'network_error';
      }
    }

    // Build warnings array
    const warnings = [];
    
    if (isExpired) {
      warnings.push('Token has expired and needs refresh');
    } else if (minutesUntilExpiry < 60) {
      warnings.push(`Token expires in ${minutesUntilExpiry} minutes`);
    }
    
    if (todayUsage?.length > 900) {
      warnings.push('Approaching daily API quota limit');
    }
    
    if (connectionStatus !== 'operational') {
      warnings.push(`Connection issue: ${connectionStatus.replace('_', ' ')}`);
    }

    // Format recent activity
    const formattedActivity = recentActivity?.map(activity => ({
      action: activity.action.replace('_', ' '),
      success: !activity.details?.error,
      timestamp: activity.created_at,
      details: activity.details
    })) || [];

    return NextResponse.json({
      connectionStatus,
      hasIntegration: true,
      tokenStatus: {
        isExpired,
        expiresAt: tokenData.token_expires_at,
        minutesUntilExpiry,
        lastRefresh: tokenData.updated_at
      },
      quotaUsage: {
        used: todayUsage?.length || 0,
        limit: 1000, // Daily limit estimate
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      },
      recentActivity: formattedActivity,
      warnings,
      lastChecked: new Date().toISOString(),
      ...(apiError && { error: apiError })
    });

  } catch (error) {
    console.error('Error checking Google API status:', error);
    
    // Create standardized error response
    const errorResponse = createErrorResponse(error, {
      operation: 'checkAPIStatus'
    });
    
    // Return status with error info
    return NextResponse.json({
      connectionStatus: 'error',
      hasIntegration: false,
      error: errorResponse,
      warnings: ['Failed to check Google API status'],
      lastChecked: new Date().toISOString()
    });
  }
}