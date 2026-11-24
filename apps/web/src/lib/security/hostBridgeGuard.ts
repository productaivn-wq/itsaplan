import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

function normalizedRequestHost(req: NextRequest): string {
  const host = (req.headers.get('host') || req.nextUrl.hostname || '').trim().toLowerCase();
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    return end === -1 ? host : host.slice(0, end + 1);
  }
  return host.split(':')[0] ?? '';
}

export function hasStructurallyValidSessionCookie(req: NextRequest): boolean {
  const raw = getSessionCookie(req);
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length < 8) return false;
  return !/[\s\x00-\x1f\x7f]/.test(trimmed);
}

/**
 * Fail-closed guard for legacy host-machine developer bridges.
 * In multi-tenant client mode (default), every host bridge returns 403 HOST_BRIDGE_QUARANTINED.
 * Opt-in local dev bridge requires explicit ITSAPLAN_ALLOW_HOST_BRIDGE=true, a valid session
 * cookie, and a strict loopback request Host header.
 */
export function isHostBridgeAllowed(req: NextRequest): boolean {
  if (process.env.ITSAPLAN_ALLOW_HOST_BRIDGE !== 'true') return false;
  if (!hasStructurallyValidSessionCookie(req)) return false;
  return LOOPBACK_HOSTS.has(normalizedRequestHost(req));
}

export function guardHostBridge(req: NextRequest): NextResponse | null {
  if (process.env.ITSAPLAN_ALLOW_HOST_BRIDGE !== 'true') {
    return NextResponse.json(
      {
        error: 'Host-machine bridge is disabled in multi-tenant client mode',
        code: 'HOST_BRIDGE_QUARANTINED',
      },
      { status: 403 },
    );
  }
  if (!hasStructurallyValidSessionCookie(req)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!LOOPBACK_HOSTS.has(normalizedRequestHost(req))) {
    return NextResponse.json(
      {
        error: 'Host-machine bridge requires a loopback host',
        code: 'HOST_BRIDGE_QUARANTINED',
      },
      { status: 403 },
    );
  }
  return null;
}
