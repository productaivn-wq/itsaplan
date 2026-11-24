# Latest Regression Report — ItsAPlan (`ACCORD`) (`53.ACT.633`)

- **Run ID**: `RUN-53.ACT.633-20261121`
- **Executed At**: `2026-11-24T21:45:01+07:00` (Baseline Prior Run: `RUN-53.ACT.592-20261119` on `2026-11-19` — `183/183` PASSED)
- **Verification Suite**: `tests/test_itsaplan_uc001_018_declarative_suite.py` + `tests/test_itsaplan_convergence_633.py`
- **Scope**: All `18/18` Use Cases (`UC-001` through `UC-018`, including `UC-009` Portfolio Vault and `UC-011..UC-018` Department Dossiers, all `MinTC >= 12`)
- **Result**: `261/261` declarative Test Cases **PASSED** (`0` failed, `0` skipped)
- **DB Integrity (`itsaplan_verification.db`)**: `0` fabricated `NULL agent_id` stubs, `0` `proof.webm` placeholders, `0` missing artifact refs, `0` corrupted `EX-/GW-/RF-` `uc_id` rows.

## Use Case Coverage Matrix (`UC-001..UC-018`)

| UC ID | TC File | Declarative TCs | MinTC >= 12 | Status |
| :--- | :--- | :---: | :---: | :---: |
| `UC-001` | `tests/data/TC-UC-001_data.json` | `25` | `PASS` | `PASSED` |
| `UC-002` | `tests/data/TC-UC-002_data.json` | `23` | `PASS` | `PASSED` |
| `UC-003` | `tests/data/TC-UC-003_data.json` | `14` | `PASS` | `PASSED` |
| `UC-004` | `tests/data/TC-UC-004_data.json` | `12` | `PASS` | `PASSED` |
| `UC-005` | `tests/data/TC-UC-005_data.json` | `13` | `PASS` | `PASSED` |
| `UC-006` | `tests/data/TC-UC-006_data.json` | `12` | `PASS` | `PASSED` |
| `UC-007` | `tests/data/TC-UC-007_data.json` | `12` | `PASS` | `PASSED` |
| `UC-008` | `tests/data/TC-UC-008_data.json` | `14` | `PASS` | `PASSED` |
| `UC-009` | `tests/data/TC-UC-009_data.json` | `12` | `PASS` | `PASSED` |
| `UC-010` | `tests/data/TC-UC-010_data.json` | `28` | `PASS` | `PASSED` |
| `UC-011` | `tests/data/TC-UC-011_data.json` | `12` | `PASS` | `PASSED` |
| `UC-012` | `tests/data/TC-UC-012_data.json` | `12` | `PASS` | `PASSED` |
| `UC-013` | `tests/data/TC-UC-013_data.json` | `12` | `PASS` | `PASSED` |
| `UC-014` | `tests/data/TC-UC-014_data.json` | `12` | `PASS` | `PASSED` |
| `UC-015` | `tests/data/TC-UC-015_data.json` | `12` | `PASS` | `PASSED` |
| `UC-016` | `tests/data/TC-UC-016_data.json` | `12` | `PASS` | `PASSED` |
| `UC-017` | `tests/data/TC-UC-017_data.json` | `12` | `PASS` | `PASSED` |
| `UC-018` | `tests/data/TC-UC-018_data.json` | `12` | `PASS` | `PASSED` |

- **Dashboard & UI/UX Certifications**: Includes `53.ACT.645` (Dashboard Stats OPT-D), `53.ACT.717` (50-Round JTBD & UI/UX), and `53.ACT.738` (100-Round OPT-D Convergence).
