import type {
  ChatEffortLevel,
  ChatExecutionMode,
  ChatPermissionMode,
  ChatRunOptions,
} from '@/lib/api/endpoints/agentChat';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { ChatMessage, ChatStatus } from '@/hooks/useAgentChat';

export const DEFAULT_CHAT_RUN_OPTIONS: ChatRunOptions = {
  model: null,
  modelCredentialId: null,
  mode: 'build',
  effort: 'high',
  thinking: true,
  permissionMode: 'ask',
  temperature: null,
  maxSteps: null,
};

export type WorkspaceLayoutView = 'chat' | 'split' | 'focus';
export type RightPaneTab = 'artifacts' | 'approvals' | 'activity' | 'inspector';
export type TranscriptDensity = 'comfortable' | 'compact';
export type TranscriptWidth = 'narrow' | 'standard' | 'wide';
export type TraceVisibility = 'collapsed' | 'expanded' | 'hidden';

export interface ChatViewPreferences {
  layout: WorkspaceLayoutView;
  showSessionsRail: boolean;
  rightPaneOpen: boolean;
  rightPaneTab: RightPaneTab;
  density: TranscriptDensity;
  width: TranscriptWidth;
  thinkingVisibility: TraceVisibility;
  toolsVisibility: TraceVisibility;
  showTimestamps: boolean;
  showTokenMeter: boolean;
}

export const DEFAULT_CHAT_VIEW_PREFERENCES: ChatViewPreferences = {
  layout: 'split',
  showSessionsRail: false,
  rightPaneOpen: true,
  rightPaneTab: 'approvals',
  density: 'comfortable',
  width: 'standard',
  thinkingVisibility: 'collapsed',
  toolsVisibility: 'collapsed',
  showTimestamps: true,
  showTokenMeter: true,
};

export interface ExternalModelPreset {
  id: string;
  label: string;
  family: 'Antigravity / Gemini' | 'Claude' | 'OpenAI / Codex';
  tier?: string;
}

export const EXTERNAL_MODEL_PRESETS: ExternalModelPreset[] = [
  // Antigravity / Gemini
  { id: 'gemini-4-neon-xhigh', label: 'Gemini 4 Neon (XHigh)', family: 'Antigravity / Gemini', tier: 'XHigh' },
  { id: 'gemini-4-carbon-high', label: 'Gemini 4 Carbon (High)', family: 'Antigravity / Gemini', tier: 'Pro' },
  { id: 'gemini-4-hydrogen-high', label: 'Gemini 4 Hydrogen (High)', family: 'Antigravity / Gemini', tier: 'Pro' },
  { id: 'gemini-4-argon-high', label: 'Gemini 4 Argon (High)', family: 'Antigravity / Gemini', tier: 'Pro' },
  { id: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash', family: 'Antigravity / Gemini', tier: 'Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', family: 'Antigravity / Gemini', tier: 'Pro' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', family: 'Antigravity / Gemini', tier: 'Flash' },
  // Claude
  { id: 'claude-opus-5-5-high', label: 'Claude Opus 5.5', family: 'Claude', tier: 'Opus' },
  { id: 'claude-sonnet-5-5-high', label: 'Claude Sonnet 5.5', family: 'Claude', tier: 'Sonnet' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', family: 'Claude', tier: 'Opus' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', family: 'Claude', tier: 'Sonnet' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', family: 'Claude', tier: 'Haiku' },
  // OpenAI / Codex
  { id: 'gpt-5.4', label: 'GPT-5.4', family: 'OpenAI / Codex', tier: 'Frontier' },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', family: 'OpenAI / Codex', tier: 'Mini' },
  { id: 'o4-mini', label: 'o4-mini', family: 'OpenAI / Codex', tier: 'Reason' },
  { id: 'codex-mini-latest', label: 'Codex Mini', family: 'OpenAI / Codex', tier: 'Codex' },
];

export interface ExtractedArtifact {
  id: string;
  kind: 'diff' | 'code' | 'mermaid' | 'markdown';
  title: string;
  content: string;
  language?: string;
  source: 'emitted' | 'fenced';
  messageId: string;
  createdAt: string;
}

export interface ActiveChatSnapshot {
  sessionId: string;
  agent: AiAgent;
  threadId: string | null;
  cliSessionId: string | null;
  contextTokens: number | null | undefined;
  runOptions: ChatRunOptions;
  messages: ChatMessage[];
  status: ChatStatus;
  activeTool: string | null;
  artifacts: ExtractedArtifact[];
  thinkingCount: number;
  toolCallCount: number;
  subagentCount: number;
}

const FENCE_RE = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

function formatLanguageTitle(lang: string, index: number): string {
  const lower = lang.toLowerCase();
  if (lower === 'diff') return `Diff Patch · #${index}`;
  if (lower === 'mermaid') return `Mermaid Diagram · #${index}`;
  if (lower === 'sql') return `SQL Query · #${index}`;
  if (lower === 'ts' || lower === 'typescript' || lower === 'tsx') {
    return `TypeScript Snippet · #${index}`;
  }
  if (lower === 'js' || lower === 'javascript' || lower === 'jsx') {
    return `JavaScript Snippet · #${index}`;
  }
  if (lower === 'py' || lower === 'python') return `Python Snippet · #${index}`;
  if (lower === 'json') return `JSON Payload · #${index}`;
  if (lower === 'md' || lower === 'markdown') return `Markdown Note · #${index}`;
  if (lower) return `${lower.toUpperCase()} Snippet · #${index}`;
  return `Code Snippet · #${index}`;
}

/**
 * Extracts explicit AG-UI emitted artifacts plus substantial fenced code/diff/mermaid
 * deliverables from assistant transcript messages, deduplicating identical content.
 */
export function extractArtifactsFromMessages(messages: ChatMessage[]): ExtractedArtifact[] {
  const items: ExtractedArtifact[] = [];
  const seen = new Set<string>();
  let fenceIndex = 0;

  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const part of msg.parts) {
      if (part.type === 'artifact') {
        const key = `${part.kind}:${part.content.trim()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          id: part.artifactId || `${msg.id}:artifact:${items.length + 1}`,
          kind: part.kind,
          title: part.title || 'Artifact',
          content: part.content,
          language: part.language,
          source: 'emitted',
          messageId: msg.id,
          createdAt: msg.createdAt,
        });
        continue;
      }

      if (part.type !== 'text' || !part.text.includes('```')) continue;
      FENCE_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = FENCE_RE.exec(part.text)) !== null) {
        const lang = (match[1] ?? '').trim();
        const body = (match[2] ?? '').replace(/\n+$/, '');
        if (!body.trim()) continue;
        const lower = lang.toLowerCase();
        if (lower === 'chart' || lower === 'issue-import') continue;
        const lineCount = body.split('\n').length;
        const isSpecial = lower === 'diff' || lower === 'mermaid';
        if (!isSpecial && !lang && lineCount < 5) continue;

        const kind: ExtractedArtifact['kind'] =
          lower === 'diff'
            ? 'diff'
            : lower === 'mermaid'
              ? 'mermaid'
              : lower === 'md' || lower === 'markdown'
                ? 'markdown'
                : 'code';
        const key = `${kind}:${body.trim()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        fenceIndex += 1;
        items.push({
          id: `${msg.id}:fence:${fenceIndex}`,
          kind,
          title: formatLanguageTitle(lang, fenceIndex),
          content: body,
          language: lang || undefined,
          source: 'fenced',
          messageId: msg.id,
          createdAt: msg.createdAt,
        });
      }
    }
  }

  return items;
}

export type CuratedModelPreset = ExternalModelPreset;
export const CURATED_MODEL_PRESETS = EXTERNAL_MODEL_PRESETS;

const ROUTER_LABEL_MAP = new Map<string, string>([
  ['agentic-os/antigravity', 'Antigravity Router'],
  ['agentic-os/claude', 'Claude Router'],
  ['agentic-os/codex', 'Codex Router'],
  ['agentic-os/research', 'Research Router'],
  ['agentic-os/orchestrator', 'Orchestrator Router'],
  ['agentic-os/qualitygate', 'QualityGate Router'],
]);

const PRESET_LABEL_MAP = new Map(EXTERNAL_MODEL_PRESETS.map((p) => [p.id, p.label]));

/**
 * Formats an active model id or agent default into a crisp human-friendly display label.
 */
export function formatModelDisplayLabel(
  modelId: string | null | undefined,
  agent: Pick<AiAgent, 'kind' | 'model' | 'modelProvider'>,
  defaultLabel: string,
): string {
  const effective = modelId?.trim() || agent.model?.trim() || '';
  if (!effective) return defaultLabel;
  return PRESET_LABEL_MAP.get(effective) ?? ROUTER_LABEL_MAP.get(effective) ?? effective;
}

const VALID_LAYOUTS = new Set<WorkspaceLayoutView>(['chat', 'split', 'focus']);
const VALID_RIGHT_TABS = new Set<RightPaneTab>(['artifacts', 'approvals', 'activity', 'inspector']);
const VALID_DENSITIES = new Set<TranscriptDensity>(['comfortable', 'compact']);
const VALID_WIDTHS = new Set<TranscriptWidth>(['narrow', 'standard', 'wide']);
const VALID_TRACES = new Set<TraceVisibility>(['collapsed', 'expanded', 'hidden']);

export function sanitizeViewPreferences(raw: unknown): ChatViewPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CHAT_VIEW_PREFERENCES };
  const rec = raw as Record<string, unknown>;
  return {
    layout: VALID_LAYOUTS.has(rec.layout as WorkspaceLayoutView)
      ? (rec.layout as WorkspaceLayoutView)
      : DEFAULT_CHAT_VIEW_PREFERENCES.layout,
    showSessionsRail:
      typeof rec.showSessionsRail === 'boolean'
        ? rec.showSessionsRail
        : DEFAULT_CHAT_VIEW_PREFERENCES.showSessionsRail,
    rightPaneOpen:
      typeof rec.rightPaneOpen === 'boolean'
        ? rec.rightPaneOpen
        : DEFAULT_CHAT_VIEW_PREFERENCES.rightPaneOpen,
    rightPaneTab: VALID_RIGHT_TABS.has(rec.rightPaneTab as RightPaneTab)
      ? (rec.rightPaneTab as RightPaneTab)
      : DEFAULT_CHAT_VIEW_PREFERENCES.rightPaneTab,
    density: VALID_DENSITIES.has(rec.density as TranscriptDensity)
      ? (rec.density as TranscriptDensity)
      : DEFAULT_CHAT_VIEW_PREFERENCES.density,
    width: VALID_WIDTHS.has(rec.width as TranscriptWidth)
      ? (rec.width as TranscriptWidth)
      : DEFAULT_CHAT_VIEW_PREFERENCES.width,
    thinkingVisibility: VALID_TRACES.has(rec.thinkingVisibility as TraceVisibility)
      ? (rec.thinkingVisibility as TraceVisibility)
      : DEFAULT_CHAT_VIEW_PREFERENCES.thinkingVisibility,
    toolsVisibility: VALID_TRACES.has(rec.toolsVisibility as TraceVisibility)
      ? (rec.toolsVisibility as TraceVisibility)
      : DEFAULT_CHAT_VIEW_PREFERENCES.toolsVisibility,
    showTimestamps:
      typeof rec.showTimestamps === 'boolean'
        ? rec.showTimestamps
        : DEFAULT_CHAT_VIEW_PREFERENCES.showTimestamps,
    showTokenMeter:
      typeof rec.showTokenMeter === 'boolean'
        ? rec.showTokenMeter
        : DEFAULT_CHAT_VIEW_PREFERENCES.showTokenMeter,
  };
}

const VALID_MODES = new Set<ChatExecutionMode>(['ask', 'plan', 'build', 'auto']);
const VALID_EFFORTS = new Set<ChatEffortLevel>(['low', 'medium', 'high', 'xhigh']);
const VALID_PERMS = new Set<ChatPermissionMode>(['ask', 'plan', 'auto']);

export function sanitizeRunOptions(raw: unknown): ChatRunOptions {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CHAT_RUN_OPTIONS };
  const rec = raw as Record<string, unknown>;
  return {
    model: typeof rec.model === 'string' && rec.model.trim() ? rec.model.trim() : null,
    modelCredentialId:
      typeof rec.modelCredentialId === 'number' && Number.isInteger(rec.modelCredentialId) && rec.modelCredentialId > 0
        ? rec.modelCredentialId
        : null,
    mode: VALID_MODES.has(rec.mode as ChatExecutionMode)
      ? (rec.mode as ChatExecutionMode)
      : DEFAULT_CHAT_RUN_OPTIONS.mode,
    effort: VALID_EFFORTS.has(rec.effort as ChatEffortLevel)
      ? (rec.effort as ChatEffortLevel)
      : DEFAULT_CHAT_RUN_OPTIONS.effort,
    thinking:
      typeof rec.thinking === 'boolean' ? rec.thinking : DEFAULT_CHAT_RUN_OPTIONS.thinking,
    permissionMode: VALID_PERMS.has(rec.permissionMode as ChatPermissionMode)
      ? (rec.permissionMode as ChatPermissionMode)
      : DEFAULT_CHAT_RUN_OPTIONS.permissionMode,
    temperature:
      typeof rec.temperature === 'number' && Number.isFinite(rec.temperature)
        ? Math.min(2, Math.max(0, Number(rec.temperature)))
        : null,
    maxSteps:
      typeof rec.maxSteps === 'number' && Number.isFinite(rec.maxSteps)
        ? Math.min(64, Math.max(1, Math.round(rec.maxSteps)))
        : null,
  };
}
