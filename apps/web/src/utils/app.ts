import { runtimeEnv } from './runtimeEnv';

// Official Project Brand Identity (SPEC-DESIGN-SYSTEM-LOGO-263 / SPEC-ITSAPLAN-BRAND-DESIGN-SYSTEM-282)
export const APP_NAME = 'ACCORD';
export const APP_TAGLINE = 'AI Speed. Deterministic Proof. Zero Babysitting.';

// The product site. The product mark on the public share pages links to it.
export const APP_SITE_URL = 'https://accord.sovereign.os/';

// The legal document URLs, linked from the logged-out screens.
export const PRIVACY_POLICY_URL = runtimeEnv().privacyUrl;
export const TERMS_URL = runtimeEnv().termsUrl;
