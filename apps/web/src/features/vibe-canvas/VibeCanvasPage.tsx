'use client';

import * as React from 'react';
import {
  Compass,
  Folder,
  Globe2,
  BookOpen,
  Bot,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useShellRoute } from '@/hooks/useShellRoute';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type {
  VibeZone,
  VibeFile,
  VibeDocContent,
  VibeAgent,
  VibeTask,
} from './types';
import SpatialFinderView from './components/SpatialFinderView';
import GalaxyCanvasView from './components/GalaxyCanvasView';
import GroundedReaderView from './components/GroundedReaderView';
import AgentSwarmView from './components/AgentSwarmView';
import ArchiveManifestModal from './components/ArchiveManifestModal';

const API_BASE_URL = '';

export default function VibeCanvasPage() {
  const { projectKey } = useShellRoute();

  // Navigation tab state
  const [activeTab, setActiveTab] = React.useState<string>('finder');

  // Bridge connectivity status
  const [bridgeConnected, setBridgeConnected] = React.useState<boolean>(true);

  // Workspace Data State
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

  // Agent Swarm & Task State
  const [agents, setAgents] = React.useState<VibeAgent[]>([]);
  const [tasks, setTasks] = React.useState<VibeTask[]>([]);

  // Reader & Citation Highlight State
  const [highlightRange, setHighlightRange] = React.useState<{ start: number; end: number } | null>(
    null
  );

  // Archive Inspection Modal State
  const [archiveModal, setArchiveModal] = React.useState<{
    isOpen: boolean;
    filePath: string;
    content: string;
  }>({
    isOpen: false,
    filePath: '',
    content: '',
  });

  // 1. Fetch Zones
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

  // 2. Fetch Files for Active Zone
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

  // 3. Fetch Document Content
  const fetchDocContent = React.useCallback(async (file: VibeFile) => {
    setLoadingContent(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(file.relative_path)}&start_line=1&end_line=300`
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
        });
      }
    } catch (err) {
      console.error('Failed to slice document:', err);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  // 4. Fetch Tasks
  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vibe/tasks`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((t: any) => ({
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

  // 5. Fetch Agents
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

  // Initial Load
  React.useEffect(() => {
    fetchZones();
    fetchTasks();
    fetchAgents();
  }, [fetchZones, fetchTasks, fetchAgents]);

  // Zone Change Effect
  React.useEffect(() => {
    fetchFiles(activeZone);
  }, [activeZone, fetchFiles]);

  // Active File Effect
  React.useEffect(() => {
    if (activeFile) {
      fetchDocContent(activeFile);
    }
  }, [activeFile, fetchDocContent]);

  // Handlers for cross-component interactions
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
        `${API_BASE_URL}/api/vibe/document?path=${encodeURIComponent(filePath)}&start_line=1&end_line=500`
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
    // If file is already in current list, select it
    const found = files.find((f) => f.relative_path === path);
    if (found) {
      setActiveFile(found);
    } else {
      // Create minimal VibeFile and fetch its content
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

  return (
    <div
      className="flex w-full flex-col overflow-hidden bg-background text-foreground"
      style={{ height: 'calc(100vh - 3.5rem)', minHeight: '600px' }}
    >
      {/* NATIVE HEADER TOOLBAR: Tabs & Bridge Status */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border px-4 bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Compass className="size-4.5 text-primary" />
            <span className="tracking-tight">Vibe Working Canvas</span>
          </div>

          {/* Radix Tabs Selector */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8">
            <TabsList className="h-8 p-0.5 bg-muted/60">
              <TabsTrigger value="finder" className="h-7 px-2.5 text-xs gap-1.5">
                <Folder className="size-3.5" />
                <span>Spatial Finder</span>
              </TabsTrigger>
              <TabsTrigger value="galaxy" className="h-7 px-2.5 text-xs gap-1.5">
                <Globe2 className="size-3.5" />
                <span>3D Galaxy</span>
              </TabsTrigger>
              <TabsTrigger value="reader" className="h-7 px-2.5 text-xs gap-1.5">
                <BookOpen className="size-3.5" />
                <span>Evidence Reader</span>
              </TabsTrigger>
              <TabsTrigger value="swarm" className="h-7 px-2.5 text-xs gap-1.5">
                <Bot className="size-3.5" />
                <span>Agent Swarm & Board</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Indicators & Utilities */}
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className={`gap-1.5 text-[11px] font-mono ${
              bridgeConnected
                ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                : 'border-destructive/30 text-destructive bg-destructive/10'
            }`}
          >
            {bridgeConnected ? (
              <>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="size-3" />
                Bridge: 8765
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
              fetchTasks();
              fetchAgents();
            }}
            className="size-8"
            title="Refresh All Data"
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* VIEWPORT BODY */}
      <div className="relative flex-1 overflow-hidden">
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

      {/* ZERO-MOJIBAKE ARCHIVE MANIFEST MODAL */}
      <ArchiveManifestModal
        isOpen={archiveModal.isOpen}
        onClose={() => setArchiveModal((prev) => ({ ...prev, isOpen: false }))}
        filePath={archiveModal.filePath}
        manifestContent={archiveModal.content}
      />
    </div>
  );
}
