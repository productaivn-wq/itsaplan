import { t } from 'elysia';

import type { ThreadMatch } from './chat-history';

// Shared by every route in the domain that addresses an agent by its id. An agent
// belongs to a team, so that is where it is addressed.
export const agentParams = t.Object({
  teamId: t.Numeric(),
  agentId: t.Numeric({ description: 'Agent id from list_ai_agents.' }),
});

// The same, for the routes that act on an agent inside one project of its team: a
// chat, and a run of an internal agent.
export const projectAgentParams = t.Object({
  projectKey: t.String(),
  agentId: t.Numeric({ description: 'Agent id from list_ai_agents.' }),
});

// What started a run, in the run history and in the queue a runner drains.
export const agentRunTrigger = t.Union([
  t.Literal('mention'),
  t.Literal('delegation'),
  t.Literal('field'),
  t.Literal('schedule'),
  t.Literal('manual'),
]);

export type AgentRunTrigger = typeof agentRunTrigger.static;

// The token counts of one run, in the agent's run history and in a schedule's. Shared
// by both listings, which return the same runs under different filters.
export const runContextTokens = t.Optional(
  t.Number({
    description:
      'The tokens the last model call of this run read and wrote. Absent for a run that ' +
      'finished before this was recorded and for one whose agent reports no counts.',
  }),
);

// What the last model call of an answer read, cache included, and what it wrote, as a
// runner reports it. Left out by a command that reported nothing about it, which leaves
// the counts already stored; null where the command reports none a context size can be
// read from. Shared by the chat result and the run result, which report the same thing.
export const contextUsageBody = t.Optional(
  t.Nullable(
    t.Object({
      inputTokens: t.Integer({ minimum: 0 }),
      outputTokens: t.Integer({ minimum: 0 }),
    }),
  ),
);

// The transcript of a chat, shared by both kinds of agent: an internal agent's
// conversations are held by the runtime's memory, an external agent's by the feed its
// runner drains, and the routes serving them return these shapes either way.

// One chat thread in the history list. `cliSessionId` belongs to an external agent's
// threads, where a runner keeps the session; an internal agent runs here and has none.
// `contextTokens` is the size of the conversation's context after its last completed
// answer: absent while no answer has completed, null where the agent reports no counts
// that can be read as one.
// `favorite` is the star the caller put on the conversation. `snippet` and `match` are
// set by a search: the text around the hit, and where it was found.
export type ChatThreadSummary = {
  id: string;
  title: string | null;
  cliSessionId: string | null;
  contextTokens?: number | null;
  favorite: boolean;
  snippet?: string;
  match?: ThreadMatch;
  createdAt: string;
  updatedAt: string;
};

// Per-turn execution overrides passed from the AI Workspace / ChatPanel UI to
// internal Mastra runs and external CLI runners.
export const chatTurnOptionsBody = t.Optional(
  t.Object({
    model: t.Optional(t.Nullable(t.String({ maxLength: 120 }))),
    modelCredentialId: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
    mode: t.Optional(
      t.Nullable(
        t.Union([t.Literal('ask'), t.Literal('plan'), t.Literal('build'), t.Literal('auto')]),
      ),
    ),
    effort: t.Optional(
      t.Nullable(
        t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Literal('xhigh')]),
      ),
    ),
    thinking: t.Optional(t.Nullable(t.Boolean())),
    permissionMode: t.Optional(
      t.Nullable(t.Union([t.Literal('ask'), t.Literal('plan'), t.Literal('auto')])),
    ),
    temperature: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 2 }))),
    maxSteps: t.Optional(t.Nullable(t.Integer({ minimum: 1, maximum: 64 }))),
  }),
);

// One piece of a message, in the order the agent produced it: what it wrote, and the
// tools, reasoning traces, HITL approvals, artifacts, or subagent cards between stretches
// of text. A call carries what it was given and what it answered where those are known.
export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | {
      type: 'tool';
      toolCallId: string;
      toolName: string;
      args?: string;
      result?: string;
    }
  | {
      type: 'approval';
      approvalId: string;
      toolCallId: string;
      toolName: string;
      args?: string;
      requireSod?: boolean;
      status?: 'pending' | 'approved' | 'rejected';
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
      type: 'subagent';
      subagentId: string;
      role: string;
      task: string;
      status: 'running' | 'completed' | 'failed';
      summary?: string;
    };

// One message of a conversation. Only user and assistant turns are returned; a tool
// turn is folded into the parts of the turn that called it. `stopped` marks an answer
// the member ended part-way.
export type ChatMessageDTO = {
  id: string;
  role: 'user' | 'assistant';
  parts: ChatPart[];
  createdAt: string;
  stopped?: boolean;
};

export type ChatMessagePage = {
  items: ChatMessageDTO[];
  nextPage: number | null;
};

export type ChatThreadPage = {
  items: ChatThreadSummary[];
  nextPage: number | null;
};
