import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react';
import type {
  ConfigField,
  IntegrationCredential,
  IntegrationMeta,
} from '@/lib/api/endpoints/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateCredential,
  useOAuthProviderConfigQuery,
  useSaveOAuthProviderConfig,
  useStartOAuthConnection,
  useUpdateCredential,
} from '@/services/integrations.service';
import { IntegrationIcon } from '@/components/common/IntegrationIcon';
import { useTranslations } from 'next-intl';

type FieldValue = string | boolean;

const INPUT_TYPES: Partial<Record<ConfigField['type'], string>> = {
  secret: 'password',
  number: 'number',
};

// Seeds the form state for an integration's fields. On edit, non-secret fields are
// prefilled from the credential's redacted view; secret fields start empty (a blank
// keeps the stored one).
function seedValues(
  meta: IntegrationMeta,
  existing: IntegrationCredential | null,
): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const field of meta.credentialSchema) {
    if (field.type === 'boolean') {
      out[field.key] = existing ? existing.redacted[field.key] === true : false;
    } else if (field.type === 'secret') {
      out[field.key] = '';
    } else {
      const stored = existing?.redacted[field.key];
      out[field.key] = stored == null ? '' : String(stored);
    }
  }
  return out;
}

// Step two of adding a credential (and the whole flow on edit): the credential form for
// a chosen integration, built from its credentialSchema. Secret fields left blank on
// edit keep their stored value. `onBack` returns to the picker (create only).
export function CredentialForm({
  teamId,
  meta,
  existing,
  onBack,
  onDone,
}: {
  teamId: number;
  meta: IntegrationMeta;
  existing: IntegrationCredential | null;
  onBack?: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('teams.integrations');
  const tCommon = useTranslations('common');
  const isEdit = existing != null;
  const [label, setLabel] = useState(existing?.label ?? '');
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    seedValues(meta, existing),
  );
  const [busy, setBusy] = useState(false);

  const create = useCreateCredential(teamId);
  const update = useUpdateCredential(teamId);
  const hasOAuth = Boolean(meta.oauth2);
  const oauthConfigQuery = useOAuthProviderConfigQuery(teamId, hasOAuth ? meta.key : null);
  const saveOAuthConfig = useSaveOAuthProviderConfig(teamId, meta.key);
  const startOAuth = useStartOAuthConnection(teamId, meta.key);
  const [showOAuthSetup, setShowOAuthSetup] = useState(false);
  const [oauthMode, setOAuthMode] = useState<'direct' | 'relay'>('direct');
  const [oauthClientId, setOAuthClientId] = useState('');
  const [oauthClientSecret, setOAuthClientSecret] = useState('');
  const [oauthRelayUrl, setOAuthRelayUrl] = useState('');
  const [oauthRelaySecret, setOAuthRelaySecret] = useState('');
  const [oauthError, setOAuthError] = useState<string | null>(null);
  const [oauthSaved, setOAuthSaved] = useState(false);

  const oauthCfg = oauthConfigQuery.data;

  async function handleStartOAuth() {
    setOAuthError(null);
    try {
      const res = await startOAuth.mutateAsync({
        label: label.trim() || null,
        credentialId: existing?.id ?? null,
        returnTo: typeof window !== 'undefined' ? window.location.pathname : '/',
      });
      window.location.href = res.authorizeUrl;
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Unable to start OAuth connection');
    }
  }

  async function handleSaveOAuthConfig() {
    setOAuthError(null);
    setOAuthSaved(false);
    try {
      await saveOAuthConfig.mutateAsync({
        mode: oauthMode,
        clientId: oauthMode === 'direct' ? oauthClientId.trim() || null : null,
        clientSecret: oauthMode === 'direct' ? oauthClientSecret.trim() || null : null,
        relayUrl: oauthMode === 'relay' ? oauthRelayUrl.trim() || null : null,
        relaySecret: oauthMode === 'relay' ? oauthRelaySecret.trim() || null : null,
      });
      setOAuthClientSecret('');
      setOAuthRelaySecret('');
      setOAuthSaved(true);
      setShowOAuthSetup(false);
    } catch (err) {
      setOAuthError(err instanceof Error ? err.message : 'Failed to save OAuth config');
    }
  }

  function setField(key: string, v: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function fieldSatisfied(field: ConfigField): boolean {
    if (!field.required || field.type === 'boolean') return true;
    const v = values[field.key];
    if (typeof v === 'string' && v.trim() !== '') return true;
    if (isEdit) {
      const stored = existing?.redacted[field.key];
      return stored != null && String(stored) !== '';
    }
    return false;
  }

  const canSubmit = !busy && meta.credentialSchema.every(fieldSatisfied);

  function buildCredential(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const field of meta.credentialSchema) {
      const v = values[field.key];
      if (field.type === 'boolean') out[field.key] = v === true;
      else if (typeof v === 'string' && v.trim() !== '') out[field.key] = v.trim();
    }
    return out;
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: existing.id,
          patch: { label: label.trim() || null, credential: buildCredential() },
        });
      } else {
        await create.mutateAsync({
          integrationKey: meta.key,
          label: label.trim() || null,
          credential: buildCredential(),
        });
      }
      onDone();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onBack}
            aria-label={t('back')}
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <IntegrationIcon integration={meta} className="size-8" />
        <span className="text-sm font-medium text-foreground">{meta.label}</span>
      </div>

      {hasOAuth && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>
                {oauthCfg?.configured
                  ? oauthCfg.mode === 'relay'
                    ? t('oauth.modeRelay')
                    : t('oauth.modeDirect')
                  : t('oauth.notConfigured')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!showOAuthSetup && oauthCfg) {
                  setOAuthMode(oauthCfg.mode === 'relay' ? 'relay' : 'direct');
                  setOAuthRelayUrl(oauthCfg.relayUrl ?? '');
                }
                setShowOAuthSetup((v) => !v);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t('oauth.configureApp')}
              {showOAuthSetup ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!oauthCfg?.configured || startOAuth.isPending}
              onClick={handleStartOAuth}
            >
              <ExternalLink className="size-3.5" />
              {isEdit
                ? t('oauth.reconnect', { integration: meta.label })
                : t('oauth.connect', { integration: meta.label })}
            </Button>
            {oauthSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('oauth.configSaved')}
              </span>
            )}
          </div>

          {oauthCfg?.clientReviewNote && (
            <p className="text-xs text-muted-foreground">{oauthCfg.clientReviewNote}</p>
          )}

          {oauthError && <p className="text-xs text-destructive">{oauthError}</p>}

          {showOAuthSetup && (
            <div className="space-y-2.5 border-t border-border/60 pt-2.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={oauthMode === 'direct' ? 'default' : 'outline'}
                  onClick={() => setOAuthMode('direct')}
                >
                  {t('oauth.modeDirect')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={oauthMode === 'relay' ? 'default' : 'outline'}
                  onClick={() => setOAuthMode('relay')}
                >
                  {t('oauth.modeRelay')}
                </Button>
              </div>

              {oauthMode === 'direct' ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('oauth.clientId')}</Label>
                    <Input
                      value={oauthClientId}
                      onChange={(e) => setOAuthClientId(e.target.value)}
                      placeholder={
                        oauthCfg?.hasClientId ? t('oauth.keepExisting') : 'OAuth Client ID'
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('oauth.clientSecret')}</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={oauthClientSecret}
                      onChange={(e) => setOAuthClientSecret(e.target.value)}
                      placeholder={
                        oauthCfg?.hasClientSecret ? t('oauth.keepExisting') : 'OAuth Client Secret'
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('oauth.relayUrl')}</Label>
                    <Input
                      type="url"
                      value={oauthRelayUrl}
                      onChange={(e) => setOAuthRelayUrl(e.target.value)}
                      placeholder="https://auth.itsaplan.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('oauth.relaySecret')}</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={oauthRelaySecret}
                      onChange={(e) => setOAuthRelaySecret(e.target.value)}
                      placeholder={
                        oauthCfg?.hasRelaySecret ? t('oauth.keepExisting') : '(optional)'
                      }
                    />
                  </div>
                </div>
              )}

              {oauthCfg?.callbackUrl && (
                <p className="font-mono text-xs break-all text-muted-foreground">
                  {t('oauth.callbackUrl')}: {oauthCfg.callbackUrl}
                </p>
              )}

              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saveOAuthConfig.isPending}
                onClick={handleSaveOAuthConfig}
              >
                {t('oauth.saveConfig')}
              </Button>
            </div>
          )}
        </div>
      )}

      {hasOAuth && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>{t('oauth.orManual')}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {meta.credentialSchema.map((field) => (
        <div key={field.key} className="space-y-1.5">
          {field.type === 'boolean' ? (
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={values[field.key] === true}
                onCheckedChange={(v) => setField(field.key, v === true)}
              />
              <span className="text-sm">{field.label}</span>
            </label>
          ) : (
            <>
              <Label>
                {field.label}
                {!field.required && <span className="text-muted-foreground"> (optional)</span>}
              </Label>
              <Input
                type={INPUT_TYPES[field.type] ?? 'text'}
                autoComplete="off"
                value={typeof values[field.key] === 'string' ? (values[field.key] as string) : ''}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={
                  isEdit && field.type === 'secret'
                    ? `Leave blank to keep ${existing?.redacted[field.key] ?? '••••'}`
                    : field.placeholder
                }
              />
            </>
          )}
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      ))}

      <div className="space-y-1.5">
        <Label>{t('label')}</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('labelPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">{t('labelHint')}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={busy}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={submit} disabled={!canSubmit}>
          {isEdit ? tCommon('save') : t('add')}
        </Button>
      </div>
    </div>
  );
}
