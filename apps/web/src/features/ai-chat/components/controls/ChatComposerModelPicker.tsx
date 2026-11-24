'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Cpu, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { ChatRunOptions } from '@/lib/api/endpoints/agentChat';
import {
  useIntegrationCatalogQuery,
  useIntegrationModelsQuery,
  useIntegrationOptionsQuery,
} from '@/services/integrations.service';
import { useUpdateAiAgent } from '@/services/aiAgents.service';
import { integrationLabel } from '@/utils/integrationLabels';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  CURATED_MODEL_PRESETS,
  formatModelDisplayLabel,
  type CuratedModelPreset,
} from '../../types/workspaceControls';

const CURATED_FAMILIES: CuratedModelPreset['family'][] = [
  'Antigravity / Gemini',
  'Claude',
  'OpenAI / Codex',
];

const NON_LLM_CRED_LABEL_RE =
  /COOKIE|CONFIG_DIR|SCOPES|EMAIL|USERNAME|RECAPTCHA|IMAP|PROXY|POSTGRES|ACCOUNT_ID|CLIENT_ID|REFRESH_TOKEN/i;

export function ChatComposerModelPicker({
  agent,
  options,
  onChange,
  canEditAgent = false,
  disabled = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  agent: AiAgent;
  options: ChatRunOptions;
  onChange: (patch: Partial<ChatRunOptions>) => void;
  canEditAgent?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations('aiChat');
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [search, setSearch] = useState('');
  const [savedFlag, setSavedFlag] = useState(false);

  const isInternal = agent.kind === 'internal';
  const llmOptionsQuery = useIntegrationOptionsQuery(isInternal ? agent.teamId : null, 'llm');
  const catalogQuery = useIntegrationCatalogQuery(isInternal ? agent.teamId : null);
  const rawLlmCredentials = useMemo(() => llmOptionsQuery.data ?? [], [llmOptionsQuery.data]);
  const activeCredentialId = options.modelCredentialId ?? agent.modelCredentialId ?? null;
  const llmCredentials = useMemo(() => {
    const filtered = rawLlmCredentials.filter(
      (c) =>
        c.id === activeCredentialId ||
        c.id === agent.modelCredentialId ||
        !NON_LLM_CRED_LABEL_RE.test(c.label ?? ''),
    );
    return filtered.sort((a, b) => {
      const aGw = a.label === 'Agentic OS LLMProviderRouter Gateway' ? -1 : 0;
      const bGw = b.label === 'Agentic OS LLMProviderRouter Gateway' ? -1 : 0;
      return aGw - bGw;
    });
  }, [rawLlmCredentials, activeCredentialId, agent.modelCredentialId]);
  const catalog = catalogQuery.data ?? [];

  const activeCredential =
    llmCredentials.find((c) => c.id === activeCredentialId) ??
    rawLlmCredentials.find((c) => c.id === activeCredentialId) ??
    null;
  const activeProvider = activeCredential?.integrationKey ?? agent.modelProvider ?? null;

  const modelsQuery = useIntegrationModelsQuery(
    isInternal ? agent.teamId : null,
    isInternal ? activeProvider : null,
  );
  const providerModels = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const updateAgentMutation = useUpdateAiAgent(agent.teamId);

  const defaultLabel = isInternal ? t('modelDefault') : t('runnerDefault');
  const displayLabel = formatModelDisplayLabel(options.model, agent, defaultLabel);
  const isOverridden = Boolean(options.model) || options.modelCredentialId != null;

  const showProviderModels = isInternal && providerModels.length > 0;
  const query = search.trim();
  const matchesKnown = showProviderModels
    ? providerModels.some((m) => m.id === query)
    : CURATED_MODEL_PRESETS.some((p) => p.id === query);
  const showCustom = query.length > 0 && !matchesKnown;

  const selectModel = (model: string | null, credentialId?: number | null) => {
    setSavedFlag(false);
    onChange({
      model,
      ...(credentialId !== undefined ? { modelCredentialId: credentialId } : {}),
    });
    setSearch('');
    setOpen(false);
  };

  const handleSaveAsDefault = async () => {
    if (!isInternal || !canEditAgent || !isOverridden) return;
    await updateAgentMutation.mutateAsync({
      id: agent.id,
      patch: {
        ...(options.modelCredentialId != null
          ? { modelCredentialId: options.modelCredentialId }
          : {}),
        ...(options.model ? { model: options.model } : {}),
      },
    });
    setSavedFlag(true);
    onChange({ model: null, modelCredentialId: null });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <InputGroupButton
          type="button"
          variant="ghost"
          size="xs"
          data-testid="composer-model-picker-trigger"
          className={cn(
            'max-w-44 rounded-md text-muted-foreground hover:text-foreground',
            isOverridden && 'text-foreground',
          )}
          title={t('model')}
        >
          <Cpu className="shrink-0" />
          <span className="truncate">{displayLabel}</span>
          {isOverridden && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          )}
          <ChevronDown className="shrink-0 opacity-60" />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          {isInternal && llmCredentials.length > 1 && (
            <div className="border-b border-border/60 px-2.5 py-2">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <KeyRound className="size-3" />
                <span>{t('providerCredential')}</span>
              </div>
              {llmCredentials.length > 4 ? (
                <select
                  aria-label={t('providerCredential')}
                  value={activeCredentialId ?? ''}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    if (!Number.isFinite(nextId)) return;
                    setSavedFlag(false);
                    onChange({
                      modelCredentialId: nextId === agent.modelCredentialId ? null : nextId,
                      model: null,
                    });
                  }}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                >
                  {llmCredentials.map((cred) => {
                    const label = cred.label
                      ? `${integrationLabel(catalog, cred.integrationKey)} · ${cred.label}`
                      : integrationLabel(catalog, cred.integrationKey);
                    return (
                      <option key={cred.id} value={cred.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {llmCredentials.map((cred) => {
                    const selected = cred.id === activeCredentialId;
                    const label = cred.label
                      ? `${integrationLabel(catalog, cred.integrationKey)} · ${cred.label}`
                      : integrationLabel(catalog, cred.integrationKey);
                    return (
                      <button
                        key={cred.id}
                        type="button"
                        onClick={() => {
                          setSavedFlag(false);
                          onChange({
                            modelCredentialId:
                              cred.id === agent.modelCredentialId ? null : cred.id,
                            model: null,
                          });
                        }}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs font-medium transition',
                          selected
                            ? 'border-primary/40 bg-secondary text-foreground'
                            : 'border-border/70 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <CommandInput
            placeholder={t('searchModel')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            className="max-h-72"
            onWheel={(e) => {
              e.currentTarget.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
            }}
          >
            {!showCustom && !modelsQuery.isLoading && (
              <CommandEmpty>{t('noMatches')}</CommandEmpty>
            )}

            <CommandGroup>
              <CommandItem
                value={`default ${defaultLabel}`}
                onSelect={() => selectModel(null, null)}
              >
                <span className="flex-1 truncate text-xs font-medium">{defaultLabel}</span>
                {!isOverridden && <Check className="ms-auto size-3.5" />}
              </CommandItem>
            </CommandGroup>

            {showCustom && (
              <CommandGroup>
                <CommandItem value={query} onSelect={() => selectModel(query)}>
                  <span className="truncate text-xs">
                    {t('useCustomModel', { query })}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {isInternal && modelsQuery.isLoading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">…</div>
            ) : showProviderModels ? (
              <CommandGroup>
                {providerModels.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.id} ${m.name}`}
                    onSelect={() => selectModel(m.id)}
                  >
                    <div className="min-w-0 flex-1">
                      {m.name !== m.id && (
                        <div className="truncate text-xs font-medium">{m.name}</div>
                      )}
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {m.id}
                      </div>
                    </div>
                    {options.model === m.id && <Check className="ms-auto size-3.5 shrink-0" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              CURATED_FAMILIES.map((family) => {
                const items = CURATED_MODEL_PRESETS.filter((p) => p.family === family);
                return (
                  <CommandGroup key={family} heading={family}>
                    {items.map((preset) => (
                      <CommandItem
                        key={preset.id}
                        value={`${preset.id} ${preset.label} ${preset.family}`}
                        onSelect={() => selectModel(preset.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-medium">{preset.label}</span>
                            {preset.tier && (
                              <span className="rounded bg-muted px-1 py-0.2 font-mono text-xs text-muted-foreground">
                                {preset.tier}
                              </span>
                            )}
                          </div>
                          <div className="truncate font-mono text-xs text-muted-foreground">
                            {preset.id}
                          </div>
                        </div>
                        {options.model === preset.id && (
                          <Check className="ms-auto size-3.5 shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>

          {isInternal && canEditAgent && (isOverridden || savedFlag) && (
            <div className="border-t border-border/60 p-1.5">
              <button
                type="button"
                disabled={updateAgentMutation.isPending || !isOverridden}
                onClick={() => void handleSaveAsDefault()}
                className="w-full rounded-md px-2 py-1 text-left text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
              >
                {savedFlag ? t('savedAsAgentDefault') : t('saveAsAgentDefault')}
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
