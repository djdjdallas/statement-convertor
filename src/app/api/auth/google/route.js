import { NextResponse } from 'next/server';
import { createApiRouteClient } from '@/lib/supabase/api-route';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const supabase = await createApiRouteClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error in Google OAuth route:', authError);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'User must be logged in to connect Google account' 
      }, { status: 401 });
    }
    
    // Generate a random state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session for verification during callback
    const { error: stateError } = await supabase
      .from('google_oauth_states')
      .insert({
        user_id: user.id,
        state: state,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });
    
    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      // If table doesn't exist, we can still continue with the OAuth flow
      if (stateError.code === '42P01') {
        console.warn('google_oauth_states table does not exist. Run migrations to create it.');
      } else {
        return NextResponse.json({ 
          error: 'Failed to initiate OAuth flow',
          details: stateError.message 
        }, { status: 500 });
      }
    }
    
    // Build OAuth URL directly here for consistency
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/oauth-callback`,
      response_type: 'code',
      scope: 'email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}