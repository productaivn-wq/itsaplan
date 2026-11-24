import account from '../../messages/en/account.json';
import aiChat from '../../messages/en/aiChat.json';
import apiKeys from '../../messages/en/apiKeys.json';
import auth from '../../messages/en/auth.json';
import common from '../../messages/en/common.json';
import cycles from '../../messages/en/cycles.json';
import dashboards from '../../messages/en/dashboards.json';
import display from '../../messages/en/display.json';
import documents from '../../messages/en/documents.json';
import filters from '../../messages/en/filters.json';
import git from '../../messages/en/git.json';
import inbox from '../../messages/en/inbox.json';
import initiatives from '../../messages/en/initiatives.json';
import invite from '../../messages/en/invite.json';
import issue from '../../messages/en/issue.json';
import issueLinks from '../../messages/en/issueLinks.json';
import mcp from '../../messages/en/mcp.json';
import members from '../../messages/en/members.json';
import meta from '../../messages/en/meta.json';
import nav from '../../messages/en/nav.json';
import newProject from '../../messages/en/newProject.json';
import notes from '../../messages/en/notes.json';
import palette from '../../messages/en/palette.json';
import permissions from '../../messages/en/permissions.json';
import projects from '../../messages/en/projects.json';
import sections from '../../messages/en/sections.json';
import shell from '../../messages/en/shell.json';
import teams from '../../messages/en/teams.json';
import updates from '../../messages/en/updates.json';
import views from '../../messages/en/views.json';
import whatsNew from '../../messages/en/whatsNew.json';
import workItems from '../../messages/en/workItems.json';
import { DEFAULT_LOCALE, type Locale } from './locales';

// SPEC-ITSAPLAN-CUT-GOD-MODE-283 & 53.ACT.592: Dead god.json & settings.json locales purged.
// Git connection components use `settings.git`, backed by git.json across all 10 locales.
// Notification preferences use `settings.notifications`, backed by account.json (`notificationPrefs`).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const god: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settings: Record<string, any> = {
  git,
  notifications: account.notificationPrefs,
  schedules: account.schedulesPrefs,
  agents: account.agentsPrefs,
  webhooks: account.webhooksPrefs,
};

const defaultMessages = {
  meta,
  auth,
  common,
  nav,
  palette,
  views,
  shell,
  sections,
  issueLinks,
  issue,
  display,
  documents,
  filters,
  git,
  workItems,
  apiKeys,
  invite,
  mcp,
  projects,
  aiChat,
  inbox,
  permissions,
  members,
  cycles,
  dashboards,
  initiatives,
  notes,
  account,
  settings,
  god,
  newProject,
  teams,
  updates,
  whatsNew,
};

export type Messages = typeof defaultMessages;

const NAMESPACES: (keyof Messages)[] = [
  'meta',
  'auth',
  'common',
  'nav',
  'palette',
  'views',
  'shell',
  'sections',
  'issueLinks',
  'issue',
  'display',
  'documents',
  'filters',
  'git',
  'workItems',
  'apiKeys',
  'invite',
  'mcp',
  'projects',
  'aiChat',
  'inbox',
  'permissions',
  'members',
  'cycles',
  'dashboards',
  'initiatives',
  'notes',
  'account',
  'newProject',
  'teams',
  'updates',
  'whatsNew',
];

const messageCache = new Map<Locale, Promise<Messages>>();

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === DEFAULT_LOCALE) return defaultMessages;

  const cached = messageCache.get(locale);
  if (cached) return cached;

  const pending = Promise.all(
    NAMESPACES.map(async (ns) => [
      ns,
      (await import(`../../messages/${locale}/${ns}.json`)).default,
    ]),
  )
    .then((translated) => {
      const merged = mergeMessages(
        defaultMessages,
        Object.fromEntries(translated),
      ) as Messages;
      return {
        ...merged,
        settings: {
          git: merged.git,
          notifications: merged.account.notificationPrefs,
          schedules: merged.account.schedulesPrefs,
          agents: merged.account.agentsPrefs,
          webhooks: merged.account.webhooksPrefs,
        },
      } as Messages;
    })
    .catch((err) => {
      messageCache.delete(locale);
      throw err;
    });

  messageCache.set(locale, pending);
  return pending;
}

type MessageTree = { [key: string]: string | MessageTree };

function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const result: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] =
      typeof value === 'object' && typeof current === 'object'
        ? mergeMessages(current, value)
        : value;
  }
  return result;
}
