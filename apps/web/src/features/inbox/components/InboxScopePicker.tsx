'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, FolderKanban, Layers, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDurationShort } from '@/utils/dates';
import type { InboxScope, ProjectInboxCount } from '../services/inboxStreams';

export interface InboxScopeProjectOption extends ProjectInboxCount {
  lastUpdatedMs: number;
}

export default function InboxScopePicker({
  scope,
  shortProjectKey,
  activeProjectFilter,
  otherProjectsCount,
  projects,
  isVi,
  onScopeChange,
  onSelectProjectFilter,
}: {
  scope: InboxScope;
  shortProjectKey: string;
  activeProjectFilter: string;
  otherProjectsCount: number;
  projects: InboxScopeProjectOption[];
  isVi: boolean;
  onScopeChange: (nextScope: InboxScope) => void;
  onSelectProjectFilter: (nextKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeChip = useMemo(
    () =>
      activeProjectFilter !== 'ALL'
        ? projects.find((p) => p.key.toUpperCase() === activeProjectFilter.toUpperCase()) ?? null
        : null,
    [projects, activeProjectFilter],
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.key.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const currentProjectLabel = shortProjectKey || 'PM';
  const triggerLabel =
    scope === 'project'
      ? isVi
        ? `Dự án: ${currentProjectLabel}`
        : `Project: ${currentProjectLabel}`
      : activeProjectFilter !== 'ALL'
        ? activeProjectFilter
        : isVi
          ? 'Toàn danh mục'
          : 'All Projects';

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="btn-inbox-scope-picker"
            data-scope={scope}
            data-project-filter={activeProjectFilter}
            title={activeChip?.name ?? triggerLabel}
            className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
          >
            {scope === 'project' || activeProjectFilter !== 'ALL' ? (
              <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Layers className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{triggerLabel}</span>
            {scope === 'all' && activeChip && (
              <span className="inline-flex h-4.5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold tabular-nums text-foreground">
                {activeChip.total}
              </span>
            )}
            {scope === 'project' && otherProjectsCount > 0 && (
              <span
                data-testid="inbox-all-projects-badge"
                className="inline-flex h-4.5 min-w-5 items-center justify-center rounded-full bg-[var(--studio-amber-soft)] px-1.5 text-xs font-semibold tabular-nums text-[var(--studio-amber)]"
              >
                {otherProjectsCount}
              </span>
            )}
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          data-testid="inbox-scope-popover"
          className="w-72 p-2"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-inbox-scope-search"
              placeholder={
                isVi ? 'Tìm dự án theo tên hoặc mã…' : 'Search projects by name or key…'
              }
              className="h-8 ps-8 text-xs"
            />
          </div>

          {!search.trim() && (
            <div className="mb-1.5 space-y-0.5 border-b border-border/70 pb-1.5">
              <button
                type="button"
                data-testid="btn-inbox-scope-all"
                aria-pressed={scope === 'all' && activeProjectFilter === 'ALL'}
                onClick={() => {
                  onScopeChange('all');
                  onSelectProjectFilter('ALL');
                  handleOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  scope === 'all' && activeProjectFilter === 'ALL'
                    ? 'bg-accent font-semibold text-foreground'
                    : 'text-foreground hover:bg-accent/60',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{isVi ? 'Toàn danh mục' : 'All Projects'}</span>
                </span>
                {scope === 'all' && activeProjectFilter === 'ALL' && (
                  <Check className="size-3.5 shrink-0" />
                )}
              </button>

              <button
                type="button"
                data-testid="btn-inbox-scope-project"
                aria-pressed={scope === 'project'}
                onClick={() => {
                  onScopeChange('project');
                  handleOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  scope === 'project'
                    ? 'bg-accent font-semibold text-foreground'
                    : 'text-foreground hover:bg-accent/60',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {isVi
                      ? `Dự án hiện tại (${currentProjectLabel})`
                      : `This Project (${currentProjectLabel})`}
                  </span>
                </span>
                {scope === 'project' && <Check className="size-3.5 shrink-0" />}
              </button>
            </div>
          )}

          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {!search.trim() && projects.length > 0 && (
              <button
                type="button"
                data-testid="btn-inbox-project-filter-ALL"
                aria-pressed={activeProjectFilter === 'ALL'}
                onClick={() => {
                  onSelectProjectFilter('ALL');
                  handleOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  activeProjectFilter === 'ALL'
                    ? 'bg-accent/80 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span>{isVi ? 'Tất cả dự án' : 'All project streams'}</span>
                {activeProjectFilter === 'ALL' && <Check className="size-3.5 shrink-0" />}
              </button>
            )}

            {filteredProjects.length === 0 ? (
              <div className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                {isVi ? 'Không tìm thấy dự án phù hợp' : 'No matching projects'}
              </div>
            ) : (
              filteredProjects.map((chip) => {
                const active = activeProjectFilter === chip.key;
                const age = Number.isFinite(chip.lastUpdatedMs)
                  ? formatDurationShort(new Date(chip.lastUpdatedMs).toISOString())
                  : '';
                return (
                  <button
                    key={chip.key}
                    type="button"
                    data-testid={`btn-inbox-project-filter-${chip.key}`}
                    aria-pressed={active}
                    title={age ? `${chip.name} · ${age}` : chip.name}
                    onClick={() => {
                      onSelectProjectFilter(chip.key);
                      handleOpenChange(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                      active
                        ? 'bg-accent font-semibold text-foreground'
                        : 'text-foreground hover:bg-accent/60',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {chip.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{chip.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {age && (
                        <span className="text-xs text-muted-foreground tabular-nums">{age}</span>
                      )}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground">
                        {chip.total}
                      </span>
                      {active && <Check className="size-3.5 shrink-0" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {scope === 'all' && activeProjectFilter !== 'ALL' && (
        <button
          type="button"
          data-testid="btn-inbox-project-filter-clear"
          aria-label={isVi ? 'Bỏ lọc dự án' : 'Clear project filter'}
          title={isVi ? 'Bỏ lọc dự án' : 'Clear project filter'}
          onClick={() => onSelectProjectFilter('ALL')}
          className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
