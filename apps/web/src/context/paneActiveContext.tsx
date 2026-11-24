'use client';

import { createContext, useContext, type ReactNode } from 'react';

const PaneActiveCtx = createContext<boolean>(true);

export function PaneActiveProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return <PaneActiveCtx.Provider value={active}>{children}</PaneActiveCtx.Provider>;
}

export function useIsPaneActive(): boolean {
  return useContext(PaneActiveCtx);
}
