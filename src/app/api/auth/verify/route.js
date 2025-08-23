import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api-route';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Verify API key
    if (apiKey !== process.env.GOOGLE_ADDON_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('addon_tokens')
      .select('user_id, expires_at')
      .eq('access_token', token)
      .eq('addon_type', 'google-drive')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      userId: user.id,
      email: user.email
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}