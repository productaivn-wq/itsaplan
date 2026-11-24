import { db, agentApprovalRequest } from '@repo/db';
import { and, desc, eq } from 'drizzle-orm';
import { HttpError, iso } from '#shared/lib';

export type ApprovalKind = 'approval' | 'ask_user' | 'plan_proposal';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalRequestRow {
  id: string;
  teamId: number;
  projectId: number;
  agentId: number;
  threadId: string | null;
  toolCallId: string;
  toolName: string;
  kind: ApprovalKind;
  payload: Record<string, unknown>;
  requestedByUserId: string | null;
  decidedByUserId: string | null;
  requireSod: boolean;
  status: ApprovalStatus;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface ApprovalTransitionCheck {
  currentStatus: string;
  requireSod: boolean;
  requestedByUserId: string | null;
  deciderUserId: string;
}

/**
 * Deterministic HITL state-transition and Separation-of-Duties invariant check.
 */
export function assertApprovalTransition(input: ApprovalTransitionCheck): void {
  if (input.currentStatus !== 'pending') {
    throw new HttpError(
      409,
      `Approval request already resolved with status '${input.currentStatus}'.`,
      'HITL_ALREADY_DECIDED',
    );
  }
  if (
    input.requireSod &&
    input.requestedByUserId &&
    input.requestedByUserId === input.deciderUserId
  ) {
    throw new HttpError(
      403,
      'Separation of duties violation: requester cannot decide their own approval request.',
      'SOD_SELF_APPROVAL_BLOCKED',
    );
  }
}

function mapApprovalRow(row: typeof agentApprovalRequest.$inferSelect): ApprovalRequestRow {
  return {
    id: row.id,
    teamId: row.teamId,
    projectId: row.projectId,
    agentId: row.agentId,
    threadId: row.threadId,
    toolCallId: row.toolCallId,
    toolName: row.toolName,
    kind: row.kind as ApprovalKind,
    payload: row.payload ?? {},
    requestedByUserId: row.requestedByUserId,
    decidedByUserId: row.decidedByUserId,
    requireSod: row.requireSod,
    status: row.status as ApprovalStatus,
    decisionNote: row.decisionNote,
    createdAt: iso(row.createdAt),
    decidedAt: row.decidedAt ? iso(row.decidedAt) : null,
  };
}

export interface CreateApprovalInput {
  teamId: number;
  projectId: number;
  agentId: number;
  threadId?: string | null;
  toolCallId: string;
  toolName: string;
  kind?: ApprovalKind;
  payload?: Record<string, unknown>;
  requestedByUserId?: string | null;
  requireSod?: boolean;
}

export async function createApprovalRequest(
  input: CreateApprovalInput,
): Promise<ApprovalRequestRow> {
  const [inserted] = await db
    .insert(agentApprovalRequest)
    .values({
      teamId: input.teamId,
      projectId: input.projectId,
      agentId: input.agentId,
      threadId: input.threadId ?? null,
      toolCallId: input.toolCallId,
      toolName: input.toolName,
      kind: input.kind ?? 'approval',
      payload: input.payload ?? {},
      requestedByUserId: input.requestedByUserId ?? null,
      requireSod: input.requireSod ?? false,
      status: 'pending',
    })
    .returning();
  return mapApprovalRow(inserted);
}

export async function listProjectApprovals(
  projectId: number,
  status?: ApprovalStatus,
): Promise<ApprovalRequestRow[]> {
  const where = status
    ? and(eq(agentApprovalRequest.projectId, projectId), eq(agentApprovalRequest.status, status))
    : eq(agentApprovalRequest.projectId, projectId);
  const rows = await db
    .select()
    .from(agentApprovalRequest)
    .where(where)
    .orderBy(desc(agentApprovalRequest.createdAt))
    .limit(100);
  return rows.map(mapApprovalRow);
}

export interface DecideApprovalInput {
  approvalId: string;
  projectId: number;
  deciderUserId: string;
  decision: ApprovalDecision;
  note?: string | null;
}

export async function decideApprovalRequest(
  input: DecideApprovalInput,
): Promise<ApprovalRequestRow> {
  const [existing] = await db
    .select()
    .from(agentApprovalRequest)
    .where(
      and(
        eq(agentApprovalRequest.id, input.approvalId),
        eq(agentApprovalRequest.projectId, input.projectId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new HttpError(404, 'Approval request not found');
  }

  assertApprovalTransition({
    currentStatus: existing.status,
    requireSod: existing.requireSod,
    requestedByUserId: existing.requestedByUserId,
    deciderUserId: input.deciderUserId,
  });

  const [updated] = await db
    .update(agentApprovalRequest)
    .set({
      status: input.decision,
      decidedByUserId: input.deciderUserId,
      decisionNote: input.note ?? null,
      decidedAt: new Date(),
    })
    .where(eq(agentApprovalRequest.id, existing.id))
    .returning();

  return mapApprovalRow(updated);
}
