'use client';

import * as React from 'react';
import { Archive, Check, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArchiveManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  manifestContent: string;
  totalEntries?: number;
  totalSize?: number;
}

export default function ArchiveManifestModal({
  isOpen,
  onClose,
  filePath,
  manifestContent,
  totalEntries,
  totalSize,
}: ArchiveManifestModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!manifestContent) return;
    navigator.clipboard.writeText(manifestContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileName = filePath ? filePath.split('/').pop() : 'Archive';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] sm:max-w-3xl flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Archive className="size-5 text-amber-500" />
            <DialogTitle className="text-base font-semibold truncate">
              Archive Manifest: {fileName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            {filePath}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2 shrink-0">
          <Badge variant="outline" className="text-[11px] font-mono">
            Zero-Mojibake UTF-8
          </Badge>
          <Badge variant="secondary" className="text-[11px]">
            In-Memory Read (No Disk Extraction)
          </Badge>
          {totalEntries ? (
            <Badge variant="outline" className="text-[11px]">
              {totalEntries} Entries
            </Badge>
          ) : null}
          {totalSize ? (
            <Badge variant="outline" className="text-[11px] font-mono">
              {(totalSize / 1024).toFixed(1)} KB
            </Badge>
          ) : null}
        </div>

        <div className="flex-1 min-h-[300px] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          <pre className="whitespace-pre-wrap text-foreground/90 font-mono leading-relaxed">
            {manifestContent || 'No manifest content available for this archive.'}
          </pre>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied to Clipboard' : 'Copy Manifest'}
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
