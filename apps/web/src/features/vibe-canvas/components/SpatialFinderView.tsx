'use client';

import * as React from 'react';
import {
  Folder,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  Database,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VibeZone, VibeFile, VibeDocContent } from '../types';

interface SpatialFinderViewProps {
  zones: VibeZone[];
  activeZone: string;
  onSelectZone: (zone: string) => void;
  files: VibeFile[];
  activeFile: VibeFile | null;
  onSelectFile: (file: VibeFile) => void;
  docContent: VibeDocContent | null;
  loadingContent: boolean;
  onOpenReader: (file: VibeFile) => void;
  onInspectArchive: (filePath: string) => void;
  onAskWeKnora: (file: VibeFile) => void;
}

function getFileIcon(type: VibeFile['type']) {
  switch (type) {
    case 'code':
      return <FileCode className="size-4 text-emerald-500" />;
    case 'image':
      return <ImageIcon className="size-4 text-purple-500" />;
    case 'archive':
      return <Archive className="size-4 text-amber-500" />;
    case 'data':
      return <Database className="size-4 text-blue-500" />;
    default:
      return <FileText className="size-4 text-sky-500" />;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SpatialFinderView({
  zones,
  activeZone,
  onSelectZone,
  files,
  activeFile,
  onSelectFile,
  docContent,
  loadingContent,
  onOpenReader,
  onInspectArchive,
  onAskWeKnora,
}: SpatialFinderViewProps) {
  const [search, setSearch] = React.useState('');

  const filteredFiles = React.useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  return (
    <div className="flex h-full w-full divide-x divide-border overflow-hidden bg-background">
      {/* COLUMN 1: MECE ZONES */}
      <div className="flex w-64 shrink-0 flex-col overflow-y-auto p-3">
        <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Workspace Zones
        </div>
        <div className="flex flex-col gap-1">
          {zones.map((z) => {
            const isSelected = z.name === activeZone;
            return (
              <button
                key={z.name}
                type="button"
                onClick={() => onSelectZone(z.name)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent text-accent-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder
                    className={`size-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span className="truncate">{z.name}</span>
                </div>
                <Badge variant={isSelected ? 'default' : 'secondary'} className="ml-2 px-1.5 py-0 text-[10px]">
                  {z.count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: FILES IN ZONE */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeZone}...`}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredFiles.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              No files found
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredFiles.map((file) => {
                const isSelected = activeFile?.relative_path === file.relative_path;
                return (
                  <button
                    key={file.relative_path}
                    type="button"
                    onClick={() => onSelectFile(file)}
                    className={`flex items-center justify-between rounded-md p-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file.type)}
                      <span className="truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: GROUNDED PREVIEW & ACTIONS */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        {!activeFile ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <BookOpen className="mb-3 size-12 opacity-30" />
            <div className="text-sm font-medium">Select a file to inspect</div>
            <div className="text-xs text-muted-foreground/80">
              Browse MECE zones with deterministic line slicing
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-muted p-2">
                      {getFileIcon(activeFile.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{activeFile.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {activeFile.relative_path}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAskWeKnora(activeFile)}
                      className="gap-1.5 text-xs"
                    >
                      <Sparkles className="size-3.5 text-sky-500" />
                      Ask WeKnora
                    </Button>
                    {activeFile.type === 'archive' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onInspectArchive(activeFile.relative_path)}
                        className="gap-1.5 text-xs"
                      >
                        <Archive className="size-3.5" />
                        Inspect Manifest
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenReader(activeFile)}
                        className="gap-1.5 text-xs"
                      >
                        <ExternalLink className="size-3.5" />
                        Open Reader
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                  <div>
                    <span className="font-medium text-foreground">Size: </span>
                    {formatBytes(activeFile.size)}
                  </div>
                  {docContent && (
                    <div>
                      <span className="font-medium text-foreground">Lines: </span>
                      {docContent.total_lines}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">Type: </span>
                    <span className="uppercase">{activeFile.type}</span>
                  </div>
                  {docContent?.is_archive && (
                    <Badge variant="secondary" className="text-[10px]">
                      Zero-Mojibake Zip
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sliced Content Area */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Deterministic Content Slicer (Gate GW-EFF-01: max 200 lines)</span>
                {docContent && (
                  <span>
                    Showing {docContent.displayed_lines} of {docContent.total_lines} lines
                  </span>
                )}
              </div>

              {loadingContent ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                  Reading sliced content...
                </div>
              ) : docContent?.is_binary ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center text-xs text-muted-foreground">
                  <ImageIcon className="mb-2 size-8 opacity-40" />
                  <div className="font-medium">Binary asset preview</div>
                  <div className="mt-1 max-w-sm text-[11px] text-muted-foreground/80">
                    Content cannot be rendered as raw text without encoding corruption.
                    Use dedicated viewer or open in full reader.
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 font-mono text-xs">
                  <pre className="max-h-[460px] overflow-auto p-4 leading-relaxed text-foreground whitespace-pre-wrap select-text">
                    {docContent?.slice_content || 'No content loaded'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
