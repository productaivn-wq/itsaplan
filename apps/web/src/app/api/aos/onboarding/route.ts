import { NextRequest, NextResponse } from 'next/server';
import { hasStructurallyValidSessionCookie } from '@/lib/security/hostBridgeGuard';

export type TenantOnboardingStep = 'workspace' | 'provider' | 'agent' | 'completed';

interface TenantOnboardingPayload {
  action?: 'status' | 'complete' | 'configure_workspace';
  teamName?: string;
  projectKey?: string;
  provider?: string;
  defaultAgentKind?: 'internal' | 'external';
}

function requireSession(req: NextRequest): NextResponse | null {
  if (hasStructurallyValidSessionCookie(req)) return null;
  return NextResponse.json(
    { error: 'Authentication required', code: 'UNAUTHORIZED' },
    { status: 401 },
  );
}

export async function GET(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;
  return NextResponse.json({
    status: 'READY',
    mode: 'cloud_saas_tenant',
    cliRequired: false,
    defaultAgentKind: 'internal',
    onboardingCompleted: false,
  });
}

export async function POST(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;

  let body: TenantOnboardingPayload = {};
  try {
    body = (await req.json()) as TenantOnboardingPayload;
  } catch {
    body = {};
  }

  const action = body.action || 'status';
  if (action === 'complete') {
    return NextResponse.json({
      status: 'COMPLETED',
      mode: 'cloud_saas_tenant',
      cliRequired: false,
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
    });
  }

  if (action === 'configure_workspace') {
    const teamName = (body.teamName || '').trim() || 'Default Team';
    const projectKey = (body.projectKey || 'MAIN').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'MAIN';
    return NextResponse.json({
      status: 'CONFIGURED',
      mode: 'cloud_saas_tenant',
      cliRequired: false,
      teamName,
      projectKey,
      provider: body.provider || 'openai',
      defaultAgentKind: body.defaultAgentKind || 'internal',
      configuredAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    status: 'READY',
    mode: 'cloud_saas_tenant',
    cliRequired: false,
    defaultAgentKind: 'internal',
  });
}
