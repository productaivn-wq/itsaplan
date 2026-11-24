@UC-015 @SPEC-53.ACT.500 @FR-065
Feature: UC-015 — Phòng Đào Tạo — "Fix Mõm" Rework Lesson Crystallization, WeKnora Memory & Agent Skill Evolution

  @TC-UC015-S01 @TC-UC015-01
  Scenario: Inspect Đào Tạo live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "academy" ("Đào Tạo")
    Then the Department Inspector displays live metrics for "Đào Tạo" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC015-S02 @TC-UC015-02
  Scenario: Trigger Đào Tạo primary department workflow "Xem Bài học Đúc kết & Nâng cấp Kỹ năng"
    Given the Department Inspector for "academy" is open
    When the operator invokes "Xem Bài học Đúc kết & Nâng cấp Kỹ năng" using template "doc_synthesis"
    Then the receiving real agent walks through the "academy" doorway and binds a real ItsAPlan issue and run

  @TC-UC015-S02 @TC-UC015-03
  Scenario: Enforce fail-closed departmental boundary guard (Return for Rework Without Critique Reason)
    Given department "academy" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Return for Rework Without Critique Reason"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC015-S03 @TC-UC015-04
  Scenario: Navigate from Đào Tạo to native ItsAPlan modules
    Given the Department Inspector for "academy" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/docs, #weknora-memory, /{teamRef}/settings/agent-skills, /{teamRef}/{projectKey}/onboarding
