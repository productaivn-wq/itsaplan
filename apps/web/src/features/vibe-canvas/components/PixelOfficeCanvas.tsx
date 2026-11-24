'use client';

// SPEC-ITSAPLAN-OPEN-OFFICE-v3.5.0 (53.ACT.502 / UC-010 v2.3 — Authentic Gather.town 16-Bit Edition):
// Clean-room 16-bit Pixel-Art Sprite & Open-Floor Spatial Engine grounded in Gather.town REA
// Cryptographic Seal: ev_25ddf4c794acb3f6e10c3cf1511b49d3d60b53449e8631324c030af49d58afbd
// Preserves canonical STAGE_W = 960, STAGE_H = 560, imageSmoothingEnabled = false, and PixelAgentAvatar.

import * as React from 'react';
import { useLayoutEffect } from 'react';
import { useIsPaneActive } from '@/context/paneActiveContext';
import type {
  OpenOfficeColonyBee,
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeMascot,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';
import {
  computeAgentWorkloadAndStage,
  computeCollisionFreeRoomPct,
  computeDynamicPixelFloorplan,
  resolveCanonicalZoneId,
  type OpenOfficeLocale,
} from '../open-office/openOfficeConstants';
import {
  CANONICAL_TO_LIMEZU_ZONE,
  createDynamicLimeZuDoors,
  createInitialPetsState,
  drawLimeZuDoors,
  getLimeZuAtlasImage,
  LIMEZU_COLS,
  LIMEZU_ROWS,
  LIMEZU_TILE_PX,
  paintLimeZuOfficeFloorplan,
  routeDynamicLimeZuPixels,
  stepLimeZuDoors,
  stepPetsSimulation,
  subscribeLimeZuAtlas,
  triggerPetsReaction,
  type DoorActorInput,
  type LimeZuDoorState,
  type PetsSimState,
  type SpriteDirection,
} from '../open-office/limezuAtlasEngine';

import {
  CANONICAL_ROOMS,
  ROOM_DOORWAYS,
  SLOT_TO_CANONICAL_ROOM,
  STAGE_H,
  STAGE_W,
  ZONE_ALIAS_MAP,
  computeCorridorPath,
  formatAgentHandle,
  getDeskToolBadge,
  type CanonicalRoom,
  type Point2D,
  type RoomDoorway,
} from '../open-office/pixelOfficeGeometry';
import { PixelAgentAvatar, PixelMascotSprite, type PixelAgentAvatarProps } from '../open-office/PixelOfficeSprites';
import { paintDynamicGatherFloorplan } from '../open-office/pixelOfficeFloorplanPainter';
export {
  CANONICAL_ROOMS,
  PixelAgentAvatar,
  ROOM_DOORWAYS,
  SLOT_TO_CANONICAL_ROOM,
  STAGE_H,
  STAGE_W,
  ZONE_ALIAS_MAP,
  computeCorridorPath,
  formatAgentHandle,
  getDeskToolBadge,
  type CanonicalRoom,
  type PixelAgentAvatarProps,
  type Point2D,
  type RoomDoorway,
};

export interface PixelOfficeCanvasProps {
  zones?: OpenOfficeZone[];
  departments?: OpenOfficeDepartmentDossier[];
  stations?: OpenOfficeStation[];
  colonyBees?: OpenOfficeColonyBee[];
  mascots?: OpenOfficeMascot[];
  contracts?: OpenOfficeContract[];
  needsMyAction?: OpenOfficeContract[];
  selectedProjectFilter?: string;
  seatCountsByRoom?: Record<string, number>;
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  zoomLevel?: number;
  onZoomChange?: (nextZoom: number) => void;
  isMotionActive?: boolean;
  crowdPreview?: boolean;
  showPets?: boolean;
  effectsEnabled?: boolean;
  celebrateAgentIds?: string[];
  petEventSignal?: { kind: 'new' | 'done'; targetSeatId?: string; seq: number } | null;
  locale?: OpenOfficeLocale;
  showMinimap?: boolean;
  className?: string;
}

const PET_CHASE_LINES_DOG = [
  'Gâu! Tiến độ vững vàng!',
  'Đợi Cậu Vàng tuần tra!',
  'Không một lỗi trượt cổng!',
];
const PET_CHASE_LINES_CAT = [
  'Meo~ Hợp đồng chuẩn chỉ!',
  'Sảnh chung sạch bóng!',
  'Đang canh cổng duyệt độc lập!',
];

let cachedInitialFitScale = 1;

function PixelOfficeCanvasImpl({
  zones = [],
  departments = [],
  stations = [],
  colonyBees = [],
  mascots = [],
  contracts = [],
  needsMyAction = [],
  selectedProjectFilter = 'ALL',
  seatCountsByRoom,
  selectedStationId,
  onSelectStation,
  selectedZoneId = null,
  onSelectZone,
  zoomLevel = 1.0,
  onZoomChange,
  isMotionActive = true,
  crowdPreview = false,
  showPets = true,
  effectsEnabled = true,
  celebrateAgentIds = [],
  petEventSignal = null,
  locale = 'vi',
  showMinimap = true,
  className = '',
}: PixelOfficeCanvasProps) {
  void crowdPreview;
  void showMinimap;

  const floorplanSpec = React.useMemo(
    () => computeDynamicPixelFloorplan(zones, departments, seatCountsByRoom),
    [zones, departments, seatCountsByRoom],
  );

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const doorCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const floorCtxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const doorsRef = React.useRef<LimeZuDoorState[]>(createDynamicLimeZuDoors(floorplanSpec));
  const lastDoorSigRef = React.useRef<string>(floorplanSpec.signature);
  const doorsPaintedOnceRef = React.useRef<boolean>(false);
  const petsSimRef = React.useRef<PetsSimState>(createInitialPetsState());
  const lastPetSeqRef = React.useRef<number>(-1);
  const isPaneActive = useIsPaneActive();
  const [animTick, setAnimTick] = React.useState<number>(0);
  const [walkTick, setWalkTick] = React.useState<number>(0);
  const [fitScale, setFitScale] = React.useState<number>(() => cachedInitialFitScale);
  const [hoveredStationId, setHoveredStationId] = React.useState<string | null>(null);
  const [atlasReady, setAtlasReady] = React.useState<boolean>(() => Boolean(getLimeZuAtlasImage()));
  const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = React.useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({
    active: false,
    sx: 0,
    sy: 0,
    px: 0,
    py: 0,
  });

  React.useEffect(() => {
    return subscribeLimeZuAtlas(() => {
      setAtlasReady(Boolean(getLimeZuAtlasImage()));
    });
  }, []);

  React.useEffect(() => {
    if (zoomLevel <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  const posRef = React.useRef<
    Record<
      string,
      {
        x: number;
        y: number;
        currentRoom: string;
        path: Point2D[];
        isWalking: boolean;
        dir: SpriteDirection;
        strollIdx: number;
        strollWait: number;
      }
    >
  >({});

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateFit = () => {
      const w = el.clientWidth;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
      if (w > 240) {
        const pad = vh >= 960 && w >= 950 ? 2 : 4;
        const widthScale = (w - pad) / STAGE_W;
        const heightCeiling = Math.max(0.785, (vh - 160) / STAGE_H);
        const minDesktopScale =
          vh >= 700 ? Math.min(widthScale, (0.57 * vh) / STAGE_H) : Math.min(widthScale, 0.785);
        const scale = Math.min(widthScale, Math.max(minDesktopScale, Math.min(widthScale, heightCeiling)));
        const next = Math.min(1.25, Math.max(0.24, Math.min(widthScale, Math.max(0.785, scale))));
        cachedInitialFitScale = next;
        setFitScale((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
      }
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    ro.observe(el);
    window.addEventListener('resize', updateFit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateFit);
    };
  }, []);

  const normalizedZones = React.useMemo(() => {
    const zoneByCanonical = new Map<string, OpenOfficeZone>();
    for (const z of zones) {
      zoneByCanonical.set(resolveCanonicalZoneId(z.id, zones), z);
    }

    return floorplanSpec.rooms.map((rm) => {
      const orig = zoneByCanonical.get(rm.canonicalId);
      const visualSlot =
        orig?.visual_slot || rm.visualSlot || CANONICAL_TO_LIMEZU_ZONE[rm.canonicalId] || 'sanh';
      const templateRoom: CanonicalRoom = {
        id: rm.canonicalId,
        name: orig?.name || rm.name,
        subtitle: orig?.subtitle || rm.subtitle,
        kind: rm.isSpine ? 'lounge' : 'suite',
        x: rm.pctRect.x,
        y: rm.pctRect.y,
        w: rm.pctRect.w,
        h: rm.pctRect.h,
        accent: orig?.accent || rm.accent,
        deskAnchors: rm.deskAnchors,
        patrolWaypoints: rm.patrolWaypoints,
      };
      return {
        id: orig?.id || rm.canonicalId,
        sop_id: orig?.sop_id || rm.sopId,
        is_spine: rm.isSpine,
        canonicalId: rm.canonicalId,
        visualSlot,
        kind: templateRoom.kind,
        themeDomain: rm.themeDomain,
        seatCapacity: rm.seatCapacity,
        name: locale === 'en' ? orig?.en_name || rm.enName || rm.name : orig?.name || rm.name,
        subtitle: orig?.subtitle || rm.subtitle,
        accent: orig?.accent || rm.accent,
        templateRoom,
        pixelRect: {
          x: Math.round((rm.pctRect.x * STAGE_W) / 100),
          y: Math.round((rm.pctRect.y * STAGE_H) / 100),
          w: Math.max(64, Math.round((rm.pctRect.w * STAGE_W) / 100)),
          h: Math.max(54, Math.round((rm.pctRect.h * STAGE_H) / 100)),
        },
      };
    });
  }, [floorplanSpec, zones, locale]);

  React.useEffect(() => {
    if (lastDoorSigRef.current !== floorplanSpec.signature) {
      lastDoorSigRef.current = floorplanSpec.signature;
      doorsRef.current = createDynamicLimeZuDoors(floorplanSpec);
      doorsPaintedOnceRef.current = false;
    }
  }, [floorplanSpec]);

  const { workingCountByRoom, hitlCountByRoom } = React.useMemo(() => {
    const workCounts: Record<string, number> = {};
    const hitlCounts: Record<string, number> = {};
    const hitlAgentIds = new Set<string>();
    const countedSeatIds = new Set<string>();
    const countedConvIds = new Set<string>();
    for (const c of [...needsMyAction, ...contracts.filter((ct) => ct.status === 'AWAITING_HITL')]) {
      if (c.lead_agent_id) hitlAgentIds.add(c.lead_agent_id);
      for (const s of c.support_agent_ids || []) hitlAgentIds.add(s);
    }
    for (const st of stations) {
      if (st.seat_id) countedSeatIds.add(st.seat_id);
      if (st.live_telemetry?.session_id) countedConvIds.add(st.live_telemetry.session_id);
      const ck = resolveCanonicalZoneId(st.zone_id, zones);
      const isAct =
        st.status === 'WORKING' ||
        st.status === 'ACTIVE' ||
        st.status === 'RUNNING' ||
        st.status === 'BUSY' ||
        Boolean(st.live_telemetry?.is_live_executing);
      if (isAct) workCounts[ck] = (workCounts[ck] || 0) + 1;
      if (st.status === 'AWAITING_HITL' || (st.agent_id && hitlAgentIds.has(st.agent_id))) {
        hitlCounts[ck] = (hitlCounts[ck] || 0) + 1;
      }
    }
    for (const cb of colonyBees) {
      if (cb.bee_id && countedSeatIds.has(cb.bee_id)) continue;
      if (cb.conversation_id && countedConvIds.has(cb.conversation_id)) continue;
      if (cb.conversation_id) countedConvIds.add(cb.conversation_id);
      const ck = resolveCanonicalZoneId(cb.zone_id, zones);
      const s = String(cb.status || '').toUpperCase();
      if (s === 'WORKING' || s === 'ACTIVE' || s === 'RUNNING' || s === 'BUSY') {
        workCounts[ck] = (workCounts[ck] || 0) + 1;
      }
    }
    return { workingCountByRoom: workCounts, hitlCountByRoom: hitlCounts };
  }, [stations, colonyBees, contracts, needsMyAction, zones]);

  const roomLabelOverrides = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const z of normalizedZones) {
      map[z.canonicalId] = z.name;
      if (z.visualSlot) {
        map[z.visualSlot] = z.name;
      }
    }
    return map;
  }, [normalizedZones]);

  const spineCanonicalId = React.useMemo(
    () =>
      normalizedZones.find((z) => z.kind === 'lounge' || z.is_spine)?.canonicalId ||
      normalizedZones[0]?.canonicalId ||
      'sop_generic_7p',
    [normalizedZones],
  );

  const zoneMetaByCanonical = React.useMemo(() => {
    const map = new Map<string, { canon: CanonicalRoom; visualSlot: string }>();
    for (const z of normalizedZones) {
      map.set(z.canonicalId, { canon: z.templateRoom, visualSlot: z.visualSlot });
    }
    return map;
  }, [normalizedZones]);

  const roomDistributionMeta = React.useMemo(() => {
    const roomLists: Record<string, OpenOfficeStation[]> = {};
    const coordFreq: Record<string, number> = {};
    for (const st of stations) {
      const ck = resolveCanonicalZoneId(st.zone_id, zones);
      if (!roomLists[ck]) roomLists[ck] = [];
      roomLists[ck].push(st);
      if (st.coords) {
        const cKey = `${ck}:${Math.round(st.coords.x)}:${Math.round(st.coords.y)}`;
        coordFreq[cKey] = (coordFreq[cKey] || 0) + 1;
      }
    }
    return { roomLists, coordFreq };
  }, [stations, zones]);

  React.useEffect(() => {
    if (!isPaneActive) return;
    let anyWalkMoved = false;
    stations.forEach((st, idx) => {
      const canonicalKey = resolveCanonicalZoneId(st.zone_id, zones);
      const canon =
        zoneMetaByCanonical.get(canonicalKey)?.canon ||
        CANONICAL_ROOMS[canonicalKey] ||
        CANONICAL_ROOMS[spineCanonicalId] ||
        CANONICAL_ROOMS.sop_generic_7p;
      const roomGroup = roomDistributionMeta.roomLists[canonicalKey] || [st];
      const idxInRoom = Math.max(0, roomGroup.indexOf(st));
      const cKey = st.coords
        ? `${canonicalKey}:${Math.round(st.coords.x)}:${Math.round(st.coords.y)}`
        : '';
      const hasDupCoords = cKey ? (roomDistributionMeta.coordFreq[cKey] || 0) > 1 : false;

      const isCollapsed =
        !st.coords || (st.coords.x <= 6 && st.coords.y <= 6) || hasDupCoords;
      const fallbackSlot =
        roomGroup.length > canon.deskAnchors.length || hasDupCoords
          ? computeCollisionFreeRoomPct(canon.id, idxInRoom, roomGroup.length)
          : canon.deskAnchors[idxInRoom % canon.deskAnchors.length];
      const basePctX = isCollapsed ? fallbackSlot.x : (st.coords?.x ?? fallbackSlot.x);
      let basePctY = isCollapsed ? fallbackSlot.y : (st.coords?.y ?? fallbackSlot.y);

      if (canon.y === 0 && basePctY < 17) basePctY = canon.id === 'sop_strategy_01' ? 18 : 17;

      let targetPxX = Math.round((basePctX * STAGE_W) / 100);
      let targetPxY = Math.round((basePctY * STAGE_H) / 100);
      targetPxX = Math.min(STAGE_W - 68, Math.max(88, targetPxX));
      targetPxY = Math.min(STAGE_H - 42, Math.max(82, targetPxY));

      const key = st.agent_id || st.seat_id;
      let posData = posRef.current[key];
      if (!posData) {
        posData = {
          x: targetPxX,
          y: targetPxY,
          currentRoom: canonicalKey,
          path: [],
          isWalking: false,
          dir: 'down',
          strollIdx: idx % canon.patrolWaypoints.length,
          strollWait: 0,
        };
        posRef.current[key] = posData;
      }

      if (posData.currentRoom !== canonicalKey && posData.path.length === 0) {
        posData.path = routeDynamicLimeZuPixels(
          posData.x,
          posData.y,
          targetPxX,
          targetPxY,
          floorplanSpec,
        );
      }

      if (isMotionActive) {
        if (posData.path.length > 0) {
          anyWalkMoved = true;
          const nextTarget = posData.path[0];
          const dx = nextTarget.x - posData.x;
          const dy = nextTarget.y - posData.y;
          const dist = Math.hypot(dx, dy);
          const stepSpeed = 4.2;

          if (Math.abs(dx) > Math.abs(dy)) {
            posData.dir = dx >= 0 ? 'right' : 'left';
          } else if (Math.abs(dy) > 0.1) {
            posData.dir = dy >= 0 ? 'down' : 'up';
          }

          if (dist <= stepSpeed) {
            posData.x = nextTarget.x;
            posData.y = nextTarget.y;
            posData.path.shift();
            if (posData.path.length === 0) {
              posData.currentRoom = canonicalKey;
              posData.isWalking = false;
              posData.dir = 'down';
            } else {
              posData.isWalking = true;
            }
          } else {
            posData.x += (dx / dist) * stepSpeed;
            posData.y += (dy / dist) * stepSpeed;
            posData.isWalking = true;
          }
        } else if (
          canon.kind === 'lounge' &&
          (st.status === 'IDLE' || st.status === 'STANDBY')
        ) {
          posData.strollWait = (posData.strollWait || 0) + 1;
          if (posData.strollWait > 50) {
            posData.strollWait = 0;
            posData.strollIdx = ((posData.strollIdx || 0) + 1) % 2;
            const wp = canon.patrolWaypoints[posData.strollIdx] || { x: 47.9, y: 60.4 };
            const dstX = Math.round((wp.x * STAGE_W) / 100);
            const dstY = Math.round((wp.y * STAGE_H) / 100);
            posData.path = routeDynamicLimeZuPixels(posData.x, posData.y, dstX, dstY, floorplanSpec);
            posData.isWalking = posData.path.length > 0;
            if (posData.isWalking) anyWalkMoved = true;
          }
        }
      }
    });
    if (anyWalkMoved) {
      setWalkTick((t) => (t + 1) % 3600);
    }
  }, [isPaneActive, stations, isMotionActive, animTick, roomDistributionMeta, zones, zoneMetaByCanonical, spineCanonicalId, floorplanSpec]);

  const effectiveScale = Math.min(1.35, Math.max(0.24, fitScale * zoomLevel));

  // Heavy O(N^2) collision resolution & grid snap runs ONLY when layout/station data changes,
  // never on idle animTick frames.
  const baseLayout = React.useMemo(() => {
    const rawList = stations.map((st) => {
      const canonicalKey = resolveCanonicalZoneId(st.zone_id, zones);
      const canon =
        zoneMetaByCanonical.get(canonicalKey)?.canon ||
        CANONICAL_ROOMS[canonicalKey] ||
        CANONICAL_ROOMS[spineCanonicalId] ||
        CANONICAL_ROOMS.sop_generic_7p;
      const roomGroup = roomDistributionMeta.roomLists[canonicalKey] || [st];
      const idxInRoom = Math.max(0, roomGroup.indexOf(st));
      const cKey = st.coords
        ? `${canonicalKey}:${Math.round(st.coords.x)}:${Math.round(st.coords.y)}`
        : '';
      const hasDupCoords = cKey ? (roomDistributionMeta.coordFreq[cKey] || 0) > 1 : false;

      const isCollapsed =
        !st.coords || (st.coords.x <= 6 && st.coords.y <= 6) || hasDupCoords;
      const fallbackSlot =
        roomGroup.length > canon.deskAnchors.length || hasDupCoords
          ? computeCollisionFreeRoomPct(canon.id, idxInRoom, roomGroup.length)
          : canon.deskAnchors[idxInRoom % canon.deskAnchors.length];
      const basePctX = isCollapsed ? fallbackSlot.x : (st.coords?.x ?? fallbackSlot.x);
      let basePctY = isCollapsed ? fallbackSlot.y : (st.coords?.y ?? fallbackSlot.y);

      if (canon.y === 0 && basePctY < 17) basePctY = canon.id === 'sop_strategy_01' ? 18 : 17;

      let targetPxX = Math.round((basePctX * STAGE_W) / 100);
      let targetPxY = Math.round((basePctY * STAGE_H) / 100);
      targetPxX = Math.min(STAGE_W - 68, Math.max(88, targetPxX));
      targetPxY = Math.min(STAGE_H - 42, Math.max(82, targetPxY));

      return {
        ...st,
        canonicalKey,
        isWalking: false,
        dir: 'down' as SpriteDirection,
        pixelCoords: {
          x: targetPxX,
          y: targetPxY,
        },
      };
    });

    const safeScale = Math.max(0.24, effectiveScale);
    const fontPx = Math.max(12, Math.ceil(11.6 / safeScale));
    const isTinyMobile = safeScale < 0.55;
    const avatarH = isTinyMobile ? 33 : 54;

    const sizedList = rawList.map((st) => {
      const handle = formatAgentHandle(st.agent_name, st.agent_id);
      const workload = computeAgentWorkloadAndStage(st, contracts, locale, zones);
      const isOv = workload.isOverloaded;
      const estimatedW = Math.round(
        handle.length * fontPx * 0.56 +
          (isTinyMobile ? 28 : fontPx * 1.5 + 34) +
          (isOv ? fontPx * 2.5 + 8 : 0),
      );
      const halfW = Math.max(48, Math.ceil(estimatedW / 2) + 5);
      const nametagH = Math.max(24, Math.ceil(fontPx * 1.15) + (isTinyMobile ? 4 : 8));
      const halfH = Math.ceil((nametagH + 6 + avatarH) / 2) + 4;
      const edgePadX = halfW + 4;
      const cx = Math.min(STAGE_W - edgePadX, Math.max(edgePadX, st.pixelCoords.x));
      const cy = Math.min(STAGE_H - halfH - 4, Math.max(halfH + 4, st.pixelCoords.y));
      st.pixelCoords.x = cx;
      st.pixelCoords.y = cy;
      return { st, halfW, halfH };
    });

    const plaqueBoxes = normalizedZones.map((z) => {
      const plaqueW = Math.round(
        Math.max(70, z.name.length * fontPx * 0.55 + (isTinyMobile ? 16 : 28)),
      );
      const plaqueH = Math.max(24, Math.ceil(fontPx * 1.15) + (isTinyMobile ? 4 : 8));
      const cx = z.pixelRect.x + Math.round(z.pixelRect.w / 2);
      const cy = z.pixelRect.y + 4 + Math.round(plaqueH / 2);
      return {
        cx,
        cy,
        halfW: Math.ceil(plaqueW / 2) + 5,
        halfH: Math.ceil(plaqueH / 2) + 5,
      };
    });

    const countOverlapsAt = (idx: number, candX: number, candY: number) => {
      const me = sizedList[idx];
      let plaques = 0;
      for (const pl of plaqueBoxes) {
        if (Math.abs(candX - pl.cx) < me.halfW + pl.halfW && Math.abs(candY - pl.cy) < me.halfH + pl.halfH) {
          plaques += 1;
        }
      }
      let stationsOverlap = 0;
      for (let j = 0; j < sizedList.length; j++) {
        if (j === idx) continue;
        const other = sizedList[j];
        if (
          Math.abs(candX - other.st.pixelCoords.x) < me.halfW + other.halfW + 6 &&
          Math.abs(candY - other.st.pixelCoords.y) < me.halfH + other.halfH + 6
        ) {
          stationsOverlap += 1;
        }
      }
      return { plaques, stations: stationsOverlap };
    };

    const resolvePlaqueCollisions = (idx: number): boolean => {
      const { st, halfW, halfH } = sizedList[idx];
      const minX = halfW + 4;
      const maxX = Math.max(minX, STAGE_W - minX);
      const minY = halfH + 4;
      const maxY = Math.max(minY, STAGE_H - minY);
      const clampX = (x: number) => Math.min(maxX, Math.max(minX, Math.round(x)));
      const clampY = (y: number) => Math.min(maxY, Math.max(minY, Math.round(y)));
      let moved = false;

      for (const pl of plaqueBoxes) {
        const reqX = halfW + pl.halfW;
        const reqY = halfH + pl.halfH;
        const curX = st.pixelCoords.x;
        const curY = st.pixelCoords.y;
        if (Math.abs(curX - pl.cx) < reqX && Math.abs(curY - pl.cy) < reqY) {
          const upY = pl.cy - reqY - 2;
          const dnY = pl.cy + reqY + 2;
          const lfX = pl.cx - reqX - 2;
          const rtX = pl.cx + reqX + 2;
          const rawCandidates: Array<{ x: number; y: number }> = [
            { x: curX, y: clampY(upY) },
            { x: curX, y: clampY(dnY) },
            { x: clampX(lfX), y: curY },
            { x: clampX(rtX), y: curY },
            { x: clampX(lfX), y: clampY(upY) },
            { x: clampX(rtX), y: clampY(upY) },
            { x: clampX(lfX), y: clampY(dnY) },
            { x: clampX(rtX), y: clampY(dnY) },
          ];
          let bestX = curX;
          let bestY = curY;
          let bestCost = Number.POSITIVE_INFINITY;
          for (const c of rawCandidates) {
            const ov = countOverlapsAt(idx, c.x, c.y);
            const dist = Math.hypot(c.x - curX, c.y - curY);
            const cost = dist + 5000 * ov.plaques + 4000 * ov.stations;
            if (cost < bestCost) {
              bestCost = cost;
              bestX = c.x;
              bestY = c.y;
            }
          }
          if (bestX !== curX || bestY !== curY) {
            st.pixelCoords.x = bestX;
            st.pixelCoords.y = bestY;
            moved = true;
          }
        }
      }
      return moved;
    };

    // Alternating Station<->Station and Station<->Plaque 2D AABB solver
    for (let pass = 0; pass < 32; pass++) {
      let hadOverlap = false;
      for (let i = 0; i < sizedList.length; i++) {
        for (let j = i + 1; j < sizedList.length; j++) {
          const A = sizedList[i];
          const B = sizedList[j];
          const dx = B.st.pixelCoords.x - A.st.pixelCoords.x;
          const dy = B.st.pixelCoords.y - A.st.pixelCoords.y;
          const ox = A.halfW + B.halfW + 6 - Math.abs(dx);
          const oy = A.halfH + B.halfH + 6 - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            hadOverlap = true;
            if (oy <= ox) {
              const step = Math.ceil(oy / 2) + 1;
              const sgn = dy >= 0 ? 1 : -1;
              A.st.pixelCoords.y = Math.min(
                STAGE_H - A.halfH - 4,
                Math.max(A.halfH + 4, A.st.pixelCoords.y - sgn * step),
              );
              B.st.pixelCoords.y = Math.min(
                STAGE_H - B.halfH - 4,
                Math.max(B.halfH + 4, B.st.pixelCoords.y + sgn * step),
              );
            } else {
              const step = Math.ceil(ox / 2) + 1;
              const sgn = dx >= 0 ? 1 : -1;
              const aPad = A.halfW + 4;
              const bPad = B.halfW + 4;
              A.st.pixelCoords.x = Math.min(
                STAGE_W - aPad,
                Math.max(aPad, A.st.pixelCoords.x - sgn * step),
              );
              B.st.pixelCoords.x = Math.min(
                STAGE_W - bPad,
                Math.max(bPad, B.st.pixelCoords.x + sgn * step),
              );
            }
          }
        }
      }
      for (let i = 0; i < sizedList.length; i++) {
        if (resolvePlaqueCollisions(i)) {
          hadOverlap = true;
        }
      }
      if (!hadOverlap) break;
    }

    // Fallback deterministic 18x14 grid snap for any station still touching a plaque or station
    for (let i = 0; i < sizedList.length; i++) {
      const curOv = countOverlapsAt(i, sizedList[i].st.pixelCoords.x, sizedList[i].st.pixelCoords.y);
      if (curOv.plaques === 0 && curOv.stations === 0) continue;
      const { st, halfW, halfH } = sizedList[i];
      const minX = halfW + 4;
      const maxX = Math.max(minX, STAGE_W - minX);
      const minY = halfH + 4;
      const maxY = Math.max(minY, STAGE_H - minY);
      let bestX = st.pixelCoords.x;
      let bestY = st.pixelCoords.y;
      let bestCost = 5000 * curOv.plaques + 4000 * curOv.stations;
      for (let gx = 0; gx < 18; gx++) {
        const cx = Math.round(minX + ((maxX - minX) * gx) / 17);
        for (let gy = 0; gy < 14; gy++) {
          const cy = Math.round(minY + ((maxY - minY) * gy) / 13);
          const ov = countOverlapsAt(i, cx, cy);
          const cost = 5000 * ov.plaques + 4000 * ov.stations + Math.hypot(cx - st.pixelCoords.x, cy - st.pixelCoords.y);
          if (cost < bestCost) {
            bestCost = cost;
            bestX = cx;
            bestY = cy;
          }
        }
      }
      st.pixelCoords.x = bestX;
      st.pixelCoords.y = bestY;
    }

    // 3. Guarantee strictly unique (x, y) coordinates even when boundary clamping occurs under high crowd density
    const occupied = new Set<string>();
    for (let i = 0; i < rawList.length; i++) {
      let cx = rawList[i].pixelCoords.x;
      let cy = rawList[i].pixelCoords.y;
      let attempt = 0;
      while (occupied.has(`${cx}|${cy}`) && attempt < 48) {
        attempt += 1;
        const stepX = ((attempt % 6) - 2.5) * 28;
        const stepY = (Math.floor(attempt / 6) - 1.5) * 26;
        cx = Math.min(STAGE_W - 44, Math.max(48, Math.round(rawList[i].pixelCoords.x + stepX)));
        cy = Math.min(STAGE_H - 28, Math.max(64, Math.round(rawList[i].pixelCoords.y + stepY)));
      }
      occupied.add(`${cx}|${cy}`);
      rawList[i].pixelCoords.x = cx;
      rawList[i].pixelCoords.y = cy;
    }

    return rawList;
  }, [stations, roomDistributionMeta, normalizedZones, effectiveScale, contracts, locale, zones, zoneMetaByCanonical, spineCanonicalId]);

  const allStations = React.useMemo(() => {
    void walkTick;
    let anyWalking = false;
    for (const st of baseLayout) {
      const posData = posRef.current[st.agent_id || st.seat_id];
      if (posData && (posData.isWalking || posData.path.length > 0)) {
        anyWalking = true;
        break;
      }
    }
    if (!anyWalking) return baseLayout;
    return baseLayout.map((st) => {
      const posData = posRef.current[st.agent_id || st.seat_id];
      if (!posData || (!posData.isWalking && posData.path.length === 0)) return st;
      return {
        ...st,
        isWalking: Boolean(posData.isWalking),
        dir: posData.dir,
        pixelCoords: {
          x: Math.round(posData.x),
          y: Math.round(posData.y),
        },
      };
    });
  }, [baseLayout, walkTick]);

  React.useEffect(() => {
    if (!petEventSignal || !effectsEnabled) return;
    if (petEventSignal.seq === lastPetSeqRef.current) return;
    lastPetSeqRef.current = petEventSignal.seq;
    const targetStation = petEventSignal.targetSeatId
      ? allStations.find(
          (s) =>
            s.seat_id === petEventSignal.targetSeatId ||
            s.agent_id === petEventSignal.targetSeatId,
        )
      : allStations[0];
    const targetTile = targetStation
      ? {
          x: Math.max(1, Math.min(LIMEZU_COLS - 1, targetStation.pixelCoords.x / LIMEZU_TILE_PX)),
          y: Math.max(1, Math.min(LIMEZU_ROWS - 1, targetStation.pixelCoords.y / LIMEZU_TILE_PX)),
        }
      : null;
    triggerPetsReaction(petsSimRef.current, petEventSignal.kind, targetTile);
  }, [petEventSignal, effectsEnabled, allStations]);

  const animatedMascots = React.useMemo(() => {
    const sim = petsSimRef.current;
    return mascots.map((m) => {
      const isDog = m.species === 'dog' || m.id.includes('cau-vang');
      const simPet = isDog ? sim.dog : sim.cat;
      const dynamicBubble = m.bubble && m.bubble.trim().length > 0 ? m.bubble.trim() : null;
      const hasLiveReaction = sim.tick < simPet.bubbleUntilTick;
      const displayBubble =
        (hasLiveReaction ? simPet.bubble : dynamicBubble || simPet.bubble) ||
        (isDog ? PET_CHASE_LINES_DOG[0] : PET_CHASE_LINES_CAT[0]);

      return {
        ...m,
        isDog,
        facingLeft: simPet.facingLeft,
        walkFrame: simPet.frame,
        hasLiveReaction: hasLiveReaction && effectsEnabled,
        displayBubble,
        pixelCoords: {
          x: Math.round(simPet.x * LIMEZU_TILE_PX),
          y: Math.round(simPet.y * LIMEZU_TILE_PX),
        },
      };
    });
  }, [mascots, animTick, effectsEnabled]);

  React.useEffect(() => {
    if (!isPaneActive) return;
    if (typeof requestAnimationFrame === 'undefined' || typeof cancelAnimationFrame === 'undefined') {
      return;
    }
    if (typeof navigator !== 'undefined' && /jsdom|HappyDOM/i.test(navigator.userAgent || '')) {
      return;
    }
    let animId: number;
    const nowFn = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    let lastTickTime = nowFn();
    let lastDoorTime = nowFn();

    const loop = (time: number) => {
      const dtDoor = Math.min(64, Math.max(0, time - lastDoorTime));
      lastDoorTime = time;

      if (doorCanvasRef.current) {
        let doorCtx: CanvasRenderingContext2D | null = null;
        try {
          doorCtx = doorCanvasRef.current.getContext('2d');
        } catch {
          doorCtx = null;
        }
        if (doorCtx) {
          const actors: DoorActorInput[] = [];
          for (const key of Object.keys(posRef.current)) {
            const p = posRef.current[key];
            actors.push({
              x: p.x / LIMEZU_TILE_PX,
              y: p.y / LIMEZU_TILE_PX,
              moving: p.isWalking,
              kind: 'char',
              pathTiles: p.path.map((pt) => [pt.x / LIMEZU_TILE_PX, pt.y / LIMEZU_TILE_PX] as const),
            });
          }
          if (showPets) {
            const sim = petsSimRef.current;
            actors.push(
              {
                x: sim.cat.x,
                y: sim.cat.y,
                moving: sim.cat.moving,
                kind: 'pet',
                dirX: sim.cat.dirX,
                dirY: sim.cat.dirY,
              },
              {
                x: sim.dog.x,
                y: sim.dog.y,
                moving: sim.dog.moving,
                kind: 'pet',
                dirX: sim.dog.dirX,
                dirY: sim.dog.dirY,
              },
            );
          }
          const dirty = stepLimeZuDoors(doorsRef.current, actors, dtDoor, time);
          if (dirty || !doorsPaintedOnceRef.current) {
            drawLimeZuDoors(
              doorCtx,
              doorsRef.current,
              getLimeZuAtlasImage(),
              floorCtxRef.current,
            );
            doorsPaintedOnceRef.current = true;
          }
        }
      }

      if (time - lastTickTime >= 250) {
        lastTickTime = time;
        if (typeof document !== 'undefined' && document.hidden) {
          // Skip updating animTick when tab is hidden
        } else if (isMotionActive && isPaneActive) {
          if (showPets) {
            stepPetsSimulation(petsSimRef.current);
          }
          setAnimTick((prev) => (prev + 1) % 3600);
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaneActive, isMotionActive, showPets]);

  const BASE_H = STAGE_H;
  const stageLabelFontPx = `${Math.max(12, Math.ceil(11.6 / effectiveScale))}px`;
  const scaledHeight = Math.round(STAGE_H * effectiveScale);
  const isHighResDesktop =
    typeof window !== 'undefined' && window.innerHeight >= 950 && zoomLevel === 1;
  const outerCanvasHeight = isHighResDesktop
    ? Math.max(Math.round(BASE_H * effectiveScale), Math.ceil(window.innerHeight * 0.565))
    : scaledHeight;
  const activeCanonicalZone = selectedZoneId ? resolveCanonicalZoneId(selectedZoneId, zones) : null;
  const isZoomedPan = zoomLevel > 1.01;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator !== 'undefined' && /jsdom|HappyDOM/i.test(navigator.userAgent)) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    const dpr = typeof window !== 'undefined' ? Math.min(2, Math.max(1, window.devicePixelRatio || 1)) : 1;
    if (canvas.width !== Math.round(STAGE_W * dpr) || canvas.height !== Math.round(STAGE_H * dpr)) {
      canvas.width = Math.round(STAGE_W * dpr);
      canvas.height = Math.round(STAGE_H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    floorCtxRef.current = ctx;

    const loadedAtlas = atlasReady ? getLimeZuAtlasImage() : null;
    if (loadedAtlas) {
      paintLimeZuOfficeFloorplan(ctx, loadedAtlas, roomLabelOverrides, false, {
        floorplan: floorplanSpec,
        workingCountByRoom,
        hitlCountByRoom,
        selectedCanonicalZone: activeCanonicalZone,
      });
    } else {
      paintDynamicGatherFloorplan(
        ctx,
        floorplanSpec,
        workingCountByRoom,
        hitlCountByRoom,
        activeCanonicalZone,
      );
    }
  }, [atlasReady, roomLabelOverrides, floorplanSpec, workingCountByRoom, hitlCountByRoom, activeCanonicalZone]);

  const clampPan = React.useCallback(
    (nx: number, ny: number) => {
      const el = containerRef.current;
      if (!el || !isZoomedPan) return { x: 0, y: 0 };
      const maxX = Math.max(0, Math.round(STAGE_W * effectiveScale) - el.clientWidth);
      const maxY = Math.max(0, scaledHeight - outerCanvasHeight);
      return {
        x: Math.min(0, Math.max(-maxX, Math.round(nx))),
        y: Math.min(0, Math.max(-maxY, Math.round(ny))),
      };
    },
    [isZoomedPan, effectiveScale, scaledHeight, outerCanvasHeight],
  );

  return (
    <div
      ref={containerRef}
      onWheel={(e) => {
        if (onZoomChange && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onZoomChange(
            Math.min(1.4, Math.max(0.7, Number((zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2)))),
          );
        }
      }}
      onDoubleClick={() => {
        setPanOffset({ x: 0, y: 0 });
        onZoomChange?.(1.0);
      }}
      onPointerDown={(e) => {
        if (!isZoomedPan) return;
        dragRef.current = {
          active: true,
          sx: e.clientX,
          sy: e.clientY,
          px: panOffset.x,
          py: panOffset.y,
        };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active || !isZoomedPan) return;
        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;
        setPanOffset(clampPan(dragRef.current.px + dx, dragRef.current.py + dy));
      }}
      onPointerUp={() => {
        dragRef.current.active = false;
      }}
      onPointerCancel={() => {
        dragRef.current.active = false;
      }}
      className={`relative w-full overflow-x-auto overflow-y-hidden touch-pan-y rounded-[24px] border border-border/85 bg-[#1A140F] shadow-[var(--studio-stage-shadow)] select-none ${
        isZoomedPan ? 'cursor-grab active:cursor-grabbing' : ''
      } ${className}`}
    >
      <div
        data-testid="pixel-office-canvas"
        className="relative mx-auto flex items-center justify-center overflow-hidden"
        style={{
          height: `${outerCanvasHeight}px`,
          minHeight: `${outerCanvasHeight}px`,
          width: `${Math.round(STAGE_W * effectiveScale)}px`,
        }}
      >
        <div
          data-testid="pixel-office-stage"
          style={{
            width: `${STAGE_W}px`,
            height: `${STAGE_H}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${effectiveScale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: isHighResDesktop ? `${Math.max(0, Math.round((outerCanvasHeight - scaledHeight) / 2))}px` : 0,
          }}
          className="relative overflow-hidden rounded-xl shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            width={STAGE_W}
            height={STAGE_H}
            style={{
              width: `${STAGE_W}px`,
              height: `${STAGE_H}px`,
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
          <canvas
            ref={doorCanvasRef}
            data-testid="limezu-door-canvas"
            width={STAGE_W}
            height={STAGE_H}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-15 h-full w-full"
            style={{
              width: `${STAGE_W}px`,
              height: `${STAGE_H}px`,
              imageRendering: 'pixelated',
            }}
          />

          <svg
            data-testid="swarm-telemetry-links"
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            className="pointer-events-none absolute inset-0 z-15 overflow-visible"
          >
            {(() => {
              const zoneByCanonicalId = new Map<string, (typeof normalizedZones)[number]>();
              for (const z of normalizedZones) {
                zoneByCanonicalId.set(z.canonicalId, z);
              }

              const byAgentId = new Map<string, (typeof allStations)[number]>();
              const bySeatId = new Map<string, (typeof allStations)[number]>();
              for (const s of allStations) {
                if (s.agent_id) byAgentId.set(s.agent_id, s);
                if (s.seat_id) bySeatId.set(s.seat_id, s);
              }

              const matchesProjectFilter = (projectKey?: string | null) =>
                !selectedProjectFilter ||
                selectedProjectFilter === 'ALL' ||
                !projectKey ||
                projectKey === selectedProjectFilter;

              // 1) Room Activity & SOP Watermarks
              const roomWatermarks = normalizedZones.map((zone) => {
                const { x: rx, y: ry, w: rw, h: rh } = zone.pixelRect;
                const sopBadge = String(zone.sop_id || zone.canonicalId)
                  .toUpperCase()
                  .slice(0, 18);
                const sopBadgeW = Math.max(46, Math.min(Math.max(46, rw - 16), Math.round(sopBadge.length * 5.6 + 10)));
                const workCnt = workingCountByRoom[zone.canonicalId] || 0;
                const hitlCnt = hitlCountByRoom[zone.canonicalId] || 0;
                const isHitlRoom = hitlCnt > 0;
                const statusLabel = isHitlRoom ? `⏳${hitlCnt}` : `⚡${workCnt}`;

                return (
                  <g key={`room-wm-${zone.canonicalId}`}>
                    <g
                      data-testid={`pixel-room-sop-${zone.canonicalId}`}
                      transform={`translate(${rx + 8}, ${ry + rh - 20})`}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={sopBadgeW}
                        height={14}
                        rx={2}
                        fill="#0D121C"
                        fillOpacity="0.74"
                        stroke="#94A3B8"
                        strokeOpacity="0.35"
                        strokeWidth="1"
                      />
                      <text
                        x={5}
                        y={10}
                        fill="#E2E8F0"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {sopBadge}
                      </text>
                    </g>
                    {(workCnt > 0 || hitlCnt > 0) && (
                      <g
                        data-testid={`pixel-room-status-${zone.canonicalId}`}
                        transform={`translate(${rx + rw - 52}, ${ry + 8})`}
                      >
                        <rect
                          x={0}
                          y={0}
                          width={44}
                          height={15}
                          rx={3}
                          fill={isHitlRoom ? '#78350F' : '#064E3B'}
                          fillOpacity="0.92"
                          stroke={isHitlRoom ? '#FBBF24' : '#34D399'}
                          strokeWidth="1"
                        />
                        <text
                          x={22}
                          y={10.5}
                          textAnchor="middle"
                          fill={isHitlRoom ? '#FBBF24' : '#34D399'}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="700"
                        >
                          {statusLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              });

              // 2) Verified Contract Flight Streams
              const verifiedPairs: Array<{
                key: string;
                contractId: string;
                supId: string;
                status: string;
                lead: (typeof allStations)[number];
                support: (typeof allStations)[number];
              }> = [];
              for (const c of contracts) {
                if (c.status === 'DONE') continue;
                if (!matchesProjectFilter(c.project_key)) continue;
                const lead = byAgentId.get(c.lead_agent_id);
                if (!lead) continue;
                for (const supId of c.support_agent_ids || []) {
                  const support = byAgentId.get(supId);
                  if (support && support.seat_id !== lead.seat_id) {
                    verifiedPairs.push({
                      key: `link-${c.id}-${supId}`,
                      contractId: c.id,
                      supId,
                      status: c.status,
                      lead,
                      support,
                    });
                  }
                }
              }

              const contractFlights = verifiedPairs.map(
                ({ key, contractId, supId, status, lead, support }, lIdx) => {
                  const x1 = lead.pixelCoords.x;
                  const y1 = lead.pixelCoords.y;
                  const x2 = support.pixelCoords.x;
                  const y2 = support.pixelCoords.y;
                  const cx = Math.round((x1 + x2) / 2);
                  const cy = Math.max(96, Math.min(STAGE_H - 96, Math.round((y1 + y2) / 2) - 22));
                  const t = ((animTick * 4 + lIdx * 17) % 100) / 100;
                  const px = Math.round(
                    (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2,
                  );
                  const py = Math.round(
                    (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2,
                  );
                  const strokeColor = status === 'AWAITING_HITL' ? '#FBBF24' : '#34D399';
                  return (
                    <g key={key} data-testid={`pixel-contract-flight-${contractId}-${supId}`}>
                      <path
                        d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.62"
                        strokeDasharray="5 4"
                        strokeDashoffset={-(animTick * 3)}
                      />
                      <rect
                        x={px - 3}
                        y={py - 3}
                        width={6}
                        height={6}
                        rx={1}
                        fill={strokeColor}
                        stroke="#0D121C"
                        strokeWidth="1"
                      />
                    </g>
                  );
                },
              );

              // 3) Spawned Subagent Cyber-Tethers & Crisp Pixel Scout Nodes
              const subagentEntries: Array<{
                beeId: string;
                label: string;
                isActive: boolean;
                parentX: number | null;
                parentY: number | null;
                sx: number;
                sy: number;
              }> = [];
              const seenSubBeeIds = new Set<string>();

              const pushSubagent = (
                sub: OpenOfficeColonyBee,
                fallbackParent?: (typeof allStations)[number] | null,
              ) => {
                if (!sub.bee_id || seenSubBeeIds.has(sub.bee_id)) return;
                if (!matchesProjectFilter(sub.project_key)) return;
                seenSubBeeIds.add(sub.bee_id);

                const parentStation =
                  (sub.parent_bee_id
                    ? bySeatId.get(sub.parent_bee_id) || byAgentId.get(sub.parent_bee_id)
                    : undefined) ||
                  (sub.seat_id ? bySeatId.get(sub.seat_id) : undefined) ||
                  fallbackParent ||
                  null;

                const pX =
                  parentStation && Number.isFinite(parentStation.pixelCoords.x)
                    ? Math.round(parentStation.pixelCoords.x)
                    : null;
                const pY =
                  parentStation && Number.isFinite(parentStation.pixelCoords.y)
                    ? Math.round(parentStation.pixelCoords.y)
                    : null;

                const idx = subagentEntries.length;
                const angle = idx * 2.15 + animTick * 0.06;
                let rawX: number;
                let rawY: number;

                if (pX !== null && pY !== null) {
                  rawX = pX + Math.cos(angle) * 34;
                  rawY = pY + Math.sin(angle) * 28;
                } else {
                  const canonicalRid = resolveCanonicalZoneId(sub.zone_id, zones);
                  const targetZone = zoneByCanonicalId.get(canonicalRid) || normalizedZones[0];
                  const roomCx = targetZone
                    ? targetZone.pixelRect.x + targetZone.pixelRect.w / 2
                    : STAGE_W / 2;
                  const roomCy = targetZone
                    ? targetZone.pixelRect.y + targetZone.pixelRect.h / 2
                    : STAGE_H / 2;
                  rawX = roomCx + Math.cos(angle) * 22;
                  rawY = roomCy + Math.sin(angle) * 16;
                }

                const sx = Math.round(
                  Math.max(24, Math.min(STAGE_W - 24, Number.isFinite(rawX) ? rawX : STAGE_W / 2)),
                );
                const sy = Math.round(
                  Math.max(24, Math.min(STAGE_H - 18, Number.isFinite(rawY) ? rawY : STAGE_H / 2)),
                );
                const stUpper = String(sub.status || '').toUpperCase();
                const isActive =
                  stUpper === 'WORKING' ||
                  stUpper === 'ACTIVE' ||
                  stUpper === 'RUNNING' ||
                  stUpper === 'BUSY';
                const label = String(sub.display_name || sub.username || sub.bee_id)
                  .replace(/^@/, '')
                  .slice(0, 12);

                subagentEntries.push({
                  beeId: sub.bee_id,
                  label,
                  isActive,
                  parentX: pX,
                  parentY: pY,
                  sx,
                  sy,
                });
              };

              for (const st of allStations) {
                if (Array.isArray(st.subagents)) {
                  for (const sub of st.subagents) {
                    pushSubagent(sub, st);
                  }
                }
              }
              for (const cb of colonyBees) {
                if (cb.tier === 'subagent') {
                  pushSubagent(cb, null);
                }
              }

              // 3b) Extra Concurrent Live Sessions (rendered in their resolved SOP rooms)
              const liveSessionEntries: Array<{
                beeId: string;
                label: string;
                parentX: number | null;
                parentY: number | null;
                sx: number;
                sy: number;
              }> = [];
              const seenLiveBeeIds = new Set<string>();
              for (const cb of colonyBees) {
                if (cb.tier !== 'agent' || !cb.bee_id || bySeatId.has(cb.bee_id) || seenLiveBeeIds.has(cb.bee_id)) {
                  continue;
                }
                const stUp = String(cb.status || '').toUpperCase();
                if (stUp !== 'WORKING' && stUp !== 'ACTIVE' && stUp !== 'RUNNING') continue;
                if (!matchesProjectFilter(cb.project_key)) continue;
                seenLiveBeeIds.add(cb.bee_id);

                const parentStation =
                  (cb.parent_bee_id ? bySeatId.get(cb.parent_bee_id) : undefined) ||
                  (cb.seat_id ? bySeatId.get(cb.seat_id) : undefined) ||
                  null;
                const pX =
                  parentStation && Number.isFinite(parentStation.pixelCoords.x)
                    ? Math.round(parentStation.pixelCoords.x)
                    : null;
                const pY =
                  parentStation && Number.isFinite(parentStation.pixelCoords.y)
                    ? Math.round(parentStation.pixelCoords.y)
                    : null;
                const canonicalRid = resolveCanonicalZoneId(cb.zone_id, zones);
                const targetZone = zoneByCanonicalId.get(canonicalRid) || normalizedZones[0];
                const roomCx = targetZone
                  ? targetZone.pixelRect.x + targetZone.pixelRect.w / 2
                  : STAGE_W / 2;
                const roomCy = targetZone
                  ? targetZone.pixelRect.y + targetZone.pixelRect.h / 2
                  : STAGE_H / 2;
                const lIdx = liveSessionEntries.length;
                const angle = lIdx * 1.9 + 0.6;
                const sx = Math.round(Math.max(28, Math.min(STAGE_W - 28, roomCx + Math.cos(angle) * 32)));
                const sy = Math.round(Math.max(28, Math.min(STAGE_H - 22, roomCy + Math.sin(angle) * 20)));
                const label = String(cb.active_tool || cb.username || cb.bee_id).slice(0, 12);
                liveSessionEntries.push({
                  beeId: cb.bee_id,
                  label,
                  parentX: pX,
                  parentY: pY,
                  sx,
                  sy,
                });
              }

              const liveSessionLayer = liveSessionEntries.map((ls) => (
                <React.Fragment key={`live-sess-${ls.beeId}`}>
                  {ls.parentX !== null && ls.parentY !== null && (
                    <path
                      d={`M ${ls.parentX} ${ls.parentY} L ${ls.sx} ${ls.sy}`}
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="1.2"
                      strokeOpacity="0.55"
                      strokeDasharray="3 3"
                    />
                  )}
                  <g
                    data-testid={`pixel-live-session-node-${ls.beeId}`}
                    transform={`translate(${ls.sx}, ${ls.sy})`}
                  >
                    <circle r={5} fill="#10B981" stroke="#064E3B" strokeWidth="1.5" />
                    <circle r={2} fill="#ECFDF5" />
                    <text
                      x={0}
                      y={13}
                      textAnchor="middle"
                      fill="#A7F3D0"
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {ls.label}
                    </text>
                  </g>
                </React.Fragment>
              ));

              const subagentLayer = subagentEntries.map((sn) => (
                <React.Fragment key={`sub-scout-${sn.beeId}`}>
                  {sn.parentX !== null && sn.parentY !== null && (
                    <path
                      data-testid={`pixel-subagent-link-${sn.beeId}`}
                      d={`M ${sn.parentX} ${sn.parentY} L ${sn.sx} ${sn.sy}`}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="1.25"
                      strokeOpacity="0.78"
                      strokeDasharray="3 3"
                    />
                  )}
                  <g
                    data-testid={`pixel-subagent-node-${sn.beeId}`}
                    transform={`translate(${sn.sx}, ${sn.sy})`}
                  >
                    <rect
                      x={-5}
                      y={-5}
                      width={10}
                      height={10}
                      rx={2}
                      fill={sn.isActive ? '#06B6D4' : '#475569'}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                    <rect x={-2} y={-2} width={4} height={4} fill="#ECFEFF" />
                    <text
                      x={0}
                      y={14}
                      textAnchor="middle"
                      fill="#67E8F9"
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {sn.label}
                    </text>
                  </g>
                </React.Fragment>
              ));

              // 4) Live Tool Burst Micro-Pill
              const toolBursts = allStations.map((st) => {
                const isWorkingSt =
                  st.status === 'WORKING' ||
                  st.status === 'ACTIVE' ||
                  st.status === 'BUSY' ||
                  st.status === 'RUNNING' ||
                  Boolean(st.live_telemetry?.is_live_executing);
                const rawTool =
                  st.live_telemetry?.active_tool ||
                  (st.tool_badge && st.tool_badge !== 'idle' ? st.tool_badge : null);
                if (!isWorkingSt || !rawTool) return null;
                const trimmedTool = String(rawTool).trim();
                const shortTool =
                  trimmedTool.length > 16 ? `${trimmedTool.slice(0, 15)}…` : trimmedTool;
                if (!shortTool) return null;
                const pillW = Math.max(46, Math.round((shortTool.length + 2) * 5.2 + 10));
                const bx = Math.max(44, Math.min(STAGE_W - 44, Math.round(st.pixelCoords.x)));
                const by = Math.max(24, Math.min(STAGE_H - 18, Math.round(st.pixelCoords.y + 30)));
                return (
                  <g
                    key={`tool-burst-${st.seat_id}`}
                    data-testid={`pixel-tool-burst-${st.seat_id}`}
                    transform={`translate(${bx}, ${by})`}
                  >
                    <rect
                      x={-pillW / 2}
                      y={0}
                      width={pillW}
                      height={13}
                      rx={3}
                      fill="#0F172A"
                      fillOpacity="0.92"
                      stroke="#34D399"
                      strokeOpacity="0.82"
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={9.5}
                      textAnchor="middle"
                      fill="#A7F3D0"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {`⚙ ${shortTool}`}
                    </text>
                  </g>
                );
              });

              return (
                <>
                  {roomWatermarks}
                  {contractFlights}
                  {subagentLayer}
                  {liveSessionLayer}
                  {toolBursts}
                </>
              );
            })()}
          </svg>

          {normalizedZones.map((zone) => {
            const isSelectedZone = activeCanonicalZone === zone.canonicalId;
            const plaqueTopClass = 'top-1';
            const hasRightStatusPill =
              (workingCountByRoom[zone.canonicalId] || 0) > 0 ||
              (hitlCountByRoom[zone.canonicalId] || 0) > 0;
            const plaqueLeft =
              hasRightStatusPill && zone.pixelRect.w < 480 ? 'calc(50% - 22px)' : '50%';

            return (
              <React.Fragment key={zone.id}>
                <div
                  data-testid={`zone-${zone.id}`}
                  aria-label={zone.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectZone?.(zone.canonicalId);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${zone.pixelRect.x}px`,
                    top: `${zone.pixelRect.y}px`,
                    width: `${zone.pixelRect.w}px`,
                    height: `${zone.pixelRect.h}px`,
                  }}
                  className={`group z-10 cursor-pointer rounded-xl transition-all ${
                    isSelectedZone
                      ? 'ring-2 ring-primary bg-primary/6 shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_28%,transparent)]'
                      : 'hover:ring-1 hover:ring-primary/40'
                  }`}
                >
                  <button
                    type="button"
                    data-testid={`room-plaque-${zone.canonicalId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectZone?.(zone.canonicalId);
                    }}
                    style={{
                      fontSize: stageLabelFontPx,
                      lineHeight: 1.15,
                      left: plaqueLeft,
                    }}
                    className={`hidden sm:inline-flex absolute ${plaqueTopClass} z-20 -translate-x-1/2 whitespace-nowrap rounded-full ${
                      effectiveScale < 0.55 || zone.pixelRect.w < 260 ? 'px-2 py-0.5' : 'px-3 py-0.5'
                    } font-medium transition-all ${
                      isSelectedZone
                        ? 'border border-primary bg-[#202540] text-white shadow-md'
                        : 'border border-white/80 bg-white/92 text-[#3F3A36] backdrop-blur-xs hover:bg-white'
                    }`}
                  >
                    {zone.name}
                  </button>
                </div>

                {zone.canonicalId !== zone.id && (
                  <div
                    data-testid={`zone-${zone.canonicalId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectZone?.(zone.canonicalId);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${zone.pixelRect.x}px`,
                      top: `${zone.pixelRect.y}px`,
                      width: `${zone.pixelRect.w}px`,
                      height: `${zone.pixelRect.h}px`,
                    }}
                    className="pointer-events-none hidden"
                  />
                )}
              </React.Fragment>
            );
          })}

          {allStations.map((station, idx) => {
            const isSelected = selectedStationId === station.seat_id;
            const isWorking =
              station.status === 'WORKING' ||
              station.status === 'ACTIVE' ||
              station.status === 'BUSY' ||
              station.status === 'RUNNING' ||
              Boolean(station.live_telemetry?.is_live_executing);
            const isAwaitingHitl = station.status === 'AWAITING_HITL';
            const isIdle = station.status === 'IDLE';
            const workload = computeAgentWorkloadAndStage(station, contracts, locale, zones);
            const isCelebrating =
              effectsEnabled &&
              Boolean(station.agent_id && celebrateAgentIds.includes(station.agent_id));
            const bob = isMotionActive ? ((animTick + idx * 3) % 8 < 4 ? 0 : -1) : 0;
            const walkPhase = station.isWalking ? (((animTick + idx) >> 1) % 2 === 0 ? 1 : 2) : 0;
            const walkFrame = station.isWalking ? (animTick + idx) % 6 : 0;

            const px = station.pixelCoords.x;
            const py = station.pixelCoords.y;
            const pillShiftX = 0;
            const chipShiftX =
              px < 98 ? 98 - px : px > STAGE_W - 98 ? STAGE_W - 98 - px : 0;
            const depthZ = isSelected ? 42 : Math.min(36, 18 + Math.round(py / 36));

            const agentHandle = formatAgentHandle(station.agent_name, station.agent_id);
            const toolIcon = getDeskToolBadge(station.tool_badge, station.role, station.status).icon;

            const nametagBorder = isSelected
              ? 'border-primary ring-2 ring-primary/60'
              : workload.isOverloaded
                ? 'border-red-500/90 ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.35)]'
                : isWorking
                  ? 'border-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                  : isAwaitingHitl
                    ? 'border-amber-400/90'
                    : isIdle
                      ? 'border-white/15'
                      : 'border-sky-400/50';

            const isHovered = hoveredStationId === station.seat_id;
            const liveBubbleText =
              station.live_telemetry?.focus_text ||
              station.live_telemetry?.action_label ||
              station.activity_bubble;
            const placeBubbleBelow = py < 145;
            const shouldRenderActivityBubble =
              Boolean(liveBubbleText) &&
              (effectiveScale >= 0.72 || isSelected || isHovered);

            return (
              <div
                key={station.seat_id}
                data-testid={`station-${station.seat_id}`}
                role="button"
                tabIndex={0}
                aria-label={`${station.agent_name} (${station.zone_name})`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectStation(station.seat_id);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${px}px`,
                  top: `${py}px`,
                  zIndex: depthZ,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStation(station.seat_id);
                }}
                onMouseEnter={() => setHoveredStationId(station.seat_id)}
                onMouseLeave={() => setHoveredStationId(null)}
                className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                title={`${station.agent_name} · ${workload.detailedStageLabel || workload.stageLabel} — ${liveBubbleText || ''}`}
              >
                {shouldRenderActivityBubble && (
                  <div
                    data-testid={`agent-live-chip-${station.seat_id}`}
                    style={{
                      ...(chipShiftX ? { transform: `translateX(${chipShiftX}px)` } : {}),
                      fontSize: stageLabelFontPx,
                      lineHeight: 1.15,
                    }}
                    className={`pointer-events-none absolute left-1/2 ${
                      placeBubbleBelow ? 'top-full mt-0.5' : 'bottom-full mb-1.5'
                    } z-45 w-max max-w-[164px] -translate-x-1/2 rounded-2xl border-2 px-2.5 py-1 font-semibold transition-opacity ${
                      isWorking
                        ? 'border-[#171917] bg-[#FFFDF9] text-[#171917] shadow-[0_8px_16px_rgba(0,0,0,0.28)]'
                        : 'border-[#2B2436] bg-[#FFF7F9] text-[#2B2436] shadow-md'
                    } ${isSelected || isHovered ? 'opacity-95' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <span className="block truncate">
                      {isWorking ? '⚡ ' : '💡 '}
                      {liveBubbleText}
                    </span>
                    {!placeBubbleBelow && (
                      <span
                        aria-hidden="true"
                        className={`absolute -bottom-1.5 left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 ${
                          isWorking
                            ? 'border-[#171917] bg-[#FFFDF9]'
                            : 'border-[#2B2436] bg-[#FFF7F9]'
                        }`}
                      />
                    )}
                  </div>
                )}

                {/* Authentic Gather Human Nametag Pill + Downward Speech Triangle Pointer */}
                <div
                  style={pillShiftX ? { transform: `translateX(${pillShiftX}px)` } : undefined}
                  className="mb-0.5 flex flex-col items-center"
                >
                  <div
                    data-testid={`gather-nametag-${station.seat_id}`}
                    style={{ fontSize: stageLabelFontPx, lineHeight: 1.1 }}
                    className={`flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full border bg-[#0D121C]/90 ${
                      effectiveScale < 0.55 ? 'px-1.5 py-0' : 'px-2.5 py-0.5'
                    } font-medium text-white shadow-md backdrop-blur-xs transition-transform group-hover:scale-105 ${nametagBorder}`}
                  >
                    {isWorking ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34D399]"
                        title="Running · Live execution"
                      />
                    ) : isAwaitingHitl ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-amber-400"
                        title="Awaiting Human Review"
                      />
                    ) : isIdle ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-slate-400"
                        title="Idle · Free in Lounge"
                      />
                    ) : (
                      <span
                        className="size-2 shrink-0 rounded-full border-2 border-sky-400 bg-transparent"
                        title="Standby · Scheduled"
                      />
                    )}
                    <span className="font-semibold tracking-tight text-white">{agentHandle}</span>
                    {(station.live_telemetry?.concurrent_count ?? 0) > 1 && (
                      <span
                        data-testid={`badge-concurrent-${station.seat_id}`}
                        className="rounded bg-emerald-500/25 px-1 font-mono text-xs font-bold text-emerald-200"
                      >
                        ×{station.live_telemetry?.concurrent_count}
                      </span>
                    )}
                    {workload.isOverloaded && (
                      <span
                        data-testid={`badge-overload-${station.seat_id}`}
                        className="rounded bg-red-500/25 px-1 font-mono font-bold text-red-200"
                      >
                        ⚠ {workload.activeCount}
                      </span>
                    )}
                    {effectiveScale >= 0.55 && <span className="leading-none opacity-85">{toolIcon}</span>}
                  </div>
                  <span
                    aria-hidden="true"
                    className="size-0 border-x-4 border-t-4 border-x-transparent border-t-[#0D121C]"
                  />
                </div>

                <div className="relative flex flex-col items-center">
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-1.5 left-1/2 h-3.5 w-10 -translate-x-1/2 rounded-full border-2 border-sky-400/90 motion-safe:animate-ping"
                    />
                  )}
                  {(isWorking || isAwaitingHitl) && (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -bottom-1 left-1/2 h-3.5 w-9 -translate-x-1/2 rounded-full border ${
                        isWorking
                          ? 'border-emerald-400/85 bg-emerald-400/25 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                          : 'border-amber-400/80 bg-amber-400/20'
                      }`}
                    />
                  )}
                  {isCelebrating && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping"
                    />
                  )}
                  <PixelAgentAvatar
                    seed={station.agent_name}
                    status={station.status}
                    size={effectiveScale < 0.55 ? 22 : 36}
                    fullBody
                    bobOffset={bob}
                    walkPhase={walkPhase}
                    dir={station.dir}
                    walkFrame={walkFrame}
                    className={
                      `${isCelebrating ? 'animate-bounce ' : ''}${
                        isSelected
                          ? 'drop-shadow-[0_0_8px_var(--primary)]'
                          : 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]'
                      }`
                    }
                  />
                </div>
              </div>
            );
          })}

          {showPets &&
            animatedMascots.map((mascot) => (
              <div
                key={mascot.id}
                data-testid={`mascot-${mascot.id}`}
                style={{
                  position: 'absolute',
                  left: `${mascot.pixelCoords.x}px`,
                  top: `${mascot.pixelCoords.y}px`,
                }}
                className="group pointer-events-auto absolute z-25 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              >
                <div
                  style={{ fontSize: stageLabelFontPx, lineHeight: 1.15 }}
                  className={`pointer-events-none mb-0.5 max-w-[210px] truncate rounded-full border border-[#D4C6B6] bg-white/92 px-2 py-0.5 font-medium text-[#27262A] shadow-sm transition-opacity ${
                    mascot.hasLiveReaction ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {mascot.displayBubble}
                </div>
                <div
                  style={{ fontSize: stageLabelFontPx, lineHeight: 1.15 }}
                  className="mb-0.5 flex min-h-5 items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-[#2B2A2F]/90 px-2 py-0.5 font-medium text-amber-100 shadow-xs"
                >
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span>{mascot.name}</span>
                </div>
                <PixelMascotSprite
                  isDog={mascot.isDog}
                  facingLeft={mascot.facingLeft}
                  walkFrame={mascot.walkFrame}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

const PixelOfficeCanvas = React.memo(PixelOfficeCanvasImpl);
export default PixelOfficeCanvas;
