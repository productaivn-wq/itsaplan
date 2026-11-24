'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { LlmRouterState, RouterTestResult } from '@/lib/api/endpoints/llmRouter';

interface RouterTestPlaygroundTabProps {
  state: LlmRouterState;
  canEdit: boolean;
  running: boolean;
  lastResult: RouterTestResult | null;
  onRunTest: (input: {
    prompt: string;
    model?: string;
    preferredProvider?: string | null;
    maxTokens?: number;
  }) => void;
}

export default function RouterTestPlaygroundTab({
  state,
  canEdit,
  running,
  lastResult,
  onRunTest,
}: RouterTestPlaygroundTabProps) {
  const [model, setModel] = useState(state.gateway.supported_models[0] ?? 'agentic-os/auto');
  const [preferredProvider, setPreferredProvider] = useState<string>('auto');
  const [maxTokens, setMaxTokens] = useState('128');
  const [prompt, setPrompt] = useState('Reply with OK and identify your model.');

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Live Routing Diagnostic Playground
          </h3>
          <p className="text-xs text-muted-foreground">
            Send a bounded prompt through the active fallback chain or pin a specific provider tier.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Virtual Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-8 text-xs" data-testid="router-test-model-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.gateway.supported_models.map((mid) => (
                  <SelectItem key={mid} value={mid} className="font-mono text-xs">
                    {mid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Provider Override</Label>
            <Select value={preferredProvider} onValueChange={setPreferredProvider}>
              <SelectTrigger className="h-8 text-xs" data-testid="router-test-provider-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  Auto Fallback Chain
                </SelectItem>
                {state.providers.map((p) => (
                  <SelectItem key={p.key} value={p.key} className="font-mono text-xs">
                    {p.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Tokens (16–1024)</Label>
            <Input
              type="number"
              min={16}
              max={1024}
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Diagnostic Prompt</Label>
          <Textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a test prompt..."
            className="text-xs"
            data-testid="router-test-prompt"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            disabled={!canEdit || running || !prompt.trim()}
            onClick={() =>
              onRunTest({
                prompt: prompt.trim(),
                model,
                preferredProvider: preferredProvider === 'auto' ? null : preferredProvider,
                maxTokens: Math.max(16, Math.min(1024, Number(maxTokens) || 128)),
              })
            }
            data-testid="router-test-submit"
          >
            <Play className="size-3.5" />
            {running ? 'Routing...' : 'Run Diagnostic'}
          </Button>
        </div>
      </section>

      {lastResult && (
        <section
          data-testid="router-test-result"
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={lastResult.ok ? 'secondary' : 'destructive'} className="text-xs">
              {lastResult.ok ? 'SUCCESS' : 'FAILED'}
            </Badge>
            {lastResult.winning_provider && (
              <Badge variant="outline" className="font-mono text-xs">
                Provider: {lastResult.winning_provider}
              </Badge>
            )}
            {lastResult.winning_model && (
              <Badge variant="outline" className="font-mono text-xs">
                Model: {lastResult.winning_model}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Latency: {lastResult.latency_ms}ms · Tokens: {lastResult.input_tokens} in /{' '}
              {lastResult.output_tokens} out
            </span>
          </div>

          {lastResult.error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
              {lastResult.error}
            </p>
          ) : (
            <pre className="max-h-60 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap text-foreground">
              {lastResult.response_preview}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
