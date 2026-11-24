import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { markdownSegments } from '@/lib/markdown';
import { initialAgentValue } from '@/features/teams/utils/agentForm';
import { startPagePath, documentPath, teamSectionPath } from '@/utils/paths';
import { resolveFeatureKey } from '@/utils/featurePreload';
import {
  guardHostBridge,
  hasStructurallyValidSessionCookie,
} from '@/lib/security/hostBridgeGuard';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import enNav from '../../../../messages/en/nav.json';

describe('53.ACT.677 client-first UI & security quarantine', () => {
  it('defaults new AI agents to internal cloud execution and routes workspace start page', () => {
    assert.equal(initialAgentValue().kind, 'internal');
    assert.equal(startPagePath('acme.PRJ', 'workspace'), '/acme/PRJ/agents/chat');
    assert.equal(documentPath('acme.PRJ', 42), '/acme/PRJ/docs/42');
    assert.equal(teamSectionPath('acme', 'ai-agents'), '/acme/settings/ai-agents');
    assert.equal((enNav as { aiWorkspace?: string }).aiWorkspace, 'AI Workspace');
  });

  it('routes /agents/chat to ClientWorkspaceView independently of Operations and AI Agents', () => {
    assert.equal(resolveFeatureKey('/thanb/PM/agents/chat'), 'agents/chat');
    assert.equal(resolveFeatureKey('/thanb/PM/agents/schedules'), 'agents/schedules');
    assert.equal(resolveFeatureKey('/thanb/PM/agents'), 'agents');
    assert.equal(resolveFeatureKey('/thanb/PM/open-office'), 'open-office');

    const webSrc = resolve(import.meta.dirname, '../../..');
    const shellBodySrc = readFileSync(resolve(webSrc, 'components/layout/ShellBody.tsx'), 'utf8');
    const chatBranchIdx = shellBodySrc.indexOf(
      "segs.length === 4 && segs[2] === 'agents' && segs[3] === 'chat'",
    );
    const fallbackIdx = shellBodySrc.lastIndexOf('{!activeDescriptor && children}');
    assert.ok(chatBranchIdx !== -1 && fallbackIdx !== -1 && chatBranchIdx < fallbackIdx);
    assert.ok(shellBodySrc.includes('<ClientWorkspaceView'));

    const aiTeamNavSrc = readFileSync(
      resolve(webSrc, 'components/layout/SidebarAiTeamNav.tsx'),
      'utf8',
    );
    assert.ok(aiTeamNavSrc.includes("!pathname.endsWith('/agents/chat')"));

    const shellSrc = readFileSync(resolve(webSrc, 'components/layout/Shell.tsx'), 'utf8');
    assert.ok(shellSrc.includes('!onAiWorkspace'));
  });

  it('parses fenced diff and mermaid segments for rich deliverable rendering', () => {
    const diffSegs = markdownSegments('```diff\n+const ok = true;\n-const old = false;\n```');
    assert.deepEqual(diffSegs, [
      { kind: 'diff', content: '+const ok = true;\n-const old = false;' },
    ]);

    const mermaidSegs = markdownSegments('```mermaid\nflowchart TD\nA-->B\n```');
    assert.deepEqual(mermaidSegs, [{ kind: 'mermaid', content: 'flowchart TD\nA-->B' }]);
  });

  it('quarantines legacy host bridges by default and rejects malformed session cookies', async () => {
    const prevFlag = process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
    delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
    try {
      const req = new NextRequest('http://127.0.0.1:3000/api/vault-bridge', {
        headers: { host: '127.0.0.1:3000' },
      });
      const blocked = guardHostBridge(req);
      assert.equal(blocked?.status, 403);
      assert.deepEqual(await blocked?.json(), {
        error: 'Host-machine bridge is disabled in multi-tenant client mode',
        code: 'HOST_BRIDGE_QUARANTINED',
      });

      const shortCookieReq = new NextRequest('http://127.0.0.1:3000/onboarding', {
        headers: { cookie: 'better-auth.session_token=abc' },
      });
      assert.equal(hasStructurallyValidSessionCookie(shortCookieReq), false);
    } finally {
      if (prevFlag !== undefined) process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = prevFlag;
    }
  });

  it('gates client-route legacy host-vibe bridges behind NEXT_PUBLIC_ENABLE_HOST_VIBE', () => {
    const prevHostVibe = process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
    delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
    try {
      assert.equal(isHostVibeEnabled(), false);
      process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = 'false';
      assert.equal(isHostVibeEnabled(), false);
      process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = 'true';
      assert.equal(isHostVibeEnabled(), true);
    } finally {
      if (prevHostVibe === undefined) delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
      else process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = prevHostVibe;
    }

    const webSrc = resolve(import.meta.dirname, '../../..');
    const gatedCallers = [
      'features/work-items/components/SwarmHitlGovernanceBar.tsx',
      'features/work-items/components/timeline/TimelineView.tsx',
      'features/teams/components/ai-agents/ProjectAiAgentsSection.tsx',
      'features/teams/components/company/CompanySetupSection.tsx',
      'features/teams/components/org-chart/TeamOrgChartSection.tsx',
      'features/inbox/services/inboxStreams.ts',
      'features/vibe-canvas/open-office/useOpenOfficeWorkspaceController.ts',
    ];
    for (const relPath of gatedCallers) {
      const src = readFileSync(resolve(webSrc, relPath), 'utf8');
      assert.ok(src.includes('isHostVibeEnabled'), `${relPath} must import and check isHostVibeEnabled`);
    }
  });
});
