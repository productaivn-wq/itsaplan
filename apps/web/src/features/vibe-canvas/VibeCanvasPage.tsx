'use client';

// UNIFIED_GLOBAL_CHAT_PANEL: SPEC-ITSAPLAN-CHAT-WEKNORA-CONSOLIDATION
// UNIFIED_WORK_ITEMS_SWARM_DEDUP_362: WeKnora Swarm tab removed from Tài liệu; tasks routed to Hạng mục công việc (WorkItemsPage) and Agent Fleet kept in AI Team -> AI Agents (ProjectAiAgentsSection).
import * as React from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { PaneActiveProvider, useIsPaneActive } from '@/context/paneActiveContext';
import { INSTANT_NAV_EVENT, useInstantPathname } from '@/hooks/useInstantPathname';
import {
  BookOpen,
  BookOpenText,
  Folder,
  Globe2,
  RefreshCw,
  StickyNote,
} from 'lucide-react';
import { useShellRoute } from '@/hooks/useShellRoute';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import DocumentsPage from '@/features/documents/DocumentsPage';

import type {
  VibeZone,
  VibeFile,
  VibeDocContent,
  VibeAgent,
  VibeTask,
  VibeConversation,
  WeKnoraMemoryPayload,
} from './types';

const NotesPage = dynamic(() => import('@/features/notes/NotesPage'), { ssr: false });
const SpatialFinderView = dynamic(() => import('./components/SpatialFinderView'), { ssr: false });
const GalaxyCanvasView = dynamic(() => import('./components/GalaxyCanvasView'), { ssr: false });
const GroundedReaderView = dynamic(() => import('./components/GroundedReaderView'), { ssr: false });
const ArchiveManifestModal = dynamic(() => import('./components/ArchiveManifestModal'), { ssr: false });
const WeKnoraCopilotDock = dynamic(() => import('./components/WeKnoraCopilotDock'), { ssr: false });
const KaraMeetingWorkspaceView = dynamic(() => import('./components/KaraMeetingWorkspaceView'), { ssr: false });

const API_BASE_URL = '';

export type ConsolidatedWorkspaceMode =
  | 'docs'
  | 'notes'
  | 'kara'
  | 'finder'
  | 'reader'
  | 'galaxy';

export interface VibeCanvasPageProps {
  initialMode?: ConsolidatedWorkspaceMode;
}

const VALID_MODES: ConsolidatedWorkspaceMode[] = ['docs', 'notes', 'finder', 'reader', 'galaxy', 'kara'];

const KNOWLEDGE_TAB_HINTS: Record<ConsolidatedWorkspaceMode, { vi: string; en: string }> = {
  docs: {
    vi: 'Soạn thảo tài liệu, kế hoạch và tri thức chung của nhóm',
    en: 'Write documents, specs, and shared team knowledge',
  },
  notes: {
    vi: 'Ghi chú dán nhanh và biên bản cuộc họp từ AI',
    en: 'Capture quick sticky notes and AI meeting summaries',
  },
  kara: {
    vi: 'Ghi chép cuộc họp bằng AI và tự động trích xuất việc cần làm',
    en: 'AI meeting transcription and automatic action-item extraction',
  },
  finder: {
    vi: 'Duyệt thư mục dự án (Hộp thư đến, Đang làm, Tham chiếu, Lưu trữ)',
    en: 'Browse project folders (Inbox, Active, Reference, Archive)',
  },
  reader: {
    vi: 'Đọc sâu tài liệu kèm trích dẫn dòng & hỏi đáp AI',
    en: 'Deep document reader with line citations & AI Q&A',
  },
  galaxy: {
    vi: 'Khám phá bản đồ liên kết tài liệu & tri thức trực quan 3D',
    en: 'Explore 3D visual map of connected documents & ideas',
  },
};

function resolveDefaultMode(
  pathname: string,
  initialMode?: ConsolidatedWorkspaceMode,
  tabParam?: string | null
): ConsolidatedWorkspaceMode {
  const normalized = tabParam?.toLowerCase();
  if (normalized && VALID_MODES.includes(normalized as ConsolidatedWorkspaceMode)) {
    return normalized as ConsolidatedWorkspaceMode;
  }
  if (initialMode && VALID_MODES.includes(initialMode)) return initialMode;
  if (pathname.includes('/notes')) return 'notes';
  if (pathname.includes('/docs')) return 'docs';
  return 'docs';
}

export default function VibeCanvasPage({ initialMode }: VibeCanvasPageProps = {}) {
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  const { projectKey } = useShellRoute();
  const pathname = useInstantPathname();

  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');

  const [activeTab, setActiveTab] = React.useState<string>(() =>
    resolveDefaultMode(pathname, initialMode, tabParam)
  );
  const parentActive = useIsPaneActive();
  const [visitedTabs, setVisitedTabs] = React.useState<Set<string>>(
    () => new Set([resolveDefaultMode(pathname, initialMode, tabParam)]),
  );

  React.useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const handleTabChange = React.useCallback((nextTab: string) => {
    const normalized = nextTab.toLowerCase();
    if (!VALID_MODES.includes(normalized as ConsolidatedWorkspaceMode)) return;
    setActiveTab(normalized);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', normalized);
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, []);

  // SPEC-ITSAPLAN-CHAT-WEKNORA-CONSOLIDATION: Default showWeKnoraDock to false because
  // WeKnora Copilot is consolidated into the unified global AI Chat panel (ChatPanel.tsx),
  // preventing two right-hand chat sidebars from stacking.
  const [showWeKnoraDock] = React.useState<boolean>(false);
  const [notesSubView, setNotesSubView] = React.useState<'kara' | 'sticky'>('kara');

  React.useEffect(() => {
    const windowTab =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null;
    const effectiveTab = windowTab ?? tabParam;
    if (
      effectiveTab &&
      VALID_MODES.includes(effectiveTab.toLowerCase() as ConsolidatedWorkspaceMode)
    ) {
      setActiveTab(effectiveTab.toLowerCase());
    } else if (pathname.includes('/notes')) {
      setActiveTab('notes');
    } else if (pathname.includes('/docs')) {
      setActiveTab('docs');
    } else if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [pathname, initialMode, tabParam]);

  React.useEffect(() => {
    const syncFromLocation = () => {
      const locTab = new URLSearchParams(window.location.search).get('tab');
      setActiveTab(resolveDefaultMode(window.location.pathname, initialMode, locTab));
    };
    window.addEventListener(INSTANT_NAV_EVENT, syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener(INSTANT_NAV_EVENT, syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [initialMode]);

  const [, setBridgeConnected] = React.useState<boolean>(true);

  const [zones, setZones] = React.useState<VibeZone[]>([
    { name: '00_INBOX', count: 0, icon: 'inbox', path: '00_INBOX' },
    { name: '10_ACTIVE_TIMEBOUND', count: 0, icon: 'clock', path: '10_ACTIVE_TIMEBOUND' },
    { name: '20_ACTIVE_CONTINUOUS', count: 0, icon: 'layers', path: '20_ACTIVE_CONTINUOUS' },
    { name: '30_REFERENCE', count: 0, icon: 'book', path: '30_REFERENCE' },
    { name: '40_ARCHIVE', count: 0, icon: 'archive', path: '40_ARCHIVE' },
  ]);
  const [activeZone, setActiveZone] = React.useState<string>('10_ACTIVE_TIMEBOUND');
  const [files, setFiles] = React.useState<VibeFile[]>([]);
  const [activeFile, setActiveFile] = React.useState<VibeFile | null>(null);
  const [docContent, setDocContent] = React.useState<VibeDocContent | null>(null);
  const [loadingContent, setLoadingContent] = React.useState<boolean>(false);

  // WeKnora Multi-Threaded Conversations, 5-Bucket Memory, Agents & Tasks
  const [conversations, setConversations] = React.useState<VibeConversation[]>([
    { id: 'thread-default', thread_id: 'thread-default', title: 'General Assistant', created_at: '', message_count: 0 },
  ]);
  const [activeThreadId, setActiveThreadId] = React.useState<string>('thread-default');
  const [weknoraMemory, setWeknoraMemory] = React.useState<WeKnoraMemoryPayload | null>(null);
  const [, setAgents] = React.useState<VibeAgent[]>([]);
  const [, setTasks] = React.useState<VibeTask[]>([]);
  const [triageLoading, setTriageLoading] = React.useState<boolean>(false);
  const [triageResults, setTriageResults] = React.useState<{
    pending_count?: number;
    [key: string]: unknown;
  } | null>(null);

  const [highlightRange, setHighlightRange] = React.useState<{ start: number; end: number } | null>(
    null
  );

  const [archiveModal, setArchiveModal] = React.useState<{
    isOpen: boolean;
    filePath: string;
    content: string;
  }>({
    isOpen: false,
    filePath: '',
    content: '',
  });

  const fetchZones = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/zones`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setZones(data);
        } else if (typeof data === 'object' && data !== null) {
          const mapped: VibeZone[] = Object.keys(data).map((k) => ({
            name: k,
            count: Array.isArray(data[k]) ? data[k].length : 0,
            icon: k.includes('INBOX')
              ? 'inbox'
              : k.includes('TIMEBOUND')
              ? 'clock'
              : k.includes('CONTINUOUS')
              ? 'layers'
              : k.includes('REF')
              ? 'book'
              : 'archive',
            path: k,
          }));
          setZones(mapped);
        }
        setBridgeConnected(true);
      }
    } catch {
      setBridgeConnected(false);
    }
  }, []);

  const fetchFiles = React.useCallback(async (zone: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/zone?zone=${encodeURIComponent(zone)}`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        const mappedFiles: VibeFile[] = (Array.isArray(data) ? data : []).map((raw) => {
          const f = raw as Record<string, unknown>;
          return {
            name: String(f.name || ''),
            relative_path: String(f.relative_path || ''),
            size: Number(f.size_bytes || 0),
            modified: String(f.modified_at || ''),
            type: ((f.icon === 'pdf' ? 'doc' : f.icon) || 'doc') as VibeFile['type'],
            openjev_score: typeof f.openjev_score === 'number' ? f.openjev_score : undefined,
          };
        });
        setFiles(mappedFiles);
        if (mappedFiles.length > 0) {
          setActiveFile((curr) => {
            if (!curr || !mappedFiles.some((item) => item.relative_path === curr.relative_path)) {
              return mappedFiles[0];
            }
            return curr;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch zone files:', err);
    }
  }, []);

  const fetchDocContent = React.useCallback(async (file: VibeFile) => {
    setLoadingContent(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(file.relative_path)}&start_line=1&end_line=200`
      );
      if (res.ok) {
        const data = await res.json();
        setDocContent({
          relative_path: data.relative_path,
          absolute_path: data.relative_path,
          size: data.size_bytes,
          line_count: data.total_lines,
          is_binary: data.is_binary || false,
          is_archive: data.has_archive_manifest || false,
          mime_type: data.mime_type,
          slice_content: data.content || (data.lines ? data.lines.join('\n') : ''),
          total_lines: data.total_lines,
          displayed_lines: data.end_line - data.start_line + 1,
          profiler: data.profiler,
        });
      }
    } catch (err) {
      console.error('Failed to slice document:', err);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/conversations`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        if (Array.isArray(data) && data.length > 0) {
          setConversations(
            data.map((raw) => {
              const c = raw as Record<string, unknown>;
              const tid = String(c.thread_id || c.id || '');
              return {
                id: tid,
                thread_id: tid,
                title: String(c.title || ''),
                created_at: String(c.created_at || ''),
                message_count: Number(c.message_count || 0),
              };
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch WeKnora conversations:', err);
    }
  }, []);

  const fetchWeKnoraMemory = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/memory`);
      if (res.ok) {
        const data = await res.json();
        setWeknoraMemory(data);
      }
    } catch (err) {
      console.error('Failed to fetch WeKnora 5-bucket memory:', err);
    }
  }, []);

  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/tasks`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        const mapped: VibeTask[] = (Array.isArray(data) ? data : []).map((raw) => {
          const t = raw as Record<string, unknown>;
          return {
            id: String(t.task_id || ''),
            title: String(t.title || ''),
            status: (t.status || 'TODO') as VibeTask['status'],
            priority: String(t.priority || 'MEDIUM'),
            assigned_agent: t.assigned_actor ? String(t.assigned_actor) : undefined,
            project: projectKey || undefined,
          };
        });
        setTasks(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [projectKey]);

  const fetchAgents = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/agents`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        const mapped: VibeAgent[] = (Array.isArray(data) ? data : []).map((raw) => {
          const a = raw as Record<string, unknown>;
          return {
            id: String(a.agent_id || a.id || ''),
            name: String(a.name || ''),
            role: String(a.role || a.archetype || 'agent'),
            status: (a.status || 'IDLE') as VibeAgent['status'],
            archetype: String(a.archetype || 'agent'),
            capabilities: Array.isArray(a.capabilities) ? (a.capabilities as string[]) : [],
          };
        });
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'finder' || activeTab === 'galaxy' || activeTab === 'reader') {
      fetchZones();
      fetchFiles(activeZone);
    } else if (activeTab === 'swarm') {
      fetchTasks();
      fetchAgents();
    }
    if (showWeKnoraDock) {
      fetchConversations();
      fetchWeKnoraMemory();
    }
  }, [activeTab, activeZone, showWeKnoraDock, fetchZones, fetchFiles, fetchConversations, fetchWeKnoraMemory, fetchTasks, fetchAgents]);

  React.useEffect(() => {
    if (activeFile && (activeTab === 'finder' || activeTab === 'reader')) {
      fetchDocContent(activeFile);
    }
  }, [activeFile, activeTab, fetchDocContent]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextPath = activeFile?.relative_path ?? null;
      (window as unknown as { __itsaplanActiveReaderPath?: string | null }).__itsaplanActiveReaderPath = nextPath;
      window.dispatchEvent(new CustomEvent('itsaplan:active-reader-file', { detail: { path: nextPath } }));
    }
  }, [activeFile]);

  const handleCreateThread = async (title?: string) => {
    const threadTitle =
      title || `WeKnora Session ${conversations.length + 1}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/conversations/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: threadTitle }),
      });
      if (res.ok) {
        const created = await res.json();
        const tid = created.thread_id || created.id;
        await fetchConversations();
        if (tid) setActiveThreadId(tid);
      }
    } catch (err) {
      console.error('Failed to create WeKnora thread:', err);
    }
  };

  const handleRunInboxTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/custodian/triage`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTriageResults(data);
      }
    } catch (err) {
      console.error('Custodian inbox triage failed:', err);
    } finally {
      setTriageLoading(false);
    }
  };

  const handleSelectZone = (zone: string) => {
    setActiveZone(zone);
    setActiveFile(null);
    setDocContent(null);
  };

  const handleSelectFile = (file: VibeFile) => {
    setActiveFile(file);
    setHighlightRange(null);
  };

  const handleOpenReader = (file: VibeFile) => {
    setActiveFile(file);
    handleTabChange('reader');
  };

  const openWeKnoraInGlobalChat = React.useCallback(
    (subTab: 'chat' | 'memory' = 'chat', query?: string) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('itsaplan:open-weknora-chat', { detail: { subTab, query } }),
        );
      }
    },
    [],
  );

  const handleAskWeKnora = (file: VibeFile) => {
    setActiveFile(file);
    handleTabChange('reader');
    openWeKnoraInGlobalChat('chat', `Summarize ${file.name}`);
  };

  const handleInspectArchive = async (filePath: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(filePath)}&start_line=1&end_line=200`
      );
      if (res.ok) {
        const data = await res.json();
        setArchiveModal({
          isOpen: true,
          filePath,
          content: data.content || (data.lines ? data.lines.join('\n') : ''),
        });
      }
    } catch (err) {
      console.error('Failed to inspect archive:', err);
    }
  };

  const handleSelectFileByPath = React.useCallback((path: string) => {
    const found = files.find((f) => f.relative_path === path);
    if (found) {
      setActiveFile(found);
    } else {
      const fileName = path.split('/').pop() || path;
      const syntheticFile: VibeFile = {
        name: fileName,
        relative_path: path,
        size: 0,
        modified: new Date().toISOString(),
        type: 'doc',
      };
      setActiveFile(syntheticFile);
    }
  }, [files]);

  const handleJumpToCitationFromDock = React.useCallback((cit: {
    file_path: string;
    start_line: number;
    end_line: number;
  }) => {
    setHighlightRange({ start: cit.start_line, end: cit.end_line });
    handleSelectFileByPath(cit.file_path);
    handleTabChange('reader');
  }, [handleSelectFileByPath, handleTabChange]);

  const handleOpenWikiGraphFromDock = React.useCallback((path: string) => {
    setHighlightRange(null);
    handleSelectFileByPath(path);
    handleTabChange('reader');
  }, [handleSelectFileByPath, handleTabChange]);

  // Listen for citation jump and WikiGraph open events emitted from the unified global ChatPanel.tsx
  React.useEffect(() => {
    type PendingCit = { file_path: string; start_line: number; end_line: number };
    const win = window as unknown as {
      __itsaplanPendingCitationJump?: PendingCit;
      __itsaplanPendingWikiGraphPath?: string;
    };
    const pendingCit = win.__itsaplanPendingCitationJump;
    if (pendingCit) {
      delete win.__itsaplanPendingCitationJump;
      handleJumpToCitationFromDock(pendingCit);
    }
    const pendingWiki = win.__itsaplanPendingWikiGraphPath;
    if (pendingWiki) {
      delete win.__itsaplanPendingWikiGraphPath;
      handleOpenWikiGraphFromDock(pendingWiki);
    }

    const onCitationJump = (e: Event) => {
      const cit = (e as CustomEvent<PendingCit>).detail;
      if (cit) {
        delete win.__itsaplanPendingCitationJump;
        handleJumpToCitationFromDock(cit);
      }
    };
    const onWikiGraphOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ path: string }>).detail;
      if (detail?.path) {
        delete win.__itsaplanPendingWikiGraphPath;
        handleOpenWikiGraphFromDock(detail.path);
      }
    };
    window.addEventListener('itsaplan:weknora-citation-jump', onCitationJump);
    window.addEventListener('itsaplan:weknora-wikigraph-open', onWikiGraphOpen);
    return () => {
      window.removeEventListener('itsaplan:weknora-citation-jump', onCitationJump);
      window.removeEventListener('itsaplan:weknora-wikigraph-open', onWikiGraphOpen);
    };
  }, [handleJumpToCitationFromDock, handleOpenWikiGraphFromDock]);

  const activeHintPair =
    KNOWLEDGE_TAB_HINTS[activeTab as ConsolidatedWorkspaceMode] ?? KNOWLEDGE_TAB_HINTS.docs;
  const activeTabHint = isVi ? activeHintPair.vi : activeHintPair.en;
  const knowledgeTabTriggerClass =
    'h-9 rounded-full px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background data-[state=active]:shadow-xs';
  const notesSubViewClass = (active: boolean) =>
    active
      ? 'h-8 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
      : 'h-8 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground';

  return (
    <div
      id="consolidated-knowledge-workspace"
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground"
    >
      {/* CONSOLIDATED HEADER TOOLBAR: Docs + Notes + Spatial Finder + Evidence Reader + Knowledge Graph */}
      <div
        id="consolidated-knowledge-toolbar"
        className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-card/75 px-3 py-1.5 backdrop-blur-md sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="shrink-0">
            <TabsList className="h-auto rounded-full border border-border/85 bg-muted/65 p-0.5">
              <TabsTrigger value="docs" className={knowledgeTabTriggerClass}>
                <BookOpenText className="size-3.5" />
                <span>{tNav('documents')}</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className={knowledgeTabTriggerClass}>
                <StickyNote className="size-3.5" />
                <span>{tNav('notes')}</span>
              </TabsTrigger>
              <TabsTrigger value="finder" className={knowledgeTabTriggerClass}>
                <Folder className="size-3.5" />
                <span>{tNav('workspaceFiles')}</span>
              </TabsTrigger>
              <TabsTrigger value="reader" className={knowledgeTabTriggerClass}>
                <BookOpen className="size-3.5" />
                <span>{tNav('evidenceReader')}</span>
              </TabsTrigger>
              <TabsTrigger value="galaxy" className={knowledgeTabTriggerClass}>
                <Globe2 className="size-3.5" />
                <span>{tNav('knowledgeGraph')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span
            data-testid="knowledge-hub-jtbd-hint"
            title={activeTabHint}
            className="hidden truncate text-xs text-muted-foreground xl:inline"
          >
            {activeTabHint}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'notes' && (
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/85 bg-muted/65 p-0.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setNotesSubView('kara')}
                data-testid="notes-subview-kara"
                aria-pressed={notesSubView === 'kara'}
                className={notesSubViewClass(notesSubView === 'kara')}
              >
                {isVi ? 'Cuộc họp AI' : 'AI Meeting Notes'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setNotesSubView('sticky')}
                data-testid="notes-subview-sticky"
                aria-pressed={notesSubView === 'sticky'}
                className={notesSubViewClass(notesSubView === 'sticky')}
              >
                {isVi ? 'Ghi chú nhanh' : 'Sticky Notes'}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              fetchZones();
              fetchFiles(activeZone);
              fetchConversations();
              fetchWeKnoraMemory();
              fetchTasks();
              fetchAgents();
            }}
            className="size-8 rounded-full"
            title={isVi ? 'Làm mới dữ liệu tri thức' : 'Refresh Workspace Data'}
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* CONSOLIDATED VIEWPORT BODY */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {visitedTabs.has('docs') && (
          <div
            className={activeTab === 'docs' ? 'flex min-h-0 flex-1 overflow-hidden' : 'hidden'}
            aria-hidden={activeTab !== 'docs'}
          >
            <PaneActiveProvider active={parentActive && activeTab === 'docs'}>
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <DocumentsPage />
              </div>
              {showWeKnoraDock && (
                <WeKnoraCopilotDock
                  apiBaseUrl={API_BASE_URL}
                  projectKey={projectKey || undefined}
                  activeFilePath={activeFile?.relative_path ?? null}
                  conversations={conversations}
                  activeThreadId={activeThreadId}
                  onSelectThread={setActiveThreadId}
                  onCreateThread={handleCreateThread}
                  memory={weknoraMemory}
                  onJumpToCitation={handleJumpToCitationFromDock}
                  onOpenWikiGraphDoc={handleOpenWikiGraphFromDock}
                  onRunInboxTriage={handleRunInboxTriage}
                  triageLoading={triageLoading}
                  triageResults={triageResults}
                />
              )}
            </PaneActiveProvider>
          </div>
        )}

        {visitedTabs.has('kara') && (
          <div
            className={activeTab === 'kara' ? 'flex min-h-0 flex-1 overflow-hidden' : 'hidden'}
            aria-hidden={activeTab !== 'kara'}
          >
            <PaneActiveProvider active={parentActive && activeTab === 'kara'}>
              <KaraMeetingWorkspaceView projectId={projectKey || undefined} />
            </PaneActiveProvider>
          </div>
        )}

        {visitedTabs.has('notes') && (
          <div
            className={
              activeTab === 'notes'
                ? 'flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden'
                : 'hidden'
            }
            aria-hidden={activeTab !== 'notes'}
          >
            <PaneActiveProvider active={parentActive && activeTab === 'notes'}>
              {notesSubView === 'kara' ? (
                <div className="flex min-h-0 w-full flex-1 overflow-hidden">
                  <KaraMeetingWorkspaceView
                    projectId={projectKey || undefined}
                    onOpenStickyNotes={() => setNotesSubView('sticky')}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <NotesPage />
                </div>
              )}
            </PaneActiveProvider>
          </div>
        )}

        {visitedTabs.has('finder') && (
          <div
            className={activeTab === 'finder' ? 'flex min-h-0 flex-1 overflow-hidden' : 'hidden'}
            aria-hidden={activeTab !== 'finder'}
          >
            <PaneActiveProvider active={parentActive && activeTab === 'finder'}>
              <SpatialFinderView
                zones={zones}
                activeZone={activeZone}
                onSelectZone={handleSelectZone}
                files={files}
                activeFile={activeFile}
                onSelectFile={handleSelectFile}
                docContent={docContent}
                loadingContent={loadingContent}
                onOpenReader={handleOpenReader}
                onInspectArchive={handleInspectArchive}
                onAskWeKnora={handleAskWeKnora}
                onSelectFileByPath={handleOpenWikiGraphFromDock}
                onRunInboxTriage={handleRunInboxTriage}
              />
            </PaneActiveProvider>
          </div>
        )}

        {activeTab === 'galaxy' && (
          <GalaxyCanvasView
            zones={zones}
            activeZone={activeZone}
            onSelectZone={handleSelectZone}
            files={files}
            onOpenFileInReader={handleOpenReader}
            onInspectArchive={handleInspectArchive}
          />
        )}

        {visitedTabs.has('reader') && (
          <div
            className={activeTab === 'reader' ? 'flex min-h-0 flex-1 overflow-hidden' : 'hidden'}
            aria-hidden={activeTab !== 'reader'}
          >
            <PaneActiveProvider active={parentActive && activeTab === 'reader'}>
              <GroundedReaderView
                activeFile={activeFile}
                docContent={docContent}
                loadingContent={loadingContent}
                highlightRange={highlightRange}
                onSetHighlightRange={setHighlightRange}
                onInspectArchive={handleInspectArchive}
                onSelectFileByPath={handleSelectFileByPath}
                apiBaseUrl={API_BASE_URL}
                conversations={conversations}
                activeThreadId={activeThreadId}
                onSelectThread={setActiveThreadId}
                onCreateThread={handleCreateThread}
                memory={weknoraMemory}
                onRunInboxTriage={handleRunInboxTriage}
                triageLoading={triageLoading}
                triageResults={triageResults}
              />
            </PaneActiveProvider>
          </div>
        )}
      </div>

      <ArchiveManifestModal
        isOpen={archiveModal.isOpen}
        onClose={() => setArchiveModal((prev) => ({ ...prev, isOpen: false }))}
        filePath={archiveModal.filePath}
        manifestContent={archiveModal.content}
      />
    </div>
  );
}
