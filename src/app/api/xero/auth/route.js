import { NextResponse } from 'next/server';
import { XeroService } from '@/lib/xero/xero-service';
import { createClient } from '@/lib/supabase/server';
import { trackXeroConnection } from '@/lib/posthog-server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = `${user.id}_${Date.now()}`;
    
    const xeroService = new XeroService(state);
    
    console.log('Xero environment check:', {
      clientId: !!process.env.XERO_CLIENT_ID,
      clientSecret: !!process.env.XERO_CLIENT_SECRET,
      redirectUri: process.env.XERO_REDIRECT_URI
    });
    
    const authUrl = await xeroService.getAuthUrl();

    // Store state for validation
    const { error } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state,
        provider: 'xero',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (error) {
      console.error('Failed to store OAuth state:', error);
      trackXeroConnection(user.id, {
        action: 'auth_failed',
        error: 'Failed to store OAuth state',
        errorCode: 'OAUTH_STATE_ERROR'
      });
      return NextResponse.json({ error: 'Failed to initialize authentication' }, { status: 500 });
    }

    // Track auth started
    trackXeroConnection(user.id, { action: 'auth_started' });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Xero auth error:', error);
    trackXeroConnection('unknown', {
      action: 'auth_failed',
      error: error.message,
      errorCode: 'AUTH_INIT_ERROR'
    });
    return NextResponse.json({ error: 'Auth initialization failed' }, { status: 500 });
  }
}