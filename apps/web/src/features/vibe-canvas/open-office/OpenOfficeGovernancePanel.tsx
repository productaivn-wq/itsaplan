'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  Building2,
  Check,
  Lock,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepSectionTabs } from '@/components/common/ux/StepSectionTabs';
import { Input } from '@/components/ui/input';
import { companySettingsPath, membersPath, projectRefOf, teamSectionPath } from '@/utils/paths';
import type {
  OpenOfficeCompanyPolicy,
  OpenOfficeDepartmentDossier,
  OpenOfficeDepartmentPatch,
  OpenOfficeGovernanceSnapshot,
  OpenOfficeStation,
  OpenOfficeTemplate,
  OpenOfficeZone,
} from '../types';
import {
  buildDynamicRoomSpecs,
  resolveCanonicalZoneId,
  useOpenOfficeLocale,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface OpenOfficeGovernancePanelProps {
  apiBaseUrl: string;
  teamRef: string;
  projectKey: string;
  zones?: OpenOfficeZone[];
  departments: OpenOfficeDepartmentDossier[];
  stations: OpenOfficeStation[];
  templates: OpenOfficeTemplate[];
  focusedZoneId?: string | null;
  locale?: OpenOfficeLocale;
  onNavigate: (path: string) => void;
  onApplyDepartmentPatch: (patch: OpenOfficeDepartmentPatch) => void;
}

const FALLBACK_PERMISSION_RESOURCES: Array<{ key: string; label: string; domain: string }> = [
  { key: 'work_items', label: 'Hạng mục công việc (Work Items)', domain: 'Delivery' },
  { key: 'initiatives', label: 'Sáng kiến (Initiatives)', domain: 'Strategy' },
  { key: 'cycles', label: 'Chu kỳ Sprint (Cycles)', domain: 'Delivery' },
  { key: 'dashboards', label: 'Bảng điều khiển (Dashboards)', domain: 'Analytics' },
  { key: 'documents', label: 'Tài liệu & Đặc tả (Documents)', domain: 'Knowledge' },
  { key: 'views', label: 'Góc nhìn bộ lọc (Saved Views)', domain: 'Delivery' },
  { key: 'members_invite', label: 'Mời thành viên (Invite Members)', domain: 'People' },
  { key: 'members_manage', label: 'Quản trị thành viên & Vai trò', domain: 'People' },
  { key: 'states', label: 'Trạng thái quy trình (States)', domain: 'Workflow' },
  { key: 'issue_types', label: 'Loại công việc (Issue Types)', domain: 'Workflow' },
  { key: 'labels', label: 'Nhãn phân loại (Labels)', domain: 'Workflow' },
  { key: 'ai_agents', label: 'Đội ngũ AI Agents', domain: 'Agentic OS' },
  { key: 'integrations', label: 'Tích hợp ngoài (Integrations)', domain: 'Platform' },
  { key: 'agent_skills', label: 'Kỹ năng Agent (Skills)', domain: 'Agentic OS' },
  { key: 'agent_tools', label: 'Công cụ & MCP (Agent Tools)', domain: 'Agentic OS' },
  { key: 'custom_fields', label: 'Trường tùy chỉnh (Custom Fields)', domain: 'Workflow' },
  { key: 'issue_templates', label: 'Mẫu hợp đồng & Issue', domain: 'Workflow' },
  { key: 'workflow_config', label: 'Cấu hình luồng FSM', domain: 'Workflow' },
  { key: 'actions', label: 'Tự động hóa (Actions)', domain: 'Platform' },
  { key: 'webhooks', label: 'Webhooks sự kiện', domain: 'Platform' },
  { key: 'repositories', label: 'Kho mã nguồn Git', domain: 'Engineering' },
  { key: 'note_boards', label: 'Biên bản Kara & Ghi chú', domain: 'Knowledge' },
  { key: 'danger_zone', label: 'Vùng trọng yếu (Danger Zone)', domain: 'Security' },
  { key: 'import_export', label: 'Nhập / Xuất dữ liệu', domain: 'Platform' },
];

const FALLBACK_COMPANY_POLICY: OpenOfficeCompanyPolicy = {
  company_name: 'Accord Sovereign AI Workspace',
  legal_name: 'Accord Digital Operations',
  slug: 'thanb',
  domain: 'itsaplan.local',
  industry: 'Autonomous Enterprise Software',
  timezone: 'Asia/Ho_Chi_Minh',
  default_locale: 'vi',
  default_autonomy_tier: 'TIER_1',
  require_sod_approval: true,
  allow_agent_team_bootstrap: true,
};

function buildDefaultRolePresets(): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const res of FALLBACK_PERMISSION_RESOURCES) {
    const isDanger = ['danger_zone', 'members_manage', 'webhooks'].includes(res.key);
    const isAdminCfg = ['workflow_config', 'integrations', 'repositories', 'import_export'].includes(res.key);
    out[res.key] = {
      owner: ['create', 'edit', 'read', 'delete'],
      manager: res.key === 'danger_zone' ? ['read'] : ['create', 'edit', 'read', 'delete'],
      member: isDanger || isAdminCfg ? ['read'] : ['create', 'edit', 'read'],
      guest: res.key === 'danger_zone' ? [] : ['read'],
      agt_tier1: isDanger ? [] : isAdminCfg ? ['read'] : ['create', 'edit', 'read'],
    };
  }
  return out;
}

export default function OpenOfficeGovernancePanel({
  apiBaseUrl,
  teamRef,
  projectKey,
  zones,
  departments,
  stations,
  templates,
  focusedZoneId,
  locale: localeProp,
  onNavigate,
  onApplyDepartmentPatch,
}: OpenOfficeGovernancePanelProps) {
  const detectedLocale = useOpenOfficeLocale();
  const activeLocale = localeProp ?? detectedLocale;
  const isVi = activeLocale === 'vi';
  const [policy, setPolicy] = React.useState<OpenOfficeCompanyPolicy>(FALLBACK_COMPANY_POLICY);
  const [govSnapshot, setGovSnapshot] = React.useState<OpenOfficeGovernanceSnapshot | null>(null);
  const [policySaving, setPolicySaving] = React.useState<boolean>(false);
  const [policyNotice, setPolicyNotice] = React.useState<string | null>(null);

  const orderedDepts = React.useMemo(() => {
    const byCanonical = new Map<string, OpenOfficeDepartmentDossier>();
    for (const d of departments) {
      byCanonical.set(resolveCanonicalZoneId(d.zone_id || d.id, zones), d);
    }
    const govDepts = govSnapshot?.departments || [];
    const govByCanonical = new Map<string, (typeof govDepts)[number]>();
    const govDeptsMapped: OpenOfficeDepartmentDossier[] = govDepts.map((g) => {
      const cid = resolveCanonicalZoneId(g.frontend_zone_id || g.id, zones);
      govByCanonical.set(cid, g);
      return {
        zone_id: g.frontend_zone_id || g.id,
        id: g.id,
        sop_id: g.sop_id,
        uc_id: g.sop_id || g.use_case_id,
        use_case_id: g.use_case_id,
        name: g.name,
        en_name: g.en_name,
        mission: g.subtitle,
        subtitle: g.subtitle,
        en_subtitle: g.en_subtitle,
        primary_skills: g.primary_skills,
        is_spine: g.is_spine,
        order: g.order,
        visual_slot: g.visual_slot,
        primary_cta_label: g.primary_cta_label,
        default_template_id: g.default_template_id,
        recommended_agent_ids: g.recommended_agent_ids,
        active_agent_names: [],
        active_project_keys: [],
        kpis: [],
        featured_items: [],
        module_portals: [],
      };
    });
    return buildDynamicRoomSpecs(
      zones,
      departments.length > 0 ? departments : govDeptsMapped,
    ).map((spec) => {
      const existing = byCanonical.get(spec.canonicalId);
      const govItem = govByCanonical.get(spec.canonicalId);
      return {
        canonicalId: spec.canonicalId,
        ucCode:
          existing?.sop_id || existing?.uc_id || govItem?.sop_id || spec.sopId || spec.ucCode,
        name: existing?.name || govItem?.name || (isVi ? spec.viTitle : spec.enTitle),
        mission:
          existing?.mission || govItem?.subtitle || (isVi ? spec.viSubtitle : spec.enSubtitle),
        primaryCtaLabel:
          existing?.primary_cta_label || govItem?.primary_cta_label || 'Giao hợp đồng SLA',
        defaultTemplateId:
          existing?.default_template_id ||
          govItem?.default_template_id ||
          templates[0]?.id ||
          'doc_synthesis',
        recommendedAgentIds:
          existing?.recommended_agent_ids || govItem?.recommended_agent_ids || ['@antigravity'],
        isSpine: spec.isSpine,
        primarySkills: spec.primarySkills,
      };
    });
  }, [zones, departments, govSnapshot?.departments, templates, isVi]);

  const defaultDeptId = React.useMemo(
    () =>
      orderedDepts.find((d) => d.isSpine)?.canonicalId ||
      orderedDepts[0]?.canonicalId ||
      'sop_generic_7p',
    [orderedDepts],
  );

  const [selectedCanonicalDept, setSelectedCanonicalDept] = React.useState<string>(() =>
    focusedZoneId ? resolveCanonicalZoneId(focusedZoneId, zones) : defaultDeptId,
  );

  React.useEffect(() => {
    if (focusedZoneId) {
      setSelectedCanonicalDept(resolveCanonicalZoneId(focusedZoneId, zones));
    }
  }, [focusedZoneId, zones]);

  React.useEffect(() => {
    if (
      orderedDepts.length > 0 &&
      !orderedDepts.some((d) => d.canonicalId === selectedCanonicalDept)
    ) {
      setSelectedCanonicalDept(defaultDeptId);
    }
  }, [orderedDepts, selectedCanonicalDept, defaultDeptId]);

  const activeDeptItem = React.useMemo(
    () =>
      orderedDepts.find((d) => d.canonicalId === selectedCanonicalDept) || orderedDepts[0],
    [orderedDepts, selectedCanonicalDept],
  );

  const [deptName, setDeptName] = React.useState<string>(activeDeptItem?.name || '');
  const [deptMission, setDeptMission] = React.useState<string>(activeDeptItem?.mission || '');
  const [deptCta, setDeptCta] = React.useState<string>(activeDeptItem?.primaryCtaLabel || '');
  const [deptTemplate, setDeptTemplate] = React.useState<string>(activeDeptItem?.defaultTemplateId || '');
  const [deptAgentsText, setDeptAgentsText] = React.useState<string>(
    (activeDeptItem?.recommendedAgentIds || []).join(', '),
  );
  const [deptSaving, setDeptSaving] = React.useState<boolean>(false);
  const [deptNotice, setDeptNotice] = React.useState<string | null>(null);
  const [matrixFilter, setMatrixFilter] = React.useState<string>('');
  const [selectedMatrixActor, setSelectedMatrixActor] = React.useState<string>('ALL');
  const [govSection, setGovSection] = React.useState<'policy' | 'departments' | 'roles' | 'matrix'>('policy');

  React.useEffect(() => {
    if (!activeDeptItem) return;
    setDeptName(activeDeptItem.name);
    setDeptMission(activeDeptItem.mission);
    setDeptCta(activeDeptItem.primaryCtaLabel);
    setDeptTemplate(activeDeptItem.defaultTemplateId);
    setDeptAgentsText(activeDeptItem.recommendedAgentIds.join(', '));
  }, [activeDeptItem]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch(`${apiBaseUrl}/api/vibe/open-office/governance`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OpenOfficeGovernanceSnapshot | null) => {
        if (cancelled || !data || !data.company_policy) return;
        setGovSnapshot(data);
        setPolicy((prev) => ({ ...prev, ...data.company_policy }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const handleSaveCompanyPolicy = async () => {
    if (!policy.company_name.trim()) return;
    setPolicySaving(true);
    setPolicyNotice(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/open-office/governance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.company_policy) {
          setPolicy((prev) => ({ ...prev, ...data.company_policy }));
        }
        setPolicyNotice('Đã lưu cấu hình Công ty & Cấp độ tự trị vào Sổ cái quản trị.');
      }
    } catch {
      setPolicyNotice('Đã cập nhật cấu hình phiên làm việc hiện tại.');
    } finally {
      setPolicySaving(false);
    }
  };

  const handleSaveDepartment = async () => {
    const cleanName = deptName.trim();
    if (!cleanName) return;
    setDeptSaving(true);
    setDeptNotice(null);
    const parsedAgents = deptAgentsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const patch: OpenOfficeDepartmentPatch = {
      zone_id: selectedCanonicalDept,
      name: cleanName,
      subtitle: deptMission.trim() || activeDeptItem.mission,
      primary_cta_label: deptCta.trim() || activeDeptItem.primaryCtaLabel,
      default_template_id: deptTemplate || activeDeptItem.defaultTemplateId,
      recommended_agent_ids:
        parsedAgents.length > 0 ? parsedAgents : activeDeptItem.recommendedAgentIds,
    };

    try {
      await fetch(`${apiBaseUrl}/api/vibe/open-office/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {
      // Optimistically apply to live floorplan even when standalone
    } finally {
      onApplyDepartmentPatch(patch);
      setDeptNotice(`Đã lưu cấu hình ${cleanName} (${activeDeptItem.ucCode}) và đồng bộ ngay lên Bản vẽ SOP.`);
      setDeptSaving(false);
    }
  };

  const resources = govSnapshot?.permission_matrix?.resources || FALLBACK_PERMISSION_RESOURCES;
  const rolePresets = React.useMemo(
    () => govSnapshot?.permission_matrix?.role_presets || buildDefaultRolePresets(),
    [govSnapshot],
  );

  const filteredResources = React.useMemo(() => {
    const q = matrixFilter.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.domain.toLowerCase().includes(q),
    );
  }, [resources, matrixFilter]);

  const humanRanks = govSnapshot?.roles_roster?.human_ranks || [
    {
      rank: 'owner',
      actor_class: 'HUM',
      title: 'Chủ sở hữu (Owner / Sovereign HUM)',
      home_zone: 'sop_generic_7p',
      summary: 'Quyền tối cao Tier-2, phê duyệt cổng SoD (GW-SOD-01), cấu hình công ty & Danger Zone.',
    },
    {
      rank: 'manager',
      actor_class: 'HUM',
      title: 'Quản lý dự án (Manager)',
      home_zone: 'sop_generic_7p',
      summary: 'Giao hợp đồng SLA, điều phối thành viên, quản trị chu kỳ & phê duyệt HITL dự án.',
    },
    {
      rank: 'member',
      actor_class: 'HUM',
      title: 'Thành viên chuyên môn (Member)',
      home_zone: 'sop_coding_01',
      summary: 'Tạo/cập nhật công việc, tài liệu, cộng tác cùng AI Agents theo vai trò tùy chỉnh.',
    },
    {
      rank: 'guest',
      actor_class: 'HUM',
      title: 'Khách quan sát (Guest)',
      home_zone: 'sop_generic_7p',
      summary: 'Chỉ đọc (Read-only) các bảng điều khiển, tài liệu & hạng mục được chia sẻ.',
    },
  ];

  const detGates = govSnapshot?.roles_roster?.deterministic_gates || [
    {
      gate_id: 'GW-SOD-01',
      actor_class: 'DET (P=1)',
      title: 'Cổng Phân tách nhiệm vụ (Segregation of Duties)',
      home_zone: 'sop_generic_7p',
      summary: 'Chặn tuyệt đối Agent tự duyệt bài mình làm (approver_id != lead_agent_id).',
    },
    {
      gate_id: 'GW-QG-01',
      actor_class: 'DET (P=1)',
      title: 'Cổng Chất lượng & Layer-0 Linter',
      home_zone: 'sop_sec_audit_01',
      summary: 'Kiểm định tất định P=1: Ruff, SAST, TypeScript, pytest/bun test 0 FAIL & EAI >= 0.98.',
    },
    {
      gate_id: 'GW-SCION-01',
      actor_class: 'DET (P=1)',
      title: 'Sổ cái bất biến SHA-256 & Lease Lock',
      home_zone: 'sop_legal_01',
      summary: 'Chuỗi băm ev_oo_<sha256> chống sửa/xóa lịch sử & cô lập vùng ghi Bernstein.',
    },
  ];

  const actorColumns = [
    { key: 'owner', label: 'HUM · Owner' },
    { key: 'manager', label: 'HUM · Manager' },
    { key: 'member', label: 'HUM · Member' },
    { key: 'guest', label: 'HUM · Guest' },
    { key: 'agt_tier1', label: 'AGT · Tier-1' },
  ].filter((col) => selectedMatrixActor === 'ALL' || selectedMatrixActor === col.key);

  return (
    <div
      data-testid="open-office-governance-panel"
      className="space-y-4 p-3"
    >
      {/* Slim 1-Row Governance Context Strip + Focused 4-Tab Navigation */}
      <div
        data-testid="open-office-governance-tier-strip"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">
            {isVi ? `Dự án ${projectKey}` : `Project ${projectKey}`}
          </Badge>
          <span className="text-muted-foreground">
            {isVi
              ? `${orderedDepts.length} phòng ban chuyên môn · Tổ chức ${teamRef}`
              : `${orderedDepts.length} departments · Team ${teamRef}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="default"
            size="sm"
            data-testid="btn-gov-open-control-plane"
            onClick={() => onNavigate(teamSectionPath(teamRef, 'capabilities'))}
            className="h-7 gap-1 text-xs"
          >
            <span>{isVi ? 'Trung tâm điều khiển' : 'Control Plane'}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigate(companySettingsPath())}
            className="h-7 gap-1 text-xs"
          >
            <span>{isVi ? 'Thiết lập Công ty' : 'Company Settings'}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigate(teamSectionPath(teamRef, 'roles'))}
            className="h-7 gap-1 text-xs"
          >
            <span>{isVi ? 'Vai trò Nhóm' : 'Team RBAC'}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <StepSectionTabs
        testId="gov-section-tabs"
        ariaLabel={isVi ? 'Phân mục quản trị' : 'Governance sections'}
        activeTabId={govSection}
        onTabChange={(id) =>
          setGovSection(id as 'policy' | 'departments' | 'roles' | 'matrix')
        }
        tabs={[
          {
            id: 'policy',
            label: isVi ? 'Chính sách & Tổ chức' : 'Organization & Policy',
            testId: 'gov-tab-policy',
          },
          {
            id: 'departments',
            label: isVi
              ? `Phòng ban (${orderedDepts.length})`
              : `Departments (${orderedDepts.length})`,
            testId: 'gov-tab-departments',
          },
          {
            id: 'roles',
            label: isVi ? 'Vai trò & Đội ngũ' : 'Roles & Team',
            testId: 'gov-tab-roles',
          },
          {
            id: 'matrix',
            label: isVi ? 'Ma trận phân quyền' : 'Permissions',
            testId: 'gov-tab-matrix',
          },
        ]}
      />

      {/* 1. Company & Constitutional Autonomy Policy */}
      <div
        role="tabpanel"
        aria-hidden={govSection !== 'policy'}
        className={govSection === 'policy' ? '' : 'hidden'}
      >
        <section
          data-testid="gov-company-policy-card"
          className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Công ty &amp; Chính sách Tự trị (Company &amp; Autonomy)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Quản lý danh tính tổ chức, cấp độ tự trị mặc định cho AI và khóa an toàn phân tách nhiệm vụ.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="btn-gov-goto-company-settings"
              onClick={() => onNavigate(companySettingsPath())}
              className="min-h-8 gap-1 text-xs"
            >
              <span>Trang Công ty</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tên tổ chức / Công ty</label>
              <Input
                value={policy.company_name}
                onChange={(e) => setPolicy((p) => ({ ...p, company_name: e.target.value }))}
                onInput={(e) =>
                  setPolicy((p) => ({ ...p, company_name: (e.target as HTMLInputElement).value }))
                }
                data-testid="input-gov-company-name"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tên pháp nhân</label>
              <Input
                value={policy.legal_name}
                onChange={(e) => setPolicy((p) => ({ ...p, legal_name: e.target.value }))}
                onInput={(e) =>
                  setPolicy((p) => ({ ...p, legal_name: (e.target as HTMLInputElement).value }))
                }
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tên miền (Domain)</label>
              <Input
                value={policy.domain}
                onChange={(e) => setPolicy((p) => ({ ...p, domain: e.target.value }))}
                onInput={(e) =>
                  setPolicy((p) => ({ ...p, domain: (e.target as HTMLInputElement).value }))
                }
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Cấp độ tự trị mặc định (Autonomy Tier)
              </label>
              <select
                value={policy.default_autonomy_tier}
                onChange={(e) =>
                  setPolicy((p) => ({
                    ...p,
                    default_autonomy_tier: e.target.value as 'TIER_0' | 'TIER_1' | 'TIER_2',
                  }))
                }
                data-testid="select-gov-autonomy-tier"
                className="mt-1 flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
              >
                <option value="TIER_0">TIER_0 · Chỉ đọc &amp; Nghiên cứu</option>
                <option value="TIER_1">TIER_1 · Thực thi Sandbox có kiểm soát</option>
                <option value="TIER_2">TIER_2 · Cổng phê duyệt HUM nghiêm ngặt</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/30 p-2.5 text-xs">
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                Bắt buộc Phân tách nhiệm vụ GW-SOD-01 (Cấm Agent tự duyệt bài)
              </span>
              <input
                type="checkbox"
                checked={policy.require_sod_approval}
                onChange={(e) => setPolicy((p) => ({ ...p, require_sod_approval: e.target.checked }))}
                data-testid="checkbox-gov-require-sod"
                className="size-4 rounded border-border"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                Cho phép khởi tạo nhanh Đội ngũ AI chuẩn khi mở dự án mới
              </span>
              <input
                type="checkbox"
                checked={policy.allow_agent_team_bootstrap}
                onChange={(e) =>
                  setPolicy((p) => ({ ...p, allow_agent_team_bootstrap: e.target.checked }))
                }
                className="size-4 rounded border-border"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {policyNotice ? (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {policyNotice}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Lưu trữ bền vững trong SQLite &amp; đồng bộ toàn văn phòng.
              </span>
            )}
            <Button
              type="button"
              size="sm"
              disabled={policySaving}
              data-testid="btn-save-gov-company"
              onClick={handleSaveCompanyPolicy}
              className="min-h-8 gap-1.5 text-xs"
            >
              <Save className="size-3.5" />
              <span>Lưu chính sách Công ty</span>
            </Button>
          </div>
        </section>
      </div>

      {/* 2. Dynamic SOP-Department Live Editor */}
      <div
        role="tabpanel"
        aria-hidden={govSection !== 'departments'}
        className={govSection === 'departments' ? '' : 'hidden'}
      >
        <section
          data-testid="gov-departments-editor"
          className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Cấu hình {orderedDepts.length} Phòng ban SOP Chuyên môn
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Chỉnh sửa trực tiếp tên phòng, sứ mệnh, nút giao việc nhanh và đội ngũ AI phụ trách của từng phòng.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {activeDeptItem?.ucCode}
            </Badge>
          </div>

          {/* Dynamic SOP-Room Pill Selector */}
          <div className="flex flex-wrap gap-1.5">
            {orderedDepts.map((dept) => {
              const isSelected = dept.canonicalId === selectedCanonicalDept;
              return (
                <button
                  key={dept.canonicalId}
                  type="button"
                  data-testid={`btn-gov-select-dept-${dept.canonicalId}`}
                  onClick={() => {
                    setSelectedCanonicalDept(dept.canonicalId);
                    setDeptNotice(null);
                  }}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/15 font-semibold text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">{dept.ucCode}</span>
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tên hiển thị Phòng ban</label>
              <Input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                onInput={(e) => setDeptName((e.target as HTMLInputElement).value)}
                data-testid="input-gov-dept-name"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nhãn nút Giao việc nhanh (CTA)</label>
              <Input
                value={deptCta}
                onChange={(e) => setDeptCta(e.target.value)}
                onInput={(e) => setDeptCta((e.target as HTMLInputElement).value)}
                data-testid="input-gov-dept-cta"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Sứ mệnh &amp; Chức năng trọng tâm (Subtitle / Mission)
              </label>
              <Input
                value={deptMission}
                onChange={(e) => setDeptMission(e.target.value)}
                onInput={(e) => setDeptMission((e.target as HTMLInputElement).value)}
                data-testid="input-gov-dept-mission"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Mẫu Hợp đồng SLA mặc định</label>
              <select
                value={deptTemplate}
                onChange={(e) => setDeptTemplate(e.target.value)}
                data-testid="select-gov-dept-template"
                className="mt-1 flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
                {!templates.some((t) => t.id === deptTemplate) && deptTemplate && (
                  <option value={deptTemplate}>{deptTemplate}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Agent phụ trách khuyến nghị (cách nhau dấu phẩy)
              </label>
              <Input
                value={deptAgentsText}
                onChange={(e) => setDeptAgentsText(e.target.value)}
                onInput={(e) => setDeptAgentsText((e.target as HTMLInputElement).value)}
                data-testid="input-gov-dept-agents"
                placeholder="@orchestrator, @antigravity"
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {deptNotice ? (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {deptNotice}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Thay đổi sẽ cập nhật tức thì tên phòng trên Bản vẽ Kiến trúc và Hồ sơ Phòng ban.
              </span>
            )}
            <Button
              type="button"
              size="sm"
              disabled={deptSaving || !deptName.trim()}
              data-testid="btn-save-gov-department"
              onClick={handleSaveDepartment}
              className="min-h-8 gap-1.5 text-xs"
            >
              <Save className="size-3.5" />
              <span>Lưu cấu hình Phòng ban</span>
            </Button>
          </div>
        </section>
      </div>

      {/* 3. Unified Socio-Technical Roles Roster */}
      <div
        role="tabpanel"
        aria-hidden={govSection !== 'roles'}
        className={govSection === 'roles' ? '' : 'hidden'}
      >
        <section
          data-testid="gov-roles-roster"
          className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isVi
                    ? 'Sơ đồ Vai trò: Con người · Quy tắc kiểm soát tự động · Đội ngũ AI'
                    : 'Roles & Team: People · Automated Controls · AI Agents'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {isVi
                  ? `Tổng hợp cấp bậc nhân sự, quy tắc kiểm soát tự động và các Agent đang trực tại ${orderedDepts.length} phòng ban.`
                  : `Human ranks, automated control rules, and AI agents assigned across ${orderedDepts.length} departments.`}
              </p>
            </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="btn-gov-goto-members"
              onClick={() => onNavigate(membersPath(projectRefOf(teamRef, projectKey)))}
              className="min-h-8 gap-1 text-xs"
            >
              <span>Thành viên dự án</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="btn-gov-goto-ai-agents"
              onClick={() => onNavigate(teamSectionPath(teamRef, 'ai-agents'))}
              className="min-h-8 gap-1 text-xs"
            >
              <span>Danh mục AI Agents</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="btn-gov-goto-roles"
              onClick={() => onNavigate(teamSectionPath(teamRef, 'roles'))}
              className="min-h-8 gap-1 text-xs"
            >
              <span>Quản trị Vai trò (RBAC)</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Column 1: HUM Ranks */}
          <div className="space-y-2 rounded-lg bg-muted/25 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                1. Con người (HUM Ranks)
              </span>
              <Badge variant="secondary" className="font-mono text-xs">
                Accountable
              </Badge>
            </div>
            <div className="space-y-1.5">
              {humanRanks.map((hr) => (
                <div key={hr.rank} className="rounded-md bg-background/80 p-2 text-xs">
                  <div className="flex items-center justify-between gap-1 font-semibold text-foreground">
                    <span>{hr.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{hr.rank}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hr.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: DET Gates */}
          <div className="space-y-2 rounded-lg bg-muted/25 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {isVi ? '2. Quy tắc kiểm soát tự động' : '2. Automated Control Rules'}
              </span>
              <Badge variant="secondary" className="font-mono text-xs">
                Fail-Closed
              </Badge>
            </div>
            <div className="space-y-1.5">
              {detGates.map((gt) => (
                <div key={gt.gate_id} className="rounded-md bg-background/80 p-2 text-xs">
                  <div className="flex items-center justify-between gap-1 font-semibold text-foreground">
                    <span>{gt.title}</span>
                    <span className="font-mono text-xs text-primary">{gt.gate_id}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{gt.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: AGT Fleet */}
          <div className="space-y-2 rounded-lg bg-muted/25 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                3. Đội ngũ AI (AGT Fleet)
              </span>
              <Badge variant="secondary" className="font-mono text-xs">
                {stations.length} Trạm trực
              </Badge>
            </div>
            <div className="space-y-1.5">
              {stations.map((st) => (
                <div key={st.seat_id} className="rounded-md bg-background/80 p-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold text-foreground">
                      {st.agent_name}{' '}
                      <span className="font-mono text-muted-foreground">({st.username})</span>
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {st.zone_name || st.zone_id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{st.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      </div>

      {/* 4. Role Permissions Matrix (24 modules) */}
      <div
        role="tabpanel"
        aria-hidden={govSection !== 'matrix'}
        className={govSection === 'matrix' ? '' : 'hidden'}
      >
        <section
          data-testid="gov-authorization-matrix"
          className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isVi
                    ? 'Phân quyền theo vai trò (24 phân hệ)'
                    : 'Role Permissions Matrix (24 modules)'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {isVi
                  ? 'Đối chiếu quyền Tạo (C) · Sửa (E) · Đọc (R) · Xóa (D) trên 24 phân hệ nghiệp vụ cùng quy tắc phê duyệt độc lập.'
                  : 'Compare Create, Edit, Read, and Delete access across 24 operational modules and independent approval policy.'}
              </p>
            </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={matrixFilter}
              onChange={(e) => setMatrixFilter(e.target.value)}
              placeholder="Tìm tài nguyên (vd: danger_zone, ai_agents)..."
              data-testid="input-gov-matrix-filter"
              className="h-8 w-56 text-xs"
            />
            <select
              value={selectedMatrixActor}
              onChange={(e) => setSelectedMatrixActor(e.target.value)}
              data-testid="select-gov-matrix-actor"
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
            >
              <option value="ALL">Tất cả Vai trò (5 cột)</option>
              <option value="owner">HUM · Owner</option>
              <option value="manager">HUM · Manager</option>
              <option value="member">HUM · Member</option>
              <option value="guest">HUM · Guest</option>
              <option value="agt_tier1">AGT · AI Agent (Tier-1)</option>
            </select>
          </div>
        </div>

        {/* Access Tier Summary Strip */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg bg-muted/30 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Lock className="size-3.5 text-primary" />
              <span>{isVi ? 'Cấp 0 · Chỉ đọc & Tra cứu' : 'Tier 0 · Read-Only Discovery'}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {isVi
                ? 'Chỉ đọc tài liệu và tra cứu tri thức; chặn mọi thao tác sửa hoặc xóa cho tới khi được cấp quyền.'
                : 'Read documents and knowledge memory only; all edits and deletions stay blocked.'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{isVi ? 'Cấp 1 · Thực thi trong vùng an toàn' : 'Tier 1 · Sandbox Execution'}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {isVi
                ? 'Trợ lý AI thực hiện công việc và nộp bằng chứng; không được tự phê duyệt hoàn tất hay chạm mục nhạy cảm.'
                : 'AI agents execute scoped work and submit evidence; cannot self-approve or touch sensitive settings.'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Check className="size-3.5 text-primary" />
              <span>{isVi ? 'Cấp 2 · Phê duyệt độc lập (GW-SOD-01)' : 'Tier 2 · Independent Approval (GW-SOD-01)'}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {isVi
                ? 'Dành riêng cho người quản lý độc lập: nghiệm thu đầu ra, đổi phân quyền nhóm và vùng bảo mật.'
                : 'Reserved for an independent human reviewer: sign off deliverables, RBAC, and sensitive areas.'}
            </p>
          </div>
        </div>

        {/* 24 Resources Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-muted/90 text-foreground">
              <tr>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Tài nguyên Hệ thống ({filteredResources.length}/24)
                </th>
                <th className="border-b border-border px-2.5 py-2 font-semibold">Phân nhóm</th>
                {actorColumns.map((col) => (
                  <th key={col.key} className="border-b border-border px-2.5 py-2 font-semibold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredResources.map((res) => {
                const presetsForRes = rolePresets[res.key] || {};
                return (
                  <tr key={res.key} className="hover:bg-muted/20">
                    <td className="px-3 py-1.5 font-medium text-foreground">
                      <div>{res.label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{res.key}</div>
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground">{res.domain}</td>
                    {actorColumns.map((col) => {
                      const granted = presetsForRes[col.key] || [];
                      return (
                        <td key={col.key} className="px-2.5 py-1.5">
                          <div className="flex flex-wrap gap-1 font-mono text-xs">
                            {(['create', 'edit', 'read', 'delete'] as const).map((act) => {
                              const has = granted.includes(act);
                              const short = act[0].toUpperCase();
                              return (
                                <span
                                  key={act}
                                  title={`${act}: ${has ? 'Cho phép' : 'Chặn'}`}
                                  className={`inline-flex size-5 items-center justify-center rounded ${
                                    has
                                      ? 'bg-primary/15 font-bold text-foreground'
                                      : 'bg-muted/40 text-muted-foreground/45'
                                  }`}
                                >
                                  {short}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </section>
      </div>
    </div>
  );
}
