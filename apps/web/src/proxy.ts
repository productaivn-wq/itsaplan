import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy } from '@/utils/contentSecurityPolicy';
import { guardHostBridge, hasStructurallyValidSessionCookie } from '@/lib/security/hostBridgeGuard';

// Legacy host-machine bridge prefixes fail closed at the request edge before rewrites execute.
const HOST_BRIDGE_PATHS = ['/api/vibe', '/api/vault-bridge'];

// Routes reachable without a session, and that bounce a signed-in user back to
// the app. Everything else requires one.
const PUBLIC_PATHS = ['/login', '/register'];

// Routes reachable with or without a session, and never bounced. `/onboarding` is
// intentionally excluded in multi-tenant client mode so onboarding requires an active
// authenticated session.
const OPEN_PATHS = ['/invite', '/forgot-password', '/reset-password', '/share', '/media', '/kara'];

// Routes that stream bytes from the api and pass its headers through.
const MEDIA_PATHS = ['/media', '/protected-media'];

function matcher(pathname: string) {
  return (path: string) => pathname === path || pathname.startsWith(`${path}/`);
}

function clearSession(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  for (const { name } of request.cookies.getAll()) {
    if (!name.includes('better-auth.')) continue;
    response.cookies.delete({ name, path: '/', secure: name.startsWith('__Secure-') });
  }
  return response;
}

export function proxy(request: NextRequest) {
  const response = gate(request);
  if (!MEDIA_PATHS.some(matcher(request.nextUrl.pathname))) {
    response.headers.set('Content-Security-Policy', contentSecurityPolicy());
  }
  return response;
}

function gate(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = hasStructurallyValidSessionCookie(request);
  const matches = matcher(pathname);

  if (HOST_BRIDGE_PATHS.some(matches)) {
    const blocked = guardHostBridge(request);
    if (blocked) return blocked;
    return NextResponse.next();
  }

  if (OPEN_PATHS.some(matches)) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some(matches);

  if (isPublic) {
    if (request.nextUrl.searchParams.get('expired') === '1') return clearSession(request);
    if (hasSession) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/vibe/:path*',
    '/api/vault-bridge/:path*',
    '/protected-media/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
