import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  agentApprovalRequest,
  db,
  project as projectTable,
  projectChannel,
  projectContact,
  projectMember,
  projectSetting,
  projectStorageLocation,
  team,
} from '@repo/db';
import { iso } from '#shared/lib';

export interface AccessiblePortfolioProject {
  id: number;
  key: string;
  name: string;
  teamId: number;
  teamSlug: string | null;
  ref: string;
}

export interface PortfolioUpdateItem {
  id: string;
  kind: 'issue' | 'document' | 'agent_run' | 'metric';
  projectId: number;
  projectKey: string;
  projectName: string;
  projectRef: string;
  title: string;
  summary: string;
  actorName: string | null;
  status: string | null;
  entityId: number;
  issueSeq: number | null;
  createdAt: string;
}

function extractRows(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === 'object' && Array.isArray((res as { rows?: unknown[] }).rows)) {
    return (res as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
}

function toIso(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function resolveAccessiblePortfolioProjects(
  userId: string,
): Promise<AccessiblePortfolioProject[]> {
  const memberRows = await db
    .select({
      id: projectTable.id,
      key: projectTable.key,
      name: projectTable.name,
      teamId: projectTable.teamId,
      teamSlug: team.slug,
    })
    .from(projectMember)
    .innerJoin(projectTable, eq(projectTable.id, projectMember.projectId))
    .innerJoin(team, eq(team.id, projectTable.teamId))
    .where(eq(projectMember.userId, userId))
    .orderBy(asc(projectTable.key));

  const baseRows =
    memberRows.length > 0
      ? memberRows
      : await db
          .select({
            id: projectTable.id,
            key: projectTable.key,
            name: projectTable.name,
            teamId: projectTable.teamId,
            teamSlug: team.slug,
          })
          .from(projectTable)
          .innerJoin(team, eq(team.id, projectTable.teamId))
          .where(eq(projectTable.teamId, 1))
          .orderBy(asc(projectTable.key));

  return baseRows.map((p) => ({
    ...p,
    ref: `${p.teamSlug ?? p.teamId}.${p.key}`,
  }));
}

export async function getPortfolioDirectory(userId: string, projectKeyFilter?: string) {
  const accessible = await resolveAccessiblePortfolioProjects(userId);
  const normFilter = projectKeyFilter?.trim().toUpperCase();
  const targetProjects = normFilter
    ? accessible.filter((p) => p.key.toUpperCase() === normFilter)
    : accessible;

  const allIds = accessible.map((p) => p.id);
  const targetIds = targetProjects.map((p) => p.id);
  const projById = new Map(accessible.map((p) => [p.id, p]));

  const [allContacts, allChannels, allLocations, syncSettingRows, activityRes] = await Promise.all([
    allIds.length > 0
      ? db
          .select()
          .from(projectContact)
          .where(inArray(projectContact.projectId, allIds))
          .orderBy(asc(projectContact.projectId), asc(projectContact.id))
      : Promise.resolve([]),
    allIds.length > 0
      ? db
          .select()
          .from(projectChannel)
          .where(inArray(projectChannel.projectId, allIds))
          .orderBy(asc(projectChannel.projectId), asc(projectChannel.id))
      : Promise.resolve([]),
    allIds.length > 0
      ? db
          .select()
          .from(projectStorageLocation)
          .where(inArray(projectStorageLocation.projectId, allIds))
          .orderBy(desc(projectStorageLocation.isPrimary), asc(projectStorageLocation.id))
      : Promise.resolve([]),
    allIds.length > 0
      ? db
          .select({ updatedAt: projectSetting.updatedAt })
          .from(projectSetting)
          .where(eq(projectSetting.key, 'directory_sync_meta'))
          .orderBy(desc(projectSetting.updatedAt))
          .limit(1)
      : Promise.resolve([]),
    allIds.length > 0
      ? db.execute(sql`
          SELECT p.id AS project_id,
                 GREATEST(
                   (SELECT MAX(i.updated_at) FROM public.issue i WHERE i.project_id = p.id AND i.archived_at IS NULL),
                   (SELECT MAX(pd.updated_at) FROM public.project_document pd WHERE pd.project_id = p.id AND pd.archived_at IS NULL),
                   (SELECT MAX(COALESCE(ar.finished_at, ar.created_at)) FROM public.agent_run ar WHERE ar.project_id = p.id)
                 ) AS last_activity_at
          FROM public.project p
          WHERE p.id IN (${sql.join(allIds.map((id) => sql`${id}`), sql`, `)})
        `)
      : Promise.resolve([] as Record<string, unknown>[]),
  ]);

  const lastActivityByProjId = new Map<number, string | null>();
  for (const row of extractRows(activityRes)) {
    const pid = Number(row.project_id);
    if (!Number.isInteger(pid) || pid <= 0) continue;
    lastActivityByProjId.set(pid, row.last_activity_at != null ? toIso(row.last_activity_at) : null);
  }

  const cCounts = new Map<number, number>();
  const chCounts = new Map<number, number>();
  const locCounts = new Map<number, number>();
  for (const c of allContacts) cCounts.set(c.projectId, (cCounts.get(c.projectId) ?? 0) + 1);
  for (const ch of allChannels) chCounts.set(ch.projectId, (chCounts.get(ch.projectId) ?? 0) + 1);
  for (const loc of allLocations) locCounts.set(loc.projectId, (locCounts.get(loc.projectId) ?? 0) + 1);

  const attachMeta = <T extends { projectId: number }>(row: T) => {
    const meta = projById.get(row.projectId);
    return {
      ...row,
      projectKey: meta?.key ?? '',
      projectName: meta?.name ?? '',
      projectRef: meta?.ref ?? '',
    };
  };

  const targetIdSet = new Set(targetIds);
  const contacts = allContacts.filter((c) => targetIdSet.has(c.projectId)).map(attachMeta);
  const channels = allChannels.filter((ch) => targetIdSet.has(ch.projectId)).map(attachMeta);
  const groups = channels.filter((c) => c.threadType.toUpperCase() === 'GROUP');
  const storageLocations = allLocations
    .filter((l) => targetIdSet.has(l.projectId))
    .map(attachMeta);
  const allGroupsCount = allChannels.filter((c) => c.threadType.toUpperCase() === 'GROUP').length;

  const projectsSummary = accessible
    .map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      ref: p.ref,
      contactsCount: cCounts.get(p.id) ?? 0,
      channelsCount: chCounts.get(p.id) ?? 0,
      storageLocationsCount: locCounts.get(p.id) ?? 0,
      lastActivityAt: lastActivityByProjId.get(p.id) ?? null,
    }))
    .sort((a, b) => {
      const aMs = a.lastActivityAt ? Date.parse(a.lastActivityAt) : Number.NEGATIVE_INFINITY;
      const bMs = b.lastActivityAt ? Date.parse(b.lastActivityAt) : Number.NEGATIVE_INFINITY;
      const aHas = Number.isFinite(aMs);
      const bHas = Number.isFinite(bMs);
      if (aHas && bHas && bMs !== aMs) return bMs - aMs;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.key.localeCompare(b.key);
    });

  return {
    scope: normFilter ? 'project' : 'all',
    contacts,
    channels,
    groups,
    storageLocations,
    counts: {
      contacts: contacts.length,
      channels: channels.length,
      groups: groups.length,
      storageLocations: storageLocations.length,
    },
    portfolioCounts: {
      contacts: allContacts.length,
      channels: allChannels.length,
      groups: allGroupsCount,
      storageLocations: allLocations.length,
      projects: projectsSummary.filter(
        (p) => p.contactsCount > 0 || p.channelsCount > 0 || p.storageLocationsCount > 0,
      ).length,
    },
    projects: projectsSummary,
    lastSyncedAt: syncSettingRows[0]?.updatedAt?.toISOString() ?? null,
  };
}

export async function getPortfolioUpdates(
  userId: string,
  opts: {
    projectKey?: string;
    days?: number;
    perProject?: number;
    limit?: number;
    kinds?: Set<string>;
  } = {},
) {
  const accessible = await resolveAccessiblePortfolioProjects(userId);
  const normFilter = opts.projectKey?.trim().toUpperCase();
  const targetProjects = normFilter
    ? accessible.filter((p) => p.key.toUpperCase() === normFilter)
    : accessible;

  const days = Math.min(30, Math.max(1, Math.trunc(opts.days ?? 7)));
  const perProject = Math.min(20, Math.max(1, Math.trunc(opts.perProject ?? 5)));
  const limit = Math.min(500, Math.max(1, Math.trunc(opts.limit ?? 250)));
  const allowedKinds =
    opts.kinds && opts.kinds.size > 0
      ? opts.kinds
      : new Set(['issue', 'document', 'agent_run', 'metric']);

  const safeIds = targetProjects.map((p) => Number(p.id)).filter((id) => Number.isInteger(id) && id > 0);
  if (safeIds.length === 0) {
    return {
      items: [] as PortfolioUpdateItem[],
      counts: { issue: 0, document: 0, agent_run: 0, metric: 0, total: 0 },
      projectCounts: {} as Record<string, number>,
      coveredProjectsCount: 0,
      totalProjectsCount: accessible.length,
      days,
    };
  }

  const projById = new Map(accessible.map((p) => [p.id, p]));
  const idsSql = sql.join(
    safeIds.map((id) => sql`${id}`),
    sql`, `,
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [issueRes, docRes, runRes, metricRes] = await Promise.all([
    allowedKinds.has('issue')
      ? db.execute(sql`
          SELECT id, project_id, issue_id, issue_seq, title, action, actor_name, created_at
          FROM (
            SELECT ia.id, i.project_id, i.id AS issue_id, i.sequence_number AS issue_seq,
                   i.title, COALESCE(ia.action, ia.kind) AS action, ia.actor_name, ia.created_at,
                   ROW_NUMBER() OVER (PARTITION BY i.project_id ORDER BY ia.created_at DESC, ia.id DESC) AS rn
            FROM public.issue_activity ia
            JOIN public.issue i ON i.id = ia.issue_id
            WHERE i.project_id IN (${idsSql})
              AND i.archived_at IS NULL
              AND ia.created_at >= ${since}
          ) t
          WHERE rn <= ${perProject}
          ORDER BY created_at DESC
        `)
      : Promise.resolve([] as Record<string, unknown>[]),
    allowedKinds.has('document')
      ? db.execute(sql`
          SELECT id, project_id, document_id, title, version, created_at
          FROM (
            SELECT r.id, pd.project_id, r.document_id, r.title, r.version, r.created_at,
                   ROW_NUMBER() OVER (PARTITION BY pd.project_id ORDER BY r.created_at DESC, r.id DESC) AS rn
            FROM public.project_document_revision r
            JOIN public.project_document pd ON pd.id = r.document_id
            WHERE pd.project_id IN (${idsSql})
              AND pd.archived_at IS NULL
              AND r.created_at >= ${since}
          ) t
          WHERE rn <= ${perProject}
          ORDER BY created_at DESC
        `)
      : Promise.resolve([] as Record<string, unknown>[]),
    allowedKinds.has('agent_run')
      ? db.execute(sql`
          SELECT id, project_id, issue_id, issue_seq, issue_title, status, trigger, created_at
          FROM (
            SELECT ar.id, ar.project_id, ar.issue_id, i.sequence_number AS issue_seq,
                   i.title AS issue_title, ar.status, ar.trigger,
                   COALESCE(ar.finished_at, ar.created_at) AS created_at,
                   ROW_NUMBER() OVER (PARTITION BY ar.project_id ORDER BY COALESCE(ar.finished_at, ar.created_at) DESC, ar.id DESC) AS rn
            FROM public.agent_run ar
            LEFT JOIN public.issue i ON i.id = ar.issue_id
            WHERE ar.project_id IN (${idsSql})
              AND COALESCE(ar.finished_at, ar.created_at) >= ${since}
          ) t
          WHERE rn <= ${perProject}
          ORDER BY created_at DESC
        `)
      : Promise.resolve([] as Record<string, unknown>[]),
    allowedKinds.has('metric')
      ? db.execute(sql`
          SELECT id, project_id, metric_id, metric_name, value, unit, status, created_at
          FROM (
            SELECT s.id, s.project_id, s.metric_id, m.name AS metric_name, s.value, m.unit,
                   s.status, s.recorded_at AS created_at,
                   ROW_NUMBER() OVER (PARTITION BY s.project_id ORDER BY s.recorded_at DESC, s.id DESC) AS rn
            FROM public.project_watched_metric_sample s
            JOIN public.project_watched_metric m ON m.id = s.metric_id
            WHERE s.project_id IN (${idsSql})
              AND s.recorded_at >= ${since}
          ) t
          WHERE rn <= ${perProject}
          ORDER BY created_at DESC
        `)
      : Promise.resolve([] as Record<string, unknown>[]),
  ]);

  const items: PortfolioUpdateItem[] = [];
  for (const r of extractRows(issueRes)) {
    const pid = Number(r.project_id);
    const meta = projById.get(pid);
    if (!meta) continue;
    const seq = r.issue_seq != null ? Number(r.issue_seq) : null;
    items.push({
      id: `update:issue:${String(r.id)}`,
      kind: 'issue',
      projectId: pid,
      projectKey: meta.key,
      projectName: meta.name,
      projectRef: meta.ref,
      title: String(r.title || `${meta.key}-${seq ?? r.issue_id}`),
      summary: `Issue ${meta.key}-${seq ?? r.issue_id} · ${String(r.action || 'updated')}`,
      actorName: typeof r.actor_name === 'string' ? r.actor_name : null,
      status: typeof r.action === 'string' ? r.action : null,
      entityId: Number(r.issue_id),
      issueSeq: seq,
      createdAt: toIso(r.created_at),
    });
  }
  for (const r of extractRows(docRes)) {
    const pid = Number(r.project_id);
    const meta = projById.get(pid);
    if (!meta) continue;
    items.push({
      id: `update:doc:${String(r.id)}`,
      kind: 'document',
      projectId: pid,
      projectKey: meta.key,
      projectName: meta.name,
      projectRef: meta.ref,
      title: String(r.title || 'Document updated'),
      summary: `Document revision v${String(r.version ?? 1)}`,
      actorName: null,
      status: `v${String(r.version ?? 1)}`,
      entityId: Number(r.document_id),
      issueSeq: null,
      createdAt: toIso(r.created_at),
    });
  }
  for (const r of extractRows(runRes)) {
    const pid = Number(r.project_id);
    const meta = projById.get(pid);
    if (!meta) continue;
    const seq = r.issue_seq != null ? Number(r.issue_seq) : null;
    items.push({
      id: `update:run:${String(r.id)}`,
      kind: 'agent_run',
      projectId: pid,
      projectKey: meta.key,
      projectName: meta.name,
      projectRef: meta.ref,
      title: String(r.issue_title || `Agent run #${String(r.id)}`),
      summary: `Agent run (${String(r.trigger || 'manual')}) · ${String(r.status || 'completed')}`,
      actorName: 'AI Agent',
      status: typeof r.status === 'string' ? r.status : null,
      entityId: r.issue_id != null ? Number(r.issue_id) : Number(r.id),
      issueSeq: seq,
      createdAt: toIso(r.created_at),
    });
  }
  for (const r of extractRows(metricRes)) {
    const pid = Number(r.project_id);
    const meta = projById.get(pid);
    if (!meta) continue;
    const unit = typeof r.unit === 'string' && r.unit ? ` ${r.unit}` : '';
    items.push({
      id: `update:metric:${String(r.id)}`,
      kind: 'metric',
      projectId: pid,
      projectKey: meta.key,
      projectName: meta.name,
      projectRef: meta.ref,
      title: String(r.metric_name || 'Watched Metric'),
      summary: `Sample ${String(r.value)}${unit} · ${String(r.status || 'OK')}`,
      actorName: 'Metrics Watcher',
      status: typeof r.status === 'string' ? r.status : null,
      entityId: Number(r.metric_id),
      issueSeq: null,
      createdAt: toIso(r.created_at),
    });
  }

  items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const sliced = items.slice(0, limit);
  const counts = { issue: 0, document: 0, agent_run: 0, metric: 0, total: sliced.length };
  const projectCounts: Record<string, number> = {};
  for (const item of sliced) {
    counts[item.kind] += 1;
    projectCounts[item.projectKey] = (projectCounts[item.projectKey] ?? 0) + 1;
  }

  return {
    items: sliced,
    counts,
    projectCounts,
    coveredProjectsCount: Object.keys(projectCounts).length,
    totalProjectsCount: accessible.length,
    days,
  };
}

export async function getPortfolioApprovals(userId: string, status = 'pending') {
  const accessible = await resolveAccessiblePortfolioProjects(userId);
  const projById = new Map(accessible.map((p) => [p.id, p]));
  const ids = accessible.map((p) => p.id);
  if (ids.length === 0) return [];

  const rows = await db
    .select()
    .from(agentApprovalRequest)
    .where(inArray(agentApprovalRequest.projectId, ids))
    .orderBy(desc(agentApprovalRequest.createdAt))
    .limit(100);

  return rows
    .filter((r) => !status || r.status === status)
    .map((r) => {
      const meta = projById.get(r.projectId);
      return {
        id: r.id,
        teamId: r.teamId,
        projectId: r.projectId,
        projectKey: meta?.key ?? 'PM',
        projectName: meta?.name ?? 'Project',
        projectRef: meta?.ref ?? `${r.teamId}.PM`,
        agentId: r.agentId,
        threadId: r.threadId,
        toolCallId: r.toolCallId,
        toolName: r.toolName,
        kind: r.kind,
        payload: r.payload,
        requestedByUserId: r.requestedByUserId,
        decidedByUserId: r.decidedByUserId,
        requireSod: r.requireSod,
        status: r.status,
        decisionNote: r.decisionNote,
        createdAt: iso(r.createdAt),
        decidedAt: r.decidedAt ? iso(r.decidedAt) : null,
      };
    });
}
