# Micro-UTOP Specification: Cut Project Settings Entirely in ItsAPlan (`SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284`)

- **Identifier**: `[CANARY:AGENTS.md:GOVERNED]` · `SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284`
- **Task ID**: `TASK-PM-ITSAPLAN-CUT-PROJECT-SETTINGS-284`
- **Status**: `ACTIVE`
- **Date**: `2026-10-22`
- **Tier**: `Tier 1 Micro-UTOP` (`GW-UTOP-01/02`)
- **Gates**: `GW-7P-POLY-01` · `GW-HUD-02` · `GW-P2-STRESS-360-01` · `GW-UTOP-01/02` · `GW-CANARY-01`

```json-ld
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "identifier": "SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284",
  "name": "Cut Project Settings Entirely in ItsAPlan to Speed Up UI/UX",
  "version": "1.0.0",
  "datePublished": "2026-10-22",
  "author": {
    "@type": "Organization",
    "name": "Antigravity Sovereign Agentic OS"
  },
  "about": "Deterministic removal of all Project Settings UI surfaces, sidebar mode switches, background route prefetches, command palette entries, keyboard shortcuts, and /settings/* route trees in 58_ITSAPLAN."
}
```

---

## 1. Executive Summary & 4-Block Task Goal
- **Problem**: `ItsAPlan` (`58_ITSAPLAN`) exposes a 10-page Project Settings subsystem (`General`, `States`, `Issue types`, `Labels`, `Custom fields`, `Issue templates`, `Configuration`, `Actions`, `Webhooks`, `Import/Export`) via the `"Project settings"` sidebar item, `SidebarSettingsNav` mode switch, command palette (`useNavigationCommands`), and the `s` keyboard shortcut (`project.settings`). Rendering and prefetching these project details/settings surfaces slows down navigation and clutters the user interface.
- **Solution**: Cut everything inside Project Settings from the user-facing UI/UX:
  1. Remove the `"Project settings"` entry from `SidebarConfigNav.tsx` and disable `settingsMode` switching in `AppSidebar.tsx`.
  2. Empty `GENERAL_SECTIONS`, `CONFIGURATION_SECTIONS`, and `AUTOMATION_SECTIONS` in `utils/settingsSections.ts` and return `{ groups: [], firstHref: null }` in `useSettingsNavGroups.ts`, while preserving `AI_TEAM_SECTIONS` (`schedules`) and `AI_AGENTS_SECTION` (`ai-agents`) for the main sidebar's `AI Team` group (`SidebarAiTeamNav.tsx`).
  3. Strip project settings commands from `useNavigationCommands.tsx`, remove the `project.settings` (`s`) binding from `HOTKEYS` (`utils/hotkeys.ts`, `useKeyboardShortcuts.ts`, `Shell.tsx`), and remove the `/settings/general` button from `RequireFeature.tsx`.
  4. Replace all `/[teamRef]/(shell)/[projectKey]/settings/*` route pages (and add `settings/page.tsx`) with a lightweight `ProjectSettingsCutRedirect` component (`features/settings/ProjectSettingsCutRedirect.tsx`) that immediately redirects to `projectPath(projectKey)` (`/[teamRef]/[projectKey]`) with zero settings API queries or form mounts.

---

## 2. Functional Requirements & 1:1 DoD Matrix

| DoD ID | Requirement ID | Specification | Verification Method |
| :--- | :--- | :--- | :--- |
| `DoD-1` | `FR-CUT-SET-01` | Author `10_ACTIVE_TIMEBOUND/SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284.md` with Schema.org JSON-LD and `[CANARY:AGENTS.md:GOVERNED]`. | `test_dod1_spec_and_governance_headers` |
| `DoD-2` | `FR-CUT-SET-02` | Cut `"Project settings"` from `SidebarConfigNav.tsx`, `AppSidebar.tsx`, `useSettingsNavGroups.ts`, `utils/settingsSections.ts`, `useNavigationCommands.tsx`, `utils/hotkeys.ts`, `useKeyboardShortcuts.ts`, `Shell.tsx`, and `RequireFeature.tsx`, while preserving `AI Team` (`/agents`, `/agents/schedules`), `Members` (`/members`), and `Secret Vault` (`/vault`). | `test_dod2_sidebar_commands_and_hotkeys_cut` |
| `DoD-3` | `FR-CUT-SET-03` | Cut all `/[teamRef]/(shell)/[projectKey]/settings/*` pages (`general`, `states`, `issue-types`, `labels`, `custom-fields`, `issue-templates`, `configuration`, `actions`, `webhooks`, `import-export`, `git`, and index `page.tsx`) via `ProjectSettingsCutRedirect` (`router.replace(projectPath(projectKey))`), mounting zero settings forms or queries. | `test_dod3_settings_routes_cut_and_redirect` |
| `DoD-4` | `FR-CUT-SET-04` | Verify live `ItsAPlan` (`http://localhost:3001/thanb/PM/settings/general`) redirects to `/thanb/PM` with zero `"Project settings"` link in sidebar, plus 100% green regression tests and `GW-CANARY-01` `residual_count == 0`. | `test_dod4_live_playwright_and_zero_canary_residuals` |
