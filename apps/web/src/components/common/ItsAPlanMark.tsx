'use client';

import { useEffect, type SVGProps } from 'react';

export const ACCORD_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none"><rect x="2" y="2" width="60" height="60" rx="14" fill="#07080A" stroke="#222734" stroke-width="1.5"/><path d="M 49.43,20.06 L 32.0,10.0 L 14.57,20.06 L 19.98,23.19 L 32.0,16.25 L 44.02,23.19 Z M 32.0,30.88 L 24.31,26.44 L 32.0,22.0 L 39.69,26.44 Z" fill="#F4F4F0"/><path d="M 12.95,22.88 L 12.95,43.0 L 30.38,53.06 L 30.38,46.81 L 18.36,39.88 L 18.36,26.0 Z M 31.03,32.56 L 31.03,41.44 L 23.34,37.0 L 23.34,28.12 Z" fill="#B8C0CC"/><path d="M 33.62,53.06 L 51.05,43.0 L 51.05,22.88 L 45.64,26.0 L 45.64,39.88 L 33.62,46.81 Z M 32.97,32.56 L 40.66,28.12 L 40.66,37.0 L 32.97,41.44 Z" fill="#5E6878"/></svg>`;

export function enforceAccordFaviconAndSuppressNextBadge(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const applyFavicon = () => {
    try {
      const svgDataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(ACCORD_FAVICON_SVG);
      const links = document.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        links.forEach((el) => {
          const link = el as HTMLLinkElement;
          link.type = 'image/svg+xml';
          link.href = svgDataUri;
        });
      } else {
        const linkSvg = document.createElement('link');
        linkSvg.rel = 'icon';
        linkSvg.type = 'image/svg+xml';
        linkSvg.href = svgDataUri;
        document.head.appendChild(linkSvg);
      }
    } catch {
      // ignore DOM errors
    }
  };

  const suppressNextBadge = () => {
    try {
      const targets = document.querySelectorAll(
        'nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button], [data-next-badge-root], [data-next-badge], #devtools-indicator'
      );
      targets.forEach((el) => {
        const h = el as HTMLElement;
        h.style.setProperty('display', 'none', 'important');
        h.style.setProperty('visibility', 'hidden', 'important');
        h.style.setProperty('opacity', '0', 'important');
        h.style.setProperty('pointer-events', 'none', 'important');
        h.style.setProperty('width', '0', 'important');
        h.style.setProperty('height', '0', 'important');
        if (el.shadowRoot) {
          let style = el.shadowRoot.querySelector('style[data-accord-suppress]');
          if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-accord-suppress', 'true');
            style.textContent =
              ':host, * { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; width: 0 !important; height: 0 !important; }';
            el.shadowRoot.appendChild(style);
          }
        }
      });
    } catch {
      // ignore DOM errors
    }
  };

  applyFavicon();
  suppressNextBadge();

  const observer = new MutationObserver(() => {
    suppressNextBadge();
  });

  const root = document.body || document.documentElement;
  if (root) {
    observer.observe(root, { childList: true, subtree: true });
  }

  return () => observer.disconnect();
}

// The ACCORD Sovereign Isometric Monolith Primary Mark (SPEC-DESIGN-SYSTEM-LOGO-263):
// Three interlocking 120-degree (C3) isometric hexagonal armor chevrons and inner cube
// faces separated by razor-sharp negative-space channels around a central equilateral
// triangle (#F4F4F0 Titanium, #B8C0CC Platinum, #5E6878 Anodized Slate on #07080A).
// Obeys Gate GW-UIUX-01 (zero <circle>, zero <line>, zero stroke-dasharray, zero <text>).
export function AccordWordmarkSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 194 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ACCORD"
    >
      <path
        d="M 11,0 H 17 L 28,32 H 21.5 L 19,24 H 9 L 6.5,32 H 0 Z M 14,7.5 L 10.8,18.5 H 17.2 Z M 60,9 H 53.5 V 7.5 A 2,2 0 0 0 51.5,5.5 H 44.5 A 2.5,2.5 0 0 0 42,8 V 24 A 2.5,2.5 0 0 0 44.5,26.5 H 51.5 A 2,2 0 0 0 53.5,24.5 V 23 H 60 V 25 A 7,7 0 0 1 53,32 H 43 A 7,7 0 0 1 36,25 V 7 A 7,7 0 0 1 43,0 H 53 A 7,7 0 0 1 60,7 V 9 Z M 92,9 H 85.5 V 7.5 A 2,2 0 0 0 83.5,5.5 H 76.5 A 2.5,2.5 0 0 0 74,8 V 24 A 2.5,2.5 0 0 0 76.5,26.5 H 83.5 A 2,2 0 0 0 85.5,24.5 V 23 H 92 V 25 A 7,7 0 0 1 85,32 H 75 A 7,7 0 0 1 68,25 V 7 A 7,7 0 0 1 75,0 H 85 A 7,7 0 0 1 92,7 V 9 Z M 107,0 H 119 A 7,7 0 0 1 126,7 V 25 A 7,7 0 0 1 119,32 H 107 A 7,7 0 0 1 100,25 V 7 A 7,7 0 0 1 107,0 Z M 108.5,5.5 A 2.5,2.5 0 0 0 106,8 V 24 A 2.5,2.5 0 0 0 108.5,26.5 H 117.5 A 2.5,2.5 0 0 0 120,24 V 8 A 2.5,2.5 0 0 0 117.5,5.5 H 108.5 Z M 134,0 H 152 A 7,7 0 0 1 159,7 V 13 A 7,7 0 0 1 153.2,19.8 L 160.5,32 H 153.5 L 146.8,20.2 H 140 V 32 H 134 V 0 Z M 140,5.5 V 14.8 H 150.5 A 2.5,2.5 0 0 0 153,12.3 V 8 A 2.5,2.5 0 0 0 150.5,5.5 H 140 Z M 168,0 H 185 A 9,9 0 0 1 194,9 V 23 A 9,9 0 0 1 185,32 H 168 V 0 Z M 174,5.5 V 26.5 H 184.5 A 3.5,3.5 0 0 0 188,23 V 9 A 3.5,3.5 0 0 0 184.5,5.5 H 174 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <rect x="0" y="37" width="60" height="3" fill="#E5A93C" />
      <rect x="67" y="37" width="60" height="3" fill="#2AC38A" />
      <rect x="134" y="37" width="60" height="3" fill="#56C2F6" />
    </svg>
  );
}

export function ItsAPlanMark({
  className,
  ...props
}: SVGProps<SVGSVGElement> & { className?: string }) {
  useEffect(() => {
    return enforceAccordFaviconAndSuppressNextBadge();
  }, []);

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ? `ag-brand-mark ${className}` : 'ag-brand-mark'}
      data-brand="accord-sovereign-monolith"
      role="img"
      aria-label="ACCORD Sovereign Isometric Monolith"
      {...props}
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="#07080A"
        stroke="#222734"
        strokeWidth="1.5"
      />
      <path
        d="M 49.43,20.06 L 32.0,10.0 L 14.57,20.06 L 19.98,23.19 L 32.0,16.25 L 44.02,23.19 Z M 32.0,30.88 L 24.31,26.44 L 32.0,22.0 L 39.69,26.44 Z"
        fill="#F4F4F0"
      />
      <path
        d="M 12.95,22.88 L 12.95,43.0 L 30.38,53.06 L 30.38,46.81 L 18.36,39.88 L 18.36,26.0 Z M 31.03,32.56 L 31.03,41.44 L 23.34,37.0 L 23.34,28.12 Z"
        fill="#B8C0CC"
      />
      <path
        d="M 33.62,53.06 L 51.05,43.0 L 51.05,22.88 L 45.64,26.0 L 45.64,39.88 L 33.62,46.81 Z M 32.97,32.56 L 40.66,28.12 L 40.66,37.0 L 32.97,41.44 Z"
        fill="#5E6878"
      />
    </svg>
  );
}

export default ItsAPlanMark;
