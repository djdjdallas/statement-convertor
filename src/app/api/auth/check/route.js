import { NextResponse } from 'next/server';
import { createApiRouteClient } from '@/lib/supabase/api-route';

export async function GET(request) {
  console.log('Auth check endpoint called');
  
  try {
    const supabase = await createApiRouteClient();
    
    // First try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check:', { hasSession: !!session, sessionError });
    
    // Then get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('User check:', { hasUser: !!user, error });
    
    if (error) {
      console.error('Error getting user:', error);
      return NextResponse.json({ 
        authenticated: false,
        error: error.message,
        details: 'Failed to get user session',
        session: !!session
      }, { status: 200 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'No user session found',
        details: 'User is not logged in',
        session: !!session
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider
      },
      session: !!session
    }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: error.message || 'Unknown error',
      details: 'Internal server error'
    }, { status: 200 });
  }
}