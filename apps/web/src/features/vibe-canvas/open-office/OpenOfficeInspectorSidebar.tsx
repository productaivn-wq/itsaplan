'use client';

import { ArrowUpRight, Briefcase, Building2, Calendar, Cpu, FileCheck2, MessageSquare, Send, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { aiTeamPath, cyclesPath, dashboardsPath, documentsPath, inboxPath, initiativesPath, mcpServerPath, membersPath, notesPath, projectRefOf } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressiveDisclosure } from '@/components/common/ux/ProgressiveDisclosure';
import { Input } from '@/components/ui/input';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import { DETAILED_STAGE_META, computeAgentWorkloadAndStage, resolveCanonicalZoneId } from './openOfficeConstants';
import type { OpenOfficeLessonItem } from '../types';
import { OpenOfficeContractComposer } from './OpenOfficeContractComposer';
import type { OpenOfficeWorkspaceController } from './useOpenOfficeWorkspaceController';

export function OpenOfficeInspectorSidebar({ ctrl }: { ctrl: OpenOfficeWorkspaceController }) {
  const {
    agentInspectorTab,
    currentProjKey,
    currentTeamRef,
    departmentsList,
    dict,
    getStatusDotColor,
    handleOpenItem,
    handleQuickAssignFocus,
    handleSendQuickSteer,
    inspectorEntity,
    inspectorRailRef,
    pendingExecutionContracts,
    selectedDepartment,
    selectedStation,
    selectedZoneId,
    setActiveTab,
    setAgentInspectorTab,
    setInspectorEntity,
    setIsInspectorDrawerOpen,
    setSelectedContractId,
    setSelectedZoneId,
    setSteerMessage,
    shellCtx,
    snapshot,
    steerMessage,
    steerNotice,
    steerSubmitting,
  } = ctrl;

  const navigateAndCloseDrawer = (path: string) => {
    setIsInspectorDrawerOpen(false);
    navigateFeatureInstant(path);
  };

  return (
              <div className="min-w-0 space-y-2.5">
                <div
                  ref={inspectorRailRef}
                  className="w-full min-w-0 space-y-2.5 rounded-[20px] border border-border/85 bg-card p-3 shadow-[var(--studio-card-shadow)]"
                >
            {/* 1. Compact Mode Selector Header */}
            <div className="grid grid-cols-2 gap-1 border-b border-border pb-1.5">
              <Button
                type="button"
                size="sm"
                variant={inspectorEntity === 'agent' ? 'default' : 'outline'}
                onClick={() => setInspectorEntity('agent')}
                data-testid="btn-inspect-agent-mode"
                
                className="h-7 min-w-0 gap-1 px-2 text-xs truncate"
              >
                <Users className="size-3.5 shrink-0" />
                <span  className="truncate">
                  Nhân sự AI
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={inspectorEntity === 'department' ? 'default' : 'outline'}
                onClick={() => setInspectorEntity('department')}
                data-testid="btn-inspect-dept-mode"
                
                className="h-7 min-w-0 gap-1 px-2 text-xs truncate"
              >
                <Building2 className="size-3.5 shrink-0" />
                <span  className="truncate">
                  {selectedDepartment?.uc_id || 'Phòng ban'}
                </span>
              </Button>
            </div>

            {/* MODE 1: AGENT 4-TAB LIVE INSPECTOR */}
            {inspectorEntity === 'agent' && selectedStation && (
              <div data-testid="agent-live-inspector" className="min-w-0 space-y-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-[#1A140F] p-1">
                    <PixelAgentAvatar
                      seed={selectedStation.agent_name}
                      status={selectedStation.status}
                      size={30}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      
                      className="truncate text-xs font-bold text-foreground"
                    >
                      {selectedStation.agent_name}
                    </div>
                    <div
                      
                      className="truncate text-xs font-medium text-sky-700 dark:text-sky-400"
                    >
                      {selectedStation.role}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {(selectedStation.active_project_keys || ['PM']).map((pk) => (
                        <Badge
                          key={pk}
                          variant="secondary"
                          data-testid={`badge-agent-project-${pk}`}
                          className="font-mono text-xs"
                        >
                          [{pk}]
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Progressive Tabs Header (1x4 Grid Fits cleanly) */}
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/45 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={agentInspectorTab === 'now' ? 'secondary' : 'ghost'}
                    onClick={() => setAgentInspectorTab('now')}
                    data-testid="inspector-tab-now"
                    className="h-7 min-w-0 truncate px-1 text-xs"
                  >
                    Đang làm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={agentInspectorTab === 'next' ? 'secondary' : 'ghost'}
                    onClick={() => setAgentInspectorTab('next')}
                    data-testid="inspector-tab-next"
                    className="h-7 min-w-0 truncate px-1 text-xs"
                  >
                    Sắp làm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={agentInspectorTab === 'memory' ? 'secondary' : 'ghost'}
                    onClick={() => setAgentInspectorTab('memory')}
                    data-testid="inspector-tab-memory"
                    className="h-7 min-w-0 truncate px-1 text-xs"
                  >
                    Đúc kết
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={agentInspectorTab === 'modules' ? 'secondary' : 'ghost'}
                    onClick={() => setAgentInspectorTab('modules')}
                    data-testid="inspector-tab-modules"
                    className="h-7 min-w-0 truncate px-1 text-xs"
                  >
                    Liên kết
                  </Button>
                </div>

                {/* TAB 1: ĐANG LÀM (NOW) */}
                {agentInspectorTab === 'now' && (
                  <div className="min-w-0 space-y-2">
                    <div className="space-y-1.5 rounded-xl bg-muted/45 p-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {(() => {
                            const st = String(selectedStation.status || '').toUpperCase();
                            if (st === 'WORKING' || st === 'ACTIVE' || st === 'RUNNING') return 'Đang thực hiện';
                            if (st === 'AWAITING_HITL') return 'Chờ duyệt HITL';
                            if (st === 'STANDBY' || st === 'QUEUED' || st === 'MONITORING') return 'Trực lịch · Chờ chạy';
                            if (st === 'IDLE') return 'Đang rảnh';
                            return 'Đang thực hiện';
                          })()}
                        </span>
                        {selectedStation.zone_name && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            {selectedStation.zone_name}
                          </span>
                        )}
                        {(selectedStation.live_telemetry?.active_tool || selectedStation.tool_badge) && (
                          <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                            {selectedStation.live_telemetry?.active_tool || selectedStation.tool_badge}
                          </span>
                        )}
                        <span
                          className={`ml-auto size-2 shrink-0 rounded-full ${getStatusDotColor(selectedStation.status)}`}
                        />
                      </div>

                      {selectedStation.doing_now?.active_item && (
                        <div className="min-w-0">
                          <button
                            type="button"
                            data-testid="link-active-issue"
                            
                            onClick={() => handleOpenItem(selectedStation.doing_now?.active_item)}
                            className="inline-flex min-h-7 max-w-full items-center gap-1 text-left text-xs font-semibold text-primary hover:underline"
                          >
                            <span  className="truncate">
                              [{selectedStation.doing_now.active_item.project_key}]{' '}
                              {selectedStation.doing_now.active_item.identifier}:{' '}
                              {selectedStation.doing_now.active_item.title}
                            </span>
                            <ArrowUpRight className="size-3 shrink-0" />
                          </button>
                          {(selectedStation.doing_now.active_item.cycle_name ||
                            selectedStation.doing_now.active_item.initiative_title) && (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {selectedStation.doing_now.active_item.cycle_name && (
                                <Badge variant="outline" className="max-w-full truncate text-xs">
                                  Cycle: {selectedStation.doing_now.active_item.cycle_name}
                                </Badge>
                              )}
                              {selectedStation.doing_now.active_item.initiative_title && (
                                <Badge variant="secondary" className="max-w-full truncate text-xs">
                                  H1: {selectedStation.doing_now.active_item.initiative_title}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(() => {
                        const summaryText =
                          selectedStation.live_telemetry?.focus_text ||
                          selectedStation.live_telemetry?.prompt_snippet ||
                          selectedStation.doing_now?.summary ||
                          selectedStation.activity_bubble ||
                          selectedStation.room_reason ||
                          (`Đang trực tại ${selectedStation.zone_name}.`);
                        const stepText =
                          selectedStation.doing_now?.current_step ||
                          selectedStation.live_telemetry?.action_label;
                        const showStep = Boolean(stepText && stepText !== summaryText);
                        const recentActivities = selectedStation.doing_now?.recent_activities || [];
                        const concurrentSessions = selectedStation.live_telemetry?.concurrent_sessions || [];

                        return (
                          <div className="min-w-0 space-y-1">
                            {summaryText && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {summaryText}
                              </p>
                            )}
                            {showStep && (
                              <p className="truncate text-xs font-medium text-foreground/85">
                                <span className="text-muted-foreground">Bước hiện tại: </span>
                                {stepText}
                              </p>
                            )}
                            {concurrentSessions.length > 1 && (
                              <div data-testid="inspector-concurrent-sessions" className="space-y-1 pt-1">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                  Phiên live đang chạy ({concurrentSessions.length}):
                                </span>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {concurrentSessions.map((cs) => (
                                    <li
                                      key={cs.session_id}
                                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-1.5 py-1"
                                    >
                                      <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
                                        [{cs.session_id.slice(0, 6)}]
                                      </span>
                                      <span className="min-w-0 flex-1 truncate">
                                        {cs.focus_text || cs.prompt_snippet || cs.action_label || 'Live'}
                                      </span>
                                      {cs.active_tool && (
                                        <span className="shrink-0 rounded bg-primary/10 px-1 font-mono text-xs text-primary">
                                          {cs.active_tool}
                                        </span>
                                      )}
                                      {typeof cs.age_sec === 'number' && (
                                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                          {cs.age_sec}s
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {recentActivities.length > 0 && (
                              <div className="space-y-0.5 pt-0.5">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  Hoạt động gần đây:
                                </span>
                                <ul className="space-y-0.5 text-xs text-muted-foreground">
                                  {recentActivities.slice(0, 2).map((act, actIdx) => (
                                    <li key={actIdx} className="flex items-start gap-1">
                                      <span className="text-primary/70">•</span>
                                      <span className="line-clamp-1">{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Inline Quick Steer */}
                    <div className="space-y-1.5 rounded-xl bg-muted/45 p-2.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Điều hướng nhanh
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={steerMessage}
                          onChange={(e) => setSteerMessage(e.target.value)}
                          onInput={(e) =>
                            setSteerMessage((e.target as HTMLInputElement).value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && steerMessage.trim()) {
                              e.preventDefault();
                              void handleSendQuickSteer();
                            }
                          }}
                          placeholder={`Chỉ dẫn cho ${selectedStation.agent_name}...`}
                          data-testid="input-agent-quick-steer"
                          className="h-8 min-w-0 flex-1 text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={steerSubmitting || !steerMessage.trim()}
                          onClick={handleSendQuickSteer}
                          data-testid="btn-agent-quick-steer"
                          className="h-8 shrink-0 gap-1 px-2.5 text-xs"
                        >
                          <Send className="size-3" />
                          <span>Gửi chỉ dẫn</span>
                        </Button>
                      </div>
                      {steerNotice && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400">
                          {steerNotice}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: SẮP LÀM (NEXT) */}
                {agentInspectorTab === 'next' && (
                  <div className="min-w-0 space-y-2 text-xs">
                    <div className="space-y-1 rounded-xl bg-muted/45 p-2.5">
                      <span className="font-semibold text-foreground">Các bước tiếp theo</span>
                      {(selectedStation.going_to_do_next?.next_steps || []).map((step, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-muted-foreground">
                          <span className="font-mono text-sky-600 dark:text-sky-400">
                            {idx + 1}.
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 rounded-xl bg-muted/45 p-2.5">
                      <span className="font-semibold text-foreground">Hàng đợi</span>
                      {(selectedStation.going_to_do_next?.queued_items || []).map((item) => (
                        <div
                          key={item.identifier}
                          className="flex min-w-0 items-center gap-1 rounded-lg bg-background/70 p-1.5"
                        >
                          <button
                            type="button"
                            
                            onClick={() => handleOpenItem(item)}
                            className="flex min-h-7 min-w-0 flex-1 items-center gap-1 truncate text-left text-xs text-primary hover:underline"
                          >
                            <span  className="truncate">
                              [{item.project_key}] {item.identifier}: {item.title}
                            </span>
                            <ArrowUpRight className="size-3 shrink-0" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {(selectedStation.going_to_do_next?.upcoming_schedules || []).length > 0 && (
                      <div className="space-y-1 rounded-xl bg-muted/45 p-2.5">
                        <span className="font-semibold text-foreground">Lịch chạy tự động</span>
                        {(selectedStation.going_to_do_next?.upcoming_schedules || []).slice(0, 3).map((sc) => (
                          <div
                            key={sc.schedule_id}
                            className="flex min-w-0 items-center justify-between gap-1 rounded-lg bg-background/70 p-1.5 text-xs"
                          >
                            <span className="truncate font-medium text-foreground">
                              [{sc.project_key}] {sc.name}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                              {sc.cron}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="btn-assign-to-agent"
                        onClick={() => handleQuickAssignFocus(selectedStation.agent_id || undefined)}
                        className="w-full gap-1 text-xs"
                      >
                        <Sparkles className="size-3 shrink-0" />
                        <span>Giao thêm việc cho agent</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 3: TRÍ NHỚ (MEMORY) */}
                {agentInspectorTab === 'memory' && (
                  <div className="min-w-0 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/45 p-2.5 text-center">
                      <div>
                        <span className="text-muted-foreground">Đã xong</span>
                        <div className="font-mono font-bold text-foreground">
                          {selectedStation.memory_digest?.completed_runs_total ?? 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Làm lại</span>
                        <div className="font-mono font-bold text-foreground">
                          {selectedStation.memory_digest?.rework_count ?? 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qua lần 1</span>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {selectedStation.memory_digest?.first_pass_pct ?? 0}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 rounded-xl bg-muted/45 p-2.5">
                      <span className="font-semibold text-foreground">Bài học đúc kết</span>
                      {(selectedStation.memory_digest?.lessons || []).map(
                        (ls: OpenOfficeLessonItem | string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1 text-muted-foreground">
                          <span className="text-primary">•</span>
                          <span>
                            {typeof ls === 'string'
                              ? ls
                              : [ls?.feedback_reason, ls?.crystallized_rule].filter(Boolean).join(' → ')}
                          </span>
                        </div>
                      ))}
                      <div className="pt-0.5 text-muted-foreground">
                        Quy chuẩn: Không Fix mõm · 0 FAIL thực chứng
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: LIÊN KẾT PHÂN HỆ (MODULES) */}
                {agentInspectorTab === 'modules' && (
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="portal-agent-chat"
                      onClick={() => {
                        setIsInspectorDrawerOpen(false);
                        if (shellCtx?.onChatWithAgent && selectedStation?.itsaplan_agent_id) {
                          shellCtx.onChatWithAgent(selectedStation.itsaplan_agent_id);
                        } else {
                          navigateFeatureInstant(aiTeamPath(projectRefOf(currentTeamRef, currentProjKey), 'agents'));
                        }
                      }}
                      className="min-h-8 justify-start gap-1.5 text-xs"
                    >
                      <MessageSquare className="size-3.5 shrink-0 text-emerald-500" />
                      <span>Chat trực tiếp với Agent</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="portal-team-agents"
                      onClick={() => navigateAndCloseDrawer(aiTeamPath(projectRefOf(currentTeamRef, currentProjKey), 'agents'))}
                      className="min-h-8 justify-start gap-1.5 text-xs"
                    >
                      <Users className="size-3.5 shrink-0 text-sky-500" />
                      <span>Hồ sơ Agent &amp; Cấu hình</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="portal-inbox"
                      onClick={() => navigateAndCloseDrawer(inboxPath(projectRefOf(currentTeamRef, currentProjKey)))}
                      className="min-h-8 justify-start gap-1.5 text-xs"
                    >
                      <FileCheck2 className="size-3.5 shrink-0 text-amber-500" />
                      <span>Hộp thư &amp; Duyệt</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="portal-schedules"
                      onClick={() => navigateAndCloseDrawer(aiTeamPath(projectRefOf(currentTeamRef, currentProjKey), 'schedules'))}
                      className="min-h-8 justify-start gap-1.5 text-xs"
                    >
                      <Calendar className="size-3.5 shrink-0 text-purple-500" />
                      <span>Lịch chạy tự động</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="portal-mcp-vault"
                      onClick={() => navigateAndCloseDrawer(mcpServerPath(projectRefOf(currentTeamRef, currentProjKey)))}
                      className="min-h-8 justify-start gap-1.5 text-xs"
                    >
                      <Cpu className="size-3.5 shrink-0 text-rose-500" />
                      <span>Kỹ năng, MCP &amp; Vault</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: DYNAMIC SOP DEPARTMENT DOSSIER */}
            {inspectorEntity === 'department' && selectedDepartment && (
              <div data-testid="department-live-inspector" className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="default" className="font-mono text-xs font-bold">
                    {selectedDepartment.uc_id}
                  </Badge>
                  <h4 className="text-xs font-bold text-foreground">
                    {selectedDepartment.name}
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground">{selectedDepartment.mission}</p>

                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted/45 p-2.5 text-center text-xs">
                  {selectedDepartment.kpis.slice(0, 4).map((kpi, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-muted-foreground">{kpi.label}</span>
                      <div className="font-mono font-bold text-foreground">{kpi.value}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 rounded-xl bg-muted/45 p-2.5 text-xs">
                  <span className="font-semibold text-foreground">Hạng mục tiêu biểu</span>
                  {selectedDepartment.featured_items.map((item) => (
                    <button
                      key={item.identifier}
                      type="button"
                      
                      onClick={() => handleOpenItem(item)}
                      className="flex min-h-8 w-full min-w-0 items-center gap-1 rounded-lg bg-background/70 p-1.5 text-left transition-colors hover:bg-background"
                    >
                      <span
                        
                        className="min-w-0 flex-1 truncate font-semibold text-primary"
                      >
                        [{item.project_key}] {item.identifier}: {item.title}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  size="sm"
                  
                  onClick={() =>
                    handleQuickAssignFocus(
                      selectedDepartment.recommended_agent_ids[0],
                      selectedDepartment.default_template_id
                    )
                  }
                  data-testid="btn-dept-primary-cta"
                  className="min-h-8 w-full min-w-0 gap-1 text-xs"
                >
                  <Briefcase className="size-3.5 shrink-0" />
                  <span  className="truncate">
                    {selectedDepartment.primary_cta_label}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="btn-dept-open-governance"
                  onClick={() => {
                    setSelectedZoneId(selectedDepartment.zone_id);
                    setActiveTab('governance');
                  }}
                  className="min-h-8 w-full min-w-0 gap-1.5 text-xs"
                >
                  <SlidersHorizontal className="size-3.5 shrink-0 text-primary" />
                  <span>{dict.deptEditGovernance}</span>
                </Button>

                <div className="grid grid-cols-2 gap-1 pt-0.5 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(initiativesPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Sáng kiến</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(cyclesPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Chu kỳ</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(dashboardsPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Bảng điều khiển</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(documentsPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Tài liệu</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(notesPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Biên bản Kara</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateAndCloseDrawer(membersPath(projectRefOf(currentTeamRef, currentProjKey)))}
                    className="min-h-8 justify-start px-2 text-xs"
                  >
                    <span>Thành viên</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 4. Visible Department Jump Strip (0 sr-only focus traps) */}
            <div className="flex flex-nowrap gap-1 overflow-x-auto border-t border-border pt-1.5 scrollbar-none">
              {departmentsList.map((dept) => (
                <button
                  key={dept.zone_id}
                  type="button"
                  data-testid={`dept-pill-${dept.zone_id}`}
                  onClick={() => {
                    setSelectedZoneId(dept.zone_id);
                    setInspectorEntity('department');
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs transition-colors ${
                    resolveCanonicalZoneId(selectedZoneId, snapshot.zones) === resolveCanonicalZoneId(dept.zone_id, snapshot.zones) && inspectorEntity === 'department'
                      ? 'border-primary bg-primary/12 font-semibold text-foreground'
                      : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          <OpenOfficeContractComposer ctrl={ctrl} />

          {/* ⏳ CHỜ CHẠY Queue Card */}
          <div
            data-testid="pending-execution-queue"
            className="rounded-[20px] border border-border bg-card p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold tracking-wide text-foreground">
                ⏳ {dict.pendingQueueHeading}
              </h3>
              {pendingExecutionContracts.length > 0 && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-200">
                  {pendingExecutionContracts.length}
                </span>
              )}
            </div>

            {pendingExecutionContracts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Hiện không có hợp đồng nào đang chờ chạy.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pendingExecutionContracts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedContractId(c.id);
                      setActiveTab('contracts');
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted/25 px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">
                        {c.issue_identifier ? `[${c.issue_identifier}] ` : ''}
                        {c.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.lead_agent_name || c.lead_agent_id}
                        {c.project_key ? ` · ${c.project_key}` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
  );
}

export function OpenOfficeLiveTeamStrip({ ctrl }: { ctrl: OpenOfficeWorkspaceController }) {
  const {
    dict,
    displayedStations,
    inspectorEntity,
    locale,
    officeMode,
    revealInspectorIfStacked,
    selectedStationId,
    setActiveTab,
    setComposerLeadAgentId,
    setInspectorEntity,
    setSelectedContractId,
    setSelectedStationId,
    snapshot,
  } = ctrl;

  const workingCount = displayedStations.filter(
    (s) =>
      s.status === 'WORKING' ||
      s.status === 'ACTIVE' ||
      s.status === 'RUNNING' ||
      Boolean(s.live_telemetry?.is_live_executing)
  ).length;

  return (
    <>
      <div
        data-testid="gather-people-sidebar"
        className="w-full rounded-[20px] border border-border bg-card p-3.5 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold tracking-wide text-foreground">
            {dict.liveTeamHeading}
          </h3>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
            {displayedStations.length} AI
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-2">
          {displayedStations.map((s) => {
            const isSel = selectedStationId === s.seat_id && inspectorEntity === 'agent';
            const workload = computeAgentWorkloadAndStage(s, snapshot.contracts, locale);
            const stageMeta = DETAILED_STAGE_META[workload.detailedStage];
            const rawHandle = s.username || s.agent_name;
            const fmtHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
            const workloadLabel =
              workload.isOverloaded && officeMode === 'full'
                ? `⚠ Quá tải · ${workload.activeCount}`
                : workload.activeCount > 0
                  ? `${workload.activeCount} việc`
                  : null;

            return (
              <div
                key={s.seat_id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedStationId(s.seat_id);
                  setInspectorEntity('agent');
                  if (s.agent_id) setComposerLeadAgentId(s.agent_id);
                  revealInspectorIfStacked();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStationId(s.seat_id);
                    setInspectorEntity('agent');
                    if (s.agent_id) setComposerLeadAgentId(s.agent_id);
                    revealInspectorIfStacked();
                  }
                }}
                className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                  isSel
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/20 text-foreground/90 hover:bg-muted/45'
                }`}
              >
                <div className="relative shrink-0 pt-0.5">
                  <PixelAgentAvatar
                    seed={s.agent_name}
                    status={s.status}
                    size={28}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                      <span className="font-semibold text-foreground">{s.agent_name}</span>{' '}
                      <span className="font-mono text-xs text-muted-foreground">{fmtHandle}</span>
                    </div>
                    <span
                      className={`size-2 shrink-0 rounded-full ${stageMeta.dotClass}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stageMeta.badgeClass}`}
                    >
                      {workload.detailedStageLabel}
                    </span>
                    {workloadLabel && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${
                          workload.isOverloaded && officeMode === 'full'
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        {workloadLabel}
                      </span>
                    )}
                  </div>
                  {workload.primaryContract && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContractId(workload.primaryContract!.id);
                        setActiveTab('contracts');
                      }}
                      className="block max-w-full whitespace-normal break-words text-left text-xs font-medium leading-snug text-primary hover:underline"
                      title={workload.primaryContract.title}
                    >
                      {workload.primaryContract.issue_identifier
                        ? `[${workload.primaryContract.issue_identifier}] `
                        : ''}
                      {workload.primaryContract.title}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProgressiveDisclosure
        label={locale === 'en' ? 'Live activity feed' : 'Luồng hoạt động trực tiếp'}
        summary={`${workingCount}/${displayedStations.length} đang chạy`}
        defaultOpen={officeMode === 'full'}
        keepMounted
        triggerTestId="btn-toggle-live-activity-stream"
        triggerVariant="row"
      >
        <div
          data-testid="live-agent-activity-stream"
          className="w-full rounded-[20px] border border-border bg-card p-4 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold tracking-wide text-foreground">
                {dict.stageFeedHeading}
              </h3>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
              {workingCount}/{displayedStations.length} đang chạy thực
              {typeof snapshot.live_sessions_count === 'number' && snapshot.live_sessions_count > 0
                ? ` · ${snapshot.live_sessions_count} phiên live`
                : ''}
            </span>
          </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(() => {
            const rawItems =
              snapshot.live_activity_feed && snapshot.live_activity_feed.length > 0
                ? snapshot.live_activity_feed
                : displayedStations.map((s) => ({
                    id: `st-feed-${s.seat_id}`,
                    agent_id: s.username || s.agent_id,
                    agent_name: s.agent_name,
                    seat_id: s.seat_id,
                    zone_id: s.zone_id,
                    zone_name: s.zone_name,
                    active_tool: s.live_telemetry?.active_tool || s.tool_badge || null,
                    summary: s.doing_now?.summary || s.activity_bubble || s.room_reason || '',
                    step_index: s.live_telemetry?.step_index ?? null,
                    age_sec: s.live_telemetry?.age_sec ?? null,
                    status: s.status,
                  }));
            const dedupMap = new Map<string, (typeof rawItems)[number] & { repeatCount: number }>();
            for (const entry of rawItems) {
              const normAgent = String(entry.agent_id || '').replace(/^@/, '').toLowerCase();
              const sig = `${normAgent}::${entry.active_tool || ''}::${entry.summary || ''}`;
              const existing = dedupMap.get(sig);
              if (existing) {
                existing.repeatCount += 1;
              } else {
                dedupMap.set(sig, { ...entry, repeatCount: 1 });
              }
            }
            return Array.from(dedupMap.values()).slice(0, 7);
          })().map((item) => {
            const matchedStation = displayedStations.find(
              (st) =>
                (item.seat_id && st.seat_id === item.seat_id) ||
                st.username === (item.agent_id || '').replace(/^@/, '') ||
                st.agent_id === item.agent_id ||
                st.agent_name === item.agent_name
            );
            const itemWorkload = matchedStation
              ? computeAgentWorkloadAndStage(matchedStation, snapshot.contracts, locale)
              : null;
            const rawStatus = String(item.status || '').toUpperCase();
            const fallbackStage = (
              rawStatus === 'AWAITING_HITL' || rawStatus === 'REVIEW'
                ? 'review'
                : rawStatus === 'RETURNED_FOR_REWORK'
                  ? 'returned'
                  : rawStatus === 'EVIDENCE_SUBMITTED'
                    ? 'result'
                    : rawStatus === 'WORKING' ||
                        rawStatus === 'ACTIVE' ||
                        rawStatus === 'RUNNING' ||
                        rawStatus === 'IN_PROGRESS'
                      ? 'running'
                      : rawStatus === 'ACCEPTED' || rawStatus === 'ASSIGNED'
                        ? 'accepted'
                        : rawStatus === 'QUEUED' ||
                            rawStatus === 'PENDING' ||
                            rawStatus === 'STANDBY' ||
                            rawStatus === 'TODO' ||
                            rawStatus === 'WAIT'
                          ? 'waiting'
                          : rawStatus === 'DONE' || rawStatus === 'APPROVED'
                            ? 'done'
                            : 'idle'
            ) as keyof typeof DETAILED_STAGE_META;
            const resolvedStage = itemWorkload?.detailedStage ?? fallbackStage;
            const stageMeta = DETAILED_STAGE_META[resolvedStage];
            const stageLabel = itemWorkload?.detailedStageLabel ?? stageMeta[locale];
            const locationLabel = item.zone_name || matchedStation?.zone_name || '';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const targetSeat =
                    item.seat_id ||
                    displayedStations.find(
                      (st) =>
                        st.username === (item.agent_id || '').replace(/^@/, '') ||
                        st.agent_id === item.agent_id
                    )?.seat_id;
                  if (targetSeat) {
                    setSelectedStationId(targetSeat);
                    setInspectorEntity('agent');
                    revealInspectorIfStacked();
                  }
                }}
                className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50"
              >
                <div className="shrink-0 pt-0.5">
                  <PixelAgentAvatar
                    seed={item.agent_name}
                    status={item.status || 'ACTIVE'}
                    size={24}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="shrink-0 font-mono font-bold text-foreground">
                      {(item.agent_id || '').startsWith('@') ? item.agent_id : `@${item.agent_id || 'agent'}`}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stageMeta.badgeClass}`}
                    >
                      {stageLabel}
                    </span>
                    {locationLabel && (
                      <span className="truncate text-xs text-muted-foreground">
                        {locationLabel}
                      </span>
                    )}
                    {item.active_tool && (
                      <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-primary">
                        {item.active_tool}
                      </span>
                    )}
                    {item.repeatCount > 1 && (
                      <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground/80">
                        ×{item.repeatCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </ProgressiveDisclosure>
    </>
  );
}
