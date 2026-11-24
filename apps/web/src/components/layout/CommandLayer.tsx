'use client';

import { useEffect, useState } from 'react';
import CommandLayerContent, {
  type CommandLayerProps,
} from '@/components/layout/CommandLayerContent';

// Pre-warms the command palette during idle time after mount so ⌘K opens in <50ms,
// while still keeping initial Shell mount free of command-building overhead.
export default function CommandLayer(props: CommandLayerProps) {
  const [hasOpened, setHasOpened] = useState(props.open);

  useEffect(() => {
    if (props.open) {
      setHasOpened(true);
      return;
    }
    if (hasOpened) return;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setHasOpened(true), { timeout: 250 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setHasOpened(true), 150);
    return () => clearTimeout(timer);
  }, [props.open, hasOpened]);

  return hasOpened ? <CommandLayerContent {...props} /> : null;
}
