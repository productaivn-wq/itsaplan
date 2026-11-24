import { Elysia, t } from 'elysia';
import { mcpTool } from '#mcp/generate';
import { authContext } from '#shared/auth-context';
import { guards } from '#shared/guards';
import { accessErrors, errors } from '#shared/responses';
import {
  ProjectChannelDto,
  ProjectContactDto,
  ProjectDirectoryResponse,
  ProjectStorageLocationDto,
  upsertProjectChannelBody,
  upsertProjectContactBody,
  upsertProjectStorageLocationBody,
} from './model';
import {
  deleteProjectChannel,
  deleteProjectContact,
  deleteProjectStorageLocation,
  getProjectDirectoryScoped,
  listProjectChannels,
  listProjectContacts,
  listProjectStorageLocations,
  upsertProjectChannel,
  upsertProjectContact,
  upsertProjectStorageLocation,
} from './service';

export const directoryRoutes = new Elysia({
  name: 'directory',
  detail: { tags: ['Directory'] },
})
  .use(authContext)
  .use(guards)
  .get(
    '/projects/:projectKey/directory',
    async ({ project, query, user }) =>
      getProjectDirectoryScoped(project, user?.id, query.scope === 'all' ? 'all' : 'project'),
    {
      permission: ['work_items', 'read'],
      query: t.Object({
        scope: t.Optional(t.Union([t.Literal('project'), t.Literal('all')])),
      }),
      response: { 200: ProjectDirectoryResponse, ...accessErrors },
      detail: {
        summary: 'Get project directory (contacts, channels, groups, storing locations)',
        description:
          'Returns all configured contacts, communication channels/groups, and storing locations ' +
          '(local folders, Google Drive, git repos, knowledge bases) for the project.',
        ...mcpTool('get_project_directory'),
      },
    },
  )
  .get(
    '/projects/:projectKey/contacts',
    async ({ project }) => ({ contacts: await listProjectContacts(project.id) }),
    {
      permission: ['work_items', 'read'],
      response: { 200: t.Object({ contacts: t.Array(ProjectContactDto) }), ...accessErrors },
      detail: {
        summary: 'List project contacts',
        ...mcpTool('list_project_contacts'),
      },
    },
  )
  .get(
    '/projects/:projectKey/channels',
    async ({ project }) => ({ channels: await listProjectChannels(project.id) }),
    {
      permission: ['work_items', 'read'],
      response: { 200: t.Object({ channels: t.Array(ProjectChannelDto) }), ...accessErrors },
      detail: {
        summary: 'List project communication channels and groups',
        ...mcpTool('list_project_channels'),
      },
    },
  )
  .get(
    '/projects/:projectKey/storage-locations',
    async ({ project }) => ({ storageLocations: await listProjectStorageLocations(project.id) }),
    {
      permission: ['work_items', 'read'],
      response: {
        200: t.Object({ storageLocations: t.Array(ProjectStorageLocationDto) }),
        ...accessErrors,
      },
      detail: {
        summary: 'List project storing locations',
        description:
          'List local folders, Google Drive links, Git repositories, and knowledge base locations ' +
          'where project files and artifacts are stored.',
        ...mcpTool('list_project_storage_locations'),
      },
    },
  )
  .post(
    '/projects/:projectKey/contacts',
    async ({ project, body }) => ({
      contact: await upsertProjectContact(project.id, body, 'ui'),
    }),
    {
      permission: ['work_items', 'edit'],
      body: upsertProjectContactBody,
      response: { 200: t.Object({ contact: ProjectContactDto }), ...accessErrors, ...errors(400) },
      detail: {
        summary: 'Add or update a project contact',
        ...mcpTool('upsert_project_contact'),
      },
    },
  )
  .delete(
    '/projects/:projectKey/contacts/:externalKey',
    async ({ project, params }) => ({
      deleted: await deleteProjectContact(project.id, params.externalKey),
    }),
    {
      permission: ['work_items', 'delete'],
      response: { 200: t.Object({ deleted: t.Number() }), ...accessErrors },
      detail: {
        summary: 'Delete a project contact by externalKey',
        ...mcpTool('delete_project_contact'),
      },
    },
  )
  .post(
    '/projects/:projectKey/channels',
    async ({ project, body }) => ({
      channel: await upsertProjectChannel(project.id, body, 'ui'),
    }),
    {
      permission: ['work_items', 'edit'],
      body: upsertProjectChannelBody,
      response: { 200: t.Object({ channel: ProjectChannelDto }), ...accessErrors, ...errors(400) },
      detail: {
        summary: 'Add or update a project communication channel or group',
        ...mcpTool('upsert_project_channel'),
      },
    },
  )
  .delete(
    '/projects/:projectKey/channels/:channelId',
    async ({ project, params }) => ({
      deleted: await deleteProjectChannel(project.id, params.channelId),
    }),
    {
      permission: ['work_items', 'delete'],
      response: { 200: t.Object({ deleted: t.Number() }), ...accessErrors },
      detail: {
        summary: 'Delete a project communication channel or group by channelId',
        ...mcpTool('delete_project_channel'),
      },
    },
  )
  .post(
    '/projects/:projectKey/storage-locations',
    async ({ project, body }) => ({
      storageLocation: await upsertProjectStorageLocation(project.id, body, 'ui'),
    }),
    {
      permission: ['work_items', 'edit'],
      body: upsertProjectStorageLocationBody,
      response: {
        200: t.Object({ storageLocation: ProjectStorageLocationDto }),
        ...accessErrors,
        ...errors(400),
      },
      detail: {
        summary: 'Add or update a project storing location',
        ...mcpTool('upsert_project_storage_location'),
      },
    },
  )
  .delete(
    '/projects/:projectKey/storage-locations/:locationId',
    async ({ project, params }) => ({
      deleted: await deleteProjectStorageLocation(project.id, params.locationId),
    }),
    {
      permission: ['work_items', 'delete'],
      response: { 200: t.Object({ deleted: t.Number() }), ...accessErrors },
      detail: {
        summary: 'Delete a project storing location by locationId',
        ...mcpTool('delete_project_storage_location'),
      },
    },
  );
