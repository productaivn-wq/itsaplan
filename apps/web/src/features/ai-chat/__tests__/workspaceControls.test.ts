import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import type { ChatMessage } from '@/hooks/useAgentChat';
import {
  DEFAULT_CHAT_RUN_OPTIONS,
  DEFAULT_CHAT_VIEW_PREFERENCES,
  extractArtifactsFromMessages,
  formatModelDisplayLabel,
  sanitizeRunOptions,
  sanitizeViewPreferences,
} from '../types/workspaceControls';

describe('AI Workspace AGY + Claude parity (models, options, views)', () => {
  it('extracts emitted artifacts and substantial fenced code/diff/mermaid blocks without duplicates', () => {
    const sampleMessages: ChatMessage[] = [
      {
        id: 'm1',
        role: 'user',
        createdAt: '2026-11-22T10:00:00.000Z',
        parts: [{ type: 'text', text: 'Plan the SQL migration and show a diff.' }],
      },
      {
        id: 'm2',
        role: 'assistant',
        createdAt: '2026-11-22T10:00:05.000Z',
        parts: [
          {
            type: 'artifact',
            artifactId: 'art-plan-1',
            kind: 'markdown',
            title: 'Delivery Plan',
            content: '# Step 1\nVerify DB indexes.',
          },
          {
            type: 'text',
            text: [
              'Here is the SQL query:',
              '```sql',
              'SELECT id, title FROM issue WHERE state_id = 1;',
              '```',
              'Duplicate SQL that should deduplicate:',
              '```sql',
              'SELECT id, title FROM issue WHERE state_id = 1;',
              '```',
              'And a diff patch:',
              '```diff',
              '+const enabled = true;',
              '-const enabled = false;',
              '```',
              'And a short inline snippet that should be skipped:',
              '```',
              'one line',
              '```',
            ].join('\n'),
          },
        ],
      },
    ];

    const artifacts = extractArtifactsFromMessages(sampleMessages);
    assert.equal(artifacts.length, 3);
    assert.equal(artifacts[0]?.id, 'art-plan-1');
    assert.equal(artifacts[0]?.source, 'emitted');
    assert.equal(artifacts[1]?.kind, 'code');
    assert.equal(artifacts[1]?.language, 'sql');
    assert.equal(artifacts[1]?.title, 'SQL Query · #1');
    assert.equal(artifacts[2]?.kind, 'diff');
    assert.equal(artifacts[2]?.title, 'Diff Patch · #2');
  });

  it('formats curated AGY/Claude model labels cleanly and falls back to agent default', () => {
    const internalAgent = {
      kind: 'internal' as const,
      model: 'claude-sonnet-5-5-high',
      modelProvider: 'anthropic',
    };
    assert.equal(formatModelDisplayLabel('gemini-4-neon-xhigh', internalAgent, 'Agent default'), 'Gemini 4 Neon (XHigh)');
    assert.equal(formatModelDisplayLabel('custom/my-model', internalAgent, 'Agent default'), 'custom/my-model');
    assert.equal(formatModelDisplayLabel(null, internalAgent, 'Agent default'), 'Claude Sonnet 5.5');
    assert.equal(
      formatModelDisplayLabel(null, { kind: 'external', model: null, modelProvider: null }, 'Runner default'),
      'Runner default',
    );
  });

  it('sanitizes persisted view preferences and run options safely against malformed payloads', () => {
    assert.deepEqual(sanitizeViewPreferences(null), DEFAULT_CHAT_VIEW_PREFERENCES);
    assert.deepEqual(
      sanitizeViewPreferences({
        layout: 'invalid-layout',
        density: 'compact',
        width: 'wide',
        thinkingVisibility: 'expanded',
        toolsVisibility: 'bogus',
        showTimestamps: false,
      }),
      {
        ...DEFAULT_CHAT_VIEW_PREFERENCES,
        density: 'compact',
        width: 'wide',
        thinkingVisibility: 'expanded',
        showTimestamps: false,
      },
    );

    assert.deepEqual(sanitizeRunOptions('not-an-object'), DEFAULT_CHAT_RUN_OPTIONS);
    assert.deepEqual(
      sanitizeRunOptions({
        model: '  claude-opus-5-5-high  ',
        modelCredentialId: -5,
        mode: 'plan',
        effort: 'xhigh',
        thinking: false,
        permissionMode: 'plan',
        temperature: 9,
        maxSteps: 999,
      }),
      {
        model: 'claude-opus-5-5-high',
        modelCredentialId: null,
        mode: 'plan',
        effort: 'xhigh',
        thinking: false,
        permissionMode: 'plan',
        temperature: 2,
        maxSteps: 64,
      },
    );
  });

  it('wires model picker, options popover, layout switcher, view menu, and right pane across UI components', () => {
    const aiChatRoot = resolve(import.meta.dirname, '..');
    const workspaceSrc = readFileSync(resolve(aiChatRoot, 'components/ClientWorkspaceView.tsx'), 'utf8');
    const sessionSrc = readFileSync(resolve(aiChatRoot, 'components/panel/ChatPanelSession.tsx'), 'utf8');
    const rightPaneSrc = readFileSync(resolve(aiChatRoot, 'components/workspace/WorkspaceRightPane.tsx'), 'utf8');
    const panelSrc = readFileSync(
      resolve(aiChatRoot, '../../components/common/agent-chat/AgentChatPanel.tsx'),
      'utf8',
    );

    assert.ok(workspaceSrc.includes('workspace-layout-switcher'));
    assert.ok(workspaceSrc.includes('ChatViewMenu'));
    assert.ok(workspaceSrc.includes('WorkspaceRightPane'));
    assert.ok(sessionSrc.includes('ChatComposerModelPicker'));
    assert.ok(sessionSrc.includes('ChatComposerOptionsPopover'));
    assert.ok(rightPaneSrc.includes('right-pane-tab-${tab.id}'));
    assert.ok(rightPaneSrc.includes("id: 'artifacts'"));
    assert.ok(rightPaneSrc.includes("id: 'approvals'"));
    assert.ok(rightPaneSrc.includes("id: 'activity'"));
    assert.ok(rightPaneSrc.includes("id: 'inspector'"));
    assert.ok(panelSrc.includes('/model'));
    assert.ok(panelSrc.includes('/clear'));

    const bodySrc = readFileSync(resolve(aiChatRoot, 'components/panel/ChatPanelBody.tsx'), 'utf8');
    const pickerSrc = readFileSync(
      resolve(aiChatRoot, 'components/controls/ChatComposerModelPicker.tsx'),
      'utf8',
    );
    assert.ok(bodySrc.includes('agentsQuery.isError'));
    assert.ok(bodySrc.includes('ensureDefaultMutation'));
    assert.ok(pickerSrc.includes('CURATED_MODEL_PRESETS'));
  });
});
