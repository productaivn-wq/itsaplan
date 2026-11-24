'use client';

import * as React from 'react';
import {
  ArrowRight,
  Bot,
  Crown,
  GitBranch,
  Hexagon,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AgentTree,
  type AgentTreeStatus,
  type TreeAgent,
} from '@/components/ui/agent-tree';
import type {
  OpenOfficeColonyBee,
  OpenOfficeDepartmentDossier,
  OpenOfficeContract,
  OpenOfficeLiveActivityItem,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';
import {
  LIMEZU_STAGE_H,
  LIMEZU_STAGE_W,
  getLimeZuAtlasImage,
  subscribeLimeZuAtlas,
} from './limezuAtlasEngine';
import {
  ARCHITECTURAL_ROOM_SPECS,
  computeDynamicBeehiveLayout,
  computeAgentTokenUtilization,
  computeAgentWorkloadAndStage,
  computeBeeSlotInHexCell,
  isStationActivelyWorking,
  normalizeZonesWithArchitecturalSpecs,
  OPEN_OFFICE_DICTIONARY,
  resolveCanonicalZoneId,
  type OpenOfficeLocale,
} from './openOfficeConstants';
import {
  type PixelBeeRole,
  buildPixelBeeRects,
  paintPixelBeehiveStage,
} from './pixelBeehiveEngine';

export interface BeehiveColonyLensProps {
  zones: OpenOfficeZone[];
  departments?: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  colonyBees?: OpenOfficeColonyBee[];
  liveActivityFeed?: OpenOfficeLiveActivityItem[];
  contracts: OpenOfficeContract[];
  needsMyAction: OpenOfficeContract[];
  selectedStationId: string | null;
  selectedZoneId: string | null;
  selectedProjectFilter: string;
  isMotionActive?: boolean;
  locale?: OpenOfficeLocale;
  onSelectStation: (seatId: string) => void;
  onSelectZone: (canonicalZoneId: string) => void;
  onOpenQuickReview: (contractId: string) => void;
  onQuickAssign: (agentId?: string) => void;
}

type BeeTier = 'queen' | 'agent' | 'subagent';

interface PositionedBee {
  beeId: string;
  seatId: string;
  agentId: string;
  parentBeeId: string | null;
  tier: BeeTier;
  station: OpenOfficeStation | null;
  colonyBee: OpenOfficeColonyBee | null;
  canonicalRoomId: string;
  x: number;
  y: number;
  roleKind: PixelBeeRole;
  isSelected: boolean;
  displayName: string;
  handleLabel: string;
  roleLabel: string;
  activityText: string;
  workloadPct: number;
  isActiveNow: boolean;
  isGuard: boolean;
  isStandby: boolean;
  roomPopulation: number;
}

interface VerifiedForagingFlight {
  id: string;
  contractId: string;
  contractTitle: string;
  projectKey: string;
  fromBee: PositionedBee;
  toBee: PositionedBee;
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  pathD: string;
  isHitl: boolean;
}

interface SubagentSpawnTether {
  id: string;
  subBee: PositionedBee;
  parentBee: PositionedBee;
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  pathD: string;
}

function truncateLabel(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function isUnitTestEnvironment(): boolean {
  if (typeof navigator === 'undefined') return true;
  return /jsdom|HappyDOM/i.test(navigator.userAgent || '');
}

function isStatusActivelyRunning(rawStatus?: string | null): boolean {
  const s = String(rawStatus || '').toUpperCase();
  return s === 'WORKING' || s === 'ACTIVE' || s === 'RUNNING' || s === 'BUSY' || s === 'IN_PROGRESS';
}

function mapStatusToTreeStatus(
  rawStatus?: string | null,
  hasHitl?: boolean,
): AgentTreeStatus {
  const s = String(rawStatus || '').toUpperCase();
  if (s === 'AWAITING_HITL' || hasHitl) return 'waiting';
  if (isStatusActivelyRunning(s)) return 'running';
  if (s === 'FAILED') return 'failed';
  if (s === 'DONE' || s === 'COMPLETED') return 'done';
  if (s === 'STOPPED') return 'stopped';
  return 'queued';
}

export default function BeehiveColonyLens({
  zones,
  departments,
  stations,
  colonyBees,
  liveActivityFeed,
  contracts,
  needsMyAction,
  selectedStationId,
  selectedZoneId,
  selectedProjectFilter,
  isMotionActive = true,
  locale = 'vi',
  onSelectStation,
  onSelectZone,
  onOpenQuickReview,
  onQuickAssign,
}: BeehiveColonyLensProps) {
  const dict = OPEN_OFFICE_DICTIONARY[locale];
  const [subView, setSubView] = React.useState<'comb' | 'tree'>('comb');
  const [hoveredBeeId, setHoveredBeeId] = React.useState<string | null>(null);
  const [selectedBeeId, setSelectedBeeId] = React.useState<string | null>(null);
  const [atlasReady, setAtlasReady] = React.useState<boolean>(
    () => getLimeZuAtlasImage() !== null,
  );
  const [animTick, setAnimTick] = React.useState<number>(0);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    return subscribeLimeZuAtlas(() => {
      setAtlasReady(true);
    });
  }, []);

  React.useEffect(() => {
    if (!isMotionActive || subView !== 'comb' || isUnitTestEnvironment()) {
      return;
    }
    const timer = window.setInterval(() => {
      setAnimTick((prev) => (prev + 1) % 3600);
    }, 120);
    return () => window.clearInterval(timer);
  }, [isMotionActive, subView]);

  const orderedRooms = React.useMemo(
    () => normalizeZonesWithArchitecturalSpecs(zones, departments),
    [zones, departments],
  );
  const cellLayout = React.useMemo(
    () =>
      computeDynamicBeehiveLayout(
        orderedRooms.map((r) => ({
          canonicalId: r.canonicalId,
          isSpine: r.spec.isSpine,
          hexCell: r.hex_cell || r.spec.hexCell,
        })),
      ),
    [orderedRooms],
  );
  const queenRoomId = React.useMemo(
    () =>
      orderedRooms.find((r) => r.spec.isSpine)?.canonicalId ||
      orderedRooms[0]?.canonicalId ||
      'sop_generic_7p',
    [orderedRooms],
  );
  const activeCanonicalZone = selectedZoneId
    ? resolveCanonicalZoneId(selectedZoneId, zones)
    : null;

  const hitlAgentIds = React.useMemo(
    () =>
      new Set(
        needsMyAction.flatMap((c) => [
          c.lead_agent_id,
          ...(c.support_agent_ids || []),
        ]),
      ),
    [needsMyAction],
  );

  const filteredContracts = React.useMemo(() => {
    const seen = new Set<string>();
    const out: OpenOfficeContract[] = [];
    for (const c of contracts) {
      if (seen.has(c.id)) continue;
      if (c.status === 'DONE') continue;
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

  const filteredHitlContracts = React.useMemo(() => {
    const seen = new Set<string>();
    const out: OpenOfficeContract[] = [];
    for (const c of needsMyAction) {
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
  }, [needsMyAction, selectedProjectFilter]);

  const queenSeatId = React.useMemo(() => {
    const queenSt =
      stations.find(
        (s) =>
          resolveCanonicalZoneId(s.zone_id, zones) === queenRoomId ||
          s.agent_id === 'agt-orchestrator' ||
          s.role.toLowerCase().includes('orchestrator'),
      ) || stations[0];
    return queenSt?.seat_id || 'seat-orchestrator';
  }, [stations, zones, queenRoomId]);

  interface RawColonyItem {
    beeId: string;
    seatId: string;
    agentId: string;
    parentBeeId: string | null;
    tier: BeeTier;
    station: OpenOfficeStation | null;
    colonyBee: OpenOfficeColonyBee | null;
    canonicalRoomId: string;
    roleKind: PixelBeeRole;
    displayName: string;
    handleLabel: string;
    roleLabel: string;
    activityText: string;
    workloadPct: number;
    isActiveNow: boolean;
    isGuard: boolean;
    isStandby: boolean;
  }

  const {
    positionedBees,
    beeByBeeId,
    beeByAgentId,
    workingCountByRoom,
    agentCountByRoom,
    subagentCountByRoom,
  } = React.useMemo(() => {
    const seenBeeIds = new Set<string>();
    const byRoom: Record<string, RawColonyItem[]> = {};
    const workingCounts: Record<string, number> = {};
    const agentCounts: Record<string, number> = {};
    const subCounts: Record<string, number> = {};

    for (const r of orderedRooms) {
      byRoom[r.canonicalId] = [];
      workingCounts[r.canonicalId] = 0;
      agentCounts[r.canonicalId] = 0;
      subCounts[r.canonicalId] = 0;
    }

    const fallbackSeatForRoom = (roomId: string): string => {
      const sameRoom = stations.find((s) => resolveCanonicalZoneId(s.zone_id, zones) === roomId);
      return sameRoom?.seat_id || queenSeatId;
    };

    const pushItem = (item: RawColonyItem) => {
      if (seenBeeIds.has(item.beeId)) return;
      seenBeeIds.add(item.beeId);
      const rid = item.canonicalRoomId;
      if (!byRoom[rid]) byRoom[rid] = [];
      byRoom[rid].push(item);
      if (item.isActiveNow) {
        workingCounts[rid] = (workingCounts[rid] || 0) + 1;
      }
      if (item.tier === 'subagent') {
        subCounts[rid] = (subCounts[rid] || 0) + 1;
      } else {
        agentCounts[rid] = (agentCounts[rid] || 0) + 1;
      }
    };

    // 1. Canonical Stations (Queen & Main Workstation Agents)
    for (const st of stations) {
      const rid = resolveCanonicalZoneId(st.zone_id, zones);
      const isQueen =
        rid === queenRoomId ||
        st.agent_id === 'agt-orchestrator' ||
        st.role.toLowerCase().includes('orchestrator');
      const isGuard =
        st.status === 'AWAITING_HITL' ||
        (st.agent_id ? hitlAgentIds.has(st.agent_id) : false);
      const isWorking = isStationActivelyWorking(st);
      const roleKind: PixelBeeRole = isGuard
        ? 'guard'
        : isQueen
          ? 'queen'
          : isWorking
            ? 'worker_active'
            : 'worker_standby';
      const tokenStats = computeAgentTokenUtilization(st, contracts);
      const activityText =
        st.live_telemetry?.active_tool ||
        st.live_telemetry?.action_label ||
        st.doing_now?.current_step ||
        st.doing_now?.summary ||
        st.activity_bubble ||
        st.role;

      pushItem({
        beeId: st.seat_id,
        seatId: st.seat_id,
        agentId: st.agent_id || st.seat_id,
        parentBeeId: isQueen ? null : queenSeatId,
        tier: isQueen ? 'queen' : 'agent',
        station: st,
        colonyBee: null,
        canonicalRoomId: rid,
        roleKind,
        displayName: st.agent_name,
        handleLabel: st.username?.replace(/^@/, '') || st.agent_name,
        roleLabel: st.role,
        activityText,
        workloadPct: tokenStats.pct,
        isActiveNow: isWorking,
        isGuard,
        isStandby: roleKind === 'worker_standby',
      });

      if (Array.isArray(st.subagents)) {
        for (const sub of st.subagents) {
          if (
            selectedProjectFilter &&
            selectedProjectFilter !== 'ALL' &&
            sub.project_key &&
            sub.project_key !== selectedProjectFilter
          ) {
            continue;
          }
          const subRid = resolveCanonicalZoneId(sub.zone_id || rid, zones);
          const subActive = isStatusActivelyRunning(sub.status);
          pushItem({
            beeId: sub.bee_id,
            seatId: sub.seat_id || st.seat_id,
            agentId: sub.agent_id || sub.bee_id,
            parentBeeId: sub.parent_bee_id || st.seat_id,
            tier: 'subagent',
            station: null,
            colonyBee: sub,
            canonicalRoomId: subRid,
            roleKind: subActive ? 'subagent_active' : 'subagent_standby',
            displayName: sub.display_name || sub.username,
            handleLabel: sub.username,
            roleLabel: sub.role,
            activityText: sub.action_label || sub.active_tool || sub.role,
            workloadPct: 0,
            isActiveNow: subActive,
            isGuard: false,
            isStandby: !subActive,
          });
        }
      }
    }

    // 2. Additional Live Main Agent Sessions & Spawned Subagents from backend snapshot
    if (Array.isArray(colonyBees)) {
      for (const cb of colonyBees) {
        if (seenBeeIds.has(cb.bee_id)) continue;
        if (
          selectedProjectFilter &&
          selectedProjectFilter !== 'ALL' &&
          cb.project_key &&
          cb.project_key !== selectedProjectFilter
        ) {
          continue;
        }
        const rid = resolveCanonicalZoneId(cb.zone_id, zones);
        const isSub = cb.tier === 'subagent';
        const isQueen = !isSub && cb.tier === 'queen';
        const isGuard =
          !isSub &&
          (cb.status === 'AWAITING_HITL' || hitlAgentIds.has(cb.agent_id));
        const activeNow = isStatusActivelyRunning(cb.status);
        const roleKind: PixelBeeRole = isSub
          ? activeNow
            ? 'subagent_active'
            : 'subagent_standby'
          : isGuard
            ? 'guard'
            : isQueen
              ? 'queen'
              : activeNow
                ? 'worker_active'
                : 'worker_standby';

        pushItem({
          beeId: cb.bee_id,
          seatId: cb.seat_id || fallbackSeatForRoom(rid),
          agentId: cb.agent_id || cb.bee_id,
          parentBeeId: cb.parent_bee_id || (isQueen ? null : queenSeatId),
          tier: cb.tier,
          station: null,
          colonyBee: cb,
          canonicalRoomId: rid,
          roleKind,
          displayName: cb.display_name || cb.username || cb.bee_id,
          handleLabel: (cb.username || cb.bee_id).replace(/^@/, ''),
          roleLabel: cb.role,
          activityText: cb.action_label || cb.active_tool || cb.role,
          workloadPct: 0,
          isActiveNow: activeNow,
          isGuard,
          isStandby: !activeNow && !isGuard && !isQueen,
        });
      }
    }

    // Fallback: project liveActivityFeed entries whose seat/session isn't yet visible
    if (Array.isArray(liveActivityFeed) && (!colonyBees || colonyBees.length === 0)) {
      for (const feed of liveActivityFeed) {
        if (!feed.id || seenBeeIds.has(feed.id)) continue;
        if (feed.seat_id && seenBeeIds.has(feed.seat_id)) continue;
        const rid = resolveCanonicalZoneId(feed.zone_id, zones);
        const activeNow = isStatusActivelyRunning(feed.status);
        pushItem({
          beeId: feed.id,
          seatId: feed.seat_id || fallbackSeatForRoom(rid),
          agentId: feed.agent_id || feed.id,
          parentBeeId: queenSeatId,
          tier: 'agent',
          station: null,
          colonyBee: null,
          canonicalRoomId: rid,
          roleKind: activeNow ? 'worker_active' : 'worker_standby',
          displayName: feed.agent_name || feed.agent_id,
          handleLabel: (feed.agent_name || feed.id).replace(/^@/, ''),
          roleLabel: feed.kind || 'Live Agent',
          activityText: feed.summary || feed.active_tool || 'Active task',
          workloadPct: 0,
          isActiveNow: activeNow,
          isGuard: false,
          isStandby: !activeNow,
        });
      }
    }

    // 3. Arrange bees inside each hex cell: Queen -> Main Agents -> Spawned Subagents
    const tierOrder: Record<BeeTier, number> = { queen: 0, agent: 1, subagent: 2 };
    const allBees: PositionedBee[] = [];
    const byBeeId = new Map<string, PositionedBee>();
    const byAgent = new Map<string, PositionedBee>();

    for (const room of orderedRooms) {
      const cell =
        cellLayout[room.canonicalId] || Object.values(cellLayout)[0];
      const roomItems = (byRoom[room.canonicalId] || []).slice().sort(
        (a, b) => tierOrder[a.tier] - tierOrder[b.tier],
      );
      const totalInRoom = roomItems.length;

      roomItems.forEach((item, idxInRoom) => {
        const slot = computeBeeSlotInHexCell(
          { cx: cell.cx, cy: cell.cy },
          cell.radius,
          idxInRoom,
          totalInRoom,
        );
        const isSelected =
          selectedBeeId !== null
            ? selectedBeeId === item.beeId
            : selectedStationId === item.beeId;

        const posBee: PositionedBee = {
          ...item,
          x: slot.x,
          y: slot.y,
          isSelected,
          roomPopulation: totalInRoom,
        };
        allBees.push(posBee);
        byBeeId.set(posBee.beeId, posBee);
        if (posBee.agentId && !byAgent.has(posBee.agentId)) {
          byAgent.set(posBee.agentId, posBee);
        }
      });
    }

    return {
      positionedBees: allBees,
      beeByBeeId: byBeeId,
      beeByAgentId: byAgent,
      workingCountByRoom: workingCounts,
      agentCountByRoom: agentCounts,
      subagentCountByRoom: subCounts,
    };
  }, [
    orderedRooms,
    stations,
    colonyBees,
    liveActivityFeed,
    hitlAgentIds,
    contracts,
    selectedProjectFilter,
    selectedStationId,
    selectedBeeId,
    queenSeatId,
    cellLayout,
    queenRoomId,
    zones,
  ]);

  React.useEffect(() => {
    if (subView !== 'comb' || isUnitTestEnvironment()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    paintPixelBeehiveStage(ctx, {
      selectedCanonicalZone: activeCanonicalZone,
      workingCountByRoom,
      atlas: atlasReady ? getLimeZuAtlasImage() : null,
      cellLayout,
      queenRoomId,
    });
  }, [subView, activeCanonicalZone, workingCountByRoom, atlasReady, cellLayout, queenRoomId]);

  const foragingFlights = React.useMemo<VerifiedForagingFlight[]>(() => {
    const out: VerifiedForagingFlight[] = [];
    for (const c of filteredContracts) {
      const leadBee = beeByAgentId.get(c.lead_agent_id);
      if (!leadBee) continue;
      for (const supId of c.support_agent_ids || []) {
        const supBee = beeByAgentId.get(supId);
        if (!supBee || supBee.beeId === leadBee.beeId) {
          continue;
        }
        const x0 = leadBee.x;
        const y0 = leadBee.y;
        const x2 = supBee.x;
        const y2 = supBee.y;
        const cx = (x0 + x2) / 2;
        const cy = (y0 + y2) / 2 - 30;
        const pathD = `M ${x0} ${y0} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
        out.push({
          id: `${c.id}-${supId}`,
          contractId: c.id,
          contractTitle: c.title,
          projectKey: c.project_key || 'PM',
          fromBee: leadBee,
          toBee: supBee,
          x0,
          y0,
          cx,
          cy,
          x2,
          y2,
          pathD,
          isHitl: c.status === 'AWAITING_HITL',
        });
      }
    }
    return out;
  }, [filteredContracts, beeByAgentId]);

  const subagentLinks = React.useMemo<SubagentSpawnTether[]>(() => {
    const links: SubagentSpawnTether[] = [];
    for (const bee of positionedBees) {
      if (bee.tier !== 'subagent' || !bee.parentBeeId) continue;
      const parentBee = beeByBeeId.get(bee.parentBeeId);
      if (!parentBee) continue;
      if (
        !Number.isFinite(parentBee.x) ||
        !Number.isFinite(parentBee.y) ||
        !Number.isFinite(bee.x) ||
        !Number.isFinite(bee.y)
      ) {
        continue;
      }
      const x0 = parentBee.x;
      const y0 = parentBee.y;
      const x2 = bee.x;
      const y2 = bee.y;
      const cx = (x0 + x2) / 2;
      const cy = (y0 + y2) / 2 - 14;
      const pathD = `M ${x0} ${y0} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
      links.push({
        id: `sub-link-${bee.beeId}`,
        subBee: bee,
        parentBee,
        x0,
        y0,
        cx,
        cy,
        x2,
        y2,
        pathD,
      });
    }
    return links;
  }, [positionedBees, beeByBeeId]);

  const colonyTreeData = React.useMemo<{
    root: TreeAgent;
    beside?: TreeAgent;
  }>(() => {
    const queenBee =
      positionedBees.find((b) => b.tier === 'queen') || positionedBees[0];
    if (!queenBee) {
      return {
        root: {
          id: 'queen-empty',
          name: dict.beehiveQueenLabel,
          task: locale === 'en' ? 'No bees assigned' : 'Chưa có ong trực ban',
          status: 'queued',
          children: [],
        },
      };
    }

    const sodBee = positionedBees.find(
      (b) =>
        b.beeId !== queenBee.beeId &&
        b.tier !== 'subagent' &&
        (b.canonicalRoomId === 'sop_sec_audit_01' ||
          b.roleLabel.toLowerCase().includes('quality') ||
          b.roleLabel.toLowerCase().includes('reviewer') ||
          b.roleLabel.toLowerCase().includes('sod')),
    );

    const toTreeNode = (bee: PositionedBee): TreeAgent => {
      const st = bee.station;
      const tokenStats = st ? computeAgentTokenUtilization(st, contracts) : { usedTokens: 0 };
      const summary = st ? computeAgentWorkloadAndStage(st, contracts, locale, zones) : null;
      const hasHitl =
        bee.isGuard ||
        (bee.agentId ? hitlAgentIds.has(bee.agentId) : false);
      const hitlContract = filteredHitlContracts.find(
        (c) =>
          c.lead_agent_id === bee.agentId ||
          (bee.agentId ? c.support_agent_ids?.includes(bee.agentId) : false),
      );
      const activeToolName = bee.colonyBee?.active_tool || st?.live_telemetry?.active_tool;

      return {
        id: bee.beeId,
        name: bee.displayName,
        model: bee.handleLabel,
        task: summary?.primaryContract
          ? `${summary.primaryContract.id}: ${summary.primaryContract.title}`
          : bee.activityText,
        status: mapStatusToTreeStatus(bee.station?.status || bee.colonyBee?.status, hasHitl),
        ask: hitlContract
          ? `${hitlContract.id} · ${hitlContract.title}`
          : undefined,
        tokens: tokenStats.usedTokens,
        cost: Number(((tokenStats.usedTokens / 1000) * 0.015).toFixed(2)),
        started: bee.isActiveNow ? Date.now() - 35000 : undefined,
        toolCalls: activeToolName
          ? [
              {
                id: `${bee.beeId}-tool`,
                name: activeToolName,
                durationMs: 42,
                status: bee.isActiveNow ? 'running' : 'done',
              },
            ]
          : undefined,
        children: [],
      };
    };

    const nodeByBeeId = new Map<string, TreeAgent>();
    for (const b of positionedBees) {
      nodeByBeeId.set(b.beeId, toTreeNode(b));
    }

    const rootNode = nodeByBeeId.get(queenBee.beeId) || toTreeNode(queenBee);
    const besideNode = sodBee ? nodeByBeeId.get(sodBee.beeId) : undefined;

    const attachedIds = new Set<string>([queenBee.beeId]);
    if (sodBee) attachedIds.add(sodBee.beeId);

    for (const b of positionedBees) {
      if (attachedIds.has(b.beeId) || b.tier === 'subagent') continue;
      const agentNode = nodeByBeeId.get(b.beeId);
      if (agentNode) {
        rootNode.children = rootNode.children || [];
        rootNode.children.push(agentNode);
        attachedIds.add(b.beeId);
      }
    }

    for (const b of positionedBees) {
      if (b.tier !== 'subagent') continue;
      const subNode = nodeByBeeId.get(b.beeId);
      if (!subNode) continue;
      const targetParent =
        (b.parentBeeId ? nodeByBeeId.get(b.parentBeeId) : undefined) || rootNode;
      targetParent.children = targetParent.children || [];
      targetParent.children.push(subNode);
    }

    return {
      root: rootNode,
      beside: besideNode,
    };
  }, [
    positionedBees,
    contracts,
    locale,
    hitlAgentIds,
    filteredHitlContracts,
    dict.beehiveQueenLabel,
  ]);

  const agentBeeCount = positionedBees.filter((b) => b.tier !== 'subagent').length;
  const subagentBeeCount = positionedBees.filter((b) => b.tier === 'subagent').length;
  const guardBeeCount = positionedBees.filter((b) => b.isGuard).length;
  const standbyBeeCount = positionedBees.filter((b) => b.isStandby).length;

  return (
    <div
      data-testid="open-office-beehive-lens"
      className="w-full min-w-0 space-y-3"
    >
      {/* Header Telemetry & Sub-View Toggle */}
      <div
        data-testid="beehive-telemetry-strip"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/25 px-3 py-2"
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
            <Hexagon className="size-4 shrink-0 text-primary" />
            <span>{dict.beehiveHeading}</span>
            <Badge
              data-testid="beehive-agent-count"
              variant="secondary"
              className="text-xs font-semibold tabular-nums"
            >
              {agentBeeCount} {dict.beehiveWorkerLabel}
            </Badge>
            <Badge
              data-testid="beehive-subagent-count"
              variant="outline"
              className="border-cyan-500/40 bg-cyan-500/10 text-xs font-semibold text-cyan-800 dark:text-cyan-200 tabular-nums"
            >
              {subagentBeeCount} {dict.beehiveSubagentLabel}
            </Badge>
            {guardBeeCount > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/12 text-xs font-semibold text-amber-800 dark:text-amber-200 tabular-nums"
              >
                {guardBeeCount} {dict.beehiveGuardLabel}
              </Badge>
            )}
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              · {standbyBeeCount} {locale === 'en' ? 'standby' : 'trực ban'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{dict.beehiveSubheading}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              data-testid="btn-beehive-view-comb"
              onClick={() => setSubView('comb')}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                subView === 'comb'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hexagon className="size-3.5" />
              <span>{dict.beehiveCombMode}</span>
            </button>
            <button
              type="button"
              data-testid="btn-beehive-view-tree"
              onClick={() => setSubView('tree')}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                subView === 'tree'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitBranch className="size-3.5" />
              <span>{dict.beehiveTreeMode}</span>
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onQuickAssign()}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <Send className="size-3.5" />
            <span>{dict.dispatchCta}</span>
          </Button>
        </div>
      </div>

      {/* Main Stage: 16-Bit Pixel-Art Beehive Canvas + Agents & Subagents Overlay OR 3-Level AgentTree */}
      {subView === 'tree' ? (
        <div
          data-testid="beehive-agent-tree"
          className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card p-3"
        >
          <AgentTree
            root={colonyTreeData.root}
            beside={colonyTreeData.beside}
            selected={selectedBeeId || selectedStationId || undefined}
            title={
              locale === 'en'
                ? 'Beehive Colony Hierarchy (Queen -> Agents -> Subagents)'
                : 'Cấu trúc Đàn ong (Ong Chúa -> Agent -> Subagent)'
            }
            onSelect={(ag) => {
              const target = positionedBees.find(
                (b) => b.beeId === ag.id || b.seatId === ag.id,
              );
              if (target) {
                setSelectedBeeId(target.beeId);
                onSelectStation(target.seatId);
              }
            }}
            onResolve={(ag, action) => {
              if (action === 'approve' || action === 'reject') {
                const match = filteredHitlContracts.find(
                  (c) =>
                    c.lead_agent_id === ag.id ||
                    (ag.task && ag.task.includes(c.id)),
                );
                if (match) onOpenQuickReview(match.id);
              }
            }}
          />
        </div>
      ) : (
        <div
          data-testid="beehive-stage-container"
          className="relative w-full min-w-0 aspect-[12/7] overflow-hidden rounded-xl border border-border bg-card select-none"
        >
          {/* 16-Bit Pixelated Honeycomb Background Canvas */}
          <canvas
            ref={canvasRef}
            data-testid="beehive-pixel-canvas"
            width={LIMEZU_STAGE_W}
            height={LIMEZU_STAGE_H}
            style={{ imageRendering: 'pixelated' }}
            className="block h-full w-full"
          />

          {/* Verified Active Lead -> Support Flights + Parent Agent -> Subagent Tethers */}
          <svg
            data-testid="beehive-svg-stage"
            viewBox={`0 0 ${LIMEZU_STAGE_W} ${LIMEZU_STAGE_H}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={dict.beehiveHeading}
            className="pointer-events-none absolute inset-0 z-10 block h-full w-full aspect-[12/7]"
          >
            {/* Parent Agent -> Spawned Subagent Tethers */}
            <g>
              {subagentLinks.map((link) => (
                <g key={link.id}>
                  <path
                    data-testid={`beehive-subagent-link-${link.subBee.beeId}`}
                    d={link.pathD}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth={1.6}
                    strokeOpacity={0.42}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={Math.round(link.cx - 2)}
                    y={Math.round(link.cy - 2)}
                    width={4}
                    height={4}
                    fill="var(--primary)"
                  />
                </g>
              ))}
            </g>

            {/* Verified Active Lead -> Support Contract Foraging Flights */}
            <g>
              {foragingFlights.map((flight, idx) => {
                const t = isMotionActive ? ((animTick * 0.06 + idx * 0.25) % 1) : 0.5;
                const mt = 1 - t;
                const px = Math.round(
                  mt * mt * flight.x0 + 2 * mt * t * flight.cx + t * t * flight.x2,
                );
                const py = Math.round(
                  mt * mt * flight.y0 + 2 * mt * t * flight.cy + t * t * flight.y2,
                );
                return (
                  <g key={flight.id}>
                    <path
                      data-testid={`beehive-flight-${flight.contractId}`}
                      d={flight.pathD}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      strokeOpacity={0.85}
                      strokeDasharray={isMotionActive ? '6 4' : undefined}
                    />
                    <rect
                      x={px - 4}
                      y={py - 4}
                      width={8}
                      height={8}
                      fill="var(--foreground)"
                    />
                    <rect
                      x={px - 3}
                      y={py - 3}
                      width={6}
                      height={6}
                      fill="var(--primary)"
                    />
                    <rect
                      x={px - 2}
                      y={py - 2}
                      width={2}
                      height={2}
                      fill="var(--background)"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 8 Interactive Pixel Chamber Hitboxes & Plaques */}
          {orderedRooms.map((room) => {
            const cell =
              cellLayout[room.canonicalId] || Object.values(cellLayout)[0];
            const agentsInCell = agentCountByRoom[room.canonicalId] || 0;
            const subsInCell = subagentCountByRoom[room.canonicalId] || 0;
            const workingInCell = workingCountByRoom[room.canonicalId] || 0;
            const isSelectedCell = activeCanonicalZone === room.canonicalId;
            const roomTitle =
              locale === 'en'
                ? room.spec.enTitle
                : room.name || room.spec.viTitle;

            return (
              <div
                key={room.id}
                data-testid={`beehive-cell-${room.canonicalId}`}
                role="button"
                tabIndex={0}
                aria-label={`${roomTitle} (${agentsInCell + subsInCell} bees)`}
                onClick={() => onSelectZone(room.canonicalId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectZone(room.canonicalId);
                  }
                }}
                style={{
                  left: `${((cell.cx / LIMEZU_STAGE_W) * 100).toFixed(2)}%`,
                  top: `${((cell.cy / LIMEZU_STAGE_H) * 100).toFixed(2)}%`,
                  width: `${(((cell.radius * 1.85) / LIMEZU_STAGE_W) * 100).toFixed(2)}%`,
                  height: `${(((cell.radius * 1.75) / LIMEZU_STAGE_H) * 100).toFixed(2)}%`,
                }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              >
                <span
                  className={`pointer-events-none absolute -top-2.5 left-1/2 max-w-[172px] -translate-x-1/2 truncate rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs ${
                    isSelectedCell
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background/95 text-foreground'
                  }`}
                >
                  {truncateLabel(roomTitle, 26)}
                </span>
                <span className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {subsInCell > 0
                    ? `${room.spec.ucCode} · ${agentsInCell}A+${subsInCell}S`
                    : `${room.spec.ucCode} · ${workingInCell}/${agentsInCell}`}
                </span>
              </div>
            );
          })}

          {/* Animated 16-Bit Pixel Queen, Main Agents & Spawned Subagent Bees */}
          {positionedBees.map((bee, idx) => {
            const isQueen = bee.tier === 'queen';
            const isSub = bee.tier === 'subagent';
            const isCrowdedSub =
              isSub &&
              bee.roomPopulation >= 4 &&
              !bee.isSelected &&
              hoveredBeeId !== bee.beeId;
            const spritePx = isQueen
              ? 44
              : isSub
                ? bee.roomPopulation >= 5
                  ? 24
                  : 28
                : bee.roomPopulation >= 5
                  ? 30
                  : 36;
            const wingFrame: 0 | 1 =
              isMotionActive && (animTick + idx) % 2 === 1 ? 1 : 0;
            const bobPx =
              isMotionActive && (bee.isActiveNow || isQueen)
                ? (animTick + idx * 2) % 4 < 2
                  ? 0
                  : -2
                : 0;
            const pixelRects = buildPixelBeeRects(
              bee.roleKind,
              wingFrame,
              bee.isSelected,
            );
            const showActivityChip =
              Boolean(bee.activityText) &&
              (bee.isSelected || hoveredBeeId === bee.beeId);

            return (
              <div
                key={bee.beeId}
                data-testid={`bee-node-${bee.beeId}`}
                data-bee-tier={bee.tier}
                role="button"
                tabIndex={0}
                aria-label={`${bee.displayName} · ${bee.roleLabel}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBeeId(bee.beeId);
                  onSelectStation(bee.seatId);
                }}
                onMouseEnter={() => setHoveredBeeId(bee.beeId)}
                onMouseLeave={() =>
                  setHoveredBeeId((prev) => (prev === bee.beeId ? null : prev))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedBeeId(bee.beeId);
                    onSelectStation(bee.seatId);
                  }
                }}
                style={{
                  left: `${((bee.x / LIMEZU_STAGE_W) * 100).toFixed(2)}%`,
                  top: `${((bee.y / LIMEZU_STAGE_H) * 100).toFixed(2)}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center ${
                  bee.isSelected || hoveredBeeId === bee.beeId
                    ? 'z-30'
                    : 'z-20'
                }`}
              >
                {showActivityChip && (
                  <div className="pointer-events-none mb-0.5 max-w-[168px] truncate rounded-md border border-border bg-background/95 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                    ⚡ {truncateLabel(bee.activityText, 24)}
                  </div>
                )}

                <svg
                  data-testid={`pixel-bee-sprite-${bee.beeId}`}
                  width={spritePx}
                  height={spritePx}
                  viewBox="0 0 28 28"
                  shapeRendering="crispEdges"
                  aria-hidden="true"
                  style={bobPx ? { transform: `translateY(${bobPx}px)` } : undefined}
                >
                  {pixelRects.map((r, rIdx) => (
                    <rect
                      key={rIdx}
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill={r.fill}
                      fillOpacity={r.opacity}
                    />
                  ))}
                </svg>

                <span
                  className={`mt-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md border ${
                    isCrowdedSub ? 'px-1 py-0' : 'px-1.5 py-0.5'
                  } text-xs font-semibold shadow-xs ${
                    bee.isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isSub
                        ? 'border-cyan-500/40 bg-background/92 text-foreground'
                        : 'border-border bg-background/95 text-foreground'
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 ${
                      bee.isGuard
                        ? 'bg-amber-500'
                        : isSub && bee.isActiveNow
                          ? 'bg-cyan-500'
                          : bee.isActiveNow || isQueen
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground'
                    }`}
                  />
                  <span>
                    {isCrowdedSub
                      ? `↳${bee.handleLabel.replace(/^↳?(?:sub·)?/, '').slice(0, 3)}`
                      : truncateLabel(bee.handleLabel, 12)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom 3-Card Colony Telemetry Deck */}
      <div
        data-testid="beehive-colony-deck"
        className="grid grid-cols-1 gap-2.5 md:grid-cols-3"
      >
        {/* Card 1: Foraging Flights & Active Subagent Spawns */}
        <section className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>{dict.beehiveFlightsCard}</span>
            </span>
            <Badge variant="secondary" className="font-mono text-xs tabular-nums">
              {foragingFlights.length + subagentLinks.length}
            </Badge>
          </div>
          {foragingFlights.length === 0 && subagentLinks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{dict.beehiveNoFlights}</p>
          ) : (
            <div className="space-y-1.5">
              {foragingFlights.slice(0, 3).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedBeeId(f.fromBee.beeId);
                    onSelectStation(f.fromBee.seatId);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary/50"
                >
                  <span className="truncate font-semibold">
                    {f.fromBee.displayName}
                  </span>
                  <ArrowRight className="size-3 shrink-0 text-primary" />
                  <span className="truncate text-muted-foreground">
                    {f.toBee.displayName}
                  </span>
                </button>
              ))}
              {subagentLinks.slice(0, 3).map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    setSelectedBeeId(link.subBee.beeId);
                    onSelectStation(link.subBee.seatId);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/8 px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:border-cyan-500/60"
                >
                  <Bot className="size-3 shrink-0 text-cyan-500" />
                  <span className="truncate font-medium">
                    {link.parentBee.handleLabel}
                  </span>
                  <ArrowRight className="size-3 shrink-0 text-cyan-500" />
                  <span className="truncate text-muted-foreground">
                    {link.subBee.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Card 2: Guard-Bee GW-SOD-01 Review Queue */}
        <section className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldAlert className="size-3.5 text-primary" />
              <span>{dict.beehiveGuardCard}</span>
            </span>
            <Badge variant="secondary" className="font-mono text-xs tabular-nums">
              {filteredHitlContracts.length}
            </Badge>
          </div>
          {filteredHitlContracts.length === 0 ? (
            <p className="text-xs text-muted-foreground">{dict.beehiveNoGuard}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredHitlContracts.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">
                      {c.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.id} · {c.lead_agent_name || c.lead_agent_id}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    data-testid={`btn-beehive-review-${c.id}`}
                    onClick={() => onOpenQuickReview(c.id)}
                    className="h-7 shrink-0 px-2.5 text-xs"
                  >
                    {locale === 'en' ? 'Review' : 'Duyệt'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Card 3: Active Colony Contracts */}
        <section className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Crown className="size-3.5 text-primary" />
              <span>{dict.beehiveContractsCard}</span>
            </span>
            <Badge variant="secondary" className="font-mono text-xs tabular-nums">
              {filteredContracts.length}
            </Badge>
          </div>
          {filteredContracts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {dict.dagNoActiveContracts}
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredContracts.slice(0, 4).map((c) => {
                const lead = beeByAgentId.get(c.lead_agent_id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (lead) {
                        setSelectedBeeId(lead.beeId);
                        onSelectStation(lead.seatId);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/50"
                  >
                    <span className="truncate font-medium text-foreground">
                      {c.title}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {c.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { ARCHITECTURAL_ROOM_SPECS };
