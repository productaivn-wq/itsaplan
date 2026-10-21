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
}

export interface VibeConversation {
  id: string;
  thread_id?: string;
  title: string;
  created_at: string;
  message_count: number;
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
