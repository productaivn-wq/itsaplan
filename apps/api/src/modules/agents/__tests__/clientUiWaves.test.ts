import { describe, expect, it } from 'bun:test';
import { checkTeamBudgetAllowance, estimateCostUsdMicros } from '../chat-usage';
import { notifyChatMessageUpdate, waitForChatMessageUpdate } from '../chat/service';
import { buildLocalTools, resolveEffectiveRequireSod } from '../core/runtime/tools/local';
import {
  buildMultimodalPromptInput,
  extractAttachmentIdsFromPrompt,
} from '../core/runtime/attachments';
import { assertApprovalTransition } from '../hitl/service';
import { resolveSlashCommand } from '../core/prompt/slash-commands';
import { assertTenantKnowledgeScope } from '../core/runtime/memory';
import { NO_LIMITS } from '../../../shared/limits';
import { HttpError } from '../../../shared/lib';

describe('53.ACT.677 FinOps, HITL SoD & Tenant RAG invariants', () => {
  it('computes deterministic USD micro-costs and hard-stops exhausted budgets', () => {
    const micros = estimateCostUsdMicros('gpt-5-mini', 1_000_000, 1_000_000);
    expect(micros).toBe(1_500_000);

    const warnOnly = checkTeamBudgetAllowance(45_000_000, 50_000_000, true, 0, 0, 80);
    expect(warnOnly.allowed).toBe(true);
    expect(warnOnly.softAlertTriggered).toBe(true);
    expect(warnOnly.hardStopped).toBe(false);

    const blocked = checkTeamBudgetAllowance(50_000_000, 50_000_000, true, 0, 0, 80);
    expect(blocked.allowed).toBe(false);
    expect(blocked.hardStopped).toBe(true);
    expect(blocked.reason).toContain('USD budget');
    expect(NO_LIMITS.hardStopBudget).toBe(false);
  });

  it('enforces HITL single-resolution and Separation of Duties (requester != decider)', () => {
    expect(() =>
      assertApprovalTransition({
        currentStatus: 'pending',
        requireSod: true,
        requestedByUserId: 'user-a',
        deciderUserId: 'user-a',
      }),
    ).toThrow(HttpError);

    expect(() =>
      assertApprovalTransition({
        currentStatus: 'approved',
        requireSod: false,
        requestedByUserId: 'user-a',
        deciderUserId: 'user-b',
      }),
    ).toThrow(HttpError);

    expect(() =>
      assertApprovalTransition({
        currentStatus: 'pending',
        requireSod: true,
        requestedByUserId: 'user-a',
        deciderUserId: 'user-b',
      }),
    ).not.toThrow();
  });

  it('fails closed on cross-tenant knowledge access attempts', () => {
    expect(() => assertTenantKnowledgeScope(10, 10)).not.toThrow();
    expect(() => assertTenantKnowledgeScope(10, 99)).toThrow(HttpError);
  });

  it('registers native cloud tools and wakes push listeners immediately', async () => {
    const tools = buildLocalTools(101, [], { teamId: 10, agentId: 1 });
    expect(Boolean(tools.search_project_knowledge)).toBe(true);
    expect(Boolean(tools.emit_artifact)).toBe(true);
    expect(Boolean(tools.request_human_approval)).toBe(true);

    const artifactRes = await tools.emit_artifact.execute?.(
      { kind: 'diff', title: 'Patch', content: '+added\n-removed' },
      {} as never,
    );
    expect((artifactRes as { __itsaplan_event?: string }).__itsaplan_event).toBe('artifact');

    const startedAt = Date.now();
    const waitPromise = waitForChatMessageUpdate(987654, 1500);
    setTimeout(() => notifyChatMessageUpdate(987654), 10);
    await waitPromise;
    expect(Date.now() - startedAt).toBeLessThan(200);
  });

  it('resolves same-project image & PDF attachments cleanly and blocks cross-project IDs', async () => {
    const promptWithMarkers =
      'Inspect mockup\n\n[file: "screen.png" (attachment id: att_img_1)]\n[file: "spec.pdf" (attachment id: att_pdf_1)]\n[file: "secret.png" (attachment id: att_other_proj)]';
    expect(extractAttachmentIdsFromPrompt(promptWithMarkers)).toEqual([
      'att_img_1',
      'att_pdf_1',
      'att_other_proj',
    ]);

    const fakeRows: Record<string, { publicId: string; projectId: number; s3Key: string; filename: string; contentType: string; sizeBytes: number; id: number; uploadedByUserId: null; createdAt: string }> = {
      att_img_1: {
        id: 1,
        publicId: 'att_img_1',
        projectId: 42,
        uploadedByUserId: null,
        s3Key: 'k1',
        filename: 'screen.png',
        contentType: 'image/png',
        sizeBytes: 4,
        createdAt: '2026-11-22T00:00:00Z',
      },
      att_pdf_1: {
        id: 2,
        publicId: 'att_pdf_1',
        projectId: 42,
        uploadedByUserId: null,
        s3Key: 'k2',
        filename: 'spec.pdf',
        contentType: 'application/pdf',
        sizeBytes: 5,
        createdAt: '2026-11-22T00:00:00Z',
      },
      att_other_proj: {
        id: 3,
        publicId: 'att_other_proj',
        projectId: 999,
        uploadedByUserId: null,
        s3Key: 'k3',
        filename: 'secret.png',
        contentType: 'image/png',
        sizeBytes: 4,
        createdAt: '2026-11-22T00:00:00Z',
      },
    };

    const resolved = await buildMultimodalPromptInput(42, promptWithMarkers, ['att_img_1'], {
      getAttachment: async (id) => fakeRows[id] ?? null,
      readBytes: async (key) => Buffer.from(`bytes-${key}`),
    });

    expect(Array.isArray(resolved)).toBe(true);
    if (Array.isArray(resolved)) {
      expect(resolved[0].content).toHaveLength(3);
      expect(resolved[0].content[1]).toMatchObject({ type: 'image', mediaType: 'image/png' });
      expect(resolved[0].content[2]).toMatchObject({
        type: 'file',
        mediaType: 'application/pdf',
        filename: 'spec.pdf',
      });
    }

    const plainFallback = await buildMultimodalPromptInput(42, 'No attachments here');
    expect(plainFallback).toBe('No attachments here');
  });

  it('parses /plan, /compact, /goal, and /review slash commands cleanly', () => {
    const planUpper = resolveSlashCommand('/PLAN Break down Q4 deliverables');
    expect(planUpper.command).toBe('plan');
    expect(planUpper.args).toBe('Break down Q4 deliverables');
    expect(planUpper.systemPreamble).toContain('request_human_approval');
    expect(planUpper.enrichedPrompt).toStartWith('[Mode: /plan');

    expect(resolveSlashCommand('/compact summarize state').command).toBe('compact');
    expect(resolveSlashCommand('/goal Ship client onboarding').systemPreamble).toContain('DoD-1');
    expect(resolveSlashCommand('/review Audit open PR diffs').systemPreamble).toContain('P0 Critical');

    const regular = resolveSlashCommand('Explain project KPIs');
    expect(regular.command).toBeNull();
    expect(regular.systemPreamble).toBe('');
    expect(regular.enrichedPrompt).toBe('Explain project KPIs');
  });

  it('inherits company requireSodApproval when approval request omits requireSod', () => {
    expect(resolveEffectiveRequireSod(undefined, true)).toBe(true);
    expect(resolveEffectiveRequireSod(undefined, false)).toBe(false);
    expect(resolveEffectiveRequireSod(true, false)).toBe(true);
    expect(resolveEffectiveRequireSod(false, true)).toBe(true);
  });
});
