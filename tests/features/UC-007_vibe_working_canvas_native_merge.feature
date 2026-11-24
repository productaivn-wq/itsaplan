@UC-007 @CAP-VIBE-CANVAS
Feature: Jevbox-Style Vibe Working Canvas Native Workspace Integration
  As an engineering lead and project manager (thanb)
  I want the Jevbox-style Vibe Working Canvas directly accessible in ItsAPlan
  So that I can explore project assets spatially, read evidence with exact line gutters, and dispatch autonomous agent swarms against PostgreSQL issues

  Background:
    Given the ItsAPlan web application is running on port 3001
    And the ItsAPlan Elysia API is running on port 3000
    And the PostgreSQL database "itsaplan" is online

  @FR-ITP-VIBE-01 @FR-ITP-VIBE-02 @Navigation
  Scenario: Navigate to Vibe Canvas from the project sidebar
    Given the user is on the project board "/thanb/PM"
    When the user clicks the "Vibe Canvas" item in the sidebar
    Then the application navigates to "/thanb/PM/vibe"
    And the 3-column Spatial Finder, 3D Galaxy Canvas, and Swarm Board are mounted

  @FR-ITP-VIBE-03 @DatabaseSync
  Scenario: Sync issue states directly with ItsAPlan PostgreSQL
    Given an issue "PM-12" exists in the "TODO" column in the database
    When the user clicks "Start" on issue "PM-12" in the Vibe Canvas Kanban board
    Then an autonomous agent worker is headlessly dispatched
    And the issue status in "itsaplan.issue" is updated to "IN_PROGRESS"
    And a live radar pulse badge is displayed on the issue card

  @FR-ITP-VIBE-04 @GW-EFF-01 @SpatialFinder
  Scenario: Spatial navigation across project MECE zones with file slicing
    Given the project workspace root contains "00_INBOX", "10_ACTIVE_TIMEBOUND", "20_ACTIVE_CONTINUOUS", "30_REFERENCE", "40_ARCHIVE"
    When the user selects the "10_ACTIVE_TIMEBOUND" zone in Column 1
    Then Column 2 displays all sprint markdown files and reports
    When the user selects "sprint_191_tasks.md" in Column 2
    Then Column 3 displays file metadata, line count, and a deterministic slice <= 200 lines

  @FR-ITP-VIBE-06 @LineGutters @GroundedReader
  Scenario: Grounded evidence reader displays line gutters and highlights citations
    Given the user is viewing "sprint_191_tasks.md" in the Grounded Split Reader
    When the user clicks a citation badge "[L37-L40]" in the AI Chat panel
    Then the document viewport smoothly auto-scrolls to line 37
    And lines 37 to 40 are highlighted in dynamic amber

  @FR-ITP-VIBE-07 @ZeroMojibake @ArchiveManifest
  Scenario: Archive manifest inspection without font corruption
    Given a zip archive "00_INBOX/sample_archive.zip" containing Vietnamese filename characters
    When the user opens the Archive Manifest Viewer
    Then the complete tree structure is rendered without file extraction
    And all filenames are displayed without mojibake or UTF-8 corruption

  @FR-ITP-VIBE-09 @MultiThreading
  Scenario: Multi-threaded conversation management
    Given the user is in the Vibe Grounded Chat
    When the user creates a new conversation thread "Architecture Review"
    Then a new discrete thread is created with a unique session ID
    And switching between threads restores the respective message history without cross-talk
