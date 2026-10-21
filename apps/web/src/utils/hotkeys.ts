export type HotkeyId =
  | 'palette.toggle'
  | 'sidebar.toggle'
  | 'view.kanban'
  | 'view.table'
  | 'view.timeline'
  | 'view.calendar'
  | 'issue.new'
  | 'initiative.new'
  | 'project.new'
  | 'project.settings'
  | 'chat.toggle'
  | 'board.select-all';

export type HotkeyGroup = 'general' | 'workItems';

export type HotkeyDef = {
  id: HotkeyId;
  group: HotkeyGroup;
  combo: string;
  scope: 'global' | 'app';
  fixed?: true;
};

export const HOTKEY_GROUPS: HotkeyGroup[] = ['general', 'workItems'];

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: 'project.settings' shortcut removed from active HOTKEYS.
export const HOTKEYS: HotkeyDef[] = [
  {
    id: 'palette.toggle',
    group: 'general',
    combo: 'mod+k',
    scope: 'global',
  },
  {
    id: 'sidebar.toggle',
    group: 'general',
    combo: 'mod+b',
    scope: 'global',
    fixed: true,
  },
  { id: 'issue.new', group: 'general', combo: 'n', scope: 'app' },
  { id: 'initiative.new', group: 'general', combo: 'i', scope: 'app' },
  { id: 'project.new', group: 'general', combo: 'b', scope: 'app' },
  { id: 'chat.toggle', group: 'general', combo: 'c', scope: 'app' },
  { id: 'view.kanban', group: 'workItems', combo: '1', scope: 'app' },
  { id: 'view.table', group: 'workItems', combo: '2', scope: 'app' },
  { id: 'view.timeline', group: 'workItems', combo: '3', scope: 'app' },
  { id: 'view.calendar', group: 'workItems', combo: '4', scope: 'app' },
  {
    id: 'board.select-all',
    group: 'workItems',
    combo: 'mod+a',
    scope: 'app',
  },
];

export type HotkeyCombos = Record<HotkeyId, string>;

export const DEFAULT_COMBOS = {
  'project.settings': '',
  ...Object.fromEntries(HOTKEYS.map((h) => [h.id, h.combo])),
} as HotkeyCombos;

export function applyOverrides(
  base: HotkeyCombos,
  overrides: Record<string, string>,
): HotkeyCombos {
  const next = { ...base };
  for (const [id, combo] of Object.entries(overrides)) {
    if (id in next && id !== 'project.settings') next[id as HotkeyId] = combo;
  }
  return next;
}

type ParsedCombo = { mod: boolean; shift: boolean; alt: boolean; key: string };

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split('+');
  return {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts[parts.length - 1] ?? '',
  };
}

type KeyEventLike = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

function matchesParsed(e: KeyEventLike, c: ParsedCombo): boolean {
  const mod = e.metaKey || e.ctrlKey;
  return mod === c.mod && e.shiftKey === c.shift && e.altKey === c.alt;
}

export function matchesCombo(e: KeyEventLike, combo: string): boolean {
  if (!combo) return false;
  const c = parseCombo(combo);
  return matchesParsed(e, c) && e.key.toLowerCase() === c.key;
}

export function comboFromEvent(e: KeyEventLike): string | null {
  const key = e.key.toLowerCase();
  if (!/^[a-z0-9]$/.test(key)) return null;
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('mod');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(key);
  return parts.join('+');
}

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return (
    !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName ?? ''))
  );
}

export function formatCombo(combo: string, isMac: boolean): string {
  const c = parseCombo(combo);
  const out: string[] = [];
  if (c.mod) out.push(isMac ? '⌘' : 'Ctrl');
  if (c.shift) out.push(isMac ? '⇧' : 'Shift');
  if (c.alt) out.push(isMac ? '⌥' : 'Alt');
  out.push(c.key.toUpperCase());
  return isMac ? out.join('') : out.join('+');
}
