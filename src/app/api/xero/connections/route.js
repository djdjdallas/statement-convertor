import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackXeroConnection } from '@/lib/posthog-server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connections, error } = await supabase
      .from('xero_connections')
      .select('id, tenant_id, tenant_name, tenant_type, is_active, last_sync_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({ connections: connections || [] });
  } catch (error) {
    console.error('Fetch connections error:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    const hardDelete = url.searchParams.get('hard') === 'true';
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !tenantId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (hardDelete) {
      // Completely remove the connection
      const { error } = await supabase
        .from('xero_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Failed to delete connection:', error);
        trackXeroConnection(user.id, {
          action: 'disconnected',
          tenantId,
          error: 'Failed to delete connection',
          errorCode: 'DELETE_ERROR'
        });
        return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
      }
    } else {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from('xero_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Failed to disconnect:', error);
        trackXeroConnection(user.id, {
          action: 'disconnected',
          tenantId,
          error: 'Failed to disconnect',
          errorCode: 'DISCONNECT_ERROR'
        });
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
      }
    }

    // Track successful disconnect
    trackXeroConnection(user.id, {
      action: 'disconnected',
      tenantId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    trackXeroConnection('unknown', {
      action: 'disconnected',
      error: error.message,
      errorCode: 'DISCONNECT_ERROR'
    });
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}