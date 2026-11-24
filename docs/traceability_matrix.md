# Requirements Traceability Matrix (ITSAPLAN v3.3.22 — FR-001..FR-076)

- **Coverage**: `FR-001` through `FR-076` across `UC-001..UC-018` (`261` declarative test cases, `100%` line-verified source pointers).

| Domain | Use Case | FR Range | Production Source Symbol & Verified Line | Test Suite / TC Reference |
| :--- | :--- | :--- | :--- | :--- |
| **CAP-PRJ** | `UC-001` | `FR-001..FR-009` | [`projects/service.ts#L455`](apps/api/src/modules/projects/service.ts#L455) (`createProject`), [`columns/service.ts#L86`](apps/api/src/modules/columns/service.ts#L86) (`409 WIP_LIMIT_EXCEEDED`) | `TC-UC-001_data.json` (`25` TCs) |
| **CAP-ISS** | `UC-002` | `FR-010..FR-017` | [`issues/service.ts#L792`](apps/api/src/modules/issues/service.ts#L792) (`assertParent`), [`issues/service.ts#L866`](apps/api/src/modules/issues/service.ts#L866) (`nextSequence`), [`subtasks.ts#L52`](apps/api/src/modules/issues/subtasks.ts#L52), [`worklogs.ts#L70`](apps/api/src/modules/issues/worklogs.ts#L70) | `TC-UC-002_data.json` (`23` TCs) |
| **CAP-MCP** | `UC-003` | `FR-018..FR-021` | [`mcp/mount.ts#L1`](apps/api/src/mcp/mount.ts#L1), [`packages/runner/src/cli.ts#L1`](packages/runner/src/cli.ts#L1) | `TC-UC-003_data.json` (`14` TCs) |
| **CAP-SYN** | `UC-004` | `FR-022..FR-024` | [`sync/index.ts#L18`](apps/api/src/modules/sync/index.ts#L18), [`sync/service.ts#L19`](apps/api/src/modules/sync/service.ts#L19), [`syncContext.tsx#L22`](apps/web/src/context/syncContext.tsx#L22) | `TC-UC-004_data.json` (`12` TCs) |
| **CAP-CYC** | `UC-005` | `FR-025..FR-027` | [`cycles/service.ts#L11`](apps/api/src/modules/cycles/service.ts#L11) (`CycleStatus`) | `TC-UC-005_data.json` (`13` TCs) |
| **CAP-DOC** | `UC-006..007` | `FR-028..FR-036` | [`documents/service.ts#L125`](apps/api/src/modules/documents/service.ts#L125) (`documentAccess`) | `TC-UC-006/007` (`24` TCs) |
| **CAP-H7** | `UC-008..009` | `FR-037..FR-050` | [`TimelineView.tsx#L1`](apps/web/src/features/work-items/components/timeline/TimelineView.tsx#L1) | `TC-UC-008/009` (`26` TCs) |
| **CAP-OO** | `UC-010..016` | `FR-051..FR-068` | [`OpenOfficeWorkspaceView.tsx#L1`](apps/web/src/features/vibe-canvas/components/OpenOfficeWorkspaceView.tsx#L1) | `TC-UC-010..016` (`100` TCs) |
| **CAP-505** | `SPEC-53.ACT.505` | `FR-069..FR-074` | [`OpenOfficeGovernancePanel.tsx#L1`](apps/web/src/features/vibe-canvas/open-office/OpenOfficeGovernancePanel.tsx#L1), [`SovereignHitlQuickDrawer.tsx#L1`](apps/web/src/features/vibe-canvas/open-office/SovereignHitlQuickDrawer.tsx#L1) | `OpenOfficeWorkspaceView.test.tsx` |
| **CAP-HLT** | `UC-017..018` | `FR-075..FR-076` | [`launch_itsaplan_headless.py#L66`](scripts/launch_itsaplan_headless.py#L66) (`_prewarm_itsaplan_routes`), `#L95` (`cleanup_lock`), `#L113` (`ensure_single_instance`), `#L159` (`ensure_postgres_running`), `#L197` (`probe_http`), `#L213` (`is_bridge_running`), `#L224` (`get_bun_executable`), `#L310` (`is_bun_dev_running`), `#L349` (`launch_bun_dev`), `#L446` (`launch_bridge_daemon`), `#L476` (`ensure_vault_server_running`), `#L505` (`run_cycle`) | `TC-UC-017/018` (`24` TCs) |

<!-- AST-GEN:POST592-TRACE:START -->
## Post-`53.ACT.592` Route & Component Lineage (`53.ACT.633`)

| Surface / Module | Route / File | WBS / UC Ref | Spec / Test Ref |
| :--- | :--- | :--- | :--- |
| Team Org Chart | `/[teamRef]/settings/org-chart` (`OrgTeamsBody`, `TeamOrgChartSection`, `OrgChartInspectorDrawer`) | `1.6.2.2` / `UC-017` | `IAD-ITSAPLAN.md`, `TC-UC-017` |
| Beehive & LimeZu Atlas | `BeehiveColonyLens`, `pixelBeehiveEngine`, `limezuAtlasEngine` | `1.4.5` / `UC-010` | `UC-010`, `TC-UC-010_data.json` |
| Global Command & Copilot | `WorkDeliverySubBar`, `OpenOfficeCommandPalette`, `WeKnoraCopilotDock`, `ChatPanel` | `2.2.2` / `UC-003` | `IAD-ITSAPLAN.md`, `TC-53.ACT.627` |
| Next.js BFF Routes (`7/7`) | `api/vault-bridge`, `api/aos/onboarding`, `api/vibe/*`, `media/*`, `protected-media/*` | `1.3`, `1.4`, `1.6` | `function_list.md`, `UC-010` |
<!-- AST-GEN:POST592-TRACE:END -->
