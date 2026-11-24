import { useEffect, useRef, type RefObject } from 'react';

function px(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Observes a widget's header and intrinsic body wrapper (`bodyContentRef`) and
 * reports the total pixel height needed to display the widget without an
 * internal scrollbar. Only the header and non-flex-1 body wrapper are observed
 * so grid-assigned height never feeds back into the measurement.
 */
export function useWidgetContentHeight({
  enabled,
  sectionRef,
  headerRef,
  bodyContentRef,
  onHeightChange,
}: {
  enabled: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  headerRef: RefObject<HTMLElement | null>;
  bodyContentRef: RefObject<HTMLElement | null>;
  onHeightChange?: (heightPx: number) => void;
}): void {
  const callbackRef = useRef(onHeightChange);
  callbackRef.current = onHeightChange;
  const lastReportedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastReportedRef.current = null;
      return;
    }

    const section = sectionRef.current;
    const header = headerRef.current;
    const bodyContent = bodyContentRef.current;
    if (!section || !header || !bodyContent) return;

    let frame = 0;

    const measure = () => {
      const bodyRect = bodyContent.getBoundingClientRect();
      if (bodyRect.width === 0) return;

      const sectionStyle = getComputedStyle(section);
      const headerStyle = getComputedStyle(header);
      const sectionChrome =
        px(sectionStyle.paddingTop) +
        px(sectionStyle.paddingBottom) +
        px(sectionStyle.borderTopWidth) +
        px(sectionStyle.borderBottomWidth);
      const headerHeight =
        header.getBoundingClientRect().height +
        px(headerStyle.marginTop) +
        px(headerStyle.marginBottom);
      const totalHeight = Math.ceil(sectionChrome + headerHeight + bodyRect.height);

      if (totalHeight > 0 && totalHeight !== lastReportedRef.current) {
        lastReportedRef.current = totalHeight;
        callbackRef.current?.(totalHeight);
      }
    };

    const scheduleMeasure = () => {
      if (typeof requestAnimationFrame === 'undefined') {
        measure();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame);
      };
    }

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(header);
    observer.observe(bodyContent);

    return () => {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enabled, sectionRef, headerRef, bodyContentRef]);
}
