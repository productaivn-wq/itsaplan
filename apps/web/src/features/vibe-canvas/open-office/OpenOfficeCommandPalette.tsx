'use client';

import * as React from 'react';
import {
  Activity,
  Building2,
  Command,
  CornerDownLeft,
  FileCheck2,
  FileText,
  GitBranch,
  Hexagon,
  Keyboard,
  LayoutGrid,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeStation,
  OpenOfficeTemplate,
} from '../types';
import type { OpenOfficeLens, OpenOfficeLocale } from './openOfficeConstants';

export function normalizeViText(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function fuzzyWord(hay: string, pat: string): number | null {
  if (!pat) return 0;
  let hi = 0;
  let score = 0;
  let prev = -2;
  for (const ch of pat) {
    const idx = hay.indexOf(ch, hi);
    if (idx === -1) return null;
    score += idx === prev + 1 ? 3 : 1;
    if (idx > hi) score -= Math.min((idx - hi) * 0.15, 1.2);
    prev = idx;
    hi = idx + 1;
  }
  return score;
}

export function fuzzyMatchScore(haystack: string, query: string): number | null {
  const normHay = normalizeViText(haystack);
  const normQ = normalizeViText(query.trim());
  if (!normQ) return 0;
  let total = 0;
  for (const w of normQ.split(/\s+/)) {
    if (!w) continue;
    const s = fuzzyWord(normHay, w);
    if (s === null) return null;
    total += s;
  }
  return total;
}

interface CmdPaletteItem {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  hay: string;
  bucket: number;
  common?: boolean;
  kbd?: string;
  avatarSeed?: string;
  avatarStatus?: string;
  icon: React.ReactNode;
  run: () => void;
}

export interface OpenOfficeCommandPaletteProps {
  open: boolean;
  shortcutsOpen: boolean;
  locale?: OpenOfficeLocale;
  stations: OpenOfficeStation[];
  departments: OpenOfficeDepartmentDossier[];
  contracts: OpenOfficeContract[];
  needsMyAction: OpenOfficeContract[];
  templates: OpenOfficeTemplate[];
  onOpenChange: (open: boolean) => void;
  onShortcutsOpenChange: (open: boolean) => void;
  onSwitchTab: (tab: 'floorplan' | 'contracts' | 'analytics' | 'governance') => void;
  onSwitchLens: (lens: OpenOfficeLens) => void;
  onSelectStation: (seatId: string) => void;
  onSelectDepartment: (zoneId: string) => void;
  onOpenQuickHitl: (contractId: string) => void;
  onSelectContract: (contractId: string) => void;
  onDispatchTemplate: (templateId?: string) => void;
}

const SHORTCUT_ROWS = [
  { keys: 'Ctrl+K / Cmd+K', vi: 'Mở hoặc đóng bảng lệnh tìm nhanh', en: 'Toggle quick command palette' },
  { keys: '?', vi: 'Mở bảng phím tắt hệ thống', en: 'Open keyboard shortcuts guide' },
  { keys: '↑ / ↓', vi: 'Di chuyển giữa các kết quả', en: 'Navigate search results' },
  { keys: 'Enter', vi: 'Thực thi lệnh đang chọn', en: 'Execute selected action' },
  { keys: 'Esc', vi: 'Đóng bảng lệnh hoặc bảng phím tắt', en: 'Close palette or modal' },
];

export default function OpenOfficeCommandPalette({
  open,
  shortcutsOpen,
  locale = 'vi',
  stations,
  departments,
  contracts,
  needsMyAction,
  templates,
  onOpenChange,
  onShortcutsOpenChange,
  onSwitchTab,
  onSwitchLens,
  onSelectStation,
  onSelectDepartment,
  onOpenQuickHitl,
  onSelectContract,
  onDispatchTemplate,
}: OpenOfficeCommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onOpenChange(!open);
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !open && !shortcutsOpen) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName ?? '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        onShortcutsOpenChange(true);
      }
      if (e.key === 'Escape') {
        if (open || shortcutsOpen) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        if (open) onOpenChange(false);
        if (shortcutsOpen) onShortcutsOpenChange(false);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', onGlobalKeyDown, true);
  }, [open, shortcutsOpen, onOpenChange, onShortcutsOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = window.setTimeout(() => {
      if (typeof navigator === 'undefined' || !/jsdom|HappyDOM/i.test(navigator.userAgent)) {
        inputRef.current?.focus();
      }
    }, 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  const items = React.useMemo<CmdPaletteItem[]>(() => {
    const out: CmdPaletteItem[] = [];
    const pushItem = (
      id: string,
      group: string,
      title: string,
      subtitle: string,
      bucket: number,
      icon: React.ReactNode,
      run: () => void,
      opts: { extraHay?: string; common?: boolean; kbd?: string; avatarSeed?: string; avatarStatus?: string } = {},
    ) => {
      out.push({
        id,
        group,
        title,
        subtitle,
        hay: `${title} ${subtitle} ${opts.extraHay || ''}`,
        bucket,
        common: opts.common,
        kbd: opts.kbd,
        avatarSeed: opts.avatarSeed,
        avatarStatus: opts.avatarStatus,
        icon,
        run,
      });
    };

    const gHitl = locale === 'en' ? 'Needs Your Review' : 'Cần bạn duyệt';
    const gViews = locale === 'en' ? 'Lenses & Workspaces' : 'Không gian & Phân hệ';
    const gTemplates = locale === 'en' ? 'Quick Dispatch Templates' : 'Giao việc từ mẫu hợp đồng';
    const gAgents = locale === 'en' ? 'AI Fleet' : 'Đội ngũ AI';
    const gDepts =
      locale === 'en'
        ? `SOP Departments (${departments.length})`
        : `Phòng ban SOP (${departments.length})`;
    const gContracts = locale === 'en' ? 'Active Contracts' : 'Hợp đồng việc';

    // Bucket 0: Needs My Action (opens Sovereign HITL Quick Drawer — never bypasses GW-SOD-01)
    for (const c of needsMyAction) {
      pushItem(
        `hitl-${c.id}`,
        gHitl,
        `${c.id} · ${c.title}`,
        locale === 'en'
          ? `Awaiting independent review · Lead: ${c.lead_agent_name || c.lead_agent_id}`
          : `Chờ nghiệm thu độc lập · Chủ trì: ${c.lead_agent_name || c.lead_agent_id}`,
        0,
        <ShieldAlert className="size-4 text-amber-500" />,
        () => onOpenQuickHitl(c.id),
        { extraHay: `duyet hitl sod ${c.project_key} ${c.domain}`, common: true },
      );
    }

    // Bucket 1: Views / Lenses + Templates
    pushItem(
      'view-pixel-2d',
      gViews,
      locale === 'en' ? '2D LimeZu Virtual Office' : 'Văn phòng 2D LimeZu',
      locale === 'en' ? 'Live sprite stage, animated doors & pets' : 'Sân khấu 2D, cửa tự động & thú cưng',
      1,
      <Sparkles className="size-4 text-primary" />,
      () => {
        onSwitchTab('floorplan');
        onSwitchLens('blueprint');
      },
      { extraHay: 'van phong 2d pixel limezu san khau', common: true },
    );
    pushItem(
      'view-bees',
      gViews,
      locale === 'en' ? 'Beehive Colony Stage' : 'Tổ ong AI (Beehive Colony)',
      locale === 'en'
        ? 'Queen & Worker bees live across SOP honeycomb cells'
        : 'Ong Chúa & Ong Thợ thực thi theo các ô SOP lục giác',
      1,
      <Hexagon className="size-4 text-primary" />,
      () => {
        onSwitchTab('floorplan');
        onSwitchLens('bees');
      },
      {
        extraHay: 'bees beehive colony honey dan ong to ong ong chua ong tho virtual office',
        common: true,
      },
    );
    pushItem(
      'view-fleet',
      gViews,
      locale === 'en' ? 'Fleet Matrix Lens' : 'Ma trận Đội ngũ',
      locale === 'en' ? 'Cross-project swimlanes by stage' : 'Bảng ma trận theo trạng thái thực thi',
      1,
      <LayoutGrid className="size-4 text-primary" />,
      () => {
        onSwitchTab('floorplan');
        onSwitchLens('fleet');
      },
      { extraHay: 'ma tran doi ngu fleet matrix' },
    );
    pushItem(
      'view-swarm',
      gViews,
      locale === 'en' ? 'Causal Swarm DAG' : 'Đồ thị Hợp đồng Đa Agent',
      locale === 'en' ? 'Verified lead-to-support execution graph' : 'Luồng cộng tác chủ trì – hỗ trợ xác thực',
      1,
      <GitBranch className="size-4 text-primary" />,
      () => {
        onSwitchTab('floorplan');
        onSwitchLens('swarm');
      },
      { extraHay: 'do thi hop dong dag swarm' },
    );
    pushItem(
      'view-contracts',
      gViews,
      locale === 'en' ? 'Contracts & Evidence Gate' : 'Hợp đồng & Nghiệm thu',
      locale === 'en' ? 'Full contract dossier, evidence & TaskRun #1..N' : 'Hồ sơ hợp đồng, bằng chứng & lịch sử chạy',
      1,
      <FileCheck2 className="size-4 text-primary" />,
      () => onSwitchTab('contracts'),
      { extraHay: 'hop dong bang chung nghiem thu contracts', common: true },
    );
    pushItem(
      'view-governance',
      gViews,
      locale === 'en' ? 'Org & Constitutional Governance' : 'Quản trị & Phân quyền',
      locale === 'en'
        ? `Company autonomy policy, ${departments.length} SOP departments & RBAC`
        : `Chính sách, ${departments.length} phòng ban SOP & ma trận 24x4`,
      1,
      <ShieldCheck className="size-4 text-primary" />,
      () => onSwitchTab('governance'),
      { extraHay: 'quan tri phan quyen rbac governance' },
    );
    pushItem(
      'view-analytics',
      gViews,
      locale === 'en' ? 'Performance Analytics & Ledger' : 'Thống kê & Sổ cái sự kiện',
      locale === 'en' ? 'Event-sourced KPIs & SHA-256 audit stream' : 'Hiệu suất đội ngũ & nhật ký SHA-256 bất biến',
      1,
      <Activity className="size-4 text-primary" />,
      () => onSwitchTab('analytics'),
      { extraHay: 'thong ke so lieu analytics telemetry' },
    );
    pushItem(
      'act-shortcuts',
      gViews,
      locale === 'en' ? 'View Keyboard Shortcuts' : 'Xem bảng phím tắt',
      locale === 'en' ? 'All keyboard shortcuts in Open Office' : 'Liệt kê mọi phím tắt thao tác nhanh',
      1,
      <Keyboard className="size-4 text-muted-foreground" />,
      () => onShortcutsOpenChange(true),
      { extraHay: 'phim tat shortcuts', kbd: '?' },
    );

    for (const tpl of templates) {
      pushItem(
        `tpl-${tpl.id}`,
        gTemplates,
        locale === 'en' ? `Dispatch from template: ${tpl.name}` : `Giao việc từ mẫu — ${tpl.name}`,
        tpl.default_output_format,
        2,
        <FileText className="size-4 text-primary" />,
        () => {
          onSwitchTab('floorplan');
          onDispatchTemplate(tpl.id);
        },
        { extraHay: `giao viec mau hop dong ${tpl.domain} ${tpl.id}` },
      );
    }

    // Bucket 3: AI Agents
    for (const st of stations) {
      pushItem(
        `agent-${st.seat_id}`,
        gAgents,
        st.agent_name,
        `${st.username || st.seat_id} · ${st.zone_name} · ${st.role}`,
        3,
        <Building2 className="size-4" />,
        () => {
          onSwitchTab('floorplan');
          onSelectStation(st.seat_id);
        },
        {
          extraHay: `${st.agent_id || ''} ${(st.active_project_keys || []).join(' ')}`,
          avatarSeed: st.agent_name,
          avatarStatus: st.status,
        },
      );
    }

    // Bucket 4: Departments
    for (const dept of departments) {
      pushItem(
        `dept-${dept.zone_id}`,
        gDepts,
        `${dept.uc_id} · ${dept.name}`,
        dept.mission,
        4,
        <Building2 className="size-4 text-primary" />,
        () => {
          onSwitchTab('floorplan');
          onSelectDepartment(dept.zone_id);
        },
        {
          extraHay: `${dept.zone_id} ${dept.uc_id} ${dept.sop_id || ''} ${(dept.primary_skills || []).join(' ')} ${dept.active_project_keys.join(' ')}`,
        },
      );
    }

    // Bucket 5: Contracts
    for (const c of contracts) {
      pushItem(
        `contract-${c.id}`,
        gContracts,
        `${c.id} · ${c.title}`,
        `[${c.project_key}] ${c.status} · ${c.lead_agent_name || c.lead_agent_id}`,
        5,
        <FileCheck2 className="size-4 text-muted-foreground" />,
        () => {
          onSelectContract(c.id);
          onSwitchTab('contracts');
        },
        { extraHay: `${c.project_key} ${c.domain} ${c.status}` },
      );
    }

    return out;
  }, [
    locale,
    needsMyAction,
    templates,
    stations,
    departments,
    contracts,
    onOpenQuickHitl,
    onSwitchTab,
    onSwitchLens,
    onShortcutsOpenChange,
    onDispatchTemplate,
    onSelectStation,
    onSelectDepartment,
    onSelectContract,
  ]);

  const results = React.useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const commonItems = items.filter((i) => i.common || i.bucket === 0);
      return commonItems.slice(0, 12);
    }
    const normQ = normalizeViText(trimmed);
    const scored: Array<{ item: CmdPaletteItem; titleHit: number; score: number }> = [];
    for (const item of items) {
      const s = fuzzyMatchScore(item.hay, trimmed);
      if (s !== null) {
        const titleHit = normalizeViText(item.title).includes(normQ) ? 1 : 0;
        scored.push({ item, titleHit, score: s });
      }
    }
    scored.sort(
      (a, b) => b.titleHit - a.titleHit || a.item.bucket - b.item.bucket || b.score - a.score,
    );
    const top = scored.slice(0, 24).map((x) => x.item);
    const grouped = new Map<string, CmdPaletteItem[]>();
    for (const item of top) {
      const arr = grouped.get(item.group);
      if (arr) arr.push(item);
      else grouped.set(item.group, [item]);
    }
    const ordered: CmdPaletteItem[] = [];
    for (const arr of grouped.values()) {
      ordered.push(...arr);
    }
    return ordered;
  }, [items, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmdk-idx="${selectedIndex}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex, open]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, results.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        onOpenChange(false);
        target.run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  let lastGroup = '';

  return (
    <>
      {open && (
        <div
          data-testid="open-office-command-palette"
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'en' ? 'Quick command palette' : 'Bảng lệnh tìm nhanh'}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/75 px-4 pt-16 backdrop-blur-xs"
          onClick={() => onOpenChange(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <Command className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                data-testid="input-cmdk-search"
                type="text"
                value={query}
                onInput={(e) => setQuery(e.currentTarget.value)}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  locale === 'en'
                    ? 'Search agents, departments, contracts, lenses...'
                    : 'Tìm AI, phòng ban, hợp đồng, chế độ xem... (gõ không dấu)'
                }
                aria-label={locale === 'en' ? 'Search command palette' : 'Tìm trong bảng lệnh'}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={locale === 'en' ? 'Close' : 'Đóng'}
                className="inline-flex h-7 items-center rounded-md border border-border bg-muted/40 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <kbd className="font-mono">ESC</kbd>
              </button>
            </div>

            <div
              ref={listRef}
              role="listbox"
              aria-label={locale === 'en' ? 'Command results' : 'Kết quả tìm kiếm'}
              className="max-h-96 overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {locale === 'en'
                    ? `No matching items for "${query}".`
                    : `Không tìm thấy kết quả phù hợp với "${query}".`}
                </p>
              ) : (
                results.map((item, idx) => {
                  const showHeader = item.group !== lastGroup;
                  lastGroup = item.group;
                  const isActive = idx === selectedIndex;
                  return (
                    <div key={item.id}>
                      {showHeader && (
                        <div className="px-2.5 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-cmdk-idx={idx}
                        data-testid={`cmdk-item-${item.id}`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                          onOpenChange(false);
                          item.run();
                        }}
                        className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-foreground">
                          {item.avatarSeed ? (
                            <PixelAgentAvatar
                              seed={item.avatarSeed}
                              status={item.avatarStatus}
                              size={20}
                            />
                          ) : (
                            item.icon
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{item.title}</span>
                          <span
                            className={`block truncate text-xs ${
                              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        </span>
                        {item.kbd && (
                          <kbd className="rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
                            {item.kbd}
                          </kbd>
                        )}
                        {isActive && <CornerDownLeft className="size-3.5 shrink-0 opacity-85" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/25 px-3.5 py-2 text-xs text-muted-foreground">
              <span>↑↓ {locale === 'en' ? 'select' : 'chọn'}</span>
              <span>↵ {locale === 'en' ? 'open' : 'mở'}</span>
              <span>? {locale === 'en' ? 'shortcuts' : 'phím tắt'}</span>
              <span className="ml-auto font-medium">
                {locale === 'en'
                  ? 'Approvals require independent review'
                  : 'Phê duyệt luôn qua kiểm duyệt độc lập'}
              </span>
            </div>
          </div>
        </div>
      )}

      {shortcutsOpen && (
        <div
          data-testid="open-office-shortcuts-modal"
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'en' ? 'Keyboard shortcuts' : 'Bảng phím tắt'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-4 backdrop-blur-xs"
          onClick={() => onShortcutsOpenChange(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Keyboard className="size-4 text-primary" />
                <span>{locale === 'en' ? 'Keyboard Shortcuts' : 'Phím tắt Văn phòng mở'}</span>
              </div>
              <button
                type="button"
                aria-label={locale === 'en' ? 'Close' : 'Đóng'}
                onClick={() => onShortcutsOpenChange(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              {SHORTCUT_ROWS.map((row) => (
                <div
                  key={row.keys}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs"
                >
                  <span className="text-foreground">{locale === 'en' ? row.en : row.vi}</span>
                  <kbd className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {row.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {locale === 'en'
                ? 'Navigation-only palette: approvals and rework returns always require independent review.'
                : 'Bảng lệnh chỉ điều hướng — phê duyệt và trả lại luôn qua kiểm duyệt độc lập.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
