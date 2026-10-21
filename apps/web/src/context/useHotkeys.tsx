'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  applyOverrides,
  DEFAULT_COMBOS,
  HotkeyActionId,
  HotkeyMap,
} from '@/utils/hotkeys';
import {
  loadPersonalHotkeys,
  PERSONAL_HOTKEYS_EVENT,
  savePersonalHotkeys as writePersonalHotkeys,
} from '@/utils/personal-hotkeys';

interface HotkeysContextValue {
  combos: HotkeyMap;
  personal: Partial<HotkeyMap>;
  setPersonalOverride: (id: HotkeyActionId, combo: string | null) => void;
  resetPersonalOverrides: () => void;
}

const HotkeysContext = createContext<HotkeysContextValue | null>(null);

export function HotkeysProvider({ children }: { children: ReactNode }) {
  const [personal, setPersonal] = useState<Partial<HotkeyMap>>({});

  useEffect(() => {
    setPersonal(loadPersonalHotkeys());
    const onChange = () => setPersonal(loadPersonalHotkeys());
    window.addEventListener(PERSONAL_HOTKEYS_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(PERSONAL_HOTKEYS_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const combos = useMemo(
    () => applyOverrides(DEFAULT_COMBOS, personal),
    [personal],
  );

  const setPersonalOverride = useCallback((id: HotkeyActionId, combo: string | null) => {
    setPersonal((prev) => {
      const next: Partial<HotkeyMap> = { ...prev };
      if (!combo) {
        delete next[id];
      } else {
        next[id] = combo;
      }
      writePersonalHotkeys(next);
      return next;
    });
  }, []);

  const resetPersonalOverrides = useCallback(() => {
    setPersonal({});
    writePersonalHotkeys({});
  }, []);

  const value = useMemo<HotkeysContextValue>(
    () => ({ combos, personal, setPersonalOverride, resetPersonalOverrides }),
    [combos, personal, setPersonalOverride, resetPersonalOverrides],
  );

  return <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>;
}

export function useHotkeys(): HotkeysContextValue {
  const ctx = useContext(HotkeysContext);
  if (!ctx) return {
    combos: DEFAULT_COMBOS,
    personal: {},
    setPersonalOverride: () => {},
    resetPersonalOverrides: () => {},
  };
  return ctx;
}

export function useHotkeyCombo(id: HotkeyActionId): string {
  const { combos } = useHotkeys();
  return combos[id] ?? DEFAULT_COMBOS[id];
}
