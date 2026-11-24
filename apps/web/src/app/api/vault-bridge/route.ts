import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { guardHostBridge } from "@/lib/security/hostBridgeGuard";

const VAULT_SERVER = process.env.VAULT_BRIDGE_URL || "http://127.0.0.1:8765";
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || "";
const VAULT_SCRIPT = WORKSPACE_ROOT ? path.join(WORKSPACE_ROOT, "scripts", "agent_env_vault_server.py") : "";

async function isVaultAlive(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${VAULT_SERVER}/api/status`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureVaultDaemonRunning(): Promise<boolean> {
  if (await isVaultAlive()) return true;
  if (!VAULT_SCRIPT || !WORKSPACE_ROOT) return false;
  try {
    const child = spawn("pythonw", [VAULT_SCRIPT, "--port", "8765"], {
      cwd: WORKSPACE_ROOT,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env, PYTHONUTF8: "1" },
    });
    child.unref();
  } catch {
    try {
      const child = spawn("python", [VAULT_SCRIPT, "--port", "8765"], {
        cwd: WORKSPACE_ROOT,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
        env: { ...process.env, PYTHONUTF8: "1" },
      });
      child.unref();
    } catch {}
  }

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await isVaultAlive()) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const alive = await ensureVaultDaemonRunning();
  if (!alive) {
    return NextResponse.json(
      { error: `Unable to start Secret Vault daemon (${VAULT_SERVER})` },
      { status: 503 }
    );
  }
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  const revealKey = req.nextUrl.searchParams.get("reveal");
  const target = req.nextUrl.searchParams.get("target") || "all";
  const upstreamUrl = endpoint
    ? `${VAULT_SERVER}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
    : revealKey
    ? `${VAULT_SERVER}/api/secrets/reveal?key=${encodeURIComponent(revealKey)}`
    : `${VAULT_SERVER}/api/secrets?target=${encodeURIComponent(target)}`;
  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const buf = await upstream.arrayBuffer();
      return new NextResponse(buf, {
        status: upstream.status,
        headers: { "content-type": contentType || "application/octet-stream" },
      });
    }
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const alive = await ensureVaultDaemonRunning();
  if (!alive) {
    return NextResponse.json(
      { error: `Unable to start Secret Vault daemon (${VAULT_SERVER})` },
      { status: 503 }
    );
  }
  const endpoint = req.nextUrl.searchParams.get("endpoint") || "/api/secrets";
  const upstreamUrl = `${VAULT_SERVER}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  try {
    const bodyText = await req.text();
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      cache: "no-store",
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = guardHostBridge(req);
  if (denied) return denied;
  const alive = await ensureVaultDaemonRunning();
  if (!alive) {
    return NextResponse.json(
      { error: `Unable to start Secret Vault daemon (${VAULT_SERVER})` },
      { status: 503 }
    );
  }
  const endpoint = req.nextUrl.searchParams.get("endpoint") || "/api/secrets";
  const upstreamUrl = `${VAULT_SERVER}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "DELETE",
      cache: "no-store",
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    );
  }
}
