// The per-instance origins the browser needs. A NEXT_PUBLIC_* value is inlined into
// the bundle by `next build`, which pins one build to one instance; these are read
// from the server process on every render and handed to the browser by
// RuntimeEnvScript, so the same build serves any instance.

export interface RuntimeEnv {
  apiUrl: string;
  privacyUrl: string;
  termsUrl: string;
  hostVibeEnabled?: boolean;
}

declare global {
  interface Window {
    __ITSAPLAN_ENV__?: RuntimeEnv;
  }
}

// The NEXT_PUBLIC_ prefixed name is still accepted, for a deployment that sets it on
// the container. Both names are read through a computed key: Next inlines a literal
// `process.env.NEXT_PUBLIC_X` at build time, server code included, and only a dynamic
// lookup reaches the running process.
function readOrigin(name: string): string {
  return process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || '';
}

function readDynamicEnv(name: string): string {
  return process.env[name] || '';
}

export function serverRuntimeEnv(): RuntimeEnv {
  const env: RuntimeEnv = {
    apiUrl: readOrigin('API_URL'),
    privacyUrl: readOrigin('PRIVACY_URL'),
    termsUrl: readOrigin('TERMS_URL'),
  };
  if (
    readDynamicEnv('ITSAPLAN_ALLOW_HOST_BRIDGE') === 'true' &&
    readDynamicEnv(['NEXT_PUBLIC', 'ENABLE_HOST_VIBE'].join('_')) === 'true'
  ) {
    env.hostVibeEnabled = true;
  }
  return env;
}

export const RUNTIME_ENV_ELEMENT_ID = '__ITSAPLAN_ENV_DATA__';

const EMPTY_RUNTIME_ENV: RuntimeEnv = { apiUrl: '', privacyUrl: '', termsUrl: '' };

function isRuntimeEnv(value: unknown): value is RuntimeEnv {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.apiUrl === 'string' &&
    typeof candidate.privacyUrl === 'string' &&
    typeof candidate.termsUrl === 'string'
  );
}

function readBrowserRuntimeEnv(): RuntimeEnv {
  // Guard against browser named-element globals if a DOM node ever shares __ITSAPLAN_ENV__.
  if (isRuntimeEnv(window.__ITSAPLAN_ENV__)) return window.__ITSAPLAN_ENV__;
  if (typeof document === 'undefined') return EMPTY_RUNTIME_ENV;
  const raw = document.getElementById(RUNTIME_ENV_ELEMENT_ID)?.textContent;
  if (!raw) return EMPTY_RUNTIME_ENV;
  try {
    const parsed = JSON.parse(raw) as Partial<RuntimeEnv> | null;
    if (!parsed || typeof parsed !== 'object') return EMPTY_RUNTIME_ENV;
    const env: RuntimeEnv = {
      apiUrl: typeof parsed.apiUrl === 'string' ? parsed.apiUrl : '',
      privacyUrl: typeof parsed.privacyUrl === 'string' ? parsed.privacyUrl : '',
      termsUrl: typeof parsed.termsUrl === 'string' ? parsed.termsUrl : '',
    };
    if (parsed.hostVibeEnabled === true) {
      env.hostVibeEnabled = true;
    }
    try {
      window.__ITSAPLAN_ENV__ = env;
    } catch {
      // Ignore if window.__ITSAPLAN_ENV__ is non-writable in test environments
    }
    return env;
  } catch {
    return EMPTY_RUNTIME_ENV;
  }
}

export function runtimeEnv(): RuntimeEnv {
  if (typeof window === 'undefined') return serverRuntimeEnv();
  return readBrowserRuntimeEnv();
}
