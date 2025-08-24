import { NextResponse } from 'next/server';
import { XeroService } from '@/lib/xero/xero-service';
import { encrypt } from '@/lib/encryption';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?xero_error=missing_params`);
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Validate state and get user
    const { data: stateRecord, error: stateError } = await supabase
      .from('oauth_states')
      .select('user_id')
      .eq('state', state)
      .eq('provider', 'xero')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateRecord) {
      console.error('Invalid OAuth state:', stateError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?xero_error=invalid_state`);
    }

    // Exchange code for tokens
    const xeroService = new XeroService();
    const { tokenSet, tenants } = await xeroService.handleCallback(code);

    // Store connection for each tenant
    for (const tenant of tenants) {
      const { error: upsertError } = await supabase
        .from('xero_connections')
        .upsert({
          user_id: stateRecord.user_id,
          tenant_id: tenant.tenantId,
          tenant_name: tenant.tenantName,
          tenant_type: tenant.tenantType,
          access_token: encrypt(tokenSet.access_token),
          refresh_token: encrypt(tokenSet.refresh_token),
          token_expires_at: new Date(Date.now() + tokenSet.expires_in * 1000).toISOString(),
          id_token: tokenSet.id_token ? encrypt(tokenSet.id_token) : null,
          scopes: tokenSet.scope?.split(' ') || [],
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Failed to store Xero connection:', upsertError);
      }
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?xero_success=connected`);
  } catch (error) {
    console.error('Xero callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?xero_error=callback_failed`);
  }
}