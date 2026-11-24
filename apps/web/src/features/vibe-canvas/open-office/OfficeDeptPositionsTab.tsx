'use client';

import * as React from 'react';
import { ArrowRight, Building2, Check, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeDepartmentPatch,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';
import {
  buildDynamicRoomSpecs,
  resolveCanonicalZoneId,
  type OfficeDeptSetupItem,
  type OfficeDeptSetupState,
  type OfficePositionDef,
  type OfficeSeatAssignmentState,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface OfficeDeptPositionsTabProps {
  locale: OpenOfficeLocale;
  zones?: OpenOfficeZone[];
  departments: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  contracts: OpenOfficeContract[];
  deptSetup: OfficeDeptSetupState;
  seatAssignments: OfficeSeatAssignmentState;
  onUpdateDeptSetup: (canonicalZoneId: string, patch: Partial<OfficeDeptSetupItem>) => void;
  onAddPosition: (canonicalZoneId: string) => void;
  onUpdatePosition: (
    canonicalZoneId: string,
    posId: string,
    patch: Partial<OfficePositionDef>,
  ) => void;
  onRemovePosition: (canonicalZoneId: string, posId: string) => void;
  onAssignSeat: (
    seatId: string,
    canonicalZoneId: string,
    posId: string,
    posName: string,
  ) => void;
  onUnseatAgent: (seatId: string) => void;
  onApplyDepartmentPatch?: (patch: OpenOfficeDepartmentPatch) => void;
  onGoToStaffSetup: () => void;
}

function isPositionComplete(pos: OfficePositionDef): boolean {
  return Boolean(
    pos.name.trim() &&
      pos.duties.some((d) => d.trim().length > 0) &&
      pos.output.trim(),
  );
}

function isDeptComplete(def: OfficeDeptSetupItem | undefined): boolean {
  if (!def) return false;
  return Boolean(
    def.mission.trim() &&
      def.duties.some((d) => d.trim().length > 0) &&
      def.output.trim() &&
      def.positions.length > 0 &&
      def.positions.every(isPositionComplete),
  );
}

export function OfficeDeptPositionsTab({
  locale,
  zones,
  departments,
  stations,
  contracts,
  deptSetup,
  seatAssignments,
  onUpdateDeptSetup,
  onAddPosition,
  onUpdatePosition,
  onRemovePosition,
  onAssignSeat,
  onUnseatAgent,
  onApplyDepartmentPatch,
  onGoToStaffSetup,
}: OfficeDeptPositionsTabProps) {
  const isVi = locale === 'vi';
  const [pickByPos, setPickByPos] = React.useState<Record<string, string>>({});
  const [sectionView, setSectionView] = React.useState<'all' | 'depts' | 'seats'>('all');
  const [editingZoneId, setEditingZoneId] = React.useState<string | null>(null);

  const orderedSpecs = React.useMemo(
    () => buildDynamicRoomSpecs(zones, departments),
    [zones, departments],
  );

  const specByCanonical = React.useMemo(() => {
    const map = new Map<string, (typeof orderedSpecs)[number]>();
    for (const sp of orderedSpecs) {
      map.set(sp.canonicalId, sp);
    }
    return map;
  }, [orderedSpecs]);

  const deptByCanonical = React.useMemo(() => {
    const map = new Map<string, OpenOfficeDepartmentDossier>();
    for (const d of departments) {
      map.set(resolveCanonicalZoneId(d.zone_id || d.id, zones), d);
    }
    return map;
  }, [departments, zones]);

  return (
    <div
      data-testid="office-dept-positions-tab"
      className="mx-auto w-full max-w-[1220px] space-y-5 py-2"
    >
      {/* Header & Section Jump */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-card px-5 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {isVi
                ? 'Bước 1 & 2 · Phòng ban, Vị trí (Ghế) & Xếp AI vào vị trí'
                : 'Step 1 & 2 · Departments, Seats & AI Assignment'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {isVi
              ? 'Xác lập trách nhiệm từng phòng, tạo các vị trí cụ thể rồi xếp từng nhân sự AI ngồi vào ghế trống.'
              : 'Define department missions, create functional seats, and assign AI agents to open seats.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-muted/60 p-0.5 text-xs">
            {(
              [
                { k: 'all', lb: isVi ? 'Tất cả' : 'All' },
                { k: 'depts', lb: isVi ? '1 · Phòng & ghế' : '1 · Depts & Seats' },
                { k: 'seats', lb: isVi ? '2 · Xếp AI vào ghế' : '2 · Assign AI' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => setSectionView(opt.k)}
                className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                  sectionView === opt.k
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.lb}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onGoToStaffSetup}
            className="min-h-9 gap-1.5 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90"
          >
            <Users className="size-3.5" />
            <span>{isVi ? 'Sang Setup việc cho nhân viên' : 'Go to Staff Work Setup'}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* SECTION A: V54 / V60 Full-Width Department Cards with Horizontal Seats */}
      {(sectionView === 'all' || sectionView === 'depts') && (
        <div className="space-y-4">
          {orderedSpecs.map((spec) => {
            const deptDossier = deptByCanonical.get(spec.canonicalId);
            const def = deptSetup[spec.canonicalId] || {
              key: spec.canonicalId,
              mission: deptDossier?.mission || spec.viSubtitle,
              duties: [deptDossier?.mission || spec.viSubtitle],
              output: '',
              positions: [],
            };
            const deptName = isVi ? deptDossier?.name || spec.viTitle : spec.enTitle;
            const complete = isDeptComplete(def);
            const seatedStations = stations.filter(
              (st) =>
                Boolean(seatAssignments[st.seat_id]?.deptKey) &&
                resolveCanonicalZoneId(seatAssignments[st.seat_id]?.deptKey, zones) ===
                  spec.canonicalId,
            );
            const deptContractsCount = contracts.filter(
              (c) =>
                seatedStations.some(
                  (st) =>
                    st.agent_id === c.lead_agent_id ||
                    (st.agent_id ? (c.support_agent_ids || []).includes(st.agent_id) : false),
                ),
            ).length;

            const syncDepartmentPatch = (missionText: string) => {
              if (!onApplyDepartmentPatch) return;
              onApplyDepartmentPatch({
                zone_id: spec.canonicalId,
                name: deptName,
                subtitle: missionText,
                primary_cta_label: deptDossier?.primary_cta_label || 'Giao hợp đồng SLA',
                default_template_id: deptDossier?.default_template_id || 'doc_synthesis',
                recommended_agent_ids: deptDossier?.recommended_agent_ids || ['@antigravity'],
              });
            };

            return (
              <section
                key={spec.canonicalId}
                data-testid={`dept-setup-card-${spec.canonicalId}`}
                className="space-y-4 rounded-[20px] border border-border bg-card p-5 text-card-foreground"
              >
                {/* Department Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                        {spec.sopId || spec.ucCode}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{deptName}</h3>
                      {(spec.primarySkills || []).slice(0, 3).map((sk) => (
                        <span
                          key={`${spec.canonicalId}-sk-${sk}`}
                          className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {def.positions.length} {isVi ? 'vị trí' : 'seats'} · {seatedStations.length}{' '}
                      {isVi ? 'nhân viên AI' : 'AI staff'} · {deptContractsCount}{' '}
                      {isVi ? 'hợp đồng liên kết' : 'contracts'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() =>
                        setEditingZoneId((prev) =>
                          prev === spec.canonicalId ? null : spec.canonicalId,
                        )
                      }
                    >
                      {editingZoneId === spec.canonicalId
                        ? isVi
                          ? 'Thu gọn'
                          : 'Done'
                        : isVi
                          ? 'Sửa mô tả'
                          : 'Edit details'}
                    </Button>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                        complete
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      {complete ? (
                        <>
                          <Check className="size-3.5" />
                          <span>{isVi ? 'Đã xác lập' : 'Complete'}</span>
                        </>
                      ) : (
                        <span>{isVi ? 'Chưa đủ thông tin' : 'Incomplete'}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Department Mission, Duties, Output */}
                {editingZoneId === spec.canonicalId ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isVi
                          ? 'Trách nhiệm chính — Phòng này chịu trách nhiệm gì'
                          : 'Primary Mission'}
                      </label>
                      <Input
                        value={def.mission}
                        onChange={(e) =>
                          onUpdateDeptSetup(spec.canonicalId, { mission: e.target.value })
                        }
                        onBlur={(e) => syncDepartmentPatch(e.target.value)}
                        placeholder={isVi ? 'Một câu: phòng này tồn tại để làm gì...' : 'One sentence mission...'}
                        className="mt-1 h-9 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isVi
                          ? 'Đầu ra chuẩn — Làm xong thì nộp cái gì'
                          : 'Standard Output'}
                      </label>
                      <Input
                        value={def.output}
                        onChange={(e) =>
                          onUpdateDeptSetup(spec.canonicalId, { output: e.target.value })
                        }
                        placeholder={isVi ? 'Sản phẩm chuẩn của phòng khi xong việc...' : 'Standard deliverable...'}
                        className="mt-1 h-9 rounded-xl text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isVi
                          ? 'Nhiệm vụ của phòng — Mỗi dòng một nhiệm vụ'
                          : 'Department Duties (One per line)'}
                      </label>
                      <textarea
                        rows={2}
                        value={def.duties.join('\n')}
                        onChange={(e) =>
                          onUpdateDeptSetup(spec.canonicalId, {
                            duties: e.target.value.split('\n'),
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {def.mission}
                    {def.output ? ` · ${def.output}` : ''}
                  </p>
                )}

                {/* Horizontal Position / Seat Cards */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isVi
                      ? 'Vị trí trong phòng — Tạo ghế trước, xếp người sau'
                      : 'Positions in Department'}
                  </span>

                  <div className="flex flex-wrap items-stretch gap-3">
                    {def.positions.map((pos) => {
                      const occupants = stations.filter(
                        (st) =>
                          Boolean(seatAssignments[st.seat_id]?.deptKey) &&
                          resolveCanonicalZoneId(seatAssignments[st.seat_id]?.deptKey, zones) ===
                            spec.canonicalId &&
                          seatAssignments[st.seat_id]?.positionId === pos.id,
                      );
                      const posDone = isPositionComplete(pos);
                      return (
                        <div
                          key={pos.id}
                          data-testid={`position-card-${pos.id}`}
                          className="flex min-w-[260px] flex-1 basis-[280px] flex-col gap-2 rounded-[14px] border border-border bg-background p-3.5"
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              value={pos.name}
                              onChange={(e) =>
                                onUpdatePosition(spec.canonicalId, pos.id, {
                                  name: e.target.value,
                                })
                              }
                              placeholder={isVi ? 'Tên vị trí...' : 'Position title...'}
                              aria-label={`${isVi ? 'Tên vị trí trong phòng' : 'Position name'} ${deptName}`}
                              className="h-8 flex-1 rounded-lg text-xs font-semibold"
                            />
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                posDone
                                  ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                  : 'border-border text-muted-foreground'
                              }`}
                            >
                              {posDone ? (isVi ? '✓ Rõ việc' : '✓ Ready') : isVi ? 'Chưa đủ' : 'Draft'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemovePosition(spec.canonicalId, pos.id)}
                              aria-label={`${isVi ? 'Xóa vị trí' : 'Remove position'} ${pos.name || pos.id}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={pos.duties.join('\n')}
                            onChange={(e) =>
                              onUpdatePosition(spec.canonicalId, pos.id, {
                                duties: e.target.value.split('\n'),
                              })
                            }
                            placeholder={isVi ? 'Mỗi dòng một nhiệm vụ của vị trí...' : 'One duty per line...'}
                            className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />

                          <Input
                            value={pos.output}
                            onChange={(e) =>
                              onUpdatePosition(spec.canonicalId, pos.id, {
                                output: e.target.value,
                              })
                            }
                            placeholder={isVi ? 'Đầu ra của vị trí...' : 'Position deliverable...'}
                            className="h-8 rounded-lg text-xs"
                          />

                          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                            {occupants.length > 0 ? (
                              occupants.map((st) => (
                                <span
                                  key={st.seat_id}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-medium text-foreground"
                                >
                                  <PixelAgentAvatar
                                    seed={st.agent_name}
                                    status={st.status}
                                    size={16}
                                  />
                                  <span>{st.agent_name}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">
                                {isVi ? 'Ghế trống — chưa có AI ngồi' : 'Empty seat'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      data-testid={`btn-add-position-${spec.canonicalId}`}
                      onClick={() => onAddPosition(spec.canonicalId)}
                      className="flex min-h-[120px] min-w-[200px] flex-1 basis-[220px] items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-primary/50 bg-muted/15 px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-muted/35"
                    >
                      <Plus className="size-4" />
                      <span>
                        {isVi ? 'Thêm vị trí vào phòng này' : 'Add position to room'}
                      </span>
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* SECTION B: V61 Seat Assignment Board ("Thêm AI vào vị trí") */}
      {(sectionView === 'all' || sectionView === 'seats') && (
        <section
          data-testid="office-seat-board"
          className="space-y-4 rounded-[20px] border border-border bg-card p-5 text-card-foreground"
        >
          <div className="space-y-1 border-b border-border/70 pb-3">
            <h3 className="text-sm font-bold text-foreground">
              {isVi ? 'Bảng Xếp AI vào Vị trí (Seat Board)' : 'Seat Assignment Board'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isVi
                ? 'Nhìn theo từng vị trí: ghế nào trống, chọn nhân sự AI xếp thẳng vào ghế đó.'
                : 'Inspect every seat per room and assign an AI agent to open seats.'}
            </p>
          </div>

          <div className="space-y-4">
            {orderedSpecs.map((spec) => {
              const def = deptSetup[spec.canonicalId];
              const positions = def?.positions || [];
              const deptName = isVi
                ? deptByCanonical.get(spec.canonicalId)?.name || spec.viTitle
                : spec.enTitle;
              const seatedCount = positions.filter((p) =>
                stations.some(
                  (st) =>
                    Boolean(seatAssignments[st.seat_id]?.deptKey) &&
                    resolveCanonicalZoneId(seatAssignments[st.seat_id]?.deptKey, zones) ===
                      spec.canonicalId &&
                    seatAssignments[st.seat_id]?.positionId === p.id,
                ),
              ).length;

              return (
                <div
                  key={`sb-${spec.canonicalId}`}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
                    <span className="text-sm font-bold text-foreground">{deptName}</span>
                    <span className="text-xs text-muted-foreground">
                      {positions.length} {isVi ? 'vị trí' : 'seats'} · {seatedCount}{' '}
                      {isVi ? 'đã có AI' : 'occupied'} · {Math.max(0, positions.length - seatedCount)}{' '}
                      {isVi ? 'đang trống' : 'open'}
                    </span>
                  </div>

                  {positions.length === 0 ? (
                    <p className="py-2 text-xs text-muted-foreground">
                      {isVi
                        ? 'Phòng này chưa có vị trí nào — bấm "+ Thêm vị trí" ở trên trước.'
                        : 'No positions yet — add one above first.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {positions.map((pos) => {
                        const occupants = stations.filter(
                          (st) =>
                            Boolean(seatAssignments[st.seat_id]?.deptKey) &&
                            resolveCanonicalZoneId(seatAssignments[st.seat_id]?.deptKey, zones) ===
                              spec.canonicalId &&
                            seatAssignments[st.seat_id]?.positionId === pos.id,
                        );
                        const candidates = stations.filter(
                          (st) => !occupants.some((o) => o.seat_id === st.seat_id),
                        );
                        const selectedSeatId = pickByPos[pos.id] || '';

                        return (
                          <div
                            key={`row-${pos.id}`}
                            data-testid={`seat-row-${pos.id}`}
                            className="flex flex-wrap items-center justify-between gap-3 py-3"
                          >
                            <div className="min-w-[240px] flex-1">
                              <div className="text-xs font-bold text-foreground">
                                {pos.name || (isVi ? '(vị trí chưa đặt tên)' : '(unnamed seat)')}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {pos.duties.filter((x) => x.trim()).length}{' '}
                                {isVi ? 'nhiệm vụ' : 'duties'}
                                {pos.output ? ` · ${isVi ? 'Đầu ra' : 'Output'}: ${pos.output}` : ''}
                              </div>
                            </div>

                            {occupants.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {occupants.map((st) => (
                                  <span
                                    key={st.seat_id}
                                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground"
                                  >
                                    <PixelAgentAvatar
                                      seed={st.agent_name}
                                      status={st.status}
                                      size={22}
                                    />
                                    <span>{st.agent_name}</span>
                                    <button
                                      type="button"
                                      data-testid={`btn-unseat-${st.seat_id}`}
                                      onClick={() => onUnseatAgent(st.seat_id)}
                                      className="rounded-full px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                      {isVi ? 'Gỡ' : 'Unseat'}
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  {isVi ? 'Chưa có AI — vị trí trống' : 'Empty seat'}
                                </span>
                                <select
                                  value={selectedSeatId}
                                  onChange={(e) =>
                                    setPickByPos((prev) => ({
                                      ...prev,
                                      [pos.id]: e.target.value,
                                    }))
                                  }
                                  aria-label={`${isVi ? 'Chọn AI cho vị trí' : 'Choose AI for seat'} ${pos.name || pos.id}`}
                                  data-testid={`select-seat-candidate-${pos.id}`}
                                  className="h-9 min-w-[190px] rounded-xl border border-border bg-card px-3 text-xs text-foreground"
                                >
                                  <option value="">
                                    {isVi ? '— Chọn nhân sự AI —' : '— Select AI —'}
                                  </option>
                                  {candidates.map((st) => {
                                    const cur = seatAssignments[st.seat_id];
                                    const curRoomName =
                                      (cur?.deptKey
                                        ? specByCanonical.get(
                                            resolveCanonicalZoneId(cur.deptKey, zones),
                                          )?.viTitle
                                        : undefined) ||
                                      cur?.deptKey ||
                                      '';
                                    return (
                                      <option key={st.seat_id} value={st.seat_id}>
                                        {st.agent_name}
                                        {cur?.positionId && curRoomName
                                          ? ` (${isVi ? 'đang ở' : 'in'} ${curRoomName})`
                                          : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!selectedSeatId}
                                  data-testid={`btn-assign-seat-${pos.id}`}
                                  onClick={() => {
                                    if (!selectedSeatId) return;
                                    onAssignSeat(
                                      selectedSeatId,
                                      spec.canonicalId,
                                      pos.id,
                                      pos.name,
                                    );
                                    setPickByPos((prev) => ({ ...prev, [pos.id]: '' }));
                                  }}
                                  className="min-h-9 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90"
                                >
                                  {isVi ? 'Xếp vào vị trí' : 'Assign Seat'}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
