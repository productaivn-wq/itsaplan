@UC-012 @SPEC-53.ACT.500 @FR-062
Feature: UC-012 — Phòng BA-Tester — UTOP Specification Authoring, MinTC Verification & QualityGate (`EAI >= 0.98`)

  @TC-UC012-S01 @TC-UC012-01
  Scenario: Inspect BA-Tester live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "ba_tester" ("BA-Tester")
    Then the Department Inspector displays live metrics for "BA-Tester" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC012-S02 @TC-UC012-02
  Scenario: Trigger BA-Tester primary department workflow "Giao Rà soát Spec / Kiểm thử QualityGate"
    Given the Department Inspector for "ba_tester" is open
    When the operator invokes "Giao Rà soát Spec / Kiểm thử QualityGate" using template "research_citation"
    Then the receiving real agent walks through the "ba_tester" doorway and binds a real ItsAPlan issue and run

  @TC-UC012-S02 @TC-UC012-03
  Scenario: Enforce fail-closed departmental boundary guard (Missing Verification Proof (`EVIDENCE_REQUIRED`))
    Given department "ba_tester" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Missing Verification Proof (`EVIDENCE_REQUIRED`)"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC012-S03 @TC-UC012-04
  Scenario: Navigate from BA-Tester to native ItsAPlan modules
    Given the Department Inspector for "ba_tester" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/docs, /{teamRef}/{projectKey}, /{teamRef}/{projectKey}/settings/issue-templates, /{teamRef}/{projectKey}/settings/issue-types
