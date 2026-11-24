'use client';

// UNIFIED_CREDENTIALS_VAULT_BRIDGE_361 (SPEC-ITSAPLAN-PORTFOLIO-DEDUP-361):
// Bridges Team Integrations (PostgreSQL LLM & Tool Credentials) with the Zero-Leak
// Secret Vault (Port 8765 / .env / AES-256-GCM) so credential management is unified.

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Plus, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTeamQuery } from '@/services/teams.service';
import { useIntegrationCatalogQuery } from '@/services/integrations.service';
import SectionPageView from '@/components/common/page/SectionPageView';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Button } from '@/components/ui/button';
import { CredentialDialog } from './CredentialDialog';
import TeamIntegrations from './TeamIntegrations';

// The integrations of a team: the API keys of AI providers and the credentials of
// tool integrations, shared by every project the team owns. Secrets are write-only,
// so the list shows only a masked view.
export default function TeamIntegrationsSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const { data: team } = useTeamQuery(teamId);
  const permissions = team?.permissions.integrations;
  // The catalog names the integrations and builds the credential form, so it is
  // fetched for anyone who may read or add a credential.
  const canSee = !!permissions && (permissions.read || permissions.create);
  const catalog = useIntegrationCatalogQuery(canSee ? teamId : null).data ?? [];
  const [creating, setCreating] = useState(false);
  const teamRef = team?.ref ?? 'default';

  return (
    <SectionPageView
      title={t('sections.integrations.title')}
      description={t('sections.integrations.description')}
      wide
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
            <Link
              href={`/${teamRef}/settings/llm-router`}
              data-testid="link-team-llm-router"
              title="Manage Sovereign LLM Provider Router, Fallback Priority & Model Catalog"
            >
              <Route className="size-3.5" />
              <span>LLM Router</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
            <Link
              href={`/${teamRef}/PM/vault`}
              data-testid="link-unified-secret-vault"
              title="Open Zero-Leak AES-256-GCM Secret Vault & 1-Click OAuth"
            >
              <KeyRound className="size-3.5" />
              <span>Secret Vault</span>
            </Link>
          </Button>
          {permissions?.create && (
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" />
              {t('integrations.add')}
            </Button>
          )}
        </div>
      }
    >
      {!permissions ? (
        <ListSkeleton rows={3} rowClassName="h-12" />
      ) : !permissions.read ? (
        <p className="text-sm text-muted-foreground">{t('integrations.noAccess')}</p>
      ) : (
        <TeamIntegrations teamId={teamId} catalog={catalog} permissions={permissions} />
      )}

      {creating && (
        <CredentialDialog
          teamId={teamId}
          catalog={catalog}
          existing={null}
          onClose={() => setCreating(false)}
        />
      )}
    </SectionPageView>
  );
}
