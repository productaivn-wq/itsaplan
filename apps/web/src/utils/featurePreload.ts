export type PreloadFeatureKey =
  | 'inbox'
  | 'timeline'
  | 'dashboards'
  | 'initiatives'
  | 'cycles'
  | 'docs'
  | 'agents'
  | 'agents/chat'
  | 'agents/schedules'
  | 'members'
  | 'directory'
  | 'vault'
  | 'open-office';

const FEATURE_LOADERS: Record<PreloadFeatureKey, () => Promise<unknown>> = {
  inbox: () => import('@/features/inbox/InboxPage'),
  timeline: () => import('@/features/work-items/components/timeline/TimelineView'),
  dashboards: () => import('@/features/dashboards/DashboardsPage'),
  initiatives: () => import('@/features/initiatives/InitiativesPage'),
  cycles: () => import('@/features/cycles/CyclesPage'),
  docs: () => import('@/features/vibe-canvas/VibeCanvasPage'),
  agents: () => import('@/features/teams/components/ai-agents/ProjectAiAgentsSection'),
  'agents/chat': () => import('@/features/ai-chat/components/ClientWorkspaceView'),
  'agents/schedules': () => import('@/features/settings/SettingsSchedulesPage'),
  members: () => import('@/features/members/MembersPage'),
  directory: () => import('@/features/directory/ProjectDirectoryView'),
  vault: () => import('@/app/[teamRef]/(shell)/[projectKey]/vault/page'),
  'open-office': () => import('@/app/[teamRef]/(shell)/[projectKey]/open-office/page'),
};

export const HOT_FEATURE_PRELOAD_KEYS: readonly PreloadFeatureKey[] = [
  'inbox',
  'timeline',
  'docs',
  'open-office',
];

export const ORDERED_FEATURE_PRELOAD_KEYS: readonly PreloadFeatureKey[] = [
  'inbox',
  'agents/chat',
  'docs',
  'open-office',
  'agents',
  'timeline',
  'dashboards',
  'initiatives',
  'cycles',
  'agents/schedules',
  'members',
  'vault',
];

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
  'onboarding',
]);

const preloadedFeatures = new Set<string>();

export function resolveFeatureKey(href: string): PreloadFeatureKey | null {
  const clean = href.split('?')[0]?.split('#')[0] ?? '';
  const segs = clean.split('/').filter(Boolean);
  if (segs.length < 3) return null;
  if (NON_TEAM_PREFIXES.has(segs[0]!)) return null;
  if (segs[1] === 'issue' || segs[1] === 'settings') return null;

  if (segs[2] === 'agents' && segs[3] === 'chat') return 'agents/chat';
  if (segs[2] === 'agents' && segs[3] === 'schedules') return 'agents/schedules';
  if (segs[2] === 'notes' || segs[2] === 'vibe') return 'docs';
  if (Object.prototype.hasOwnProperty.call(FEATURE_LOADERS, segs[2]!)) {
    return segs[2] as PreloadFeatureKey;
  }
  return null;
}

export function preloadFeatureKey(key: PreloadFeatureKey): void {
  if (preloadedFeatures.has(key)) return;
  preloadedFeatures.add(key);
  void FEATURE_LOADERS[key]().catch(() => {
    preloadedFeatures.delete(key);
  });
}

export function preloadFeatureByHref(href: string): void {
  if (!href || href === '#') return;
  const key = resolveFeatureKey(href);
  if (key) preloadFeatureKey(key);
}
