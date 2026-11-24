import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { reconcileRemoteChatSessions, type ChatSession } from '../hooks/useChatSessions';

const webSrc = resolve(import.meta.dirname, '../../..');
const apiSrc = resolve(webSrc, '../../api/src');

describe('AI Workspace persistence, stream safety, and scroll containers', () => {
  it('hydrates remote sessions only when local workspace is untouched and empty', () => {
    const emptyLocal: ChatSession[] = [
      { id: 'local-1', agentId: 10, threadId: null, running: false, hasMessages: false },
    ];
    const remote = {
      sessions: [
        { id: 'remote-1', agentId: 10, threadId: 't-old-1' },
        { id: 'remote-2', agentId: 10, threadId: 't-old-2' },
      ],
      activeId: 'remote-2',
    };

    const hydrated = reconcileRemoteChatSessions({
      current: emptyLocal,
      currentActiveId: 'local-1',
      remote,
      userInteracted: false,
    });
    assert.equal(hydrated.activeId, 'remote-2');
    assert.deepEqual(
      hydrated.sessions.map((s) => s.id),
      ['remote-1', 'remote-2'],
    );
  });

  it('never unmounts or switches away from active tab when user is typing or streaming', () => {
    const typingLocal: ChatSession[] = [
      { id: 'local-typing', agentId: 10, threadId: null, running: false, hasMessages: false },
    ];
    const remote = {
      sessions: [{ id: 'remote-1', agentId: 10, threadId: 't-old-1' }],
      activeId: 'remote-1',
    };

    const typingResult = reconcileRemoteChatSessions({
      current: typingLocal,
      currentActiveId: 'local-typing',
      remote,
      userInteracted: true,
    });
    assert.equal(typingResult.activeId, 'local-typing');
    assert.deepEqual(
      typingResult.sessions.map((s) => s.id),
      ['local-typing', 'remote-1'],
    );

    const runningLocal: ChatSession[] = [
      { id: 'local-running', agentId: 10, threadId: 't-old-1', running: true, hasMessages: true },
    ];
    const runningResult = reconcileRemoteChatSessions({
      current: runningLocal,
      currentActiveId: 'local-running',
      remote,
      userInteracted: false,
    });
    assert.equal(runningResult.activeId, 'local-running');
    assert.equal(runningResult.sessions.length, 1);
    assert.equal(runningResult.sessions[0]?.id, 'local-running');
  });

  it('pins agents/chat in ShellBody keep-alive and routes directory in-shell', () => {
    const shellBodySrc = readFileSync(resolve(webSrc, 'components/layout/ShellBody.tsx'), 'utf8');
    assert.ok(shellBodySrc.includes("p.key !== 'agents/chat'"));
    assert.ok(shellBodySrc.includes("segs[2] === 'directory'"));
    assert.ok(shellBodySrc.includes("case 'directory':"));
  });

  it('keeps mounted chat sessions alive on transient agent poll errors', () => {
    const bodySrc = readFileSync(
      resolve(webSrc, 'features/ai-chat/components/panel/ChatPanelBody.tsx'),
      'utf8',
    );
    assert.ok(bodySrc.includes('if (agentsQuery.isLoading && agents.length === 0)'));
    assert.ok(bodySrc.includes('if (agentsQuery.isError && agents.length === 0)'));
    assert.ok(bodySrc.includes('!validIds.has(session.agentId) && !session.running'));
  });

  it('emits and handles early thread events and protects live streaming in AiChatThread', () => {
    const runtimeSrc = readFileSync(resolve(apiSrc, 'modules/agents/core/runtime/index.ts'), 'utf8');
    assert.ok(runtimeSrc.includes("type: 'thread'; threadId: string"));
    assert.ok(runtimeSrc.includes("yield { type: 'thread', threadId }"));

    const chatHookSrc = readFileSync(resolve(webSrc, 'hooks/useAgentChat.ts'), 'utf8');
    assert.ok(chatHookSrc.includes("case 'thread':"));

    const threadSrc = readFileSync(
      resolve(webSrc, 'features/ai-chat/components/shared/AiChatThread.tsx'),
      'utf8',
    );
    assert.ok(threadSrc.includes("if (status !== 'ready') return;"));
    assert.ok(threadSrc.includes("status === 'ready' && threadId != null"));
  });

  it('enforces scrollable flex/overflow invariants in AI Workspace and sidebar views', () => {
    const scrollerSrc = readFileSync(resolve(webSrc, 'components/ui/message-scroller.tsx'), 'utf8');
    assert.equal(scrollerSrc.includes('contain-content'), false);
    assert.equal(scrollerSrc.includes('[content-visibility:auto]'), false);
    assert.ok(scrollerSrc.includes('overflow-y-auto'));
    assert.ok(scrollerSrc.includes('flex-1'));

    const panelSrc = readFileSync(
      resolve(webSrc, 'components/common/agent-chat/AgentChatPanel.tsx'),
      'utf8',
    );
    assert.ok(panelSrc.includes('flex min-h-0 flex-1 flex-col overflow-hidden'));
    assert.ok(panelSrc.includes('draftKey'));

    const dirSrc = readFileSync(
      resolve(webSrc, 'features/directory/ProjectDirectoryView.tsx'),
      'utf8',
    );
    assert.ok(dirSrc.includes('overflow-y-auto'));

    const orgTeamsSrc = readFileSync(resolve(webSrc, 'features/teams/OrgTeamsBody.tsx'), 'utf8');
    assert.ok(orgTeamsSrc.includes('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'));

    const vibeSrc = readFileSync(resolve(webSrc, 'features/vibe-canvas/VibeCanvasPage.tsx'), 'utf8');
    assert.ok(vibeSrc.includes('relative flex min-h-0 flex-1 overflow-hidden'));

    const workItemsSrc = readFileSync(
      resolve(webSrc, 'features/work-items/WorkItemsPage.tsx'),
      'utf8',
    );
    assert.ok(workItemsSrc.includes('relative min-h-0 flex-1 overflow-hidden'));
  });
});
