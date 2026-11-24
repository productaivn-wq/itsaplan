import { useCallback, useEffect, useState } from 'react';

// Whether a collapsible section is open, remembered in localStorage under
// `storageKey`. A section starts at `defaultOpen`, and only explicit toggles are stored.
//
// The stored value is read in an effect, not in the state initializer: the
// initializer also runs during the server render, where there is no localStorage,
// and a client-only initial value would not match the server markup.
export function usePersistedOpen(storageKey: string, defaultOpen = true) {
  const [open, setOpenState] = useState(defaultOpen);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'open') setOpenState(true);
      else if (stored === 'closed') setOpenState(false);
    } catch {
      // Storage unavailable (private mode): keep defaultOpen.
    }
  }, [storageKey]);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      try {
        localStorage.setItem(storageKey, next ? 'open' : 'closed');
      } catch {
        // Ignore write failures (private mode / quota); the state still updates.
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? 'open' : 'closed');
      } catch {
        // Ignore write failures (private mode / quota); the state still updates.
      }
      return next;
    });
  }, [storageKey]);

  return { open, setOpen, toggle };
}

// Smart progressive disclosure hook for detail panels:
// starts collapsed when empty (`!hasItems`) and expanded when populated (`hasItems`),
// while respecting any explicit user toggle persisted in localStorage.
export function useSmartSectionOpen(storageKey: string, hasItems: boolean) {
  const [override, setOverride] = useState<'open' | 'closed' | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'open' || stored === 'closed') setOverride(stored);
      else setOverride(null);
    } catch {
      // Storage unavailable (private mode): derive from hasItems.
    }
  }, [storageKey]);

  const open = override === null ? hasItems : override === 'open';

  const setOpen = useCallback(
    (next: boolean) => {
      const val = next ? 'open' : 'closed';
      setOverride(val);
      try {
        localStorage.setItem(storageKey, val);
      } catch {
        // Ignore write failures.
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return { open, setOpen, toggle };
}

// Which groups of a section are closed, remembered in localStorage under
// `storageKey` as a list of group keys. When nothing has been stored yet,
// `defaultClosed` controls which secondary groups start collapsed.
export function usePersistedOpenGroups(
  storageKey: string,
  defaultClosed: readonly string[] = [],
) {
  const [closed, setClosed] = useState<string[]>(() => [...defaultClosed]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setClosed(JSON.parse(stored) as string[]);
      }
    } catch {
      // Storage unavailable or unreadable: keep defaultClosed.
    }
  }, [storageKey]);

  const toggle = useCallback(
    (key: string) => {
      setClosed((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore write failures (private mode / quota); the state still updates.
        }
        return next;
      });
    },
    [storageKey],
  );

  const openAll = useCallback(() => {
    setClosed([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([]));
    } catch {
      // Ignore write failures (private mode / quota); the state still updates.
    }
  }, [storageKey]);

  return { isOpen: (key: string) => !closed.includes(key), toggle, openAll };
}
