@UC-013 @SPEC-53.ACT.500 @FR-063
Feature: UC-013 — Phòng AI-Dev — Autonomous TDD Engineering, Live Run Streaming & Cron Schedule Execution

  @TC-UC013-S01 @TC-UC013-01
  Scenario: Inspect AI-Dev live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "ai_dev" ("AI-Dev")
    Then the Department Inspector displays live metrics for "AI-Dev" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC013-S02 @TC-UC013-02
  Scenario: Trigger AI-Dev primary department workflow "Giao Lập trình TDD / Chạy Việc Kỹ thuật"
    Given the Department Inspector for "ai_dev" is open
    When the operator invokes "Giao Lập trình TDD / Chạy Việc Kỹ thuật" using template "code_tdd_delivery"
    Then the receiving real agent walks through the "ai_dev" doorway and binds a real ItsAPlan issue and run

  @TC-UC013-S02 @TC-UC013-03
  Scenario: Enforce fail-closed departmental boundary guard (Quick Steer on Non-Existent Agent/Contract)
    Given department "ai_dev" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Quick Steer on Non-Existent Agent/Contract"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC013-S03 @TC-UC013-04
  Scenario: Navigate from AI-Dev to native ItsAPlan modules
    Given the Department Inspector for "ai_dev" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}, /{teamRef}/{projectKey}/agents, /{teamRef}/{projectKey}/agents/schedules, /{teamRef}/{projectKey}/mcp
