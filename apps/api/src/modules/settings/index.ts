import { Elysia } from 'elysia';
import { requireUser } from '#shared/access';
import { authContext } from '#shared/auth-context';
import { errors } from '#shared/responses';
import { HttpError } from '#shared/lib';
import { mcpTool } from '#mcp/generate';
import { getStorageSettings } from '@repo/db';
import {
  canManageCompany,
  getCompanySettings,
  getHotkeySettings,
  getProjectDefaults,
  setCompanySettings,
  setProjectDefaults,
} from './service';
import { getAppVersion } from './updates';
import { getWhatsNew, markWhatsNewSeen } from './whats-new';
import {
  CompanySettingsSchema,
  HotkeyCombosSchema,
  ProjectDefaultsSchema,
  StorageSettingsSchema,
  UpdateCompanySettingsBody,
  VersionResponse,
  WhatsNewSchema,
} from './model';

// Routes for global instance settings (app_setting): a key-value store not scoped
// to a project. The MCP toggle is per-project (see modules/projects), not here.
//
// Storage limits are readable by any signed-in user, because the upload UI shows
// them before a file is picked. Changing them is god mode (/god/storage-settings).
export const settingsRoutes = new Elysia({
  name: 'settings',
  detail: { tags: ['Settings'] },
})
  .use(authContext)
  .get(
    '/settings/company',
    ({ user }) => {
      requireUser(user);
      return getCompanySettings();
    },
    {
      response: { 200: CompanySettingsSchema, ...errors(401) },
      detail: {
        summary: 'Get company settings',
        description: 'Read organization identity and agentic governance guardrails.',
        ...mcpTool('get_company_settings'),
      },
    },
  )
  .put(
    '/settings/company',
    async ({ body, user }) => {
      const current = requireUser(user);
      if (!(await canManageCompany(current))) {
        throw new HttpError(403, 'Only a company or team owner can update company settings');
      }
      return setCompanySettings(body, current.id);
    },
    {
      body: UpdateCompanySettingsBody,
      response: { 200: CompanySettingsSchema, ...errors(400, 401, 403) },
      detail: {
        summary: 'Configure company settings',
        description:
          'Initialize or update company profile, domain, locale, autonomy tier, and SoD guardrails.',
        ...mcpTool('setup_company'),
      },
    },
  )
  .get(
    '/settings/project-defaults',
    ({ user }) => {
      requireUser(user);
      return getProjectDefaults();
    },
    {
      response: { 200: ProjectDefaultsSchema, ...errors(401) },
      detail: {
        summary: 'Get instance project defaults',
        description: 'Read default MCP reachability applied to newly created projects.',
      },
    },
  )
  .put(
    '/settings/project-defaults',
    async ({ body, user }) => {
      const current = requireUser(user);
      if (!(await canManageCompany(current))) {
        throw new HttpError(403, 'Only a company or team owner can update project defaults');
      }
      return setProjectDefaults(body);
    },
    {
      body: ProjectDefaultsSchema,
      response: { 200: ProjectDefaultsSchema, ...errors(400, 401, 403) },
      detail: {
        summary: 'Update instance project defaults',
        description: 'Set default MCP reachability for newly created projects.',
      },
    },
  )
  .get('/settings/storage', () => getStorageSettings(), {
    response: { 200: StorageSettingsSchema, ...errors(401) },
    detail: {
      summary: 'Get storage limits',
      description: 'Get the instance upload limits the UI shows before a file is picked.',
    },
  })

  .get('/settings/hotkeys', () => getHotkeySettings(), {
    response: { 200: HotkeyCombosSchema, ...errors(401) },
    detail: {
      summary: 'Get instance keyboard shortcuts',
      description:
        'Get the keyboard shortcut overrides that apply to everyone on this instance. Every signed-in user reads them; changing them is god mode.',
    },
  })

  // The running version, shown in the sidebar to everyone. Whether a newer one
  // exists is god mode (/god/updates), and so is the release history. A session is
  // required: the version tells an anonymous visitor which release to look up
  // vulnerabilities for.
  .get('/settings/version', () => ({ version: getAppVersion() }), {
    response: { 200: VersionResponse, ...errors(401) },
    detail: {
      summary: 'Get the running version',
      description: 'Get the version of the app this instance runs.',
    },
  })

  // What the running release brought, plus — for the instance owner — the
  // pre-migration database dump and what the migrations did to the instance's data.
  // The notes come from the release feed merged over the shipped changelog; the feed
  // is cached, so a session rarely waits on it.
  .get('/settings/whats-new', ({ user }) => getWhatsNew(requireUser(user)), {
    response: { 200: WhatsNewSchema, ...errors(401) },
    detail: {
      summary: "Get the release's what's-new screen",
      description:
        "Get the running release's notes and, for an administrator, the backup taken before its migrations and the report of what they changed. `pending` is false once this user has closed the screen for this version.",
    },
  })

  .post(
    '/settings/whats-new/seen',
    async ({ user }) => {
      await markWhatsNewSeen(requireUser(user).id);
      return { version: getAppVersion() };
    },
    {
      response: { 200: VersionResponse, ...errors(401) },
      detail: {
        summary: "Close the what's-new screen",
        description: 'Record that this user has seen the screen for the running version.',
      },
    },
  );
