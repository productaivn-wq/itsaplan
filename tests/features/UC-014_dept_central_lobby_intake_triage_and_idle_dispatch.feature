@UC-014 @SPEC-53.ACT.500 @FR-064
Feature: UC-014 — Đại Sảnh Chung — Truthful Standby Lounge, Project Backlog Intake & Instant Idle Agent Dispatch

  @TC-UC014-S01 @TC-UC014-01
  Scenario: Inspect Đại Sảnh Chung live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "central_lobby" ("Đại Sảnh Chung")
    Then the Department Inspector displays live metrics for "Đại Sảnh Chung" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC014-S02 @TC-UC014-02
  Scenario: Trigger Đại Sảnh Chung primary department workflow "Giao Việc Tồn đọng cho Agent Đang Rảnh"
    Given the Department Inspector for "central_lobby" is open
    When the operator invokes "Giao Việc Tồn đọng cho Agent Đang Rảnh" using template "ops_reconciliation"
    Then the receiving real agent walks through the "central_lobby" doorway and binds a real ItsAPlan issue and run

  @TC-UC014-S02 @TC-UC014-03
  Scenario: Enforce fail-closed departmental boundary guard (All Agents Currently Busy)
    Given department "central_lobby" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "All Agents Currently Busy"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC014-S03 @TC-UC014-04
  Scenario: Navigate from Đại Sảnh Chung to native ItsAPlan modules
    Given the Department Inspector for "central_lobby" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/inbox, /{teamRef}/{projectKey}, #shell-chat-panel, /{teamRef}/{projectKey}/notifications
