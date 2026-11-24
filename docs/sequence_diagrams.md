# Architecture Sequence Diagrams (docs/sequence_diagrams.md)

**Classification**: Architecture Specification  
**Standard**: UML 2.5 Sequence Diagrams / UTOP Specification Standard  
**Covers**: `UC-001` through `UC-006`  

---

## 1. UC-001: Project Creation & Sequence Initialization

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Workspace Owner
    participant Web as Next.js Web (SSR)
    participant API as Elysia API (Port 3000)
    participant DB as PostgreSQL (itsaplan)

    Admin->>Web: Submit New Project Form (key='PRD', name='Product Core')
    Web->>API: POST /api/projects { key: 'PRD', name: 'Product Core' }
    Note over API: RBAC Guard: verify admin/owner privilege
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO project (key, name, next_sequence) VALUES ('PRD', 'Product Core', 1)
    API->>DB: INSERT INTO project_column (default backlog, unstarted, started, completed, canceled)
    API->>DB: INSERT INTO project_member (project_id, user_id, role='owner')
    API->>DB: INSERT INTO revision (project_id, rev=1)
    API->>DB: COMMIT
    API-->>Web: HTTP 201 Created { id, key: 'PRD', nextSequence: 1 }
    Web-->>Admin: Redirect to /project/PRD/board
```

---

## 2. UC-002: Issue Creation with Atomic Sequence Locking

```mermaid
sequenceDiagram
    autonumber
    actor Member as Team Member
    participant Web as Next.js Web
    participant API as Elysia API
    participant DB as PostgreSQL

    Member->>Web: Create Issue ("Implement SAML SSO")
    Web->>API: POST /api/projects/PRD/issues { title: "Implement SAML SSO" }
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT next_sequence FROM project WHERE key = 'PRD' FOR UPDATE
    Note over DB: Row lock acquired on project table
    DB-->>API: next_sequence = 42
    API->>DB: INSERT INTO issue (project_id, sequence=42, title, column_id) VALUES (...)
    API->>DB: UPDATE project SET next_sequence = 43 WHERE key = 'PRD'
    API->>DB: INSERT INTO issue_activity (issue_id, kind='created')
    API->>DB: COMMIT
    Note over DB: Row lock released; revision trigger bumps rev counter
    API-->>Web: HTTP 201 Created { id, key: 'PRD-42', title }
    Web-->>Member: Render PRD-42 on Kanban board
```

---

## 3. UC-003: AI Agent Execution with Leased Runner Claim

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Schedule Trigger
    participant API as Elysia API
    participant DB as PostgreSQL
    participant Runner as External Runner CLI

    User->>API: POST /api/agents/runs { agentId, input: "Analyze logs" }
    API->>DB: INSERT INTO agent_run (status='pending', input)
    API-->>User: HTTP 202 Accepted { runId }
    
    loop Runner Polling Loop
        Runner->>API: POST /api/agents/runner/claim
        API->>DB: SELECT * FROM agent_run WHERE status='pending' FOR UPDATE SKIP LOCKED LIMIT 1
        alt Run available
            API->>DB: UPDATE agent_run SET status='running', lease_expires_at=NOW() + 60s WHERE id=run.id
            API-->>Runner: HTTP 200 { runId, tools, instructions }
        else No runs
            API-->>Runner: HTTP 204 No Content
        end
    end

    loop Stream Execution Events
        Runner->>Runner: Execute Local Tools (sandboxed CLI)
        Runner->>API: POST /api/agents/runs/:id/events (AG-UI delta event)
        API->>DB: INSERT INTO agent_chat_event (run_id, type, payload)
    end

    Runner->>API: POST /api/agents/runs/:id/finish { status: 'completed', result }
    API->>DB: UPDATE agent_run SET status='completed', finished_at=NOW()
    API-->>Runner: HTTP 200 OK
```

---

## 4. UC-004: Realtime Revision Synchronization

```mermaid
sequenceDiagram
    autonumber
    actor ClientA as Browser Tab A (Mutator)
    actor ClientB as Browser Tab B (Observer)
    participant API as Elysia API
    participant DB as PostgreSQL
    participant Sync as SyncProvider (TanStack Query)

    ClientA->>API: PATCH /api/issues/PRD-42 { columnId: 'started' }
    API->>DB: UPDATE issue SET column_id = 'started' WHERE id = ...
    Note over DB: PostgreSQL trigger executes: issue_rev()
    DB->>DB: UPDATE revision SET rev = rev + 1 WHERE project_id = ...
    DB-->>API: OK (New rev = 105)
    API-->>ClientA: HTTP 200 OK

    ClientB->>Sync: SyncProvider heartbeat poll (lastKnownRev = 104)
    Sync->>API: GET /api/sync/pull?rev=104
    API->>DB: SELECT * FROM revision WHERE project_id = ...
    DB-->>API: Current rev = 105
    API->>DB: SELECT * FROM issue WHERE updated_at > last_sync_time
    DB-->>API: [ { id: 'PRD-42', columnId: 'started' } ]
    API-->>Sync: HTTP 200 { rev: 105, mutations: [...] }
    Sync-->>ClientB: Invalidate TanStack query cache; UI updates card position
```

---

## 5. UC-005: Initiative Rollup & Cycle Scope Rollover

```mermaid
sequenceDiagram
    autonumber
    actor PM as Product Manager
    participant API as Elysia API
    participant DB as PostgreSQL

    PM->>API: POST /api/cycles/:id/finish { transferToCycleId: 'cycle_next' }
    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE cycle SET status = 'completed', ended_at = NOW() WHERE id = cycle_id
    API->>DB: UPDATE issue SET cycle_id = 'cycle_next' WHERE cycle_id = cycle_id AND state_type != 'completed'
    Note over DB: Incomplete issues atomically transferred to upcoming cycle
    API->>DB: UPDATE initiative SET progress = (completed_issues / total_issues)
    API->>DB: COMMIT
    API-->>PM: HTTP 200 OK { transferredCount: 4, rolledOverTo: 'cycle_next' }
```

---

## 6. UC-006: Document Optimistic Locking & Revision Retention

```mermaid
sequenceDiagram
    autonumber
    actor AuthorA as Author A
    actor AuthorB as Author B
    participant API as Elysia API
    participant DB as PostgreSQL

    AuthorA->>API: PUT /api/documents/:id { title, content, version: 3 }
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT version FROM project_document WHERE id = ... FOR UPDATE
    DB-->>API: version = 3
    API->>DB: UPDATE project_document SET content = ..., version = 4 WHERE id = ... AND version = 3
    Note over DB: Trigger snapshots version 3 into project_document_revision
    API->>DB: COMMIT
    API-->>AuthorA: HTTP 200 OK { version: 4 }

    AuthorB->>API: PUT /api/documents/:id { title, stale_content, version: 3 }
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT version FROM project_document WHERE id = ... FOR UPDATE
    DB-->>API: version = 4
    API-->>AuthorB: HTTP 409 Conflict { error: "VERSION_MISMATCH", currentVersion: 4 }
    API->>DB: ROLLBACK
```


---

## 7. UC-010 v2.0: Open Office Real PostgreSQL SSOT, 4-Tab Live Agent Inspector, Closed-Loop Execution & Rework Crystallization

```mermaid
sequenceDiagram
    autonumber
    actor HUM as Human (Project Owner)
    participant Web as Next.js (PixelOfficeCanvas + 4-Tab Inspector)
    participant Engine as Python (OpenOfficeContractEngine)
    participant PG as PostgreSQL (ITSAPLAN_DB_URL: ai_agent, issue, agent_run, agent_schedule)
    participant SQLite as SQLite (open_office_* + ABORT Triggers)
    participant Worker as Headless Agent Execution Worker

    HUM->>Web: Open Open Office (?project_key=PM&scope=project|portfolio)
    Web->>Engine: GET /api/vibe/open-office/state?project_key=PM&scope=project
    Engine->>PG: Query 6 real ai_agent + active/queued agent_run + issue + agent_schedule + project_document
    Engine->>SQLite: Query contracts, runs, lessons & SHA-256 event log
    Engine-->>Web: Real stations (NOW/NEXT/MEMORY/MODULES) + Doorway Waypoint targets + Needs-My-Action

    HUM->>Web: Click Pixel Agent (@antigravity) -> Inspect NOW / NEXT / MEMORY / MODULES or Quick Steer
    Web->>Engine: POST /api/vibe/open-office/steer { agent_id, contract_id, message }
    Engine->>PG: Append issue_activity steer note & update live step stream

    HUM->>Web: Submit 1-Card Assignment (1..N real agents + natural goal, auto_draft_criteria=true)
    Web->>Engine: POST /api/vibe/open-office/contracts
    Engine->>PG: INSERT/UPDATE real issue (In Progress, delegate_user_id) + INSERT agent_run
    Engine->>SQLite: Auto-draft criteria + self-commit confidence_pct + INSERT contract & TaskRun #1 + SHA-256 events
    Engine->>Worker: Spawn async closed-loop execution worker
    Worker->>PG: Stream step progress -> attach markdown deliverable + ev_<sha256> -> move issue to Review
    Worker->>SQLite: submit_run_evidence() -> status='AWAITING_HITL'

    alt Return for Rework ("unverified stub")
        HUM->>Web: POST /api/vibe/open-office/review { decision: 'RETURN_FOR_REWORK', reason }
        Engine->>SQLite: Mark Run #N RETURNED_FOR_REWORK + INSERT open_office_lessons (Đào Tạo) + spawn Run #(N+1)
        Engine->>PG: Move issue back to In Progress & re-run Worker with crystallized lesson
    else Independent SoD Approval (GW-SOD-01)
        HUM->>Web: POST /api/vibe/open-office/review { decision: 'APPROVE', approver_id: 'hum-phuong-vo', acceptance_verified: true }
        Engine->>SQLite: Enforce approver_id != lead_agent_id -> status='DONE' + Committed vs Actual variance
        Engine->>PG: Move real issue to Done & bump project revision
    end
```

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
## Sequence SD-010B: 2-Step Inline Task Dispatch, Fail-Closed SoD Review & In-Place AgentSheet (`SPEC-53.ACT.505`)
```mermaid
sequenceDiagram
    participant HUM as HUM Operator
    participant Cockpit as Split-Shell Right Rail / Agents Table
    participant API as Backend (:3000 / :8765)
    HUM->>Cockpit: Step 1 Type Goal in above-the-fold input-contract-title
    HUM->>Cockpit: Step 2 Click btn-submit-open-office-contract (0px scroll)
    Cockpit->>API: POST /api/vibe/open-office/contracts
    API-->>Cockpit: HTTP 200 IN_PROGRESS
    HUM->>Cockpit: On /agents -> Step 1 Click @antigravity row -> 380px Sheet opens in-place
    HUM->>Cockpit: Step 2 Save Skills/Tools/Model -> PATCH /teams/1/agents/1
```
