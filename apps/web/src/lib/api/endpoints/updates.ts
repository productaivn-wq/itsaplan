import pkg from '../../../../../../package.json';

export interface Release {
  version: string;
  releaseDate: string;
  summary: string;
  changes: string[];
  minAppVersion?: string;
  urgent?: boolean;
}

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  checkedAt: string | null;
  releases: Release[];
}

export interface BackupInfo {
  path: string;
  sizeBytes: number;
  createdAt: string;
  expiresAt: string;
  migrations: string[];
}

export interface TeamsMigrationReport {
  version: number;
  teams: { name: string; projects: { key: string; name: string }[] }[];
  renamed: Record<string, { from: string; to: string }[]>;
  merged: { roles: number; agentTools: number };
  movedInvites: number;
  droppedNotificationSettings: string[];
}

export interface WhatsNew {
  version: string;
  pending: boolean;
  releases: Release[];
  backup: BackupInfo | null;
  migration: TeamsMigrationReport | null;
}

export const ACCORD_VERSION = pkg.version;

export const ACCORD_RELEASES: Release[] = [
  {
    version: pkg.version,
    releaseDate: '2026-11-23',
    summary: 'Open Office Small-Screen Right Inspector Drawer & Dynamic Version Binding',
    changes: [
      'Converted the Open Office agent/department inspector sidebar into a right-hand slide-over Sheet drawer on viewports below 1280px (< xl)',
      'Bound ACCORD_VERSION directly to the workspace package manifest so the sidebar footer and update status always display the live release version',
    ],
  },
  {
    version: '3.3.22',
    releaseDate: '2026-11-04',
    summary: 'ACCORD Sovereign Agentic OS Localization & Dependency Integrity Hardening',
    changes: [
      'Dynamic single-source-of-truth version binding from workspace package manifest',
      'Full Vietnamese UI localization eliminating mixed-language fallback strings across shell and navigation',
      'Localized Secret Vault sidebar navigation and resilient API connectivity diagnostics',
    ],
  },
  {
    version: '3.3.14',
    releaseDate: '2026-10-22',
    summary: 'ACCORD Sovereign Brand System, Timeline Hub & Task Inbox Routing',
    changes: [
      'Replaced legacy logo suite with ACCORD Sovereign Isometric Monolith and Milled Carbon & Swiss Vellum tokens',
      'Unified Timeline Hub consolidating Board, Gantt, and Workload views under 7-Horizon architecture',
      'Browser tab SVG data URI favicon enforcement, Next.js dev indicator suppression, and automated Task Management Inbox intake',
    ],
  },
  {
    version: '3.3.13',
    releaseDate: '2026-10-18',
    summary: 'Deterministic Governance & Three-Node Quality Gates (P=1)',
    changes: [
      '12-Layer Enterprise Agentic AI Architecture parity across 32 centralized skills',
      'Automated Separation of Duties (GW-SOD-01) and Canonical Authorization Matrix enforcement',
    ],
  },
  {
    version: '3.3.12',
    releaseDate: '2026-10-15',
    summary: 'Epistemic Substrate & Traceability Graph Hardening',
    changes: [
      'Dual-persist SQLite and PostgreSQL task/issue synchronization',
      'Dynamic Regression Harness with headless Playwright visual proof verification',
    ],
  },
  {
    version: '3.3.0',
    releaseDate: '2026-10-01',
    summary: 'ACCORD Sovereign Agentic OS Baseline',
    changes: [
      'Three-Node Socio-Technical System (HUM Intent, DET P=1 Enforcement, AGT Bounded Autonomy)',
      'Customer-First Seven-Horizon (7H) portfolio and sprint governance',
    ],
  },
];

export const getAppVersion = async () => ({ version: ACCORD_VERSION });

export const getUpdateStatus = async (): Promise<UpdateStatus> => ({
  currentVersion: ACCORD_VERSION,
  latestVersion: ACCORD_VERSION,
  updateAvailable: false,
  checkedAt: new Date().toISOString(),
  releases: ACCORD_RELEASES,
});

export const checkForUpdates = getUpdateStatus;

export const getWhatsNew = async (): Promise<WhatsNew> => ({
  version: ACCORD_VERSION,
  pending: false,
  releases: ACCORD_RELEASES,
  backup: null,
  migration: null,
});

export const markWhatsNewSeen = async () => ({ version: ACCORD_VERSION });
