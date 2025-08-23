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

    // Get user from token
    const { data: tokenData, error: tokenError } = await supabase
      .from('addon_tokens')
      .select('user_id')
      .eq('access_token', token)
      .eq('addon_type', 'google-drive')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_status')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.full_name || user.email.split('@')[0],
      subscriptionStatus: user.subscription_status
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}