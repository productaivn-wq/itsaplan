'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Cloud, Sparkles } from 'lucide-react';
import type { Locale } from '@/i18n/locales';
import { saveWorkspaceState } from '@/lib/api/endpoints/agents';
import { updateAccountPreferences } from '@/lib/api/endpoints/userPreferences';
import { aiTeamPath, projectRefOf } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 1 | 2 | 3;

export default function SaaSTenantOnboardingPage() {
  const params = useParams<{ teamRef: string; projectKey: string }>();
  const router = useRouter();
  const locale = useLocale();
  const projectRef = projectRefOf(params?.teamRef ?? 'team', params?.projectKey ?? 'PRJ');

  const [step, setStep] = useState<Step>(1);
  const [workspaceName, setWorkspaceName] = useState(params?.projectKey ?? 'Workspace');
  const [defaultRole, setDefaultRole] = useState('Product & Operations Assistant');
  const [providerChoice, setProviderChoice] = useState<'managed' | 'openai' | 'anthropic' | 'gemini'>('managed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLaunch() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/aos/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          projectRef,
          workspaceName,
          defaultRole,
          providerChoice,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Could not complete onboarding');
      }
      await Promise.allSettled([
        updateAccountPreferences({ startPage: 'workspace' }, locale as Locale),
        saveWorkspaceState(projectRef, {
          onboardingCompleted: true,
          workspaceName,
          defaultRole,
          providerChoice,
        }),
      ]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aos_onboarding_completed', 'true');
      }
      router.push(aiTeamPath(projectRef, 'chat'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workspace preferences');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      data-testid="saas-onboarding-wizard"
      className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-8"
    >
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Set up your AI Workspace</h1>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            Step {step} of 3
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 1 as const, label: '1. Workspace' },
            { id: 2 as const, label: '2. Cloud AI' },
            { id: 3 as const, label: '3. Launch' },
          ].map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                step === item.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : step > item.id
                    ? 'border-border bg-muted/40 text-foreground'
                    : 'border-border/60 text-muted-foreground'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="workspace-name" className="text-xs font-medium text-foreground">
                Workspace Display Name
              </label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Acme Operations"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="assistant-focus" className="text-xs font-medium text-foreground">
                Primary Team Focus
              </label>
              <Input
                id="assistant-focus"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                placeholder="Product delivery, backlog triage, and team reporting"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Choose how your internal Cloud AI agents run. No terminal setup or local CLI installation is required.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  key: 'managed' as const,
                  title: 'Managed Cloud Default',
                  desc: 'Instant browser execution backed by your team credentials.',
                },
                {
                  key: 'openai' as const,
                  title: 'OpenAI Provider',
                  desc: 'Use your configured team OpenAI credential and model catalog.',
                },
                {
                  key: 'anthropic' as const,
                  title: 'Anthropic Claude',
                  desc: 'Long-context reasoning and structured delivery workflows.',
                },
                {
                  key: 'gemini' as const,
                  title: 'Google Gemini',
                  desc: 'Fast multimodal document and chart analysis.',
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setProviderChoice(opt.key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    providerChoice === opt.key
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Cloud className="size-3.5 text-primary" />
                    <span>{opt.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Ready to launch your workspace</span>
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                Workspace: <strong className="text-foreground">{workspaceName}</strong> ({projectRef})
              </li>
              <li>
                Assistant focus: <strong className="text-foreground">{defaultRole}</strong>
              </li>
              <li>
                Execution mode: <strong className="text-foreground">Cloud AI Workspace ({providerChoice})</strong>
              </li>
            </ul>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step === 1 || submitting}
            onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            className="gap-1.5"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="gap-1.5"
            >
              Continue <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              data-testid="onboarding-launch-btn"
              disabled={submitting}
              onClick={() => void handleLaunch()}
              className="gap-1.5"
            >
              <Bot className="size-3.5" />
              {submitting ? 'Launching…' : 'Open AI Workspace'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
