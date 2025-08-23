import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // User ID
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${error}`);
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=Missing parameters`);
    }
    
    // Verify the user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || user.id !== state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=Unauthorized`);
    }
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/oauth-callback`
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('Got tokens from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    });
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    const userInfo = await response.json();
    
    // Store the tokens
    const expiresAt = new Date(tokens.expiry_date);
    
    const { error: tokenError } = await supabase.rpc('upsert_google_token', {
      p_user_id: user.id,
      p_access_token: tokens.access_token,
      p_refresh_token: tokens.refresh_token || null,
      p_expires_at: expiresAt.toISOString(),
      p_scopes: tokens.scope ? tokens.scope.split(' ') : [],
      p_google_email: userInfo.email,
      p_google_name: userInfo.name,
      p_google_picture: userInfo.picture
    });
    
    if (tokenError) {
      console.error('Error storing tokens:', tokenError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=Failed to store tokens`);
    }
    
    // Redirect to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?google_linked=true`);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error.message)}`
    );
  }
}