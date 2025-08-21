import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if Google account is already linked
    const { data: googleAccount, error: fetchError } = await supabase
      .from('google_oauth_tokens')
      .select('google_id, email, name, picture')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Google account:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch Google account' }, { status: 500 });
    }
    
    return NextResponse.json({
      linked: !!googleAccount,
      googleAccount: googleAccount || null
    });
  } catch (error) {
    console.error('Google account link check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete Google OAuth tokens
    const { error: deleteError } = await supabase
      .from('google_oauth_tokens')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error unlinking Google account:', deleteError);
      return NextResponse.json({ error: 'Failed to unlink Google account' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google account unlink error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}