# Status Action & Transition Matrix (ITSAPLAN v3.3.22)

- **Portfolio Scale**: `60` SSOT projects (`40` active / `20` archived) backed by PostgreSQL 16.3 and Control-Tower SQLite bridge.
- **SoD Contract Bridge**: Rule `chk_done_proof_and_review` is enforced in Control-Tower SQLite Open Office contract tables (`project_management.db`) upon HITL sign-off; PostgreSQL enforces issue state types, WIP limits (`HTTP 409 WIP_LIMIT_EXCEEDED`), and revision triggers.

## 1. Issue & Cycle Lifecycle Transitions

| Entity / State | Allowed Transitions | Guard / Business Rule | Revision Bump (`0070`/`0135`) |
| :--- | :--- | :--- | :--- |
| Issue `backlog` / `unstarted` -> `started` | Drag / `PATCH /issues/:issueId` | Hard WIP returns `HTTP 409` (`WIP_LIMIT_EXCEEDED`); soft WIP returns warning | `board:<projectId>`, `issue:<issueId>` |
| Issue `started` -> `completed` | Complete work item | Closes active `issue_status` duration row & records `issue_activity` | `board:<projectId>`, `issue:<issueId>` |
| Cycle `upcoming` | `upcoming` -> `active` -> `completed` | Derived in `cycles/service.ts` (`CycleStatus = 'upcoming' \| 'active' \| 'completed'`), non-overlapping UTC windows | `board:<projectId>` |
| Cycle `active` -> `completed` | Finish sprint early/on-schedule | Sets `completed_at`, rolls unfinished issues to target cycle or backlog | `board:<projectId>` |
| Agent Run `pending` -> `running` | `POST /agent-runs/claim` | `FOR UPDATE SKIP LOCKED`, sets `next_attempt_at = now() + 60s` | `agents:<projectId>` |
| Project Created / Updated | `POST /teams/:teamId/projects` | Enforces `UNIQUE(team_id, key)` and initializes `5` state columns | `project:<projectId>`, `board:<projectId>` |
