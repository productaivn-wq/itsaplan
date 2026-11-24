'use client';

import * as React from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, Building2, Clock, Command, Compass, FileCheck2, FileCode2, GitBranch, Hexagon, LayoutGrid, Maximize2, Network, PanelRightOpen, Pause, Play, ShieldAlert, ShieldCheck, SlidersHorizontal, Sparkles, SquareKanban, Users, ZoomIn, ZoomOut } from 'lucide-react';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { teamSectionPath } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import PixelOfficeCanvas from './PixelOfficeCanvas';
import BeehiveColonyLens from '../open-office/BeehiveColonyLens';
import FleetMatrixLens from '../open-office/FleetMatrixLens';
import CausalSwarmDagLens from '../open-office/CausalSwarmDagLens';
import SovereignHitlQuickDrawer from '../open-office/SovereignHitlQuickDrawer';
import OpenOfficeGovernancePanel from '../open-office/OpenOfficeGovernancePanel';
import OpenOfficeCommandPalette from '../open-office/OpenOfficeCommandPalette';
import { OfficeSubTabs } from '../open-office/OfficeSubTabs';
import { OfficeDeptPositionsTab } from '../open-office/OfficeDeptPositionsTab';
import { OfficeStaffSetupTab } from '../open-office/OfficeStaffSetupTab';
import { OfficeBulkDispatchPanel } from '../open-office/OfficeBulkDispatchPanel';
import { computeAgentWorkloadAndStage } from '../open-office/openOfficeConstants';
import { DEFAULT_DEPARTMENTS } from '../open-office/openOfficeWorkspaceDefaults';
import {
  useOpenOfficeWorkspaceController,
  useSafeShell,
  type OpenOfficeAgentTab,
  type OpenOfficeInspectorEntity,
  type OpenOfficeTab,
  type OpenOfficeWorkspaceViewProps,
} from '../open-office/useOpenOfficeWorkspaceController';
import { OpenOfficeAnalyticsTab } from '../open-office/OpenOfficeAnalyticsTab';
import { OpenOfficeContractsTab } from '../open-office/OpenOfficeContractsTab';
import { OpenOfficeInspectorSidebar, OpenOfficeLiveTeamStrip } from '../open-office/OpenOfficeInspectorSidebar';

export { useSafeShell, type OpenOfficeAgentTab, type OpenOfficeInspectorEntity, type OpenOfficeTab };

export default function OpenOfficeWorkspaceView({
  apiBaseUrl = '',
  onOpenWorkItems,
}: OpenOfficeWorkspaceViewProps) {
  const ctrl = useOpenOfficeWorkspaceController({ apiBaseUrl, onOpenWorkItems });
  const {
    activeContextHint,
    activeCycle,
    activeLens,
    activeTab,
    approverId,
    celebrateAgentIds,
    cmdPaletteOpen,
    composerProjectKey,
    contractDetail,
    currentProjKey,
    currentTeamRef,
    cyclesList,
    departmentsList,
    deptSetup,
    dict,
    displayedStations,
    effectsEnabled,
    fetchOfficeState,
    handleAddPosition,
    handleApplyDepartmentPatch,
    handleAssignSeat,
    handleDispatchBulkItem,
    handleOpenCanonicalWorkItems,
    handleOpenItem,
    handleQuickAssignFocus,
    handleQuickDrawerReview,
    handleRemovePosition,
    handleSelectTemplate,
    handleUnseatAgent,
    handleUpdateBotLabel,
    handleUpdateDeptSetup,
    handleUpdatePosition,
    initiativesList,
    inspectorEntity,
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
    reviewSubmitting,
    seatAssignments,
    seatCountsByRoom,
    seatedStationsCount,
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
    setCmdPaletteOpen,
    setComposerLeadAgentId,
    setComposerOutputFormat,
    setEffectsEnabled,
    setInspectorEntity,
    setIsInspectorDrawerOpen,
    setIsMotionActive,
    setIsQuickHitlOpen,
    setMutationError,
    setOfficeMode,
    setOfficeSubTab,
    setSelectedContractId,
    setSelectedCycleId,
    setSelectedInitiativeId,
    setSelectedProjectFilter,
    setSelectedStationId,
    setSelectedZoneId,
    setShortcutsOpen,
    setShowGatherMinimap,
    setShowPets,
    setShowStageOptions,
    setZoomLevel,
    shortcutsOpen,
    showGatherMinimap,
    showPets,
    showStageOptions,
    snapshot,
    totalPositionsCount,
    wallClockText,
    zoomLevel,
  } = ctrl;

  return (
    <div
      data-testid="open-office-workspace"
      className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth bg-background text-foreground"
    >
      {/* GATHER 2.0 COMPACT SEMANTIC SINGLE-ROW TOP CHROME BAR */}
      <div className="sticky top-0 z-30 flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-1.5 gap-y-1 border-b border-border/80 bg-card/95 px-3 py-1 text-card-foreground backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-border bg-muted/50 p-0.5 sm:rounded-full">
            <button
              type="button"
              onClick={() => setActiveTab('floorplan')}
              data-testid="tab-open-office-floorplan"
              className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                activeTab === 'floorplan'
                  ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                  : 'border border-transparent text-foreground/80 hover:bg-muted'
              }`}
            >
              <Compass className="size-3.5" />
              <span>{dict.tabFloorplan}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('contracts');
                const cur = snapshot.contracts.find((c) => c.id === selectedContractId);
                if ((!cur || cur.status !== 'AWAITING_HITL') && snapshot.needs_my_action.length > 0) {
                  const preferredHitl =
                    snapshot.needs_my_action.find(
                      (c) =>
                        String(c.lead_agent_id || '').replace(/^@/, '').toLowerCase() !==
                        approverId.replace(/^@/, '').toLowerCase()
                    ) ?? snapshot.needs_my_action[0];
                  setSelectedContractId(preferredHitl.id);
                  setAcceptanceVerified(!isUnitDom);
                }
              }}
              data-testid="tab-open-office-contracts"
              className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                activeTab === 'contracts'
                  ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                  : 'border border-transparent text-foreground/80 hover:bg-muted'
              }`}
            >
              <FileCheck2 className="size-3.5" />
              <span>{dict.tabContracts}</span>
              {snapshot.needs_my_action.length > 0 && (
                <span
                  className={`ml-1 rounded-full px-1.5 text-xs font-bold tabular-nums ${
                    activeTab === 'contracts'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-amber-500/20 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {snapshot.needs_my_action.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('governance')}
              data-testid="tab-open-office-governance"
              className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                activeTab === 'governance'
                  ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                  : 'border border-transparent text-foreground/80 hover:bg-muted'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>{dict.tabGovernance}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              data-testid="tab-open-office-analytics"
              className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                activeTab === 'analytics'
                  ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                  : 'border border-transparent text-foreground/80 hover:bg-muted'
              }`}
            >
              <Activity className="size-3.5" />
              <span>{dict.tabTelemetry}</span>
            </button>
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-1.5">
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              data-testid="select-open-office-project-filter"
              className="h-8 max-w-[115px] rounded-md border border-border bg-background px-1.5 text-xs text-foreground"
            >
              <option value="ALL">{dict.allProjects}</option>
              {projectsList.map((p) => (
                <option key={p.key} value={p.key}>
                  [{p.key}] {p.name} ({p.open_issue_count})
                </option>
              ))}
            </select>

            {(activeTab === 'floorplan' || activeTab === 'contracts') &&
              (cyclesList.length > 0 || initiativesList.length > 0) && (
                <div
                  data-testid="open-office-cycle-initiative-bar"
                  className="flex max-w-full flex-wrap items-center gap-1.5"
                >
                  <select
                    value={selectedCycleId ?? ''}
                    onChange={(e) =>
                      setSelectedCycleId(e.target.value ? Number(e.target.value) : null)
                    }
                    data-testid="select-open-office-cycle-filter"
                    aria-label={locale === 'en' ? 'Cycle filter' : 'Lọc theo chu kỳ'}
                    title={
                      activeCycle
                        ? `${locale === 'en' ? 'Active' : 'Đang chạy'}: ${activeCycle.name}`
                        : undefined
                    }
                    className="h-8 max-w-[140px] rounded-md border border-border bg-background px-1.5 text-xs text-foreground"
                  >
                    <option value="">
                      {locale === 'en' ? 'All Cycles' : 'Tất cả chu kỳ'}
                    </option>
                    {cyclesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.is_active ? '● ' : ''}
                        [{c.project_key}] {c.name} ({c.completed_issues}/{c.total_issues})
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedInitiativeId ?? ''}
                    onChange={(e) =>
                      setSelectedInitiativeId(e.target.value ? Number(e.target.value) : null)
                    }
                    data-testid="select-open-office-initiative-filter"
                    aria-label={locale === 'en' ? 'Initiative filter' : 'Lọc theo sáng kiến'}
                    className="h-8 max-w-[190px] rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">
                      {locale === 'en' ? 'All Initiatives' : 'Tất cả sáng kiến'} ({initiativesList.length})
                    </option>
                    {initiativesList.map((ini) => (
                      <option key={ini.id} value={ini.id}>
                        [{ini.project_key}] {ini.title} ({ini.completed_issues}/{ini.total_issues})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {activeTab === 'floorplan' && officeMode === 'full' && (
              <div
                data-testid="lens-switcher"
                className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-border bg-muted/50 p-0.5 sm:rounded-full"
              >
                <button
                  type="button"
                  data-testid="btn-lens-blueprint"
                  onClick={() => setActiveLens('blueprint')}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                    activeLens === 'blueprint'
                      ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="size-3.5" />
                  <span>{dict.lensBlueprint}</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-lens-bees"
                  onClick={() => setActiveLens('bees')}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                    activeLens === 'bees'
                      ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Hexagon className="size-3.5" />
                  <span>{dict.lensBees}</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-lens-fleet"
                  onClick={() => setActiveLens('fleet')}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                    activeLens === 'fleet'
                      ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                  <span>{dict.lensFleet}</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-lens-swarm"
                  onClick={() => setActiveLens('swarm')}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition-colors ${
                    activeLens === 'swarm'
                      ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                      : 'border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <GitBranch className="size-3.5" />
                  <span>{dict.lensSwarm}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden max-w-[160px] items-center overflow-hidden 2xl:flex">
          <span
            data-testid="open-office-lens-hint"
            title={activeContextHint}
            className="truncate text-xs text-muted-foreground"
          >
            {activeContextHint}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {snapshot.needs_my_action.length > 0 && (
            <button
              type="button"
              data-testid="btn-header-hitl-pill"
              onClick={() => {
                const target = snapshot.needs_my_action[0];
                if (target && selectedContractId !== target.id) {
                  setSelectedContractId(target.id);
                }
                setIsQuickHitlOpen((prev) => !prev);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-primary/50 bg-primary/12 px-2 text-xs font-semibold text-foreground hover:bg-primary/20"
            >
              <ShieldAlert className="size-3.5 text-primary" />
              <span>{dict.hitlPillPrefix}</span>
              <span className="rounded bg-primary px-1.5 py-0 text-xs font-bold tabular-nums text-primary-foreground">
                {snapshot.needs_my_action.length}
              </span>
            </button>
          )}

          <button
            type="button"
            data-testid="btn-toggle-office-mode"
            onClick={() => setOfficeMode((m) => (m === 'full' ? 'simple' : 'full'))}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2 text-xs font-semibold transition-colors ${
              officeMode === 'simple'
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-muted/40 text-foreground hover:bg-muted'
            }`}
          >
            <span>{officeMode === 'full' ? dict.modeFull : dict.modeSimple}</span>
          </button>

          {officeMode === 'full' && (
            <button
              type="button"
              onClick={() => setCmdPaletteOpen(true)}
              data-testid="btn-open-office-cmdk"
              title={dict.cmdPaletteTrigger}
              aria-label={dict.cmdPaletteTrigger}
              className="flex h-8 items-center gap-1 rounded-full border border-border bg-muted/40 px-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Command className="size-3.5 text-primary" />
              <span className="hidden 2xl:inline">{dict.cmdPaletteTrigger}</span>
              <kbd className="text-xs 2xl:hidden">⌘K</kbd>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleQuickAssignFocus()}
            data-testid="btn-quick-assign-focus"
            className="flex h-8 items-center gap-1 rounded-full bg-foreground px-2.5 text-xs font-semibold text-background hover:opacity-90"
          >
            <FileCode2 className="size-3.5" />
            <span>{dict.dispatchCta}</span>
          </button>

          {officeMode === 'full' && (
            <button
              type="button"
              onClick={handleOpenCanonicalWorkItems}
              data-testid="btn-open-canonical-work-items"
              className="flex h-8 items-center gap-1 rounded-full border border-border/85 bg-muted/50 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <SquareKanban className="size-3.5 text-primary" />
              <span>{dict.workItemsBtn}</span>
              <ArrowUpRight className="size-3" />
            </button>
          )}
        </div>
      </div>

      {mutationError && (
        <div
          role="alert"
          data-testid="open-office-error-banner"
          className="mx-2 mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-900 dark:text-red-200"
        >
          <span>{mutationError}</span>
          <button
            type="button"
            onClick={() => setMutationError(null)}
            className="ml-auto font-semibold underline"
          >
            Đóng
          </button>
        </div>
      )}

      <SovereignHitlQuickDrawer
        open={isQuickHitlOpen}
        needsMyAction={snapshot.needs_my_action}
        selectedContractId={selectedContractId}
        contractDetail={contractDetail}
        sessionApproverId={approverId}
        reviewSubmitting={reviewSubmitting}
        isUnitDom={isUnitDom}
        locale={locale}
        onClose={() => setIsQuickHitlOpen(false)}
        onSelectContract={(cid) => setSelectedContractId(cid)}
        onSubmitQuickReview={handleQuickDrawerReview}
      />

      <OpenOfficeCommandPalette
        open={cmdPaletteOpen}
        shortcutsOpen={shortcutsOpen}
        locale={locale}
        stations={displayedStations}
        departments={snapshot.departments || DEFAULT_DEPARTMENTS}
        contracts={snapshot.contracts}
        needsMyAction={snapshot.needs_my_action}
        templates={snapshot.templates}
        onOpenChange={setCmdPaletteOpen}
        onShortcutsOpenChange={setShortcutsOpen}
        onSwitchTab={(t) => setActiveTab(t)}
        onSwitchLens={(lens) => {
          setActiveLens(lens);
        }}
        onSelectStation={(seatId) => {
          setSelectedStationId(seatId);
          setInspectorEntity('agent');
          revealInspectorIfStacked();
        }}
        onSelectDepartment={(zoneId) => {
          setSelectedZoneId(zoneId);
          setInspectorEntity('department');
          revealInspectorIfStacked();
        }}
        onOpenQuickHitl={(cid) => {
          setSelectedContractId(cid);
          setIsQuickHitlOpen(true);
        }}
        onSelectContract={(cid) => {
          setSelectedContractId(cid);
          setActiveTab('contracts');
        }}
        onDispatchTemplate={(tplId) => {
          if (tplId) handleSelectTemplate(tplId);
          handleQuickAssignFocus();
        }}
      />

      {/* SUB-VIEW 1: ACCORD TRI-LENS SOVEREIGN COMMAND COCKPIT */}
      {activeTab === 'floorplan' && (() => {
        const workingNow = displayedStations.filter(
          (s) =>
            s.status === 'WORKING' ||
            s.status === 'ACTIVE' ||
            s.status === 'RUNNING' ||
            Boolean(s.live_telemetry?.is_live_executing),
        ).length;
        const overloadedNow = displayedStations.filter(
          (s) => computeAgentWorkloadAndStage(s, snapshot.contracts, locale).isOverloaded,
        ).length;
        const queuedTotal =
          pendingExecutionContracts.length + (snapshot.pending_run_count ?? 0);
        return (
        <React.Fragment>
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-1.5 px-2 py-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <OfficeSubTabs
                testId="office-subtabs"
                ariaLabel="Các phần của Văn phòng"
                value={officeSubTab}
                onChange={(k) => setOfficeSubTab(k as 'map' | 'dept' | 'setup')}
                tabs={[
                  {
                    key: 'map',
                    label: dict.subtabMap,
                    count: workingNow,
                    testId: 'tab-sub-map',
                  },
                  {
                    key: 'dept',
                    label: dict.subtabDept,
                    count: totalPositionsCount,
                    testId: 'tab-sub-dept',
                  },
                  {
                    key: 'setup',
                    label: dict.subtabSetup,
                    count: seatedStationsCount,
                    testId: 'tab-sub-setup',
                  },
                ]}
              />
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {officeSubTab === 'map' && (activeLens === 'blueprint' || officeMode === 'simple') && (
                  <div
                    data-testid="open-office-stage-strip"
                    className="flex flex-wrap items-center gap-2 rounded-full border border-border/80 bg-muted/35 px-2.5 py-0.5 text-xs text-foreground"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span className="tabular-nums">
                          {workingNow}/{displayedStations.length}{' '}
                          {locale === 'en' ? 'active' : 'đang làm việc'}
                        </span>
                      </span>
                      {(snapshot.live_sessions_count ?? 0) > 0 && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="tabular-nums text-emerald-700 dark:text-emerald-300 font-medium">
                            {snapshot.live_sessions_count} phiên live
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground">·</span>
                      <span className="tabular-nums text-muted-foreground">
                        HITL:{' '}
                        <strong className="text-foreground">
                          {snapshot.needs_my_action.length}
                        </strong>
                      </span>
                      <span className="hidden text-muted-foreground xl:inline">·</span>
                      <span className="hidden tabular-nums text-muted-foreground xl:inline">
                        Chờ chạy:{' '}
                        <strong className="text-foreground">
                          {queuedTotal}
                        </strong>
                      </span>
                      {overloadedNow > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                          {dict.overloadTag}: {overloadedNow}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="hidden items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground 2xl:inline-flex">
                        <Clock className="size-3.5" />
                        <span>{wallClockText || '--:--'}</span>
                      </span>
                      <div className="flex items-center gap-1 border-l border-border pl-1.5">
                        <button
                          type="button"
                          aria-label="Thu nhỏ"
                          onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.1))}
                          className="flex size-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted"
                        >
                          <ZoomOut className="size-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-medium tabular-nums whitespace-nowrap text-foreground">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          type="button"
                          aria-label="Phóng to"
                          onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
                          className="flex size-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted"
                        >
                          <ZoomIn className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(1.0)}
                          className="inline-flex h-8 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs font-medium whitespace-nowrap text-foreground hover:bg-muted"
                        >
                          <Maximize2 className="size-3.5" />
                          <span>{dict.fitView}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMotionActive((prev) => !prev)}
                        className="flex h-8 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {isMotionActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                        <span>{isMotionActive ? 'Dừng' : 'Chạy'}</span>
                      </button>
                    </div>
                  </div>
                )}
                {officeSubTab === 'map' && isInspectorDrawerViewport && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="btn-open-inspector-drawer"
                    aria-expanded={isInspectorDrawerOpen}
                    onClick={() => setIsInspectorDrawerOpen(true)}
                    className="h-8 gap-1 rounded-full px-3 text-xs font-medium xl:hidden"
                  >
                    <PanelRightOpen className="size-3.5 shrink-0 text-primary" />
                    <span className="max-w-[125px] truncate">
                      {inspectorEntity === 'department' && selectedDepartment
                        ? selectedDepartment.name
                        : selectedStation?.agent_name || dict.inspectorDrawerOpenCta}
                    </span>
                    {pendingExecutionContracts.length > 0 && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-200">
                        {pendingExecutionContracts.length}
                      </span>
                    )}
                  </Button>
                )}
                {(officeSubTab === 'dept' || isUnitDom) && (
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
                    <Link
                      href={teamSectionPath(currentTeamRef, 'org-chart')}
                      data-testid="link-open-org-chart"
                    >
                      <Network className="size-3.5" />
                      <span>{locale === 'en' ? 'Org chart' : 'Sơ đồ tổ chức'}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {officeSubTab === 'dept' && (
              <OfficeDeptPositionsTab
                locale={locale}
                zones={snapshot.zones}
                departments={departmentsList}
                stations={snapshot.stations}
                contracts={snapshot.contracts}
                deptSetup={deptSetup}
                seatAssignments={seatAssignments}
                onUpdateDeptSetup={handleUpdateDeptSetup}
                onAddPosition={handleAddPosition}
                onUpdatePosition={handleUpdatePosition}
                onRemovePosition={handleRemovePosition}
                onAssignSeat={handleAssignSeat}
                onUnseatAgent={handleUnseatAgent}
                onApplyDepartmentPatch={handleApplyDepartmentPatch}
                onGoToStaffSetup={() => setOfficeSubTab('setup')}
              />
            )}

            {officeSubTab === 'setup' && (
              <OfficeStaffSetupTab
                locale={locale}
                zones={snapshot.zones}
                departments={departmentsList}
                stations={snapshot.stations}
                contracts={snapshot.contracts}
                deptSetup={deptSetup}
                seatAssignments={seatAssignments}
                onUpdateBotLabel={handleUpdateBotLabel}
                onOpenContract={(cid) => {
                  setSelectedContractId(cid);
                  setActiveTab('contracts');
                }}
                onAssignToAgent={(st, defaultOut) => {
                  setOfficeSubTab('map');
                  if (st.agent_id) setComposerLeadAgentId(st.agent_id);
                  setSelectedStationId(st.seat_id);
                  if (defaultOut) setComposerOutputFormat(defaultOut);
                  handleQuickAssignFocus(st.agent_id || undefined);
                }}
                onGoToDeptSeats={() => setOfficeSubTab('dept')}
              />
            )}

            {officeSubTab === 'map' && (
              <React.Fragment>
                <div className="grid w-full grid-cols-1 items-start gap-2.5 xl:grid-cols-[minmax(0,1fr)_308px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
                  <div className="min-w-0 space-y-4">
                    {/* Hero Stage Container */}
                    <div className="flex w-full min-w-0 flex-col items-center rounded-2xl border border-border/85 bg-card p-1.5 shadow-[var(--studio-card-shadow)]">
                  {activeLens === 'bees' ? (
                    <BeehiveColonyLens
                      zones={snapshot.zones}
                      departments={departmentsList}
                      stations={displayedStations}
                      colonyBees={snapshot.colony_bees}
                      liveActivityFeed={snapshot.live_activity_feed}
                      contracts={snapshot.contracts}
                      needsMyAction={snapshot.needs_my_action}
                      selectedStationId={selectedStationId}
                      selectedZoneId={selectedZoneId}
                      selectedProjectFilter={selectedProjectFilter}
                      isMotionActive={isMotionActive}
                      locale={locale}
                      onSelectStation={(stId) => {
                        setSelectedStationId(stId);
                        setInspectorEntity('agent');
                        revealInspectorIfStacked();
                      }}
                      onSelectZone={(zId) => {
                        setSelectedZoneId(zId);
                        setInspectorEntity('department');
                        revealInspectorIfStacked();
                      }}
                      onOpenQuickReview={(cid) => {
                        setSelectedContractId(cid);
                        setIsQuickHitlOpen(true);
                      }}
                      onQuickAssign={(aid) => handleQuickAssignFocus(aid)}
                    />
                  ) : activeLens === 'blueprint' || officeMode === 'simple' ? (
                    <div data-testid="open-office-blueprint-lens" className="w-full min-w-0">
                          <PixelOfficeCanvas
                            zones={snapshot.zones}
                            departments={departmentsList}
                            stations={displayedStations}
                            colonyBees={snapshot.colony_bees}
                            mascots={snapshot.mascots}
                            contracts={snapshot.contracts}
                            needsMyAction={snapshot.needs_my_action}
                            selectedProjectFilter={selectedProjectFilter}
                            seatCountsByRoom={seatCountsByRoom}
                            selectedStationId={selectedStationId}
                            onSelectStation={(stId) => {
                              setSelectedStationId(stId);
                              setInspectorEntity('agent');
                              revealInspectorIfStacked();
                            }}
                            selectedZoneId={selectedZoneId}
                            onSelectZone={(zId: string) => {
                              setSelectedZoneId(zId);
                              setInspectorEntity('department');
                              revealInspectorIfStacked();
                            }}
                            zoomLevel={zoomLevel}
                            onZoomChange={setZoomLevel}
                            isMotionActive={isMotionActive}
                            showPets={showPets}
                            effectsEnabled={effectsEnabled}
                            celebrateAgentIds={celebrateAgentIds}
                            petEventSignal={petEventSignal}
                            locale={locale}
                            showMinimap={showGatherMinimap}
                            className="w-full"
                          />
                    </div>
              ) : activeLens === 'fleet' ? (
                <FleetMatrixLens
                  zones={snapshot.zones}
                  departments={departmentsList}
                  stations={displayedStations}
                  contracts={snapshot.contracts}
                  needsMyAction={snapshot.needs_my_action}
                  selectedStationId={selectedStationId}
                  locale={locale}
                  onSelectStation={(stId) => {
                    setSelectedStationId(stId);
                    setInspectorEntity('agent');
                    revealInspectorIfStacked();
                  }}
                  onQuickAssign={(aid) => handleQuickAssignFocus(aid)}
                  onOpenQuickReview={(cid) => {
                    if (cid) setSelectedContractId(cid);
                    setIsQuickHitlOpen(true);
                  }}
                  onOpenWorkItem={handleOpenItem}
                />
              ) : (
                <CausalSwarmDagLens
                  contracts={snapshot.contracts}
                  stations={displayedStations}
                  selectedProjectFilter={selectedProjectFilter}
                  selectedContractId={selectedContractId}
                  locale={locale}
                  onSelectStation={(stId) => {
                    setSelectedStationId(stId);
                    setInspectorEntity('agent');
                    revealInspectorIfStacked();
                  }}
                  onSelectContract={(cid) => setSelectedContractId(cid)}
                  onOpenQuickReview={(cid) => {
                    setSelectedContractId(cid);
                    setIsQuickHitlOpen(true);
                  }}
                />
              )}

              <div
                data-testid="gather-bottom-action-bar"
                className="mt-1.5 flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-border bg-card/95 px-2.5 py-1 text-xs text-foreground shadow-xs"
              >
                <button
                  type="button"
                  data-testid="btn-blueprint-submode-pixel"
                  onClick={() => setActiveLens('blueprint')}
                  className={`${
                    !isUnitDom && officeMode === 'simple' ? 'hidden' : 'inline-flex'
                  } h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                    activeLens === 'blueprint'
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-muted/40 text-foreground/85 hover:bg-muted'
                  }`}
                >
                  <Sparkles className="size-3.5 text-primary" />
                  <span>{dict.submodePixel}</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-stage-submode-bees"
                  onClick={() => {
                    setActiveLens('bees');
                  }}
                  className={`${
                    !isUnitDom && officeMode === 'simple' ? 'hidden' : 'inline-flex'
                  } h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                    activeLens === 'bees'
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-muted/40 text-foreground/85 hover:bg-muted'
                  }`}
                >
                  <Hexagon className="size-3.5 text-primary" />
                  <span>{dict.submodeBees}</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-toggle-stage-options"
                  onClick={() => setShowStageOptions((prev) => !prev)}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    showStageOptions
                      ? 'border-primary/50 bg-primary/15 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>{dict.stageOptions}</span>
                </button>

                {showStageOptions && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGatherMinimap((v) => !v)}
                      className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                        showGatherMinimap
                          ? 'border-primary/50 bg-primary/15 text-foreground'
                          : 'border-border bg-muted/40 text-foreground/85 hover:bg-muted'
                      }`}
                    >
                      <span>Bản đồ thu nhỏ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPets((prev) => !prev)}
                      className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                        showPets
                          ? 'border-primary/50 bg-primary/15 text-foreground'
                          : 'border-border bg-muted/40 text-foreground/85 hover:bg-muted'
                      }`}
                    >
                      <Sparkles className="size-3 text-primary" />
                      <span>Thú cưng</span>
                    </button>

                    <button
                      type="button"
                      data-testid="btn-toggle-stage-effects"
                      onClick={() => setEffectsEnabled((v) => !v)}
                      className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                        effectsEnabled
                          ? 'border-primary/50 bg-primary/15 text-foreground'
                          : 'border-border bg-muted/40 text-foreground/85 hover:bg-muted'
                      }`}
                    >
                      <span>{dict.effectsToggle}</span>
                    </button>
                  </>
                )}

                {showGatherMinimap &&
                  activeLens !== 'bees' &&
                  (activeLens === 'blueprint' || officeMode === 'simple') && (
                  <div
                    data-testid="gather-minimap-overlay"
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground dark:bg-zinc-950/90"
                  >
                    <div className="relative h-4 w-9 shrink-0 overflow-hidden rounded border border-white/15 bg-[#262B45]">
                      {displayedStations.map((s) => {
                        const isWork =
                          s.status === 'WORKING' ||
                          s.status === 'ACTIVE' ||
                          s.status === 'RUNNING' ||
                          Boolean(s.live_telemetry?.is_live_executing);
                        const isHitl = s.status === 'AWAITING_HITL';
                        return (
                          <span
                            key={`hud-mm-${s.seat_id}`}
                            style={{
                              left: `${Math.min(90, Math.max(10, Math.round(s.coords?.x ?? 50)))}%`,
                              top: `${Math.min(88, Math.max(12, Math.round(s.coords?.y ?? 50)))}%`,
                            }}
                            className={`absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                              isWork
                                ? 'bg-emerald-400'
                                : isHitl
                                  ? 'bg-amber-400'
                                  : s.status === 'IDLE'
                                    ? 'bg-slate-400'
                                    : 'bg-sky-400'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                      {displayedStations.length} AI
                    </span>
                  </div>
                )}
              </div>
            </div>

                {officeMode === 'full' && (
                  <OfficeBulkDispatchPanel
                    locale={locale}
                    stations={snapshot.stations}
                    templates={snapshot.templates}
                    projects={projectsList}
                    defaultProjectKey={composerProjectKey}
                    onDispatchBatchItem={handleDispatchBulkItem}
                    onBatchComplete={() => void fetchOfficeState()}
                  />
                )}
              </div>
              {!isInspectorDrawerViewport && (
                <div
                  data-testid="open-office-inspector-inline-rail"
                  className="hidden min-w-0 xl:block"
                >
                  <OpenOfficeInspectorSidebar ctrl={ctrl} />
                </div>
              )}
      </div>

            <OpenOfficeLiveTeamStrip ctrl={ctrl} />

            {isInspectorDrawerViewport && (
              <Sheet open={isInspectorDrawerOpen} onOpenChange={setIsInspectorDrawerOpen}>
                <SheetContent
                  side="right"
                  data-testid="open-office-inspector-drawer"
                  className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
                >
                  <SheetHeader className="shrink-0 border-b border-border px-5 py-4 pe-12">
                    <div className="flex items-center gap-2">
                      {inspectorEntity === 'department' ? (
                        <Building2 className="size-4 shrink-0 text-primary" />
                      ) : (
                        <Users className="size-4 shrink-0 text-primary" />
                      )}
                      <SheetTitle className="truncate text-base">
                        {inspectorEntity === 'department' && selectedDepartment
                          ? selectedDepartment.name
                          : selectedStation?.agent_name || dict.inspectorDrawerOpenCta}
                      </SheetTitle>
                    </div>
                    <SheetDescription className="truncate text-xs leading-relaxed">
                      {inspectorEntity === 'department' && selectedDepartment
                        ? `${selectedDepartment.uc_id} · ${selectedDepartment.mission}`
                        : selectedStation
                          ? `${selectedStation.role}${selectedStation.zone_name ? ` · ${selectedStation.zone_name}` : ''}`
                          : dict.inspectorDrawerFallbackDesc}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <OpenOfficeInspectorSidebar ctrl={ctrl} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            </React.Fragment>
          )}
        </div>
      </React.Fragment>
        );
      })()}


      {activeTab === 'contracts' && <OpenOfficeContractsTab ctrl={ctrl} />}

      {/* SUB-VIEW 2.5: UNIFIED ORG, DYNAMIC SOP DEPARTMENTS & AUTHORIZATION GOVERNANCE */}
      {activeTab === 'governance' && (
        <div className="flex min-w-0 flex-col">
          <OpenOfficeGovernancePanel
            apiBaseUrl={apiBaseUrl}
            teamRef={currentTeamRef}
            projectKey={currentProjKey}
            zones={snapshot.zones}
            departments={departmentsList}
            stations={snapshot.stations}
            templates={snapshot.templates}
            focusedZoneId={selectedZoneId}
            locale={locale}
            onNavigate={(path) => navigateFeatureInstant(path)}
            onApplyDepartmentPatch={handleApplyDepartmentPatch}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <OpenOfficeAnalyticsTab
          analytics={snapshot.analytics}
          needsMyActionCount={snapshot.needs_my_action.length}
        />
      )}
    </div>
  );
}
