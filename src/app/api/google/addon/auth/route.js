import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADDON_JWT_SECRET || process.env.JWT_SECRET || 'your-addon-secret-key';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      
      // Verify user exists
      const supabase = createClient();
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', decoded.email)
        .single();
      
      if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        authenticated: true,
        email: user.email,
        userId: user.id
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, temporaryToken } = await request.json();
    
    if (!email || !temporaryToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the user exists in our system
    const supabase = createClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not found. Please sign up first.' }, { status: 404 });
    }
    
    // Generate JWT token for add-on
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        addon: true,
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      },
      JWT_SECRET
    );
    
    // Store add-on token
    const { error: tokenError } = await supabase
      .from('addon_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        temporary_token: temporaryToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    if (tokenError) {
      console.error('Error storing token:', tokenError);
      return NextResponse.json({ error: 'Failed to store token' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      token,
      expiresIn: 30 * 24 * 60 * 60,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Auth generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}