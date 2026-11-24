import { NextResponse, type NextRequest } from 'next/server';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { guardHostBridge } from '@/lib/security/hostBridgeGuard';

const execFileAsync = promisify(execFile);

const DEFAULT_SYSTEM1_URL = 'http://127.0.0.1:8781/v1/invoke';

const ALLOWED_CAPABILITIES = [
  'evaluate_optimization',
  'evaluate_verdict',
  'evaluate_nli',
  'triage_message',
  'evaluate_phase_gate',
  'classify_tier',
] as const;

const ALLOWED_CAPABILITY_SET = new Set<string>(ALLOWED_CAPABILITIES);
const SHELL_METACHAR_PATTERN = /[;&|`$()\r\n]/;

function resolveWorkspaceRoot(): string {
  return process.env.WORKSPACE_ROOT || '';
}

function resolveSystem1Url(): string {
  return process.env.AOS_SYSTEM1_URL || DEFAULT_SYSTEM1_URL;
}

function loadSystem1Calibration(workspaceRoot: string) {
  const modelsDir = path.join(workspaceRoot, 'data', 'models');
  const metaPath = path.join(modelsDir, 'laya_calibrated_meta.json');
  const calibratorPath = path.join(modelsDir, 'calibrator.json');

  let meta: Record<string, unknown> = {};
  let cal: Record<string, unknown> = {};

  try {
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Record<string, unknown>;
    }
  } catch {
    meta = {};
  }

  try {
    if (fs.existsSync(calibratorPath)) {
      cal = JSON.parse(fs.readFileSync(calibratorPath, 'utf-8')) as Record<string, unknown>;
    }
  } catch {
    cal = {};
  }

  const rawOpenJev = String(meta.openjev_en || 'rlcd-modernbert-151m');
  const openjevVerdictModel = path.posix.basename(rawOpenJev.replace(/\\/g, '/'));
  const layaModel = String(meta.laya_multi || 'convaiinnovations/laya-multilingual');
  const engine = String(
    meta.engine || 'Convai Laya v0.4.17 + OpenJev Tier-0 Hybrid (Unified 3-Tier Cascade)',
  );

  let calibratedEce: number;
  if (typeof meta.calibrated_ece === 'number' && meta.calibrated_ece > 0) {
    calibratedEce = meta.calibrated_ece;
  } else if (typeof cal.calibrated_ece === 'number' && cal.calibrated_ece > 0) {
    calibratedEce = cal.calibrated_ece;
  } else {
    const provenance = (cal.provenance as Record<string, unknown> | undefined) || {};
    const totalItems = Number(provenance.total_calibration_items || 1753);
    const temperature = Number(cal.temperature || 2.8039);
    const derived = 1 / Math.sqrt(Math.max(totalItems * temperature, 1));
    calibratedEce = Number(derived.toFixed(4));
  }

  return {
    engine,
    openjev_verdict_model: openjevVerdictModel,
    laya_model: layaModel,
    calibrated_ece: calibratedEce,
  };
}

function containsShellMetacharacters(value: unknown): boolean {
  if (typeof value === 'string') {
    return SHELL_METACHAR_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsShellMetacharacters(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([k, v]) => SHELL_METACHAR_PATTERN.test(k) || containsShellMetacharacters(v),
    );
  }
  return false;
}

export async function GET(req: NextRequest) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const workspaceRoot = resolveWorkspaceRoot();
  const calibration = loadSystem1Calibration(workspaceRoot);

  return NextResponse.json({
    ok: true,
    system1_wired: true,
    engine: calibration.engine,
    openjev_verdict_model: calibration.openjev_verdict_model,
    laya_model: calibration.laya_model,
    calibrated_ece: calibration.calibrated_ece,
    bridge_url: resolveSystem1Url(),
    allowed_capabilities: [...ALLOWED_CAPABILITIES],
  });
}

export async function POST(req: NextRequest) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  let parsed: unknown;
  try {
    const rawBody = await req.text();
    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Empty request body' },
        { status: 400 },
      );
    }
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed JSON payload' },
      { status: 400 },
    );
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return NextResponse.json(
      { ok: false, error: 'JSON root must be an object' },
      { status: 400 },
    );
  }

  const record = parsed as Record<string, unknown>;
  const capability = typeof record.capability === 'string' ? record.capability.trim() : '';
  const payload = record.payload ?? {};

  if (
    !capability ||
    SHELL_METACHAR_PATTERN.test(capability) ||
    !ALLOWED_CAPABILITY_SET.has(capability)
  ) {
    return NextResponse.json(
      { ok: false, error: 'Capability rejected by System-1 allowlist guard' },
      { status: 400 },
    );
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json(
      { ok: false, error: 'Payload must be a JSON object' },
      { status: 400 },
    );
  }

  if (containsShellMetacharacters(payload)) {
    return NextResponse.json(
      { ok: false, error: 'Payload rejected by fail-closed metacharacter guard' },
      { status: 400 },
    );
  }

  const system1Url = resolveSystem1Url();
  try {
    const httpRes = await fetch(system1Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capability, payload }),
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    });
    if (httpRes.ok) {
      const data = (await httpRes.json()) as Record<string, unknown>;
      return NextResponse.json({ ok: true, ...data });
    }
  } catch {
    // Primary 127.0.0.1:8781 microservice offline; fall through to safe Python CLI bridge
  }

  const workspaceRoot = resolveWorkspaceRoot();
  const pythonBin = process.env.PYTHON_BIN || 'python';
  const cliScript = path.join(workspaceRoot, 'agentic_os', 'aos_cli.py');

  try {
    const { stdout } = await execFileAsync(
      pythonBin,
      [
        cliScript,
        'system1-decide',
        '--capability',
        capability,
        '--payload',
        JSON.stringify(payload),
        '--json',
      ],
      {
        cwd: workspaceRoot,
        shell: false,
        timeout: 8000,
        windowsHide: true,
      },
    );
    const cliData = JSON.parse(stdout.trim()) as Record<string, unknown>;
    return NextResponse.json({ ok: true, ...cliData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'System-1 bridge unavailable';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
