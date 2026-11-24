import { describe, expect, it } from 'bun:test';
import {
  buildModeAndEffortPreamble,
  buildProviderThinkingOptions,
  filterToolsForPermissionMode,
  isReadOnlyTurn,
  isSafeModelId,
  normalizeChatTurnOptions,
} from '../core/prompt/run-options';

describe('per-turn chat run options (AGY + Claude parity)', () => {
  it('validates model ids and rejects flag-like or malformed strings', () => {
    expect(isSafeModelId('gemini-4-neon-xhigh')).toBe(true);
    expect(isSafeModelId('claude-sonnet-5-5-high')).toBe(true);
    expect(isSafeModelId('anthropic/claude-sonnet-4.6:beta')).toBe(true);

    expect(isSafeModelId('--dangerously-skip-permissions')).toBe(false);
    expect(isSafeModelId('-m evil')).toBe(false);
    expect(isSafeModelId('model with spaces')).toBe(false);
    expect(isSafeModelId('')).toBe(false);
  });

  it('normalizes turn options, clamps temperature & maxSteps, and strips unsafe models', () => {
    const normalized = normalizeChatTurnOptions({
      model: '  claude-opus-5-5-high  ',
      modelCredentialId: 7,
      mode: 'plan',
      effort: 'xhigh',
      thinking: true,
      permissionMode: 'ask',
      temperature: 3.8,
      maxSteps: 200,
    });

    expect(normalized).toEqual({
      model: 'claude-opus-5-5-high',
      modelCredentialId: 7,
      mode: 'plan',
      effort: 'xhigh',
      thinking: true,
      permissionMode: 'ask',
      temperature: 2,
      maxSteps: 64,
    });

    const lowClamped = normalizeChatTurnOptions({
      model: '--yolo',
      temperature: -1,
      maxSteps: 0,
    });
    expect(lowClamped).toEqual({
      temperature: 0,
      maxSteps: 1,
    });

    expect(normalizeChatTurnOptions({ model: '-bad-flag' })).toBeUndefined();
    expect(normalizeChatTurnOptions(null)).toBeUndefined();
  });

  it('strips mutating tools on read-only turns (plan, ask, permissionMode=plan)', () => {
    const granted = [
      'list_documents',
      'get_document',
      'list_note_boards',
      'get_note_board',
      'create_issue',
      'update_issue',
      'delete_issue',
      'add_comment',
      'set_issue_field_value',
      'link_issues',
      'unlink_issues',
      'transfer_cycle_issues',
      'prepare_issue_import',
      'create_document',
    ];

    expect(isReadOnlyTurn({ mode: 'plan' })).toBe(true);
    expect(isReadOnlyTurn({ mode: 'ask' })).toBe(true);
    expect(isReadOnlyTurn({ mode: 'build', permissionMode: 'plan' })).toBe(true);
    expect(isReadOnlyTurn({ mode: 'build', permissionMode: 'ask' })).toBe(false);

    const expectedReadOnly = ['list_documents', 'get_document', 'list_note_boards', 'get_note_board'];
    expect(filterToolsForPermissionMode(granted, { mode: 'plan' })).toEqual(expectedReadOnly);
    expect(filterToolsForPermissionMode(granted, { mode: 'ask' })).toEqual(expectedReadOnly);
    expect(
      filterToolsForPermissionMode(granted, { mode: 'build', permissionMode: 'plan' }),
    ).toEqual(expectedReadOnly);
    expect(filterToolsForPermissionMode(granted, { mode: 'build', permissionMode: 'auto' })).toEqual(
      granted,
    );
  });

  it('builds mode and effort preambles cleanly without duplicating slash preambles', () => {
    const plan = buildModeAndEffortPreamble({ mode: 'plan', effort: 'xhigh' }, false);
    expect(plan).toContain('Active Mode: Plan');
    expect(plan).toContain('request_human_approval');
    expect(plan).toContain('Effort: xhigh');

    const planWithSlash = buildModeAndEffortPreamble({ mode: 'plan', effort: 'low' }, true);
    expect(planWithSlash).not.toContain('Active Mode: Plan');
    expect(planWithSlash).toContain('Effort: low');

    expect(buildModeAndEffortPreamble({ mode: 'ask', effort: 'medium' })).toContain('Active Mode: Ask');
    expect(buildModeAndEffortPreamble({ mode: 'build', permissionMode: 'ask', effort: 'high' })).toContain(
      'Permission Policy: Ask Before Mutating',
    );
    expect(buildModeAndEffortPreamble({ mode: 'auto' })).toContain('Active Mode: Auto');
  });

  it('maps thinking & effort to provider-specific Mastra options safely', () => {
    expect(
      buildProviderThinkingOptions('anthropic', 'claude-sonnet-5-5-high', {
        thinking: true,
        effort: 'xhigh',
      }),
    ).toEqual({
      anthropic: { thinking: { type: 'enabled', budgetTokens: 24576 } },
    });

    expect(
      buildProviderThinkingOptions('anthropic', 'claude-sonnet-5-5-high', {
        thinking: false,
      }),
    ).toEqual({
      anthropic: { thinking: { type: 'disabled' } },
    });

    expect(
      buildProviderThinkingOptions('google', 'gemini-2.5-pro', {
        thinking: true,
        effort: 'medium',
      }),
    ).toEqual({
      google: { thinkingConfig: { thinkingBudget: 6144, includeThoughts: true } },
    });

    expect(
      buildProviderThinkingOptions('google', 'gemini-2.5-flash', {
        thinking: false,
      }),
    ).toEqual({
      google: { thinkingConfig: { thinkingBudget: 0, includeThoughts: false } },
    });

    expect(
      buildProviderThinkingOptions('openai', 'gpt-5-mini', {
        effort: 'xhigh',
      }),
    ).toEqual({
      openai: { reasoningEffort: 'high' },
    });

    expect(
      buildProviderThinkingOptions('openai', 'o4-mini', {
        effort: 'low',
      }),
    ).toEqual({
      openai: { reasoningEffort: 'low' },
    });

    expect(
      buildProviderThinkingOptions('openai', 'gpt-4o', {
        effort: 'high',
        thinking: true,
      }),
    ).toBeUndefined();

    expect(
      buildProviderThinkingOptions('openrouter', 'deepseek/deepseek-r1', {
        thinking: true,
        effort: 'high',
      }),
    ).toBeUndefined();
  });
});
