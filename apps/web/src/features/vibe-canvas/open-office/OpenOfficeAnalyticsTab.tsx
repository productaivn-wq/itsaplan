'use client';

import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { OpenOfficeAnalytics } from '../types';

export function OpenOfficeAnalyticsTab({
  analytics,
  needsMyActionCount = 0,
}: {
  analytics: OpenOfficeAnalytics;
  needsMyActionCount?: number;
}) {
  return (
            <div className="flex min-w-0 flex-col space-y-4 p-4">
              {/* Reconciled Badge Header */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-foreground">
                      Trạng thái đối soát sự kiện bất biến
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {analytics.event_log_reconciled
                        ? 'Đối soát 100% từ Nhật ký sự kiện chỉ-ghi-thêm (Immutable Event Sourcing)'
                        : 'Đang đồng bộ hóa sổ cái sự kiện...'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={analytics.event_log_reconciled ? 'default' : 'secondary'}
                  className="ml-auto text-xs"
                >
                  {analytics.event_log_reconciled
                    ? 'Đã đối soát 100% · EVENT_LOG_RECONCILED'
                    : 'Đang xử lý'}
                </Badge>
              </div>
    
              {/* 4 KPI Metric Band (V60 Editorial Hairline Divide) */}
              <div className="grid grid-cols-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-card-foreground sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="space-y-1 p-3.5">
                  <span className="text-xs text-muted-foreground">Tổng hợp đồng</span>
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analytics.total_contracts ?? 0}
                  </div>
                </div>
                <div className="space-y-1 p-3.5">
                  <span className="text-xs text-muted-foreground">Cần tôi xử lý</span>
                  <div className="font-mono text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
                    {analytics.needs_my_action_count ?? needsMyActionCount}
                  </div>
                </div>
                <div className="space-y-1 p-3.5">
                  <span className="text-xs text-muted-foreground">Tổng lượt chạy TaskRun</span>
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analytics.total_runs ?? 0}
                  </div>
                </div>
                <div className="space-y-1 p-3.5">
                  <span className="text-xs text-muted-foreground">Tổng sự kiện bất biến</span>
                  <div className="font-mono text-2xl font-bold tabular-nums text-primary">
                    {analytics.total_events ?? 0}
                  </div>
                </div>
              </div>
    
              {/* Workload & Domain Progress */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Per-Agent Workload Bars */}
                <Card className="space-y-3 border-border bg-card p-4 text-card-foreground">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tải công việc theo nhân viên AI
                  </h4>
                  <div className="space-y-2">
                    {analytics.agent_workload &&
                      Object.entries(analytics.agent_workload).map(([agent, rawVal]) => {
                        const valObj =
                          rawVal && typeof rawVal === 'object'
                            ? (rawVal as Record<string, unknown>)
                            : null;
                        const countNum =
                          typeof rawVal === 'number'
                            ? rawVal
                            : Number(
                                valObj?.total_contracts ??
                                  valObj?.total ??
                                  valObj?.active_count ??
                                  valObj?.active ??
                                  0
                              );
                        const safeCount = Number.isFinite(countNum) ? countNum : 0;
                        return (
                          <div key={agent} className="space-y-1 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                              <span className="font-medium text-foreground">{agent}</span>
                              <span className="ml-auto font-mono tabular-nums whitespace-nowrap">
                                {safeCount} hợp đồng
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, safeCount * 35))}%` }}
                                className="h-full rounded-full bg-primary transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
    
                {/* Domain Progress Bars */}
                <Card className="space-y-3 border-border bg-card p-4 text-card-foreground">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tiến độ hoàn thành theo nghiệp vụ
                  </h4>
                  <div className="space-y-2">
                    {analytics.domain_progress &&
                      Object.entries(analytics.domain_progress).map(([domain, rawPct]) => {
                        let pctNum = 0;
                        if (typeof rawPct === 'number') {
                          pctNum = rawPct;
                        } else if (rawPct && typeof rawPct === 'object') {
                          const obj = rawPct as {
                            completion_pct?: unknown;
                            total?: unknown;
                            done?: unknown;
                          };
                          if (typeof obj.completion_pct === 'number') {
                            pctNum = obj.completion_pct;
                          } else if (Number(obj.total) > 0) {
                            pctNum = Math.round((Number(obj.done || 0) / Number(obj.total)) * 1000) / 10;
                          }
                        }
                        const safePct = Number.isFinite(pctNum) ? pctNum : 0;
                        return (
                          <div key={domain} className="space-y-1 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                              <span className="font-medium text-foreground">{domain}</span>
                              <span className="ml-auto font-mono tabular-nums whitespace-nowrap">
                                {safePct}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, safePct))}%` }}
                                className="h-full rounded-full bg-emerald-500 transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              </div>
    
              {/* Recent Immutable Event Stream */}
              <Card className="space-y-3 border-border bg-card p-4 text-card-foreground">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dòng sự kiện chỉ-ghi-thêm gần đây
                </h4>
                <div className="space-y-2">
                  {analytics.recent_events &&
                    analytics.recent_events.map((ev) => {
                      const hashStr = ev.sha256_hash || ev.event_hash || '';
                      return (
                        <div
                          key={ev.event_id}
                          className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/20 p-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{ev.event_type}</span>
                            <span className="text-muted-foreground">bởi {ev.actor_id}</span>
                            {ev.contract_id && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {ev.contract_id}
                              </Badge>
                            )}
                          </div>
                          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                            {hashStr ? `${hashStr.substring(0, 20)}...` : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>
  );
}
