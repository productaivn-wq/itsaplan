'use client';

import * as React from 'react';
import { Building2, CheckCircle2, Clock3, Sparkles, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeMascot,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';
import {
  computeAgentWorkloadAndStage,
  computeCollisionFreeRoomPct,
  isStationActivelyWorking,
  normalizeZonesWithArchitecturalSpecs,
  OPEN_OFFICE_DICTIONARY,
  resolveCanonicalZoneId,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface ArchitecturalBlueprintLensProps {
  zones: OpenOfficeZone[];
  departments?: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  mascots: OpenOfficeMascot[];
  contracts: OpenOfficeContract[];
  selectedStationId: string | null;
  selectedZoneId: string | null;
  selectedProjectFilter: string;
  showPets: boolean;
  spotlightZone: boolean;
  locale?: OpenOfficeLocale;
  onSelectStation: (seatId: string) => void;
  onSelectZone: (canonicalZoneId: string) => void;
}

export default function ArchitecturalBlueprintLens({
  zones,
  departments,
  stations,
  mascots,
  contracts,
  selectedStationId,
  selectedZoneId,
  selectedProjectFilter,
  showPets,
  spotlightZone,
  locale = 'vi',
  onSelectStation,
  onSelectZone,
}: ArchitecturalBlueprintLensProps) {
  const dict = OPEN_OFFICE_DICTIONARY[locale];
  const orderedRooms = React.useMemo(
    () => normalizeZonesWithArchitecturalSpecs(zones, departments),
    [zones, departments],
  );
  const spineCanonicalId = React.useMemo(
    () => orderedRooms.find((r) => r.spec.isSpine)?.canonicalId || orderedRooms[0]?.canonicalId || 'sop_generic_7p',
    [orderedRooms],
  );
  const activeCanonicalZone = selectedZoneId ? resolveCanonicalZoneId(selectedZoneId, zones) : null;

  const stationsByRoom = React.useMemo(() => {
    const grouped: Record<string, OpenOfficeStation[]> = {};
    for (const r of orderedRooms) {
      grouped[r.canonicalId] = [];
    }
    for (const st of stations) {
      const cid = resolveCanonicalZoneId(st.zone_id, zones);
      if (!grouped[cid]) grouped[cid] = [];
      grouped[cid].push(st);
    }
    return grouped;
  }, [orderedRooms, stations, zones]);

  const contractByAgentId = React.useMemo(() => {
    const map = new Map<string, OpenOfficeContract>();
    for (const c of contracts) {
      if (c.status === 'DONE') continue;
      if (c.lead_agent_id && !map.has(c.lead_agent_id)) {
        map.set(c.lead_agent_id, c);
      }
      for (const sup of c.support_agent_ids || []) {
        if (!map.has(sup)) map.set(sup, c);
      }
    }
    return map;
  }, [contracts]);

  return (
    <div className="w-full min-w-0 space-y-2.5">
      <div
        data-testid="pixel-office-canvas"
        className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-12"
      >
        {orderedRooms.map((room) => {
          const roomStations = stationsByRoom[room.canonicalId] || [];
          const workingCount = roomStations.filter(isStationActivelyWorking).length;
          const hitlCount = roomStations.filter((s) => s.status === 'AWAITING_HITL').length;
          const isSelectedRoom = activeCanonicalZone === room.canonicalId;
          const isDimmed = spotlightZone && Boolean(activeCanonicalZone) && !isSelectedRoom;
          const roomTitle = locale === 'en' ? room.spec.enTitle : room.name || room.spec.viTitle;
          const roomSubtitle =
            locale === 'en' ? room.spec.enSubtitle : room.subtitle || room.spec.viSubtitle;

          return (
            <section
              key={room.id}
              data-testid={`zone-${room.id}`}
              aria-label={roomTitle}
              onClick={() => onSelectZone(room.canonicalId)}
              className={`${room.spec.colSpanClass} flex min-h-[164px] min-w-0 cursor-pointer flex-col gap-3 rounded-2xl border p-3 transition-colors ${
                isSelectedRoom
                  ? 'border-primary bg-card ring-1 ring-primary/40'
                  : isDimmed
                    ? 'border-border/50 bg-muted/15 opacity-55'
                    : 'border-border bg-card hover:border-foreground/25 hover:bg-muted/15'
              }`}
            >
              {/* Crisp Unscaled Architectural Room Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      data-testid={`room-plaque-${room.canonicalId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectZone(room.canonicalId);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-left text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>{roomTitle}</span>
                    </button>
                    <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {room.spec.ucCode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{roomSubtitle}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums">
                  {hitlCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 font-semibold text-foreground">
                      <Clock3 className="size-3" />
                      {hitlCount} HITL
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
                      workingCount > 0
                        ? 'bg-primary/12 font-semibold text-foreground'
                        : 'bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        workingCount > 0 ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'
                      }`}
                    />
                    {roomStations.length} AI
                  </span>
                </div>
              </div>

              {/* Collision-Free Auto-Reflowing Station Cluster */}
              <div className="mt-2.5 flex-1">
                {roomStations.length === 0 ? (
                  <div className="flex h-full min-h-[76px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                    {locale === 'en' ? 'Room available for dispatch' : 'Phòng trống · Sẵn sàng điều phối'}
                  </div>
                ) : (
                  <div
                    className={`grid gap-2 ${
                      roomStations.length >= 2
                        ? 'grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(185px,100%),1fr))]'
                        : 'grid-cols-1'
                    }`}
                  >
                    {roomStations.map((station, idxInRoom) => {
                      const isSelected = selectedStationId === station.seat_id;
                      const isWorking = isStationActivelyWorking(station);
                      const isHitl = station.status === 'AWAITING_HITL';
                      const workload = computeAgentWorkloadAndStage(station, contracts, locale, zones);
                      const slotPct = computeCollisionFreeRoomPct(
                        room.canonicalId,
                        idxInRoom,
                        roomStations.length,
                        room.spec,
                      );
                      const activeContract = station.agent_id
                        ? contractByAgentId.get(station.agent_id)
                        : undefined;
                      const projectBadges =
                        selectedProjectFilter && selectedProjectFilter !== 'ALL'
                          ? [selectedProjectFilter]
                          : (station.active_project_keys || []).slice(0, 3);
                      const activityLine =
                        station.live_telemetry?.action_label ||
                        station.doing_now?.summary ||
                        station.activity_bubble ||
                        station.role;

                      return (
                        <div
                          key={station.seat_id}
                          role="button"
                          tabIndex={0}
                          data-testid={`station-${station.seat_id}`}
                          data-grid-slot={`${room.canonicalId}-${slotPct.x}-${slotPct.y}`}
                          aria-label={`${station.agent_name} (${roomTitle})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStation(station.seat_id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onSelectStation(station.seat_id);
                            }
                          }}
                          className={`group flex min-w-0 flex-col gap-3 gap-1.5 rounded-xl border p-2 text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                              : isWorking
                                ? 'border-foreground/20 bg-muted/25 hover:border-primary/50'
                                : 'border-border/80 bg-background/80 hover:border-foreground/25 hover:bg-muted/20'
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                              <PixelAgentAvatar
                                seed={station.agent_name}
                                status={station.status}
                                size={24}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${
                                    isWorking
                                      ? 'bg-primary animate-pulse'
                                      : isHitl
                                        ? 'bg-foreground'
                                        : 'bg-muted-foreground/50'
                                  }`}
                                />
                                <span className="text-xs font-semibold text-foreground break-words">
                                  {station.agent_name}
                                </span>
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                    workload.stage === 'review'
                                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                      : workload.stage === 'working'
                                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {workload.stageLabel}
                                </span>
                                {workload.isOverloaded && (
                                  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-700 dark:text-red-300">
                                    {dict.overloadTag} {workload.activeCount}
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-xs text-muted-foreground">
                                <span>{station.username || `@${station.seat_id}`}</span>
                                {projectBadges.map((pk) => (
                                  <Badge
                                    key={`${station.seat_id}-${pk}`}
                                    variant="secondary"
                                    data-testid={`badge-agent-project-${pk}`}
                                    className="px-1 py-0 font-mono text-xs"
                                  >
                                    [{pk}]
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border/50 pt-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex min-w-0 items-center gap-1 break-words">
                              {isWorking ? (
                                <Terminal className="size-3 shrink-0 text-primary" />
                              ) : (
                                <CheckCircle2 className="size-3 shrink-0 text-muted-foreground" />
                              )}
                              <span className="line-clamp-1">{activityLine}</span>
                            </span>
                            {activeContract && (
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                                {activeContract.id}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Calm Zero-rAF Lounge Companions inside Central Atrium */}
              {showPets && (room.spec.isSpine || room.canonicalId === spineCanonicalId) && mascots.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    <Sparkles className="size-3 text-muted-foreground" />
                    {dict.loungeCompanions}:
                  </span>
                  {mascots.map((mascot) => (
                    <span
                      key={mascot.id}
                      data-testid={`mascot-${mascot.id}`}
                      title={mascot.bubble}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/25 px-2 py-0.5 text-xs text-foreground"
                    >
                      <span className="size-1.5 rounded-full bg-muted-foreground" />
                      <span className="font-medium">{mascot.name}</span>
                      {mascot.bubble && (
                        <span className="text-muted-foreground">· {mascot.bubble}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Hidden canonical zone alias hook when room.id !== room.canonicalId */}
              {room.canonicalId !== room.id && (
                <span data-testid={`zone-${room.canonicalId}`} className="hidden" />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
