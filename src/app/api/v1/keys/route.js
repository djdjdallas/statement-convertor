/**
 * API v1: API Keys Management
 *
 * GET /api/v1/keys - List all API keys
 * POST /api/v1/keys - Create new API key
 *
 * Requires user authentication (NOT API key auth - uses session auth)
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  createApiKey,
  listApiKeys,
  canCreateApiKey
} from '@/lib/api-keys';
import { isFeatureEnabled } from '@/lib/features/flags';

/**
 * GET handler - List user's API keys
 */
export async function GET(request) {
  try {
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

    // Fetch user's API keys
    const keys = await listApiKeys(user.id);

    return NextResponse.json({
      success: true,
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.displayKey, // Only shows prefix
        environment: key.environment,
        status: key.status,
        created_at: key.createdAt,
        last_used_at: key.lastUsedAt,
        expires_at: key.expiresAt,
        total_requests: key.totalRequests
      }))
    });

  } catch (error) {
    console.error('Error listing API keys:', error);

    return NextResponse.json(
      {
        error: 'Internal error',
        message: 'Failed to fetch API keys',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create new API key
 */
export async function POST(request) {
  try {
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

    // Parse request body
    const { name, environment = 'live', expiresAt = null } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'API key name is required',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    if (!['live', 'test'].includes(environment)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Environment must be "live" or "test"',
          code: 'INVALID_ENVIRONMENT'
        },
        { status: 400 }
      );
    }

    // Check if user can create more keys (quota)
    const quota = await canCreateApiKey(user.id);

    if (!quota.canCreate) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: `Maximum number of API keys reached (${quota.current}/${quota.max})`,
          code: 'KEY_LIMIT_EXCEEDED',
          quota: {
            current: quota.current,
            max: quota.max
          }
        },
        { status: 429 }
      );
    }

    // Create the API key
    const result = await createApiKey({
      userId: user.id,
      name: name.trim(),
      environment,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // IMPORTANT: Return the plain API key - this is the ONLY time it will be shown
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key securely - you won\'t be able to see it again!',
      api_key: result.apiKey, // Plain text key - show once
      key_info: {
        id: result.record.id,
        name: result.record.name,
        environment: result.record.environment,
        created_at: result.record.createdAt,
        expires_at: result.record.expiresAt
      },
      warning: 'Store this API key securely. It will not be shown again.'
    }, {
      status: 201
    });

  } catch (error) {
    console.error('Error creating API key:', error);

    return NextResponse.json(
      {
        error: 'Internal error',
        message: error.message || 'Failed to create API key',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
