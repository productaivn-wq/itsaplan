import {
  getSetting,
  setSetting,
  STORAGE_SETTING_KEY,
  getStorageSettings,
  type StorageSettings,
} from '@repo/db';
import { HttpError } from '#shared/lib';
import { listTeams } from '#modules/teams/service';

export const COMPANY_SETTING_KEY = 'company';

export type AutonomyTier = 'TIER_0' | 'TIER_1' | 'TIER_2';

export interface CompanySettings {
  companyName: string;
  legalName: string;
  slug: string;
  domain: string;
  industry: string;
  timezone: string;
  defaultLocale: string;
  defaultAutonomyTier: AutonomyTier;
  requireSodApproval: boolean;
  allowAgentTeamBootstrap: boolean;
  onboardingCompleted: boolean;
  updatedByUserId: string | null;
  updatedAt: string | null;
}

export function defaultCompanySettings(): CompanySettings {
  return {
    companyName: 'Agentic Workspace',
    legalName: '',
    slug: 'workspace',
    domain: '',
    industry: '',
    timezone: 'Asia/Ho_Chi_Minh',
    defaultLocale: 'en',
    defaultAutonomyTier: 'TIER_1',
    requireSodApproval: true,
    allowAgentTeamBootstrap: true,
    onboardingCompleted: false,
    updatedByUserId: null,
    updatedAt: null,
  };
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const stored = await getSetting<Partial<CompanySettings>>(COMPANY_SETTING_KEY);
  return { ...defaultCompanySettings(), ...(stored ?? {}) };
}

export async function canManageCompany(user: { id: string; role?: string | null }): Promise<boolean> {
  if (user.role === 'god') return true;
  const teams = await listTeams(user.id);
  return teams.some((t) => t.role === 'owner');
}

export async function setCompanySettings(
  patch: Partial<CompanySettings>,
  userId: string,
): Promise<CompanySettings> {
  if (patch.companyName !== undefined) {
    if (!patch.companyName.trim()) {
      throw new HttpError(400, 'Company name is required');
    }
  }
  if (patch.slug !== undefined) {
    if (!/^[a-z][a-z0-9-]{1,39}$/.test(patch.slug)) {
      throw new HttpError(400, 'Invalid company slug');
    }
  }
  if (patch.domain !== undefined && patch.domain.trim() !== '') {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(patch.domain.trim())) {
      throw new HttpError(400, 'Invalid company domain');
    }
  }
  if (patch.defaultAutonomyTier !== undefined) {
    if (!['TIER_0', 'TIER_1', 'TIER_2'].includes(patch.defaultAutonomyTier)) {
      throw new HttpError(400, 'Invalid autonomy tier');
    }
  }

  const current = await getCompanySettings();
  const next: CompanySettings = {
    ...current,
    ...patch,
    companyName: patch.companyName !== undefined ? patch.companyName.trim() : current.companyName,
    slug: patch.slug !== undefined ? patch.slug.trim() : current.slug,
    domain: patch.domain !== undefined ? patch.domain.trim() : current.domain,
    legalName: patch.legalName !== undefined ? patch.legalName.trim() : current.legalName,
    industry: patch.industry !== undefined ? patch.industry.trim() : current.industry,
    timezone: patch.timezone !== undefined ? patch.timezone.trim() : current.timezone,
    defaultLocale: patch.defaultLocale !== undefined ? patch.defaultLocale.trim() : current.defaultLocale,
    updatedByUserId: userId,
    updatedAt: new Date().toISOString(),
  };

  next.onboardingCompleted =
    patch.onboardingCompleted ?? Boolean(next.companyName.trim() && next.slug.trim());

  await setSetting(COMPANY_SETTING_KEY, next);
  return next;
}

// The instance settings kept in app_setting: the upload limits and the keyboard
// shortcuts.

// Instance-wide upload limits (app_setting key 'storage'). getStorageSettings/
// mimeAllowed/MB/StorageSettings live in @repo/db (packages/db/src/domains/storage.ts) —
// the worker checks an imported Plane attachment against the same limits. This module
// keeps only the write side: the limits are set in the database and edited in god mode,
// there is no env var for them.
export async function setStorageSettings(
  patch: Partial<StorageSettings>,
): Promise<StorageSettings> {
  const next = { ...(await getStorageSettings()), ...patch };
  // Types are matched case-insensitively; store them normalized so the settings UI
  // shows what is actually applied.
  next.attachmentMimeTypes = [
    ...new Set(next.attachmentMimeTypes.map((m) => m.trim().toLowerCase()).filter(Boolean)),
  ];
  await setSetting(STORAGE_SETTING_KEY, next);
  return next;
}

// Instance-wide project defaults (app_setting key 'projects'): what a newly
// created project starts with. Only the defaults live here — every one of them
// stays editable per project afterwards, so this decides the starting value and
// nothing else.

const PROJECT_DEFAULTS_SETTING_KEY = 'projects';

export interface ProjectDefaults {
  // Whether a new project starts reachable over MCP. Off by default (fail-closed):
  // teams explicitly opt in projects that external MCP clients should reach. This is a
  // visibility default, not an access grant — a project still only appears to a
  // member holding a key, exactly as it does today.
  mcpEnabled: boolean;
}

function defaultProjectDefaults(): ProjectDefaults {
  return { mcpEnabled: false };
}

export async function getProjectDefaults(): Promise<ProjectDefaults> {
  const stored = await getSetting<Partial<ProjectDefaults>>(PROJECT_DEFAULTS_SETTING_KEY);
  // Merge over the default so a value written before a field was added stays valid.
  return { ...defaultProjectDefaults(), ...(stored ?? {}) };
}

export async function setProjectDefaults(
  patch: Partial<ProjectDefaults>,
): Promise<ProjectDefaults> {
  const next = { ...(await getProjectDefaults()), ...patch };
  await setSetting(PROJECT_DEFAULTS_SETTING_KEY, next);
  return next;
}

// The instance keyboard shortcuts (app_setting key 'hotkeys'): the combination
// each command is bound to for everyone on this instance. Only the bindings
// changed in god mode are stored; the web app fills the rest from its built-in
// defaults, then applies the user's own overrides on top (user_preference.hotkeys).

const HOTKEYS_SETTING_KEY = 'hotkeys';

export type HotkeyCombos = Record<string, string>;

export async function getHotkeySettings(): Promise<HotkeyCombos> {
  return (await getSetting<HotkeyCombos>(HOTKEYS_SETTING_KEY)) ?? {};
}

// Replaces the stored map. The god screen sends the full set of overrides, so an
// unbound command is one left out rather than one written as empty.
export async function setHotkeySettings(combos: HotkeyCombos): Promise<HotkeyCombos> {
  await setSetting(HOTKEYS_SETTING_KEY, combos);
  return combos;
}
