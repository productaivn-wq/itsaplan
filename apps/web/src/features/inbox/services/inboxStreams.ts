import type { Notification } from '@/lib/api/endpoints/notifications';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';

export type InboxScope = 'project' | 'all';
export type InboxGroupBy = 'stream' | 'project';
export type InboxBucket =
  | 'all'
  | 'decisions'
  | 'updates'
  | 'comms'
  | 'contacts'
  | 'channels'
  | 'queue'
  | 'handoffs'
  | 'intake'
  | 'mentions';
export type BridgeHealthStatus = 'ok' | 'disabled' | 'quarantined' | 'offline';

export interface GuardrailAssessment {
  status: 'clean' | 'flagged' | 'quarantined';
  threatScore: number;
  categories: string[];
  matchedSignals: string[];
  sanitizedApplied: boolean;
  actionBlocked: boolean;
  reason: string;
}

export interface RuleEvaluation {
  withinRules: boolean;
  ruleStatus: 'within_rules' | 'needs_action' | 'quarantined';
  ruleCode: string;
  ruleLabel: string;
  reason: string;
  requiresNextSteps: boolean;
}

export interface CommNextStepProposal {
  recommendedAction:
    | 'quarantine_review'
    | 'human_approval'
    | 'create_task'
    | 'dispatch_agent'
    | 'reassign_project'
    | 'register_contact'
    | 'fix_delivery'
    | 'mute_channel';
  headline: string;
  rationale: string;
  steps: string[];
  suggestedReply: string;
  suggestedTaskTitle: string;
  suggestedProjectKey: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidencePct: number;
  ruleCode?: string;
  ruleLabel?: string;
  salutationNote: string | null;
}

export interface InboxDigestProjectSummary {
  projectKey: string;
  projectName: string;
  totalItems: number;
  withinRulesCount: number;
  outOfRulesCount: number;
  quarantinedCount: number;
  channels: string[];
  updateHighlights: string[];
  nextStepsCount: number;
  lastUpdatedAt?: string | null;
}

export interface InboxDigestNextStep {
  itemId: string;
  itemKind: 'comm' | 'queue' | 'intake';
  projectKey: string;
  title: string;
  sourceLabel: string;
  ruleCode: string;
  ruleLabel: string;
  priority: string;
  recommendedAction: string;
  headline: string;
  rationale: string;
  steps: string[];
  actionBlocked: boolean;
  timestamp: string;
}

export interface InboxDigest {
  totalItems: number;
  withinRulesCount: number;
  outOfRulesCount: number;
  guardrails: {
    cleanCount: number;
    flaggedCount: number;
    quarantinedCount: number;
    blockedItems: Array<{
      itemId: string;
      projectKey: string;
      title: string;
      reason: string;
      categories: string[];
    }>;
  };
  executiveSummary: {
    headline: string;
    bullets: string[];
  };
  projectSummaries: InboxDigestProjectSummary[];
  proposedNextSteps: InboxDigestNextStep[];
}

export interface InboxCollectionStatus {
  autoCollectEnabled: boolean;
  intervalSec: number;
  lastRunId: string | null;
  lastTrigger: string | null;
  lastCollectedAt: string | null;
  nextRunAt: string | null;
  durationMs: number;
  rawCollected: number;
  newlyIngested: number;
  deduplicated: number;
  quarantinedIpi: number;
  withinRules: number;
  outOfRules: number;
  sources: Record<string, number>;
  channelStatus: Record<string, string>;
  status: string;
}

export interface ProjectInboxCount {
  key: string;
  name: string;
  comms: number;
  queue: number;
  intake: number;
  total: number;
  lastUpdatedAt?: string | null;
}

export interface AvailableProjectOption {
  key: string;
  name: string;
}

export interface DecisionInboxItem {
  kind: 'decision';
  id: string;
  contractId: string;
  title: string;
  projectKey: string;
  actorId: string;
  actorName: string;
  domain: string;
  priority: string;
  confidencePct: number | null;
  acceptanceCriteria: string[];
  evidenceSummary: string;
  evidenceLinks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommInboxItem {
  kind: 'comm';
  id: string;
  source: string;
  channel: string;
  channelName: string;
  targetHandle: string;
  sender: string;
  projectKey: string;
  category: 'inbound' | 'hitl_required' | 'task_created' | 'delivery_alert';
  preview: string;
  body: string;
  timestamp: string;
  actionable: boolean;
  channelId?: string;
  contactId?: string;
  contactName?: string;
  contactRole?: string;
  contactOrg?: string;
  routingSource?: string;
  routingReason?: string;
  isKnownContact?: boolean;
  isRegisteredChannel?: boolean;
  guardrail?: GuardrailAssessment;
  ruleEvaluation?: RuleEvaluation;
  updateSummary?: string;
  nextStepProposal?: CommNextStepProposal;
}

export interface QueueTaskInboxItem {
  kind: 'queue';
  id: string;
  source: string;
  taskKey: string;
  issueSeq: number | null;
  issueId: number | null;
  projectKey: string;
  projectName: string;
  title: string;
  status: string;
  priority: string;
  category: 'queued_issue' | 'blocked_task' | 'schedule_alert' | 'failed_run';
  channel: string;
  summary: string;
  dueDate: string;
  timestamp: string;
  guardrail?: GuardrailAssessment;
  ruleEvaluation?: RuleEvaluation;
}

export interface HandoffInboxItem {
  kind: 'handoff';
  id: string;
  eventType: string;
  contractId: string;
  title: string;
  summary: string;
  actorName: string;
  projectKey: string;
  evidenceHash: string;
  timestamp: string;
  isLive: boolean;
}

export interface IntakeInboxItem {
  kind: 'intake';
  id: string;
  name: string;
  relativePath: string;
  projectKey?: string;
  projectFolder?: string;
  sizeFormatted: string;
  mimeType: string;
  modifiedAt: string;
  summary?: string;
  guardrail?: GuardrailAssessment;
  ruleEvaluation?: RuleEvaluation;
}

export interface NotificationInboxItem {
  kind: 'notification';
  id: string;
  notification: Notification;
  timestamp: string;
}

export interface UpdateInboxItem {
  kind: 'update';
  id: string;
  updateKind: 'issue' | 'document' | 'agent_run' | 'metric';
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
  timestamp: string;
}

export interface ContactInboxItem {
  kind: 'contact';
  id: string;
  externalKey: string;
  name: string;
  role: string;
  raciRole: string;
  orgId: string;
  lifecycleStage: string;
  primaryEmail: string;
  phone: string;
  source: string;
  projectKey: string;
  projectName: string;
  projectRef: string;
}

export interface ChannelInboxItem {
  kind: 'channel';
  id: string;
  channelId: string;
  platform: string;
  threadType: string;
  displayName: string;
  targetId: string;
  aliases: string[];
  status: string;
  lastSyncedAt: string | null;
  projectKey: string;
  projectName: string;
  projectRef: string;
}

export interface MutedChannelInfo {
  channelKey: string;
  platform: string;
  displayName: string;
  reason: string;
  mutedAt: string;
}

export type InboxStreamItem =
  | DecisionInboxItem
  | UpdateInboxItem
  | CommInboxItem
  | ContactInboxItem
  | ChannelInboxItem
  | QueueTaskInboxItem
  | HandoffInboxItem
  | IntakeInboxItem
  | NotificationInboxItem;

export interface PortfolioInboxCounts {
  comms: number;
  queue: number;
  intake: number;
  total: number;
  otherProjects: number;
}

export interface IntakeDocumentPreview {
  fileName: string;
  relativePath: string;
  sizeFormatted: string;
  totalLines: number;
  isBinary: boolean;
  content: string;
  bridgeDisabled?: boolean;
}

const SESSION_APPROVER_ID = 'hum-phuong-vo';
const PENDING_STATUS = ['AWAITING', 'HITL'].join('_');
const ACTION_LIST_KEY = ['needs', 'my', 'action'].join('_');
const SCOPE_STORAGE_KEY = 'accord_inbox_scope_v1';
const GROUP_BY_STORAGE_KEY = 'accord_inbox_groupby_v1';
const DISMISSED_STORAGE_KEY = 'accord_inbox_dismissed_v1';
const DISMISSED_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const HANDOFF_EVENT_TYPES = new Set([
  'EVIDENCE_SUBMITTED',
  'CONTRACT_RETURNED',
  'AGENT_STEERED',
]);

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === 'object' ? (val as Record<string, unknown>) : null;
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  const obj = asRecord(payload);
  if (!obj) return fallback;
  const candidate = obj.error ?? obj.detail ?? obj.message;
  return typeof candidate === 'string' && candidate.trim() ? candidate : fallback;
}

/** Parses pending decisions and recent agent handoffs from Open Office state payload. */
export function parseOpenOfficeInboxData(payload: unknown): {
  decisions: DecisionInboxItem[];
  handoffs: HandoffInboxItem[];
} {
  const root = asRecord(payload);
  if (!root) return { decisions: [], handoffs: [] };

  const contractsRaw = Array.isArray(root.contracts) ? root.contracts : [];
  const contractById = new Map<string, Record<string, unknown>>();
  for (const entry of contractsRaw) {
    const rec = asRecord(entry);
    const id = rec ? asString(rec.id) : '';
    if (id) contractById.set(id, rec!);
  }

  const analytics = asRecord(root.analytics);
  const recentEvents = Array.isArray(analytics?.recent_events) ? analytics!.recent_events : [];

  // Index latest submitted evidence per contract so inline reviews carry real proof context.
  const latestEvidenceByContract = new Map<string, string>();
  for (const rawEvent of recentEvents) {
    const evt = asRecord(rawEvent);
    if (!evt) continue;
    const cid = asString(evt.contract_id);
    if (cid && asString(evt.event_type) === 'EVIDENCE_SUBMITTED' && !latestEvidenceByContract.has(cid)) {
      latestEvidenceByContract.set(cid, asString(evt.summary));
    }
  }

  const actionList = root[ACTION_LIST_KEY];
  const pendingSource: unknown[] = Array.isArray(actionList)
    ? actionList
    : contractsRaw.filter((entry) => asString(asRecord(entry)?.status) === PENDING_STATUS);

  const decisions: DecisionInboxItem[] = [];
  const seenDecisionIds = new Set<string>();
  for (const rawContract of pendingSource) {
    const c = asRecord(rawContract);
    if (!c) continue;
    const contractId = asString(c.id);
    if (!contractId || seenDecisionIds.has(contractId)) continue;
    seenDecisionIds.add(contractId);

    const actorId = asString(c.lead_agent_id, '@antigravity');
    const actorName = asString(c.lead_agent_name) || actorId;
    const evidenceSummary =
      asString(c.evidence_summary) ||
      asString(c.review_reason) ||
      latestEvidenceByContract.get(contractId) ||
      '';

    decisions.push({
      kind: 'decision',
      id: `decision:${contractId}`,
      contractId,
      title: asString(c.title, contractId),
      projectKey: asString(c.project_key, 'PM'),
      actorId,
      actorName,
      domain: asString(c.domain, 'General'),
      priority: asString(c.priority, 'MEDIUM'),
      confidencePct: typeof c.confidence_pct === 'number' ? c.confidence_pct : null,
      acceptanceCriteria: asStringArray(c.acceptance_criteria),
      evidenceSummary,
      evidenceLinks: asStringArray(c.evidence_links),
      createdAt: asString(c.created_at),
      updatedAt: asString(c.updated_at) || asString(c.created_at),
    });
  }

  const handoffs: HandoffInboxItem[] = [];
  const seenHandoffIds = new Set<string>();

  const liveFeed = Array.isArray(root.live_activity_feed) ? root.live_activity_feed : [];
  for (const rawLive of liveFeed) {
    const live = asRecord(rawLive);
    if (!live || live.is_live_executing !== true) continue;
    const rawId = asString(live.id) || asString(live.session_id);
    if (!rawId) continue;
    const itemId = `handoff:live:${rawId}`;
    if (seenHandoffIds.has(itemId)) continue;
    seenHandoffIds.add(itemId);

    const agentName = asString(live.agent_name) || asString(live.agent_id, 'Agent');
    const title = asString(live.prompt_snippet) || asString(live.zone_name) || agentName;
    const summary = asString(live.summary) || asString(live.action_label);

    handoffs.push({
      kind: 'handoff',
      id: itemId,
      eventType: 'LIVE_SESSION',
      contractId: '',
      title,
      summary,
      actorName: agentName,
      projectKey: asString(root.selected_project_key, ''),
      evidenceHash: '',
      timestamp: new Date().toISOString(),
      isLive: true,
    });
  }

  for (const rawEvent of recentEvents) {
    if (handoffs.length >= 15) break;
    const evt = asRecord(rawEvent);
    if (!evt) continue;
    const eventType = asString(evt.event_type);
    if (!HANDOFF_EVENT_TYPES.has(eventType)) continue;
    const eventId = asString(evt.event_id) || `${asString(evt.contract_id)}:${asString(evt.timestamp)}`;
    const itemId = `handoff:${eventId}`;
    if (seenHandoffIds.has(itemId)) continue;
    seenHandoffIds.add(itemId);

    const contractId = asString(evt.contract_id);
    const linked = contractById.get(contractId);
    const title = linked ? asString(linked.title, contractId) : contractId || eventType;
    const projectKey = linked ? asString(linked.project_key) : asString(root.selected_project_key);

    handoffs.push({
      kind: 'handoff',
      id: itemId,
      eventType,
      contractId,
      title,
      summary: asString(evt.summary),
      actorName: asString(evt.actor_id, 'Agent'),
      projectKey,
      evidenceHash: asString(evt.event_hash) || asString(evt.sha256_hash),
      timestamp: asString(evt.timestamp) || asString(evt.created_at),
      isLive: false,
    });
  }

  return { decisions, handoffs };
}

/** Fetches pending contract decisions and recent agent handoffs from Open Office bridge. */
export async function fetchOpenOfficeInboxData(
  shortProjectKey: string | null,
  signal?: AbortSignal,
): Promise<{
  decisions: DecisionInboxItem[];
  handoffs: HandoffInboxItem[];
  bridgeStatus: BridgeHealthStatus;
}> {
  if (!isHostVibeEnabled()) {
    return { decisions: [], handoffs: [], bridgeStatus: 'disabled' };
  }
  try {
    const query = shortProjectKey ? `?project_key=${encodeURIComponent(shortProjectKey)}` : '';
    const url = `/api/vibe/open-office/state${query}`;
    const res = signal ? await fetch(url, { signal }) : await fetch(url);
    if (res.status === 403) return { decisions: [], handoffs: [], bridgeStatus: 'quarantined' };
    if (!res.ok) return { decisions: [], handoffs: [], bridgeStatus: 'offline' };
    const data: unknown = await res.json();
    return { ...parseOpenOfficeInboxData(data), bridgeStatus: 'ok' };
  } catch {
    if (signal?.aborted) {
      return { decisions: [], handoffs: [], bridgeStatus: 'ok' };
    }
    return { decisions: [], handoffs: [], bridgeStatus: 'offline' };
  }
}

/** Parses non-dotfile workspace intake files from the 00_INBOX zone payload. */
export function parseIntakeFiles(payload: unknown): IntakeInboxItem[] {
  const root = asRecord(payload);
  if (!root || !Array.isArray(root['00_INBOX'])) return [];

  const items: IntakeInboxItem[] = [];
  for (const rawFile of root['00_INBOX']) {
    const file = asRecord(rawFile);
    if (!file) continue;
    const name = asString(file.name);
    const relativePath = asString(file.relative_path);
    if (!name || !relativePath) continue;
    if (name.startsWith('.') || name.toLowerCase() === 'thumbs.db') continue;

    items.push({
      kind: 'intake',
      id: `intake:${relativePath}`,
      name,
      relativePath,
      projectKey: asString(file.project_key) || undefined,
      projectFolder: asString(file.project_folder) || undefined,
      sizeFormatted: asString(file.size_formatted, '0 B'),
      mimeType: asString(file.mime_type, 'text/plain'),
      modifiedAt: asString(file.modified_at),
    });
  }

  items.sort((a, b) => Date.parse(b.modifiedAt || '') - Date.parse(a.modifiedAt || ''));
  return items;
}

/** Fetches untriaged 00_INBOX files from the 5-zone bridge. */
export async function fetchIntakeFiles(): Promise<IntakeInboxItem[]> {
  if (!isHostVibeEnabled()) return [];
  try {
    const res = await fetch('/api/vibe/zones');
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return parseIntakeFiles(data);
  } catch {
    return [];
  }
}

const COMM_CATEGORIES = new Set<CommInboxItem['category']>([
  'inbound',
  'hitl_required',
  'task_created',
  'delivery_alert',
]);
const QUEUE_CATEGORIES = new Set<QueueTaskInboxItem['category']>([
  'queued_issue',
  'blocked_task',
  'schedule_alert',
  'failed_run',
]);

function normalizeCommCategory(val: string): CommInboxItem['category'] {
  return COMM_CATEGORIES.has(val as CommInboxItem['category'])
    ? (val as CommInboxItem['category'])
    : 'inbound';
}

function normalizeQueueCategory(val: string): QueueTaskInboxItem['category'] {
  return QUEUE_CATEGORIES.has(val as QueueTaskInboxItem['category'])
    ? (val as QueueTaskInboxItem['category'])
    : 'queued_issue';
}

function parseGuardrail(raw: unknown): GuardrailAssessment | undefined {
  const g = asRecord(raw);
  if (!g) return undefined;
  const stRaw = asString(g.status, 'clean');
  const status: GuardrailAssessment['status'] =
    stRaw === 'quarantined' || stRaw === 'flagged' ? stRaw : 'clean';
  return {
    status,
    threatScore: typeof g.threatScore === 'number' ? g.threatScore : 0,
    categories: asStringArray(g.categories),
    matchedSignals: asStringArray(g.matchedSignals),
    sanitizedApplied: g.sanitizedApplied === true,
    actionBlocked: g.actionBlocked === true,
    reason: asString(g.reason),
  };
}

function parseRuleEvaluation(raw: unknown): RuleEvaluation | undefined {
  const r = asRecord(raw);
  if (!r) return undefined;
  const stRaw = asString(r.ruleStatus, 'within_rules');
  const ruleStatus: RuleEvaluation['ruleStatus'] =
    stRaw === 'quarantined' || stRaw === 'needs_action' ? stRaw : 'within_rules';
  return {
    withinRules: r.withinRules === true,
    ruleStatus,
    ruleCode: asString(r.ruleCode, 'WITHIN_RULES'),
    ruleLabel: asString(r.ruleLabel, 'Within Rules'),
    reason: asString(r.reason),
    requiresNextSteps: r.requiresNextSteps === true,
  };
}

const VALID_PROPOSAL_ACTIONS = new Set<CommNextStepProposal['recommendedAction']>([
  'quarantine_review',
  'human_approval',
  'create_task',
  'dispatch_agent',
  'reassign_project',
  'register_contact',
  'fix_delivery',
  'mute_channel',
]);

function parseProposal(raw: unknown): CommNextStepProposal | undefined {
  const p = asRecord(raw);
  if (!p) return undefined;
  const headline = asString(p.headline);
  if (!headline) return undefined;
  const actionRaw = asString(p.recommendedAction, 'dispatch_agent');
  const recommendedAction: CommNextStepProposal['recommendedAction'] = VALID_PROPOSAL_ACTIONS.has(
    actionRaw as CommNextStepProposal['recommendedAction'],
  )
    ? (actionRaw as CommNextStepProposal['recommendedAction'])
    : 'dispatch_agent';
  const prioRaw = asString(p.priority, 'MEDIUM').toUpperCase();
  const priority: CommNextStepProposal['priority'] =
    prioRaw === 'HIGH' || prioRaw === 'LOW' ? prioRaw : 'MEDIUM';
  return {
    recommendedAction,
    headline,
    rationale: asString(p.rationale),
    steps: asStringArray(p.steps),
    suggestedReply: '',
    suggestedTaskTitle: asString(p.suggestedTaskTitle),
    suggestedProjectKey: asString(p.suggestedProjectKey, 'PM'),
    priority,
    confidencePct: typeof p.confidencePct === 'number' ? p.confidencePct : 80,
    ruleCode: asString(p.ruleCode) || undefined,
    ruleLabel: asString(p.ruleLabel) || undefined,
    salutationNote: null,
  };
}

function parseInboxDigest(raw: unknown): InboxDigest | null {
  const d = asRecord(raw);
  if (!d) return null;
  const guardObj = asRecord(d.guardrails);
  const execObj = asRecord(d.executiveSummary);
  const blockedRaw = Array.isArray(guardObj?.blockedItems) ? guardObj!.blockedItems : [];
  const blockedItems: InboxDigest['guardrails']['blockedItems'] = [];
  for (const item of blockedRaw) {
    const rec = asRecord(item);
    if (!rec) continue;
    blockedItems.push({
      itemId: asString(rec.itemId),
      projectKey: asString(rec.projectKey, 'UNASSIGNED'),
      title: asString(rec.title),
      reason: asString(rec.reason),
      categories: asStringArray(rec.categories),
    });
  }

  const projSummariesRaw = Array.isArray(d.projectSummaries) ? d.projectSummaries : [];
  const projectSummaries: InboxDigestProjectSummary[] = [];
  for (const entry of projSummariesRaw) {
    const p = asRecord(entry);
    if (!p) continue;
    projectSummaries.push({
      projectKey: asString(p.projectKey, 'PM'),
      projectName: asString(p.projectName, asString(p.projectKey, 'PM')),
      totalItems: typeof p.totalItems === 'number' ? p.totalItems : 0,
      withinRulesCount: typeof p.withinRulesCount === 'number' ? p.withinRulesCount : 0,
      outOfRulesCount: typeof p.outOfRulesCount === 'number' ? p.outOfRulesCount : 0,
      quarantinedCount: typeof p.quarantinedCount === 'number' ? p.quarantinedCount : 0,
      channels: asStringArray(p.channels),
      updateHighlights: asStringArray(p.updateHighlights),
      nextStepsCount: typeof p.nextStepsCount === 'number' ? p.nextStepsCount : 0,
      lastUpdatedAt: asString(p.lastUpdatedAt) || asString(p.last_updated_at) || null,
    });
  }

  const nextStepsRaw = Array.isArray(d.proposedNextSteps) ? d.proposedNextSteps : [];
  const proposedNextSteps: InboxDigestNextStep[] = [];
  for (const entry of nextStepsRaw) {
    const s = asRecord(entry);
    if (!s) continue;
    const kindRaw = asString(s.itemKind, 'comm');
    const itemKind: InboxDigestNextStep['itemKind'] =
      kindRaw === 'queue' || kindRaw === 'intake' ? kindRaw : 'comm';
    proposedNextSteps.push({
      itemId: asString(s.itemId),
      itemKind,
      projectKey: asString(s.projectKey, 'PM'),
      title: asString(s.title),
      sourceLabel: asString(s.sourceLabel),
      ruleCode: asString(s.ruleCode, 'NEEDS_ACTION'),
      ruleLabel: asString(s.ruleLabel, 'Outside Rules'),
      priority: asString(s.priority, 'MEDIUM'),
      recommendedAction: asString(s.recommendedAction, 'dispatch_agent'),
      headline: asString(s.headline),
      rationale: asString(s.rationale),
      steps: asStringArray(s.steps),
      actionBlocked: s.actionBlocked === true,
      timestamp: asString(s.timestamp),
    });
  }

  return {
    totalItems: typeof d.totalItems === 'number' ? d.totalItems : 0,
    withinRulesCount: typeof d.withinRulesCount === 'number' ? d.withinRulesCount : 0,
    outOfRulesCount: typeof d.outOfRulesCount === 'number' ? d.outOfRulesCount : 0,
    guardrails: {
      cleanCount: typeof guardObj?.cleanCount === 'number' ? guardObj.cleanCount : 0,
      flaggedCount: typeof guardObj?.flaggedCount === 'number' ? guardObj.flaggedCount : 0,
      quarantinedCount: typeof guardObj?.quarantinedCount === 'number' ? guardObj.quarantinedCount : 0,
      blockedItems,
    },
    executiveSummary: {
      headline: asString(execObj?.headline),
      bullets: asStringArray(execObj?.bullets),
    },
    projectSummaries,
    proposedNextSteps,
  };
}

function parseCollectionStatus(raw: unknown): InboxCollectionStatus | null {
  const c = asRecord(raw);
  if (!c) return null;
  const sourcesObj: Record<string, number> = {};
  const rawSources = asRecord(c.sources);
  if (rawSources) {
    for (const [k, v] of Object.entries(rawSources)) {
      if (typeof v === 'number') sourcesObj[k] = v;
    }
  }
  const chStatusObj: Record<string, string> = {};
  const rawCh = asRecord(c.channelStatus);
  if (rawCh) {
    for (const [k, v] of Object.entries(rawCh)) {
      if (typeof v === 'string') chStatusObj[k] = v;
    }
  }
  return {
    autoCollectEnabled: c.autoCollectEnabled !== false,
    intervalSec: typeof c.intervalSec === 'number' ? c.intervalSec : 300,
    lastRunId: typeof c.lastRunId === 'string' ? c.lastRunId : null,
    lastTrigger: typeof c.lastTrigger === 'string' ? c.lastTrigger : null,
    lastCollectedAt: typeof c.lastCollectedAt === 'string' ? c.lastCollectedAt : null,
    nextRunAt: typeof c.nextRunAt === 'string' ? c.nextRunAt : null,
    durationMs: typeof c.durationMs === 'number' ? c.durationMs : 0,
    rawCollected: typeof c.rawCollected === 'number' ? c.rawCollected : 0,
    newlyIngested: typeof c.newlyIngested === 'number' ? c.newlyIngested : 0,
    deduplicated: typeof c.deduplicated === 'number' ? c.deduplicated : 0,
    quarantinedIpi: typeof c.quarantinedIpi === 'number' ? c.quarantinedIpi : 0,
    withinRules: typeof c.withinRules === 'number' ? c.withinRules : 0,
    outOfRules: typeof c.outOfRules === 'number' ? c.outOfRules : 0,
    sources: sourcesObj,
    channelStatus: chStatusObj,
    status: asString(c.status, 'ok'),
  };
}

/** Parses unified OmniComm, cross-project queued tasks, and portfolio 00_INBOX streams. */
export function parseUnifiedInboxStreams(payload: unknown): {
  comms: CommInboxItem[];
  queueTasks: QueueTaskInboxItem[];
  intakeFiles: IntakeInboxItem[];
  portfolioCounts: PortfolioInboxCounts;
  projectCounts: Record<string, ProjectInboxCount>;
  availableProjects: AvailableProjectOption[];
  suppressedNoiseCount: number;
  mutedChannels?: MutedChannelInfo[];
  inboxDigest: InboxDigest | null;
  collectionStatus: InboxCollectionStatus | null;
} {
  const root = asRecord(payload);
  if (!root) {
    return {
      comms: [],
      queueTasks: [],
      intakeFiles: [],
      portfolioCounts: { comms: 0, queue: 0, intake: 0, total: 0, otherProjects: 0 },
      projectCounts: {},
      availableProjects: [],
      suppressedNoiseCount: 0,
      inboxDigest: null,
      collectionStatus: null,
    };
  }

  const commsRaw = Array.isArray(root.comms) ? root.comms : [];
  const comms: CommInboxItem[] = [];
  for (const entry of commsRaw) {
    const c = asRecord(entry);
    if (!c) continue;
    const id = asString(c.id);
    if (!id) continue;
    comms.push({
      kind: 'comm',
      id,
      source: asString(c.source, 'omnichat'),
      channel: asString(c.channel, 'zalo'),
      channelName: asString(c.channelName) || asString(c.sender, 'Channel'),
      targetHandle: asString(c.targetHandle),
      sender: asString(c.sender, 'Contact'),
      projectKey: asString(c.projectKey, 'UNASSIGNED'),
      category: normalizeCommCategory(asString(c.category, 'inbound')),
      preview: asString(c.preview) || asString(c.body),
      body: asString(c.body) || asString(c.preview),
      timestamp: asString(c.timestamp),
      actionable: c.actionable !== false,
      channelId: asString(c.channelId) || undefined,
      contactId: asString(c.contactId) || undefined,
      contactName: asString(c.contactName) || undefined,
      contactRole: asString(c.contactRole) || undefined,
      contactOrg: asString(c.contactOrg) || undefined,
      routingSource: asString(c.routingSource) || undefined,
      routingReason: asString(c.routingReason) || undefined,
      isKnownContact: c.isKnownContact === true,
      isRegisteredChannel: c.isRegisteredChannel === true,
      guardrail: parseGuardrail(c.guardrail),
      ruleEvaluation: parseRuleEvaluation(c.ruleEvaluation),
      updateSummary: asString(c.updateSummary) || undefined,
      nextStepProposal: parseProposal(c.nextStepProposal),
    });
  }

  const queueRaw = Array.isArray(root.queued_tasks) ? root.queued_tasks : [];
  const queueTasks: QueueTaskInboxItem[] = [];
  for (const entry of queueRaw) {
    const q = asRecord(entry);
    if (!q) continue;
    const id = asString(q.id);
    if (!id) continue;
    queueTasks.push({
      kind: 'queue',
      id,
      source: asString(q.source, 'tasks'),
      taskKey: asString(q.taskKey, id),
      issueSeq: typeof q.issueSeq === 'number' ? q.issueSeq : null,
      issueId: typeof q.issueId === 'number' ? q.issueId : null,
      projectKey: asString(q.projectKey, 'PM'),
      projectName: asString(q.projectName) || asString(q.projectKey, 'PM'),
      title: asString(q.title, id),
      status: asString(q.status, 'Todo'),
      priority: asString(q.priority, 'MEDIUM'),
      category: normalizeQueueCategory(asString(q.category, 'queued_issue')),
      channel: asString(q.channel, 'tasks'),
      summary: asString(q.summary),
      dueDate: asString(q.dueDate),
      timestamp: asString(q.timestamp),
      guardrail: parseGuardrail(q.guardrail),
      ruleEvaluation: parseRuleEvaluation(q.ruleEvaluation),
    });
  }

  const intakeRaw = Array.isArray(root.intake_files) ? root.intake_files : [];
  const intakeFiles: IntakeInboxItem[] = [];
  for (const entry of intakeRaw) {
    const f = asRecord(entry);
    if (!f) continue;
    const name = asString(f.name);
    const relativePath = asString(f.relative_path);
    if (!name || !relativePath) continue;
    if (name.startsWith('.') || name.toLowerCase() === 'thumbs.db') continue;
    const projKey = asString(f.project_key) || undefined;
    intakeFiles.push({
      kind: 'intake',
      id: asString(f.id) || `intake:${projKey ?? 'PM'}:${relativePath}`,
      name,
      relativePath,
      projectKey: projKey,
      projectFolder: asString(f.project_folder) || undefined,
      sizeFormatted: asString(f.size_formatted, '0 B'),
      mimeType: asString(f.mime_type, 'text/plain'),
      modifiedAt: asString(f.modified_at),
      summary: asString(f.summary) || undefined,
      guardrail: parseGuardrail(f.guardrail),
      ruleEvaluation: parseRuleEvaluation(f.ruleEvaluation),
    });
  }

  const countsObj = asRecord(root.portfolio_counts);
  const commsCount = typeof countsObj?.comms === 'number' ? countsObj.comms : comms.length;
  const queueCount = typeof countsObj?.queue === 'number' ? countsObj.queue : queueTasks.length;
  const intakeCount = typeof countsObj?.intake === 'number' ? countsObj.intake : intakeFiles.length;
  const totalCount =
    typeof countsObj?.total === 'number' ? countsObj.total : commsCount + queueCount + intakeCount;
  const otherProjects =
    typeof root.other_projects_count === 'number' ? root.other_projects_count : 0;

  const projectCounts: Record<string, ProjectInboxCount> = {};
  const pcRaw = asRecord(root.project_counts);
  if (pcRaw) {
    for (const [k, rawVal] of Object.entries(pcRaw)) {
      const v = asRecord(rawVal);
      if (!v) continue;
      projectCounts[k] = {
        key: asString(v.key, k),
        name: asString(v.name, k),
        comms: typeof v.comms === 'number' ? v.comms : 0,
        queue: typeof v.queue === 'number' ? v.queue : 0,
        intake: typeof v.intake === 'number' ? v.intake : 0,
        total: typeof v.total === 'number' ? v.total : 0,
        lastUpdatedAt: asString(v.lastUpdatedAt) || asString(v.last_updated_at) || null,
      };
    }
  }

  const availableProjects: AvailableProjectOption[] = [];
  if (Array.isArray(root.available_projects)) {
    for (const entry of root.available_projects) {
      const p = asRecord(entry);
      if (!p) continue;
      const key = asString(p.key);
      if (!key) continue;
      availableProjects.push({ key, name: asString(p.name, key) });
    }
  }

  const suppressedNoiseCount =
    typeof root.suppressed_noise_count === 'number' ? root.suppressed_noise_count : 0;

  const mutedChannels: MutedChannelInfo[] = [];
  if (Array.isArray(root.muted_channels)) {
    for (const entry of root.muted_channels) {
      const m = asRecord(entry);
      if (!m) continue;
      const channelKey = asString(m.channelKey) || asString(m.channel_key);
      if (!channelKey) continue;
      mutedChannels.push({
        channelKey,
        platform: asString(m.platform) || asString(m.channel_platform, 'chat'),
        displayName: asString(m.displayName) || asString(m.display_name, channelKey),
        reason: asString(m.reason),
        mutedAt: asString(m.mutedAt) || asString(m.muted_at),
      });
    }
  }

  return {
    comms,
    queueTasks,
    intakeFiles,
    portfolioCounts: {
      comms: commsCount,
      queue: queueCount,
      intake: intakeCount,
      total: totalCount,
      otherProjects,
    },
    projectCounts,
    availableProjects,
    suppressedNoiseCount,
    mutedChannels,
    inboxDigest: parseInboxDigest(root.inbox_digest),
    collectionStatus: parseCollectionStatus(root.collection_status),
  };
}

/** Fetches unified OmniComm, cross-project queue, and multi-project intake streams. */
export async function fetchUnifiedInboxStreams(
  shortProjectKey: string | null,
  signal?: AbortSignal,
): Promise<{
  comms: CommInboxItem[];
  queueTasks: QueueTaskInboxItem[];
  intakeFiles: IntakeInboxItem[];
  portfolioCounts: PortfolioInboxCounts;
  projectCounts: Record<string, ProjectInboxCount>;
  availableProjects: AvailableProjectOption[];
  suppressedNoiseCount: number;
  mutedChannels?: MutedChannelInfo[];
  inboxDigest: InboxDigest | null;
  collectionStatus: InboxCollectionStatus | null;
  bridgeStatus: BridgeHealthStatus;
}> {
  const emptyCounts: PortfolioInboxCounts = {
    comms: 0,
    queue: 0,
    intake: 0,
    total: 0,
    otherProjects: 0,
  };
  if (!isHostVibeEnabled()) {
    return {
      comms: [],
      queueTasks: [],
      intakeFiles: [],
      portfolioCounts: emptyCounts,
      projectCounts: {},
      availableProjects: [],
      suppressedNoiseCount: 0,
      inboxDigest: null,
      collectionStatus: null,
      bridgeStatus: 'disabled',
    };
  }
  try {
    const query = shortProjectKey ? `?project_key=${encodeURIComponent(shortProjectKey)}` : '';
    const url = `/api/vibe/inbox/streams${query}`;
    const res = signal ? await fetch(url, { signal }) : await fetch(url);
    if (res.status === 403) {
      return {
        comms: [],
        queueTasks: [],
        intakeFiles: [],
        portfolioCounts: emptyCounts,
        projectCounts: {},
        availableProjects: [],
        suppressedNoiseCount: 0,
        inboxDigest: null,
        collectionStatus: null,
        bridgeStatus: 'quarantined',
      };
    }
    if (!res.ok) {
      return {
        comms: [],
        queueTasks: [],
        intakeFiles: [],
        portfolioCounts: emptyCounts,
        projectCounts: {},
        availableProjects: [],
        suppressedNoiseCount: 0,
        inboxDigest: null,
        collectionStatus: null,
        bridgeStatus: 'offline',
      };
    }
    const data: unknown = await res.json();
    const rec = asRecord(data);
    if (!rec || !Array.isArray(rec.intake_files)) {
      const fallbackIntake = await fetchIntakeFiles();
      return {
        comms: [],
        queueTasks: [],
        intakeFiles: fallbackIntake,
        portfolioCounts: {
          comms: 0,
          queue: 0,
          intake: fallbackIntake.length,
          total: fallbackIntake.length,
          otherProjects: 0,
        },
        projectCounts: {},
        availableProjects: [],
        suppressedNoiseCount: 0,
        inboxDigest: null,
        collectionStatus: null,
        bridgeStatus: 'ok',
      };
    }
    return { ...parseUnifiedInboxStreams(data), bridgeStatus: 'ok' };
  } catch {
    if (signal?.aborted) {
      return {
        comms: [],
        queueTasks: [],
        intakeFiles: [],
        portfolioCounts: emptyCounts,
        projectCounts: {},
        availableProjects: [],
        suppressedNoiseCount: 0,
        inboxDigest: null,
        collectionStatus: null,
        bridgeStatus: 'ok',
      };
    }
    return {
      comms: [],
      queueTasks: [],
      intakeFiles: [],
      portfolioCounts: emptyCounts,
      projectCounts: {},
      availableProjects: [],
      suppressedNoiseCount: 0,
      inboxDigest: null,
      collectionStatus: null,
      bridgeStatus: 'offline',
    };
  }
}

/** Lazy-loads up to 120 lines of a 00_INBOX document for inline inspection. */
export async function fetchIntakePreview(
  relativePath: string,
  projectFolder?: string,
): Promise<IntakeDocumentPreview> {
  if (!isHostVibeEnabled()) {
    return {
      fileName: relativePath,
      relativePath,
      sizeFormatted: '',
      totalLines: 0,
      isBinary: false,
      content: '',
      bridgeDisabled: true,
    };
  }
  const folderQuery = projectFolder ? `&project_folder=${encodeURIComponent(projectFolder)}` : '';
  const res = await fetch(
    `/api/vibe/document?path=${encodeURIComponent(relativePath)}&start_line=1&end_line=120${folderQuery}`,
  );
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `HTTP ${res.status}`));
  }
  const obj = asRecord(data) ?? {};
  const lines = Array.isArray(obj.lines)
    ? obj.lines.filter((line): line is string => typeof line === 'string')
    : [];
  const content = asString(obj.content) || lines.join('\n');

  return {
    fileName: asString(obj.file_name, relativePath),
    relativePath: asString(obj.relative_path, relativePath),
    sizeFormatted: asString(obj.size_formatted, ''),
    totalLines: typeof obj.total_lines === 'number' ? obj.total_lines : lines.length,
    isBinary: obj.is_binary === true,
    content,
  };
}

/** Submits a persisted triage action (dismiss, reopen, dispatch_to_agent, reply_omnichat, mute_channel, reassign_project, bind_to_directory). */
export async function submitInboxTriageAction(input: {
  action:
    | 'dismiss'
    | 'resolve'
    | 'reopen'
    | 'dispatch_to_agent'
    | 'reply_omnichat'
    | 'mute_channel'
    | 'unmute_channel'
    | 'reassign_project'
    | 'bind_to_directory';
  itemId: string;
  title?: string;
  projectKey?: string;
  inputScope?: string;
  channel?: string;
  channelKey?: string;
  channelName?: string;
  target?: string;
  message?: string;
  note?: string;
  sender?: string;
  role?: string;
  bindChannel?: boolean;
  bindContact?: boolean;
}): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const res = await fetch('/api/vibe/inbox/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: input.action,
      item_id: input.itemId,
      title: input.title,
      project_key: input.projectKey,
      input_scope: input.inputScope,
      channel: input.channel,
      channel_key: input.channelKey,
      channel_name: input.channelName,
      target: input.target,
      message: input.message,
      note: input.note,
      sender: input.sender,
      role: input.role,
      bind_channel: input.bindChannel,
      bind_contact: input.bindContact,
    }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `HTTP ${res.status}`));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
    if (
      input.action === 'bind_to_directory' ||
      input.action === 'mute_channel' ||
      input.bindChannel ||
      input.bindContact
    ) {
      window.dispatchEvent(new CustomEvent('itsaplan:directory-mutated'));
    }
  }
  return asRecord(data) ?? { ok: true };
}

/** Submits an accountable human review decision for a staged work contract. */
export async function submitContractDecision(input: {
  contractId: string;
  decision: 'APPROVE' | 'RETURN_FOR_REWORK';
  acceptanceVerified: boolean;
  reason: string;
}): Promise<void> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const res = await fetch('/api/vibe/open-office/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_id: input.contractId,
      decision: input.decision,
      approver_id: SESSION_APPROVER_ID,
      acceptance_verified: input.acceptanceVerified,
      reason: input.reason,
    }),
  });
  if (!res.ok) {
    const errPayload: unknown = await res.json().catch(() => null);
    throw new Error(parseErrorMessage(errPayload, `HTTP ${res.status}`));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
  }
}

/** Dispatches a 00_INBOX file directly into an agent work contract. */
export async function dispatchIntakeToAgent(input: {
  title: string;
  projectKey: string;
  relativePath: string;
  leadAgentId?: string;
}): Promise<void> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const res = await fetch('/api/vibe/open-office/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      project_key: input.projectKey || 'PM',
      lead_agent_id: input.leadAgentId || '@antigravity',
      template_id: 'tpl-code-feature',
      input_scope: input.relativePath,
      acceptance_criteria: [`Review and process intake item ${input.relativePath}`],
      auto_draft_criteria: true,
      auto_execute: true,
      confidence_pct: 95,
    }),
  });
  if (!res.ok) {
    const errPayload: unknown = await res.json().catch(() => null);
    throw new Error(parseErrorMessage(errPayload, `HTTP ${res.status}`));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
  }
}

/** Triggers an on-demand exhaustive inbox collection, guardrail scan, and digest cycle. */
export async function triggerInboxCollection(livePoll = true): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const res = await fetch('/api/vibe/inbox/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ live_poll: livePoll }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `HTTP ${res.status}`));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
  }
  return asRecord(data) ?? { ok: true };
}

/** Triggers deterministic 5-zone custodian triage across 00_INBOX. */
export async function triggerCustodianTriage(): Promise<{ moved?: number; summary?: string }> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const res = await fetch('/api/vibe/custodian/triage', { method: 'POST' });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `HTTP ${res.status}`));
  }
  const obj = asRecord(data) ?? {};
  return {
    moved: typeof obj.moved === 'number' ? obj.moved : undefined,
    summary: asString(obj.summary) || undefined,
  };
}

export function readStoredInboxScope(): InboxScope {
  if (typeof window === 'undefined') return 'all';
  try {
    return localStorage.getItem(SCOPE_STORAGE_KEY) === 'project' ? 'project' : 'all';
  } catch {
    return 'all';
  }
}

export function writeStoredInboxScope(scope: InboxScope): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  } catch {
    // Storage unavailable (private mode / quota): scope applies for the active session.
  }
}

export function readStoredInboxGroupBy(): InboxGroupBy {
  if (typeof window === 'undefined') return 'stream';
  try {
    return localStorage.getItem(GROUP_BY_STORAGE_KEY) === 'project' ? 'project' : 'stream';
  } catch {
    return 'stream';
  }
}

export function writeStoredInboxGroupBy(groupBy: InboxGroupBy): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GROUP_BY_STORAGE_KEY, groupBy);
  } catch {
    // Storage unavailable (private mode / quota): grouping applies for the active session.
  }
}

export function readDismissedHandoffIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DISMISSED_STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return new Set();
    const now = Date.now();
    const kept: Record<string, number> = {};
    let pruned = false;
    for (const [id, ts] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof ts === 'number' && now - ts <= DISMISSED_TTL_MS) {
        kept[id] = ts;
      } else {
        pruned = true;
      }
    }
    if (pruned) {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(kept));
    }
    return new Set(Object.keys(kept));
  } catch {
    return new Set();
  }
}

export function writeDismissedHandoffIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw: unknown = JSON.parse(localStorage.getItem(DISMISSED_STORAGE_KEY) ?? 'null');
    const existing = asRecord(existingRaw) ?? {};
    const now = Date.now();
    const next: Record<string, number> = {};
    for (const id of ids) {
      const prevTs = existing[id];
      next[id] = typeof prevTs === 'number' ? prevTs : now;
    }
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode / quota): dismissal stays in memory.
  }
}

export interface InboxFocusTarget {
  bucket?: InboxBucket;
  projectKey?: string;
  search?: string;
}

const INBOX_FOCUS_KEY = 'accord_inbox_focus_v1';

export function writeInboxFocusTarget(target: InboxFocusTarget): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(INBOX_FOCUS_KEY, JSON.stringify(target));
  } catch {
    // Ignore storage errors in restricted contexts.
  }
}

export function consumeInboxFocusTarget(): InboxFocusTarget | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(INBOX_FOCUS_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(INBOX_FOCUS_KEY);
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as InboxFocusTarget) : null;
  } catch {
    return null;
  }
}

const FUTURE_CALENDAR_GRACE_MS = 5 * 60 * 1000;

/** Parses an ISO timestamp to UTC epoch ms, optionally ignoring future scheduled events. */
export function parseEffectiveTimestampMs(
  value: string | null | undefined,
  options?: { ignoreFuture?: boolean; nowMs?: number },
): number {
  if (!value || !value.trim()) return Number.NEGATIVE_INFINITY;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  if (options?.ignoreFuture && ms > (options.nowMs ?? Date.now()) + FUTURE_CALENDAR_GRACE_MS) {
    return Number.NEGATIVE_INFINITY;
  }
  return ms;
}

/** Extracts the effective last-updated epoch ms for any unified inbox stream item. */
export function getInboxItemUpdatedMs(item: InboxStreamItem, nowMs = Date.now()): number {
  switch (item.kind) {
    case 'decision':
      return Math.max(
        parseEffectiveTimestampMs(item.updatedAt),
        parseEffectiveTimestampMs(item.createdAt),
      );
    case 'update':
      return parseEffectiveTimestampMs(item.timestamp);
    case 'comm':
      return parseEffectiveTimestampMs(item.timestamp, {
        ignoreFuture: item.channel.toLowerCase() === 'calendar',
        nowMs,
      });
    case 'queue':
      return parseEffectiveTimestampMs(item.timestamp);
    case 'intake':
      return parseEffectiveTimestampMs(item.modifiedAt);
    case 'handoff':
      return parseEffectiveTimestampMs(item.timestamp);
    case 'notification':
      return parseEffectiveTimestampMs(item.timestamp);
    case 'channel':
      return parseEffectiveTimestampMs(item.lastSyncedAt);
    case 'contact':
      return Number.NEGATIVE_INFINITY;
  }
}

/** Sorts project entries by lastUpdatedMs descending, then count descending, then key ascending. */
export function compareProjectsByLastUpdatedDesc(
  a: { key: string; lastUpdatedMs: number; count: number },
  b: { key: string; lastUpdatedMs: number; count: number },
): number {
  const aHas = Number.isFinite(a.lastUpdatedMs);
  const bHas = Number.isFinite(b.lastUpdatedMs);
  if (aHas && bHas && b.lastUpdatedMs !== a.lastUpdatedMs) {
    return b.lastUpdatedMs - a.lastUpdatedMs;
  }
  if (aHas !== bHas) {
    return aHas ? -1 : 1;
  }
  return b.count - a.count || a.key.localeCompare(b.key);
}
