import { randomUUID } from 'node:crypto';
import { Agent, type AgentExecutionOptions } from '@mastra/core/agent';
import { getAgentInProject, getInternalAgentApiKey, type AiAgentRow } from '../service';
import { getProjectById } from '#modules/projects/service';
import { getProjectDirectory } from '#modules/directory/service';
import { getCredentialSecret } from '../../integrations/service';
import { listAgentSkills } from '../../skills/service';
import { listAgentToolsForRun } from '../../tools/service';
import { buildCustomTools } from './tools/custom-tools';
import { buildRouteTools } from './tools/route-tools';
import { buildLocalTools } from './tools/local';
import { buildSkillTool, skillsPreamble } from './skill-runtime';
import { buildMemory, ensureThread, DEFAULT_LAST_MESSAGES } from './memory';
import { buildMultimodalPromptInput } from './attachments';
import { toolArgsText, toolText } from '../../chat-parts';
import { recordContextUsage, appendUsageLedger, evaluateTeamBudget, type ContextUsage } from '../../chat-usage';
import { buildOutboundMcpTools } from './tools/mcp-tools';
import { assertLoopbackGatewayUrl, buildSovereignHarnessTools } from './tools/sovereign-harness';
import { isChatThreadId, newChatThreadId } from './thread-ids';
import { errorMessage } from '../helpers/errors';
import { projectDirectoryPreamble, projectPreamble } from '../prompt/framing';
import { resolveSlashCommand } from '../prompt/slash-commands';
import {
  buildModeAndEffortPreamble,
  buildProviderThinkingOptions,
  filterToolsForPermissionMode,
  isReadOnlyTurn,
  isSafeModelId,
  type ChatTurnOptions,
} from '../prompt/run-options';
import { HttpError } from '#shared/lib';

// Runtime execution of internal agents via Mastra. An agent is built on demand
// from its stored configuration (provider/model/instructions) and run against a
// prompt. It is given the work-item system tools for the project the run works in
// (see tools/route-tools), so it can read and manage that project's issues, comments,
// labels, custom field values, and attachments — acting as its own bot user, plus a
// read_skill tool for any skills enabled on it. An agent works in several projects of
// its team, so the project comes from the run, never from the agent.
//
// The model is addressed through Mastra's model router: the credential the agent's
// team stores for the provider is decrypted and its key passed to the model config.

// Default OpenAI mini model used when an OpenAI agent has no model set.
const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_INSTRUCTIONS = "You are a helpful assistant that manages this project's work items.";
// Upper bound on the agent's tool-use loop when the agent has no maxSteps set.
const DEFAULT_MAX_STEPS = 24;

// Mastra's model config: an object carrying the provider id, model id, and the
// explicit apiKey (and url for OpenAI-compatible endpoints).
type ModelConfig = {
  providerId: string;
  modelId: string;
  apiKey: string;
  url?: string;
  headers?: Record<string, string>;
};

// Builds the model config for an agent from its model credential (or an explicit
// per-turn override). The credential's integration key is the provider id; its decrypted
// config carries the apiKey and an optional base URL. OpenCode Go rejects a request
// without an x-opencode-session header, which has to stay the same across one conversation.
async function resolveModel(
  row: AiAgentRow,
  sessionId: string,
  turnOptions?: ChatTurnOptions,
): Promise<ModelConfig> {
  const credentialId = turnOptions?.modelCredentialId ?? row.modelCredentialId;
  if (credentialId == null) {
    const rawGatewayUrl = (process.env.ITSAPLAN_LLM_GATEWAY_URL || '').trim();
    const gatewayToken = (process.env.ITSAPLAN_LLM_GATEWAY_TOKEN || '').trim();
    if (rawGatewayUrl && gatewayToken) {
      const gatewayRoot = assertLoopbackGatewayUrl(rawGatewayUrl);
      const gatewayBaseUrl = gatewayRoot.endsWith('/v1') ? gatewayRoot : `${gatewayRoot}/v1`;
      if (typeof turnOptions?.model === 'string') {
        const trimmed = turnOptions.model.trim();
        if (trimmed.length > 0 && !isSafeModelId(trimmed)) {
          throw new HttpError(400, 'Invalid model identifier');
        }
      }
      const overrideModel = turnOptions?.model?.trim();
      const modelId =
        (overrideModel && overrideModel.length > 0 ? overrideModel : null) ??
        row.model ??
        'agentic-os/antigravity';
      return {
        providerId: 'openai-compatible',
        modelId,
        apiKey: gatewayToken,
        url: gatewayBaseUrl,
      };
    }
    throw new HttpError(400, 'Agent has no model credential set');
  }
  const secret = await getCredentialSecret(credentialId, row.teamId);
  if (!secret) throw new HttpError(400, "Agent's model credential not found");
  const provider = secret.integrationKey;
  if (typeof turnOptions?.model === 'string') {
    const trimmed = turnOptions.model.trim();
    if (trimmed.length > 0 && !isSafeModelId(trimmed)) {
      throw new HttpError(400, 'Invalid model identifier');
    }
  }
  const overrideModel = turnOptions?.model?.trim();
  const modelId =
    (overrideModel && overrideModel.length > 0 ? overrideModel : null) ??
    row.model ??
    (provider === 'openai' ? DEFAULT_MODEL : null);
  if (!modelId) {
    throw new HttpError(400, `Agent has no model set for provider "${provider}"`);
  }
  const baseUrl = secret.config.baseUrl ? String(secret.config.baseUrl) : null;
  return {
    providerId: provider,
    modelId,
    apiKey: String(secret.config.apiKey ?? ''),
    ...(baseUrl ? { url: baseUrl } : {}),
    ...(provider === 'opencode-go' ? { headers: { 'x-opencode-session': sessionId } } : {}),
  };
}

// One event of a streamed agent run, sent to the caller as it happens. `text` is
// a chunk of the answer to append; `tool-start`/`tool-end` report a capability the
// agent is using (so the UI can show what it is doing); `done` closes the stream
// and carries the conversation thread id; `error` reports a failure mid-stream.
export type AgentRunEvent =
  | { type: 'text'; value: string }
  | { type: 'thinking'; value: string }
  | { type: 'tool-start'; toolCallId: string; toolName: string; args?: string }
  | { type: 'tool-end'; toolCallId: string; toolName: string; result?: string }
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
  | { type: 'thread'; threadId: string }
  | { type: 'done'; threadId: string | null }
  | { type: 'error'; message: string };

async function buildAgent(
  row: AiAgentRow,
  projectId: number,
  contextPreamble: string,
  sessionId: string,
  callerUserId?: string,
  turnOptions?: ChatTurnOptions,
): Promise<{ agent: Agent; model: ModelConfig }> {
  const project = await getProjectById(projectId);
  if (!project) throw new HttpError(404, 'Project not found');
  const model = await resolveModel(row, sessionId, turnOptions);
  const effectiveTools = filterToolsForPermissionMode(row.tools, turnOptions);
  const readOnly = isReadOnlyTurn(turnOptions);
  const [skills, customTools, mcpTools, apiKey, directory] = await Promise.all([
    listAgentSkills(row.id),
    readOnly ? Promise.resolve([]) : listAgentToolsForRun(row.id),
    readOnly ? Promise.resolve({}) : buildOutboundMcpTools(row.id, row.teamId),
    getInternalAgentApiKey(row),
    getProjectDirectory(projectId),
  ]);
  const instructions =
    projectPreamble(project) +
    projectDirectoryPreamble(directory) +
    contextPreamble +
    (row.instructions ?? DEFAULT_INSTRUCTIONS) +
    skillsPreamble(skills);
  const agent = new Agent({
    id: `ai-agent-${row.id}`,
    name: row.name,
    instructions,
    model,
    // The agent acts as its own bot user, in the project of this run. Route tools call
    // the real API with its key, so its role applies; get_current_date is the one
    // tool with no route; read_skill loads any enabled skills on demand; custom tools
    // are the external integrations configured on the team and enabled here.
    tools: {
      ...buildRouteTools(project, apiKey, effectiveTools),
      ...buildLocalTools(projectId, effectiveTools, {
        teamId: row.teamId,
        agentId: row.id,
        threadId: sessionId,
        callerUserId: callerUserId ?? null,
      }),
      ...(skills.length > 0 ? buildSkillTool(row.teamId, skills) : {}),
      ...buildCustomTools(customTools),
      ...mcpTools,
      ...buildSovereignHarnessTools({
        projectKey: project.key,
        agentUsername: row.username,
        teamId: row.teamId,
        agentId: row.id,
        readOnly,
      }),
    },
    // Conversation memory (last N messages of a thread) when enabled.
    ...(row.memoryEnabled
      ? { memory: buildMemory(row.memoryLastMessages ?? DEFAULT_LAST_MESSAGES) }
      : {}),
  });
  return { agent, model };
}

// Runs the internal agent identified by agentId in the given project against the
// prompt and returns the generated text with the counts of the last model call it
// took. Throws 404 if the agent does not work in that project and 400 if it is an
// external agent (which carries no model config).
//
// When the agent has memory enabled, the run participates in a conversation
// thread: threadId identifies the conversation (a new one is created when omitted)
// and the caller (callerUserId) owns it. The thread id used is returned so the
// caller can continue the conversation; it is null when memory is off.
export async function runAgent(
  agentId: number,
  projectId: number,
  prompt: string,
  opts: RunOpts,
): Promise<{ text: string; threadId: string | null; usage: ContextUsage | null }> {
  const { agent, row, options, threadId, effectiveProvider, effectiveModel } = await prepareRun(
    agentId,
    projectId,
    prompt,
    opts,
  );
  const modelInput = await buildMultimodalPromptInput(projectId, prompt, opts.attachmentIds);
  const result = await agent.generate(modelInput as Parameters<Agent['generate']>[0], {
    ...options,
    abortSignal: opts.abortSignal,
  });
  const usage = contextOf(result.usage);
  // A chat thread keeps one number, replaced by each answer. An autonomous run keeps
  // the counts of that run instead, on its own row, so its caller stores them.
  if (threadId && isChatThreadId(threadId)) await recordContextUsage(threadId, row.id, usage);
  if (usage) {
    await appendUsageLedger({
      teamId: row.teamId,
      projectId,
      agentId: row.id,
      threadId,
      userId: opts.callerUserId,
      provider: effectiveProvider,
      model: effectiveModel,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch(() => {});
  }
  return { text: (result.text ?? '').trim(), threadId, usage };
}

// What the model reported about the last call of an answer, as the pair the chat keeps.
// Mastra's counts already hold the tokens read from cache inside `inputTokens`, so they
// are taken as they are. Null for a model that reports none, which the chat shows as a
// dash.
function contextOf(usage: ModelUsage | undefined): ContextUsage | null {
  if (usage?.inputTokens == null) return null;
  return { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens ?? 0 };
}

type ModelUsage = { inputTokens?: number; outputTokens?: number };

// Streams the internal agent's response as it is produced. Yields text chunks and
// the tool calls the agent makes, then a final `done` with the thread id (see
// AgentRunEvent). Same preconditions and memory/thread handling as runAgent. A
// failure raised while streaming is yielded as an `error` event rather than thrown,
// so a caller consuming the stream sees it inline and the stream still ends.
//
// `signal` is the request's: aborting it ends the model call and the tool loop, so a
// reader that goes away — by pressing stop or by closing the chat — does not leave the
// run going. An aborted run yields nothing further, not an error: it ended as asked.
export async function* streamAgent(
  agentId: number,
  projectId: number,
  prompt: string,
  opts: RunOpts,
  signal?: AbortSignal,
): AsyncGenerator<AgentRunEvent> {
  try {
    const { agent, row, options, threadId, effectiveProvider, effectiveModel } = await prepareRun(
      agentId,
      projectId,
      prompt,
      opts,
    );
    if (threadId) {
      yield { type: 'thread', threadId };
    }
    const modelInput = await buildMultimodalPromptInput(projectId, prompt, opts.attachmentIds);
    const result = await agent.stream(modelInput as Parameters<Agent['stream']>[0], {
      ...options,
      abortSignal: signal,
    });
    // The size of the context is what the last call of the answer read, so each step
    // replaces the one before it rather than being added to it.
    let usage: ModelUsage | undefined;
    for await (const chunk of result.fullStream) {
      const chunkType = chunk.type as string;
      if (chunkType === 'reasoning-delta') {
        const deltaText = (chunk as unknown as { payload?: { text?: string } }).payload?.text;
        if (deltaText) yield { type: 'thinking', value: deltaText };
        continue;
      }
      switch (chunk.type) {
        case 'step-finish':
          usage = chunk.payload.output.usage;
          break;
        case 'text-delta':
          if (chunk.payload.text) yield { type: 'text', value: chunk.payload.text };
          break;
        case 'tool-call':
          yield {
            type: 'tool-start',
            toolCallId: chunk.payload.toolCallId,
            toolName: chunk.payload.toolName,
            args: toolArgsText(chunk.payload.args),
          };
          break;
        case 'tool-result': {
          const rawRes = chunk.payload.result;
          yield {
            type: 'tool-end',
            toolCallId: chunk.payload.toolCallId,
            toolName: chunk.payload.toolName,
            result: toolText(rawRes),
          };
          if (rawRes && typeof rawRes === 'object' && '__itsaplan_event' in rawRes) {
            const ev = rawRes as Record<string, unknown>;
            if (ev.__itsaplan_event === 'artifact') {
              yield {
                type: 'artifact',
                artifactId: String(ev.artifactId ?? randomUUID()),
                kind: (ev.kind as 'diff' | 'code' | 'mermaid' | 'markdown') ?? 'code',
                title: String(ev.title ?? 'Artifact'),
                content: String(ev.content ?? ''),
                language: typeof ev.language === 'string' ? ev.language : undefined,
              };
            } else if (ev.__itsaplan_event === 'approval-required') {
              yield {
                type: 'approval-required',
                approvalId: String(ev.approvalId ?? ''),
                toolCallId: String(ev.toolCallId ?? chunk.payload.toolCallId),
                toolName: String(ev.toolName ?? chunk.payload.toolName),
                args: typeof ev.args === 'string' ? ev.args : undefined,
                requireSod: Boolean(ev.requireSod),
              };
            }
          }
          break;
        }
        case 'error':
          yield { type: 'error', message: errorMessage(chunk.payload.error, 'Agent run failed') };
          break;
      }
    }
    // An answer the member stopped never reaches here: the stream is aborted and the
    // thread keeps the number of the answer before it.
    if (threadId) await recordContextUsage(threadId, row.id, contextOf(usage));
    const usageSummary = contextOf(usage);
    if (usageSummary) {
      await appendUsageLedger({
        teamId: row.teamId,
        projectId,
        agentId: row.id,
        threadId,
        userId: opts.callerUserId,
        provider: effectiveProvider,
        model: effectiveModel,
        inputTokens: usageSummary.inputTokens,
        outputTokens: usageSummary.outputTokens,
      }).catch(() => {});
    }
    yield { type: 'done', threadId };
  } catch (err) {
    if (signal?.aborted) return;
    yield { type: 'error', message: errorMessage(err, 'Agent run failed') };
  }
}

// Loads the agent, enforces the run preconditions, and builds the Mastra run
// options (tool-use step bound and, when memory is on, the conversation thread the
// caller owns). Shared by runAgent and streamAgent.
async function prepareRun(
  agentId: number,
  projectId: number,
  prompt: string,
  opts: RunOpts,
): Promise<{
  agent: Agent;
  row: AiAgentRow;
  options: RunOptions;
  threadId: string | null;
  effectiveProvider: string;
  effectiveModel: string;
}> {
  const row = await getAgentInProject(agentId, projectId);
  if (!row) throw new HttpError(404, 'Agent not found');
  if (row.kind !== 'internal') {
    throw new HttpError(400, 'Only internal agents can be run');
  }
  const budget = await evaluateTeamBudget(row.teamId);
  if (!budget.allowed) {
    throw new HttpError(
      402,
      budget.reason ?? 'Team monthly AI budget ceiling reached.',
      'TEAM_BUDGET_EXCEEDED',
    );
  }
  // A chat run with no threadId starts a new conversation; every other run continues
  // the thread its caller named (see thread-ids). Without memory every run is a
  // conversation of its own, which is what the model's session id follows.
  const threadId = row.memoryEnabled
    ? (opts.threadId ?? newChatThreadId(row.id, opts.callerUserId))
    : null;
  const slash = resolveSlashCommand(prompt);
  const modePreamble = buildModeAndEffortPreamble(opts.turnOptions, Boolean(slash.command));
  const { agent, model } = await buildAgent(
    row,
    projectId,
    `${slash.systemPreamble}${modePreamble}${opts.contextPreamble ?? ''}`,
    threadId ?? randomUUID(),
    opts.callerUserId,
    opts.turnOptions,
  );

  // Mastra's generate/stream have overloaded options; type the shape we use. In
  // Mastra v1 the temperature belongs to the call's model settings — a flat
  // `temperature` option is only read by the legacy generate.
  const options: RunOptions = {
    maxSteps: opts.turnOptions?.maxSteps ?? row.maxSteps ?? DEFAULT_MAX_STEPS,
  };
  const effectiveTemp = opts.turnOptions?.temperature ?? row.temperature;
  const isAnthropicThinking = model.providerId === 'anthropic' && opts.turnOptions?.thinking === true;
  if (effectiveTemp != null && !isAnthropicThinking) {
    options.modelSettings = { temperature: effectiveTemp };
  }
  const providerOptions = buildProviderThinkingOptions(
    model.providerId,
    model.modelId,
    opts.turnOptions,
  );
  if (providerOptions) {
    options.providerOptions =
      providerOptions as unknown as AgentExecutionOptions['providerOptions'];
  }
  if (threadId) {
    // The thread is created up front with what it is bound to and a title, so the chat
    // history can list it and deleting the agent, project or issue can find it. The
    // threadId used is returned so the caller can continue.
    await ensureThread(
      threadId,
      opts.callerUserId,
      {
        agentId: row.id,
        projectId,
        kind: isChatThreadId(threadId) ? 'chat' : 'run',
        ...(opts.issueId != null ? { issueId: opts.issueId } : {}),
        ...(opts.scheduleId != null ? { scheduleId: opts.scheduleId } : {}),
      },
      prompt,
    );
    options.memory = { thread: threadId, resource: opts.callerUserId };
  }
  return {
    agent,
    row,
    options,
    threadId,
    effectiveProvider: model.providerId,
    effectiveModel: model.modelId,
  };
}

// Options for a single run. callerUserId owns the memory thread; threadId continues a
// conversation (memory-enabled agents only); issueId and scheduleId bind an autonomous
// run's thread to what it runs on, so deleting that deletes the thread; contextPreamble
// is the caller-assembled human-context block (see run-context.ts) prepended to the
// agent's instructions.
export type RunOpts = {
  callerUserId: string;
  // Ends the model call and the tool loop when it fires, which is how a run is held to
  // the wall time its team allows.
  abortSignal?: AbortSignal;
  threadId?: string | null;
  attachmentIds?: string[];
  issueId?: number | null;
  scheduleId?: number | null;
  contextPreamble?: string;
  turnOptions?: ChatTurnOptions;
};

type RunOptions = {
  maxSteps: number;
  modelSettings?: { temperature: number };
  providerOptions?: AgentExecutionOptions['providerOptions'];
  memory?: { thread: string; resource: string };
  abortSignal?: AbortSignal;
};
