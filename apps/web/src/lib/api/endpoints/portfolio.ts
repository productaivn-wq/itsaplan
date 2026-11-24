import { request } from '../core/client';
import type { ProjectDirectoryResponse } from './directory';

export type PortfolioUpdateKind = 'issue' | 'document' | 'agent_run' | 'metric';

export interface PortfolioUpdateItem {
  id: string;
  kind: PortfolioUpdateKind;
  projectId: number;
  projectKey: string;
  projectName: string;
  projectRef: string;
  title: string;
  summary: string;
  actorName: string | null;
  status: string | null;
  entityId: number;
  issueSeq: number | null;
  createdAt: string;
}

export interface PortfolioUpdatesResponse {
  items: PortfolioUpdateItem[];
  counts: {
    issue: number;
    document: number;
    agent_run: number;
    metric: number;
    total: number;
  };
  projectCounts: Record<string, number>;
  coveredProjectsCount: number;
  totalProjectsCount: number;
  days: number;
}

export interface PortfolioApprovalItem {
  id: string;
  teamId: number;
  projectId: number;
  projectKey: string;
  projectName: string;
  projectRef: string;
  agentId: number;
  threadId: string | null;
  toolCallId: string;
  toolName: string;
  kind: string;
  payload: Record<string, unknown>;
  requestedByUserId: string | null;
  decidedByUserId: string | null;
  requireSod: boolean;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export function fetchPortfolioDirectory(projectKey?: string): Promise<ProjectDirectoryResponse> {
  const qs = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : '';
  return request<ProjectDirectoryResponse>(`/portfolio/directory${qs}`);
}

export function fetchPortfolioUpdates(params?: {
  projectKey?: string;
  days?: number;
  perProject?: number;
  limit?: number;
  kinds?: PortfolioUpdateKind[];
}): Promise<PortfolioUpdatesResponse> {
  const q = new URLSearchParams();
  if (params?.projectKey) q.set('projectKey', params.projectKey);
  if (params?.days) q.set('days', String(params.days));
  if (params?.perProject) q.set('perProject', String(params.perProject));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.kinds?.length) q.set('kinds', params.kinds.join(','));
  const qs = q.toString();
  return request<PortfolioUpdatesResponse>(`/portfolio/updates${qs ? `?${qs}` : ''}`);
}

export function fetchPortfolioApprovals(
  status: 'pending' | 'approved' | 'rejected' | 'expired' = 'pending',
): Promise<{ items: PortfolioApprovalItem[] }> {
  return request<{ items: PortfolioApprovalItem[] }>(
    `/portfolio/approvals?status=${encodeURIComponent(status)}`,
  );
}
