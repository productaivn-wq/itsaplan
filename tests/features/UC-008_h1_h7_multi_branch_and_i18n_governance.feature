Feature: UC-008 H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance
  As a Portfolio Director or Autonomous PM Agent
  I want multi-branch H1-H7 WBS timeline visualization, active cycle wiring, instant navigation, and UTF-8 Vietnamese localization
  So that all 36 portfolio projects and sprints are governed with zero UI clutter and 100% specification traceability

  Background:
    Given an authenticated ItsAPlan workspace with synchronized H1-H7 portfolio data

  Scenario: G01 Render Consolidated Multi-Branch H1-H7 Timeline Gantt
    When the actor navigates to the Timeline view
    Then the system renders 3 H1 Initiatives, 4 H2-H7 Horizons, 7 Tasks, and 14 Subtasks with orthogonal FS arrows

  Scenario: G02 Enforce Human-Centric Timeline Row Density and Zoom Controls
    When the actor toggles Day, Week, and Month zoom levels on the Timeline
    Then all task bars maintain >= 32px row height and zero overlapping labels

  Scenario: G03 Enforce 100% Unicode NFC Vietnamese UTF-8 Across 33 Namespaces
    When the actor switches workspace locale to "vi"
    Then all 33 translation namespaces render valid NFC Vietnamese strings with 0 mojibake characters

  Scenario: G04 Apply ACCORD Milled Carbon and Swiss Vellum Brand Design System
    When the application shell renders in Dark or Light mode
    Then the root surface tokens match #0C0E12 (Milled Carbon) or #F7F6F2 (Swiss Vellum) with 0 white flash

  Scenario: G05 Paste Clipboard Image Directly into Chat Orchestrator
    When the actor pastes a valid PNG image into the Chat composer
    Then the system attaches the image preview thumbnail and includes it in the multimodal payload

  Scenario: G06 Enforce Removal of God Mode and Legacy Project Settings
    When the actor inspects the sidebar and top navigation menus
    Then God Mode controls and Project Settings tabs are completely absent

  Scenario: G07 Wire Initiatives and Cycles Views to Active Records Only
    When the actor opens the Initiatives or Cycles view
    Then only active records (active = true) are displayed with live task completion percentages

  Scenario: G08 Instant Feature Menu Navigation Under 150ms
    When the actor clicks between Board, Timeline, Initiatives, Cycles, and Docs tabs
    Then each view transition completes in less than 150ms without full page reload
