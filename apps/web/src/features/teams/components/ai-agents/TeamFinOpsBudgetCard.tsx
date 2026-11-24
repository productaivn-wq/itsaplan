'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, ShieldAlert } from 'lucide-react';
import { getTeamBudgetPolicy, updateTeamBudgetPolicy } from '@/lib/api/endpoints/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function TeamFinOpsBudgetCard({
  teamId,
  canManage,
}: {
  teamId: number;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['team-budget-policy', teamId],
    queryFn: () => getTeamBudgetPolicy(teamId),
  });

  const [usdCapDollars, setUsdCapDollars] = useState('0');
  const [tokenCap, setTokenCap] = useState('0');
  const [hardStopEnabled, setHardStopEnabled] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    setUsdCapDollars((query.data.monthlyUsdCeilingMicros / 1_000_000).toFixed(2));
    setTokenCap(String(query.data.monthlyTokenBudget));
    setHardStopEnabled(query.data.hardStopEnabled);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTeamBudgetPolicy(teamId, {
        monthlyUsdCeilingMicros: Math.max(0, Math.round(Number(usdCapDollars || 0) * 1_000_000)),
        monthlyTokenBudget: Math.max(0, Math.round(Number(tokenCap || 0))),
        softAlertPct: 80,
        hardStopEnabled,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['team-budget-policy', teamId] });
    },
  });

  const usage = query.data?.usage;
  const spentUsd = ((usage?.spentMicros ?? 0) / 1_000_000).toFixed(4);
  const pct = Math.min(100, usage?.utilizationPct ?? 0);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  return (
    <section
      data-testid="team-finops-budget-card"
      className="mb-6 space-y-3 rounded-2xl border border-border/85 bg-card p-4 shadow-[var(--studio-card-shadow)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <DollarSign className="size-4 text-primary" />
          <span>Monthly AI Usage &amp; FinOps Budget</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Spent: <strong className="font-mono text-foreground">${spentUsd}</strong>
          </span>
          <span>
            Tokens: <strong className="font-mono text-foreground">{usage?.spentTokens ?? 0}</strong>
          </span>
          {usage?.softAlertTriggered && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-300">
              <ShieldAlert className="size-3" /> {pct}% used
            </span>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <div className="space-y-1">
          <label htmlFor="finops-usd-cap" className="text-xs font-medium text-muted-foreground">
            Monthly USD Cap ($ · 0 = unlimited)
          </label>
          <Input
            id="finops-usd-cap"
            type="number"
            min="0"
            step="0.01"
            value={usdCapDollars}
            onChange={(e) => setUsdCapDollars(e.target.value)}
            disabled={!canManage}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="finops-tok-cap" className="text-xs font-medium text-muted-foreground">
            Monthly Token Cap (0 = unlimited)
          </label>
          <Input
            id="finops-tok-cap"
            type="number"
            min="0"
            step="1000"
            value={tokenCap}
            onChange={(e) => setTokenCap(e.target.value)}
            disabled={!canManage}
          />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
          <span className="text-xs font-medium text-foreground">Hard-Stop Breaker</span>
          <Switch
            checked={hardStopEnabled}
            onCheckedChange={setHardStopEnabled}
            disabled={!canManage}
            aria-label="Enable monthly budget hard stop"
          />
        </div>
        {canManage && (
          <Button type="submit" size="sm" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Budget Policy'}
          </Button>
        )}
      </form>
    </section>
  );
}
