# UC-007: Vibe Working Canvas Native Merge & Spatial Collaboration

- **Primary Actors**: Project Lead (`Admin`), Engineer (`Member`), AI Copilot (`WeKnoraCopilotDock`)
- **Governance Scope**: `docs/UC-007_vibe_working_canvas_native_merge.md`, `FR-046..FR-076`
- **Key Production Modules**:
  - `apps/web/src/features/vibe-canvas/components/WeKnoraCopilotDock.tsx` (WikiGraph panel, System-1 diagnostics, 5-bucket memory inspector)
  - `apps/web/src/features/vibe-canvas/open-office/BeehiveColonyLens.tsx` (spatial colony swarm lens)
  - `apps/web/src/features/teams/components/OrgTeamsBody.tsx` (organization teams workspace view)
  - `apps/web/src/features/common/GlobalQuickActions.tsx` (global quick creation/navigation modal)

## Main Flow
1. Operator opens `/[teamRef]/[projectKey]/vibe` or invokes `WeKnoraCopilotDock` from any project workspace route.
2. Backend `GET /api/vibe/memory` and `GET /api/vibe/system1` enforce Next.js session gating (`401` on unauthenticated calls via `proxy.ts`).
3. Canvas links resolve strictly to verified Control-Tower and ItsAPlan specification documents (`docs/UC-007_vibe_working_canvas_native_merge.md`, `docs/UC-010_open_office_spatial_telemetry_and_task_contracts.md`, `docs/IAD-ITSAPLAN.md`, `ARCHITECTURE.md`).
4. Postcondition: Instant tab/lens switching (`BeehiveColonyLens`, `OrgTeamsBody`, `GlobalQuickActions`) completes in `<150ms` with Layer-0 compliance `score == 1.00`.
