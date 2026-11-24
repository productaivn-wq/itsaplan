'use client';

import { useDeferredValue, useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

export const INSTANT_NAV_EVENT = 'accord:instant-nav';

const NON_TEAM_PREFIXES = new Set([
  'account',
  'api',
  '_next',
  'share',
  'invite',
  'god',
  'login',
  'register',
  'forgot-password',
  'reset-password',
]);

const PROJECT_SHELL_SEGMENTS = new Set([
  'view',
  'inbox',
  'dashboards',
  'initiatives',
  'cycles',
  'docs',
  'notes',
  'vibe',
  'agents',
  'vault',
  'open-office',
  'directory',
  'members',
  'timeline',
  'mcp',
  'api',
  'notifications',
]);

export type AccordRouteLayout = 'org' | 'shell' | 'other';

export function extractPathname(url: string): string {
  if (!url) return '';
  if (url.startsWith('/')) {
    return url.split('?')[0]!.split('#')[0]!;
  }
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(url, base).pathname;
  } catch {
    return '';
  }
}

export function classifyRouteLayout(urlOrPathname: string): AccordRouteLayout {
  const pathname = extractPathname(urlOrPathname);
  if (!pathname) return 'other';

  if (pathname === '/account/company' || pathname === '/account/teams') {
    return 'org';
  }

  const segs = pathname.split('/').filter(Boolean);
  if (segs.length < 2) return 'other';
  if (NON_TEAM_PREFIXES.has(segs[0]!)) return 'other';

  if (segs[1] === 'settings') {
    return segs.length <= 3 ? 'org' : 'other';
  }

  if (segs[1] === 'issue') {
    return 'other';
  }

  if (segs.length === 2) {
    return 'shell';
  }

  return PROJECT_SHELL_SEGMENTS.has(segs[2]!) ? 'shell' : 'other';
}

export function shouldSuppressAccordRscFetch(
  url: string,
  currentPathname: string,
  isPrefetch: boolean,
): boolean {
  if (!url || !currentPathname) return false;
  const targetLayout = classifyRouteLayout(url);
  if (targetLayout === 'other') return false;
  if (classifyRouteLayout(currentPathname) !== targetLayout) return false;
  if (!isPrefetch && extractPathname(url) === extractPathname(currentPathname)) {
    return false;
  }
  return true;
}

interface AccordWindow extends Window {
  __accordHistoryGuarded?: boolean;
  __accordNativePush?: History['pushState'];
  __accordNativeReplace?: History['replaceState'];
  __accordPopstateGuarded?: boolean;
  __accordRscFetchGuarded?: boolean;
  __accordNativeFetch?: typeof window.fetch;
  __accordInstantNavListenerAttached?: boolean;
}

// Module-level store so all useInstantPathname() consumers share one subscription
// and receive synchronous urgent updates on navigation clicks.
let overridePath: string | null = null;
let lastObservedNextPathname: string | null = null;
const instantListeners = new Set<() => void>();

export function resetInstantPathnameForTest(): void {
  overridePath = null;
  lastObservedNextPathname = null;
}

function notifyInstantListeners(): void {
  for (const listener of instantListeners) {
    listener();
  }
}

export function setOverridePathname(rawUrl: string | null): void {
  const next = rawUrl ? extractPathname(rawUrl) : null;
  const normalized = next && next.startsWith('/') ? next : null;
  if (overridePath === normalized) return;
  overridePath = normalized;
  notifyInstantListeners();
}

function subscribeInstantStore(listener: () => void): () => void {
  instantListeners.add(listener);
  return () => {
    instantListeners.delete(listener);
  };
}

function getInstantOverrideSnapshot(): string | null {
  return overridePath;
}

function getInstantOverrideServerSnapshot(): string | null {
  return null;
}

function lockNativeHistory(): void {
  if (typeof window === 'undefined' || typeof History === 'undefined') return;
  const w = window as AccordWindow;
  if (w.__accordHistoryGuarded) return;

  const nativePush = History.prototype.pushState.bind(window.history);
  const nativeReplace = History.prototype.replaceState.bind(window.history);
  w.__accordNativePush = nativePush;
  w.__accordNativeReplace = nativeReplace;

  try {
    Object.defineProperty(window.history, 'pushState', {
      get: () => nativePush,
      set: () => {},
      configurable: true,
    });
    Object.defineProperty(window.history, 'replaceState', {
      get: () => nativeReplace,
      set: () => {},
      configurable: true,
    });
    w.__accordHistoryGuarded = true;
  } catch {
    // Keep native bindings
  }
}

function restoreNativeHistoryPushState(): void {
  lockNativeHistory();
}

// Module-load-time guards for HMR safety & AppRouter protection
if (typeof window !== 'undefined') {
  const w = window as AccordWindow;

  // a) Lock native history pushState & replaceState
  lockNativeHistory();

  // b) Register single module-level instant-nav listener to keep store synchronized
  if (!w.__accordInstantNavListenerAttached) {
    window.addEventListener(INSTANT_NAV_EVENT, (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail.startsWith('/')) {
        setOverridePathname(detail);
      }
    });
    w.__accordInstantNavListenerAttached = true;
  }

  // c) Register capture-phase popstate listener before AppRouter mounts
  if (!w.__accordPopstateGuarded) {
    window.addEventListener(
      'popstate',
      (e: PopStateEvent) => {
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        const nextPathname = window.location.pathname;
        setOverridePathname(nextPathname);
        window.dispatchEvent(new CustomEvent(INSTANT_NAV_EVENT, { detail: nextPathname }));
      },
      true,
    );
    w.__accordPopstateGuarded = true;
  }

  // d) Wrap window.fetch once to suppress RSC network requests for shell routes
  if (!w.__accordRscFetchGuarded && typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    w.__accordNativeFetch = originalFetch;

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let urlStr = '';
      if (typeof input === 'string') {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input && typeof (input as Request).url === 'string') {
        urlStr = (input as Request).url;
      }

      let isRsc = urlStr.includes('_rsc=') || urlStr.endsWith('.rsc');
      let isPrefetch = false;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          isRsc = isRsc || init.headers.get('rsc') === '1' || init.headers.has('next-router-state-tree');
          isPrefetch = init.headers.get('next-router-prefetch') === '1';
        } else if (Array.isArray(init.headers)) {
          isRsc = isRsc || init.headers.some(([k, v]) => k.toLowerCase() === 'rsc' && v === '1');
          isPrefetch = init.headers.some(
            ([k, v]) => k.toLowerCase() === 'next-router-prefetch' && v === '1',
          );
        } else if (typeof init.headers === 'object') {
          const hdrs = init.headers as Record<string, string>;
          isRsc = isRsc || hdrs['rsc'] === '1' || hdrs['RSC'] === '1';
          isPrefetch =
            hdrs['next-router-prefetch'] === '1' || hdrs['Next-Router-Prefetch'] === '1';
        }
      }
      if (input instanceof Request) {
        isRsc = isRsc || input.headers.get('rsc') === '1';
        isPrefetch = isPrefetch || input.headers.get('next-router-prefetch') === '1';
      }

      if (isRsc && shouldSuppressAccordRscFetch(urlStr, window.location.pathname, isPrefetch)) {
        return Promise.resolve(
          new Response('{}', {
            status: 200,
            headers: { 'content-type': 'text/x-component' },
          }),
        );
      }

      return originalFetch(input, init);
    };
    w.__accordRscFetchGuarded = true;
  }
}

export function navigateFeatureInstant(href: string): void {
  if (typeof window === 'undefined' || !href || !href.startsWith('/')) return;
  const currentLayout = classifyRouteLayout(window.location.pathname);
  const targetLayout = classifyRouteLayout(href);
  if (currentLayout !== targetLayout) {
    try {
      window.location.assign(href);
      return;
    } catch {
      // JSDOM or restricted environments may not support window.location.assign navigation
    }
  }
  restoreNativeHistoryPushState();
  if (`${window.location.pathname}${window.location.search}` !== href) {
    window.history.pushState(null, '', href);
  }
  const cleanPathname = extractPathname(href);
  setOverridePathname(cleanPathname);
  window.dispatchEvent(new CustomEvent(INSTANT_NAV_EVENT, { detail: cleanPathname }));
}

export function useInstantPathname(): string {
  const nextPathname = usePathname();
  const override = useSyncExternalStore(
    subscribeInstantStore,
    getInstantOverrideSnapshot,
    getInstantOverrideServerSnapshot,
  );

  useEffect(() => {
    restoreNativeHistoryPushState();
  }, []);

  useEffect(() => {
    if (lastObservedNextPathname !== null && lastObservedNextPathname !== nextPathname) {
      setOverridePathname(null);
    }
    lastObservedNextPathname = nextPathname;
  }, [nextPathname]);

  return override ?? nextPathname;
}

export function useDeferredInstantPathname(): string {
  return useDeferredValue(useInstantPathname());
}
