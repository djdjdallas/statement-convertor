import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAuthUrl } from '@/lib/google-oauth';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 });
    }
    
    // Generate the Google OAuth URL
    const authUrl = getAuthUrl(state);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}