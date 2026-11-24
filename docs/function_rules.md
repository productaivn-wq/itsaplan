# Function Rules Catalog

## FR Catalog

| ID | Rule Description | Type | UC | Priority |
| :--- | :--- | :--- | :--- | :--- |
| FR-001 | Project key must consist of uppercase alphanumeric characters, be unique per team (`UNIQUE(team_id, key)`), and immutable after creation. | Validation | UC-001 | High |
| FR-002 | Each project must atomically increment next_sequence per created issue, guaranteeing contiguous sequence numbering. | Stateful | UC-001 | High |
| FR-003 | Disabling a project feature flag (e.g., initiativesEnabled) must hide UI elements and reject corresponding API endpoints with 403 without deleting database rows. | Validation | UC-001 | Medium |
| FR-004 | Non-owner project members must be evaluated strictly against team_role permissions for the requested resource and CRUD action. | Auth | UC-001 | High |
| FR-005 | Project members with role owner must bypass all role permission checks and have unrestricted access to project settings. | Auth | UC-001 | High |
| FR-006 | Each project must maintain at least one column for each required state_type: backlog, unstarted, started, completed, canceled. | Validation | UC-001 | High |
| FR-007 | When wip_mode = 'hard', the API must reject any issue transition into a column whose active issue count equals or exceeds wip_limit. | Numeric/Limit | UC-001 | Medium |
| FR-008 | When wip_mode = 'soft', issue transitions exceeding wip_limit must succeed but surface a warning payload to the client. | Validation | UC-001 | Medium |
| FR-009 | Entering a column with configured auto_assign_user_id must automatically overwrite the issue's assigneeUserId. | Stateful | UC-001 | Medium |
| FR-010 | An issue may have at most one parent (parentId), and an issue that is already a subtask cannot become a parent with depth limit = 1. | Validation | UC-002 | High |
| FR-011 | estimatePoints and estimateMinutes must be non-negative numeric values greater than or equal to 0. | Numeric/Limit | UC-002 | Medium |
| FR-012 | Transitioning an issue across columns must automatically close the current issue_status duration record and create a new open record. | Stateful | UC-002 | Medium |
| FR-013 | Every update to an issue (title, description, assignee, column, estimate) must generate an immutable issue_activity record with kind = 'activity'. | Stateful | UC-002 | Medium |
| FR-014 | When user_preference autoWatch is true, the user must automatically be added as an issue_watcher upon creating, editing, commenting, or being assigned. | Stateful | UC-002 | Low |
| FR-015 | Every issue_worklog entry must have minutes greater than 0 and a valid spentOn date. | Numeric/Limit | UC-002 | High |
| FR-016 | An issue's checklist items must maintain distinct fractional positions and allow toggling done state independently. | Stateful | UC-002 | Medium |
| FR-017 | The remaining time of an issue must be dynamically derived as estimateMinutes minus sum of issue_worklog minutes. | Numeric/Limit | UC-002 | Medium |
| FR-018 | All LLM and integration credential secrets must be encrypted at rest using AES-256-GCM ciphertext, iv, and auth_tag. | Validation | UC-003 | High |
| FR-019 | External runner claims must set an exclusive lease window on agent_run; unrenewed leases must reset to pending state upon expiry. | Stateful | UC-003 | High |
| FR-020 | Invoking an MCP tool via POST /mcp must enforce the caller's project membership role and verify project mcp_enabled = true. | Auth | UC-003 | High |
| FR-021 | Incremental AG-UI delta events emitted by runners must be appended to agent_chat_event to enable live reconnects. | Stateful | UC-003 | Medium |
| FR-022 | Mutations to project entities must bump the corresponding revision rev bigint counter via PostgreSQL database triggers. | Stateful | UC-004 | High |
| FR-023 | Outgoing webhook HTTP POST dispatches must compute and include an HMAC-SHA256 signature in the request headers using the webhook secret. | Validation | UC-004 | High |
| FR-024 | Webhooks failing repeatedly must back off exponentially and auto-disable isActive = false upon exceeding consecutive failure limits. | Numeric/Limit | UC-004 | Medium |
| FR-025 | Cycles within a project must not have overlapping startDate and endDate windows, guaranteeing at most one active cycle at any given time. | Validation | UC-005 | High |
| FR-026 | Finishing a cycle early or closing it must allow transferring incomplete issues to the next upcoming cycle or backlog atomically. | Stateful | UC-005 | Medium |
| FR-027 | Initiative completion metrics must roll up child issue status types completed vs total in real time. | Numeric/Limit | UC-005 | Medium |
| FR-028 | Document updates must provide matching version numbers; stale writes must be rejected with HTTP 409 Conflict. | Stateful | UC-006 | High |
| FR-029 | Every successful document write must create an immutable version snapshot in project_document_revision via database trigger. | Stateful | UC-006 | High |
| FR-030 | Documents with isPrivate = true must only be queryable and accessible by their creator/owner ownerUserId. | Auth | UC-006 | High |

## Non-Functional Requirements

| ID | Rule Description | Type | UC | Priority |
| :--- | :--- | :--- | :--- | :--- |
| NFR-001 | Headless execution invariant: all background processes must execute with no visible window popups or stealing focus. | Headless | UC-003 | Critical |
| NFR-002 | Realtime streaming: log updates and AG-UI events must stream unbuffered in real time. | Streaming | UC-004 | High |
| NFR-003 | Database multi-replica concurrency: FOR UPDATE SKIP LOCKED on queues to avoid worker race conditions. | Concurrency | UC-003 | High |


## Extended Function Rules (`FR-031` .. `FR-048`)
- **`RULE-FR-031`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-031`.
- **`RULE-FR-032`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-032`.
- **`RULE-FR-033`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-033`.
- **`RULE-FR-034`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-034`.
- **`RULE-FR-035`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-035`.
- **`RULE-FR-036`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-036`.
- **`RULE-FR-037`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-037`.
- **`RULE-FR-038`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-038`.
- **`RULE-FR-039`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-039`.
- **`RULE-FR-040`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-040`.
- **`RULE-FR-041`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-041`.
- **`RULE-FR-042`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-042`.
- **`RULE-FR-043`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-043`.
- **`RULE-FR-044`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-044`.
- **`RULE-FR-045`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-045`.
- **`RULE-FR-046`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-046`.
- **`RULE-FR-047`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-047`.
- **`RULE-FR-048`**: Enforce schema validation, UTF-8 NFC normalization, and `<150ms` response budget for `FR-048`.

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
## Business & UI Governance Rules `BR-061..BR-064` (`SPEC-53.ACT.505`)
- `BR-061` (`RULE-ZERO-DUPLICATION-SURFACE`): Each entity group (8 Rooms, 6 Agents, Project Filter, Primary CTA) appears once per viewport container.
- `BR-062` (`GW-JTBD-FRICTION-01`): Core JTBDs require `<= 2` clicks (`< 3` steps) and `0px` desktop window scroll.
- `BR-063` (`GW-TIER2-NO-DELETE`): External Sovereign Harness agents (`@antigravity..@qualitygate`) hold `0` `delete_*` destructive permissions.
- `BR-064` (`SPEC-TYPOGRAPHY-001`): `0` arbitrary `text-[Npx]` Tailwind classes; optical canvas font `>= 11.0px` and nametag height `<= 34px`.
