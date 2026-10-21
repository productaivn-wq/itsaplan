'use client';

import type { ReactNode } from 'react';
import {
  FILE_MARKER,
  fileMarkerInlineUrl,
  fileMarkerUrl,
  isImageAttachmentFilename,
} from '@/lib/markdown';

// The user bubble shows plain text, except the marker an attached file arrives
// as: image attachments render as an inline image preview with a link to open
// the full image, while non-image files render as a download link.
export default function AgentChatUserText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(new RegExp(FILE_MARKER))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const filename = match[1];
    const attachmentId = match[2];
    if (isImageAttachmentFilename(filename)) {
      const inlineUrl = fileMarkerInlineUrl(attachmentId);
      parts.push(
        <a
          key={parts.length}
          href={inlineUrl}
          target="_blank"
          rel="noreferrer"
          data-testid="chat-message-image-attachment"
          className="my-1.5 inline-flex max-w-xs flex-col overflow-hidden rounded-lg border border-border/60 bg-background/50"
        >
          <img
            src={inlineUrl}
            alt={filename}
            className="max-h-56 w-auto max-w-full object-contain"
            loading="lazy"
          />
          <span className="truncate px-2 py-1 text-[11px] text-muted-foreground underline underline-offset-2">
            {filename}
          </span>
        </a>,
      );
    } else {
      parts.push(
        <a
          key={parts.length}
          href={fileMarkerUrl(attachmentId)}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {filename}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}
