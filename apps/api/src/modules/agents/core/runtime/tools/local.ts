import { randomUUID } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createMappedImport } from '#modules/imports/service';
import { getCompanySettings } from '#modules/settings/service';
import { createApprovalRequest } from '../../../hitl/service';
import { searchTenantKnowledge } from '../memory';

export function resolveEffectiveRequireSod(
  requested: boolean | undefined,
  companyRequired: boolean,
): boolean {
  return Boolean(requested) || companyRequired;
}

export interface LocalToolContext {
  teamId: number;
  agentId: number;
  threadId?: string | null;
  callerUserId?: string | null;
  resolveCompanyRequireSod?: () => Promise<boolean>;
}

export function buildLocalTools(
  projectId: number,
  enabledTools: string[],
  ctx?: LocalToolContext,
): Record<string, ReturnType<typeof createTool>> {
  const enabled = new Set(enabledTools);

  const prepare_issue_import = createTool({
    id: 'prepare_issue_import',
    description:
      'Turn a file uploaded in the chat into an issue import draft: save which column of the ' +
      'file feeds which issue field ("title" required; description, priority, dueDate, labels, ' +
      'and assignee optional). Read the file first with read_chat_attachment to see its headers ' +
      'and rows. Issues are NOT created here — after saving, tell the user to review the preview ' +
      'below and end the reply with a ```issue-import fenced code block whose content is exactly ' +
      '{"importId": "<the returned id>"} so the review card renders.',
    inputSchema: z.object({
      attachmentId: z
        .string()
        .describe('The attachment id from the [file: "name" (attachment id: …)] marker.'),
      mapping: z
        .record(z.string(), z.string())
        .describe('Issue field -> column header, e.g. {"title": "Task", "dueDate": "Deadline"}.'),
    }),
    execute: async ({ attachmentId, mapping }) => {
      const draft = await createMappedImport(projectId, attachmentId, mapping);
      return {
        ok: true,
        importId: draft.id,
        status: draft.status,
        nextStep:
          'Tell the user the mapping is ready for their review, and end the reply with a ' +
          '```issue-import fenced code block containing {"importId": "' +
          draft.id +
          '"}. Nothing is created until they press Confirm.',
      };
    },
  });

  const search_project_knowledge = createTool({
    id: 'search_project_knowledge',
    description:
      'Search documents strictly inside the current project & team knowledge base. ' +
      'Always use this when the user asks about project specs, docs, policies, or decisions.',
    inputSchema: z.object({
      query: z.string().min(1).describe('Search keywords or question.'),
      limit: z.number().int().min(1).max(10).optional().describe('Max documents to return (default 5).'),
    }),
    execute: async ({ query, limit }) => {
      if (!ctx?.teamId) {
        return { hits: [], error: 'Tenant context unavailable for knowledge search.' };
      }
      const hits = await searchTenantKnowledge({
        teamId: ctx.teamId,
        projectId,
        query,
        limit: limit ?? 5,
      });
      return { hits };
    },
  });

  const emit_artifact = createTool({
    id: 'emit_artifact',
    description:
      'Render a rich interactive deliverable card (diff, code, mermaid diagram, or markdown report) ' +
      'directly in the client workspace UI.',
    inputSchema: z.object({
      kind: z.enum(['diff', 'code', 'mermaid', 'markdown']),
      title: z.string().min(1).max(120),
      content: z.string().min(1),
      language: z.string().optional(),
    }),
    execute: async ({ kind, title, content, language }) => ({
      __itsaplan_event: 'artifact' as const,
      artifactId: randomUUID(),
      kind,
      title,
      content,
      ...(language ? { language } : {}),
    }),
  });

  const request_human_approval = createTool({
    id: 'request_human_approval',
    description:
      'Create a persistent Human-in-the-Loop (HITL) approval card in the workspace before executing ' +
      'high-impact mutations or external side effects.',
    inputSchema: z.object({
      toolName: z.string().min(1).max(120),
      summary: z.string().min(1).max(500),
      payload: z.record(z.string(), z.unknown()).optional(),
      requireSod: z.boolean().optional(),
    }),
    execute: async ({ toolName, summary, payload, requireSod }) => {
      if (!ctx?.teamId || !ctx?.agentId) {
        return { error: 'Agent context required to register HITL approval request.' };
      }
      const toolCallId = randomUUID();
      const companySod = await (
        ctx.resolveCompanyRequireSod
          ? ctx.resolveCompanyRequireSod()
          : getCompanySettings()
              .then((s) => s.requireSodApproval)
              .catch(() => false)
      );
      const effectiveRequireSod = resolveEffectiveRequireSod(requireSod, companySod);
      const fullPayload = { summary, ...(payload ?? {}) };
      const row = await createApprovalRequest({
        teamId: ctx.teamId,
        projectId,
        agentId: ctx.agentId,
        threadId: ctx.threadId ?? null,
        toolCallId,
        toolName,
        kind: 'approval',
        payload: fullPayload,
        requestedByUserId: ctx.callerUserId ?? null,
        requireSod: effectiveRequireSod,
      });
      return {
        __itsaplan_event: 'approval-required' as const,
        approvalId: row.id,
        toolCallId: row.toolCallId,
        toolName: row.toolName,
        args: JSON.stringify(fullPayload),
        requireSod: row.requireSod,
        status: row.status,
      };
    },
  });

  return {
    get_current_date: createTool({
      id: 'get_current_date',
      description:
        'Get the current date and time (UTC, ISO 8601). Always call this to resolve any relative date such as today, tomorrow, next week, or a due date; never assume or guess the current date.',
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date();
        return { iso: now.toISOString(), date: now.toISOString().slice(0, 10) };
      },
    }),
    search_project_knowledge,
    emit_artifact,
    request_human_approval,
    ...(enabled.has('prepare_issue_import') ? { prepare_issue_import } : {}),
  };
}
