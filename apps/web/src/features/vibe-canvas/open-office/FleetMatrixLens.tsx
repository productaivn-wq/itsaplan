'use client';

import * as React from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, Cpu, PlayCircle, Send, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeStation,
  OpenOfficeWorkItemLink,
  OpenOfficeZone,
} from '../types';
import {
  buildDynamicRoomSpecs,
  computeAgentTokenUtilization,
  isStationActivelyWorking,
  OPEN_OFFICE_DICTIONARY,
  resolveCanonicalZoneId,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface FleetMatrixLensProps {
  zones?: OpenOfficeZone[];
  departments?: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  contracts: OpenOfficeContract[];
  needsMyAction: OpenOfficeContract[];
  selectedStationId: string | null;
  locale?: OpenOfficeLocale;
  onSelectStation: (seatId: string) => void;
  onQuickAssign: (agentId?: string) => void;
  onOpenQuickReview: (contractId?: string) => void;
  onOpenWorkItem: (item?: OpenOfficeWorkItemLink | null) => void;
}

export default function FleetMatrixLens({
  zones,
  departments,
  stations,
  contracts,
  needsMyAction,
  selectedStationId,
  locale = 'vi',
  onSelectStation,
  onQuickAssign,
  onOpenQuickReview,
  onOpenWorkItem,
}: FleetMatrixLensProps) {
  const dict = OPEN_OFFICE_DICTIONARY[locale];
  const specByCanonical = React.useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildDynamicRoomSpecs>[number]>();
    for (const sp of buildDynamicRoomSpecs(zones, departments)) {
      map.set(sp.canonicalId, sp);
    }
    return map;
  }, [zones, departments]);

  const lanes = React.useMemo(() => {
    const hitlAgentIds = new Set(
      needsMyAction.flatMap((c) => [c.lead_agent_id, ...(c.support_agent_ids || [])]),
    );
    const awaitingHitl: OpenOfficeStation[] = [];
    const activeWorking: OpenOfficeStation[] = [];
    const standbyIdle: OpenOfficeStation[] = [];

    for (const st of stations) {
      if (
        st.status === 'AWAITING_HITL' ||
        (st.agent_id && hitlAgentIds.has(st.agent_id))
      ) {
        awaitingHitl.push(st);
      } else if (isStationActivelyWorking(st)) {
        activeWorking.push(st);
      } else {
        standbyIdle.push(st);
      }
    }
    return [
      {
        id: 'hitl',
        title: dict.fleetHitlLane,
        icon: ShieldCheck,
        items: awaitingHitl,
      },
      {
        id: 'working',
        title: dict.fleetWorkingLane,
        icon: PlayCircle,
        items: activeWorking,
      },
      {
        id: 'idle',
        title: dict.fleetIdleLane,
        icon: CheckCircle2,
        items: standbyIdle,
      },
    ];
  }, [stations, needsMyAction, dict]);

  return (
    <div
      data-testid="open-office-fleet-matrix"
      className="w-full min-w-0 space-y-3"
    >
      {lanes.map((lane) => {
        if (lane.items.length === 0) return null;
        const LaneIcon = lane.icon;
        return (
          <section
            key={lane.id}
            data-testid={`fleet-lane-${lane.id}`}
            className="rounded-xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <LaneIcon className="size-3.5 text-primary" />
                <span>{lane.title}</span>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
                {lane.items.length}
              </span>
            </div>

            <div className="divide-y divide-border/70">
              {lane.items.map((st) => {
                const isSelected = selectedStationId === st.seat_id;
                const canonicalRoom = resolveCanonicalZoneId(st.zone_id, zones);
                const roomSpec = specByCanonical.get(canonicalRoom);
                const tokenStats = computeAgentTokenUtilization(st, contracts);
                const stepIdx = st.live_telemetry?.step_index ?? (isStationActivelyWorking(st) ? 3 : 0);
                const stepPct = Math.min(100, stepIdx > 0 ? Math.min(95, stepIdx * 12) : 0);
                const pendingContract = needsMyAction.find(
                  (c) =>
                    c.lead_agent_id === st.agent_id ||
                    (st.agent_id ? c.support_agent_ids?.includes(st.agent_id) : false),
                );

                return (
                  <div
                    key={st.seat_id}
                    data-testid={`fleet-row-${st.seat_id}`}
                    onClick={() => onSelectStation(st.seat_id)}
                    className={`grid cursor-pointer grid-cols-1 items-center gap-3 px-3.5 py-2.5 transition-colors lg:grid-cols-[minmax(190px,1.2fr)_minmax(180px,1.4fr)_minmax(160px,1fr)_auto] ${
                      isSelected ? 'bg-primary/8' : 'hover:bg-muted/25'
                    }`}
                  >
                    {/* Col 1: Agent Identity + Room */}
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                        <PixelAgentAvatar
                          seed={st.agent_name}
                          status={st.status}
                          size={24}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {st.agent_name}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {st.username || `@${st.seat_id}`}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <span>
                            {(locale === 'en' ? roomSpec?.enTitle : roomSpec?.viTitle) ||
                              st.zone_name ||
                              canonicalRoom}
                          </span>
                          {(st.active_project_keys || []).map((pk) => (
                            <Badge
                              key={`${st.seat_id}-fleet-${pk}`}
                              variant="secondary"
                              className="px-1 py-0 font-mono text-xs"
                            >
                              [{pk}]
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Active Issue / Live Telemetry */}
                    <div className="min-w-0 space-y-1">
                      {st.doing_now?.active_item ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWorkItem(st.doing_now?.active_item);
                          }}
                          className="inline-flex max-w-full items-center gap-1 text-left text-xs font-medium text-foreground hover:text-primary"
                        >
                          <span className="font-mono text-xs font-semibold text-primary">
                            {st.doing_now.active_item.identifier}
                          </span>
                          <span className="line-clamp-1">{st.doing_now.active_item.title}</span>
                          <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                        </button>
                      ) : (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {st.live_telemetry?.action_label ||
                            st.doing_now?.summary ||
                            st.activity_bubble ||
                            st.role}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {stepIdx > 0 ? `Step #${stepIdx}` : st.status}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            style={{ width: `${stepPct}%` }}
                            className="h-full rounded-full bg-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Token Circuit-Breaker Budget Bar */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2 font-mono text-xs tabular-nums text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Cpu className="size-3" />
                          Tokens
                        </span>
                        <span className="text-foreground">
                          {tokenStats.usedTokens.toLocaleString()} /{' '}
                          {tokenStats.budgetTokens.toLocaleString()} ({tokenStats.pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          style={{ width: `${tokenStats.pct}%` }}
                          className={`h-full rounded-full transition-all ${
                            tokenStats.pct >= 90 ? 'bg-destructive' : 'bg-foreground/75'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Col 4: 1-Click Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {pendingContract && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickReview(pendingContract.id);
                          }}
                          className="h-7 gap-1 px-2.5 text-xs"
                        >
                          <Clock3 className="size-3" />
                          <span>{locale === 'en' ? 'Review' : 'Duyệt'}</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(st.seat_id);
                          onQuickAssign(st.agent_id || undefined);
                        }}
                        className="h-7 gap-1 px-2.5 text-xs"
                      >
                        <Send className="size-3" />
                        <span>{locale === 'en' ? 'Assign' : 'Giao việc'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
