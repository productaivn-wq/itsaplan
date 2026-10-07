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
  raw: string;
  file_path: string;
  start_line: number;
  end_line: number;
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
  title: string;
  created_at: string;
  message_count: number;
}

export interface ArchiveManifestNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  children?: ArchiveManifestNode[];
}
