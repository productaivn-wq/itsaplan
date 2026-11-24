'use client';

import * as React from 'react';
import { ArrowRight, Plus, Tag, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';
import {
  buildDynamicRoomSpecs,
  computeAgentWorkloadAndStage,
  DETAILED_STAGE_META,
  type OfficeDeptSetupState,
  type OfficeSeatAssignmentState,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface OfficeStaffSetupTabProps {
  locale: OpenOfficeLocale;
  zones?: OpenOfficeZone[];
  departments?: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  contracts: OpenOfficeContract[];
  deptSetup: OfficeDeptSetupState;
  seatAssignments: OfficeSeatAssignmentState;
  onUpdateBotLabel: (seatId: string, label: string) => void;
  onOpenContract: (contractId: string) => void;
  onAssignToAgent: (station: OpenOfficeStation, defaultOutputFormat?: string) => void;
  onGoToDeptSeats: () => void;
}

export function OfficeStaffSetupTab({
  locale,
  zones,
  departments,
  stations,
  contracts,
  deptSetup,
  seatAssignments,
  onUpdateBotLabel,
  onOpenContract,
  onAssignToAgent,
  onGoToDeptSeats,
}: OfficeStaffSetupTabProps) {
  const isVi = locale === 'vi';

  const { seatedEntries, unseatedStations, emptySeats } = React.useMemo(() => {
    const specs = buildDynamicRoomSpecs(zones, departments);
    const specById = new Map(specs.map((sp) => [sp.canonicalId, sp]));
    const seated: Array<{
      station: OpenOfficeStation;
      deptKey: string;
      deptTitle: string;
      posName: string;
      posOutput: string;
      dutyCount: number;
    }> = [];
    const unseated: OpenOfficeStation[] = [];
    const occupiedPosIds = new Set<string>();

    for (const st of stations) {
      const seat = seatAssignments[st.seat_id];
      const dept = seat?.deptKey ? deptSetup[seat.deptKey] : undefined;
      const pos = dept?.positions.find((p) => p.id === seat?.positionId);
      if (dept && pos) {
        occupiedPosIds.add(pos.id);
        const roomSpec = specById.get(seat.deptKey);
        seated.push({
          station: st,
          deptKey: seat.deptKey,
          deptTitle: roomSpec ? (isVi ? roomSpec.viTitle : roomSpec.enTitle) : seat.deptKey,
          posName: pos.name || st.role,
          posOutput: pos.output || dept.output || '',
          dutyCount: pos.duties.filter((d) => d.trim().length > 0).length,
        });
      } else {
        unseated.push(st);
      }
    }

    const openSeats: Array<{ deptTitle: string; posId: string; posName: string }> = [];
    for (const spec of specs) {
      const dept = deptSetup[spec.canonicalId];
      for (const pos of dept?.positions || []) {
        if (!occupiedPosIds.has(pos.id)) {
          openSeats.push({
            deptTitle: isVi ? spec.viTitle : spec.enTitle,
            posId: pos.id,
            posName: pos.name,
          });
        }
      }
    }

    return { seatedEntries: seated, unseatedStations: unseated, emptySeats: openSeats };
  }, [zones, departments, stations, seatAssignments, deptSetup, isVi]);

  return (
    <div
      data-testid="office-staff-setup-panel"
      className="mx-auto w-full max-w-[1220px] space-y-4 py-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-card px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {isVi
                ? 'Bước 4 · Setup việc & Nhãn bot theo từng nhân sự đang ngồi ghế'
                : 'Step 4 · Staff Work Setup & Bot Labels'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {isVi
              ? 'Kiểm tra vị trí, tải việc thực tế và nhãn bot của từng AI, sau đó bấm giao việc ngay với đầu ra chuẩn theo ghế.'
              : 'Review each seated agent, live workload, and bot label, then dispatch work pre-filled with seat expectations.'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGoToDeptSeats}
          className="min-h-9 gap-1.5 rounded-full text-xs"
        >
          <span>{isVi ? 'Quản lý Phòng & Ghế' : 'Manage Rooms & Seats'}</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* 3-Column Staff Cards Grid */}
      {seatedEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {seatedEntries.map(({ station, deptTitle, posName, posOutput, dutyCount }) => {
            const workload = computeAgentWorkloadAndStage(station, contracts, locale);
            const activeMine = contracts.filter(
              (c) =>
                c.status !== 'DONE' &&
                (c.lead_agent_id === station.agent_id ||
                  (station.agent_id ? (c.support_agent_ids || []).includes(station.agent_id) : false)),
            );
            const botLabel = seatAssignments[station.seat_id]?.botLabel || '';

            return (
              <div
                key={station.seat_id}
                data-testid={`staff-setup-card-${station.seat_id}`}
                className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-950 p-1">
                    <PixelAgentAvatar
                      seed={station.agent_name}
                      status={station.status}
                      size={32}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">
                      {station.agent_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {posName} · {deptTitle}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      workload.isOverloaded
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'border-border bg-muted/40 text-foreground'
                    }`}
                  >
                    {activeMine.length}{' '}
                    {isVi ? 'việc mở' : 'open'}
                    {workload.isOverloaded ? ` · ${isVi ? 'quá tải' : 'overloaded'}` : ''}
                  </span>
                </div>

                {/* Tags & Bot Label */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 font-medium text-muted-foreground">
                    {dutyCount} {isVi ? 'nhiệm vụ ghế' : 'seat duties'}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-medium ${DETAILED_STAGE_META[workload.detailedStage].badgeClass}`}
                  >
                    {workload.detailedStageLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                  <Input
                    value={botLabel}
                    onChange={(e) => onUpdateBotLabel(station.seat_id, e.target.value)}
                    placeholder={isVi ? 'Gắn nhãn bot (VD: Code Lead PM)...' : 'Bot label (e.g. Code Lead)...'}
                    aria-label={`${isVi ? 'Nhãn bot của' : 'Bot label for'} ${station.agent_name}`}
                    className="h-8 flex-1 rounded-xl text-xs"
                  />
                </div>

                {/* Active Contracts Preview */}
                {activeMine.length > 0 ? (
                  <div className="space-y-1.5 rounded-xl border border-border bg-background p-2.5">
                    {activeMine.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onOpenContract(c.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                          <span className="font-mono text-primary">{c.id}</span> · {c.title}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {c.status}
                        </span>
                      </button>
                    ))}
                    {activeMine.length > 4 && (
                      <div className="px-2 text-xs text-muted-foreground">
                        +{activeMine.length - 4} {isVi ? 'việc nữa' : 'more'}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    {isVi
                      ? 'Chưa có hợp đồng đang chạy cho nhân sự này.'
                      : 'No active contracts assigned yet.'}
                  </p>
                )}

                <Button
                  type="button"
                  size="sm"
                  data-testid={`btn-setup-assign-${station.seat_id}`}
                  onClick={() => onAssignToAgent(station, posOutput)}
                  className="mt-auto min-h-9 w-full gap-1.5 rounded-full bg-foreground text-xs font-semibold text-background hover:opacity-90"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {isVi ? `Giao việc cho ${station.agent_name}` : `Assign work to ${station.agent_name}`}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
          {isVi
            ? 'Chưa có nhân sự AI nào được xếp ghế. Vào tab "Phòng ban & vị trí" để xếp ghế.'
            : 'No seated AI agents yet. Assign seats in the Departments & Seats tab.'}
        </div>
      )}

      {/* Empty Seats Summary */}
      {emptySeats.length > 0 && (
        <div className="rounded-[20px] border border-border bg-card p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isVi ? 'Ghế còn trống' : 'Open Seats'} ({emptySeats.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {emptySeats.map((s) => (
              <span
                key={s.posId}
                className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {s.posName} · {s.deptTitle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Unseated Agents Callout */}
      {unseatedStations.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
          <span>
            {isVi ? 'Nhân sự chưa xếp ghế:' : 'Unseated staff:'}{' '}
            <strong>{unseatedStations.map((u) => u.agent_name).join(', ')}</strong>
          </span>
          <button
            type="button"
            onClick={onGoToDeptSeats}
            className="font-semibold underline hover:opacity-80"
          >
            {isVi ? 'Xếp chỗ ở Phòng ban & vị trí' : 'Assign seats now'}
          </button>
        </div>
      )}
    </div>
  );
}
