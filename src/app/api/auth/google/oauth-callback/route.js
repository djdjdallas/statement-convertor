import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  getTokensFromCode, 
  getUserInfo,
  getOAuthCallbackUrl 
} from '@/lib/google/unified-oauth';

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
    
    // Exchange code for tokens using unified OAuth
    const tokens = await getTokensFromCode(code);
    
    console.log('Got tokens from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      redirectUri: getOAuthCallbackUrl() // Log for debugging
    });
    
    // Get user info from Google using unified OAuth
    const userInfo = await getUserInfo(tokens.access_token);
    
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