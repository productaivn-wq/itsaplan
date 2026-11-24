@UC-011 @SPEC-53.ACT.500 @FR-061
Feature: UC-011 — Phòng Điều Hành — Portfolio Steering, 30-Project Resource Filter & Tier-2 SoD Governance

  @TC-UC011-S01 @TC-UC011-01
  Scenario: Inspect Phòng Điều Hành live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "exec_hq" ("Phòng Điều Hành")
    Then the Department Inspector displays live metrics for "Phòng Điều Hành" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC011-S02 @TC-UC011-02
  Scenario: Trigger Phòng Điều Hành primary department workflow "Duyệt Hộp Cần tôi xử lý & Điều phối Danh mục"
    Given the Department Inspector for "exec_hq" is open
    When the operator invokes "Duyệt Hộp Cần tôi xử lý & Điều phối Danh mục" using template "ops_reconciliation"
    Then the receiving real agent walks through the "exec_hq" doorway and binds a real ItsAPlan issue and run

  @TC-UC011-S02 @TC-UC011-03
  Scenario: Enforce fail-closed departmental boundary guard (Self-Approval Violation (`GW-SOD-01`))
    Given department "exec_hq" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Self-Approval Violation (`GW-SOD-01`)"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC011-S03 @TC-UC011-04
  Scenario: Navigate from Phòng Điều Hành to native ItsAPlan modules
    Given the Department Inspector for "exec_hq" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/initiatives, /{teamRef}/{projectKey}/cycles, /{teamRef}/{projectKey}/dashboards, /{teamRef}/{projectKey}/inbox
