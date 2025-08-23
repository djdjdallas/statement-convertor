import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/google/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    // Get user session
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id);

    return NextResponse.json({
      accessToken,
      success: true
    });

  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: 500 }
    );
  }
}