'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { TeamBillingSection } from '@/cloud';
import type { Team } from '@/lib/api/endpoints/teams';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dates';
import { teamPath } from '@/utils/paths';
import { useTeam, useUpdateTeam } from '@/services/teams.service';
import SectionPageView from '@/components/common/page/SectionPageView';
import SettingsCard from '@/components/common/page/SettingsCard';
import SettingsSection from '@/components/common/page/SettingsSection';
import SectionPageSkeleton from '@/components/common/skeleton/SectionPageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TEAM_SLUG_PATTERN, suggestTeamSlug } from '../../utils/teamSlug';
import TeamLeadsSection from './TeamLeadsSection';
import TeamLeaveDialog from './TeamLeaveDialog';

// Leaving is offered only where the API allows it: the last owner has nobody to hand
// the team over to, and a membership a provisioned group granted ends at the identity
// provider.
function canLeave(team: Team): boolean {
  if (team.role === 'owner' && team.ownerCount === 1) return false;
  return !(team.source === 'scim' && team.role === 'member');
}

// The team itself: the name and URL slug its owner edits here, the caller's rank in it,
// and the way out of it. Everything it shows comes with the team list.
export default function TeamInfoSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams.info');
  const tSection = useTranslations('teams.sections.info');
  const tManage = useTranslations('teams.manage');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const team = useTeam(teamId);
  const updateTeam = useUpdateTeam();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  if (!team) return <SectionPageSkeleton rows={3} />;

  const name = draftName ?? team.name;
  const currentSlug = team.slug ?? '';
  const slug = draftSlug ?? currentSlug;
  const isOwner = team.role === 'owner';
  const trimmed = name.trim();
  const nameChanged = trimmed !== team.name;
  const slugChanged = slug !== currentSlug;
  const slugValid = TEAM_SLUG_PATTERN.test(slug);
  const slugError = slug !== '' && !slugValid;
  const canSave =
    trimmed !== '' && slugValid && (nameChanged || slugChanged) && !updateTeam.isPending;

  function save() {
    if (!canSave || !team) return;
    const prevRef = team.ref;
    updateTeam.mutate(
      {
        teamId,
        ...(nameChanged ? { name: trimmed } : {}),
        ...(slugChanged ? { slug } : {}),
      },
      {
        onSuccess: (updated) => {
          setDraftName(null);
          setDraftSlug(null);
          toast.success(t('saved'));
          if (updated.ref !== prevRef) {
            router.replace(teamPath(updated.ref));
          }
        },
      },
    );
  }

  return (
    <SectionPageView
      title={tSection('title')}
      description={tSection('description')}
      actions={
        isOwner ? (
          <Button size="sm" className="h-8" disabled={!canSave} onClick={save}>
            {tCommon('save')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-10">
        <SettingsSection title={t('team')} description={t('teamHint')}>
          <SettingsCard className="space-y-4 p-4">
            {isOwner ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="team-name">{tCommon('name')}</Label>
                  <Input
                    id="team-name"
                    value={name}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="team-slug">{t('slug')}</Label>
                  <Input
                    id="team-slug"
                    value={slug}
                    placeholder={suggestTeamSlug(name) || 'acme'}
                    dir="ltr"
                    aria-invalid={slugError}
                    aria-describedby="team-slug-hint"
                    onChange={(e) => setDraftSlug(e.target.value.toLowerCase().trim())}
                  />
                  <p
                    id="team-slug-hint"
                    className={cn(
                      'text-xs',
                      slugError ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {slugError ? t('slugInvalid') : t('slugHint')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <Label>{tCommon('name')}</Label>
                  <span className="text-sm text-muted-foreground">{team.name}</span>
                </div>
                {team.slug && (
                  <div className="flex items-center justify-between gap-4">
                    <Label>{t('slug')}</Label>
                    <span className="font-mono text-sm text-muted-foreground">/{team.slug}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center justify-between gap-4">
              <Label>{t('role')}</Label>
              <Badge variant="secondary" className="font-normal">
                {tManage(`roles.${team.role}`)}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label>{t('created')}</Label>
              <span className="text-sm text-muted-foreground">{formatDate(team.createdAt)}</span>
            </div>
          </SettingsCard>
        </SettingsSection>

        <TeamLeadsSection teamId={teamId} />

        <TeamBillingSection teamId={teamId} />

        {canLeave(team) && (
          <SettingsSection
            title={tManage('leaveAction')}
            description={t('leaveHint')}
            action={
              <Button variant="outline" size="sm" className="h-8" onClick={() => setLeaving(true)}>
                {tManage('leaveAction')}
              </Button>
            }
          />
        )}
      </div>

      {leaving && <TeamLeaveDialog team={team} onClose={() => setLeaving(false)} />}
    </SectionPageView>
  );
}
