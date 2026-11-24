# ItsAPlan Compulsory Entity & Document Lifecycle State Diagrams (`state_diagrams.md`)

- **identifier**: `[CANARY:AGENTS.md:GOVERNED]`
- **version**: `3.3.0`

## 1. Issue & Subtask WBS Lifecycle (`UC-002`, `UC-008`)
```mermaid
stateDiagram-v2
    [*] --> Backlog: createIssue()
    Backlog --> Todo: triageAndSchedule()
    Todo --> InProgress: startWork()
    InProgress --> InReview: submitProof()
    InReview --> InProgress: rejectQualityGate()
    InReview --> Done: passQualityGate()
    InProgress --> Cancelled: abortIssue()
    Done --> Archived: closeCycle()
    Cancelled --> Archived: closeCycle()
    Archived --> [*]
```

## 2. Initiative & Cycle Lifecycle (`UC-005`, `SPEC-ITSAPLAN-284`)
```mermaid
stateDiagram-v2
    [*] --> Draft: authorHorizonH1()
    Draft --> Active: activateCycleOrInitiative()
    Active --> Completed: rollup100PctTasks()
    Active --> Paused: holdInitiative()
    Paused --> Active: resumeInitiative()
    Completed --> Archived: sealAuditChain()
    Archived --> [*]
```

## 3. Vibe Working Canvas & Project Document Lifecycle (`UC-006`, `UC-007`)
```mermaid
stateDiagram-v2
    [*] --> Created: initDocumentOrCanvas()
    Created --> Hydrated: loadOTState()
    Hydrated --> Editing: applyDeltaOrPasteImage()
    Editing --> Synced: commitMonotonicRevision()
    Synced --> Editing: furtherEdits()
    Synced --> Locked: lockSpecificationBaseline()
    Locked --> Archived: archiveDocument()
```

## 4. Autonomous Agent Run Lifecycle (`UC-003`)
```mermaid
stateDiagram-v2
    [*] --> Queued: dispatchAgentTask()
    Queued --> Leased: acquireFileAndToolLease()
    Leased --> Executing: invokeMCPTool()
    Executing --> Verifying: evaluateEAI()
    Verifying --> Completed: eaiGte098()
    Verifying --> Failed: invariantViolation()
    Completed --> [*]
    Failed --> [*]
```


## 5. Open Office Task Contract, 1:N TaskRun & Causal Room Navigation Lifecycle (`UC-010 v2.0`, `53.ACT.500`)
```mermaid
stateDiagram-v2
    [*] --> IdleInLobby: hydrateRealAgents(ITSAPLAN_DB_URL)
    IdleInLobby --> WalkingDoorway: createContract() / claimAgentRun()
    WalkingDoorway --> WorkingAtRoomDesk: enterCausalRoom(ba_tester / ai_dev / exec_hq / war_room / academy)
    WorkingAtRoomDesk --> WorkingAtRoomDesk: quickSteer(instruction) / streamActivity()
    WorkingAtRoomDesk --> AwaitingHITL: submitRunEvidence(ev_sha256, issue->Review)
    AwaitingHITL --> CrystallizingAcademy: returnForRework(reason) [TaskRun #(N+1) + open_office_lessons]
    CrystallizingAcademy --> WorkingAtRoomDesk: resumeWithLesson()
    AwaitingHITL --> Done: approveContract(approver_id != lead_agent_id) [issue->Done]
    Done --> IdleInLobby: walkBackThroughDoorway()
```

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
## State Machine SM-010B: Non-Overlapping Split-Shell & Fail-Closed SoD Banner (`SPEC-53.ACT.505`)
```mermaid
stateDiagram-v2
    [*] --> DockedRightRailReady: 0px Scroll (Roster + Inspector + Quick Dispatch Above Fold)
    DockedRightRailReady --> DispatchedIn2Steps: Goal Entered -> Giao ngay (HTTP 200)
    DockedRightRailReady --> FailClosedBanner: HTTP 400/403 GW-SOD-01 -> open-office-error-banner (0 fake DONE)
```
