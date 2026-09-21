# Functional Requirements Catalog (FR-001 to FR-030)

| FR ID | Rule Type | Capability / Domain | Description & Verification Invariant | Traced Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Validation | Project Provisioning | Project `key` must consist of uppercase alphanumeric characters, be globally unique, and immutable after creation. | `UC-001` |
| **FR-002** | Stateful | Sequence Generation | Each project must atomically increment `next_sequence` per created issue, guaranteeing contiguous sequence numbering. | `UC-001`, `UC-002` |
| **FR-003** | Business Logic | Feature Flags | Disabling a project feature flag (e.g., `initiativesEnabled`) must hide UI elements and reject corresponding API endpoints (HTTP 403) without deleting database rows. | `UC-001` |
| **FR-004** | Authorization | RBAC Matrix | Non-owner project members must be evaluated strictly against `team_role.permissions` for the requested resource and CRUD action. | `UC-001` |
| **FR-005** | Authorization | Owner Bypass | Project members with role `owner` must bypass all role permission checks and have unrestricted access to project settings. | `UC-001` |
| **FR-006** | Validation | Workflow Columns | Each project must maintain at least one column for each required `state_type`: `backlog`, `unstarted`, `started`, `completed`, `canceled`. | `UC-001`, `UC-002` |
| **FR-007** | Numeric/Limit | WIP Enforcement (Hard) | When `wip_mode = 'hard'`, the API must reject any issue transition into a column whose active issue count equals or exceeds `wip_limit`. | `UC-001`, `UC-002` |
| **FR-008** | Business Logic | WIP Enforcement (Soft) | When `wip_mode = 'soft'`, issue transitions exceeding `wip_limit` must succeed but surface a warning payload to the client. | `UC-001`, `UC-002` |
| **FR-009** | Stateful | Column Auto-Assign | Entering a column with configured `auto_assign_user_id` must automatically overwrite the issue's `assigneeUserId`. | `UC-001`, `UC-002` |
| **FR-010** | Validation | Subtask Hierarchy | An issue may have at most one parent (`parentId`), and an issue that is already a subtask cannot become a parent (depth limit = 1). | `UC-002` |
| **FR-011** | Numeric/Limit | Estimation Bounds | `estimatePoints` and `estimateMinutes` must be non-negative numeric values (>= 0). | `UC-002` |
| **FR-012** | Stateful | Status History Tracking | Transitioning an issue across columns must automatically close the current `issue_status` duration record and create a new open record. | `UC-002` |
| **FR-013** | Business Logic | Activity Timeline Audit | Every update to an issue (title, description, assignee, column, estimate) must generate an immutable `issue_activity` record (`kind = 'activity'`). | `UC-002` |
| **FR-014** | Business Logic | Auto-Watch Subscription | When `user_preference.autoWatch` is true, the user must automatically be added as an `issue_watcher` upon creating, editing, commenting, or being assigned to an issue. | `UC-002` |
| **FR-015** | Validation | Worklog Integrity | Every `issue_worklog` entry must have `minutes > 0` and a valid `spentOn` date. | `UC-002` |
| **FR-016** | Stateful | Checklist Progress | An issue's checklist items must maintain distinct fractional positions and allow toggling `done` state independently. | `UC-002` |
| **FR-017** | Business Logic | Time Remaining Rollup | The remaining time of an issue must be dynamically derived as `estimateMinutes - sum(issue_worklog.minutes)`. | `UC-002` |
| **FR-018** | Security | Secret Encryption at Rest | All LLM and integration credential secrets must be encrypted at rest using AES-256-GCM (`ciphertext`, `iv`, `auth_tag`). | `UC-003` |
| **FR-019** | Stateful | Agent Runner Lease Protocol | External runner claims must set an exclusive lease window on `agent_run`; unrenewed leases must reset to `pending` upon expiry. | `UC-003` |
| **FR-020** | Authorization | MCP Tool Governance | Invoking an MCP tool via `POST /mcp` must enforce the caller's project membership role and verify `project.mcp_enabled = true`. | `UC-003` |
| **FR-021** | Stateful | Agent Streaming Transcripts | Incremental AG-UI delta events emitted by runners must be appended to `agent_chat_event` to enable live reconnects. | `UC-003` |
| **FR-022** | Stateful | Revision Invalidation | Mutations to project entities must bump the corresponding `revision.rev` bigint counter via PostgreSQL database triggers. | `UC-004` |
| **FR-023** | Security | Webhook HMAC Signatures | Outgoing webhook HTTP POST dispatches must compute and include an HMAC-SHA256 signature in the request headers using the webhook secret. | `UC-004` |
| **FR-024** | Business Logic | Webhook Backoff & Auto-Disable | Webhooks failing repeatedly must back off exponentially and auto-disable (`isActive = false`) upon exceeding consecutive failure limits. | `UC-004` |
| **FR-025** | Validation | Non-Overlapping Cycles | Cycles within a project must not have overlapping `[startDate, endDate]` windows, guaranteeing at most one active cycle at any given time. | `UC-005` |
| **FR-026** | Stateful | Sprint Scope Rollover | Finishing a cycle early or closing it must allow transferring incomplete issues to the next upcoming cycle or backlog atomically. | `UC-005` |
| **FR-027** | Business Logic | Initiative Progress Rollup | Initiative completion metrics must roll up child issue status types (`completed` vs total) in real time. | `UC-005` |
| **FR-028** | Stateful | Document Optimistic Locking | Document updates must provide matching `version` numbers; stale writes must be rejected with HTTP 409 Conflict. | `UC-006` |
| **FR-029** | Stateful | Automatic Document Revisions | Every successful document write must create an immutable version snapshot in `project_document_revision` via database trigger. | `UC-006` |
| **FR-030** | Authorization | Document Privacy Isolation | Documents with `isPrivate = true` must only be queryable and accessible by their creator/owner (`ownerUserId`). | `UC-006` |
| **FR-031** | Stateful | External Bridge CDC Ingestion | Direct database insertions/updates to `itsaplan.issue` from external bridge daemons must satisfy project integrity, column assignment, and `chk_done_proof_and_review` constraints. | `UC-004` |
| **FR-032** | Stateful | Reactive Revision Bus Trigger | External or internal mutations to `issue` rows must atomically fire trigger `bump_revision()`, incrementing `revision.rev` for scope `board:<projectId>` to notify frontend `SyncProvider`. | `UC-004` |
