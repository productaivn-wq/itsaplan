'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bot,
  Building2,
  List,
  Network,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCompanySettingsQuery } from '@/services/company.service';
import { useProjectsQuery } from '@/services/projects.service';
import { useTeamMembersQuery, useTeamQuery } from '@/services/teams.service';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { openOfficePath } from '@/utils/paths';
import Avatar from '@/components/common/Avatar';
import SearchInput from '@/components/common/SearchInput';
import SectionPageView from '@/components/common/page/SectionPageView';
import SectionPageSkeleton from '@/components/common/skeleton/SectionPageSkeleton';
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
import type {
  OpenOfficeDepartmentDossier,
  OpenOfficeGovernanceSnapshot,
  OpenOfficeStation,
  OpenOfficeZone,
} from '@/features/vibe-canvas/types';
import {
  buildDefaultDeptSetup,
  buildDynamicRoomSpecs,
  buildInitialSeatAssignments,
  resolveCanonicalZoneId,
  type OfficeDeptSetupItem,
  type OfficeDeptSetupState,
  type OfficeSeatAssignmentState,
} from '@/features/vibe-canvas/open-office/openOfficeConstants';
import OrgChartInspectorDrawer, {
  buildAssigneeOptions,
  type OrgAssigneeOption,
} from './OrgChartInspectorDrawer';

interface OpenOfficeOrgStation {
  seat_id: string;
  zone_id: string;
  agent_id?: string;
  agent_name: string;
  username?: string;
  role?: string;
}

interface OpenOfficeOrgSnapshot {
  zones: OpenOfficeZone[];
  stations: OpenOfficeOrgStation[];
  departments: OpenOfficeDepartmentDossier[];
  dept_positions_setup?: OfficeDeptSetupState;
  seat_assignments?: OfficeSeatAssignmentState;
}

const DEPT_STORAGE_KEY = 'accord_oo_dept_setup_v2_sop';
const SEAT_STORAGE_KEY = 'accord_oo_seat_assign_v2_sop';

function normalizeGovDeptToDossier(
  govDept: OpenOfficeGovernanceSnapshot['departments'][number],
): OpenOfficeDepartmentDossier {
  const zoneId = govDept.frontend_zone_id || govDept.id;
  const sopCode = govDept.sop_id || govDept.use_case_id || zoneId.toUpperCase().replace(/_/g, '-');
  return {
    zone_id: zoneId,
    id: govDept.id,
    sop_id: sopCode,
    uc_id: sopCode,
    use_case_id: govDept.use_case_id || sopCode,
    name: govDept.name,
    en_name: govDept.en_name,
    mission: govDept.subtitle,
    subtitle: govDept.subtitle,
    en_subtitle: govDept.en_subtitle,
    primary_skills: govDept.primary_skills,
    default_archetype: govDept.default_archetype,
    default_model_tier: govDept.default_model_tier,
    requires_utop: govDept.requires_utop,
    requires_worktree: govDept.requires_worktree,
    is_spine: govDept.is_spine,
    order: govDept.order,
    visual_slot: govDept.visual_slot,
    primary_cta_label: govDept.primary_cta_label || '',
    default_template_id: govDept.default_template_id || '',
    recommended_agent_ids: Array.isArray(govDept.recommended_agent_ids)
      ? govDept.recommended_agent_ids
      : [],
    active_agent_names: [],
    active_project_keys: [],
    kpis: [],
    featured_items: [],
    module_portals: [],
  };
}

async function fetchOpenOfficeOrgSnapshot(): Promise<OpenOfficeOrgSnapshot> {
  if (!isHostVibeEnabled()) {
    return { zones: [], stations: [], departments: [] };
  }
  try {
    const [stateRes, govRes] = await Promise.all([
      fetch('/api/vibe/open-office/state').catch(() => null),
      fetch('/api/vibe/open-office/governance').catch(() => null),
    ]);
    const stateData =
      stateRes && stateRes.ok
        ? ((await stateRes.json()) as {
            zones?: OpenOfficeZone[];
            stations?: OpenOfficeOrgStation[];
            departments?: OpenOfficeDepartmentDossier[];
          })
        : null;
    const govData =
      govRes && govRes.ok
        ? ((await govRes.json()) as Partial<OpenOfficeGovernanceSnapshot> & {
            dept_positions_setup?: OfficeDeptSetupState;
            seat_assignments?: OfficeSeatAssignmentState;
          })
        : null;

    const zones = Array.isArray(stateData?.zones) ? stateData.zones : [];
    const stations = Array.isArray(stateData?.stations) ? stateData.stations : [];
    const stateDepts = Array.isArray(stateData?.departments) ? stateData.departments : [];
    const govDepts = Array.isArray(govData?.departments)
      ? govData.departments.map(normalizeGovDeptToDossier)
      : [];
    const departments = stateDepts.length > 0 ? stateDepts : govDepts;

    return {
      zones,
      stations,
      departments,
      dept_positions_setup:
        govData?.dept_positions_setup &&
        typeof govData.dept_positions_setup === 'object' &&
        !Array.isArray(govData.dept_positions_setup)
          ? govData.dept_positions_setup
          : undefined,
      seat_assignments:
        govData?.seat_assignments &&
        typeof govData.seat_assignments === 'object' &&
        !Array.isArray(govData.seat_assignments)
          ? govData.seat_assignments
          : undefined,
    };
  } catch {
    return { zones: [], stations: [], departments: [] };
  }
}

function readStoredDeptSetup(
  zones?: OpenOfficeZone[],
  departments?: OpenOfficeDepartmentDossier[],
): OfficeDeptSetupState {
  const defaults = buildDefaultDeptSetup(departments, zones);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(DEPT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, Partial<OfficeDeptSetupItem>>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
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
  } catch {
    return defaults;
  }
}

function readRawStoredDeptOverrides(): Record<string, Partial<OfficeDeptSetupItem>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DEPT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<OfficeDeptSetupItem>>;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toStationStubs(stations: OpenOfficeOrgStation[]): OpenOfficeStation[] {
  return stations.map((s) => ({
    seat_id: s.seat_id,
    seat_type: 'FIXED',
    zone_id: s.zone_id,
    zone_name: s.zone_id,
    coords: { x: 0, y: 0 },
    agent_id: s.agent_id || s.seat_id,
    agent_name: s.agent_name,
    role: s.role || '',
    account_label: s.username || '',
    status: 'ACTIVE',
    activity_bubble: '',
    active_contract_ids: [],
    capabilities: [],
  }));
}

function readStoredSeatAssignments(
  stations: OpenOfficeOrgStation[],
  deptSetup: OfficeDeptSetupState,
  zones?: OpenOfficeZone[],
): OfficeSeatAssignmentState {
  const fallback = buildInitialSeatAssignments(toStationStubs(stations), deptSetup, zones);
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(SEAT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as OfficeSeatAssignmentState;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export default function TeamOrgChartSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const tOrg = useTranslations('teams.orgChart');
  const tManage = useTranslations('teams.manage');
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');

  const companyQuery = useCompanySettingsQuery();
  const teamQuery = useTeamQuery(teamId);
  const membersQuery = useTeamMembersQuery(teamId, { page: 1, pageSize: 100, kind: 'all' });
  const projectsQuery = useProjectsQuery();
  const officeQuery = useQuery({
    queryKey: ['open-office-org-snapshot'],
    queryFn: fetchOpenOfficeOrgSnapshot,
    staleTime: 30_000,
    retry: false,
  });

  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [search, setSearch] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [deptSetup, setDeptSetup] = useState<OfficeDeptSetupState>(() => readStoredDeptSetup());
  const [seatAssignments, setSeatAssignments] = useState<OfficeSeatAssignmentState>({});

  const snapshotZones = useMemo(
    () => officeQuery.data?.zones ?? [],
    [officeQuery.data?.zones],
  );
  const stations = useMemo(() => officeQuery.data?.stations ?? [], [officeQuery.data?.stations]);
  const snapshotDepts = useMemo(
    () => officeQuery.data?.departments ?? [],
    [officeQuery.data?.departments],
  );

  useEffect(() => {
    if (!officeQuery.data) return;
    const defaults = buildDefaultDeptSetup(snapshotDepts, snapshotZones);
    const backendSetup = officeQuery.data.dept_positions_setup ?? {};
    const localOverrides = readRawStoredDeptOverrides();
    setDeptSetup((prev) => {
      const next: OfficeDeptSetupState = {};
      for (const [k, defVal] of Object.entries(defaults)) {
        const backendVal = backendSetup[k];
        const localVal = localOverrides[k];
        const prevVal = k in prev && (k in localOverrides || k in backendSetup) ? prev[k] : undefined;
        let merged = defVal;
        if (backendVal && typeof backendVal === 'object') {
          merged = {
            ...merged,
            ...backendVal,
            positions: Array.isArray(backendVal.positions) ? backendVal.positions : merged.positions,
            duties: Array.isArray(backendVal.duties) ? backendVal.duties : merged.duties,
          };
        }
        if (localVal && typeof localVal === 'object') {
          merged = {
            ...merged,
            ...localVal,
            positions: Array.isArray(localVal.positions) ? localVal.positions : merged.positions,
            duties: Array.isArray(localVal.duties) ? localVal.duties : merged.duties,
          };
        }
        if (prevVal && typeof prevVal === 'object') {
          merged = {
            ...merged,
            ...prevVal,
            positions: Array.isArray(prevVal.positions) ? prevVal.positions : merged.positions,
            duties: Array.isArray(prevVal.duties) ? prevVal.duties : merged.duties,
          };
        }
        next[k] = merged;
      }
      return next;
    });
  }, [officeQuery.data, snapshotDepts, snapshotZones]);

  useEffect(() => {
    const backendSeats = officeQuery.data?.seat_assignments ?? {};
    setSeatAssignments((prev) => {
      if (Object.keys(prev).length > 0 && stations.length === 0 && Object.keys(backendSeats).length === 0) {
        return prev;
      }
      const hydrated = readStoredSeatAssignments(stations, deptSetup, snapshotZones);
      return { ...hydrated, ...backendSeats, ...prev };
    });
  }, [officeQuery.data?.seat_assignments, stations, deptSetup, snapshotZones]);

  const team = teamQuery.data ?? null;
  const company = companyQuery.data ?? null;
  const members = useMemo(() => membersQuery.data?.items ?? [], [membersQuery.data?.items]);
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const primaryProjectRef = useMemo(
    () =>
      projects.find((p) => p.teamId === teamId)?.ref ?? projects[0]?.ref ?? null,
    [projects, teamId],
  );

  const orderedSpecs = useMemo(
    () => buildDynamicRoomSpecs(snapshotZones, snapshotDepts),
    [snapshotZones, snapshotDepts],
  );

  const assigneeOptions = useMemo(
    () => buildAssigneeOptions(members, stations),
    [members, stations],
  );

  const assigneeById = useMemo(() => {
    const map = new Map<string, OrgAssigneeOption>();
    for (const opt of assigneeOptions) {
      map.set(opt.id, opt);
    }
    return map;
  }, [assigneeOptions]);

  // Resolve current occupant label + kind for any positionId
  const occupantByPosId = useMemo(() => {
    const map = new Map<
      string,
      { optionId: string; label: string; kind: 'human' | 'agent' }
    >();
    // 1. Explicit custom seat assignments stored by org chart / seat board
    for (const [key, assign] of Object.entries(seatAssignments)) {
      if (!assign.positionId) continue;
      if (assign.assigneeId && assign.assigneeName) {
        map.set(assign.positionId, {
          optionId: assign.assigneeId,
          label: assign.assigneeName,
          kind: assign.assigneeKind ?? 'human',
        });
        continue;
      }
      const st = stations.find((s) => s.seat_id === key);
      if (st) {
        map.set(assign.positionId, {
          optionId: `station:${st.seat_id}`,
          label: st.agent_name,
          kind: 'agent',
        });
      }
    }
    return map;
  }, [seatAssignments, stations]);

  const deptCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedSpecs
      .map((spec) => {
        const snap = snapshotDepts.find(
          (d) => resolveCanonicalZoneId(d.zone_id || d.id, snapshotZones) === spec.canonicalId,
        );
        const def = deptSetup[spec.canonicalId] ?? {
          key: spec.canonicalId,
          mission: isVi ? snap?.mission || spec.viSubtitle : spec.enSubtitle,
          duties: [isVi ? spec.viSubtitle : spec.enSubtitle],
          output: '',
          positions: [],
        };
        const title = isVi ? snap?.name || spec.viTitle : spec.enTitle;
        const positions = def.positions.map((pos) => ({
          position: pos,
          occupant: occupantByPosId.get(pos.id) ?? null,
        }));
        return { spec, title, def, positions };
      })
      .filter((item) => {
        if (!q) return true;
        if (
          item.title.toLowerCase().includes(q) ||
          item.spec.sopId.toLowerCase().includes(q) ||
          item.spec.ucCode.toLowerCase().includes(q) ||
          item.def.mission.toLowerCase().includes(q)
        ) {
          return true;
        }
        return item.positions.some(
          (p) =>
            p.position.name.toLowerCase().includes(q) ||
            (p.occupant?.label.toLowerCase().includes(q) ?? false),
        );
      });
  }, [orderedSpecs, snapshotDepts, deptSetup, occupantByPosId, search, isVi]);

  const stats = useMemo(() => {
    let totalSeats = 0;
    let filledSeats = 0;
    for (const spec of orderedSpecs) {
      const positions = deptSetup[spec.canonicalId]?.positions ?? [];
      totalSeats += positions.length;
      for (const pos of positions) {
        if (occupantByPosId.has(pos.id)) filledSeats += 1;
      }
    }
    const humanCount = members.filter((m) => m.role !== 'agent').length;
    const agentCount = Math.max(
      members.filter((m) => m.role === 'agent').length,
      stations.length,
    );
    return {
      leadsCount: team?.leads.length ?? 0,
      deptCount: orderedSpecs.length,
      totalSeats,
      filledSeats,
      workforceCount: humanCount + agentCount,
    };
  }, [orderedSpecs, deptSetup, occupantByPosId, members, stations.length, team?.leads.length]);

  const canEdit = team?.role === 'owner' || team?.role === 'manager';

  function handleSaveDepartment(
    canonicalZoneId: string,
    updatedDept: OfficeDeptSetupItem,
    seatSelections: Record<string, string>,
  ) {
    const nextDeptSetup: OfficeDeptSetupState = {
      ...deptSetup,
      [canonicalZoneId]: updatedDept,
    };
    setDeptSetup(nextDeptSetup);
    try {
      window.localStorage.setItem(DEPT_STORAGE_KEY, JSON.stringify(nextDeptSetup));
    } catch {
      // ignore storage quota errors
    }

    const nextAssign: OfficeSeatAssignmentState = {};
    for (const [k, v] of Object.entries(seatAssignments)) {
      if (v.deptKey !== canonicalZoneId) {
        nextAssign[k] = v;
      }
    }
    for (const pos of updatedDept.positions) {
      const optId = seatSelections[pos.id];
      if (!optId) continue;
      const opt = assigneeById.get(optId);
      if (!opt) continue;
      const key = optId.startsWith('station:')
        ? optId.replace(/^station:/, '')
        : `org-${pos.id}`;
      nextAssign[key] = {
        deptKey: canonicalZoneId,
        positionId: pos.id,
        title: pos.name,
        assigneeId: opt.id,
        assigneeName: opt.label,
        assigneeKind: opt.kind,
      };
    }
    setSeatAssignments(nextAssign);
    try {
      window.localStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(nextAssign));
    } catch {
      // ignore storage quota errors
    }

    if (isHostVibeEnabled()) {
      const spec = orderedSpecs.find((s) => s.canonicalId === canonicalZoneId);
      if (spec) {
        void fetch('/api/vibe/open-office/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zone_id: spec.defaultZoneId || canonicalZoneId,
            name: isVi ? spec.viTitle : spec.enTitle,
            subtitle: updatedDept.mission,
          }),
        }).catch(() => {});
      }
      void fetch('/api/vibe/open-office/dept-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments: nextDeptSetup }),
      }).catch(() => {});
      void fetch('/api/vibe/open-office/seat-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: nextAssign }),
      }).catch(() => {});
    }

    toast.success(tOrg('savedToast'));
    setSelectedZoneId(null);
  }

  if (teamQuery.isPending && !team) {
    return <SectionPageSkeleton rows={4} />;
  }

  const activeCard = selectedZoneId
    ? deptCards.find((d) => d.spec.canonicalId === selectedZoneId) ??
      (() => {
        const spec = orderedSpecs.find((s) => s.canonicalId === selectedZoneId);
        if (!spec) return null;
        const def =
          deptSetup[spec.canonicalId] ??
          buildDefaultDeptSetup(snapshotDepts, snapshotZones)[spec.canonicalId];
        if (!def) return null;
        return {
          spec,
          title: isVi ? spec.viTitle : spec.enTitle,
          def,
          positions: def.positions.map((pos) => ({
            position: pos,
            occupant: occupantByPosId.get(pos.id) ?? null,
          })),
        };
      })()
    : null;

  return (
    <SectionPageView
      title={t('sections.orgChart.title')}
      description={t('sections.orgChart.description')}
      wide
      actions={
        primaryProjectRef ? (
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link href={openOfficePath(primaryProjectRef)}>
              <span>{tOrg('openLiveFloor')}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div data-testid="team-org-chart-section" className="space-y-6 pb-8">
        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="space-y-1 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{tOrg('leadershipTitle')}</span>
            </div>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {stats.leadsCount}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5 text-primary" />
              <span>{tOrg('departmentsCount')}</span>
            </div>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {stats.deptCount}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Network className="size-3.5 text-primary" />
              <span>{tOrg('seatsFilled')}</span>
            </div>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {stats.filledSeats} / {stats.totalSeats}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5 text-primary" />
              <span>{tOrg('workforceCount')}</span>
            </div>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {stats.workforceCount}
            </p>
          </div>
        </div>

        {/* View Toggle & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              data-testid="btn-org-view-tree"
              className="h-9 gap-1.5"
              onClick={() => setViewMode('tree')}
            >
              <Network className="size-3.5" />
              <span>{tOrg('treeView')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              data-testid="btn-org-view-table"
              className="h-9 gap-1.5"
              onClick={() => setViewMode('table')}
            >
              <List className="size-3.5" />
              <span>{tOrg('tableView')}</span>
            </Button>
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={tOrg('searchPlaceholder')}
            className="w-72"
          />
        </div>

        {deptCards.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tOrg('noMatches', { query: search })}
          </p>
        ) : viewMode === 'tree' ? (
          <div className="space-y-0">
            {/* Root Leadership Node */}
            <div
              data-testid="org-root-leadership-card"
              className="mx-auto max-w-3xl space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {company?.companyName || team?.name || 'Organization'}
                  </h3>
                  {team?.name && company?.companyName && (
                    <Badge variant="outline">{team.name}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {company?.defaultAutonomyTier ?? 'TIER_1'}
                  </Badge>
                  <Badge variant="outline">
                    {company?.requireSodApproval
                      ? t('authorization.sodOn')
                      : t('authorization.sodOff')}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(team?.leads ?? []).map((lead) => (
                  <div
                    key={lead.userId}
                    className="inline-flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5"
                  >
                    <Avatar
                      name={lead.name || lead.email}
                      image={lead.image}
                      className="size-6 shrink-0 text-xs"
                    />
                    <span className="text-xs font-medium text-foreground">
                      {lead.name || lead.email}
                    </span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {tManage(`roles.${lead.role}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Hierarchy Connector Stem */}
            <div className="mx-auto h-6 w-px bg-border" aria-hidden="true" />
            <div className="mx-12 hidden h-px bg-border xl:block" aria-hidden="true" />
            <div className="h-4" aria-hidden="true" />

            {/* Dynamic SOP Department Nodes */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {deptCards.map(({ spec, title, def, positions }) => {
                const filled = positions.filter((p) => p.occupant !== null).length;
                return (
                  <button
                    key={spec.canonicalId}
                    type="button"
                    data-testid={`org-dept-card-${spec.canonicalId}`}
                    onClick={() => setSelectedZoneId(spec.canonicalId)}
                    className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <Badge variant="outline">{spec.sopId || spec.ucCode}</Badge>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {filled}/{positions.length}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {def.mission}
                      </p>
                    </div>

                    <div className="w-full space-y-2 pt-1">
                      {positions.map(({ position, occupant }) => (
                        <div
                          key={position.id}
                          className="space-y-1 rounded-md bg-muted/40 px-3 py-2"
                        >
                          <div className="truncate text-xs font-medium text-foreground">
                            {position.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {occupant ? (
                              <>
                                {occupant.kind === 'agent' ? (
                                  <Bot className="size-3.5 shrink-0 text-primary" />
                                ) : (
                                  <User className="size-3.5 shrink-0 text-primary" />
                                )}
                                <span className="truncate text-foreground/90">
                                  {occupant.label}
                                </span>
                              </>
                            ) : (
                              <span>{tOrg('openSeat')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table data-testid="org-chart-directory-table" className="min-w-[680px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">{tOrg('colDepartment')}</TableHead>
                  <TableHead className="text-xs">{tOrg('colSeat')}</TableHead>
                  <TableHead className="text-xs">{tOrg('colAssignee')}</TableHead>
                  <TableHead className="text-xs">{tOrg('colKind')}</TableHead>
                  <TableHead className="text-xs">{tOrg('colDeliverable')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptCards.flatMap(({ spec, title, def, positions }) =>
                  positions.map(({ position, occupant }) => (
                    <TableRow
                      key={position.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedZoneId(spec.canonicalId)}
                    >
                      <TableCell className="text-xs font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{spec.sopId || spec.ucCode}</Badge>
                          <span>{title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {position.name}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {occupant ? occupant.label : tOrg('openSeat')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={occupant ? 'secondary' : 'outline'}>
                          {occupant
                            ? occupant.kind === 'agent'
                              ? tOrg('kindAi')
                              : tOrg('kindHuman')
                            : tOrg('kindOpen')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {position.output || def.output}
                      </TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {activeCard && (
        <OrgChartInspectorDrawer
          canonicalZoneId={activeCard.spec.canonicalId}
          ucCode={activeCard.spec.sopId || activeCard.spec.ucCode}
          departmentName={activeCard.title}
          initialDept={activeCard.def}
          initialAssignees={Object.fromEntries(
            activeCard.positions
              .filter((p) => p.occupant !== null)
              .map((p) => [p.position.id, p.occupant!.optionId]),
          )}
          assigneeOptions={assigneeOptions}
          teamRef={team?.ref ?? String(teamId)}
          primaryProjectRef={primaryProjectRef}
          canEdit={Boolean(canEdit)}
          onSave={handleSaveDepartment}
          onClose={() => setSelectedZoneId(null)}
        />
      )}
    </SectionPageView>
  );
}
