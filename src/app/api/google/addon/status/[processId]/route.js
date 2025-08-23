import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADDON_JWT_SECRET || process.env.JWT_SECRET || 'your-addon-secret-key';

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const processId = params.processId;
    if (!processId) {
      return NextResponse.json({ error: 'Process ID required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Get file status
    const { data: file, error } = await supabase
      .from('files')
      .select('id, file_name, status, transaction_count, created_at, completed_at, error_message')
      .eq('id', processId)
      .eq('user_id', decoded.userId)
      .single();
    
    if (error || !file) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Calculate progress
    let progress = 0;
    let message = '';
    
    switch (file.status) {
      case 'pending':
        progress = 0;
        message = 'Waiting to start processing...';
        break;
      case 'processing':
        progress = 50;
        message = 'Processing bank statement...';
        break;
      case 'completed':
        progress = 100;
        message = `Successfully processed ${file.transaction_count || 0} transactions`;
        break;
      case 'failed':
        progress = 0;
        message = file.error_message || 'Processing failed';
        break;
    }
    
    return NextResponse.json({
      processId: file.id,
      fileName: file.file_name,
      status: file.status,
      progress,
      message,
      transactionCount: file.transaction_count,
      startedAt: file.created_at,
      completedAt: file.completed_at
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}