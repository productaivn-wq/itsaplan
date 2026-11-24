import { useParams } from 'next/navigation';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { parseIssueIdentifier, projectRefOf } from '@/utils/paths';

export type ShellRoute = {
  // The routed project's ref, "<teamRef>.<key>" — what the API takes as {projectKey}.
  projectKey: string | null;
  // The segment after the project key: 'view', 'settings', 'issue', 'members', …
  // null on the project root.
  sub: string | null;
  activeViewId: number | null;
  section: string | null;
  // The /agents/:section segment, which the header names (see ShellHeaderTitle).
  aiTeamSection: string | null;
  // The project-scoped issue number from the URL, not the internal id.
  routeIssueSeq: number | null;
  routeInitiativeId: number | null;
  routeCycleId: number | null;
  // The work items routes, where the layout and selection commands apply.
  onBoard: boolean;
};

const NON_PROJECT_PREFIXES = new Set([
  'account',
  'api',
  '_next',
  'share',
  'invite',
  'god',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'onboarding',
]);

const numericSegment = (value: string | undefined) =>
  value && /^\d+$/.test(value) ? Number(value) : null;

const safeDecodeSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// The parts of the current route the Shell renders from. The open view, settings
// section and issue live in deeper segments than this layout, so they are read
// from the pathname rather than useParams. An issue is routed under its team
// (/acme/issue/MKT-42), so its project comes from the identifier.
export function useShellRoute(): ShellRoute {
  const params = useParams<{ teamRef?: string; projectKey?: string; identifier?: string }>();
  const pathname = useInstantPathname();
  const segs = pathname.split('/').filter(Boolean); // [team, key, sub?, id?, tab?]

  const hasSegProject =
    segs.length >= 2 &&
    segs[1] !== 'issue' &&
    segs[1] !== 'settings' &&
    !NON_PROJECT_PREFIXES.has(segs[0]!);

  const isSegIssue =
    segs.length >= 3 &&
    segs[1] === 'issue' &&
    !NON_PROJECT_PREFIXES.has(segs[0]!);

  const teamRef = hasSegProject || isSegIssue
    ? safeDecodeSegment(segs[0]!)
    : params.teamRef
      ? safeDecodeSegment(params.teamRef)
      : null;

  const issueIdentifier = isSegIssue
    ? safeDecodeSegment(segs[2]!)
    : !hasSegProject && params.identifier
      ? safeDecodeSegment(params.identifier)
      : null;

  const issue = issueIdentifier ? parseIssueIdentifier(issueIdentifier) : null;
  const key = hasSegProject
    ? safeDecodeSegment(segs[1]!)
    : (issue?.key ?? (params.projectKey ? safeDecodeSegment(params.projectKey) : null));
  const projectKey = teamRef && key ? projectRefOf(teamRef, key) : null;

  const sub = issue ? 'issue' : (segs[2] ?? null);

  return {
    projectKey,
    sub,
    activeViewId: sub === 'view' ? numericSegment(segs[3]) : null,
    section: sub === 'settings' ? (segs[3] ?? null) : null,
    aiTeamSection: sub === 'agents' ? (segs[3] ?? null) : null,
    routeIssueSeq: issue?.sequenceNumber ?? null,
    // The segment after 'initiatives' / 'cycles' is a list tab when it is a word
    // and a record when it is a number.
    routeInitiativeId: sub === 'initiatives' ? numericSegment(segs[3]) : null,
    routeCycleId: sub === 'cycles' ? numericSegment(segs[3]) : null,
    onBoard: sub == null || sub === 'view',
  };
}
