export type ChatExecutionMode = 'ask' | 'plan' | 'build' | 'auto';
export type ChatEffortLevel = 'low' | 'medium' | 'high' | 'xhigh';
export type ChatPermissionMode = 'ask' | 'plan' | 'auto';

export interface ChatTurnOptions {
  model?: string | null;
  modelCredentialId?: number | null;
  mode?: ChatExecutionMode | null;
  effort?: ChatEffortLevel | null;
  thinking?: boolean | null;
  permissionMode?: ChatPermissionMode | null;
  temperature?: number | null;
  maxSteps?: number | null;
}

const VALID_MODES = new Set<ChatExecutionMode>(['ask', 'plan', 'build', 'auto']);
const VALID_EFFORTS = new Set<ChatEffortLevel>(['low', 'medium', 'high', 'xhigh']);
const VALID_PERMISSIONS = new Set<ChatPermissionMode>(['ask', 'plan', 'auto']);
const SAFE_MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._:/@-]{0,119}$/;
const READ_ONLY_TOOL_PREFIX_RE = /^(list|get|search|read)_/;

/**
 * Validates that a model identifier is free of whitespace, shell meta-characters,
 * and leading dashes so it can never inject CLI flags into runner invocations.
 */
export function isSafeModelId(value: string): boolean {
  return SAFE_MODEL_RE.test(value);
}

/**
 * Normalizes and bounds per-turn execution overrides supplied by the chat UI.
 * Invalid model strings or out-of-range parameters are omitted or clamped.
 */
export function normalizeChatTurnOptions(
  raw?: Partial<ChatTurnOptions> | null,
): ChatTurnOptions | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const out: ChatTurnOptions = {};

  if (typeof raw.model === 'string') {
    const trimmed = raw.model.trim();
    if (trimmed.length > 0 && isSafeModelId(trimmed)) {
      out.model = trimmed;
    }
  }

  if (
    typeof raw.modelCredentialId === 'number' &&
    Number.isInteger(raw.modelCredentialId) &&
    raw.modelCredentialId > 0
  ) {
    out.modelCredentialId = raw.modelCredentialId;
  }

  if (typeof raw.mode === 'string' && VALID_MODES.has(raw.mode as ChatExecutionMode)) {
    out.mode = raw.mode as ChatExecutionMode;
  }

  if (typeof raw.effort === 'string' && VALID_EFFORTS.has(raw.effort as ChatEffortLevel)) {
    out.effort = raw.effort as ChatEffortLevel;
  }

  if (typeof raw.thinking === 'boolean') {
    out.thinking = raw.thinking;
  }

  if (
    typeof raw.permissionMode === 'string' &&
    VALID_PERMISSIONS.has(raw.permissionMode as ChatPermissionMode)
  ) {
    out.permissionMode = raw.permissionMode as ChatPermissionMode;
  }

  if (typeof raw.temperature === 'number' && Number.isFinite(raw.temperature)) {
    out.temperature = Math.min(2, Math.max(0, Number(raw.temperature.toFixed(2))));
  }

  if (typeof raw.maxSteps === 'number' && Number.isFinite(raw.maxSteps)) {
    out.maxSteps = Math.min(64, Math.max(1, Math.round(raw.maxSteps)));
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Returns true when the requested mode or permission setting restricts the turn
 * to read-only inspection without project state mutations.
 */
export function isReadOnlyTurn(options?: ChatTurnOptions): boolean {
  return (
    options?.mode === 'plan' ||
    options?.mode === 'ask' ||
    options?.permissionMode === 'plan'
  );
}

/**
 * Filters granted action tool keys down to read-only operations on read-only turns
 * (Ask / Plan modes or Plan permission policy).
 */
export function filterToolsForPermissionMode(
  tools: string[],
  options?: ChatTurnOptions,
): string[] {
  if (!isReadOnlyTurn(options)) return tools;
  return tools.filter((toolKey) => READ_ONLY_TOOL_PREFIX_RE.test(toolKey));
}

const EFFORT_GUIDANCE: Record<ChatEffortLevel, string> = {
  low: 'Effort: low — keep reasoning crisp and answer quickly without unnecessary detours.',
  medium: 'Effort: medium — balance thoroughness with concise execution.',
  high: 'Effort: high — inspect relevant context carefully and verify assumptions before concluding.',
  xhigh:
    'Effort: xhigh — perform exhaustive multi-step verification, trace edge cases, and cross-check every claim against observed project data.',
};

/**
 * Builds the system instruction preamble for the selected execution mode,
 * permission posture, and reasoning effort level.
 */
export function buildModeAndEffortPreamble(
  options?: ChatTurnOptions,
  hasSlashCommand = false,
): string {
  if (!options) return '';

  const lines: string[] = [];

  if (!hasSlashCommand) {
    if (options.mode === 'plan') {
      lines.push(
        '## Active Mode: Plan (Read-Only Analysis & Approval)',
        'Operate strictly read-only for project mutations:',
        '1. Inspect project state, issues, and documents first using read-only tools.',
        '2. Design a numbered execution plan with dependencies, risks, and verification criteria.',
        '3. Emit a structured markdown artifact via `emit_artifact` (`kind: "markdown"`) when available.',
        '4. Do NOT mutate issues or project data directly before requesting approval via `request_human_approval` (`kind: "plan_proposal"`).',
      );
    } else if (options.mode === 'ask') {
      lines.push(
        '## Active Mode: Ask (Read-Only Q&A)',
        'Do not mutate work items, docs, or project state. Answer directly and concisely with grounded citations from read-only inspection.',
      );
    } else if (options.mode === 'auto') {
      lines.push(
        '## Active Mode: Auto (Autonomous Execution)',
        'Execute the requested task end-to-end within granted permissions and workspace policy boundaries, verifying outcomes before reporting.',
      );
    }
  }

  if (options.permissionMode === 'ask' && !isReadOnlyTurn(options)) {
    lines.push(
      '## Permission Policy: Ask Before Mutating',
      'Call `request_human_approval` prior to destructive, bulk, or high-impact project mutations.',
    );
  }

  if (options.effort) {
    lines.push(EFFORT_GUIDANCE[options.effort]);
  }

  return lines.length > 0 ? `${lines.join('\n')}\n\n` : '';
}

const EFFORT_THINKING_BUDGETS: Record<ChatEffortLevel, number> = {
  low: 2048,
  medium: 6144,
  high: 12288,
  xhigh: 24576,
};

const OPENAI_REASONING_MODEL_RE = /^(o1|o3|o4|gpt-5)/i;

/**
 * Maps UI thinking & effort controls to provider-specific options accepted by
 * Mastra / AI SDK v6 model calls.
 */
export function buildProviderThinkingOptions(
  provider: string,
  modelId: string,
  options?: ChatTurnOptions,
): Record<string, Record<string, unknown>> | undefined {
  if (!options) return undefined;
  const hasThinking = typeof options.thinking === 'boolean';
  const hasEffort = Boolean(options.effort);
  if (!hasThinking && !hasEffort) return undefined;

  const budgetTokens = EFFORT_THINKING_BUDGETS[options.effort ?? 'high'];

  if (provider === 'anthropic') {
    if (options.thinking === true) {
      return {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens },
        },
      };
    }
    if (options.thinking === false) {
      return {
        anthropic: {
          thinking: { type: 'disabled' },
        },
      };
    }
    return undefined;
  }

  if (provider === 'google') {
    if (!hasThinking && !hasEffort) return undefined;
    return {
      google: {
        thinkingConfig: {
          thinkingBudget: options.thinking === false ? 0 : budgetTokens,
          includeThoughts: options.thinking !== false,
        },
      },
    };
  }

  if (provider === 'openai') {
    if (options.effort && OPENAI_REASONING_MODEL_RE.test(modelId)) {
      return {
        openai: {
          reasoningEffort: options.effort === 'xhigh' ? 'high' : options.effort,
        },
      };
    }
    return undefined;
  }

  return undefined;
}
