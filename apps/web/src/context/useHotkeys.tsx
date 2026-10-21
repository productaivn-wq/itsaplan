'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAccountPreferences } from '@/services/preferences.service';
import {
  applyOverrides,
  DEFAULT_COMBOS,
  formatCombo,
  matchesCombo,
  type HotkeyCombos,
  type HotkeyId,
} from '@/utils/hotkeys';

// SPEC-ITSAPLAN-CUT-GOD-MODE-283: Instance-wide God Mode hotkey overrides are removed.
const HotkeysCtx = createContext<HotkeyCombos>(DEFAULT_COMBOS);

export function HotkeysProvider({ children }: { children: ReactNode }) {
  const { hotkeys: personal } = useAccountPreferences();

  const combos = useMemo(() => applyOverrides(DEFAULT_COMBOS, personal), [personal]);

  return <HotkeysCtx.Provider value={combos}>{children}</HotkeysCtx.Provider>;
}

export function useHotkeyCombos(): HotkeyCombos {
  return useContext(HotkeysCtx);
}

export function useHotkeyMatch() {
  const combos = useHotkeyCombos();
  return useMemo(() => (e: KeyboardEvent, id: HotkeyId) => matchesCombo(e, combos[id]), [combos]);
}

export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent));
  }, []);
  return isMac;
}

export function useHotkeyFormatter(): (id: HotkeyId) => string | null {
  const combos = useHotkeyCombos();
  const isMac = useIsMac();
  return useMemo(
    () => (id: HotkeyId) => (combos[id] ? formatCombo(combos[id], isMac) : null),
    [combos, isMac],
  );
}

export function useHotkeyLabel(id: HotkeyId): string | null {
  return useHotkeyFormatter()(id);
}
