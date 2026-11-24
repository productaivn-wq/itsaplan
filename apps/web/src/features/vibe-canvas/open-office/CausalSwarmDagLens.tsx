'use client';

import * as React from 'react';
import { ArrowRight, FileCheck2, GitBranch, RotateCcw, ShieldAlert, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OpenOfficeContract, OpenOfficeStation } from '../types';
import {
  OPEN_OFFICE_DICTIONARY,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface CausalSwarmDagLensProps {
  contracts: OpenOfficeContract[];
  stations: OpenOfficeStation[];
  selectedProjectFilter: string;
  selectedContractId: string | null;
  locale?: OpenOfficeLocale;
  onSelectStation: (seatId: string) => void;
  onSelectContract: (contractId: string) => void;
  onOpenQuickReview: (contractId: string) => void;
}

export default function CausalSwarmDagLens({
  contracts,
  stations,
  selectedProjectFilter,
  selectedContractId,
  locale = 'vi',
  onSelectStation,
  onSelectContract,
  onOpenQuickReview,
}: CausalSwarmDagLensProps) {
  const dict = OPEN_OFFICE_DICTIONARY[locale];

  const stationByAgentId = React.useMemo(() => {
    const map = new Map<string, OpenOfficeStation>();
    for (const s of stations) {
      if (s.agent_id) map.set(s.agent_id, s);
    }
    return map;
  }, [stations]);

  const filteredContracts = React.useMemo(() => {
    const seen = new Set<string>();
    const out: OpenOfficeContract[] = [];
    for (const c of contracts) {
      if (seen.has(c.id)) continue;
      if (
        selectedProjectFilter &&
        selectedProjectFilter !== 'ALL' &&
        c.project_key &&
        c.project_key !== selectedProjectFilter
      ) {
        continue;
      }
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }, [contracts, selectedProjectFilter]);

  return (
    <div
      data-testid="open-office-causal-dag"
      className="w-full min-w-0 space-y-3 rounded-xl border border-border bg-card p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <GitBranch className="size-3.5 text-primary" />
            <span>{dict.dagHeading}</span>
          </div>
          <p className="text-xs text-muted-foreground">{dict.dagSubheading}</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
          {filteredContracts.length} {locale === 'en' ? 'contracts' : 'hợp đồng'}
        </span>
      </div>

      {filteredContracts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-8 text-center text-xs text-muted-foreground">
          {dict.dagNoActiveContracts}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredContracts.map((contract) => {
            const leadStation = stationByAgentId.get(contract.lead_agent_id);
            const supportIds = contract.support_agent_ids || [];
            const isSelected = selectedContractId === contract.id;
            const isHitl = contract.status === 'AWAITING_HITL';

            return (
              <div
                key={contract.id}
                data-testid={`dag-contract-node-${contract.id}`}
                onClick={() => onSelectContract(contract.id)}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/6'
                    : 'border-border bg-background/80 hover:border-foreground/25'
                }`}
              >
                {/* Causal Chain Row: [Project] -> [Contract] -> [Lead Agent] -> [Support Agents] */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-mono text-xs">
                      [{contract.project_key || 'PM'}]
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {contract.id}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {contract.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(contract.current_run_number ?? 1) > 1 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs text-foreground">
                        <RotateCcw className="size-3" />
                        Run #{contract.current_run_number}
                      </span>
                    )}
                    <Badge
                      variant={isHitl ? 'default' : 'outline'}
                      className="font-mono text-xs"
                    >
                      {contract.status}
                    </Badge>
                    {isHitl && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuickReview(contract.id);
                        }}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <ShieldAlert className="size-3" />
                        <span>{locale === 'en' ? 'Gate Review' : 'Duyệt cổng'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Topological Lead -> Support Flow */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/25 p-2.5 text-xs">
                  <button
                    type="button"
                    data-testid={`dag-lead-${contract.id}-${contract.lead_agent_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (leadStation) onSelectStation(leadStation.seat_id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-background px-2.5 py-1 font-medium text-foreground hover:border-primary"
                  >
                    <FileCheck2 className="size-3.5 text-primary" />
                    <span>{leadStation?.agent_name || contract.lead_agent_name || contract.lead_agent_id}</span>
                    <span className="font-mono text-xs text-muted-foreground">(Lead)</span>
                  </button>

                  {supportIds.length > 0 ? (
                    <>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex flex-wrap items-center gap-1.5">
                        {supportIds.map((supId) => {
                          const supStation = stationByAgentId.get(supId);
                          return (
                            <button
                              key={`${contract.id}-${supId}`}
                              type="button"
                              data-testid={`dag-edge-${contract.id}-${supId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (supStation) onSelectStation(supStation.seat_id);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground hover:border-foreground/40"
                            >
                              <Users className="size-3 text-muted-foreground" />
                              <span>{supStation?.agent_name || supId}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                (Support)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      · {locale === 'en' ? 'Single-agent autonomous execution' : 'Thực thi đơn tuyến độc lập'}
                    </span>
                  )}

                  <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                    SLA {contract.estimated_minutes}m · {contract.confidence_pct}% conf
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
