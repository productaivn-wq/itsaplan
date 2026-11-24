'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Cpu,
  KeyRound,
  Save,
  ShieldAlert,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { LlmRouterState, RouterProviderEntry } from '@/lib/api/endpoints/llmRouter';

interface RouterProvidersTabProps {
  state: LlmRouterState;
  canEdit: boolean;
  savingOrder: boolean;
  savingCredentials: boolean;
  togglingKey: string | null;
  onSaveOrder: (activeProviders: string[], inactiveProviders: string[]) => void;
  onToggleProvider: (providerKey: string, enabled: boolean) => void;
  onUpdateCredentials: (input: {
    providerKey: string;
    envKey: string;
    value: string;
  }) => Promise<unknown>;
}

function ReadinessBadge({ entry }: { entry: RouterProviderEntry }) {
  const { probe } = entry;
  if (probe.ready) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Ready
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400">
      <ShieldAlert className="size-3" />
      Not ready
    </Badge>
  );
}

function ProviderRow({
  entry,
  index,
  totalActive,
  canEdit,
  toggling,
  onMove,
  onToggle,
  onConfigureKeys,
}: {
  entry: RouterProviderEntry;
  index: number | null;
  totalActive: number;
  canEdit: boolean;
  toggling: boolean;
  onMove?: (dir: -1 | 1) => void;
  onToggle: (enabled: boolean) => void;
  onConfigureKeys?: () => void;
}) {
  const successRate =
    entry.telemetry.success_rate_24h !== null ? `${entry.telemetry.success_rate_24h}%` : '—';
  const latency =
    entry.telemetry.avg_latency_ms !== null ? `${Math.round(entry.telemetry.avg_latency_ms)}ms` : '—';

  return (
    <div
      data-testid={`router-provider-row-${entry.key}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {index !== null && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/10 px-1.5 font-mono text-xs font-semibold text-primary">
              #{index + 1}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">{entry.display_name}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {entry.key}
          </code>
          <Badge variant="secondary" className="text-xs uppercase">
            {entry.kind}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {entry.trust_tier}
          </Badge>
          <ReadinessBadge entry={entry} />
          {entry.active_cooldown_count > 0 && (
            <Badge variant="destructive" className="text-xs">
              {entry.active_cooldown_count} cooldown
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{entry.description || entry.probe.detail}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {entry.kind === 'cli' ? <Cpu className="size-3.5" /> : <KeyRound className="size-3.5" />}
            {entry.probe.detail}
          </span>
          {entry.probe.bridge_reachable !== null && (
            <span className="inline-flex items-center gap-1">
              {entry.probe.bridge_reachable ? (
                <Wifi className="size-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="size-3.5 text-amber-500" />
              )}
              Bridge {entry.probe.bridge_reachable ? 'Online' : 'Offline'}
            </span>
          )}
          <span>Models: {entry.models.live_count || entry.models.resolved_candidates.length}</span>
          <span>24h Calls: {entry.telemetry.calls_24h}</span>
          <span>Success: {successRate}</span>
          <span>Latency: {latency}</span>
        </div>

        {entry.models.resolved_candidates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">Candidates:</span>
            {entry.models.resolved_candidates.slice(0, 4).map((m) => (
              <code
                key={m}
                className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                {m}
              </code>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        {canEdit && (entry.editable_env_keys?.length ?? 0) > 0 && onConfigureKeys && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onConfigureKeys}
            data-testid={`router-keys-${entry.key}`}
          >
            <KeyRound className="size-3.5" />
            Keys
          </Button>
        )}
        {index !== null && onMove && canEdit && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              aria-label={`Move ${entry.key} up`}
              data-testid={`router-move-up-${entry.key}`}
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={index >= totalActive - 1}
              onClick={() => onMove(1)}
              aria-label={`Move ${entry.key} down`}
              data-testid={`router-move-down-${entry.key}`}
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </div>
        )}
        <Switch
          checked={entry.enabled}
          disabled={!canEdit || toggling}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${entry.key}`}
          data-testid={`router-toggle-${entry.key}`}
        />
      </div>
    </div>
  );
}

export default function RouterProvidersTab({
  state,
  canEdit,
  savingOrder,
  savingCredentials,
  togglingKey,
  onSaveOrder,
  onToggleProvider,
  onUpdateCredentials,
}: RouterProvidersTabProps) {
  const [draftActive, setDraftActive] = useState<string[]>(state.registry.active_providers);
  const [credTarget, setCredTarget] = useState<RouterProviderEntry | null>(null);
  const [credEnvKey, setCredEnvKey] = useState('');
  const [credValue, setCredValue] = useState('');

  useEffect(() => {
    setDraftActive(state.registry.active_providers);
  }, [state.registry.active_providers]);

  const byKey = useMemo(() => {
    const map = new Map<string, RouterProviderEntry>();
    for (const p of state.providers) map.set(p.key, p);
    return map;
  }, [state.providers]);

  const activeEntries = useMemo(
    () => draftActive.map((k) => byKey.get(k)).filter((v): v is RouterProviderEntry => Boolean(v)),
    [draftActive, byKey],
  );

  const inactiveEntries = useMemo(
    () => state.providers.filter((p) => !draftActive.includes(p.key)),
    [state.providers, draftActive],
  );

  const isDirty =
    draftActive.length !== state.registry.active_providers.length ||
    draftActive.some((k, idx) => state.registry.active_providers[idx] !== k);

  function moveActive(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= draftActive.length) return;
    const next = [...draftActive];
    const [item] = next.splice(idx, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setDraftActive(next);
  }

  function openCredentialsDialog(entry: RouterProviderEntry) {
    setCredTarget(entry);
    setCredEnvKey(entry.editable_env_keys?.[0] ?? '');
    setCredValue('');
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Active Fallback Chain ({activeEntries.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Providers execute in priority order (#1 first) when dispatching prompts through{' '}
              <code>LLMProviderRouter</code>.
            </p>
          </div>
          {canEdit && isDirty && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setDraftActive(state.registry.active_providers)}
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                disabled={savingOrder}
                onClick={() =>
                  onSaveOrder(
                    draftActive,
                    inactiveEntries.map((e) => e.key),
                  )
                }
                data-testid="router-save-priority"
              >
                <Save className="size-3.5" />
                Save Priority Order
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {activeEntries.map((entry, idx) => (
            <ProviderRow
              key={entry.key}
              entry={entry}
              index={idx}
              totalActive={activeEntries.length}
              canEdit={canEdit}
              toggling={togglingKey === entry.key}
              onMove={(dir) => moveActive(idx, dir)}
              onToggle={(enabled) => onToggleProvider(entry.key, enabled)}
              onConfigureKeys={() => openCredentialsDialog(entry)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Inactive &amp; Standby Tiers ({inactiveEntries.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Enable a tier to append it to the active fallback chain.
          </p>
        </div>
        <div className="space-y-2.5">
          {inactiveEntries.map((entry) => (
            <ProviderRow
              key={entry.key}
              entry={entry}
              index={null}
              totalActive={activeEntries.length}
              canEdit={canEdit}
              toggling={togglingKey === entry.key}
              onToggle={(enabled) => onToggleProvider(entry.key, enabled)}
              onConfigureKeys={() => openCredentialsDialog(entry)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Gateway Virtual Models (OpenAI-Compatible)
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {state.gateway.supported_models.map((mid) => (
            <code
              key={mid}
              className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-foreground"
            >
              {mid}
            </code>
          ))}
        </div>
      </section>

      <Dialog
        open={Boolean(credTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCredTarget(null);
            setCredValue('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md" data-testid="router-keys-dialog">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Configure SecretVault Keys — {credTarget?.display_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Write-only encrypted storage (AES-256-GCM in SecretVault). Existing keys are never
              returned to the browser.
            </DialogDescription>
          </DialogHeader>

          {credTarget && (
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vault Environment Key</Label>
                <Select value={credEnvKey} onValueChange={setCredEnvKey}>
                  <SelectTrigger className="h-8 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(credTarget.editable_env_keys ?? []).map((ek) => (
                      <SelectItem key={ek} value={ek} className="font-mono text-xs">
                        {ek}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  API Key or Comma-Separated Key Pool
                </Label>
                <Input
                  type="password"
                  autoComplete="off"
                  value={credValue}
                  onChange={(e) => setCredValue(e.target.value)}
                  placeholder="Enter API key or key1,key2..."
                  className="h-8 font-mono text-xs"
                  data-testid="router-keys-input"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setCredTarget(null);
                setCredValue('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={savingCredentials || !credTarget || !credEnvKey || !credValue.trim()}
              onClick={async () => {
                if (!credTarget) return;
                await onUpdateCredentials({
                  providerKey: credTarget.key,
                  envKey: credEnvKey,
                  value: credValue.trim(),
                });
                setCredTarget(null);
                setCredValue('');
              }}
              data-testid="router-keys-save"
            >
              <Save className="size-3.5" />
              Save to SecretVault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
