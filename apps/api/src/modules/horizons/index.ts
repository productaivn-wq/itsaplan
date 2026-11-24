import { Elysia, t } from 'elysia';
import { Database } from 'bun:sqlite';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { db, initiative, cycle, issue } from '@repo/db';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { authContext } from '#shared/auth-context';
import { guards } from '#shared/guards';

function resolveSqlitePath(): string {
  if (process.env.PM_SQLITE_DB_PATH) return process.env.PM_SQLITE_DB_PATH;
  const sevenUp = path.resolve(import.meta.dir, '../../../../../../../data/project_management.db');
  if (existsSync(sevenUp)) return sevenUp;
  return path.resolve(import.meta.dir, '../../../../../../data/project_management.db');
}

function safeAll<T = Record<string, unknown>>(
  sqlite: Database | null,
  querySql: string,
  params: (string | number | null)[] = [],
): T[] {
  if (!sqlite) return [];
  try {
    return sqlite.query(querySql).all(...params) as T[];
  } catch {
    return [];
  }
}

const SCOPING_FIELDS = [
  'project_id',
  'project_key',
  'bmc_model_id',
  'goal_id',
  'kbq_id',
  'objective_id',
  'kr_id',
  'model_id',
  'capability_id',
  'gap_id',
  'epic_id',
  'milestone_id',
] as const;

function matchesProjectScope(row: Record<string, unknown>, pKey: string): boolean {
  const excludedTokens = [
    '53_PROJECT_MANAGEMENT',
    'GOAL-53',
    ...(pKey !== 'DXAIX' ? ['DXAIX'] : []),
    ...(pKey !== 'SOLO' ? ['SOLO'] : []),
  ];

  const values: string[] = [];
  for (const field of SCOPING_FIELDS) {
    const raw = row[field];
    if (raw !== null && raw !== undefined) {
      const str = String(raw).trim().toUpperCase();
      if (str) values.push(str);
    }
  }

  for (const val of values) {
    for (const bad of excludedTokens) {
      if (val.includes(bad)) return false;
    }
  }

  return values.some(
    (val) =>
      val === pKey ||
      val.startsWith(`${pKey}-`) ||
      val.includes(`-${pKey}-`) ||
      val.endsWith(`-${pKey}`),
  );
}

function scopeRows<T extends Record<string, unknown>>(rows: T[], pKey: string): T[] {
  if (pKey === 'PM' || pKey === '53PM') return rows;
  return rows.filter((row) => matchesProjectScope(row, pKey));
}

const SQLITE_HORIZONS_TTL_MS = 15_000;

interface SqliteHorizonsSnapshot {
  ts: number;
  rawGoals: Record<string, unknown>[];
  rawKbqs: Record<string, unknown>[];
  rawObjectives: Record<string, unknown>[];
  rawKeyResults: Record<string, unknown>[];
  rawBmc: Record<string, unknown>[];
  rawCapabilities: Record<string, unknown>[];
  rawGaps: Record<string, unknown>[];
  rawEpics: Record<string, unknown>[];
  rawMilestones: Record<string, unknown>[];
  approvalsByProject: Map<string, Record<string, unknown>[]>;
}

let sqliteHorizonsCache: SqliteHorizonsSnapshot | null = null;

function readSqliteHorizons(sqlitePath: string, pKey: string) {
  const now = Date.now();
  if (sqliteHorizonsCache && now - sqliteHorizonsCache.ts < SQLITE_HORIZONS_TTL_MS) {
    return {
      ...sqliteHorizonsCache,
      approvalRows: sqliteHorizonsCache.approvalsByProject.get(pKey) ?? [],
    };
  }

  let rawGoals: Record<string, unknown>[] = [];
  let rawKbqs: Record<string, unknown>[] = [];
  let rawObjectives: Record<string, unknown>[] = [];
  let rawKeyResults: Record<string, unknown>[] = [];
  let rawBmc: Record<string, unknown>[] = [];
  let rawCapabilities: Record<string, unknown>[] = [];
  let rawGaps: Record<string, unknown>[] = [];
  let rawEpics: Record<string, unknown>[] = [];
  let rawMilestones: Record<string, unknown>[] = [];
  const approvalsByProject = new Map<string, Record<string, unknown>[]>();

  if (existsSync(sqlitePath)) {
    const sqlite = new Database(sqlitePath, { readonly: true });
    try {
      rawGoals = safeAll(sqlite, 'SELECT * FROM strategic_goals');
      rawKbqs = safeAll(sqlite, 'SELECT * FROM key_business_questions');
      rawObjectives = safeAll(sqlite, 'SELECT * FROM measurable_objectives');
      rawKeyResults = safeAll(sqlite, 'SELECT * FROM key_results');
      rawBmc = safeAll(sqlite, 'SELECT * FROM bmc_models');
      rawCapabilities = safeAll(sqlite, 'SELECT * FROM enterprise_capabilities');
      rawGaps = safeAll(sqlite, 'SELECT * FROM capability_gaps');
      rawEpics = safeAll(sqlite, 'SELECT * FROM epics');
      rawMilestones = safeAll(sqlite, 'SELECT * FROM project_milestones');
      for (const row of safeAll(sqlite, 'SELECT * FROM horizon_gate_approvals')) {
        const key = String(row.project_key ?? '').toUpperCase();
        if (!key) continue;
        const list = approvalsByProject.get(key) ?? [];
        list.push(row);
        approvalsByProject.set(key, list);
      }
    } finally {
      sqlite.close();
    }
  }

  sqliteHorizonsCache = {
    ts: now,
    rawGoals,
    rawKbqs,
    rawObjectives,
    rawKeyResults,
    rawBmc,
    rawCapabilities,
    rawGaps,
    rawEpics,
    rawMilestones,
    approvalsByProject,
  };

  return {
    ...sqliteHorizonsCache,
    approvalRows: approvalsByProject.get(pKey) ?? [],
  };
}

export const horizonRoutes = new Elysia({
  name: 'horizons',
  detail: { tags: ['Horizons'] },
})
  .use(authContext)
  .use(guards)
  .get(
    '/projects/:projectKey/horizons',
    async ({ project }) => {
      const pKey = project.key.toUpperCase();
      const sqlitePath = resolveSqlitePath();

      const {
        rawGoals,
        rawKbqs,
        rawObjectives,
        rawKeyResults,
        rawBmc,
        rawCapabilities,
        rawGaps,
        rawEpics,
        rawMilestones,
        approvalRows,
      } = readSqliteHorizons(sqlitePath, pKey);

      const h1_goals = scopeRows(rawGoals, pKey);
      const h2_kbqs = scopeRows(rawKbqs, pKey);
      const h3_objectives = scopeRows(rawObjectives, pKey);
      const key_results = scopeRows(rawKeyResults, pKey);
      const h4_bmc = scopeRows(rawBmc, pKey);
      const h5_capabilities = scopeRows(rawCapabilities, pKey);
      const h6_gaps = scopeRows(rawGaps, pKey);
      const h7_epics = scopeRows(rawEpics, pKey);
      const milestones = scopeRows(rawMilestones, pKey);

      const [initiatives, cycles, issueCounts, activeIssues] = await Promise.all([
        db.select().from(initiative).where(eq(initiative.projectId, project.id)),
        db.select().from(cycle).where(eq(cycle.projectId, project.id)),
        db
          .select({
            isSubtask: sql<boolean>`(${issue.parentId} IS NOT NULL)`,
            count: sql<number>`count(*)::int`,
          })
          .from(issue)
          .where(and(eq(issue.projectId, project.id), isNull(issue.archivedAt)))
          .groupBy(sql`(${issue.parentId} IS NOT NULL)`),
        db
          .select({
            id: issue.id,
            projectId: issue.projectId,
            sequenceNumber: issue.sequenceNumber,
            parentId: issue.parentId,
            columnId: issue.columnId,
            title: issue.title,
            priority: issue.priority,
            startDate: issue.startDate,
            dueDate: issue.dueDate,
            position: issue.position,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            archivedAt: issue.archivedAt,
          })
          .from(issue)
          .where(and(eq(issue.projectId, project.id), isNull(issue.archivedAt)))
          .orderBy(desc(issue.updatedAt))
          .limit(200),
      ]);

      const active_tasks = activeIssues.filter((i) => i.parentId === null);
      const active_subtasks = activeIssues.filter((i) => i.parentId !== null);
      let totalTasksCount = active_tasks.length;
      let totalSubtasksCount = active_subtasks.length;
      if (issueCounts.length > 0) {
        totalTasksCount = 0;
        totalSubtasksCount = 0;
        for (const row of issueCounts) {
          if (row.isSubtask) totalSubtasksCount += Number(row.count);
          else totalTasksCount += Number(row.count);
        }
      }

      const approvals: Record<string, Record<string, unknown>> = {};
      for (const row of approvalRows) {
        const nodeId = row.node_id ? String(row.node_id) : '';
        if (nodeId) approvals[nodeId] = row;
      }

      return {
        projectKey: project.key,
        projectId: project.id,
        h1_goals,
        h2_kbqs,
        h3_objectives,
        key_results,
        h4_bmc,
        h5_capabilities,
        h6_gaps,
        h7_epics,
        milestones,
        initiatives,
        cycles,
        active_tasks,
        active_subtasks,
        approvals,
        summary_counts: {
          h1: h1_goals.length || initiatives.length,
          h2: h2_kbqs.length,
          h3: h3_objectives.length,
          h4: h4_bmc.length,
          h5: h5_capabilities.length,
          h6: h6_gaps.length,
          h7: h7_epics.length,
          milestones: milestones.length,
          tasks: totalTasksCount,
          subtasks: totalSubtasksCount,
        },
      };
    },
    {
      projectMember: true,
      detail: {
        summary: 'Get 7-Horizon cascade & active execution items',
        description:
          'Returns scoped H1-H7 SQLite artifacts, gate approvals, and active PostgreSQL initiatives, cycles, tasks, and subtasks.',
      },
    },
  )
  .post(
    '/projects/:projectKey/horizons/approve',
    ({ project, body, set }) => {
      const { nodeId, decision, approverId, executorId, comment } = (body ?? {}) as {
        nodeId?: string;
        decision?: string;
        approverId?: string;
        executorId?: string | null;
        comment?: string | null;
      };

      if (
        !nodeId ||
        !approverId ||
        (executorId &&
          String(approverId).trim().toLowerCase() === String(executorId).trim().toLowerCase())
      ) {
        set.status = 403;
        return {
          ok: false,
          error: 'GW-SOD-01 Violation: approver_id must differ from executor_id',
        };
      }

      const pKey = project.key.toUpperCase();
      const approvedAt = new Date().toISOString();
      const finalDecision = decision || 'APPROVED';
      const sqlitePath = resolveSqlitePath();

      if (!existsSync(sqlitePath)) {
        set.status = 503;
        return {
          ok: false,
          error: 'Local PM SQLite store unavailable in standalone deployment',
        };
      }

      const sqlite = new Database(sqlitePath);
      sqliteHorizonsCache = null;
      try {
        sqlite.run(
          `CREATE TABLE IF NOT EXISTS horizon_gate_approvals (
            project_key TEXT NOT NULL,
            node_id TEXT NOT NULL,
            decision TEXT NOT NULL,
            approver_id TEXT NOT NULL,
            executor_id TEXT,
            comment TEXT,
            approved_at TEXT NOT NULL,
            PRIMARY KEY (project_key, node_id)
          )`,
        );
        sqlite
          .query('INSERT OR REPLACE INTO horizon_gate_approvals VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(
            pKey,
            nodeId,
            finalDecision,
            approverId,
            executorId ?? null,
            comment ?? null,
            approvedAt,
          );
      } finally {
        sqlite.close();
      }

      return {
        ok: true,
        projectKey: project.key,
        nodeId,
        decision: finalDecision,
        approverId,
        executorId: executorId || null,
        approvedAt,
      };
    },
    {
      projectMember: true,
      body: t.Object({
        nodeId: t.Optional(t.String()),
        decision: t.Optional(t.String()),
        approverId: t.Optional(t.String()),
        executorId: t.Optional(t.Nullable(t.String())),
        comment: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        summary: 'Approve or reject a Horizon gate with GW-SOD-01 enforcement',
      },
    },
  );
