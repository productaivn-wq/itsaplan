@UC-018 @SPEC-53.ACT.500 @FR-068
Feature: UC-018 — Phòng Kinh Doanh — Portfolio Client Delivery SLA, Value-Stream Dashboards & Outbound Webhooks/API

  @TC-UC018-S01 @TC-UC018-01
  Scenario: Inspect Kinh Doanh live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "commercial" ("Kinh Doanh")
    Then the Department Inspector displays live metrics for "Kinh Doanh" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC018-S02 @TC-UC018-02
  Scenario: Trigger Kinh Doanh primary department workflow "Theo dõi SLA Dự án Khách hàng & Báo cáo Kinh doanh"
    Given the Department Inspector for "commercial" is open
    When the operator invokes "Theo dõi SLA Dự án Khách hàng & Báo cáo Kinh doanh" using template "doc_synthesis"
    Then the receiving real agent walks through the "commercial" doorway and binds a real ItsAPlan issue and run

  @TC-UC018-S02 @TC-UC018-03
  Scenario: Enforce fail-closed departmental boundary guard (Overdue High-Priority Client Issue Detected)
    Given department "commercial" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Overdue High-Priority Client Issue Detected"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC018-S03 @TC-UC018-04
  Scenario: Navigate from Kinh Doanh to native ItsAPlan modules
    Given the Department Inspector for "commercial" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/dashboards, /{teamRef}/{projectKey}/initiatives, /{teamRef}/{projectKey}/settings/webhooks, /{teamRef}/{projectKey}/api
