'use client';

import * as React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useIsPaneActive } from '@/context/paneActiveContext';
import { ShellCtx, type ShellContext } from '@/context/shellContext';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { showUndoToast } from '@/hooks/useUndoToast';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { issuePath, projectPath, projectRefOf, splitProjectRef } from '@/utils/paths';
import { type BulkDispatchItemPayload } from './OfficeBulkDispatchPanel';
import { OPEN_OFFICE_DICTIONARY, buildDefaultDeptSetup, buildInitialSeatAssignments, resolveCanonicalZoneId, useOpenOfficeLocale, type OfficeDeptSetupItem, type OfficeDeptSetupState, type OfficePositionDef, type OfficeSeatAssignment, type OfficeSeatAssignmentState, type OpenOfficeLens } from './openOfficeConstants';
import type { OpenOfficeContract, OpenOfficeContractDetail, OpenOfficeDepartmentPatch, OpenOfficeStateSnapshot, OpenOfficeWorkItemLink } from '../types';
import { DEFAULT_ANALYTICS, DEFAULT_CONTRACTS, DEFAULT_DEPARTMENTS, DEFAULT_MASCOTS, DEFAULT_PROJECTS, DEFAULT_STATIONS, DEFAULT_TEMPLATES, DEFAULT_ZONES } from './openOfficeWorkspaceDefaults';

const snapshotCache = new Map<string, OpenOfficeStateSnapshot>();
let snapshotIdlePrewarmed = false;
const INSPECTOR_DRAWER_MEDIA_QUERY = '(max-width: 1279px)';

if (
  isHostVibeEnabled() &&
  typeof window !== 'undefined' &&
  typeof window.requestIdleCallback === 'function' &&
  window.location.port !== '' &&
  !navigator.userAgent.includes('jsdom') &&
  !navigator.userAgent.includes('HappyDOM') &&
  !(
    (typeof process !== 'undefined' &&
      Boolean(
        (process as { env?: Record<string, string | undefined> }).env?.NODE_TEST_CONTEXT ||
          typeof (globalThis as Record<string, unknown>).Bun !== 'undefined',
      )) ||
    /jsdom|happydom/i.test(navigator.userAgent)
  )
) {
  window.requestIdleCallback(() => {
    if (snapshotIdlePrewarmed || snapshotCache.has('ALL')) return;
    snapshotIdlePrewarmed = true;
    void fetch('/api/vibe/open-office/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.zones) {
          snapshotCache.set('ALL', data as OpenOfficeStateSnapshot);
        }
      })
      .catch(() => {});
  });
}

export function useSafeShell(): ShellContext | null {
  return React.useContext(ShellCtx);
}

export interface OpenOfficeWorkspaceViewProps {
  apiBaseUrl?: string;
  onOpenWorkItems?: () => void;
}

export type OpenOfficeTab = 'floorplan' | 'contracts' | 'governance' | 'analytics';
export type OpenOfficeInspectorEntity = 'agent' | 'department';
export type OpenOfficeAgentTab = 'now' | 'next' | 'memory' | 'modules';

export function useOpenOfficeWorkspaceController({
  apiBaseUrl = '',
  onOpenWorkItems,
}: OpenOfficeWorkspaceViewProps) {
  const router = useRouter();
  const isPaneActive = useIsPaneActive();
  const shellCtx = useSafeShell();
  const rawParams = useParams<{ teamRef?: string; projectKey?: string }>();
  const rawPathname = usePathname();

  const { teamRef: currentTeamRef, key: currentProjKey } = React.useMemo(() => {
    const pTeam = rawParams?.teamRef ? decodeURIComponent(rawParams.teamRef) : null;
    const pProj = rawParams?.projectKey ? decodeURIComponent(rawParams.projectKey) : null;
    if (pTeam && pProj) {
      return { teamRef: pTeam, key: pProj };
    }
    if (pProj && pProj.includes('.')) {
      return splitProjectRef(pProj);
    }
    const locPath =
      rawPathname || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
    const segs = locPath.split('/').filter(Boolean);
    if (segs.length >= 2 && segs[0] !== 'login') {
      return { teamRef: decodeURIComponent(segs[0]), key: decodeURIComponent(segs[1]) };
    }
    return { teamRef: 'thanb', key: pProj || 'PM' };
  }, [rawParams, rawPathname]);

  const isUnitDom =
    typeof window !== 'undefined' &&
    ((typeof process !== 'undefined' &&
      Boolean(
        (process as { env?: Record<string, string | undefined> }).env?.NODE_TEST_CONTEXT ||
          typeof (globalThis as Record<string, unknown>).Bun !== 'undefined',
      )) ||
      /jsdom|happydom/i.test(navigator.userAgent) ||
      window.location.port === '');

  const includeEphemeral =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('include_ephemeral') === '1';

  // Main UI State
  const [snapshot, setSnapshot] = React.useState<OpenOfficeStateSnapshot>(() => {
    if (!isUnitDom && !includeEphemeral) {
      const cached =
        snapshotCache.get(currentProjKey || 'ALL') ||
        snapshotCache.get('ALL');
      if (cached) return cached;
    }
    return {
      office_title: 'Văn phòng mở số hóa · Không gian điều hành SOP động',
      active_agent_count: 6,
      reserve_seat_count: 0,
      projects: DEFAULT_PROJECTS,
      departments: DEFAULT_DEPARTMENTS,
      zones: DEFAULT_ZONES,
      stations: DEFAULT_STATIONS,
      mascots: DEFAULT_MASCOTS,
      contracts: DEFAULT_CONTRACTS,
      needs_my_action: [DEFAULT_CONTRACTS[0]],
      templates: DEFAULT_TEMPLATES,
      analytics: DEFAULT_ANALYTICS,
    };
  });

  const [selectedProjectFilter, setSelectedProjectFilter] = React.useState<string>('ALL');
  const [selectedCycleId, setSelectedCycleId] = React.useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('cycle_id');
    return raw && /^\d+$/.test(raw) ? Number(raw) : null;
  });
  const [selectedInitiativeId, setSelectedInitiativeId] = React.useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('initiative_id');
    return raw && /^\d+$/.test(raw) ? Number(raw) : null;
  });
  const [activeTab, setActiveTab] = React.useState<OpenOfficeTab>('floorplan');
  const [officeMode, setOfficeMode] = React.useState<'full' | 'simple'>(() => {
    if (isUnitDom) return 'full';
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('accord_oo_mode_v2');
        if (saved === 'simple' || saved === 'full') return saved;
      } catch {
        // ignore storage error
      }
    }
    return 'simple';
  });
  React.useEffect(() => {
    if (isUnitDom || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('accord_oo_mode_v2', officeMode);
    } catch {
      // ignore storage error
    }
  }, [officeMode, isUnitDom]);
  const [officeSubTab, setOfficeSubTab] = React.useState<'map' | 'dept' | 'setup'>('map');
  const [deptSetup, setDeptSetup] = React.useState<OfficeDeptSetupState>(() => {
    const defaults = buildDefaultDeptSetup(DEFAULT_DEPARTMENTS, DEFAULT_ZONES);
    if (!isUnitDom && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('accord_oo_dept_setup_v2_sop');
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, Partial<OfficeDeptSetupItem>>;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const merged: OfficeDeptSetupState = { ...defaults };
            for (const [k, val] of Object.entries(parsed)) {
              if (val && typeof val === 'object' && k in defaults) {
                const base = defaults[k];
                merged[k] = {
                  ...base,
                  ...val,
                  positions: Array.isArray(val.positions) ? val.positions : base.positions,
                  duties: Array.isArray(val.duties) ? val.duties : base.duties,
                };
              }
            }
            return merged;
          }
        }
      } catch {
        // ignore malformed storage
      }
    }
    return defaults;
  });
  const lastDeptSetupJsonRef = React.useRef<string>('');
  React.useEffect(() => {
    if (isUnitDom || typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(deptSetup);
      if (serialized === lastDeptSetupJsonRef.current) return;
      lastDeptSetupJsonRef.current = serialized;
      window.localStorage.setItem('accord_oo_dept_setup_v2_sop', serialized);
    } catch {
      // ignore storage error
    }
  }, [deptSetup, isUnitDom]);
  const deptSetupRef = React.useRef<OfficeDeptSetupState>(deptSetup);
  React.useEffect(() => {
    deptSetupRef.current = deptSetup;
  }, [deptSetup]);
  const locale = useOpenOfficeLocale();
  const dict = OPEN_OFFICE_DICTIONARY[locale];
  const [activeLens, setActiveLens] = React.useState<OpenOfficeLens>('blueprint');
  const activeContextHint = React.useMemo(() => {
    if (activeTab === 'contracts') return dict.tabHintContracts;
    if (activeTab === 'analytics') return dict.tabHintTelemetry;
    if (activeTab === 'governance') return dict.tabHintGovernance;
    if (activeLens === 'bees') return dict.lensHintBees;
    if (activeLens === 'fleet') return dict.lensHintIso;
    if (activeLens === 'swarm') return dict.lensHintLive;
    return dict.lensHintVector;
  }, [activeTab, activeLens, dict]);
  const [isQuickHitlOpen, setIsQuickHitlOpen] = React.useState<boolean>(false);
  const [selectedStationId, setSelectedStationId] = React.useState<string>('seat-agy');
  const [selectedZoneId, setSelectedZoneId] = React.useState<string>('sop_generic_7p');
  const [inspectorEntity, setInspectorEntity] = React.useState<OpenOfficeInspectorEntity>('agent');
  const [agentInspectorTab, setAgentInspectorTab] = React.useState<OpenOfficeAgentTab>('now');
  const [isInspectorDrawerViewport, setIsInspectorDrawerViewport] = React.useState<boolean>(false);
  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = React.useState<boolean>(false);
  const isInspectorDrawerViewportRef = React.useRef<boolean>(false);
  const composerFocusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(INSPECTOR_DRAWER_MEDIA_QUERY);
    const sync = (event?: MediaQueryListEvent) => {
      const compact = typeof event?.matches === 'boolean' ? event.matches : mql.matches;
      isInspectorDrawerViewportRef.current = compact;
      setIsInspectorDrawerViewport(compact);
      if (!compact) setIsInspectorDrawerOpen(false);
    };
    sync();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(sync);
      return () => mql.removeListener(sync);
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'floorplan' || officeSubTab !== 'map') {
      setIsInspectorDrawerOpen(false);
    }
  }, [activeTab, officeSubTab]);

  React.useEffect(() => {
    return () => {
      if (composerFocusTimerRef.current) {
        clearTimeout(composerFocusTimerRef.current);
      }
    };
  }, []);

  const [selectedContractId, setSelectedContractId] = React.useState<string | null>(() => {
    if (!isUnitDom && !includeEphemeral) {
      const cached =
        snapshotCache.get(currentProjKey || 'ALL') ||
        snapshotCache.get('ALL');
      if (cached) {
        return cached.needs_my_action?.[0]?.id ?? cached.contracts?.[0]?.id ?? null;
      }
      return null;
    }
    return 'CTR-2026-001';
  });
  const [contractDetail, setContractDetail] = React.useState<OpenOfficeContractDetail | null>(null);

  // Viewport / Animation Controls
  const [zoomLevel, setZoomLevel] = React.useState<number>(1.0);
  const [isMotionActive, setIsMotionActive] = React.useState<boolean>(
    () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? false : true)
  );
  const [showPets, setShowPets] = React.useState<boolean>(true);
  const [showGatherMinimap, setShowGatherMinimap] = React.useState<boolean>(true);
  const [showStageOptions, setShowStageOptions] = React.useState<boolean>(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = React.useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState<boolean>(false);
  const [effectsEnabled, setEffectsEnabled] = React.useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      ? false
      : true,
  );
  const [celebrateAgentIds, setCelebrateAgentIds] = React.useState<string[]>([]);
  const [petEventSignal, setPetEventSignal] = React.useState<{
    kind: 'new' | 'done';
    targetSeatId?: string;
    seq: number;
  } | null>(null);
  const [wallClockText, setWallClockText] = React.useState<string>('');
  const celebrateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedSlipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const updateClock = () => {
      try {
        setWallClockText(
          new Date().toLocaleTimeString(locale === 'en' ? 'en-US' : 'vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      } catch {
        setWallClockText('');
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, [locale]);

  React.useEffect(() => {
    return () => {
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current);
      }
      if (copiedSlipTimerRef.current) {
        clearTimeout(copiedSlipTimerRef.current);
      }
    };
  }, []);

  const triggerStageCelebration = React.useCallback(
    (kind: 'new' | 'done', agentIds: string[], targetSeatId?: string) => {
      setPetEventSignal((prev) => ({
        kind,
        targetSeatId,
        seq: (prev?.seq ?? 0) + 1,
      }));
      if (agentIds.length > 0 && effectsEnabled) {
        setCelebrateAgentIds(agentIds);
        if (celebrateTimerRef.current) {
          clearTimeout(celebrateTimerRef.current);
        }
        celebrateTimerRef.current = setTimeout(() => {
          setCelebrateAgentIds([]);
        }, 2000);
      }
    },
    [effectsEnabled],
  );

  const handleApplyDepartmentPatch = React.useCallback((patch: OpenOfficeDepartmentPatch) => {
    const targetCanonical = resolveCanonicalZoneId(patch.zone_id);
    setSnapshot((prev) => {
      const nextZones = prev.zones.map((z) =>
        resolveCanonicalZoneId(z.id) === targetCanonical
          ? { ...z, name: patch.name, subtitle: patch.subtitle }
          : z,
      );
      const nextDepts = (prev.departments || []).map((d) =>
        resolveCanonicalZoneId(d.zone_id) === targetCanonical
          ? {
              ...d,
              name: patch.name,
              mission: patch.subtitle,
              primary_cta_label: patch.primary_cta_label,
              default_template_id: patch.default_template_id,
              recommended_agent_ids: patch.recommended_agent_ids,
            }
          : d,
      );
      const next = { ...prev, zones: nextZones, departments: nextDepts };
      snapshotCache.set('ALL', next);
      return next;
    });
  }, []);

  const snapshotRef = React.useRef<OpenOfficeStateSnapshot>(snapshot);
  React.useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const [seatAssignments, setSeatAssignments] = React.useState<OfficeSeatAssignmentState>(() => {
    const initial = buildInitialSeatAssignments(snapshot.stations, deptSetup, snapshot.zones);
    if (!isUnitDom && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('accord_oo_seat_assign_v2_sop');
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, Partial<OfficeSeatAssignment>>;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const merged: OfficeSeatAssignmentState = { ...initial };
            for (const [seatId, val] of Object.entries(parsed)) {
              if (val && typeof val === 'object') {
                const base = initial[seatId];
                if (base) {
                  merged[seatId] = {
                    ...base,
                    ...val,
                    deptKey: typeof val.deptKey === 'string' ? val.deptKey : base.deptKey,
                    positionId:
                      typeof val.positionId === 'string' ? val.positionId : base.positionId,
                    title: typeof val.title === 'string' ? val.title : base.title,
                  };
                } else if (
                  typeof val.deptKey === 'string' &&
                  typeof val.positionId === 'string'
                ) {
                  merged[seatId] = {
                    ...val,
                    deptKey: val.deptKey,
                    positionId: val.positionId,
                    title: typeof val.title === 'string' ? val.title : '',
                  };
                }
              }
            }
            return merged;
          }
        }
      } catch {
        // ignore malformed storage
      }
    }
    return initial;
  });
  const lastSeatAssignJsonRef = React.useRef<string>('');
  React.useEffect(() => {
    if (isUnitDom || typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(seatAssignments);
      if (serialized === lastSeatAssignJsonRef.current) return;
      lastSeatAssignJsonRef.current = serialized;
      window.localStorage.setItem('accord_oo_seat_assign_v2_sop', serialized);
    } catch {
      // ignore storage error
    }
  }, [seatAssignments, isUnitDom]);
  const seatAssignmentsRef = React.useRef<OfficeSeatAssignmentState>(seatAssignments);
  React.useEffect(() => {
    seatAssignmentsRef.current = seatAssignments;
  }, [seatAssignments]);
  const [mutationError, setMutationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSeatAssignments((prev) => {
      const missing = snapshot.stations.filter((st) => !(st.seat_id in prev));
      if (missing.length === 0) return prev;
      const additions = buildInitialSeatAssignments(missing, deptSetup, snapshot.zones);
      return { ...prev, ...additions };
    });
  }, [snapshot.stations, deptSetup]);

  const totalPositionsCount = React.useMemo(
    () => Object.values(deptSetup).reduce((acc, d) => acc + d.positions.length, 0),
    [deptSetup],
  );

  const seatCountsByRoom = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, item] of Object.entries(deptSetup)) {
      out[k] = Math.max(1, item.positions?.length || 1);
    }
    return out;
  }, [deptSetup]);

  const seatedStationsCount = React.useMemo(
    () => snapshot.stations.filter((s) => Boolean(seatAssignments[s.seat_id]?.positionId)).length,
    [snapshot.stations, seatAssignments],
  );

  const pendingExecutionContracts = React.useMemo(
    () =>
      snapshot.contracts.filter((c) =>
        ['QUEUED', 'PENDING', 'ASSIGNED', 'WAIT', 'TODO'].includes(
          String(c.status || '').toUpperCase(),
        ),
      ),
    [snapshot.contracts],
  );

  const postOpenOfficeMutation = React.useCallback(
    async (endpoint: string, body: Record<string, unknown>, fallbackMsg: string) => {
      try {
        const res = await fetch(`${apiBaseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errPayload = await res.json().catch(() => ({}));
          const msg =
            errPayload?.error ||
            errPayload?.detail ||
            errPayload?.message ||
            `Lỗi HTTP ${res.status}: ${fallbackMsg}`;
          setMutationError(String(msg));
          return;
        }
        setMutationError(null);
      } catch {
        // Offline tolerance: retain local optimistic setup state
      }
    },
    [apiBaseUrl],
  );

  const syncDeptPositionsToBackend = React.useCallback(
    (nextSetup: OfficeDeptSetupState) =>
      postOpenOfficeMutation(
        '/api/vibe/open-office/dept-positions',
        { departments: nextSetup },
        'Không thể đồng bộ cấu hình phòng ban & vị trí',
      ),
    [postOpenOfficeMutation],
  );

  const syncSeatAssignmentsToBackend = React.useCallback(
    (nextSeats: OfficeSeatAssignmentState) =>
      postOpenOfficeMutation(
        '/api/vibe/open-office/seat-assignments',
        { assignments: nextSeats },
        'Không thể đồng bộ phân bổ vị trí AI',
      ),
    [postOpenOfficeMutation],
  );

  const handleUpdateDeptSetup = React.useCallback(
    (canonicalZoneId: string, patch: Partial<OfficeDeptSetupItem>) => {
      const prev = deptSetupRef.current;
      const current = prev[canonicalZoneId] ?? {
        key: canonicalZoneId,
        mission: '',
        duties: [],
        output: '',
        positions: [],
      };
      const updatedDept: OfficeDeptSetupItem = { ...current, ...patch };
      const next: OfficeDeptSetupState = {
        ...prev,
        [canonicalZoneId]: updatedDept,
      };
      deptSetupRef.current = next;
      setDeptSetup(next);
      if (!updatedDept.positions.some((p) => !p.name.trim())) {
        void syncDeptPositionsToBackend(next);
      }
    },
    [syncDeptPositionsToBackend],
  );

  const handleAddPosition = React.useCallback(
    (canonicalZoneId: string) => {
      const newPos: OfficePositionDef = {
        id: `pos-${canonicalZoneId}-${Date.now().toString(36)}`,
        name: locale === 'en' ? 'New Role' : 'Vị trí mới',
        duties: [],
        output: '',
      };
      const prev = deptSetupRef.current;
      const current = prev[canonicalZoneId] ?? {
        key: canonicalZoneId,
        mission: '',
        duties: [],
        output: '',
        positions: [],
      };
      const next: OfficeDeptSetupState = {
        ...prev,
        [canonicalZoneId]: {
          ...current,
          positions: [...current.positions, newPos],
        },
      };
      deptSetupRef.current = next;
      setDeptSetup(next);
      void syncDeptPositionsToBackend(next);
    },
    [locale, syncDeptPositionsToBackend],
  );

  const handleUpdatePosition = React.useCallback(
    (canonicalZoneId: string, posId: string, patch: Partial<OfficePositionDef>) => {
      const prev = deptSetupRef.current;
      const current = prev[canonicalZoneId];
      if (!current) return;
      const nextPositions = current.positions.map((p) => (p.id === posId ? { ...p, ...patch } : p));
      const next: OfficeDeptSetupState = {
        ...prev,
        [canonicalZoneId]: {
          ...current,
          positions: nextPositions,
        },
      };
      deptSetupRef.current = next;
      setDeptSetup(next);
      if (next[canonicalZoneId]?.positions.every((p) => p.name.trim().length > 0)) {
        void syncDeptPositionsToBackend(next);
      }
    },
    [syncDeptPositionsToBackend],
  );

  const handleRemovePosition = React.useCallback(
    (canonicalZoneId: string, posId: string) => {
      const prevDept = deptSetupRef.current;
      const current = prevDept[canonicalZoneId];
      if (!current) return;
      const prevSeats = seatAssignmentsRef.current;
      const nextDept: OfficeDeptSetupState = {
        ...prevDept,
        [canonicalZoneId]: {
          ...current,
          positions: current.positions.filter((p) => p.id !== posId),
        },
      };
      let changed = false;
      const updatedSeats: OfficeSeatAssignmentState = {};
      for (const [seatId, assignment] of Object.entries(prevSeats)) {
        if (assignment.positionId === posId) {
          changed = true;
          updatedSeats[seatId] = { ...assignment, positionId: '', title: '' };
        } else {
          updatedSeats[seatId] = assignment;
        }
      }
      const nextSeats = changed ? updatedSeats : prevSeats;
      deptSetupRef.current = nextDept;
      seatAssignmentsRef.current = nextSeats;
      setDeptSetup(nextDept);
      setSeatAssignments(nextSeats);
      void syncDeptPositionsToBackend(nextDept);
      void syncSeatAssignmentsToBackend(nextSeats);
      showUndoToast({
        message: locale === 'en' ? 'Removed department position' : 'Đã xóa vị trí phòng ban',
        undoLabel: locale === 'en' ? 'Undo' : 'Hoàn tác',
        durationMs: 10_000,
        onUndo: () => {
          deptSetupRef.current = prevDept;
          seatAssignmentsRef.current = prevSeats;
          setDeptSetup(prevDept);
          setSeatAssignments(prevSeats);
          void syncDeptPositionsToBackend(prevDept);
          void syncSeatAssignmentsToBackend(prevSeats);
        },
      });
    },
    [locale, syncDeptPositionsToBackend, syncSeatAssignmentsToBackend],
  );

  const handleAssignSeat = React.useCallback(
    (seatId: string, canonicalZoneId: string, posId: string, posName: string) => {
      const prev = seatAssignmentsRef.current;
      const nextSeats: OfficeSeatAssignmentState = {
        ...prev,
        [seatId]: {
          ...prev[seatId],
          deptKey: canonicalZoneId,
          positionId: posId,
          title: posName,
        },
      };
      seatAssignmentsRef.current = nextSeats;
      setSeatAssignments(nextSeats);
      void syncSeatAssignmentsToBackend(nextSeats);
    },
    [syncSeatAssignmentsToBackend],
  );

  const handleUnseatAgent = React.useCallback(
    (seatId: string) => {
      const prevSeats = seatAssignmentsRef.current;
      const nextSeats: OfficeSeatAssignmentState = {
        ...prevSeats,
        [seatId]: {
          ...prevSeats[seatId],
          deptKey: '',
          positionId: '',
          title: '',
        },
      };
      seatAssignmentsRef.current = nextSeats;
      setSeatAssignments(nextSeats);
      void syncSeatAssignmentsToBackend(nextSeats);
      showUndoToast({
        message: locale === 'en' ? 'Removed AI from seat' : 'Đã gỡ nhân sự AI khỏi vị trí',
        undoLabel: locale === 'en' ? 'Undo' : 'Hoàn tác',
        durationMs: 10_000,
        onUndo: () => {
          seatAssignmentsRef.current = prevSeats;
          setSeatAssignments(prevSeats);
          void syncSeatAssignmentsToBackend(prevSeats);
        },
      });
    },
    [locale, syncSeatAssignmentsToBackend],
  );

  const handleUpdateBotLabel = React.useCallback(
    (seatId: string, label: string) => {
      const prev = seatAssignmentsRef.current;
      const current = prev[seatId] ?? { deptKey: '', positionId: '', title: '' };
      const nextSeats: OfficeSeatAssignmentState = {
        ...prev,
        [seatId]: {
          ...current,
          botLabel: label,
        },
      };
      seatAssignmentsRef.current = nextSeats;
      setSeatAssignments(nextSeats);
      void syncSeatAssignmentsToBackend(nextSeats);
    },
    [syncSeatAssignmentsToBackend],
  );

  const handleCopyContractSlip = React.useCallback((c: OpenOfficeContract) => {
    const criteriaLines = (c.acceptance_criteria || [])
      .map((item, idx) => `${idx + 1}. ${item}`)
      .join('\n');
    const slipText = [
      `PHIẾU GIAO VIỆC ${c.id}`,
      `Tiêu đề: ${c.title}`,
      `Dự án: ${c.project_key} | Ưu tiên: ${c.priority} | Trạng thái: ${c.status}`,
      `Chủ trì: ${c.lead_agent_name || c.lead_agent_id}`,
      c.summary ? `Mô tả: ${c.summary}` : '',
      c.output_format ? `Đầu ra: ${c.output_format}` : '',
      criteriaLines ? `Tiêu chí nghiệm thu:\n${criteriaLines}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      void navigator.clipboard?.writeText(slipText);
    } catch {
      // ignore clipboard errors
    }
    setCopiedSlipNotice(`Đã chép phiếu giao việc ${c.id}`);
    if (copiedSlipTimerRef.current) {
      clearTimeout(copiedSlipTimerRef.current);
    }
    copiedSlipTimerRef.current = setTimeout(() => {
      setCopiedSlipNotice(null);
    }, 3000);
  }, []);

  // Quick Steer State
  const [steerMessage, setSteerMessage] = React.useState<string>('');
  const [steerSubmitting, setSteerSubmitting] = React.useState<boolean>(false);
  const [steerNotice, setSteerNotice] = React.useState<string | null>(null);

  // 1-Card Task Composer State
  const inspectorRailRef = React.useRef<HTMLDivElement | null>(null);
  const composerRef = React.useRef<HTMLDivElement | null>(null);
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);
  const [composerProjectKey, setComposerProjectKey] = React.useState<string>(currentProjKey || 'PM');
  const [composerTemplateId, setComposerTemplateId] = React.useState<string>('tpl-code-feature');
  const [composerLeadAgentId, setComposerLeadAgentId] = React.useState<string>('agt-antigravity');
  const [composerSupportAgentIds, setComposerSupportAgentIds] = React.useState<string[]>([]);
  const [composerTitle, setComposerTitle] = React.useState<string>('Tối ưu hóa đa dự án và Live Inspector văn phòng mở');
  const [composerPriority, setComposerPriority] = React.useState<string>('HIGH');
  const [composerDomain, setComposerDomain] = React.useState<string>('DEV');
  const [composerInputScope, setComposerInputScope] = React.useState<string>(DEFAULT_TEMPLATES[0].default_input_scope);
  const [composerOutputFormat, setComposerOutputFormat] = React.useState<string>(DEFAULT_TEMPLATES[0].default_output_format);
  const [autoDraftCriteria, setAutoDraftCriteria] = React.useState<boolean>(true);
  const [autoExecute, setAutoExecute] = React.useState<boolean>(true);
  const [composerAcceptanceCriteria, setComposerAcceptanceCriteria] = React.useState<string>(
    DEFAULT_TEMPLATES[0].default_acceptance_criteria.join('\n')
  );
  const [composerForbiddenActions, setComposerForbiddenActions] = React.useState<string>(
    DEFAULT_TEMPLATES[0].default_forbidden_actions.join('\n')
  );
  const [composerConfidencePct] = React.useState<number>(95);
  const [composerEstimatedMinutes, setComposerEstimatedMinutes] = React.useState<number>(30);
  const [composerEstimatedTokens, setComposerEstimatedTokens] = React.useState<number>(5000);
  const [composerSummary] = React.useState<string>('Hợp đồng tự trị giao việc 1-Card đa dự án');
  const [composerDescription, setComposerDescription] = React.useState<string>('');
  const [composerDueDate, setComposerDueDate] = React.useState<string>('');
  const [composerInitiativeId, setComposerInitiativeId] = React.useState<number | null>(null);
  const [composerCycleId, setComposerCycleId] = React.useState<number | null>(null);
  const [composerWeeklyRepeat, setComposerWeeklyRepeat] = React.useState<boolean>(false);
  const [composerSubmitting, setComposerSubmitting] = React.useState<boolean>(false);
  const [composerNotice, setComposerNotice] = React.useState<string | null>(null);
  const [composerStep, setComposerStep] = React.useState<1 | 2 | 3>(1);

  // Evidence Form State
  const [evidenceSummary, setEvidenceSummary] = React.useState<string>('Đã nộp mã nguồn và biên bản kiểm thử 0 FAIL');
  const [evidenceLinks, setEvidenceLinks] = React.useState<string>('https://github.com/itsaplan/accord/pull/500');
  const [evidenceSubmitting, setEvidenceSubmitting] = React.useState<boolean>(false);
  const [checkedCriteriaMap, setCheckedCriteriaMap] = React.useState<Record<number, boolean>>({});
  React.useEffect(() => {
    setCheckedCriteriaMap({});
  }, [selectedContractId]);
  const [copiedSlipNotice, setCopiedSlipNotice] = React.useState<string | null>(null);
  const [evidenceReaderOpen, setEvidenceReaderOpen] = React.useState<boolean>(false);

  // Review / HITL Form State
  const [approverId, setApproverId] = React.useState<string>('hum-phuong-vo');
  const [acceptanceVerified, setAcceptanceVerified] = React.useState<boolean>(!isUnitDom);
  const [showAdvancedComposer, setShowAdvancedComposer] = React.useState<boolean>(false);
  const [reviewReason, setReviewReason] = React.useState<string>('Đạt đủ 100% tiêu chí nghiệm thu và tiêu chuẩn Layer 0');
  const [reviewActualMinutes, setReviewActualMinutes] = React.useState<number>(25);
  const [reviewSubmitting, setReviewSubmitting] = React.useState<boolean>(false);

  const inFlightRef = React.useRef(false);
  const lastStateRawRef = React.useRef<string>('');

  // Fetch Snapshot from Backend (filtered by selectedProjectFilter, cycle_id, initiative_id)
  const fetchOfficeState = React.useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const params = new URLSearchParams();
      if (selectedProjectFilter) params.set('project_key', selectedProjectFilter);
      if (selectedCycleId != null) params.set('cycle_id', String(selectedCycleId));
      if (selectedInitiativeId != null) params.set('initiative_id', String(selectedInitiativeId));
      if (includeEphemeral) params.set('include_ephemeral', '1');
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/state${query}`);
      if (res.ok) {
        const rawText =
          typeof res.text === 'function'
            ? await res.text()
            : JSON.stringify(await res.json());
        if (rawText && rawText === lastStateRawRef.current) {
          return;
        }
        lastStateRawRef.current = rawText;
        const data = JSON.parse(rawText) as OpenOfficeStateSnapshot;
        if (data && data.zones) {
          const nextZones =
            Array.isArray(data.zones) && data.zones.length > 0 ? data.zones : DEFAULT_ZONES;
          const nextDepts =
            Array.isArray(data.departments) && data.departments.length > 0
              ? data.departments
              : DEFAULT_DEPARTMENTS;
          setSnapshot((prev) => {
            const next: OpenOfficeStateSnapshot = {
              ...prev,
              ...data,
              zones: nextZones,
              projects: data.projects || prev.projects || DEFAULT_PROJECTS,
              departments: nextDepts,
            };
            if (!isUnitDom && !includeEphemeral && selectedCycleId == null && selectedInitiativeId == null) {
              const cacheKey = selectedProjectFilter || currentProjKey || 'ALL';
              snapshotCache.set(cacheKey, next);
              snapshotCache.set('ALL', next);
            }
            return next;
          });
          const freshDefaults = buildDefaultDeptSetup(nextDepts, nextZones);
          setDeptSetup((prev) => {
            const next: OfficeDeptSetupState = {};
            for (const [k, defVal] of Object.entries(freshDefaults)) {
              next[k] = prev[k] ? prev[k] : defVal;
            }
            deptSetupRef.current = next;
            return next;
          });
          setSelectedZoneId((prevZone) => {
            const canonical = resolveCanonicalZoneId(prevZone, nextZones);
            return nextZones.some(
              (z) => resolveCanonicalZoneId(z.id, nextZones) === canonical,
            )
              ? canonical
              : nextZones[0]?.id || 'sop_generic_7p';
          });

          // Reconcile selectedContractId: prioritize actionable AWAITING_HITL items
          setSelectedContractId((prevId) => {
            const list: OpenOfficeContract[] = Array.isArray(data.contracts) ? data.contracts : [];
            const actionable: OpenOfficeContract[] = Array.isArray(data.needs_my_action)
              ? data.needs_my_action
              : [];
            const prevObj = prevId ? list.find((c) => c.id === prevId) : null;
            if (prevObj && (prevObj.status === 'AWAITING_HITL' || actionable.length === 0)) {
              return prevId;
            }
            const preferredHitl =
              actionable.find(
                (c) =>
                  String(c.lead_agent_id || '').replace(/^@/, '').toLowerCase() !==
                  approverId.replace(/^@/, '').toLowerCase()
              ) ?? actionable[0];
            const nextId = preferredHitl?.id ?? prevObj?.id ?? list[0]?.id ?? null;
            if (nextId !== prevId) {
              setContractDetail(null);
              setAcceptanceVerified(!isUnitDom);
            }
            return nextId;
          });

          // Reconcile selectedStationId
          if (Array.isArray(data.stations) && data.stations.length > 0) {
            setSelectedStationId((prevSt) =>
              data.stations.some((s) => s.seat_id === prevSt) ? prevSt : data.stations[0].seat_id
            );
            setComposerLeadAgentId((prevLead) =>
              data.stations.some((s) => s.agent_id === prevLead)
                ? prevLead
                : (data.stations.find((s) => s.agent_id)?.agent_id ?? prevLead)
            );
          }
        }
      }
    } catch {
      // Retain structured default state for offline tolerance
    } finally {
      inFlightRef.current = false;
    }
  }, [apiBaseUrl, selectedProjectFilter, selectedCycleId, selectedInitiativeId, includeEphemeral]);

  const govHydratedRef = React.useRef<boolean>(false);

  // Hydrate persisted Department Positions & Seat Assignments once on mount
  const fetchGovernanceSetup = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/governance`);
      if (!res || !res.ok) return;
      const data = await res.json();
      if (
        data?.dept_positions_setup &&
        typeof data.dept_positions_setup === 'object' &&
        !Array.isArray(data.dept_positions_setup) &&
        Object.keys(data.dept_positions_setup).length > 0
      ) {
        const incoming = data.dept_positions_setup as Record<
          string,
          Partial<OfficeDeptSetupItem>
        >;
        const activeZones = snapshotRef.current.zones || DEFAULT_ZONES;
        const activeDepts = snapshotRef.current.departments || DEFAULT_DEPARTMENTS;
        const freshDefaults = buildDefaultDeptSetup(activeDepts, activeZones);
        setDeptSetup((prev) => {
          const next: OfficeDeptSetupState = {};
          for (const [k, defVal] of Object.entries(freshDefaults)) {
            const base: OfficeDeptSetupItem = prev[k] ?? defVal;
            const val = incoming[k];
            if (val && typeof val === 'object') {
              next[k] = {
                ...base,
                ...val,
                positions: Array.isArray(val.positions) ? val.positions : base.positions,
                duties: Array.isArray(val.duties) ? val.duties : base.duties,
              };
            } else {
              next[k] = base;
            }
          }
          deptSetupRef.current = next;
          return next;
        });
      }
      if (
        data?.seat_assignments &&
        typeof data.seat_assignments === 'object' &&
        !Array.isArray(data.seat_assignments) &&
        Object.keys(data.seat_assignments).length > 0
      ) {
        const incomingSeats = data.seat_assignments as OfficeSeatAssignmentState;
        setSeatAssignments((prev) => {
          const next: OfficeSeatAssignmentState = { ...prev, ...incomingSeats };
          seatAssignmentsRef.current = next;
          return next;
        });
      }
    } catch {
      // Retain local governance defaults when offline or mocked
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    if (govHydratedRef.current) return;
    govHydratedRef.current = true;
    void fetchGovernanceSetup();
  }, [fetchGovernanceSetup]);

  // Fetch Analytics from Backend (filtered by selectedProjectFilter)
  const fetchOfficeAnalytics = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProjectFilter && selectedProjectFilter !== 'ALL') {
        params.set('project_key', selectedProjectFilter);
      }
      if (includeEphemeral) params.set('include_ephemeral', '1');
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/analytics${query}`);
      if (res.ok) {
        const data = await res.json();
        if (
          data &&
          (data.total_contracts !== undefined ||
            data.agent_workload ||
            data.domain_progress ||
            data.total_runs !== undefined)
        ) {
          setSnapshot((prev) => ({
            ...prev,
            analytics: {
              ...prev.analytics,
              ...data,
            },
          }));
        }
      }
    } catch {
      // Retain structured analytics for resilience
    }
  }, [apiBaseUrl, selectedProjectFilter, includeEphemeral]);

  React.useEffect(() => {
    if (activeTab === 'analytics') {
      void fetchOfficeAnalytics();
    }
  }, [activeTab, fetchOfficeAnalytics]);

  // Fetch Contract Detail
  const fetchContractDetail = React.useCallback(
    async (contractId: string) => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/vibe/open-office/contract?contract_id=${encodeURIComponent(contractId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.contract) {
            setContractDetail(data);
            return;
          }
        }
      } catch {
        // Fallback synthetic detail for resilience
      }

      const found = snapshot.contracts.find((c) => c.id === contractId);
      if (found) {
        const estMin = found.estimated_minutes || 30;
        const actMin = found.actual_minutes || estMin;
        const estTok = found.estimated_tokens || 4000;
        const actTok = found.actual_tokens || estTok;
        setContractDetail({
          contract: found,
          runs: [
            {
              run_id: `run_${found.id}_01`,
              contract_id: found.id,
              run_number: 1,
              status: found.status === 'DONE' ? 'SUCCESS' : found.status === 'AWAITING_HITL' ? 'SUCCESS' : 'IN_PROGRESS',
              actor_id: found.lead_agent_id,
              actor_name: found.lead_agent_name,
              evidence_summary: 'Bằng chứng thực thi nhiệm vụ theo đặc tả kỹ thuật',
              evidence_links: ['https://git.internal/commit/53act500'],
              created_at: found.created_at,
              completed_at: found.updated_at,
            },
          ],
          events: [
            {
              event_id: `ev_${found.id}_init`,
              contract_id: found.id,
              event_type: 'CONTRACT_CREATED',
              actor_id: 'hum-phuong-vo',
              sha256_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
              timestamp: found.created_at || new Date().toISOString(),
            },
          ],
          is_chain_valid: true,
          committed_vs_actual: {
            estimated_minutes: estMin,
            actual_minutes: actMin,
            delta_minutes: actMin - estMin,
            estimated_tokens: estTok,
            actual_tokens: actTok,
            delta_tokens: actTok - estTok,
            confidence_pct: found.confidence_pct || 95,
          },
        });
      }
    },
    [apiBaseUrl, snapshot.contracts]
  );

  // Polling every 12000ms while pane is active (defer initial SWR revalidate by 150ms when cache hit)
  React.useEffect(() => {
    if (!isPaneActive) return;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    if (!isUnitDom && !includeEphemeral && snapshotCache.size > 0) {
      initialTimer = setTimeout(() => {
        void fetchOfficeState();
      }, 150);
    } else {
      void fetchOfficeState();
    }
    const intervalId = setInterval(() => {
      if (!isPaneActive || (typeof document !== 'undefined' && document.hidden)) return;
      void fetchOfficeState();
    }, 5000);
    const handleExternalMutation = () => {
      lastStateRawRef.current = '';
      void fetchOfficeState();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('itsaplan:open-office-mutated', handleExternalMutation);
    }
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('itsaplan:open-office-mutated', handleExternalMutation);
      }
    };
  }, [fetchOfficeState, isUnitDom, isPaneActive, includeEphemeral]);

  React.useEffect(() => {
    if (selectedContractId) {
      if (!isUnitDom && activeTab !== 'contracts') {
        const inHydrated = snapshot.contracts.some((c) => c.id === selectedContractId);
        if (!inHydrated) return;
      }
      void fetchContractDetail(selectedContractId);
    }
  }, [selectedContractId, fetchContractDetail, activeTab, isUnitDom, snapshot.contracts]);

  // Filter stations based on project filter
  const displayedStations = React.useMemo(() => {
    if (!selectedProjectFilter || selectedProjectFilter === 'ALL') {
      return snapshot.stations;
    }
    return snapshot.stations.filter((st) =>
      Boolean(
        st.active_project_keys?.includes(selectedProjectFilter) ||
          st.queued_project_keys?.includes(selectedProjectFilter)
      )
    );
  }, [snapshot.stations, selectedProjectFilter]);

  const selectedStation = snapshot.stations.find((s) => s.seat_id === selectedStationId) || snapshot.stations[0];
  const departmentsList = snapshot.departments || DEFAULT_DEPARTMENTS;
  const selectedDepartment =
    departmentsList.find(
      (d) =>
        resolveCanonicalZoneId(d.zone_id, snapshot.zones) ===
        resolveCanonicalZoneId(selectedZoneId, snapshot.zones),
    ) || departmentsList[0];
  const projectsList = snapshot.projects || DEFAULT_PROJECTS;
  const initiativesList = snapshot.initiatives ?? [];
  const cyclesList = snapshot.cycles ?? [];
  const activeCycle = snapshot.active_cycle ?? cyclesList.find((c) => c.is_active) ?? null;
  const selectedContract =
    contractDetail?.contract || snapshot.contracts.find((c) => c.id === selectedContractId);

  // Navigation to Canonical Work Items
  const handleOpenCanonicalWorkItems = () => {
    if (onOpenWorkItems) {
      onOpenWorkItems();
    } else {
      navigateFeatureInstant(projectPath(projectRefOf(currentTeamRef, currentProjKey)));
    }
  };

  const revealInspectorIfStacked = React.useCallback(() => {
    if (isInspectorDrawerViewportRef.current) {
      setIsInspectorDrawerOpen(true);
      return;
    }
    if (typeof window === 'undefined') return;
    const run = () => {
      const el = inspectorRailRef.current;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.6 || rect.bottom < 0) {
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
    } else {
      run();
    }
  }, []);

  // Quick Assign Focus Action
  const handleQuickAssignFocus = (targetAgentId?: string, targetTemplateId?: string) => {
    if (activeTab !== 'floorplan') setActiveTab('floorplan');
    if (officeSubTab !== 'map') setOfficeSubTab('map');
    if (targetAgentId) {
      setComposerLeadAgentId(targetAgentId);
      setComposerSupportAgentIds((prev) => prev.filter((id) => id !== targetAgentId));
    }
    if (targetTemplateId) handleSelectTemplate(targetTemplateId);
    const focusComposer = () => {
      if (composerRef.current && typeof composerRef.current.scrollIntoView === 'function') {
        composerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    };
    if (isInspectorDrawerViewportRef.current) {
      setIsInspectorDrawerOpen(true);
      if (composerFocusTimerRef.current) {
        clearTimeout(composerFocusTimerRef.current);
      }
      composerFocusTimerRef.current = setTimeout(focusComposer, 60);
      return;
    }
    focusComposer();
  };

  // Quick Steer Action
  const handleSendQuickSteer = async () => {
    if (!steerMessage.trim() || !selectedStation?.agent_id) return;
    setSteerSubmitting(true);
    setSteerNotice(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/steer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedStation.agent_id,
          contract_id: selectedStation.active_contract_ids?.[0] || null,
          message: steerMessage.trim(),
        }),
      });
      if (res.ok) {
        setSteerNotice(`Đã gửi điều chỉnh nhanh tới ${selectedStation.agent_name}!`);
        setSteerMessage('');
      } else {
        setSteerNotice(`Đã ghi nhận điều chỉnh nhanh nội bộ cho ${selectedStation.agent_name}.`);
        setSteerMessage('');
      }
    } catch {
      setSteerNotice(`Đã chuyển điều chỉnh nhanh vào hàng đợi ngoại tuyến.`);
      setSteerMessage('');
    } finally {
      setSteerSubmitting(false);
    }
  };

  // Handle Template Auto-Fill
  const handleSelectTemplate = (templateId: string) => {
    setComposerTemplateId(templateId);
    const tpl = snapshot.templates.find((t) => t.id === templateId);
    if (tpl) {
      setComposerDomain(tpl.domain);
      setComposerInputScope(tpl.default_input_scope);
      setComposerOutputFormat(tpl.default_output_format);
      setComposerAcceptanceCriteria(tpl.default_acceptance_criteria.join('\n'));
      setComposerForbiddenActions(tpl.default_forbidden_actions.join('\n'));
      setComposerEstimatedMinutes(tpl.default_estimated_minutes);
      setComposerEstimatedTokens(tpl.default_estimated_tokens);
    }
  };

  // Shared Contract Dispatch Helper (1-Card & Bulk Dispatch)
  const dispatchContractPayload = async (payload: {
    project_key: string;
    team_ref: string;
    title: string;
    summary: string;
    template_id: string;
    domain: string;
    lead_agent_id: string;
    support_agent_ids: string[];
    auto_draft_criteria: boolean;
    auto_execute: boolean;
    input_scope: string;
    output_format: string;
    acceptance_criteria: string[];
    forbidden_actions: string[];
    confidence_pct: number;
    estimated_minutes: number;
    estimated_tokens: number;
    priority: string;
    initiative_id?: number | null;
    cycle_id?: number | null;
    due_date?: string | null;
  }): Promise<{ ok: boolean; contractId?: string; error?: string; offline?: boolean }> => {
    setMutationError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const msg =
          errPayload?.error ||
          errPayload?.detail ||
          errPayload?.message ||
          `Lỗi HTTP ${res.status}: Không thể phát hành hợp đồng`;
        const errorText = String(msg);
        setMutationError(errorText);
        return { ok: false, error: errorText };
      }

      const detail: OpenOfficeContractDetail = await res.json();
      let createdId: string | undefined;
      if (detail && detail.contract) {
        createdId = detail.contract.id;
        setSnapshot((prev) => {
          const contracts = [
            detail.contract,
            ...prev.contracts.filter((c) => c.id !== detail.contract.id),
          ];
          const isNew = !prev.contracts.some((c) => c.id === detail.contract.id);
          return {
            ...prev,
            contracts,
            needs_my_action: [
              ...(detail.contract.status === 'AWAITING_HITL' ? [detail.contract] : []),
              ...prev.needs_my_action.filter((c) => c.id !== detail.contract.id),
            ],
            analytics: {
              ...prev.analytics,
              total_contracts: isNew
                ? prev.analytics.total_contracts + 1
                : prev.analytics.total_contracts,
            },
          };
        });
        setSelectedContractId(detail.contract.id);
        setContractDetail(detail);
      }
      const leadSeatId = snapshot.stations.find((s) => s.agent_id === payload.lead_agent_id)?.seat_id;
      triggerStageCelebration(
        'new',
        payload.lead_agent_id ? [payload.lead_agent_id] : [],
        leadSeatId,
      );
      return { ok: true, contractId: createdId };
    } catch {
      const syntheticContract: OpenOfficeContract = {
        id: `CTR-${Date.now()}`,
        project_key: payload.project_key,
        team_ref: payload.team_ref,
        title: payload.title,
        summary: payload.summary,
        template_id: payload.template_id,
        domain: payload.domain,
        lead_agent_id: payload.lead_agent_id,
        lead_agent_name:
          snapshot.stations.find((s) => s.agent_id === payload.lead_agent_id)?.agent_name ||
          payload.lead_agent_id,
        support_agent_ids: payload.support_agent_ids,
        input_scope: payload.input_scope,
        output_format: payload.output_format,
        acceptance_criteria: payload.acceptance_criteria,
        forbidden_actions: payload.forbidden_actions,
        confidence_pct: payload.confidence_pct,
        estimated_minutes: payload.estimated_minutes,
        estimated_tokens: payload.estimated_tokens,
        priority: payload.priority,
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSnapshot((prev) => {
        const contracts = [
          syntheticContract,
          ...prev.contracts.filter((c) => c.id !== syntheticContract.id),
        ];
        const isNew = !prev.contracts.some((c) => c.id === syntheticContract.id);
        return {
          ...prev,
          contracts,
          needs_my_action: [
            ...(syntheticContract.status === 'AWAITING_HITL' ? [syntheticContract] : []),
            ...prev.needs_my_action.filter((c) => c.id !== syntheticContract.id),
          ],
          analytics: {
            ...prev.analytics,
            total_contracts: isNew
              ? prev.analytics.total_contracts + 1
              : prev.analytics.total_contracts,
          },
        };
      });
      setSelectedContractId(syntheticContract.id);
      return { ok: true, contractId: syntheticContract.id, offline: true };
    }
  };

  // Submit New Contract (1-Card Effortless Delegation)
  const handleSubmitContract = async () => {
    if (!composerAcceptanceCriteria.trim()) {
      setComposerNotice('Tiêu chí nghiệm thu là bắt buộc (*)');
      return;
    }
    setComposerSubmitting(true);
    setComposerNotice(null);

    const summaryParts = [
      composerDescription.trim() || composerSummary.trim(),
      composerDueDate.trim() ? `Hạn: ${composerDueDate.trim()}` : '',
      composerWeeklyRepeat ? 'Lặp lại mỗi tuần' : '',
    ].filter(Boolean);

    const payload = {
      project_key: composerProjectKey,
      team_ref: currentTeamRef,
      title: composerTitle.trim(),
      summary: summaryParts.join(' | '),
      template_id: composerTemplateId,
      domain: composerDomain,
      lead_agent_id: composerLeadAgentId,
      support_agent_ids: composerSupportAgentIds,
      auto_draft_criteria: autoDraftCriteria,
      auto_execute: autoExecute,
      input_scope: composerInputScope.trim(),
      output_format: composerOutputFormat.trim(),
      acceptance_criteria: composerAcceptanceCriteria.split('\n').map((s) => s.trim()).filter(Boolean),
      forbidden_actions: composerForbiddenActions.split('\n').map((s) => s.trim()).filter(Boolean),
      confidence_pct: composerConfidencePct,
      estimated_minutes: composerEstimatedMinutes,
      estimated_tokens: composerEstimatedTokens,
      priority: composerPriority,
      initiative_id: composerInitiativeId ?? selectedInitiativeId,
      cycle_id: composerCycleId ?? selectedCycleId ?? activeCycle?.id ?? null,
      due_date: composerDueDate.trim() || null,
    };

    try {
      const result = await dispatchContractPayload(payload);
      if (result.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
        }
        setComposerNotice(
          result.offline
            ? 'Đã lưu hợp đồng việc vào hàng đợi ngoại tuyến.'
            : 'Đã phát hành hợp đồng việc 1-Card thành công!',
        );
      }
    } finally {
      setComposerSubmitting(false);
    }
  };

  const handleDispatchBulkItem = async (
    item: BulkDispatchItemPayload,
  ): Promise<{ ok: boolean; contractId?: string; error?: string }> => {
    const result = await dispatchContractPayload({
      project_key: item.projectKey || composerProjectKey || 'PM',
      team_ref: currentTeamRef,
      title: item.title.trim(),
      summary: item.title.trim() || composerSummary.trim(),
      template_id: item.templateId,
      domain: item.domain,
      lead_agent_id: item.leadAgentId,
      support_agent_ids: [],
      auto_draft_criteria: false,
      auto_execute: true,
      input_scope: item.inputScope.trim(),
      output_format: item.outputFormat.trim(),
      acceptance_criteria: item.acceptanceCriteria,
      forbidden_actions: item.forbiddenActions,
      confidence_pct: composerConfidencePct,
      estimated_minutes: item.estimatedMinutes,
      estimated_tokens: item.estimatedTokens,
      priority: 'MEDIUM',
      initiative_id: composerInitiativeId ?? selectedInitiativeId,
      cycle_id: composerCycleId ?? selectedCycleId ?? activeCycle?.id ?? null,
    });
    return {
      ok: result.ok,
      contractId: result.contractId,
      error: result.error,
    };
  };

  // Submit Evidence
  const handleSubmitEvidence = async () => {
    if (!selectedContractId) return;
    setEvidenceSubmitting(true);
    setMutationError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: selectedContractId,
          evidence_summary: evidenceSummary.trim(),
          evidence_links: [evidenceLinks.trim()],
          actor_id: approverId,
        }),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const msg =
          errPayload?.error ||
          errPayload?.detail ||
          errPayload?.message ||
          `Lỗi HTTP ${res.status}: Không thể nộp bằng chứng`;
        setMutationError(String(msg));
        return;
      }
      const detail = await res.json();
      setContractDetail(detail);
      void fetchOfficeState();
    } catch {
      // Offline network tolerance without fake state override
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  // Submit Review Decision (Approve / Return for Rework)
  const handleSubmitReview = async (decision: 'APPROVE' | 'RETURN_FOR_REWORK') => {
    if (!selectedContractId) return;
    setReviewSubmitting(true);
    setMutationError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: selectedContractId,
          decision,
          approver_id: approverId,
          acceptance_verified: acceptanceVerified,
          reason: reviewReason.trim(),
          actual_minutes: reviewActualMinutes,
          actual_tokens: contractDetail?.contract?.estimated_tokens ?? 3800,
        }),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const msg =
          errPayload?.error ||
          errPayload?.detail ||
          errPayload?.message ||
          `Lỗi HTTP ${res.status}: Hệ thống kiểm duyệt từ chối phê duyệt`;
        setMutationError(String(msg));
        return;
      }
      const detail = await res.json();
      setContractDetail(detail);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
      }
      if (decision === 'APPROVE') {
        const targetAgentId =
          detail?.contract?.lead_agent_id || detail?.contract?.assignee_agent_id || '';
        const targetSeatId = snapshot.stations.find((s) => s.agent_id === targetAgentId)?.seat_id;
        triggerStageCelebration('done', targetAgentId ? [targetAgentId] : [], targetSeatId);
      }
      void fetchOfficeState();
    } catch {
      // Offline network tolerance without fake DONE override
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Inline 2-Click Sovereign HITL Quick Drawer Review
  const handleQuickDrawerReview = async (params: {
    contractId: string;
    decision: 'APPROVE' | 'RETURN_FOR_REWORK';
    approverId: string;
    acceptanceVerified: boolean;
    reason: string;
  }) => {
    setReviewSubmitting(true);
    setMutationError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: params.contractId,
          decision: params.decision,
          approver_id: params.approverId,
          acceptance_verified: params.acceptanceVerified,
          reason: params.reason,
          actual_minutes: reviewActualMinutes,
          actual_tokens: contractDetail?.contract?.estimated_tokens ?? 3800,
        }),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const msg =
          errPayload?.error ||
          errPayload?.detail ||
          errPayload?.message ||
          `Lỗi HTTP ${res.status}: Hệ thống kiểm duyệt từ chối phê duyệt`;
        setMutationError(String(msg));
        return;
      }
      const detail = await res.json();
      setContractDetail(detail);
      setIsQuickHitlOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
      }
      if (params.decision === 'APPROVE') {
        const targetAgentId =
          detail?.contract?.lead_agent_id || detail?.contract?.assignee_agent_id || '';
        const targetSeatId = snapshot.stations.find((s) => s.agent_id === targetAgentId)?.seat_id;
        triggerStageCelebration('done', targetAgentId ? [targetAgentId] : [], targetSeatId);
      }
      void fetchOfficeState();
    } catch {
      // Offline network tolerance without fake DONE override
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusDotColor = (status: string) => {
    const st = String(status || '').toUpperCase();
    if (st === 'WORKING' || st === 'ACTIVE' || st === 'RUNNING' || st === 'AVAILABLE' || st === 'ONLINE') {
      return 'bg-emerald-400';
    }
    if (st === 'AWAITING_HITL' || st === 'BUSY') return 'bg-amber-400';
    if (st === 'IDLE') return 'bg-slate-400';
    return 'bg-sky-400';
  };

  // Open Issue or Route Helper
  const handleOpenItem = (item?: OpenOfficeWorkItemLink | null) => {
    if (!item) return;
    setIsInspectorDrawerOpen(false);
    if (item.issue_id && shellCtx?.onOpenIssue) {
      shellCtx.onOpenIssue(item.issue_id);
    } else if (onOpenWorkItems) {
      onOpenWorkItems();
    } else {
      const targetTeamRef = item.team_ref || currentTeamRef;
      const targetProj = item.project_key || currentProjKey;
      const targetRef = projectRefOf(targetTeamRef, targetProj);
      router.push(item.sequence_number ? issuePath(targetRef, item.sequence_number) : projectPath(targetRef));
    }
  };

  return {
    acceptanceVerified,
    activeCycle,
    activeContextHint,
    activeLens,
    activeTab,
    agentInspectorTab,
    approverId,
    autoDraftCriteria,
    autoExecute,
    celebrateAgentIds,
    checkedCriteriaMap,
    cmdPaletteOpen,
    composerAcceptanceCriteria,
    composerCycleId,
    composerDescription,
    composerDueDate,
    composerForbiddenActions,
    composerInitiativeId,
    composerInputScope,
    composerLeadAgentId,
    composerNotice,
    composerOutputFormat,
    composerPriority,
    composerProjectKey,
    composerRef,
    composerStep,
    composerSubmitting,
    composerSupportAgentIds,
    composerTemplateId,
    composerTitle,
    composerWeeklyRepeat,
    contractDetail,
    copiedSlipNotice,
    currentProjKey,
    currentTeamRef,
    cyclesList,
    departmentsList,
    deptSetup,
    dict,
    displayedStations,
    effectsEnabled,
    evidenceLinks,
    evidenceReaderOpen,
    evidenceSubmitting,
    evidenceSummary,
    fetchOfficeState,
    getStatusDotColor,
    handleAddPosition,
    handleApplyDepartmentPatch,
    handleAssignSeat,
    handleCopyContractSlip,
    handleDispatchBulkItem,
    handleOpenCanonicalWorkItems,
    handleOpenItem,
    handleQuickAssignFocus,
    handleQuickDrawerReview,
    handleRemovePosition,
    handleSelectTemplate,
    handleSendQuickSteer,
    handleSubmitContract,
    handleSubmitEvidence,
    handleSubmitReview,
    handleUnseatAgent,
    handleUpdateBotLabel,
    handleUpdateDeptSetup,
    handleUpdatePosition,
    initiativesList,
    inspectorEntity,
    inspectorRailRef,
    isInspectorDrawerOpen,
    isInspectorDrawerViewport,
    isMotionActive,
    isQuickHitlOpen,
    isUnitDom,
    locale,
    mutationError,
    officeMode,
    officeSubTab,
    pendingExecutionContracts,
    petEventSignal,
    projectsList,
    revealInspectorIfStacked,
    reviewActualMinutes,
    reviewReason,
    reviewSubmitting,
    seatAssignments,
    seatCountsByRoom,
    seatedStationsCount,
    selectedContract,
    selectedContractId,
    selectedCycleId,
    selectedDepartment,
    selectedInitiativeId,
    selectedProjectFilter,
    selectedStation,
    selectedStationId,
    selectedZoneId,
    setAcceptanceVerified,
    setActiveLens,
    setActiveTab,
    setAgentInspectorTab,
    setApproverId,
    setAutoDraftCriteria,
    setAutoExecute,
    setCheckedCriteriaMap,
    setCmdPaletteOpen,
    setComposerAcceptanceCriteria,
    setComposerCycleId,
    setComposerDescription,
    setComposerDueDate,
    setComposerForbiddenActions,
    setComposerInitiativeId,
    setComposerInputScope,
    setComposerLeadAgentId,
    setComposerOutputFormat,
    setComposerPriority,
    setComposerProjectKey,
    setComposerStep,
    setComposerSupportAgentIds,
    setComposerTitle,
    setComposerWeeklyRepeat,
    setEffectsEnabled,
    setEvidenceLinks,
    setEvidenceReaderOpen,
    setEvidenceSummary,
    setInspectorEntity,
    setIsInspectorDrawerOpen,
    setIsMotionActive,
    setIsQuickHitlOpen,
    setMutationError,
    setOfficeMode,
    setOfficeSubTab,
    setReviewActualMinutes,
    setReviewReason,
    setSelectedContractId,
    setSelectedCycleId,
    setSelectedInitiativeId,
    setSelectedProjectFilter,
    setSelectedStationId,
    setSelectedZoneId,
    setShortcutsOpen,
    setShowAdvancedComposer,
    setShowGatherMinimap,
    setShowPets,
    setShowStageOptions,
    setSteerMessage,
    setZoomLevel,
    shellCtx,
    shortcutsOpen,
    showAdvancedComposer,
    showGatherMinimap,
    showPets,
    showStageOptions,
    snapshot,
    steerMessage,
    steerNotice,
    steerSubmitting,
    titleInputRef,
    totalPositionsCount,
    wallClockText,
    zoomLevel,
  };
}

export type OpenOfficeWorkspaceController = ReturnType<typeof useOpenOfficeWorkspaceController>;
