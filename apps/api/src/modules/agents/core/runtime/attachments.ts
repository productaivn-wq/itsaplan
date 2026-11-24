import { getChatAttachmentByPublicId, readAttachmentBytes } from '#modules/chat-attachments/service';

const ATTACHMENT_MARKER_RE = /\(attachment id:\s*([a-zA-Z0-9_-]+)\)/g;
const MAX_PROMPT_ATTACHMENTS = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export interface MultimodalTextPart {
  type: 'text';
  text: string;
}

export interface MultimodalImagePart {
  type: 'image';
  image: string;
  mediaType: string;
}

export interface MultimodalFilePart {
  type: 'file';
  data: string;
  mediaType: string;
  filename: string;
}

export type MultimodalPart = MultimodalTextPart | MultimodalImagePart | MultimodalFilePart;

export interface MultimodalUserMessage {
  role: 'user';
  content: MultimodalPart[];
}

export function extractAttachmentIdsFromPrompt(prompt: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of prompt.matchAll(ATTACHMENT_MARKER_RE)) {
    const id = match[1]?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    found.push(id);
    if (found.length >= MAX_PROMPT_ATTACHMENTS) break;
  }
  return found;
}

export async function buildMultimodalPromptInput(
  projectId: number,
  prompt: string,
  attachmentIds?: string[],
  deps?: {
    getAttachment?: typeof getChatAttachmentByPublicId;
    readBytes?: typeof readAttachmentBytes;
  },
): Promise<string | MultimodalUserMessage[]> {
  const lookup = deps?.getAttachment ?? getChatAttachmentByPublicId;
  const readBytes = deps?.readBytes ?? readAttachmentBytes;

  const mergedIds: string[] = [];
  const seen = new Set<string>();
  for (const id of [...(attachmentIds ?? []), ...extractAttachmentIdsFromPrompt(prompt)]) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    mergedIds.push(trimmed);
    if (mergedIds.length >= MAX_PROMPT_ATTACHMENTS) break;
  }

  if (mergedIds.length === 0) return prompt;

  const binaryParts: MultimodalPart[] = [];
  for (const publicId of mergedIds) {
    const row = await lookup(publicId);
    // Strict tenant/project isolation boundary: never attach files from another project.
    if (!row || row.projectId !== projectId) continue;

    const mime = (row.contentType || '').toLowerCase();
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    if (!isImage && !isPdf) continue;

    if (isImage && row.sizeBytes > MAX_IMAGE_BYTES) continue;
    if (isPdf && row.sizeBytes > MAX_PDF_BYTES) continue;

    const bytes = await readBytes(row.s3Key).catch(() => null);
    if (!bytes || bytes.length === 0) continue;

    if (isImage && bytes.length <= MAX_IMAGE_BYTES) {
      binaryParts.push({
        type: 'image',
        image: `data:${row.contentType};base64,${bytes.toString('base64')}`,
        mediaType: row.contentType,
      });
    } else if (isPdf && bytes.length <= MAX_PDF_BYTES) {
      binaryParts.push({
        type: 'file',
        data: bytes.toString('base64'),
        mediaType: row.contentType,
        filename: row.filename,
      });
    }
  }

  if (binaryParts.length === 0) return prompt;

  return [
    {
      role: 'user',
      content: [{ type: 'text', text: prompt }, ...binaryParts],
    },
  ];
}
