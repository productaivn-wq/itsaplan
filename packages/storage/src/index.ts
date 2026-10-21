import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// S3-compatible object store (RustFS in the Compose stacks) for attachments — api's issue/chat/document/
// initiative attachments and the worker's imported issue attachments alike.
// When S3_ENDPOINT is not configured (e.g., local sovereign dev environment), transparently
// falls back to a deterministic local disk object store under <repo_root>/.local_storage/.

let cached: { client: S3Client; bucket: string } | null = null;

const MONOREPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LOCAL_STORAGE_ROOT = process.env.LOCAL_STORAGE_DIR
  ? resolve(process.env.LOCAL_STORAGE_DIR)
  : resolve(MONOREPO_ROOT, '.local_storage');

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
  );
}

function getClient(): { client: S3Client; bucket: string } {
  if (cached) return cached;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 storage is not configured: set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.',
    );
  }
  cached = {
    client: new S3Client({
      endpoint,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    }),
    bucket,
  };
  return cached;
}

function resolveLocalObjectPaths(key: string): { dataPath: string; metaPath: string } {
  const normalized = key
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/');
  const dataPath = resolve(LOCAL_STORAGE_ROOT, normalized);
  if (!dataPath.startsWith(LOCAL_STORAGE_ROOT)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return { dataPath, metaPath: `${dataPath}.meta.json` };
}

async function putLocalObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const { dataPath, metaPath } = resolveLocalObjectPaths(key);
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, body);
  await writeFile(
    metaPath,
    JSON.stringify({
      contentType: contentType || 'application/octet-stream',
      contentLength: body.length,
    }),
    'utf8',
  );
}

async function getLocalObject(
  key: string,
): Promise<{ body: ReadableStream; contentType: string; contentLength?: number }> {
  const { dataPath, metaPath } = resolveLocalObjectPaths(key);
  const bytes = await readFile(dataPath);
  let contentType = 'application/octet-stream';
  try {
    const rawMeta = await readFile(metaPath, 'utf8');
    const parsed = JSON.parse(rawMeta) as { contentType?: string };
    if (parsed.contentType) contentType = parsed.contentType;
  } catch {
    // Metadata sidecar optional
  }
  const stream = new Response(bytes).body;
  if (!stream) throw new Error(`Object '${key}' has no body`);
  return {
    body: stream,
    contentType,
    contentLength: bytes.length,
  };
}

async function deleteLocalObject(key: string): Promise<void> {
  const { dataPath, metaPath } = resolveLocalObjectPaths(key);
  await rm(dataPath, { force: true }).catch(() => {});
  await rm(metaPath, { force: true }).catch(() => {});
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!hasS3Config()) {
    await putLocalObject(key, body, contentType);
    return;
  }
  try {
    const { client, bucket } = getClient();
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  } catch {
    await putLocalObject(key, body, contentType);
  }
}

export async function getObject(
  key: string,
): Promise<{ body: ReadableStream; contentType: string; contentLength?: number }> {
  if (!hasS3Config()) {
    return getLocalObject(key);
  }
  try {
    const { client, bucket } = getClient();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) throw new Error(`Object '${key}' has no body`);
    return {
      body: (res.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream(),
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
    };
  } catch {
    return getLocalObject(key);
  }
}

export async function getObjectText(key: string): Promise<string> {
  const { body } = await getObject(key);
  return new Response(body).text();
}

export async function deleteObject(key: string): Promise<void> {
  if (!hasS3Config()) {
    await deleteLocalObject(key);
    return;
  }
  try {
    const { client, bucket } = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    await deleteLocalObject(key);
  }
}

export async function deleteObjects(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      deleteObject(key).catch((err) => {
        console.error(`[storage] failed to delete object ${key}:`, err);
      }),
    ),
  );
}

export function safeAttachmentFilename(input: string, fallback = 'file'): string {
  const basename = input.split(/[\\/]/).pop() ?? '';
  const printable = [...basename]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? '_' : character;
    })
    .join('')
    .trim();
  const filename = printable.slice(-255);
  return filename && filename !== '.' && filename !== '..' ? filename : fallback;
}

export function attachmentObjectKey(
  projectId: number,
  namespace: 'attachments' | 'chat' | 'documents' | 'initiatives',
  ownerId: number | null,
  filename: string,
): string {
  const safeName = safeAttachmentFilename(filename)
    .replace(/[^\w.-]+/g, '_')
    .slice(-100);
  const ownerPath = ownerId === null ? '' : `${ownerId}/`;
  return `projects/${projectId}/${namespace}/${ownerPath}${randomUUID()}-${safeName}`;
}
