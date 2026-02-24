/**
 * Mock mode detection utility.
 *
 * The app runs in mock mode when:
 *   1. NEXT_PUBLIC_MOCK_MODE=true is set in env, OR
 *   2. Elasticsearch credentials are not configured (auto-fallback)
 *
 * This provides an explicit toggle while keeping backward compatibility.
 */

import { elasticsearch } from '@/lib/services/elasticsearch';

/**
 * Returns true if the app should use mock data instead of real services.
 * Check order:
 *   1. Explicit env var NEXT_PUBLIC_MOCK_MODE=true → mock mode ON
 *   2. Explicit env var NEXT_PUBLIC_MOCK_MODE=false → mock mode OFF (use real services)
 *   3. No env var set → auto-detect based on Elasticsearch availability
 */
export function isMockMode(): boolean {
  const envValue = process.env.NEXT_PUBLIC_MOCK_MODE;

  if (envValue === 'true') return true;
  if (envValue === 'false') return false;

  // Auto-detect: if no ES client, we're in mock mode
  return !elasticsearch;
}
