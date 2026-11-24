'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, FolderKanban, FolderPlus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Project } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function WorkspaceProjectSwitcher({
  projects,
  currentProjectKey,
  onSelectProject,
  onNewProject,
}: {
  projects: Project[];
  currentProjectKey: string;
  onSelectProject: (ref: string) => void;
  onNewProject?: () => void;
}) {
  const t = useTranslations('aiChat');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = useMemo(
    () => projects.find((p) => p.ref === currentProjectKey || p.key === currentProjectKey) ?? null,
    [projects, currentProjectKey],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.ref.toLowerCase().includes(q),
    );
  }, [projects, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="workspace-project-switcher"
          className="inline-flex h-7 max-w-52 items-center gap-1.5 rounded-md border border-border/80 bg-secondary/70 px-2 text-xs font-medium text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={t('switchProject')}
        >
          <FolderKanban className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-mono">{current?.key ?? currentProjectKey}</span>
          {current?.name && (
            <span className="hidden truncate text-muted-foreground sm:inline">
              · {current.name}
            </span>
          )}
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchProjects')}
              className="h-7.5 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t('noMatches')}
            </p>
          ) : (
            filtered.map((p) => {
              const active = p.ref === currentProjectKey || p.key === currentProjectKey;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    if (!active) onSelectProject(p.ref);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
                    active
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {p.key}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              );
            })
          )}
        </div>
        {onNewProject && (
          <div className="border-t border-border p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="workspace-switcher-new-project-btn"
              className="h-8 w-full justify-start gap-2 text-xs"
              onClick={() => {
                setOpen(false);
                onNewProject();
              }}
            >
              <FolderPlus className="size-3.5 text-primary" />
              <span>{t('newProject')}</span>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
