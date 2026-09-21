# 3-Pillar BPMN Workflows (Human, Agent, Code)

This document visualizes the 3-pillar interaction topology of **58_ITSAPLAN**:
1. **Human Pillar**: End User (Engineer, Project Lead, Product Manager)
2. **Agent Pillar**: Autonomous AI Agent (Internal Mastra runtime or External Runner CLI)
3. **Code Pillar** ($P \in \{0, 1\}$): Elysia API routes, PostgreSQL Triggers, Outbox Workers, and TanStack SyncProvider.

---

## 1. Issue Progression & Automated Kanban Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Human as Human (Engineer)
    participant Web as Code (Next.js / Web UI)
    participant API as Code (Elysia API)
    participant DB as Code (PostgreSQL & Triggers)
    participant Worker as Code (Background Worker)
    actor Agent as Agent (AI Bot User)

    Note over Human,Agent: Pillar 1: Human initiates transition | Pillar 3: Code validates & invalidates
    Human->>Web: Drag issue card to "In Progress" column
    Web->>API: PATCH /projects/:key/issues/:id (columnId, position)
    API->>DB: Check WIP limits on destination column
    alt WIP limit exceeded and wip_mode == 'hard'
        DB-->>API: WIP check fails (count >= limit)
        API-->>Web: 400 Bad Request (WIP limit exceeded)
        Web-->>Human: Snap card back & display WIP alert
    else WIP limit satisfied or wip_mode == 'soft'
        API->>DB: UPDATE issue SET column_id = target, position = new_pos
        API->>DB: INSERT INTO issue_status (issue_id, duration tracking)
        API->>DB: INSERT INTO issue_activity (kind = 'activity', action = 'status')
        DB->>DB: TRIGGER bump_revision('board:projectKey') -> rev + 1
        DB->>DB: INSERT INTO notification (type = 'state_changed')
        API-->>Web: 200 OK (Updated issue)
    end

    Note over Web,DB: Realtime sync invalidation loop (POLL_MS = 2000)
    loop Every 2000ms
        Web->>API: GET /sync/rev?scopes=board:projectKey
        API->>DB: SELECT rev FROM revision WHERE scope = 'board:projectKey'
        DB-->>API: rev = 42
        API-->>Web: { revs: { "board:projectKey": 42 } }
    end
    Web->>Web: QueryClient.invalidateQueries(['issues', projectKey])
    Web-->>Human: Rerender updated Kanban column counters live
```

---

## 2. Autonomous AI Agent Delegation, Runner Claim, and MCP Tool Execution

```mermaid
sequenceDiagram
    autonumber
    actor Human as Human (Product Lead)
    participant API as Code (Elysia API)
    participant DB as Code (PostgreSQL Queue)
    participant Worker as Code (Worker Daemon)
    actor Runner as Agent (External Runner CLI / Bot)
    participant MCP as Code (MCP Route Dispatcher)

    Human->>API: POST /issues/:id/comments ("@dev-bot Please analyze error log")
    API->>DB: INSERT INTO issue_activity (kind = 'comment', body = '@dev-bot...')
    API->>DB: INSERT INTO agent_run (agent_id, trigger = 'mention', status = 'pending')
    DB->>DB: TRIGGER bump_revision('issue:id')

    Note over Runner,API: Autonomous External Runner Polling Loop
    loop Every 5000ms
        Runner->>API: POST /agent-runs/claim (Header: x-api-key)
        API->>DB: UPDATE agent_run SET status = 'pending', next_attempt_at = now() + 60s WHERE id = :runId
        DB-->>API: Claimed run data (prompt, issueId)
        API-->>Runner: { run: { id: 101, prompt: "analyze error log", issueId: 50 } }
    end

    Note over Runner,MCP: Runner executes agentic cycle and calls MCP tools
    Runner->>MCP: POST /mcp (Call Tool: 'search_issues', Query: 'error log')
    MCP->>API: Route in-process dispatch with agent bot context
    API-->>MCP: Formatted issue matching list
    MCP-->>Runner: Tool result payload

    par Keep Lease Alive
        Runner->>API: POST /agent-runs/101/heartbeat
        API->>DB: UPDATE agent_run SET next_attempt_at = now() + 60s
    and Stream Live Transcript
        Runner->>API: POST /agent-chats/:threadId/messages (stream deltas)
        API->>DB: INSERT INTO agent_chat_event (payload = delta)
    end

    Runner->>API: POST /agent-runs/101/result (status = 'success', output = "Analysis complete...")
    API->>DB: UPDATE agent_run SET status = 'success', output = ...
    API->>DB: INSERT INTO issue_activity (kind = 'comment', body = 'Agent analysis...')
    DB->>DB: TRIGGER bump_revision('issue:id')
    API-->>Runner: 204 No Content
```

---

## 3. Collaborative Document Step Rebasing & Revision Snapshotting

```mermaid
sequenceDiagram
    autonumber
    actor Author1 as Human (Architect A)
    actor Author2 as Human (Architect B)
    participant API as Code (Documents API)
    participant DB as Code (PostgreSQL)

    Author1->>API: POST /documents/:id/session (epoch, version: 10)
    API-->>Author1: 200 OK (Session active)

    Author2->>API: POST /documents/:id/session (epoch, version: 10)
    API-->>Author2: 200 OK (Session active)

    Author1->>API: POST /documents/:id/steps (version: 10, step: InsertHeading)
    API->>DB: Apply step -> version becomes 11
    API->>DB: INSERT INTO document_step (version: 11, step)
    DB->>DB: TRIGGER snapshot_document_revision() -> INSERT project_document_revision
    API-->>Author1: 200 OK (Rebased version: 11)

    Author2->>API: POST /documents/:id/steps (version: 10, step: InsertParagraph)
    API->>DB: Check expected version (Current is 11, payload is 10)
    DB-->>API: Version mismatch detected
    API-->>Author2: 409 Conflict (Stale version 10)

    Author2->>API: GET /documents/:id/steps?version=10
    API-->>Author2: 200 OK (Returns step 11 InsertHeading)
    Author2->>Author2: Local ProseMirror Rebase
    Author2->>API: POST /documents/:id/steps (version: 11, step: RebasedParagraph)
    API->>DB: Apply step -> version becomes 12
    DB->>DB: TRIGGER snapshot_document_revision() -> INSERT project_document_revision
    API-->>Author2: 200 OK (Rebased version: 12)
```
