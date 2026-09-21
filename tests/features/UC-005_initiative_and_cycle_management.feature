@UC-005 @CAP-PROJ
Feature: Initiative and Cycle Management
  As a project manager
  I want to plan sprint cycles and strategic initiatives
  So that deliverable goals are tracked and incomplete scope rolls over cleanly

  Background:
    Given project "ENG" exists

  @FR-025 @Validation
  Scenario: Reject overlapping sprint cycle windows
    Given an active cycle from "2026-10-01" to "2026-10-14"
    When user attempts to create a cycle from "2026-10-10" to "2026-10-20"
    Then the request is rejected with HTTP 400 and error "OVERLAPPING_CYCLES"

  @FR-026 @Stateful
  Scenario: Atomic scope rollover upon cycle completion
    Given a cycle "Sprint 1" with 2 completed issues and 3 incomplete issues
    When "Sprint 1" is finished with rollover to "Sprint 2"
    Then the 3 incomplete issues are transferred to "Sprint 2"
    And the 2 completed issues remain locked in "Sprint 1"
