'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const INSTANT_NAV_EVENT = 'accord:instant-nav';

export function navigateFeatureInstant(href: string): void {
  if (typeof window === 'undefined' || !href || !href.startsWith('/')) return;
  if (window.location.pathname !== href) {
    window.history.pushState(null, '', href);
  }
  window.dispatchEvent(new CustomEvent(INSTANT_NAV_EVENT, { detail: href }));
}

export function useInstantPathname(): string {
  const nextPathname = usePathname();
  const [overridePath, setOverridePath] = useState<string | null>(null);

  useEffect(() => {
    setOverridePath(null);
  }, [nextPathname]);

  useEffect(() => {
    const onInstantNav = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail.startsWith('/')) {
        setOverridePath(detail);
      }
    };
    const onPopState = () => {
      setOverridePath(window.location.pathname);
    };
    window.addEventListener(INSTANT_NAV_EVENT, onInstantNav);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener(INSTANT_NAV_EVENT, onInstantNav);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return overridePath ?? nextPathname;
}
