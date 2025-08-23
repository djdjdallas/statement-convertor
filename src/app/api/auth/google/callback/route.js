import { NextResponse } from 'next/server';
import { createApiRouteClient } from '@/lib/supabase/api-route';
import { exchangeCodeForTokens, storeGoogleTokens } from '@/lib/google/auth-enhanced';
import { tokenService } from '@/lib/google/token-service';

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
    
    // Exchange code for tokens and get user info
    const { tokens, userInfo } = await exchangeCodeForTokens(code);
    
    // Extract workspace ID if this is a workspace installation
    const workspaceId = searchParams.get('workspace_id');
    const tokenType = searchParams.get('token_type') || 'user';
    
    // Store tokens securely with encryption
    await storeGoogleTokens({
      userId: stateData.user_id,
      tokens,
      userInfo,
      workspaceId,
      tokenType
    });
    
    // Log successful authentication
    await tokenService.logActivity(stateData.user_id, 'google_oauth_success', {
      workspace_id: workspaceId,
      domain: userInfo.hd || userInfo.email?.split('@')[1],
      scopes: tokens.scope?.split(' ') || []
    });
    
    // Redirect with workspace context if applicable
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('success', 'google_linked');
    if (workspaceId) {
      redirectUrl.searchParams.set('workspace_id', workspaceId);
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    // Log failed authentication attempt
    try {
      const { searchParams } = new URL(request.url);
      const state = searchParams.get('state');
      if (state) {
        const supabase = await createApiRouteClient();
        const { data: stateData } = await supabase
          .from('google_oauth_states')
          .select('user_id')
          .eq('state', state)
          .single();
        
        if (stateData?.user_id) {
          await tokenService.logActivity(stateData.user_id, 'google_oauth_failed', {
            error: error.message
          });
        }
      }
    } catch (logError) {
      console.error('Error logging failed auth:', logError);
    }
    
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}