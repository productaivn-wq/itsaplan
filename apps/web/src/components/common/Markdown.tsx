'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { markdownSegments } from '@/lib/markdown';
import { Skeleton } from '@/components/ui/skeleton';
import MarkdownLinkContent from './editor/MarkdownLinkContent';
import { bareMarkdownUrls } from './editor/linkPresentation';

// recharts is loaded only by the answers that actually carry a chart, so the views
// that just show markdown do not pull it in.
const ChartBlock = dynamic(() => import('./chart/ChartBlock'));
// The import review card pulls its draft over HTTP, so only answers carrying one
// load it.
const AgentChatImportCard = dynamic(() => import('./agent-chat/AgentChatImportCard'));

// Renders markdown text as formatted HTML with the shared `.md-content` styles
// (headings, lists, code, blockquote, links), without the virtualized-table image
// sizing the markdown table cell adds. Links open in a new tab so following one
// does not replace the view the reader was on. A ```chart fence is drawn as a chart
// where it sits in the text (see markdownSegments).
export default function Markdown({
  children,
  complete = true,
}: {
  children: string;
  complete?: boolean;
}) {
  const segments = useMemo(() => markdownSegments(children, { newTabLinks: true }), [children]);
  const bareUrls = useMemo(
    () => (complete ? bareMarkdownUrls(children) : new Set<string>()),
    [children, complete],
  );
  // `dir="auto"` reads the direction from the text itself, so an Arabic comment in
  // an English interface — and the reverse — is laid out the way it was written.
  return (
    <div dir="auto">
      {segments.map((segment, index) => {
        if (segment.kind === 'chart') {
          return <ChartBlock key={index} spec={segment.spec} source={segment.source} />;
        }
        if (segment.kind === 'issue-import') {
          return <AgentChatImportCard key={index} importId={segment.importId} />;
        }
        if (segment.kind === 'diff') {
          return (
            <pre
              key={index}
              data-testid="markdown-diff-block"
              className="my-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
            >
              {segment.content.split('\n').map((line, li) => (
                <div
                  key={li}
                  className={
                    line.startsWith('+') && !line.startsWith('+++')
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : line.startsWith('-') && !line.startsWith('---')
                        ? 'bg-destructive/15 text-destructive'
                        : 'text-foreground'
                  }
                >
                  {line || ' '}
                </div>
              ))}
            </pre>
          );
        }
        if (segment.kind === 'mermaid') {
          return (
            <div
              key={index}
              data-testid="markdown-mermaid-block"
              className="my-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Mermaid Diagram</span>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-foreground">
                {segment.content}
              </pre>
            </div>
          );
        }
        // The fence is still streaming in: hold its place rather than showing the
        // half-written JSON that would turn into the chart a moment later.
        if (segment.kind === 'pending') {
          return <Skeleton key={index} className="my-3 h-[220px] w-full" />;
        }
        return (
          <MarkdownLinkContent
            key={index}
            html={segment.html}
            bareUrls={bareUrls}
            complete={complete}
          />
        );
      })}
    </div>
  );
}
