import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api-route';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { email, addon } = await req.json();

    if (!email || addon !== 'drive') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found. Please sign up at statementdesk.com' }, { status: 404 });
    }

    // Generate auth code
    const authCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

    // Store auth code
    const { error: insertError } = await supabase
      .from('addon_auth_codes')
      .insert({
        user_id: user.id,
        code: authCode,
        addon_type: 'google-drive',
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error storing auth code:', insertError);
      return NextResponse.json({ error: 'Failed to generate auth code' }, { status: 500 });
    }

    return NextResponse.json({ 
      code: authCode,
      expiresIn: 600 // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Google Add-on auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Token exchange endpoint
export async function PUT(req) {
  try {
    const { code, grantType, clientId } = await req.json();

    if (grantType !== 'authorization_code' || clientId !== 'google-addon-drive') {
      return NextResponse.json({ error: 'Invalid grant type or client' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify auth code
    const { data: authCode, error: codeError } = await supabase
      .from('addon_auth_codes')
      .select('user_id, expires_at')
      .eq('code', code)
      .eq('addon_type', 'google-drive')
      .single();

    if (codeError || !authCode) {
      return NextResponse.json({ error: 'Invalid auth code' }, { status: 401 });
    }

    // Check expiry
    if (new Date(authCode.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Auth code expired' }, { status: 401 });
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // 24 hour expiry

    // Store tokens
    const { error: tokenError } = await supabase
      .from('addon_tokens')
      .insert({
        user_id: authCode.user_id,
        access_token: accessToken,
        refresh_token: refreshToken,
        addon_type: 'google-drive',
        expires_at: tokenExpiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error storing tokens:', tokenError);
      return NextResponse.json({ error: 'Failed to generate tokens' }, { status: 500 });
    }

    // Delete used auth code
    await supabase
      .from('addon_auth_codes')
      .delete()
      .eq('code', code);

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
      tokenType: 'Bearer'
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}