import { request } from '@/lib/api/core/client';
import type { PermissionAction, PermissionResource } from '@/lib/api/endpoints/roles';

// One member custom field an agent reacts to, with the seconds its run waits.
export interface AgentFieldTrigger {
  fieldId: number;
  delaySec: number;
}

// The same trigger as a read of an agent returns it: the field's name comes along, so
// a screen can name it without loading the project the field belongs to.
export interface AgentFieldTriggerRead extends AgentFieldTrigger {
  name: string;
}

// A project an agent works in, as its settings list them.
export interface AgentProject {
  id: number;
  key: string;
  ref: string;
  name: string;
}

// An AI agent of a team: a bot user plus its configuration. `kind` is
// 'external' (driven by an outside caller through the API) or 'internal' (run by
// the built-in runtime, so it carries provider/model/instructions/tools). Only an
// external agent has an API key: `apiKeyStart` is the non-secret prefix for display
// (null for internal), and the plaintext key is only returned once, on create and
// on regenerate.
export interface AiAgent {
  id: number;
  teamId: number;
  // The projects of the team the agent works in. One key reaches every one of them.
  projects: AgentProject[];
  userId: string;
  name: string;
  username: string;
  kind: 'external' | 'internal';
  // The integration_credential (kind 'llm') the model runs on, or null.
  modelCredentialId: number | null;
  model: string | null;
  instructions: string | null;
  tools: string[];
  temperature: number | null;
  maxSteps: number | null;
  memoryEnabled: boolean;
  memoryLastMessages: number | null;
  // Run triggers.
  triggerOnMention: boolean;
  triggerOnAssign: boolean;
  // The member custom fields that start a run when the agent is set into one, each
  // with the seconds its run waits before the agent may pick it up.
  fieldTriggers: AgentFieldTriggerRead[];
  // How long a delegation run waits before the agent may pick it up.
  delegationDelaySec: number;
  // The member who created the agent, and whose runs an 'owner'-scoped runner is
  // limited to; 'team' scope serves any member's runs.
  ownerUserId: string | null;
  runnerScope: 'owner' | 'team';
  // When the agent's runner last polled, or null while none ever has.
  lastSeenAt: string | null;
  createdAt: string;
  apiKeyStart: string | null;
  // The integration key of the model credential (the provider, e.g. "openai"), or
  // null when no credential is set.
  modelProvider: string | null;
  // How many actions the agent can take (always-on read-only plus granted mutating),
  // and how many skills and configured tools are enabled.
  actionCount: number;
  skillCount: number;
  toolCount: number;
}

// A run waits as 'pending' until a worker or a runner takes it; 'canceled' is a
// pending run ended by hand.
export type AgentRunStatus = 'pending' | 'success' | 'failed' | 'canceled';

// One row of an agent's autonomous run history. Issue-triggered runs reference an
// issue; scheduled and manual runs do not.
export interface AgentRun {
  id: number;
  status: AgentRunStatus;
  trigger: 'mention' | 'delegation' | 'field' | 'schedule' | 'manual';
  issueId: number | null;
  issueIdentifier: string | null;
  issueTitle: string | null;
  prompt: string;
  attempts: number;
  lastError: string | null;
  output: string | null;
  // What the last model call of the run read and wrote: absent for a run that finished
  // before this was recorded and for one whose agent reports no counts.
  contextTokens?: number;
  nextAttemptAt: string;
  createdAt: string;
}

export interface AgentRunPage {
  items: AgentRun[];
  nextCursor: number | null;
}

// One work-item tool from the server-side catalog. `key` is stored on the agent
// (grantable actions only); label/description are for the picker. `always` marks the
// read-only tools that are always granted and shown non-editable. `permission` is the
// cell of the role matrix the action's route asserts; absent when the route asks only
// for project membership.
export interface AgentTool {
  key: string;
  group: 'issues' | 'initiatives' | 'cycles' | 'notes' | 'project';
  label: string;
  description: string;
  always: boolean;
  permission?: [PermissionResource, PermissionAction];
}

export interface NewAiAgentInput {
  name: string;
  username: string;
  kind: 'external' | 'internal';
  modelCredentialId?: number | null;
  model?: string | null;
  instructions?: string | null;
  tools?: string[];
  temperature?: number | null;
  maxSteps?: number | null;
  memoryEnabled?: boolean;
  memoryLastMessages?: number | null;
  triggerOnMention?: boolean;
  triggerOnAssign?: boolean;
  fieldTriggers?: AgentFieldTrigger[];
  delegationDelaySec?: number;
  projectIds?: number[];
  runnerScope?: 'owner' | 'team';
}

export interface AiAgentPatch {
  name?: string;
  username?: string;
  modelCredentialId?: number | null;
  model?: string | null;
  instructions?: string | null;
  tools?: string[];
  temperature?: number | null;
  maxSteps?: number | null;
  memoryEnabled?: boolean;
  memoryLastMessages?: number | null;
  triggerOnMention?: boolean;
  triggerOnAssign?: boolean;
  fieldTriggers?: AgentFieldTrigger[];
  delegationDelaySec?: number;
  projectIds?: number[];
  runnerScope?: 'owner' | 'team';
}

// One event of a streamed agent run (mirrors the API's AgentRunEvent). `text` is a
// chunk of the answer to append; `tool-start`/`tool-end` report a capability the
// agent is using, so the UI can show what it is doing; `done` ends the run with the
// conversation thread id; `error` reports a failure that happened mid-run.
export type AgentRunEvent =
  | { type: 'text'; value: string }
  | { type: 'thinking'; value: string }
  | { type: 'tool-start'; toolCallId: string; toolName: string; args?: string }
  // An external agent's runner sends a call's arguments after the call itself, in
  // pieces; an internal agent has them all at its start.
  | { type: 'tool-args'; toolCallId: string; delta: string }
  | { type: 'tool-end'; toolCallId: string; result?: string }
  | {
      type: 'approval-required';
      approvalId: string;
      toolCallId: string;
      toolName: string;
      args?: string;
      requireSod?: boolean;
    }
  | {
      type: 'artifact';
      artifactId: string;
      kind: 'diff' | 'code' | 'mermaid' | 'markdown';
      title: string;
      content: string;
      language?: string;
    }
  | {
      type: 'subagent-spawn';
      subagentId: string;
      role: string;
      task: string;
    }
  | {
      type: 'subagent-done';
      subagentId: string;
      status: 'completed' | 'failed';
      summary?: string;
    }
  | { type: 'thread'; threadId: string }
  | { type: 'done'; threadId: string | null }
  | { type: 'error'; message: string };

export interface TeamBudgetPolicyDto {
  teamId: number;
  monthlyTokenBudget: number;
  monthlyUsdCeilingMicros: number;
  softAlertPct: number;
  hardStopEnabled: boolean;
  usage: {
    allowed: boolean;
    spentMicros: number;
    capMicros: number;
    spentTokens: number;
    tokenCap: number;
    utilizationPct: number;
    softAlertTriggered: boolean;
    hardStopped: boolean;
    reason?: string;
  };
}

export interface AgentApprovalRequestDto {
  id: string;
  teamId: number;
  projectId: number;
  agentId: number;
  threadId: string | null;
  toolCallId: string;
  toolName: string;
  kind: 'approval' | 'ask_user' | 'plan_proposal';
  payload: Record<string, unknown>;
  requestedByUserId: string | null;
  decidedByUserId: string | null;
  requireSod: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface McpConnectionDto {
  id: number;
  teamId: number;
  name: string;
  transport: 'streamable-http' | 'sse';
  endpointUrl: string;
  hasHeaders: boolean;
  enabled: boolean;
  allowedTools: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStateDto {
  projectId: number;
  state: Record<string, unknown>;
  updatedAt: string | null;
}

// AI agents: a team's bot users and their configuration. Pass projectId to list only
// the agents working in one project of the team. The plaintext key is returned only
// by create and regenerate-key, so those responses carry it alongside the agent; it
// is never part of a list/read.
export const listAiAgents = (teamId: number, projectId?: number) =>
  request<AiAgent[]>(
    `/teams/${teamId}/ai-agents${projectId != null ? `?projectId=${projectId}` : ''}`,
  );

export const ensureDefaultWorkspaceAgent = (projectKey: string) =>
  request<AiAgent>(`/projects/${projectKey}/ai-agents/ensure-default`, {
    method: 'POST',
  });

export const listAgentTools = (teamId: number) =>
  request<AgentTool[]>(`/teams/${teamId}/ai-agents/tools`);

export const createAiAgent = (teamId: number, input: NewAiAgentInput) =>
  request<{ agent: AiAgent; apiKey: string | null }>(`/teams/${teamId}/ai-agents`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateAiAgent = (teamId: number, agentId: number, patch: AiAgentPatch) =>
  request<AiAgent>(`/teams/${teamId}/ai-agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const regenerateAiAgentKey = (teamId: number, agentId: number) =>
  request<{ apiKey: string }>(`/teams/${teamId}/ai-agents/${agentId}/regenerate-key`, {
    method: 'POST',
  });

export const deleteAiAgent = (teamId: number, agentId: number) =>
  request<void>(`/teams/${teamId}/ai-agents/${agentId}`, { method: 'DELETE' });

export const listAgentRuns = (teamId: number, agentId: number, before?: number) =>
  request<AgentRunPage>(
    `/teams/${teamId}/ai-agents/${agentId}/runs?limit=25${before ? `&before=${before}` : ''}`,
  );

export const listProjectApprovals = (
  projectKey: string,
  status?: 'pending' | 'approved' | 'rejected' | 'expired',
) =>
  request<{ items: AgentApprovalRequestDto[] }>(
    `/projects/${projectKey}/ai-agents/approvals${status ? `?status=${status}` : ''}`,
  );

export const decideProjectApproval = (
  projectKey: string,
  approvalId: string,
  decision: 'approved' | 'rejected',
  note?: string | null,
) =>
  request<AgentApprovalRequestDto>(
    `/projects/${projectKey}/ai-agents/approvals/${encodeURIComponent(approvalId)}/decide`,
    {
      method: 'POST',
      body: JSON.stringify({ decision, ...(note ? { note } : {}) }),
    },
  );

export const getWorkspaceState = (projectKey: string) =>
  request<WorkspaceStateDto>(`/projects/${projectKey}/workspace-state`);

export const saveWorkspaceState = (projectKey: string, state: Record<string, unknown>) =>
  request<WorkspaceStateDto>(`/projects/${projectKey}/workspace-state`, {
    method: 'PUT',
    body: JSON.stringify({ state }),
  });

export const listTeamMcpConnections = (teamId: number) =>
  request<McpConnectionDto[]>(`/teams/${teamId}/mcp-connections`);

export const createTeamMcpConnection = (
  teamId: number,
  input: {
    name: string;
    transport?: 'streamable-http' | 'sse';
    endpointUrl: string;
    headers?: Record<string, string>;
    allowedTools?: string[];
  },
) =>
  request<McpConnectionDto>(`/teams/${teamId}/mcp-connections`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const deleteTeamMcpConnection = (teamId: number, connectionId: number) =>
  request<void>(`/teams/${teamId}/mcp-connections/${connectionId}`, { method: 'DELETE' });

export const getTeamBudgetPolicy = (teamId: number) =>
  request<TeamBudgetPolicyDto>(`/teams/${teamId}/budget-policy`);

export const updateTeamBudgetPolicy = (
  teamId: number,
  body: {
    monthlyTokenBudget: number;
    monthlyUsdCeilingMicros: number;
    softAlertPct?: number;
    hardStopEnabled: boolean;
  },
) =>
  request<TeamBudgetPolicyDto>(`/teams/${teamId}/budget-policy`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
