import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api-route';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { refreshToken, clientId } = await req.json();
    const apiKey = req.headers.get('x-api-key');

    if (!refreshToken || clientId !== 'google-addon-drive') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify API key
    if (apiKey !== process.env.GOOGLE_ADDON_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verify refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from('addon_tokens')
      .select('user_id')
      .eq('refresh_token', refreshToken)
      .eq('addon_type', 'google-drive')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Generate new access token
    const newAccessToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // 24 hour expiry

    // Update token
    const { error: updateError } = await supabase
      .from('addon_tokens')
      .update({
        access_token: newAccessToken,
        expires_at: tokenExpiresAt.toISOString()
      })
      .eq('refresh_token', refreshToken);

    if (updateError) {
      console.error('Error updating token:', updateError);
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
    }

    return NextResponse.json({
      accessToken: newAccessToken,
      expiresIn: 86400, // 24 hours in seconds
      tokenType: 'Bearer'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}