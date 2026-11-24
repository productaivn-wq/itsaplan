'use client';

import { ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LlmRouterState } from '@/lib/api/endpoints/llmRouter';

interface RouterTelemetryTabProps {
  state: LlmRouterState;
  canEdit: boolean;
  clearing: boolean;
  onClearCooldown: (input: { scopeKey?: string; platform?: string; clearAll?: boolean }) => void;
}

export default function RouterTelemetryTab({
  state,
  canEdit,
  clearing,
  onClearCooldown,
}: RouterTelemetryTabProps) {
  const sortedProviders = [...state.providers].sort(
    (a, b) => b.telemetry.calls_24h - a.telemetry.calls_24h,
  );
  const breaker = state.spend_breaker;

  return (
    <div className="space-y-6">
      {breaker && (
        <section
          data-testid="router-spend-breaker"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Daily Spend Circuit Breaker ({breaker.spend_date})
              </h3>
              <Badge
                variant={breaker.breaker_tripped ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {breaker.breaker_tripped ? 'TRIPPED' : 'ARMED'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {breaker.call_count.toLocaleString()} billed calls ·{' '}
              {breaker.total_tokens_in.toLocaleString()} input /{' '}
              {breaker.total_tokens_out.toLocaleString()} output tokens
            </p>
          </div>
          <div className="text-end">
            <div className="font-mono text-sm font-semibold text-foreground">
              ${breaker.total_spend_usd.toFixed(4)} / ${breaker.daily_limit_usd.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Daily hard-spend cap</div>
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Provider 24h Health &amp; Quota Rollup
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table data-testid="router-provider-rollup-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">24h Calls</TableHead>
                <TableHead className="text-xs">Success %</TableHead>
                <TableHead className="text-xs">Timeouts</TableHead>
                <TableHead className="text-xs">Avg Latency</TableHead>
                <TableHead className="text-xs">Avg TTFB</TableHead>
                <TableHead className="text-xs">24h Tokens</TableHead>
                <TableHead className="text-xs">Total Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProviders.map((p) => (
                <TableRow key={p.key}>
                  <TableCell className="font-mono text-xs">{p.key}</TableCell>
                  <TableCell>
                    <Badge variant={p.enabled ? 'secondary' : 'outline'} className="text-xs">
                      {p.enabled ? 'Active' : 'Standby'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{p.telemetry.calls_24h.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">
                    {p.telemetry.success_rate_24h !== null
                      ? `${p.telemetry.success_rate_24h}%`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs">{p.telemetry.timeouts_24h}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.telemetry.avg_latency_ms !== null
                      ? `${Math.round(p.telemetry.avg_latency_ms)}ms`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.telemetry.avg_ttfb_ms !== null
                      ? `${Math.round(p.telemetry.avg_ttfb_ms)}ms`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.telemetry.tokens_24h.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.telemetry.total_tokens.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Active Cooldowns ({state.cooldowns.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Live cooldowns across SQLite WAL and persistent JSON cooldown registry.
            </p>
          </div>
          {canEdit && state.cooldowns.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={clearing}
              onClick={() => onClearCooldown({ clearAll: true })}
              data-testid="router-clear-all-cooldowns"
            >
              <Trash2 className="size-3.5" />
              Clear All Cooldowns
            </Button>
          )}
        </div>

        {state.cooldowns.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No active model or key cooldowns.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Model</TableHead>
                  <TableHead className="text-xs">Key #</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Remaining</TableHead>
                  {canEdit && <TableHead className="text-end text-xs">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.cooldowns.map((cd) => (
                  <TableRow key={`${cd.source}:${cd.scope_key}`}>
                    <TableCell className="font-mono text-xs">{cd.platform}</TableCell>
                    <TableCell className="font-mono text-xs">{cd.model_id}</TableCell>
                    <TableCell className="text-xs">{cd.key_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {cd.source} · {cd.provenance}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{cd.remaining_seconds}s</TableCell>
                    {canEdit && (
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={clearing}
                          onClick={() => onClearCooldown({ scopeKey: cd.scope_key })}
                        >
                          Clear
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Recent Routing Attempts ({state.telemetry_summary.recent_attempts.length})
        </h3>
        {state.telemetry_summary.recent_attempts.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No routing telemetry recorded yet in RouterStateWAL.
          </p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Model</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Latency</TableHead>
                  <TableHead className="text-xs">TTFB</TableHead>
                  <TableHead className="text-xs">Out Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.telemetry_summary.recent_attempts.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-mono text-xs">{att.platform}</TableCell>
                    <TableCell className="font-mono text-xs">{att.model_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={att.ok ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {att.ok ? 'OK' : att.timed_out ? 'TIMEOUT' : 'FAIL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {att.latency_ms !== null ? `${att.latency_ms}ms` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {att.ttfb_ms !== null ? `${att.ttfb_ms}ms` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {att.out_tokens}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
