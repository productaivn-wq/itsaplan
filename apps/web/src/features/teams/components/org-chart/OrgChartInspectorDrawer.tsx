'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TeamMember } from '@/lib/api/endpoints/teams';
import { useExitOnEscape } from '@/hooks/useExitOnEscape';
import { openOfficePath, teamSectionPath } from '@/utils/paths';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  OfficeDeptSetupItem,
  OfficePositionDef,
} from '@/features/vibe-canvas/open-office/openOfficeConstants';

export interface OrgAssigneeOption {
  id: string;
  label: string;
  kind: 'human' | 'agent';
}

export interface OrgSeatDraft {
  position: OfficePositionDef;
  assigneeId: string;
}

export default function OrgChartInspectorDrawer({
  canonicalZoneId,
  ucCode,
  departmentName,
  initialDept,
  initialAssignees,
  assigneeOptions,
  teamRef,
  primaryProjectRef,
  canEdit,
  onSave,
  onClose,
}: {
  canonicalZoneId: string;
  ucCode: string;
  departmentName: string;
  initialDept: OfficeDeptSetupItem;
  initialAssignees: Record<string, string>;
  assigneeOptions: OrgAssigneeOption[];
  teamRef: string;
  primaryProjectRef: string | null;
  canEdit: boolean;
  onSave: (
    canonicalZoneId: string,
    updatedDept: OfficeDeptSetupItem,
    seatSelections: Record<string, string>,
  ) => void;
  onClose: () => void;
}) {
  const t = useTranslations('teams.orgChart');
  const tCommon = useTranslations('common');

  const [mission, setMission] = useState(initialDept.mission);
  const [output, setOutput] = useState(initialDept.output);
  const [seats, setSeats] = useState<OrgSeatDraft[]>(() =>
    initialDept.positions.map((pos) => ({
      position: { ...pos, duties: [...pos.duties] },
      assigneeId: initialAssignees[pos.id] ?? '',
    })),
  );

  useExitOnEscape(onClose);

  const humanOptions = useMemo(
    () => assigneeOptions.filter((opt) => opt.kind === 'human'),
    [assigneeOptions],
  );
  const agentOptions = useMemo(
    () => assigneeOptions.filter((opt) => opt.kind === 'agent'),
    [assigneeOptions],
  );

  function addSeat() {
    const newId = `pos-${canonicalZoneId}-${Date.now().toString(36)}`;
    setSeats((prev) => [
      ...prev,
      {
        position: { id: newId, name: '', duties: [], output: '' },
        assigneeId: '',
      },
    ]);
  }

  function updateSeatTitle(id: string, name: string) {
    setSeats((prev) =>
      prev.map((item) =>
        item.position.id === id
          ? { ...item, position: { ...item.position, name } }
          : item,
      ),
    );
  }

  function updateSeatOutput(id: string, posOutput: string) {
    setSeats((prev) =>
      prev.map((item) =>
        item.position.id === id
          ? { ...item, position: { ...item.position, output: posOutput } }
          : item,
      ),
    );
  }

  function updateSeatAssignee(id: string, assigneeId: string) {
    setSeats((prev) =>
      prev.map((item) =>
        item.position.id === id ? { ...item, assigneeId } : item,
      ),
    );
  }

  function removeSeat(id: string) {
    setSeats((prev) => prev.filter((item) => item.position.id !== id));
  }

  function handleSave() {
    const updatedDept: OfficeDeptSetupItem = {
      ...initialDept,
      mission: mission.trim(),
      output: output.trim(),
      duties: mission.trim() ? [mission.trim()] : initialDept.duties,
      positions: seats.map((s) => ({
        ...s.position,
        name: s.position.name.trim() || t('openSeat'),
        output: s.position.output.trim(),
      })),
    };
    const nextAssignments: Record<string, string> = {};
    for (const s of seats) {
      if (s.assigneeId) {
        nextAssignments[s.position.id] = s.assigneeId;
      }
    }
    onSave(canonicalZoneId, updatedDept, nextAssignments);
  }

  const membersHref = teamSectionPath(teamRef, 'members');
  const rolesHref = teamSectionPath(teamRef, 'roles');
  const liveFloorHref = primaryProjectRef ? openOfficePath(primaryProjectRef) : null;

  return (
    <div
      data-testid="org-chart-inspector-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-chart-drawer-title"
      className="fixed inset-0 z-50 flex bg-black/25"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ml-auto flex h-full w-full flex-col border-l border-border bg-card sm:w-[400px] sm:max-w-[92vw]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{ucCode}</Badge>
              <h2
                id="org-chart-drawer-title"
                className="truncate text-base font-semibold text-foreground"
              >
                {departmentName}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">{t('drawerSubtitle')}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={onClose}
            aria-label={tCommon('close')}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-dept-mission">{t('missionLabel')}</Label>
              <Input
                id="org-dept-mission"
                data-testid="org-drawer-mission-input"
                disabled={!canEdit}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-dept-output">{t('deliverableLabel')}</Label>
              <Input
                id="org-dept-output"
                data-testid="org-drawer-output-input"
                disabled={!canEdit}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <Label>{t('positionsLabel')}</Label>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="org-drawer-add-seat-btn"
                  className="h-9 gap-1.5"
                  onClick={addSeat}
                >
                  <Plus className="size-3.5" />
                  <span>{t('addPosition')}</span>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {seats.map((seat, idx) => (
                <div
                  key={seat.position.id}
                  data-testid={`org-drawer-seat-${seat.position.id}`}
                  className="space-y-2 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`${t('colSeat')} ${idx + 1}`}
                      disabled={!canEdit}
                      value={seat.position.name}
                      onChange={(e) => updateSeatTitle(seat.position.id, e.target.value)}
                      placeholder={t('seatNamePlaceholder')}
                      className="h-9 flex-1 text-sm font-medium"
                    />
                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSeat(seat.position.id)}
                        aria-label={tCommon('delete')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={`seat-assignee-${seat.position.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      {t('assignMember')}
                    </Label>
                    <select
                      id={`seat-assignee-${seat.position.id}`}
                      data-testid={`org-drawer-select-${seat.position.id}`}
                      disabled={!canEdit}
                      value={seat.assigneeId}
                      onChange={(e) => updateSeatAssignee(seat.position.id, e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">{t('unassign')}</option>
                      {humanOptions.length > 0 && (
                        <optgroup label={t('kindHuman')}>
                          {humanOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {agentOptions.length > 0 && (
                        <optgroup label={t('kindAi')}>
                          {agentOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <Input
                    aria-label={t('colDeliverable')}
                    disabled={!canEdit}
                    value={seat.position.output}
                    onChange={(e) => updateSeatOutput(seat.position.id, e.target.value)}
                    placeholder={t('deliverableLabel')}
                    className="h-9 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="text-xs text-muted-foreground">{t('quickLinks')}</Label>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                <Link
                  href={membersHref}
                  onClick={(e) => {
                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                      e.preventDefault();
                      onClose();
                      navigateFeatureInstant(membersHref);
                    }
                  }}
                >
                  <span>{t('linkMembers')}</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                <Link
                  href={rolesHref}
                  onClick={(e) => {
                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                      e.preventDefault();
                      onClose();
                      navigateFeatureInstant(rolesHref);
                    }
                  }}
                >
                  <span>{t('linkRoles')}</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
              {liveFloorHref && (
                <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                  <Link href={liveFloorHref}>
                    <span>{t('openLiveFloor')}</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              data-testid="org-drawer-save-btn"
              className="h-9"
              onClick={handleSave}
            >
              {t('saveChanges')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function buildAssigneeOptions(
  members: TeamMember[],
  stations: Array<{ seat_id: string; agent_id?: string; agent_name: string; username?: string }>,
): OrgAssigneeOption[] {
  const options: OrgAssigneeOption[] = [];
  const seen = new Set<string>();

  for (const m of members) {
    if (m.role !== 'agent') {
      const id = `human:${m.userId}`;
      if (!seen.has(id)) {
        seen.add(id);
        options.push({ id, label: m.name || m.email, kind: 'human' });
      }
    }
  }

  for (const st of stations) {
    const id = `station:${st.seat_id}`;
    if (!seen.has(id)) {
      seen.add(id);
      const handle = st.username ? ` (${st.username})` : '';
      options.push({ id, label: `${st.agent_name}${handle}`, kind: 'agent' });
    }
  }

  for (const m of members) {
    if (m.role === 'agent') {
      const handle = m.username ? `@${m.username.replace(/^@/, '')}` : '';
      const alreadyMatched = stations.some(
        (st) =>
          (handle && st.username?.toLowerCase() === handle.toLowerCase()) ||
          st.agent_name.toLowerCase() === (m.name || '').toLowerCase(),
      );
      if (!alreadyMatched) {
        const id = `agent:${m.userId}`;
        if (!seen.has(id)) {
          seen.add(id);
          options.push({
            id,
            label: m.name || handle || m.email,
            kind: 'agent',
          });
        }
      }
    }
  }

  return options;
}
