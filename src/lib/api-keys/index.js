/**
 * API Key Management Library
 *
 * Handles generation, validation, and lifecycle management of API keys for the B2B API wrapper.
 *
 * Key Format:
 * - Production: sd_live_[32 random chars]
 * - Test: sd_test_[32 random chars]
 *
 * Security:
 * - Keys are hashed with bcrypt before storage (never store plain text)
 * - Uses cryptographically secure random generation
 * - Supports key expiration and revocation
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (service role for bypassing RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Generates a cryptographically secure API key
 * @param {string} environment - 'live' or 'test'
 * @returns {string} Generated API key in format: sd_live_xxx or sd_test_xxx
 */
export function generateApiKey(environment = 'live') {
  // Validate environment
  if (!['live', 'test'].includes(environment)) {
    throw new Error('Environment must be "live" or "test"');
  }

  // Generate 24 random bytes (will become 32 hex chars)
  const randomBytes = crypto.randomBytes(24);
  const randomString = randomBytes.toString('hex');

  // Format: sd_live_xxxx or sd_test_xxxx
  const prefix = environment === 'live' ? 'sd_live_' : 'sd_test_';
  const apiKey = `${prefix}${randomString}`;

  return apiKey;
}

/**
 * Hashes an API key for secure storage
 * @param {string} apiKey - Plain text API key
 * @returns {Promise<string>} Hashed key
 */
export async function hashApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required for hashing');
  }

  // Use bcrypt with 12 rounds (good balance of security and performance)
  const saltRounds = 12;
  const hash = await bcrypt.hash(apiKey, saltRounds);

  return hash;
}

/**
 * Validates an API key against its hash
 * @param {string} apiKey - Plain text API key to validate
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} True if key matches hash
 */
export async function validateApiKeyHash(apiKey, hash) {
  if (!apiKey || !hash) {
    return false;
  }

  try {
    const isValid = await bcrypt.compare(apiKey, hash);
    return isValid;
  } catch (error) {
    console.error('Error validating API key hash:', error);
    return false;
  }
}

/**
 * Extracts the prefix from an API key (first 12 chars for display)
 * @param {string} apiKey - Full API key
 * @returns {string} Prefix like "sd_live_1a2b"
 */
export function getKeyPrefix(apiKey) {
  if (!apiKey) return '';

  // Return first 12 characters: "sd_live_1a2b" or "sd_test_1a2b"
  return apiKey.substring(0, 12);
}

/**
 * Gets the last 4 characters of a key for display
 * @param {string} apiKey - Full API key
 * @returns {string} Last 4 chars like "...xyz9"
 */
export function getKeySuffix(apiKey) {
  if (!apiKey) return '';
  return `...${apiKey.slice(-4)}`;
}

/**
 * Creates a new API key in the database
 * @param {object} params - Key creation parameters
 * @param {string} params.userId - User ID creating the key
 * @param {string} params.name - Friendly name for the key
 * @param {string} params.environment - 'live' or 'test'
 * @param {Date|null} params.expiresAt - Optional expiration date
 * @returns {Promise<{apiKey: string, record: object}>} Created key and database record
 */
export async function createApiKey({ userId, name, environment = 'live', expiresAt = null }) {
  if (!userId || !name) {
    throw new Error('userId and name are required');
  }

  // Generate new API key
  const apiKey = generateApiKey(environment);

  // Hash the key for storage
  const keyHash = await hashApiKey(apiKey);

  // Get prefix for display
  const keyPrefix = getKeyPrefix(apiKey);

  try {
    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        environment,
        is_active: true,
        expires_at: expiresAt,
        total_requests: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Return both the plain key (ONLY TIME IT'S SHOWN) and the database record
    return {
      apiKey, // Plain text - show this ONCE to user
      record: {
        id: data.id,
        name: data.name,
        keyPrefix: data.key_prefix,
        environment: data.environment,
        createdAt: data.created_at,
        expiresAt: data.expires_at
      }
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw new Error(`Failed to create API key: ${error.message}`);
  }
}

/**
 * Validates an API key and returns associated user/quota information
 * @param {string} apiKey - Plain text API key to validate
 * @returns {Promise<object|null>} Key record with user info, or null if invalid
 */
export async function validateApiKey(apiKey) {
  if (!apiKey) {
    return null;
  }

  // Extract environment from key format
  const isLive = apiKey.startsWith('sd_live_');
  const isTest = apiKey.startsWith('sd_test_');

  if (!isLive && !isTest) {
    return null; // Invalid format
  }

  const environment = isLive ? 'live' : 'test';

  try {
    // Fetch all active keys for this environment
    // (We need to check hashes since we can't query by hash directly)
    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('*, user_api_access(api_enabled, is_developer)')
      .eq('environment', environment)
      .eq('is_active', true)
      .is('revoked_at', null);

    if (error) throw error;

    if (!keys || keys.length === 0) {
      return null;
    }

    // Check each key hash until we find a match
    for (const key of keys) {
      const isValid = await validateApiKeyHash(apiKey, key.key_hash);

      if (isValid) {
        // Check if key is expired
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
          return null; // Expired
        }

        // Update last_used_at timestamp
        await supabaseAdmin
          .from('api_keys')
          .update({
            last_used_at: new Date().toISOString(),
            total_requests: key.total_requests + 1
          })
          .eq('id', key.id);

        // Return key record with user information
        return {
          id: key.id,
          userId: key.user_id,
          name: key.name,
          environment: key.environment,
          totalRequests: key.total_requests + 1,
          apiEnabled: key.user_api_access?.[0]?.api_enabled ?? false,
          isDeveloper: key.user_api_access?.[0]?.is_developer ?? false
        };
      }
    }

    // No matching key found
    return null;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Revokes an API key (soft delete)
 * @param {string} keyId - UUID of the key to revoke
 * @param {string} userId - User ID performing the revocation
 * @param {string} reason - Optional reason for revocation
 * @returns {Promise<boolean>} Success status
 */
export async function revokeApiKey(keyId, userId, reason = null) {
  if (!keyId || !userId) {
    throw new Error('keyId and userId are required');
  }

  try {
    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: userId,
        revoke_reason: reason
      })
      .eq('id', keyId)
      .eq('user_id', userId); // Ensure user owns the key

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}

/**
 * Rotates an API key (creates new, revokes old)
 * @param {string} oldKeyId - UUID of key to replace
 * @param {string} userId - User ID
 * @param {string} name - Name for new key
 * @returns {Promise<{apiKey: string, record: object}>} New key
 */
export async function rotateApiKey(oldKeyId, userId, name) {
  if (!oldKeyId || !userId || !name) {
    throw new Error('oldKeyId, userId, and name are required');
  }

  try {
    // Get old key details
    const { data: oldKey, error: fetchError } = await supabaseAdmin
      .from('api_keys')
      .select('environment')
      .eq('id', oldKeyId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Create new key with same environment
    const newKey = await createApiKey({
      userId,
      name,
      environment: oldKey.environment
    });

    // Revoke old key
    await revokeApiKey(oldKeyId, userId, 'Rotated to new key');

    return newKey;
  } catch (error) {
    console.error('Error rotating API key:', error);
    throw new Error(`Failed to rotate API key: ${error.message}`);
  }
}

/**
 * Lists all API keys for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of key records (without actual keys)
 */
export async function listApiKeys(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, key_prefix, environment, is_active, created_at, last_used_at, expires_at, revoked_at, total_requests')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format for display
    return data.map(key => ({
      id: key.id,
      name: key.name,
      displayKey: `${key.key_prefix}...`, // Show prefix only
      environment: key.environment,
      isActive: key.is_active,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
      revokedAt: key.revoked_at,
      totalRequests: key.total_requests,
      status: key.revoked_at
        ? 'revoked'
        : (key.expires_at && new Date(key.expires_at) < new Date())
          ? 'expired'
          : key.is_active
            ? 'active'
            : 'inactive'
    }));
  } catch (error) {
    console.error('Error listing API keys:', error);
    throw new Error(`Failed to list API keys: ${error.message}`);
  }
}

/**
 * Deletes an API key permanently (hard delete)
 * @param {string} keyId - UUID of key to delete
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteApiKey(keyId, userId) {
  if (!keyId || !userId) {
    throw new Error('keyId and userId are required');
  }

  try {
    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId); // Ensure user owns the key

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

/**
 * Checks if a user can create more API keys (quota check)
 * @param {string} userId - User ID
 * @returns {Promise<{canCreate: boolean, current: number, max: number}>}
 */
export async function canCreateApiKey(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    // Get user's max allowed keys
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('user_api_access')
      .select('max_api_keys')
      .eq('user_id', userId)
      .single();

    if (accessError && accessError.code !== 'PGRST116') { // PGRST116 = not found
      throw accessError;
    }

    const maxKeys = accessData?.max_api_keys || 3; // Default to 3

    // Count active keys
    const { count, error: countError } = await supabaseAdmin
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('revoked_at', null);

    if (countError) throw countError;

    const currentKeys = count || 0;

    return {
      canCreate: currentKeys < maxKeys,
      current: currentKeys,
      max: maxKeys
    };
  } catch (error) {
    console.error('Error checking API key quota:', error);
    throw new Error(`Failed to check API key quota: ${error.message}`);
  }
}
