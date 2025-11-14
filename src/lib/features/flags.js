/**
 * Feature Flag System
 *
 * Centralized feature flag management for controlling access to features.
 * Allows gradual rollout and A/B testing.
 *
 * Usage:
 * ```javascript
 * import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/features/flags';
 *
 * if (isFeatureEnabled('API_ACCESS', user)) {
 *   // Show API features
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
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
 * Feature flag definitions
 *
 * Each flag has:
 * - enabled: Global on/off switch
 * - devOnly: Only available to developers (is_developer = true)
 * - betaOnly: Only available to beta testers
 * - requiredRole: Specific role requirement (optional)
 * - percentageRollout: Percentage of users to enable for (0-100)
 */
export const FEATURE_FLAGS = {
  // API Access Feature (Main Feature for B2B API Wrapper)
  API_ACCESS: {
    enabled: false, // Set to false to grey out - change to true when ready to launch
    devOnly: true, // Only show to developers during development
    betaOnly: false, // Set to true for beta testing phase
    requiredRole: null, // No specific role required
    percentageRollout: 0, // 0 = disabled for all, 100 = enabled for all
    description: 'Access to B2B API wrapper features'
  },

  // API Documentation Access
  API_DOCS: {
    enabled: false,
    devOnly: true,
    betaOnly: false,
    requiredRole: null,
    percentageRollout: 0,
    description: 'Access to API documentation pages'
  },

  // API Key Management UI
  API_KEY_MANAGEMENT: {
    enabled: false,
    devOnly: true,
    betaOnly: false,
    requiredRole: null,
    percentageRollout: 0,
    description: 'UI for creating and managing API keys'
  },

  // API Analytics Dashboard
  API_ANALYTICS: {
    enabled: false,
    devOnly: true,
    betaOnly: false,
    requiredRole: null,
    percentageRollout: 0,
    description: 'API usage analytics and insights'
  },

  // Webhook Configuration
  API_WEBHOOKS: {
    enabled: false,
    devOnly: true,
    betaOnly: false,
    requiredRole: null,
    percentageRollout: 0,
    description: 'Webhook configuration for async notifications'
  }
};

/**
 * Checks if a feature is enabled for a given user
 * @param {string} featureName - Name of the feature flag
 * @param {object} user - User object with id, email, role, etc.
 * @param {string} user.id - User ID
 * @param {boolean} user.is_developer - Developer flag
 * @param {boolean} user.beta_tester - Beta tester flag
 * @param {boolean} user.api_enabled - API access flag
 * @param {string} user.role - User role
 * @returns {Promise<boolean>} True if feature is enabled for this user
 */
export async function isFeatureEnabled(featureName, user = null) {
  const flag = FEATURE_FLAGS[featureName];

  // Feature doesn't exist
  if (!flag) {
    console.warn(`Feature flag "${featureName}" not found`);
    return false;
  }

  // Check if feature is globally disabled
  if (!flag.enabled) {
    return false;
  }

  // If no user provided, check only global flag
  if (!user) {
    return flag.enabled && !flag.devOnly && !flag.betaOnly;
  }

  // Fetch user's API access settings if not provided
  let userApiAccess = user;
  if (user.id && !('api_enabled' in user)) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_api_access')
        .select('api_enabled, is_developer, beta_tester')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        userApiAccess = {
          ...user,
          api_enabled: data.api_enabled,
          is_developer: data.is_developer,
          beta_tester: data.beta_tester
        };
      }
    } catch (error) {
      console.error('Error fetching user API access:', error);
    }
  }

  // Check dev-only flag
  if (flag.devOnly && !userApiAccess.is_developer) {
    return false;
  }

  // Check beta-only flag
  if (flag.betaOnly && !userApiAccess.beta_tester && !userApiAccess.is_developer) {
    return false;
  }

  // Check role requirement
  if (flag.requiredRole && userApiAccess.role !== flag.requiredRole) {
    return false;
  }

  // Check percentage rollout (deterministic based on user ID)
  if (flag.percentageRollout < 100 && flag.percentageRollout > 0) {
    const userHash = hashUserId(userApiAccess.id);
    const userPercentage = userHash % 100;

    if (userPercentage >= flag.percentageRollout) {
      return false;
    }
  }

  // Check if user has API access enabled (for API-specific features)
  if (featureName.startsWith('API_') && !userApiAccess.api_enabled && !userApiAccess.is_developer) {
    return false;
  }

  return true;
}

/**
 * Simple hash function for consistent percentage rollout
 * @param {string} userId - User ID
 * @returns {number} Hash value 0-99
 */
function hashUserId(userId) {
  if (!userId) return 0;

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash % 100);
}

/**
 * Checks multiple features at once
 * @param {string[]} featureNames - Array of feature names
 * @param {object} user - User object
 * @returns {Promise<object>} Object with feature names as keys and boolean values
 */
export async function checkMultipleFeatures(featureNames, user = null) {
  const results = {};

  for (const featureName of featureNames) {
    results[featureName] = await isFeatureEnabled(featureName, user);
  }

  return results;
}

/**
 * Gets all enabled features for a user
 * @param {object} user - User object
 * @returns {Promise<string[]>} Array of enabled feature names
 */
export async function getEnabledFeatures(user = null) {
  const enabledFeatures = [];

  for (const [featureName, flag] of Object.entries(FEATURE_FLAGS)) {
    const enabled = await isFeatureEnabled(featureName, user);
    if (enabled) {
      enabledFeatures.push(featureName);
    }
  }

  return enabledFeatures;
}

/**
 * Server-side helper to check feature access
 * Throws error if feature is not enabled
 * @param {string} featureName - Feature name
 * @param {object} user - User object
 * @throws {Error} If feature is not enabled
 */
export async function requireFeature(featureName, user = null) {
  const enabled = await isFeatureEnabled(featureName, user);

  if (!enabled) {
    throw new Error(`Feature "${featureName}" is not enabled for this user`);
  }
}

/**
 * Enables API access for a specific user (admin/dev function)
 * @param {string} userId - User ID to enable
 * @param {object} options - Additional options
 * @param {boolean} options.isDeveloper - Set as developer
 * @param {boolean} options.betaTester - Set as beta tester
 * @returns {Promise<boolean>} Success status
 */
export async function enableApiAccessForUser(userId, options = {}) {
  const {
    isDeveloper = false,
    betaTester = false
  } = options;

  try {
    // Upsert user_api_access record
    const { error } = await supabaseAdmin
      .from('user_api_access')
      .upsert({
        user_id: userId,
        api_enabled: true,
        is_developer: isDeveloper,
        beta_tester: betaTester,
        access_granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error enabling API access:', error);
    return false;
  }
}

/**
 * Disables API access for a specific user
 * @param {string} userId - User ID to disable
 * @returns {Promise<boolean>} Success status
 */
export async function disableApiAccessForUser(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('user_api_access')
      .update({
        api_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error disabling API access:', error);
    return false;
  }
}

/**
 * Client-side hook for checking feature flags (use in React components)
 * Note: This is a simple version. In production, use SWR or React Query for caching.
 *
 * Usage:
 * ```javascript
 * const apiEnabled = useFeatureFlag('API_ACCESS');
 * ```
 */
export function useFeatureFlag(featureName, user = null) {
  // This should be implemented as a React hook in actual usage
  // For now, returning a promise that components can await
  return isFeatureEnabled(featureName, user);
}

/**
 * Gets feature flag status for display purposes (admin panel)
 * @returns {object} All feature flags with their current status
 */
export function getFeatureFlagStatus() {
  return Object.entries(FEATURE_FLAGS).map(([name, flag]) => ({
    name,
    enabled: flag.enabled,
    devOnly: flag.devOnly,
    betaOnly: flag.betaOnly,
    percentageRollout: flag.percentageRollout,
    description: flag.description
  }));
}

/**
 * Updates a feature flag (admin function - be careful!)
 * @param {string} featureName - Feature to update
 * @param {object} updates - Flag properties to update
 * @returns {boolean} Success status
 */
export function updateFeatureFlag(featureName, updates) {
  if (!FEATURE_FLAGS[featureName]) {
    console.error(`Feature flag "${featureName}" not found`);
    return false;
  }

  // Update the flag (note: this is in-memory only)
  // For persistent updates, store flags in database
  Object.assign(FEATURE_FLAGS[featureName], updates);

  console.log(`Updated feature flag "${featureName}":`, FEATURE_FLAGS[featureName]);
  return true;
}

/**
 * Joins the API waitlist for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function joinApiWaitlist(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('user_api_access')
      .upsert({
        user_id: userId,
        api_enabled: false, // Not enabled yet
        waitlist_joined_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return false;
  }
}

/**
 * Gets waitlist statistics (admin function)
 * @returns {Promise<object>} Waitlist stats
 */
export async function getWaitlistStats() {
  try {
    const { count: totalWaitlist, error: waitlistError } = await supabaseAdmin
      .from('user_api_access')
      .select('*', { count: 'exact', head: true })
      .not('waitlist_joined_at', 'is', null)
      .eq('api_enabled', false);

    const { count: enabledUsers, error: enabledError } = await supabaseAdmin
      .from('user_api_access')
      .select('*', { count: 'exact', head: true })
      .eq('api_enabled', true);

    if (waitlistError || enabledError) {
      throw waitlistError || enabledError;
    }

    return {
      totalWaitlist: totalWaitlist || 0,
      enabledUsers: enabledUsers || 0
    };
  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    return {
      totalWaitlist: 0,
      enabledUsers: 0
    };
  }
}

// Export for easy enabling/disabling during development
export const DEV_SHORTCUTS = {
  enableAllApiFeatures: () => {
    Object.keys(FEATURE_FLAGS).forEach(key => {
      if (key.startsWith('API_')) {
        FEATURE_FLAGS[key].enabled = true;
      }
    });
    console.log('✅ All API features enabled (dev mode)');
  },
  disableAllApiFeatures: () => {
    Object.keys(FEATURE_FLAGS).forEach(key => {
      if (key.startsWith('API_')) {
        FEATURE_FLAGS[key].enabled = false;
      }
    });
    console.log('❌ All API features disabled');
  },
  enableApiForDevelopers: () => {
    Object.keys(FEATURE_FLAGS).forEach(key => {
      if (key.startsWith('API_')) {
        FEATURE_FLAGS[key].enabled = true;
        FEATURE_FLAGS[key].devOnly = true;
      }
    });
    console.log('👨‍💻 API features enabled for developers only');
  }
};
