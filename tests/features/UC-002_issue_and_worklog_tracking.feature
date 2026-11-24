@UC-002 @CAP-ISSUE
Feature: Issue and Worklog Tracking
  As a team member
  I want to create issues, subtasks, checklists, and log work
  So that engineering progress is measured with full audit integrity

  Background:
    Given a project "ENG" exists with default columns
    And an authenticated user "user-dev"

  @FR-002 @Stateful
  Scenario: Atomic sequential issue numbering
    When 5 issues are created concurrently in project "ENG"
    Then all 5 issues must receive contiguous sequence numbers from 1 to 5
    And zero duplicates or sequence collisions shall occur

  @FR-010 @Validation
  Scenario Outline: Enforce subtask hierarchy invariants
    Given an issue "ENG-1" exists
    When a subtask "ENG-2" is created with parent "<parentId>"
    Then the system should respond with "<status>"

    Examples:
      | parentId | status  | note               |
      | ENG-1    | 201     | Valid parent       |
      | ENG-2    | 400     | Self-referencing   |
      | INVALID  | 404     | Non-existent parent|

  @FR-015 @Numeric
  Scenario Outline: Worklog duration validation
    Given an issue "ENG-1" with estimated minutes 120
    When user logs work with minutes <minutes>
    Then the response status should be <status>

    Examples:
      | minutes | status | outcome   |
      | 60      | 201    | Positive  |
      | 0       | 422    | Boundary  |
      | -30     | 422    | Negative  |
