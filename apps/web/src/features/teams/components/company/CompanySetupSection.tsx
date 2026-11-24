'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Layers, Network, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AutonomyTier, CompanySettings } from '@/lib/api/endpoints/company';
import { useCompanySettingsQuery, useUpdateCompanySettings } from '@/services/company.service';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { companySettingsPath, manageTeamsPath, teamSectionPath } from '@/utils/paths';
import { useTeamsQuery } from '@/services/teams.service';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import SectionPageView from '@/components/common/page/SectionPageView';
import SettingsCard from '@/components/common/page/SettingsCard';
import SettingsSection from '@/components/common/page/SettingsSection';
import SectionPageSkeleton from '@/components/common/skeleton/SectionPageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEAM_SLUG_PATTERN } from '../../utils/teamSlug';

const LOCALES = [
  { value: 'en', label: 'English (US)' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'ru', label: 'Русский' },
  { value: 'uk', label: 'Українська' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ar', label: 'العربية' },
];

export default function CompanySetupSection() {
  const t = useTranslations('teams.company');
  const tOrg = useTranslations('teams.orgChart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  const { data, isPending } = useCompanySettingsQuery();
  const teamsQuery = useTeamsQuery();
  const updateSettings = useUpdateCompanySettings();

  const canEdit = teamsQuery.data?.some((team) => team.role === 'owner') ?? false;
  const primaryTeamRef = (teamsQuery.data?.find((team) => team.role === 'owner') ?? teamsQuery.data?.[0])?.ref;
  const tier1Href = companySettingsPath();
  const tier2Href = primaryTeamRef ? teamSectionPath(primaryTeamRef, 'roles') : manageTeamsPath();
  const tier3Href = primaryTeamRef ? teamSectionPath(primaryTeamRef, 'org-chart') : manageTeamsPath();
  const tier4Href = primaryTeamRef ? teamSectionPath(primaryTeamRef, 'capabilities') : manageTeamsPath();

  function handleTierNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigateFeatureInstant(href);
    }
  }

  const [form, setForm] = useState<Partial<CompanySettings>>({});

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  if (isPending || !data) {
    return <SectionPageSkeleton rows={4} />;
  }

  const companyName = form.companyName ?? data.companyName ?? '';
  const legalName = form.legalName ?? data.legalName ?? '';
  const slug = form.slug ?? data.slug ?? '';
  const domain = form.domain ?? data.domain ?? '';
  const industry = form.industry ?? data.industry ?? '';
  const timezone = form.timezone ?? data.timezone ?? '';
  const defaultLocale = form.defaultLocale ?? data.defaultLocale ?? 'en';
  const defaultAutonomyTier = (form.defaultAutonomyTier ?? data.defaultAutonomyTier ?? 'TIER_1') as AutonomyTier;
  const requireSodApproval = form.requireSodApproval ?? data.requireSodApproval ?? false;
  const allowAgentTeamBootstrap = form.allowAgentTeamBootstrap ?? data.allowAgentTeamBootstrap ?? false;

  const slugTrimmed = slug.trim();
  const slugValid = slugTrimmed === '' || TEAM_SLUG_PATTERN.test(slugTrimmed);
  const slugError = slugTrimmed !== '' && !slugValid;

  const hasChanges =
    companyName !== (data.companyName ?? '') ||
    legalName !== (data.legalName ?? '') ||
    slug !== (data.slug ?? '') ||
    domain !== (data.domain ?? '') ||
    industry !== (data.industry ?? '') ||
    timezone !== (data.timezone ?? '') ||
    defaultLocale !== (data.defaultLocale ?? 'en') ||
    defaultAutonomyTier !== (data.defaultAutonomyTier ?? 'TIER_1') ||
    requireSodApproval !== (data.requireSodApproval ?? false) ||
    allowAgentTeamBootstrap !== (data.allowAgentTeamBootstrap ?? false);

  const canSave = canEdit && slugValid && hasChanges && !updateSettings.isPending;

  function save() {
    if (!canSave) return;
    updateSettings.mutate(
      {
        companyName: companyName.trim(),
        legalName: legalName.trim(),
        slug: slugTrimmed,
        domain: domain.trim(),
        industry: industry.trim(),
        timezone: timezone.trim(),
        defaultLocale,
        defaultAutonomyTier,
        requireSodApproval,
        allowAgentTeamBootstrap,
      },
      {
        onSuccess: () => {
          toast.success(t('saved'));
          if (isHostVibeEnabled()) {
            void fetch('/api/vibe/open-office/governance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_name: companyName.trim(),
                legal_name: legalName.trim(),
                slug: slugTrimmed,
                domain: domain.trim(),
                industry: industry.trim(),
                timezone: timezone.trim(),
                default_locale: defaultLocale,
                default_autonomy_tier: defaultAutonomyTier,
                require_sod_approval: requireSodApproval,
                allow_agent_team_bootstrap: allowAgentTeamBootstrap,
              }),
            }).catch(() => {});
          }
        },
      },
    );
  }

  return (
    <SectionPageView
      title={t('title')}
      description={t('description')}
      actions={
        canEdit ? (
          <Button size="sm" className="h-8" disabled={!canSave} onClick={save}>
            {tCommon('save')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-8">
        <div
          data-testid="company-governance-tier-strip"
          className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3.5 text-xs md:grid-cols-2 xl:grid-cols-4"
        >
          <Link
            href={tier1Href}
            onClick={(e) => handleTierNavClick(e, tier1Href)}
            className="flex flex-col gap-3 gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1.5 font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  {isVi ? 'Tầng 1 · Hồ sơ Tổ chức' : 'Tier 1 · Organization Profile'}
                </span>
                <Badge variant="default" className="text-xs">
                  {isVi ? 'Đang mở' : 'Active'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {isVi
                  ? 'Tên tổ chức, múi giờ, mức tự chủ AI mặc định và quy tắc kiểm duyệt chéo.'
                  : 'Organization name, timezone, default AI autonomy, and independent review rules.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-primary">
              /account/company
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>

          <Link
            href={tier2Href}
            onClick={(e) => handleTierNavClick(e, tier2Href)}
            className="flex flex-col gap-3 gap-2 rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1.5 font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  {isVi ? 'Tầng 2 · Vai trò & Quyền truy cập' : 'Tier 2 · Team Roles & Access'}
                </span>
              </div>
              <p className="text-muted-foreground">
                {isVi
                  ? 'Thiết lập vai trò dự án, quyền chỉnh sửa tài nguyên và quản trị thành viên.'
                  : 'Configure project roles, workspace permissions, and team member access.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {isVi ? 'Mở Vai trò & Phân quyền' : 'Open Team Roles'}
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>

          <Link
            href={tier3Href}
            onClick={(e) => handleTierNavClick(e, tier3Href)}
            className="flex flex-col gap-3 gap-2 rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1.5 font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Network className="size-3.5 text-primary" />
                  {tOrg('tier3Title')}
                </span>
              </div>
              <p className="text-muted-foreground">
                {tOrg('tier3Desc')}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {tOrg('tier3Cta')}
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>

          <Link
            href={tier4Href}
            onClick={(e) => handleTierNavClick(e, tier4Href)}
            className="flex flex-col gap-3 gap-2 rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1.5 font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  {isVi ? 'Năng lực & AI Agents' : 'Capabilities & AI'}
                </span>
              </div>
              <p className="text-muted-foreground">
                {isVi
                  ? 'Quản trị tập trung dự án, trợ lý AI, kỹ năng SKILL.md, công cụ và cổng MCP.'
                  : 'Manage projects, AI agents, SKILL.md library, tools, and MCP reach in one place.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {isVi ? 'Mở Trung tâm điều khiển' : 'Open Capabilities'}
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <Badge variant={data.onboardingCompleted ? 'secondary' : 'outline'}>
            {data.onboardingCompleted ? t('configuredBadge') : t('defaultBadge')}
          </Badge>
          <span>{t('agenticSyncHint')}</span>
          {!canEdit && (
            <span className="ms-auto text-destructive font-medium">{t('ownerOnly')}</span>
          )}
        </div>

        {/* Card 1: Company Identity - Exactly 6 controls */}
        <SettingsSection title={t('identityTitle')} description={t('identityHint')}>
          <SettingsCard className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">{tCommon('name')}</Label>
              <Input
                id="company-name"
                disabled={!canEdit}
                value={companyName}
                onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legal-name">{t('legalName')}</Label>
              <Input
                id="legal-name"
                disabled={!canEdit}
                value={legalName}
                onChange={(e) => setForm((prev) => ({ ...prev, legalName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-slug">{t('slug')}</Label>
              <Input
                id="company-slug"
                disabled={!canEdit}
                value={slug}
                dir="ltr"
                aria-invalid={slugError}
                aria-describedby="company-slug-hint"
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
              />
              <p
                id="company-slug-hint"
                className={cn(
                  'text-xs',
                  slugError ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {slugError ? t('slugInvalid') : t('slugHint')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-domain">{t('domain')}</Label>
              <Input
                id="company-domain"
                disabled={!canEdit}
                value={domain}
                dir="ltr"
                placeholder="acme.com"
                onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-industry">{t('industry')}</Label>
              <Input
                id="company-industry"
                disabled={!canEdit}
                value={industry}
                placeholder="Technology, AI, Logistics..."
                onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-timezone">{t('timezone')}</Label>
              <Input
                id="company-timezone"
                disabled={!canEdit}
                value={timezone}
                placeholder="Asia/Ho_Chi_Minh"
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              />
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Card 2: Agentic Governance & Authorization - Exactly 4 controls */}
        <SettingsSection title={t('governanceTitle')} description={t('governanceHint')}>
          <SettingsCard className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label>{t('defaultLocale')}</Label>
              <Select
                disabled={!canEdit}
                value={defaultLocale}
                onValueChange={(val) => setForm((prev) => ({ ...prev, defaultLocale: val }))}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('autonomyTier')}</Label>
              <Select
                disabled={!canEdit}
                value={defaultAutonomyTier}
                onValueChange={(val) => setForm((prev) => ({ ...prev, defaultAutonomyTier: val as AutonomyTier }))}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIER_0">{t('tier0')}</SelectItem>
                  <SelectItem value="TIER_1">{t('tier1')}</SelectItem>
                  <SelectItem value="TIER_2">{t('tier2')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="require-sod">{t('requireSod')}</Label>
                <p className="text-xs text-muted-foreground">{t('requireSodHint')}</p>
              </div>
              <Switch
                id="require-sod"
                disabled={!canEdit}
                checked={requireSodApproval}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, requireSodApproval: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="allow-bootstrap">{t('allowBootstrap')}</Label>
                <p className="text-xs text-muted-foreground">{t('allowBootstrapHint')}</p>
              </div>
              <Switch
                id="allow-bootstrap"
                disabled={!canEdit}
                checked={allowAgentTeamBootstrap}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, allowAgentTeamBootstrap: checked }))}
              />
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>
    </SectionPageView>
  );
}
