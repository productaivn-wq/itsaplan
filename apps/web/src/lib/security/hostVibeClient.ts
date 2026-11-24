import { runtimeEnv } from '@/utils/runtimeEnv';

/**
 * Client-side feature flag for legacy host-machine Sovereign OS / Open Office bridges.
 * Defaults to false in multi-tenant Client SaaS mode so client pages never issue
 * doomed requests to quarantined `/api/vibe/*` or `/api/vault-bridge` endpoints.
 */
export function isHostVibeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE === 'true') return true;
  if (process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE === 'false') return false;
  return runtimeEnv().hostVibeEnabled === true;
}
