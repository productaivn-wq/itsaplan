@UC-016 @SPEC-53.ACT.500 @FR-066
Feature: UC-016 — Phòng Họp — Multi-Agent Swarm Collaboration, Blocker Escalation & Kara Meeting Action Sync

  @TC-UC016-S01 @TC-UC016-01
  Scenario: Inspect Phòng Họp live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "war_room" ("Phòng Họp")
    Then the Department Inspector displays live metrics for "Phòng Họp" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC016-S02 @TC-UC016-02
  Scenario: Trigger Phòng Họp primary department workflow "Triệu tập Nhóm Đa Agent (Phòng Họp)"
    Given the Department Inspector for "war_room" is open
    When the operator invokes "Triệu tập Nhóm Đa Agent (Phòng Họp)" using template "research_citation"
    Then the receiving real agent walks through the "war_room" doorway and binds a real ItsAPlan issue and run

  @TC-UC016-S02 @TC-UC016-03
  Scenario: Enforce fail-closed departmental boundary guard (Duplicate Lead & Support Agent Selection)
    Given department "war_room" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Duplicate Lead & Support Agent Selection"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC016-S03 @TC-UC016-04
  Scenario: Navigate from Phòng Họp to native ItsAPlan modules
    Given the Department Inspector for "war_room" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/notes, /{teamRef}/{projectKey}/vibe, #shell-chat-panel, /{teamRef}/{projectKey}/inbox
