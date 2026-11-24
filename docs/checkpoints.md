# ItsAPlan Deterministic Governance Checkpoints (`checkpoints.md`)

- **identifier**: `[CANARY:AGENTS.md:GOVERNED]`
- **version**: `3.3.0`

| Checkpoint ID | Gate ID | Stage | Verification Invariant (`DET P=1`) |
|:---|:---|:---|:---|
| `CP-001` | `GW-UTOP-01` | Pre-Build | All 17 compulsory UTOP artifacts present and non-empty in `apps/itsaplan/docs/` & `tests/` |
| `CP-002` | `GW-UTOP-02` | Pre-Test | Every `TC-UC-001..008_data.json` contains `>= 12` declarative test cases (`123` total) |
| `CP-003` | `GW-DATA-01` | Pre-Regression | `DynamicRegressionHarness` resolves `N_DB` targets dynamically from `verification_targets` |
| `CP-004` | `GW-HEADLESS-01` | Runtime | Playwright executes off-screen (`headless=True`, `--window-position=-32000,-32000`) |
| `CP-005` | `GW-UIUX-01` | UI Render | ACCORD Milled Carbon (`#0C0E12`) & Swiss Vellum tokens active; zero white flash |
| `CP-006` | `GW-I18N-01` | Localization | 100% Unicode NFC Vietnamese (`vi`) across 33 namespaces (`0` mojibake sequences) |
| `CP-007` | `GW-NAV-01` | Interaction | Feature menu switching completes in `< 150ms` (`SPEC-ITSAPLAN-285`) |
| `CP-008` | `GW-QG-01` | Post-Round | OpenJev 2nd-frame visual inspection & test pass rate achieve `EAI >= 0.9800` across 10 rounds |

| `CP-009` | `GW-SOD-01` | Open Office Review | `OpenOfficeContractEngine.review_contract` aborts self-approval (`approver_id == lead_agent_id`) and SQLite `BEFORE UPDATE/DELETE` triggers abort any mutation on `open_office_event_log` (`UC-010`) |
| `CP-010` | `GW-UIUX-01` | Open Office Composer | `OpenOfficeWorkspaceView.tsx` enforces `<= 4` inputs/step across the 3-Step Progressive Contract Composer with `1.00` `layer0_validator.py` score (`UC-010`) |

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
- **Checkpoint `CP-505` (`2026-11-09` ? `SPEC-53.ACT.505`)**: Sealed 17-artifact UTOP baseline (`utop_state.json`) prior to Phase 4 coding for Agentic OS Harness v3.2.0 Zero-Duplication Split-Shell Cockpit & `<= 2`-Step JTBD Closure.
