'use client';

import * as React from 'react';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import {
  BookOpen,
  BookOpenText,
  Bot,
  Compass,
  Folder,
  Globe2,
  RefreshCw,
  Sparkles,
  StickyNote,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useShellRoute } from '@/hooks/useShellRoute';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DocumentsPage from '@/features/documents/DocumentsPage';
import NotesPage from '@/features/notes/NotesPage';

import type {
  VibeZone,
  VibeFile,
  VibeDocContent,
  VibeAgent,
  VibeTask,
  VibeConversation,
  WeKnoraMemoryPayload,
} from './types';
import SpatialFinderView from './components/SpatialFinderView';
import GalaxyCanvasView from './components/GalaxyCanvasView';
import GroundedReaderView from './components/GroundedReaderView';
import AgentSwarmView from './components/AgentSwarmView';
import ArchiveManifestModal from './components/ArchiveManifestModal';
import WeKnoraCopilotDock from './components/WeKnoraCopilotDock';

const API_BASE_URL = '';

export type ConsolidatedWorkspaceMode = 'docs' | 'notes' | 'finder' | 'reader' | 'galaxy' | 'swarm';

export interface VibeCanvasPageProps {
  initialMode?: ConsolidatedWorkspaceMode;
}

function resolveDefaultMode(
  pathname: string,
  initialMode?: ConsolidatedWorkspaceMode,
): ConsolidatedWorkspaceMode {
  if (initialMode) return initialMode;
  if (pathname.includes('/notes')) return 'notes';
  if (pathname.includes('/docs')) return 'docs';
  return 'finder';
}

export default function VibeCanvasPage({ initialMode }: VibeCanvasPageProps = {}) {
  const { projectKey } = useShellRoute();
  const pathname = useInstantPathname();

  const [activeTab, setActiveTab] = React.useState<string>(() =>
    resolveDefaultMode(pathname, initialMode),
  );

  // Persistent WeKnora Copilot Side Dock for Docs & Notes modes
  const [showWeKnoraDock, setShowWeKnoraDock] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (pathname.includes('/notes')) {
      setActiveTab('notes');
    } else if (pathname.includes('/docs')) {
      setActiveTab('docs');
    } else if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [pathname, initialMode]);

  const [bridgeConnected, setBridgeConnected] = React.useState<boolean>(true);

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
    {
      id: 'thread-default',
      thread_id: 'thread-default',
      title: 'Project Master Architecture',
      created_at: '',
      message_count: 2,
    },
    {
      id: 'thread-weknora',
      thread_id: 'thread-weknora',
      title: 'Jevbox vs WeKnora Evaluation',
      created_at: '',
      message_count: 5,
    },
  ]);
  const [activeThreadId, setActiveThreadId] = React.useState<string>('thread-default');
  const [weknoraMemory, setWeknoraMemory] = React.useState<WeKnoraMemoryPayload | null>(null);
  const [agents, setAgents] = React.useState<VibeAgent[]>([]);
  const [tasks, setTasks] = React.useState<VibeTask[]>([]);
  const [triageLoading, setTriageLoading] = React.useState<boolean>(false);
  const [triageResults, setTriageResults] = React.useState<any | null>(null);

  const [highlightRange, setHighlightRange] = React.useState<{ start: number; end: number } | null>(
    null,
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
        const data = await res.json();
        const mappedFiles: VibeFile[] = (Array.isArray(data) ? data : []).map((f: any) => ({
          name: f.name,
          relative_path: f.relative_path,
          size: f.size_bytes || 0,
          modified: f.modified_at || '',
          type: (f.icon === 'pdf' ? 'doc' : f.icon) || 'doc',
          openjev_score: f.openjev_score,
        }));
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
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(file.relative_path)}&start_line=1&end_line=200`,
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
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(
            data.map((c: any) => ({
              id: c.thread_id || c.id,
              thread_id: c.thread_id || c.id,
              title: c.title,
              created_at: c.created_at || '',
              message_count: c.message_count || 0,
            })),
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
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: t.task_id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigned_agent: t.assigned_actor,
          project: projectKey,
        }));
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
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((a: any) => ({
          id: a.agent_id || a.id,
          name: a.name,
          role: a.role || a.archetype,
          status: a.status || 'IDLE',
          archetype: a.archetype || 'agent',
          capabilities: a.capabilities || [],
        }));
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'finder' || activeTab === 'galaxy' || activeTab === 'reader') {
      fetchZones();
    } else if (activeTab === 'swarm') {
      fetchTasks();
      fetchAgents();
    }
  }, [activeTab, fetchZones, fetchTasks, fetchAgents]);

  React.useEffect(() => {
    if (showWeKnoraDock) {
      fetchConversations();
      fetchWeKnoraMemory();
    }
  }, [showWeKnoraDock, fetchConversations, fetchWeKnoraMemory]);

  React.useEffect(() => {
    if (activeTab === 'finder' || activeTab === 'galaxy' || activeTab === 'reader') {
      fetchFiles(activeZone);
    }
  }, [activeTab, activeZone, fetchFiles]);

  React.useEffect(() => {
    if (activeFile) {
      fetchDocContent(activeFile);
    }
  }, [activeFile, fetchDocContent]);

  const handleCreateThread = async (title?: string) => {
    const threadTitle = title || `WeKnora Session ${conversations.length + 1}`;
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
    setActiveTab('reader');
  };

  const handleAskWeKnora = (file: VibeFile) => {
    setActiveFile(file);
    setActiveTab('reader');
  };

  const handleInspectArchive = async (filePath: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(filePath)}&start_line=1&end_line=200`,
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

  const handleSelectFileByPath = (path: string) => {
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
  };

  const handleJumpToCitationFromDock = (cit: {
    file_path: string;
    start_line: number;
    end_line: number;
  }) => {
    setHighlightRange({ start: cit.start_line, end: cit.end_line });
    handleSelectFileByPath(cit.file_path);
    setActiveTab('reader');
  };

  const handleOpenWikiGraphFromDock = (path: string) => {
    setHighlightRange(null);
    handleSelectFileByPath(path);
    setActiveTab('reader');
  };

  const isDocsOrNotesMode = activeTab === 'docs' || activeTab === 'notes';

  return (
    <div
      id="consolidated-knowledge-workspace"
      className="flex w-full flex-1 flex-col overflow-hidden bg-background text-foreground"
      style={{ height: 'calc(100vh - 3.5rem)', minHeight: '600px' }}
    >
      {/* CONSOLIDATED HEADER TOOLBAR: Docs + Notes + Full WeKnora Vibe Canvas */}
      <div
        id="consolidated-knowledge-toolbar"
        className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <Compass className="size-4 text-primary" />
            <span id="consolidated-workspace-title" className="tracking-tight">
              Docs, Notes &amp; WeKnora Vibe Canvas
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8">
            <TabsList className="h-8 bg-muted/60 p-0.5">
              <TabsTrigger value="docs" className="h-7 gap-1.5 px-2.5 text-xs">
                <BookOpenText className="size-3.5" />
                <span>Docs</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="h-7 gap-1.5 px-2.5 text-xs">
                <StickyNote className="size-3.5" />
                <span>Notes</span>
              </TabsTrigger>
              <TabsTrigger value="finder" className="h-7 gap-1.5 px-2.5 text-xs">
                <Folder className="size-3.5" />
                <span>Spatial Finder</span>
              </TabsTrigger>
              <TabsTrigger value="reader" className="h-7 gap-1.5 px-2.5 text-xs">
                <BookOpen className="size-3.5" />
                <span>Evidence Reader</span>
              </TabsTrigger>
              <TabsTrigger value="galaxy" className="h-7 gap-1.5 px-2.5 text-xs">
                <Globe2 className="size-3.5" />
                <span>3D Galaxy</span>
              </TabsTrigger>
              <TabsTrigger value="swarm" className="h-7 gap-1.5 px-2.5 text-xs">
                <Bot className="size-3.5" />
                <span>Agent Swarm &amp; Board</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isDocsOrNotesMode && (
            <Button
              type="button"
              variant={showWeKnoraDock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowWeKnoraDock((v) => !v)}
              className="h-7 gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5" />
              <span>WeKnora Copilot</span>
            </Button>
          )}

          <Badge
            variant="outline"
            className={`gap-1.5 font-mono text-[11px] ${
              bridgeConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {bridgeConnected ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                <Wifi className="size-3" />
                WeKnora Bridge: 8765
              </>
            ) : (
              <>
                <WifiOff className="size-3" />
                Bridge Offline
              </>
            )}
          </Badge>

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
            className="size-8"
            title="Refresh WeKnora & Workspace Data"
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* CONSOLIDATED VIEWPORT BODY */}
      <div className="relative flex flex-1 overflow-hidden">
        {activeTab === 'docs' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <DocumentsPage />
            </div>
            {showWeKnoraDock && (
              <WeKnoraCopilotDock
                apiBaseUrl={API_BASE_URL}
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
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <NotesPage />
            </div>
            {showWeKnoraDock && (
              <WeKnoraCopilotDock
                apiBaseUrl={API_BASE_URL}
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
          </div>
        )}

        {activeTab === 'finder' && (
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

        {activeTab === 'reader' && (
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
        )}

        {activeTab === 'swarm' && (
          <AgentSwarmView
            agents={agents}
            tasks={tasks}
            onRefreshTasks={fetchTasks}
            onRefreshAgents={fetchAgents}
            apiBaseUrl={API_BASE_URL}
          />
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
