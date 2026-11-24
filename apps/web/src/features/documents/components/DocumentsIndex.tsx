'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDocumentNavigation } from '@/hooks/useDocumentNavigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProjectDocumentSummary } from '@/lib/api/endpoints/documents';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMoveDocument, useSetDocumentFavorite } from '../services/documents.service';
import { DOCUMENT_LIST_TABS, type DocumentListTab } from '../utils/documentList';
import DocumentTree, { type DocumentSort } from './DocumentTree';

const SORTS = [
  'position',
  'title',
  'created',
  'updated',
] as const satisfies readonly DocumentSort[];
export type { DocumentListTab } from '../utils/documentList';

const defaults: {
  sort: DocumentSort;
  direction: 'asc' | 'desc';
  creator: string | null;
  range: 'all' | 'today' | 'week' | 'month';
  scroll: number;
} = { sort: 'position', direction: 'asc', creator: null, range: 'all', scroll: 0 };

export default function DocumentsIndex({
  projectKey,
  documents,
  tab,
  search,
  searching,
  loading,
  failed,
  canCreate,
  canEdit,
  authorNames,
  reorderSafe,
  creating,
  onSearchChange,
  onTabChange,
  onCreate,
  onRetry,
}: {
  projectKey: string;
  documents: ProjectDocumentSummary[];
  tab: DocumentListTab;
  search: string;
  searching: boolean;
  loading: boolean;
  failed: boolean;
  canCreate: boolean;
  canEdit: boolean;
  authorNames: Record<string, string>;
  reorderSafe: boolean;
  creating: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: DocumentListTab) => void;
  onCreate: (parentId: number | null) => void;
  onRetry: () => void;
}) {
  const t = useTranslations('documents');
  const move = useMoveDocument(projectKey);
  const favorite = useSetDocumentFavorite(projectKey);
  const [preferences, setPreferences] = useDocumentNavigation(projectKey, 'index', defaults);
  const sort = SORTS.includes(preferences.sort) ? preferences.sort : 'position';
  const sortDirection = preferences.direction === 'desc' ? 'desc' : 'asc';
  const creatorId = preferences.creator;
  const createdRange = ['all', 'today', 'week', 'month'].includes(preferences.range)
    ? preferences.range
    : 'all';
  const setSort = (sort: DocumentSort) => setPreferences((p) => ({ ...p, sort }));
  const setSortDirection = (update: (value: 'asc' | 'desc') => 'asc' | 'desc') =>
    setPreferences((p) => ({ ...p, direction: update(p.direction) }));
  const setCreatorId = (creator: string | null) => setPreferences((p) => ({ ...p, creator }));
  const setCreatedRange = (range: typeof defaults.range) =>
    setPreferences((p) => ({ ...p, range }));
  const scrollRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const lastScroll = useRef(preferences.scroll);
  useEffect(() => {
    if (!loading && !restored.current && scrollRef.current) {
      scrollRef.current.scrollTop = preferences.scroll;
      lastScroll.current = preferences.scroll;
      restored.current = true;
    }
  }, [loading, preferences.scroll]);
  useEffect(
    () => () => setPreferences((p) => ({ ...p, scroll: lastScroll.current })),
    [setPreferences],
  );

  const moveMutate = move.mutate;
  const favMutate = favorite.mutate;
  const handleMove = useCallback(
    (input: Parameters<typeof moveMutate>[0]) => moveMutate(input),
    [moveMutate],
  );
  const handleFavoriteChange = useCallback(
    (documentId: number, isFavorite: boolean) => favMutate({ documentId, isFavorite }),
    [favMutate],
  );

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          documents.flatMap((document) => (document.createdByUserId ? [document.createdByUserId] : [])),
        ),
      ).sort((a, b) => (authorNames[a] ?? a).localeCompare(authorNames[b] ?? b)),
    [documents, authorNames],
  );
  const displayDocuments = useMemo(() => {
    const now = Date.now();
    const filteredDocuments = documents.filter((document) => {
      if (creatorId !== null && document.createdByUserId !== creatorId) return false;
      if (createdRange === 'all') return true;

      const age = now - Date.parse(document.createdAt);
      const limit =
        createdRange === 'today'
          ? 24 * 60 * 60 * 1000
          : createdRange === 'week'
            ? 7 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;
      return age >= 0 && age <= limit;
    });
    const filteredIds = new Set(filteredDocuments.map((document) => document.id));
    return filteredDocuments.map((document) =>
      document.parentId !== null && !filteredIds.has(document.parentId)
        ? { ...document, parentId: null }
        : document,
    );
  }, [documents, creatorId, createdRange]);
  const filterCount = Number(creatorId !== null) + Number(createdRange !== 'all');
  const sortLabel = {
    position: t('manualOrder'),
    title: t('nameOrder'),
    updated: t('updatedOrder'),
    created: t('createdOrder'),
  }[sort];
  const tabLabel = (value: DocumentListTab) =>
    value === 'favorites'
      ? t('favoritePages')
      : value === 'public'
        ? t('publicPages')
        : value === 'private'
          ? t('privatePages')
          : t('archivedPages');

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <h1 className="sr-only">{t('title')}</h1>

      <div className="mx-3 my-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/85 bg-card shadow-[var(--studio-card-shadow)] sm:mx-4">
        <div className="shrink-0 border-b border-border/70 px-3 py-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border/85 bg-muted/65 p-0.5 scrollbar-none"
                role="tablist"
              >
                {DOCUMENT_LIST_TABS.map((option) => {
                  const active = tab === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'bg-foreground font-semibold text-background shadow-xs'
                          : 'font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground',
                      )}
                      onClick={() => onTabChange(option)}
                    >
                      {tabLabel(option)}
                    </button>
                  );
                })}
              </div>
              {!loading && (
                <span
                  data-testid="docs-count-badge"
                  className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground"
                >
                  {documents.length}
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex-initial">
              <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none lg:w-64">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  className="h-8 rounded-full border-transparent bg-muted/65 ps-8 text-xs shadow-none hover:bg-muted focus-visible:bg-background"
                  placeholder={t('search')}
                  aria-label={t('search')}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full px-2.5 text-xs text-muted-foreground"
                    aria-label={t('sort')}
                  >
                    <ArrowUpDown className="size-3.5" />
                    <span className="hidden md:inline">{sortLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {SORTS.map((option) => (
                    <DropdownMenuItem key={option} onSelect={() => setSort(option)}>
                      <Check className={cn('me-1', option !== sort && 'invisible')} />
                      {option === 'position'
                        ? t('manualOrder')
                        : option === 'title'
                          ? t('nameOrder')
                          : option === 'created'
                            ? t('createdOrder')
                            : t('updatedOrder')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-8 rounded-full text-muted-foreground"
                disabled={sort === 'position'}
                aria-label={sortDirection === 'asc' ? t('sortDescending') : t('sortAscending')}
                onClick={() => setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'))}
              >
                {sortDirection === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant={filterCount > 0 ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 rounded-full px-2.5 text-xs text-muted-foreground"
                    aria-label={t('filters')}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span className="hidden md:inline">{t('filters')}</span>
                    {filterCount > 0 && (
                      <span className="min-w-4 rounded-full bg-foreground px-1 text-center text-xs leading-4 text-background tabular-nums">
                        {filterCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{t('createdBy')}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuItem onSelect={() => setCreatorId(null)}>
                        <Check className={cn('me-1', creatorId !== null && 'invisible')} />
                        {t('anyone')}
                      </DropdownMenuItem>
                      {creatorIds.map((id) => (
                        <DropdownMenuItem key={id} onSelect={() => setCreatorId(id)}>
                          <Check className={cn('me-1', creatorId !== id && 'invisible')} />
                          <span className="truncate" dir="auto">
                            {authorNames[id] ?? t('unknownAuthor')}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{t('createdDate')}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {(['all', 'today', 'week', 'month'] as const).map((range) => (
                        <DropdownMenuItem key={range} onSelect={() => setCreatedRange(range)}>
                          <Check className={cn('me-1', createdRange !== range && 'invisible')} />
                          {t(range)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {filterCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setCreatorId(null);
                          setCreatedRange('all');
                        }}
                      >
                        {t('clearFilters')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {canCreate && (
                <Button
                  type="button"
                  size="sm"
                  aria-label={t('newDocument')}
                  className="h-7 shrink-0 rounded-full bg-foreground px-3 text-xs text-background shadow-xs hover:bg-foreground/90"
                  disabled={creating}
                  onClick={() => onCreate(null)}
                >
                  {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  <span className="hidden sm:inline">{t('newDocument')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={(event) => {
            lastScroll.current = event.currentTarget.scrollTop;
          }}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-2 pb-10"
        >
          <div className="mx-auto w-full max-w-6xl">
            {loading ? (
              <div className="space-y-1 py-1" aria-hidden>
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-[92%] rounded-md" />
                <Skeleton className="h-9 w-[85%] rounded-md" />
              </div>
            ) : failed ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <div className="mb-3 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                  <RefreshCw className="size-4" />
                </div>
                <p className="text-sm font-medium">{t('loadFailed')}</p>
                <Button className="mt-3 rounded-full" variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw />
                  {t('reload')}
                </Button>
              </div>
            ) : (
              <DocumentTree
                projectKey={projectKey}
                documents={displayDocuments}
                scrollContainerRef={scrollRef}
                activeId={null}
                searching={searching}
                sortBy={sort}
                sortDirection={sortDirection}
                canCreate={canCreate}
                reorderEnabled={
                  canEdit &&
                  tab !== 'favorites' &&
                  tab !== 'archived' &&
                  !searching &&
                  sort === 'position' &&
                  filterCount === 0 &&
                  reorderSafe &&
                  !move.isPending
                }
                favoritePending={favorite.isPending}
                onCreate={onCreate}
                onMove={handleMove}
                onFavoriteChange={handleFavoriteChange}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
