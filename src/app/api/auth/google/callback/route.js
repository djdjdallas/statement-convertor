import { NextResponse } from 'next/server';
import { createApiRouteClient } from '@/lib/supabase/api-route';
import { getTokensFromCode, getUserInfo } from '@/lib/google-oauth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(new URL('/dashboard?error=google_oauth_denied', request.url));
    }
    
    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
    }
    
    const supabase = await createApiRouteClient();
    
    // Verify state parameter
    const { data: stateData, error: stateError } = await supabase
      .from('google_oauth_states')
      .select('user_id')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (stateError || !stateData) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_state', request.url));
    }
    
    // Delete the used state
    await supabase
      .from('google_oauth_states')
      .delete()
      .eq('state', state);
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Get user info from Google
    const googleUserInfo = await getUserInfo(tokens.access_token);
    
    // Calculate token expiry time
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if not provided
    
    // Store Google OAuth tokens and user info
    const { error: upsertError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: stateData.user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        google_email: googleUserInfo.email,
        google_name: googleUserInfo.name,
        google_picture: googleUserInfo.picture,
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 
                 'https://www.googleapis.com/auth/userinfo.profile', 
                 'https://www.googleapis.com/auth/drive.file'],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (upsertError) {
      console.error('Error storing Google OAuth tokens:', upsertError);
      return NextResponse.redirect(new URL('/dashboard?error=token_storage_failed', request.url));
    }
    
    return NextResponse.redirect(new URL('/dashboard?success=google_linked', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}