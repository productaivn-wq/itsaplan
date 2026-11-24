import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:18766';
const GATEWAY_TOOL_TIMEOUT_MS = 25_000;
const GATEWAY_SCHEDULE_TIMEOUT_MS = 10_000;
const ALLOWED_LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export interface SovereignHarnessContext {
  projectKey: string;
  agentUsername: string;
  teamId: number;
  agentId: number;
  readOnly?: boolean;
}

export interface DeterministicScheduleResult {
  handled: boolean;
  status?: 'success' | 'failed';
  output?: string;
  input_tokens?: number;
  output_tokens?: number;
  provider?: string;
}

/**
 * Validates that the sovereign gateway URL uses http(s) and strictly targets a loopback host.
 */
export function assertLoopbackGatewayUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid sovereign gateway URL: ${rawUrl}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported sovereign gateway protocol: ${parsed.protocol}`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(`Sovereign gateway URL must target loopback, got: ${parsed.hostname}`);
  }
  return parsed.toString().replace(/\/+$/, '');
}

function resolveGatewayConfig(): { baseUrl: string; token: string } {
  const rawUrl = process.env.ITSAPLAN_LLM_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  const baseUrl = assertLoopbackGatewayUrl(rawUrl);
  const token = (process.env.ITSAPLAN_LLM_GATEWAY_TOKEN || '').trim();
  return { baseUrl, token };
}

async function postGatewayJson<T>(
  path: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const { baseUrl, token } = resolveGatewayConfig();
  if (!token) {
    throw new Error('ITSAPLAN_LLM_GATEWAY_TOKEN is not configured');
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const errMsg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as Record<string, unknown>).error)
        : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return data as T;
}

async function callGatewayTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    return await postGatewayJson<Record<string, unknown>>(
      `/v1/sovereign/tools/${toolName}`,
      args,
      GATEWAY_TOOL_TIMEOUT_MS,
    );
  } catch (err) {
    return {
      status: 'ERROR',
      error: err instanceof Error ? err.message : 'Sovereign gateway tool call failed',
    };
  }
}

/**
 * Queries the gateway deterministic schedule router (53.ACT.670 / 53.ACT.659) to avoid burning
 * LLM quota on deterministic health/telemetry/HUD scheduled runs.
 */
export async function tryRunDeterministicSchedule(input: {
  prompt: string;
  username: string;
  projectKey: string;
}): Promise<DeterministicScheduleResult> {
  try {
    const data = await postGatewayJson<DeterministicScheduleResult>(
      '/v1/sovereign/schedule-run',
      {
        prompt: input.prompt,
        username: input.username,
        project_key: input.projectKey,
      },
      GATEWAY_SCHEDULE_TIMEOUT_MS,
    );
    return {
      handled: Boolean(data?.handled),
      status: data?.status === 'failed' ? 'failed' : 'success',
      output: typeof data?.output === 'string' ? data.output : '',
      input_tokens: typeof data?.input_tokens === 'number' ? data.input_tokens : 0,
      output_tokens: typeof data?.output_tokens === 'number' ? data.output_tokens : 0,
      provider: typeof data?.provider === 'string' ? data.provider : undefined,
    };
  } catch {
    return { handled: false };
  }
}

/**
 * Builds Mastra tools exposing Agentic OS TaskManager, 7-Phase SOP Registry/LangGraph,
 * QualityGate/SoD, WeKnora memory, and Sovereign CLI capabilities via the loopback gateway.
 */
export function buildSovereignHarnessTools(
  ctx: SovereignHarnessContext,
): Record<string, ReturnType<typeof createTool>> {
  const sop_list_and_resolve = createTool({
    id: 'sop_list_and_resolve',
    description:
      'List all 8 Agentic OS 7-phase SOP plugins (SOP-GENERIC-7P, SOP-CODING-01, SOP-ANALYTICS-01, ' +
      'SOP-RESEARCH-01, SOP-LEGAL-01, SOP-STRATEGY-01, SOP-OPERATIONS-01, SOP-SEC-AUDIT-01) or resolve ' +
      'the exact SOP, 7-phase subtasks (P1..P7), gates, OpenJev tier route, and UTOP tier for a goal.',
    inputSchema: z.object({
      action: z
        .enum(['list', 'resolve'])
        .optional()
        .describe('Use "list" to enumerate all 8 SOPs, or "resolve" (default when goal is given).'),
      goal: z.string().optional().describe('Goal or prompt to classify into a 7-phase SOP.'),
      job_type: z
        .string()
        .optional()
        .describe('Optional explicit SOP ID or domain alias (e.g. CODING, RESEARCH, SOP-STRATEGY-01).'),
      workspace_path: z
        .string()
        .optional()
        .describe('Optional workspace root path for Tier-1/Tier-2 UTOP evaluation.'),
    }),
    execute: async (input) => callGatewayTool('sop_list_and_resolve', input),
  });

  const task_manager_query_tasks = createTool({
    id: 'task_manager_query_tasks',
    description:
      'Read-only parameterized query across Antigravity TaskManager (PostgreSQL task_manager.tasks / ' +
      'SQLite project_management.db) and ItsAPlan project issues. Always use this instead of writing raw SQL.',
    inputSchema: z.object({
      project_key: z
        .string()
        .optional()
        .describe(`Optional project key filter (e.g. "${ctx.projectKey}", "PM", "ITP").`),
      status: z.string().optional().describe('Optional status filter (e.g. todo, started, completed).'),
      priority: z.string().optional().describe('Optional priority filter (urgent, high, medium, low).'),
      query: z.string().optional().describe('Optional keyword search across task titles/descriptions.'),
      limit: z.number().int().min(1).max(50).optional().describe('Max rows to return (default 20, max 50).'),
      include_itsaplan: z
        .boolean()
        .optional()
        .describe('Whether to also include live ItsAPlan public.issue records (default true).'),
    }),
    execute: async (input) =>
      callGatewayTool('task_manager_query_tasks', {
        project_key: input.project_key ?? ctx.projectKey,
        ...input,
      }),
  });

  const sovereign_query_memory = createTool({
    id: 'sovereign_query_memory',
    description:
      'Query WeKnora long-term project memory & 5-zone local knowledge store via UC-USER-02 (`aos_query_memory`).',
    inputSchema: z.object({
      query: z.string().min(1).describe('Semantic or keyword query for WeKnora memory.'),
      limit: z.number().int().min(1).max(20).optional().describe('Max chunks to retrieve (default 5).'),
      project_code: z.string().optional().describe('Target project memory namespace (default thanb.MEM).'),
    }),
    execute: async (input) => callGatewayTool('sovereign_query_memory', input),
  });

  const sovereign_quality_gate_and_sod = createTool({
    id: 'sovereign_quality_gate_and_sod',
    description:
      'Run deterministic QualityGate (GW-QG-01, EAI >= 0.98) and Separation-of-Duties (GW-SOD-01: ' +
      'approver_id != executor_id) verification via UC-USER-07.',
    inputSchema: z.object({
      mode: z.enum(['both', 'gate', 'sod']).optional().describe('Evaluation mode (default "both").'),
      action_type: z.string().optional().describe('Action type under SoD policy (default "merge_code").'),
      executor_id: z.string().optional().describe('Executor actor identifier.'),
      approver_id: z.string().optional().describe('Independent approver actor identifier.'),
      gate_id: z.string().optional().describe('Gate identifier (default "GW-QG-01").'),
      task_id: z.string().optional().describe('Task ID being verified.'),
      goal: z.string().optional().describe('Goal text for DoD-to-proof entailment check.'),
      proof: z.string().optional().describe('Empirical verification proof output.'),
      target_path: z.string().optional().describe('Optional workspace-relative deliverable path.'),
    }),
    execute: async (input) =>
      callGatewayTool('sovereign_quality_gate_and_sod', {
        executor_id: input.executor_id ?? `@${ctx.agentUsername}`,
        ...input,
      }),
  });

  const sovereign_call_aos_tool = createTool({
    id: 'sovereign_call_aos_tool',
    description:
      'Invoke an allowlisted Agentic OS sovereign CLI function (e.g., aos_health_check, aos_list_tools, ' +
      'aos_audit_finops, aos_verify_audit_chain, aos_inspect_telemetry, search_second_brain, get_financial_runway).',
    inputSchema: z.object({
      tool_name: z.string().min(1).describe('Sovereign function name (e.g. "aos_health_check").'),
      payload: z.record(z.string(), z.unknown()).optional().describe('Optional argument dictionary.'),
      hitl_approved: z.boolean().optional().describe('Explicit human approval flag for Tier-2 operations.'),
    }),
    execute: async (input) => callGatewayTool('sovereign_call_aos_tool', input),
  });

  const readOnlyTools = {
    sop_list_and_resolve,
    task_manager_query_tasks,
    sovereign_query_memory,
    sovereign_quality_gate_and_sod,
    sovereign_call_aos_tool,
  };

  if (ctx.readOnly) {
    return readOnlyTools;
  }

  const sop_run_lifecycle_phase = createTool({
    id: 'sop_run_lifecycle_phase',
    description:
      'Execute a task through the compiled 7-Phase LangGraph StateGraph (`harness_lifecycle_graph.py`) ' +
      'via `TasksFacade.run_lifecycle_task`, returning reached phase, gate verdicts, and diagnostics.',
    inputSchema: z.object({
      goal: z.string().min(1).describe('Task goal to evaluate/execute through the 7-phase FSM.'),
      proof: z.string().optional().describe('Optional verification proof string.'),
      tier: z
        .enum(['TIER_0_READ', 'TIER_1_MUTATION', 'TIER_2_DESTRUCTIVE'])
        .optional()
        .describe('Execution authority tier (default TIER_1_MUTATION).'),
      workspace_root: z.string().optional().describe('Optional workspace root override.'),
    }),
    execute: async (input) => callGatewayTool('sop_run_lifecycle_phase', input),
  });

  const task_manager_dispatch_kahn_wbs = createTool({
    id: 'task_manager_dispatch_kahn_wbs',
    description:
      'Resolve the 7-phase SOP for a milestone/task, build a Kahn DAG wave schedule via `TasksFacade.dispatch`, ' +
      'and persist/sync the task + DoD contract via `aos_submit_task` (TaskManager <-> ItsAPlan).',
    inputSchema: z.object({
      title: z.string().min(1).describe('Task title.'),
      goal: z.string().optional().describe('Detailed 4-block goal statement.'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Task priority.'),
      project_code: z
        .string()
        .optional()
        .describe(`Target project code (default "thanb.${ctx.projectKey}").`),
      job_type: z.string().optional().describe('Optional SOP/job type override (e.g. CODING, STRATEGY).'),
      subtasks: z.array(z.string()).optional().describe('Optional explicit ordered subtask list.'),
      dod_items: z.array(z.string()).optional().describe('Optional explicit DoD-1..N items.'),
    }),
    execute: async (input) =>
      callGatewayTool('task_manager_dispatch_kahn_wbs', {
        project_code: input.project_code ?? `thanb.${ctx.projectKey}`,
        ...input,
      }),
  });

  const task_manager_sync_status = createTool({
    id: 'task_manager_sync_status',
    description:
      'Synchronize `task.md` <-> SQLite or update 7-phase subtask checkmarks via `aos_sync_task_status` ' +
      '(defaults to dry_run=true).',
    inputSchema: z.object({
      project_key: z.string().optional().describe('Project key (default "53PM").'),
      task_id: z.string().optional().describe('Task ID when updating phase checkmarks.'),
      phases: z.array(z.number().int().min(1).max(7)).optional().describe('Phase numbers 1..7 to update.'),
      checkmark: z.string().optional().describe('Checkmark token ("[x]", "[/]", "[ ]").'),
      dry_run: z.boolean().optional().describe('Dry-run preview mode (default true).'),
    }),
    execute: async (input) => callGatewayTool('task_manager_sync_status', input),
  });

  return {
    ...readOnlyTools,
    sop_run_lifecycle_phase,
    task_manager_dispatch_kahn_wbs,
    task_manager_sync_status,
  };
}
