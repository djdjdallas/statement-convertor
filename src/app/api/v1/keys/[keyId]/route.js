/**
 * API v1: API Key Management (Individual Key)
 *
 * DELETE /api/v1/keys/[keyId] - Revoke/delete an API key
 *
 * Requires user authentication (session auth)
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revokeApiKey, deleteApiKey } from '@/lib/api-keys';
import { isFeatureEnabled } from '@/lib/features/flags';

/**
 * DELETE handler - Revoke an API key
 */
export async function DELETE(request, { params }) {
  try {
    const { keyId } = params;

    if (!keyId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Key ID is required',
          code: 'MISSING_KEY_ID'
        },
        { status: 400 }
      );
    }

    // Create Supabase client with session auth
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please login to access this endpoint',
          code: 'UNAUTHENTICATED'
        },
        { status: 401 }
      );
    }

    const user = session.user;

    // Check if user has API access enabled
    const hasAccess = await isFeatureEnabled('API_ACCESS', { id: user.id });

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'API access is not enabled for your account',
          code: 'API_ACCESS_DISABLED'
        },
        { status: 403 }
      );
    }

    // Parse query parameter for hard delete
    const url = new URL(request.url);
    const hardDelete = url.searchParams.get('hard_delete') === 'true';

    // Revoke or delete the key
    if (hardDelete) {
      await deleteApiKey(keyId, user.id);
    } else {
      await revokeApiKey(keyId, user.id, 'Revoked by user');
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'API key deleted permanently' : 'API key revoked successfully',
      key_id: keyId
    });

  } catch (error) {
    console.error('Error deleting API key:', error);

    return NextResponse.json(
      {
        error: 'Internal error',
        message: error.message || 'Failed to delete API key',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
