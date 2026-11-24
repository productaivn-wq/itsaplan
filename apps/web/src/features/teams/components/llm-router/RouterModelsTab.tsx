'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LlmRouterState } from '@/lib/api/endpoints/llmRouter';

interface RouterModelsTabProps {
  state: LlmRouterState;
  canEdit: boolean;
  syncing: boolean;
  savingDefaults: boolean;
  onSync: () => void;
  onSaveCatalog: (input: {
    defaults?: Record<string, unknown>;
    providerModels?: Record<string, Record<string, string[]>>;
  }) => void;
}

function parseLines(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RouterModelsTab({
  state,
  canEdit,
  syncing,
  savingDefaults,
  onSync,
  onSaveCatalog,
}: RouterModelsTabProps) {
  const stringDefaultEntries = useMemo(
    () =>
      Object.entries(state.catalog.defaults).filter(
        ([, val]) => typeof val === 'string',
      ) as Array<[string, string]>,
    [state.catalog.defaults],
  );

  const [draftDefaults, setDraftDefaults] = useState<Record<string, string>>({});
  const providerKeys = useMemo(
    () => Object.keys(state.catalog.providers),
    [state.catalog.providers],
  );
  const [selectedProvider, setSelectedProvider] = useState<string>(
    providerKeys[0] ?? 'nvidia_nim',
  );
  const [preferredText, setPreferredText] = useState('');
  const [codingText, setCodingText] = useState('');
  const [fastText, setFastText] = useState('');
  const [visionText, setVisionText] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const [k, v] of stringDefaultEntries) next[k] = v;
    setDraftDefaults(next);
  }, [stringDefaultEntries]);

  useEffect(() => {
    if (!providerKeys.includes(selectedProvider) && providerKeys[0]) {
      setSelectedProvider(providerKeys[0]);
    }
  }, [providerKeys, selectedProvider]);

  const activeProviderCatalog = state.catalog.providers[selectedProvider];

  useEffect(() => {
    if (!activeProviderCatalog) return;
    setPreferredText(activeProviderCatalog.preferred.join(', '));
    setCodingText(activeProviderCatalog.coding.join(', '));
    setFastText(activeProviderCatalog.fast.join(', '));
    setVisionText(activeProviderCatalog.vision.join(', '));
  }, [activeProviderCatalog, selectedProvider]);

  const filteredLiveModels = useMemo(() => {
    const rows = activeProviderCatalog?.live_models ?? [];
    const q = modelSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        (m.display_name ?? '').toLowerCase().includes(q) ||
        (m.capabilities ?? []).some((c) => c.toLowerCase().includes(q)),
    );
  }, [activeProviderCatalog, modelSearch]);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Role Model Defaults (models_ssot.yaml)
            </h3>
            <p className="text-xs text-muted-foreground">
              Live cache status:{' '}
              <Badge variant={state.catalog.live_fresh ? 'secondary' : 'outline'} className="text-xs">
                {state.catalog.live_fresh ? 'Fresh' : 'Stale / Unsynced'}
              </Badge>{' '}
              {state.catalog.synced_at ? `· Synced ${state.catalog.synced_at}` : ''}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={syncing}
                onClick={onSync}
                data-testid="router-catalog-sync"
              >
                <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Sync Live Catalog
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                disabled={savingDefaults}
                onClick={() => onSaveCatalog({ defaults: draftDefaults })}
                data-testid="router-save-defaults"
              >
                <Save className="size-3.5" />
                Save Role Defaults
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stringDefaultEntries.map(([role]) => (
            <div key={role} className="space-y-1">
              <Label htmlFor={`default-role-${role}`} className="font-mono text-xs text-muted-foreground">
                {role}
              </Label>
              <Input
                id={`default-role-${role}`}
                value={draftDefaults[role] ?? ''}
                disabled={!canEdit}
                onChange={(e) =>
                  setDraftDefaults((prev) => ({ ...prev, [role]: e.target.value }))
                }
                className="h-8 font-mono text-xs"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground">Provider Model Preferences</h3>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="h-8 w-52 text-xs" data-testid="router-catalog-provider-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerKeys.map((pk) => (
                  <SelectItem key={pk} value={pk} className="text-xs">
                    {pk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canEdit && activeProviderCatalog && (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5"
              disabled={savingDefaults}
              onClick={() =>
                onSaveCatalog({
                  providerModels: {
                    [selectedProvider]: {
                      preferred: parseLines(preferredText),
                      coding: parseLines(codingText),
                      fast: parseLines(fastText),
                      vision: parseLines(visionText),
                    },
                  },
                })
              }
              data-testid="router-save-provider-models"
            >
              <Save className="size-3.5" />
              Save {selectedProvider} Lists
            </Button>
          )}
        </div>

        {activeProviderCatalog && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preferred (comma-separated)</Label>
              <Input
                value={preferredText}
                disabled={!canEdit}
                onChange={(e) => setPreferredText(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Coding (comma-separated)</Label>
              <Input
                value={codingText}
                disabled={!canEdit}
                onChange={(e) => setCodingText(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fast (comma-separated)</Label>
              <Input
                value={fastText}
                disabled={!canEdit}
                onChange={(e) => setFastText(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Vision (comma-separated)</Label>
              <Input
                value={visionText}
                disabled={!canEdit}
                onChange={(e) => setVisionText(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        )}

        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">
              Live Discovered Models ({filteredLiveModels.length})
            </span>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Filter models or capabilities..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {filteredLiveModels.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No live cached models for {selectedProvider}. Click &ldquo;Sync Live Catalog&rdquo; to refresh.
            </p>
          ) : (
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Model ID</TableHead>
                    <TableHead className="text-xs">Capabilities</TableHead>
                    <TableHead className="text-xs">Context</TableHead>
                    <TableHead className="text-xs">Pricing ($/1M)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLiveModels.slice(0, 100).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(m.capabilities ?? []).map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.context_window ? m.context_window.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.input_cost_per_1m_usd !== undefined
                          ? `${m.input_cost_per_1m_usd} / ${m.output_cost_per_1m_usd ?? 0}`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
