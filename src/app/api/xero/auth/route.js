import { NextResponse } from 'next/server';
import { XeroService } from '@/lib/xero/xero-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xeroService = new XeroService();
    const state = `${user.id}_${Date.now()}`;
    const authUrl = await xeroService.getAuthUrl(state);

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
      return NextResponse.json({ error: 'Failed to initialize authentication' }, { status: 500 });
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Xero auth error:', error);
    return NextResponse.json({ error: 'Auth initialization failed' }, { status: 500 });
  }
}