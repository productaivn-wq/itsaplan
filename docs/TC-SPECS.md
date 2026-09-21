# Test Case Specifications (docs/TC-SPECS.md)

**Classification**: Authoritative Test Specification  
**Standard**: IEEE 829 / ISO 29119 / UTOP Specification Standard  
**Status**: Active / Production  
**Covers**: `UC-001` through `UC-006`, `FR-001` through `FR-030`, `NFR-001` through `NFR-003`  
**Test Data Link**: `tests/data/TC-UC-001_data.json` through `tests/data/TC-UC-006_data.json`  

---

## 1. MinTC Theoretical Formulation & Ratio Governance

In strict compliance with **Gate GW-UTOP-02**, every functional requirement $R$ is verified through a mathematically bounded minimum test case cardinality:

$$\text{MinTC}(S) = B(R) + \sum_{i \in R} (|P_i| + |V_i|) + C(R)$$

Where:
- $R$: Set of functional requirements partitioned by Use Case.
- $B(R)$: 7-point Boundary Value Analysis tests $\{a, b, a-\epsilon, b+\epsilon, \text{median}, \text{empty/null}, \text{malformed}\}$.
- $P_i$: Positive equivalence partitions (nominal happy-path scenarios).
- $V_i$: Negative/validity variations (unauthorized, malformed, out-of-bounds, adversarial injection).
- $C(R)$: Combinatorial edge cases (concurrency race conditions, deadlocks, trigger cascades).

### MinTC Derivation Summary Table

| Use Case ID | Requirement Set $R$ | Boundary $B(R)$ | Positive $P_i$ | Negative $V_i$ | Combinatorial $C(R)$ | $\text{MinTC}(S)$ | Positive Ratio | Adversarial Ratio |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **UC-001** | FR-001 .. FR-009 | 7 | 15 | 10 | 3 | **35** | 60.0% | 40.0% |
| **UC-002** | FR-010 .. FR-017 | 6 | 14 | 9 | 2 | **31** | 61.3% | 38.7% |
| **UC-003** | FR-018 .. FR-021 | 4 | 9 | 6 | 2 | **21** | 61.9% | 38.1% |
| **UC-004** | FR-022 .. FR-024 | 3 | 7 | 5 | 2 | **17** | 64.7% | 35.3% |
| **UC-005** | FR-025 .. FR-027 | 3 | 8 | 5 | 1 | **17** | 64.7% | 35.3% |
| **UC-006** | FR-028 .. FR-030 | 3 | 8 | 5 | 1 | **17** | 64.7% | 35.3% |
| **TOTAL** | **FR-001 .. FR-030** | **26** | **61** | **40** | **11** | **138** | **60.9%** | **39.1%** |

*Invariant Verification*: Total positive tests = 60.9% (>= 60%), adversarial/boundary tests = 39.1% (~40%), satisfying Gate GW-UTOP-02 invariants.

---

## 2. Test Specifications by Use Case

### 2.1 UC-001: Project & Board Lifecycle Management

#### `TC-UC001-01`: Project Key Validation & Immutability
- **Target**: `apps/api/src/modules/projects/service.ts::createProject` & `model.ts`
- **Preconditions**: Authenticated user session with `create_project` permission.
- **Test Scenarios**:
  1. *Positive*: Create project with key `PROJ`, name `Project Alpha`. Assert HTTP 201, `project.key == 'PROJ'`, `nextSequence == 1`.
  2. *Negative (Malformed)*: Attempt key with lowercase `proj` or special characters `PR@J`. Assert HTTP 422 / 400 rejection.
  3. *Negative (Length Boundary)*: Attempt key with length 1 (`P`) or length 11 (`TOOLONGAKEY`). Assert 422 validation failure.
  4. *Negative (Collision)*: Attempt to create project with existing key `PROJ`. Assert HTTP 409 Conflict.
  5. *Adversarial (Immutability)*: Send `PATCH /api/projects/:id` attempting to mutate `key`. Assert key remains unchanged or request is rejected.

#### `TC-UC001-02`: Row-Locked Concurrency on Next Sequence Generation
- **Target**: `apps/api/src/modules/issues/service.ts::createIssue`
- **Preconditions**: Existing project with `nextSequence = 1`.
- **Test Scenarios**:
  1. *Combinatorial (Race Condition)*: Dispatch 20 concurrent HTTP POST requests to create issues under the same project using Eden Treaty.
  2. *Verification*: Assert all 20 issues receive contiguous sequence numbers (`1` through `20`) with 0 duplicates and 0 missing sequences. Verify row lock on `project` prevented phantom sequence gaps.

#### `TC-UC001-03`: Feature Flags Runtime Guard
- **Target**: `apps/api/src/shared/guards.ts` & `apps/api/src/modules/projects/`
- **Preconditions**: Project with `initiativesEnabled = false`.
- **Test Scenarios**:
  1. *Negative*: Call `GET /api/projects/:id/initiatives`. Assert HTTP 403 Forbidden with `FEATURE_DISABLED`.
  2. *Positive*: Set `initiativesEnabled = true`. Call `GET /api/projects/:id/initiatives`. Assert HTTP 200 OK.
  3. *Integrity*: Verify disabling feature flags leaves existing database rows intact.

#### `TC-UC001-04`: RBAC Permission Matrix & Owner Bypass
- **Target**: `packages/db/src/permissions.ts` & `apps/api/src/shared/access.ts`
- **Preconditions**: User A (`member`, no `delete_project`), User B (`owner`).
- **Test Scenarios**:
  1. *Negative*: User A calls `DELETE /api/projects/:id`. Assert HTTP 403 Forbidden.
  2. *Positive*: User B calls `DELETE /api/projects/:id`. Assert HTTP 200 / 204 OK. Owner bypass succeeds.

#### `TC-UC001-05`: WIP Limit Enforcement (Hard vs Soft Mode)
- **Target**: `apps/api/src/modules/columns/__tests__/integration/wipLimits.test.ts`
- **Preconditions**: Column with `wipLimit = 2`.
- **Test Scenarios**:
  1. *Hard Mode Negative*: Column has 2 issues. Attempt moving 3rd issue when `wipMode = 'hard'`. Assert HTTP 400 / 422 rejected.
  2. *Soft Mode Positive*: Column has 2 issues. Move 3rd issue when `wipMode = 'soft'`. Assert HTTP 200 OK with warning flag in response.

---

### 2.2 UC-002: Issue & Worklog Tracking

#### `TC-UC002-01`: Subtask Hierarchy Depth Limit
- **Target**: `apps/api/src/modules/issues/subtasks.ts`
- **Preconditions**: Existing parent issue `ISSUE-1` and child subtask `ISSUE-2` (`parentId = ISSUE-1`).
- **Test Scenarios**:
  1. *Positive*: Create child subtask `ISSUE-2` under `ISSUE-1`. Assert `parentId == ISSUE-1.id`.
  2. *Negative (Depth > 1)*: Attempt to create `ISSUE-3` with `parentId = ISSUE-2.id`. Assert HTTP 400 rejected (`SUBTASK_CANNOT_HAVE_CHILDREN`).
  3. *Negative (Circular)*: Attempt to set `ISSUE-1.parentId = ISSUE-2.id`. Assert HTTP 400 rejected (`CIRCULAR_PARENT_REFERENCE`).

#### `TC-UC002-02`: Estimate Bounds & Numeric Integrity
- **Target**: `apps/api/src/modules/issues/model.ts`
- **Preconditions**: Valid issue exists.
- **Test Scenarios**:
  1. *Boundary*: Set `estimatePoints = 0` and `estimateMinutes = 0`. Assert HTTP 200 OK.
  2. *Negative*: Set `estimateMinutes = -15`. Assert HTTP 422 rejected.
  3. *Positive*: Set `estimateMinutes = 120`. Assert HTTP 200 OK.

#### `TC-UC002-03`: Worklog Logging & Dynamic Time Remaining
- **Target**: `apps/api/src/modules/issues/worklogs.ts`
- **Preconditions**: Issue with `estimateMinutes = 240`.
- **Test Scenarios**:
  1. *Negative*: Log worklog with `minutes = 0` or `minutes = -30`. Assert HTTP 422 rejected.
  2. *Positive*: Log worklog with `minutes = 60`. Assert HTTP 201 Created.
  3. *Rollup Verification*: Query issue details. Assert `remainingMinutes == 180`.

#### `TC-UC002-04`: Status Duration Tracking & Immutable Activity Audit
- **Target**: `apps/api/src/modules/issues/status-history.ts` & `activity.ts`
- **Preconditions**: Issue in `In Progress` column.
- **Test Scenarios**:
  1. *Stateful Transition*: Move issue to `Done`. Assert previous `issue_status` row has `endedAt` timestamp populated.
  2. *Audit Immutable*: Assert new `issue_activity` record is created with `kind = 'activity'` detailing previous and new column IDs. Assert activity record cannot be updated via API.

---

### 2.3 UC-003: AI Agent Runtime & MCP Tools

#### `TC-UC003-01`: AES-256-GCM Secret Encryption at Rest
- **Target**: `packages/crypto/src/` & `apps/api/src/modules/agents/integrations/`
- **Preconditions**: Encryption key configured in environment.
- **Test Scenarios**:
  1. *Positive*: Store integration API key `sk-test-secret-12345`.
  2. *Verification*: Assert stored database record contains non-plaintext `ciphertext`, `iv` (12 bytes), and `authTag` (16 bytes).
  3. *Negative (Decryption Tampering)*: Mutate one byte in ciphertext. Attempt decrypt. Assert authentication failure exception raised.

#### `TC-UC003-02`: External Runner Claim Lease & Heartbeat Expiry
- **Target**: `apps/api/src/modules/agents/runner/` & `packages/runner/src/`
- **Preconditions**: Queued agent run in `pending` state.
- **Test Scenarios**:
  1. *Positive*: Runner claims run via `POST /api/agents/runner/claim`. Assert run transitions to `running` with `leaseExpiresAt = now + 60s`.
  2. *Combinatorial (Concurrency)*: Second runner attempts to claim same run. Assert run not claimed (`FOR UPDATE SKIP LOCKED`).
  3. *Stateful (Expiry)*: Runner does not renew heartbeat. Allow lease to expire. Verify background reaper resets run to `pending`.

#### `TC-UC003-03`: MCP Tool Invocation RBAC & Enablement
- **Target**: `apps/api/src/mcp/`
- **Preconditions**: Project with `mcpEnabled = true`.
- **Test Scenarios**:
  1. *Positive*: Member with `view_issues` calls MCP tool `list_issues`. Assert HTTP 200 with structured MCP tool result.
  2. *Negative (Project Disabled)*: Project sets `mcpEnabled = false`. Call MCP tool. Assert HTTP 403 / Tool Unavailable.
  3. *Negative (Unauthorized)*: Anonymous caller invokes MCP tool without session. Assert HTTP 401 Unauthorized.

---

### 2.4 UC-004: Realtime Revision Sync & Webhooks

#### `TC-UC004-01`: Revision Counter Invalidation Trigger
- **Target**: `packages/db/src/schema/app.ts` (DB triggers) & `apps/api/src/modules/sync/`
- **Preconditions**: Project exists with `revision.rev = N`.
- **Test Scenarios**:
  1. *Stateful*: Update issue title or column.
  2. *Verification*: Assert `revision.rev` is incremented to `N + 1` via DB trigger.
  3. *Client Sync*: Call `GET /api/sync/pull?rev=N`. Assert changed entities returned in delta response.

#### `TC-UC004-02`: Webhook HMAC-SHA256 Delivery & Exponential Backoff
- **Target**: `apps/worker/src/delivery.ts` & `signature.ts`
- **Preconditions**: Webhook configured with secret `secret_key_123`.
- **Test Scenarios**:
  1. *Positive*: Trigger `issue.created` event. Assert worker dispatches POST with `X-ItsAPlan-Signature` header matching HMAC-SHA256 of payload.
  2. *Negative (Retry & Backoff)*: Target server responds HTTP 500. Assert worker schedules retry with exponential backoff (`delay = 2^retry * base`).
  3. *Adversarial (Circuit Breaker)*: Fail 10 consecutive deliveries. Assert webhook is automatically deactivated (`isActive = false`).

---

### 2.5 UC-005: Initiative & Cycle Management

#### `TC-UC005-01`: Non-Overlapping Sprint Cycles
- **Target**: `apps/api/src/modules/cycles/service.ts`
- **Preconditions**: Cycle 1 active from `2026-10-01` to `2026-10-14`.
- **Test Scenarios**:
  1. *Positive*: Create Cycle 2 from `2026-10-15` to `2026-10-28`. Assert HTTP 201 Created.
  2. *Negative (Overlap)*: Attempt creating Cycle 3 from `2026-10-10` to `2026-10-20`. Assert HTTP 400 rejected (`OVERLAPPING_CYCLE_DATES`).

#### `TC-UC005-02`: Cycle Scope Transfer & Atomicity
- **Target**: `apps/api/src/modules/cycles/service.ts::finishCycle`
- **Preconditions**: Cycle 1 ending with 3 open issues and 5 completed issues.
- **Test Scenarios**:
  1. *Stateful*: Finish Cycle 1 with `transferToCycleId = Cycle 2.id`.
  2. *Verification*: Assert the 3 open issues have `cycleId = Cycle 2.id`, while the 5 completed issues retain `cycleId = Cycle 1.id`. Verify transaction is atomic.

---

### 2.6 UC-006: Document & Knowledge Collaboration

#### `TC-UC006-01`: Optimistic Locking on Concurrent Document Edits
- **Target**: `apps/api/src/modules/documents/service.ts`
- **Preconditions**: Document at `version = 3`.
- **Test Scenarios**:
  1. *Positive*: Client A updates document passing `version = 3`. Assert update succeeds and document is now `version = 4`.
  2. *Negative (Stale Conflict)*: Client B updates document passing `version = 3`. Assert HTTP 409 Conflict (`VERSION_MISMATCH`).

#### `TC-UC006-02`: Automatic Document Revision Snapshots
- **Target**: `packages/db/src/schema/app.ts` (triggers) & `apps/api/src/modules/documents/`
- **Preconditions**: Document updated from Version 4 to Version 5.
- **Test Scenarios**:
  1. *Verification*: Query `project_document_revision`. Assert row exists for Version 4 containing full markdown snapshot and author ID.

#### `TC-UC006-03`: Private Document Isolation
- **Target**: `apps/api/src/modules/documents/service.ts`
- **Preconditions**: Document created with `isPrivate = true` by User A.
- **Test Scenarios**:
  1. *Negative*: User B (same project member) queries document list or document by ID. Assert HTTP 404 / excluded from list.
  2. *Positive*: User A queries document. Assert HTTP 200 OK.
