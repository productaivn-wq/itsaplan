import common from '../../messages/en/common.json';
import auth from '../../messages/en/auth.json';
import sidebar from '../../messages/en/sidebar.json';
import header from '../../messages/en/header.json';
import board from '../../messages/en/board.json';
import issues from '../../messages/en/issues.json';
import filters from '../../messages/en/filters.json';
import views from '../../messages/en/views.json';
import cycles from '../../messages/en/cycles.json';
import initiatives from '../../messages/en/initiatives.json';
import dashboards from '../../messages/en/dashboards.json';
import notes from '../../messages/en/notes.json';
import documents from '../../messages/en/documents.json';
import settings from '../../messages/en/settings.json';
import teams from '../../messages/en/teams.json';
import projects from '../../messages/en/projects.json';
import members from '../../messages/en/members.json';
import invitations from '../../messages/en/invitations.json';
import account from '../../messages/en/account.json';
import onboarding from '../../messages/en/onboarding.json';
import ai from '../../messages/en/ai.json';
import commands from '../../messages/en/commands.json';
import hotkeys from '../../messages/en/hotkeys.json';
import activity from '../../messages/en/activity.json';
import setup from '../../messages/en/setup.json';
import sections from '../../messages/en/sections.json';
import errors from '../../messages/en/errors.json';
import validation from '../../messages/en/validation.json';
import meta from '../../messages/en/meta.json';
import whatsNew from '../../messages/en/whatsNew.json';
import type godType from '../../messages/en/god.json';

// God Mode i18n bundle (13.4 KB) excluded from runtime SSR payload per SPEC-ITSAPLAN-CUT-GOD-MODE-283
const god = {} as typeof godType;

export const defaultMessages = {
  common,
  auth,
  sidebar,
  header,
  board,
  issues,
  filters,
  views,
  cycles,
  initiatives,
  dashboards,
  notes,
  documents,
  settings,
  teams,
  projects,
  members,
  invitations,
  account,
  onboarding,
  ai,
  commands,
  hotkeys,
  activity,
  setup,
  sections,
  errors,
  validation,
  meta,
  whatsNew,
  god,
} as const;

export type Messages = typeof defaultMessages;

export const NAMESPACES = [
  'common',
  'auth',
  'sidebar',
  'header',
  'board',
  'issues',
  'filters',
  'views',
  'cycles',
  'initiatives',
  'dashboards',
  'notes',
  'documents',
  'settings',
  'teams',
  'projects',
  'members',
  'invitations',
  'account',
  'onboarding',
  'ai',
  'commands',
  'hotkeys',
  'activity',
  'setup',
  'sections',
  'errors',
  'validation',
  'meta',
  'whatsNew',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export async function loadMessages(locale: string): Promise<Messages> {
  if (locale === 'en') return defaultMessages;
  try {
    const entries = await Promise.all(
      NAMESPACES.map(async (ns) => {
        const mod = await import(`../../messages/${locale}/${ns}.json`);
        return [ns, mod.default] as const;
      }),
    );
    return { ...Object.fromEntries(entries), god } as unknown as Messages;
  } catch {
    return defaultMessages;
  }
}
