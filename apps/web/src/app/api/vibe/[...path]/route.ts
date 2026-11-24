import { NextRequest, NextResponse } from 'next/server';
import { execFile, spawn } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { guardHostBridge } from '@/lib/security/hostBridgeGuard';

const execFileAsync = promisify(execFile);

const VIBE_BRIDGE_ORIGIN = process.env.VAULT_BRIDGE_URL || 'http://127.0.0.1:8765';
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(process.cwd(), '../../../..');

let spawnAttemptedAt = 0;

function ensurePort8765ServerStarted() {
  const now = Date.now();
  if (now - spawnAttemptedAt < 10_000) return;
  spawnAttemptedAt = now;
  try {
    const scriptPath = path.join(WORKSPACE_ROOT, 'scripts', 'agent_env_vault_server.py');
    const child = spawn('python', [scriptPath, '--port', '8765'], {
      cwd: WORKSPACE_ROOT,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, PYTHONUTF8: '1' },
    });
    child.unref();
  } catch {
    // Fallback will still execute via one-shot VibeCanvasService
  }
}

async function runPythonVibeFallback(
  method: 'GET' | 'POST',
  vibePath: string,
  queryObj: Record<string, string[]>,
  bodyObj: Record<string, unknown>,
) {
  const pyCode = [
    'import json, sys',
    'sys.path.insert(0, "scripts")',
    'from vibe_canvas_api_bridge import VibeCanvasService',
    'svc = VibeCanvasService(".")',
    'method, path, q_json, b_json = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]',
    'if method == "GET":',
    '    res = svc.dispatch_vibe_get(path, json.loads(q_json))',
    'else:',
    '    res = svc.dispatch_vibe_post(path, json.loads(b_json))',
    'print(json.dumps(res, ensure_ascii=False))',
  ].join('\n');

  const { stdout } = await execFileAsync(
    'python',
    [
      '-c',
      pyCode,
      method,
      vibePath,
      JSON.stringify(queryObj),
      JSON.stringify(bodyObj),
    ],
    {
      cwd: WORKSPACE_ROOT,
      timeout: 15_000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    },
  );
  return JSON.parse(stdout.trim());
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const { path: pathSegments } = await context.params;
  const vibePath = `/api/vibe/${pathSegments.join('/')}`;
  const search = req.nextUrl.search || '';
  const targetUrl = `${VIBE_BRIDGE_ORIGIN}${vibePath}${search}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch {
    ensurePort8765ServerStarted();
    try {
      const queryObj: Record<string, string[]> = {};
      req.nextUrl.searchParams.forEach((val, key) => {
        if (!queryObj[key]) queryObj[key] = [];
        queryObj[key].push(val);
      });
      const fallbackData = await runPythonVibeFallback('GET', vibePath, queryObj, {});
      return NextResponse.json(fallbackData, { status: 200 });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Vibe GET fallback error' },
        { status: 500 },
      );
    }
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const { path: pathSegments } = await context.params;
  const vibePath = `/api/vibe/${pathSegments.join('/')}`;
  const targetUrl = `${VIBE_BRIDGE_ORIGIN}${vibePath}`;

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    rawBody = '';
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: rawBody || '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch {
    ensurePort8765ServerStarted();
    let bodyObj: Record<string, unknown> = {};
    try {
      bodyObj = (rawBody ? JSON.parse(rawBody) : {}) as Record<string, unknown>;
    } catch {
      bodyObj = {};
    }
    try {
      const fallbackData = await runPythonVibeFallback('POST', vibePath, {}, bodyObj);
      return NextResponse.json(fallbackData, { status: 200 });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Vibe POST fallback error' },
        { status: 500 },
      );
    }
  }
}
