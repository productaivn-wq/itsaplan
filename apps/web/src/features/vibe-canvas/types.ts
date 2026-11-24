// UNIFIED_GLOBAL_CHAT_PANEL: SPEC-ITSAPLAN-CHAT-WEKNORA-CONSOLIDATION
export interface VibeZone {
  name: string;
  count: number;
  icon: string;
  path: string;
}

export interface VibeFile {
  name: string;
  relative_path: string;
  size: number;
  modified: string;
  type: 'doc' | 'code' | 'image' | 'archive' | 'data';
  openjev_score?: number;
}

export interface VibeDocProfiler {
  words: number;
  lines: number;
  headings: number;
  tables: number;
  figures: number;
  openjev_score: number;
  compute_ms: number;
}

export interface VibeDocContent {
  relative_path: string;
  absolute_path: string;
  size: number;
  line_count: number;
  is_binary: boolean;
  is_archive: boolean;
  mime_type: string;
  slice_content: string;
  total_lines: number;
  displayed_lines: number;
  profiler?: VibeDocProfiler;
}

export interface VibeAgent {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'BUSY' | 'RUNNING';
  archetype: string;
  capabilities: string[];
}

export interface VibeTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_HITL';
  priority: string;
  assigned_agent?: string;
  project?: string;
  created_at?: string;
}

export interface VibeCitation {
  raw?: string;
  document_name: string;
  file_path: string;
  start_line: number;
  end_line: number;
  confidence_score: number;
  snippet: string;
}

export interface VibeChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: VibeCitation[];
  grounded_status?: string;
  intent_kind?: 'action' | 'analytics' | 'knowledge';
  retrieval_latency_ms?: number;
  action_receipt?: Record<string, unknown>;
}

export interface VibeConversation {
  id: string;
  thread_id?: string;
  title: string;
  created_at: string;
  message_count: number;
  messages?: VibeChatMessage[];
}

export interface WeKnoraMemoryPayload {
  engine: string;
  cpu_latency_ms: number;
  openjev_ece: number;
  contradiction_reconciliation_rate: string;
  buckets: {
    profile: string[];
    preference: string[];
    fact: string[];
    task: string[];
    interest: string[];
  };
  wikigraph_links: Array<{
    slug: string;
    title: string;
    path: string;
  }>;
}

export interface ArchiveManifestNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  children?: ArchiveManifestNode[];
}

// OPEN OFFICE & CONTRACT GOVERNANCE (ACCORD v3.3.0 / UC-010..UC-018)
// ==================================================================

export interface OpenOfficeConcurrentSession {
  session_id: string;
  active_tool?: string | null;
  action_label?: string | null;
  focus_text?: string | null;
  prompt_snippet?: string | null;
  step_index?: number | null;
  age_sec?: number | null;
  project_key?: string | null;
  zone_id?: string | null;
  zone_name?: string | null;
}

export interface OpenOfficeLiveTelemetry {
  is_live_executing?: boolean;
  active_tool?: string | null;
  action_label?: string | null;
  focus_text?: string | null;
  prompt_snippet?: string | null;
  project_key?: string | null;
  session_id?: string | null;
  step_index?: number | null;
  age_sec?: number | null;
  live_sessions_count?: number;
  concurrent_count?: number;
  concurrent_sessions?: OpenOfficeConcurrentSession[];
}

export interface OpenOfficeLiveActivityItem {
  id: string;
  agent_id: string;
  agent_name: string;
  seat_id?: string;
  zone_id?: string;
  zone_name?: string;
  kind?: string;
  active_tool?: string | null;
  summary: string;
  step_index?: number | null;
  age_sec?: number | null;
  status?: string;
}

export interface OpenOfficeZoneGrid {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OpenOfficeZoneHexCell {
  cx: number;
  cy: number;
  radius: number;
  tier: 'queen' | 'specialist';
}

export interface OpenOfficeZone {
  id: string;
  name: string;
  subtitle?: string;
  en_name?: string;
  en_subtitle?: string;
  uc_id?: string;
  sop_id?: string;
  use_case_id?: string;
  grid: OpenOfficeZoneGrid;
  hex_cell?: OpenOfficeZoneHexCell;
  visual_slot?: string;
  is_spine?: boolean;
  order?: number;
  primary_skills?: string[];
  default_archetype?: string;
  default_model_tier?: string;
  requires_utop?: boolean;
  requires_worktree?: boolean;
  plugin_ids?: string[];
  preset_sha256?: string;
  accent?: string;
}

export type OpenOfficeSeatType = 'FIXED' | 'RESERVE';

export interface OpenOfficeStationCoords {
  x: number;
  y: number;
}

export interface OpenOfficeProjectOption {
  id: number;
  team_ref: string;
  key: string;
  name: string;
  open_issue_count: number;
  pending_run_count: number;
  active_schedule_count: number;
  active_agent_usernames: string[];
}

export interface OpenOfficeInitiativeSummary {
  id: number;
  project_key: string;
  title: string;
  status: string;
  priority?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  total_issues: number;
  completed_issues: number;
  in_progress_issues: number;
}

export interface OpenOfficeCycleSummary {
  id: number;
  project_key: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  completed_at?: string | null;
  is_active: boolean;
  total_issues: number;
  completed_issues: number;
  in_progress_issues: number;
}

export interface OpenOfficeWorkItemLink {
  issue_id?: number | null;
  sequence_number?: number | null;
  identifier: string;
  project_key: string;
  team_ref: string;
  title: string;
  status: string;
  priority?: string;
  contract_id?: string | null;
  run_id?: number | string | null;
  initiative_id?: number | null;
  initiative_title?: string | null;
  cycle_id?: number | null;
  cycle_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  updated_at?: string;
}

export interface OpenOfficeScheduleItem {
  schedule_id: number;
  name: string;
  cron: string;
  project_key: string;
  team_ref: string;
  next_run_at: string;
}

export interface OpenOfficeLessonItem {
  lesson_id: string;
  contract_id: string;
  run_number: number;
  agent_id: string;
  project_key: string;
  room_id: string;
  feedback_reason: string;
  crystallized_rule: string;
  created_at: string;
}

export interface OpenOfficeModulePortal {
  id: string;
  label: string;
  badge?: string | number;
  href: string;
  action_kind?: 'route' | 'open-issue' | 'chat-agent' | 'weknora-memory';
  issue_id?: number | null;
  itsaplan_agent_id?: number | null;
}

export interface OpenOfficeDoingNow {
  summary: string;
  current_step?: string;
  step_index?: number;
  total_steps?: number;
  elapsed_label?: string;
  active_item?: OpenOfficeWorkItemLink | null;
  recent_activities?: string[];
}

export interface OpenOfficeGoingToDoNext {
  next_steps: string[];
  queued_items: OpenOfficeWorkItemLink[];
  upcoming_schedules: OpenOfficeScheduleItem[];
}

export interface OpenOfficeMemoryDigest {
  completed_runs_total: number;
  rework_count: number;
  first_pass_pct: number;
  lessons: OpenOfficeLessonItem[];
}

export interface OpenOfficeDepartmentDossier {
  zone_id: string;
  id?: string;
  sop_id?: string;
  uc_id: string;
  use_case_id?: string;
  name: string;
  en_name?: string;
  mission: string;
  subtitle?: string;
  en_subtitle?: string;
  primary_skills?: string[];
  default_archetype?: string;
  default_model_tier?: string;
  requires_utop?: boolean;
  requires_worktree?: boolean;
  plugin_ids?: string[];
  preset_sha256?: string;
  is_spine?: boolean;
  order?: number;
  visual_slot?: string;
  primary_cta_label: string;
  default_template_id: string;
  recommended_agent_ids: string[];
  active_agent_names: string[];
  active_project_keys: string[];
  kpis: Array<{ label: string; value: string | number }>;
  featured_items: OpenOfficeWorkItemLink[];
  module_portals: OpenOfficeModulePortal[];
}

export type OpenOfficeSopCatalogItem = OpenOfficeDepartmentDossier;

export interface OpenOfficeStation {
  seat_id: string;
  seat_type: OpenOfficeSeatType;
  zone_id: string;
  zone_name: string;
  coords: OpenOfficeStationCoords;
  agent_id: string | null;
  itsaplan_agent_id?: number | null;
  user_id?: string | null;
  username?: string | null;
  agent_name: string;
  role: string;
  account_label: string;
  status: string;
  activity_bubble: string;
  active_contract_ids: string[];
  pending_run_count?: number;
  capabilities: string[];
  tool_badge?: 'code' | 'search' | 'doc' | 'review' | 'idle' | string;
  room_reason?: string;
  active_project_keys?: string[];
  queued_project_keys?: string[];
  doing_now?: OpenOfficeDoingNow | null;
  going_to_do_next?: OpenOfficeGoingToDoNext;
  memory_digest?: OpenOfficeMemoryDigest;
  module_portals?: OpenOfficeModulePortal[];
  live_telemetry?: OpenOfficeLiveTelemetry;
  assigned_dept_key?: string;
  assigned_position_id?: string;
  assigned_position_title?: string;
  bot_label?: string;
  subagents?: OpenOfficeColonyBee[];
}

export interface OpenOfficeColonyBee {
  bee_id: string;
  seat_id?: string | null;
  conversation_id?: string | null;
  parent_bee_id?: string | null;
  parent_conv_id?: string | null;
  tier: 'queen' | 'agent' | 'subagent';
  agent_id: string;
  username: string;
  display_name: string;
  role: string;
  zone_id: string;
  status: string;
  active_tool?: string | null;
  action_label?: string | null;
  step_index?: number | null;
  elapsed_sec?: number | null;
  project_key?: string | null;
}

export interface OpenOfficeMascot {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  zone_id: string;
  coords: OpenOfficeStationCoords;
  bubble: string;
}

export interface OpenOfficeTemplate {
  id: string;
  name: string;
  domain: string;
  default_input_scope: string;
  default_output_format: string;
  default_acceptance_criteria: string[];
  default_forbidden_actions: string[];
  default_estimated_minutes: number;
  default_estimated_tokens: number;
}

export interface OpenOfficeContract {
  id: string;
  project_key?: string;
  team_ref?: string;
  issue_id?: number | null;
  issue_identifier?: string | null;
  initiative_id?: number | null;
  initiative_title?: string | null;
  cycle_id?: number | null;
  cycle_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  title: string;
  summary?: string;
  template_id?: string;
  domain: string;
  lead_agent_id: string;
  lead_agent_name?: string;
  support_agent_ids?: string[];
  input_scope?: string;
  output_format?: string;
  acceptance_criteria?: string[];
  forbidden_actions?: string[];
  confidence_pct?: number;
  estimated_minutes?: number;
  estimated_tokens?: number;
  actual_minutes?: number;
  actual_tokens?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  status: 'TODO' | 'IN_PROGRESS' | 'AWAITING_HITL' | 'DONE' | 'RETURNED_FOR_REWORK' | string;
  current_run_number?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OpenOfficeTaskRun {
  run_id?: string;
  id?: string;
  contract_id: string;
  run_number: number;
  status: 'SUCCESS' | 'APPROVED' | 'FAILED' | 'RETURNED_FOR_REWORK' | 'IN_PROGRESS' | 'AWAITING_HITL' | string;
  actor_id?: string;
  actor_name?: string;
  evidence_summary?: string;
  evidence_links?: string[];
  return_reason?: string;
  created_at?: string;
  completed_at?: string;
}

export interface OpenOfficeEvent {
  event_id: string;
  contract_id?: string;
  run_number?: number;
  event_type: string;
  actor_id: string;
  summary?: string;
  payload?: Record<string, unknown>;
  sha256_hash?: string;
  event_hash?: string;
  prev_hash?: string;
  timestamp?: string;
  created_at?: string;
}

export interface OpenOfficeCommittedVsActual {
  estimated_minutes: number;
  actual_minutes: number;
  delta_minutes: number;
  estimated_tokens: number;
  actual_tokens: number;
  delta_tokens: number;
  confidence_pct: number;
}

export interface OpenOfficeContractDetail {
  contract: OpenOfficeContract;
  runs: OpenOfficeTaskRun[];
  events: OpenOfficeEvent[];
  lessons?: OpenOfficeLessonItem[];
  is_chain_valid: boolean;
  committed_vs_actual: OpenOfficeCommittedVsActual;
}

export interface OpenOfficeAnalytics {
  total_contracts: number;
  status_counts: {
    IN_PROGRESS?: number;
    AWAITING_HITL?: number;
    DONE?: number;
    [key: string]: number | undefined;
  };
  priority_counts?: Record<string, number>;
  needs_my_action_count?: number;
  total_runs?: number;
  rework_run_count?: number;
  lessons_count?: number;
  total_events: number;
  event_type_counts?: Record<string, number>;
  agent_workload?: Record<string, unknown>;
  domain_progress?: Record<string, unknown>;
  recent_events?: OpenOfficeEvent[];
  event_log_reconciled: boolean;
}

export interface OpenOfficeStateSnapshot {
  office_title: string;
  selected_project_key?: string;
  selected_cycle_id?: number | null;
  selected_initiative_id?: number | null;
  team_ref?: string;
  active_agent_count: number;
  reserve_seat_count: number;
  pending_run_count?: number;
  projects?: OpenOfficeProjectOption[];
  initiatives?: OpenOfficeInitiativeSummary[];
  cycles?: OpenOfficeCycleSummary[];
  active_cycle?: OpenOfficeCycleSummary | null;
  departments?: OpenOfficeDepartmentDossier[];
  sop_catalog?: OpenOfficeDepartmentDossier[];
  lessons?: OpenOfficeLessonItem[];
  zones: OpenOfficeZone[];
  stations: OpenOfficeStation[];
  mascots: OpenOfficeMascot[];
  contracts: OpenOfficeContract[];
  needs_my_action: OpenOfficeContract[];
  templates: OpenOfficeTemplate[];
  analytics: OpenOfficeAnalytics;
  live_sessions_count?: number;
  live_activity_feed?: OpenOfficeLiveActivityItem[];
  colony_bees?: OpenOfficeColonyBee[];
}

export interface OpenOfficeCompanyPolicy {
  company_name: string;
  legal_name: string;
  slug: string;
  domain: string;
  industry: string;
  timezone: string;
  default_locale: string;
  default_autonomy_tier: 'TIER_0' | 'TIER_1' | 'TIER_2';
  require_sod_approval: boolean;
  allow_agent_team_bootstrap: boolean;
  updated_at?: string;
}

export interface OpenOfficeDepartmentPatch {
  zone_id: string;
  name: string;
  subtitle: string;
  primary_cta_label: string;
  default_template_id: string;
  recommended_agent_ids: string[];
}

export interface OpenOfficeGovernanceSnapshot {
  company_policy: OpenOfficeCompanyPolicy;
  departments: Array<{
    id: string;
    frontend_zone_id?: string;
    sop_id?: string;
    use_case_id: string;
    name: string;
    en_name?: string;
    subtitle: string;
    en_subtitle?: string;
    primary_skills?: string[];
    default_archetype?: string;
    default_model_tier?: string;
    requires_utop?: boolean;
    requires_worktree?: boolean;
    is_spine?: boolean;
    order?: number;
    visual_slot?: string;
    primary_cta_label: string;
    default_template_id: string;
    recommended_agent_ids: string[];
    updated_at?: string;
  }>;
  sop_catalog?: OpenOfficeDepartmentDossier[];
  roles_roster: {
    human_ranks: Array<{
      rank: string;
      actor_class: string;
      title: string;
      home_zone: string;
      summary: string;
    }>;
    deterministic_gates: Array<{
      gate_id: string;
      actor_class: string;
      title: string;
      home_zone: string;
      summary: string;
    }>;
    ai_agents: Array<{
      agent_id: string;
      username: string;
      actor_class: string;
      role: string;
      home_zone: string;
      capabilities: string[];
    }>;
  };
  permission_matrix: {
    actions: Array<'create' | 'edit' | 'read' | 'delete'>;
    resources: Array<{ key: string; label: string; domain: string }>;
    role_presets: Record<string, Record<string, string[]>>;
    autonomy_tiers: Array<{
      tier: string;
      label: string;
      allowed: string;
      requires_hum: string;
    }>;
    constitutional_gates: string[];
  };
}

