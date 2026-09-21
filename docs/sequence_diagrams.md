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
