# Micro-UTOP Specification: Add Vietnamese (`vi` / `VN Tiếng Việt`) Locale & Message Catalog to ItsAPlan (`58_ITSAPLAN`)

`[CANARY:AGENTS.md:GOVERNED]` · **Spec ID**: `SPEC-ITSAPLAN-VIETNAMESE-I18N-283` · **Task ID**: `TASK-PM-ITSAPLAN-VIETNAMESE-I18N-283` · **Status**: ACTIVE · **Date**: 2026-10-22  
`Governing Standards: 53.REF.107 (AI-Native Content Standard), 53.REF.07 (Two-Tier UTOP Taxonomy), 53.REF.100`  
`Assigned Actor: AGT` · `Classification: Tier 1 Micro-UTOP (<= 30m / <= 3 files)`

```json-ld
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "@id": "urn:antigravity:53pm:spec:ITSAPLAN-VIETNAMESE-I18N-283",
  "identifier": "SPEC-ITSAPLAN-VIETNAMESE-I18N-283",
  "name": "Add Vietnamese (vi / VN Tiếng Việt) Locale & Message Catalog to ItsAPlan (58_ITSAPLAN)",
  "version": "1.0.0",
  "dateCreated": "2026-10-22",
  "author": {
    "@type": "SoftwareAgent",
    "name": "AGT"
  },
  "programmingLanguage": "TypeScript",
  "queriesAnswered": [
    "How is Vietnamese (vi / VN Tiếng Việt) added to ItsAPlan's language switcher and next-intl configuration?",
    "What are the 33 namespace JSON message catalogs required under 58_ITSAPLAN/apps/web/messages/vi/?",
    "How is 100% nested key and ICU placeholder parity enforced between messages/en and messages/vi?"
  ]
}
```

---

## 1. Context & Task Invariants
> **BLUF**: Implements full Vietnamese (`vi` / `🇻🇳 Tiếng Việt`) localization across `58_ITSAPLAN` (`apps/web` and `apps/api`) with 33 translated message namespaces (`apps/web/messages/vi/*.json`), 100% nested key and ICU variable parity with `messages/en/*.json`, `date-fns/locale` (`vi`) integration, and strict Elysia TypeBox preference schema validation under `GW-UTOP-01/02` and `GW-P2-STRESS-360-01`.

- **Target Initiative / Task**: `53.ACT.283` (`TASK-PM-ITSAPLAN-VIETNAMESE-I18N-283`) — Add Vietnamese (`vi` / `VN Tiếng Việt`) Locale & Message Catalog to ItsAPlan (`58_ITSAPLAN`)
- **Primary Invariants**:
  - `GW-UTOP-01/02`: Upstream specification and declarative test dataset (`MinTC >= 12` with 7 positive and 5 adversarial cases) precede release closure.
  - `GW-P2-STRESS-360-01`: Upfront Pre-Mortem Stress Test and 360-Degree Multi-Lens Feedback embedded and verified.
  - `GW-CANARY-01`: Zero synthetic canary residuals (`residual_count == 0`) across all web/API source and message catalog files.

### Target Implementation Files
- `scripts/add_vietnamese_locale_to_itsaplan.py`
- `tests/test_itsaplan_vietnamese_i18n_283.py`
- `tests/data/TC-ITSAPLAN-VIETNAMESE-I18N-283_data.json`

### Customer-First Seven-Horizon (`7H`: `H1`–`H7`) Strategic Linkage (`GW-GENESIS-01`)
- **`H1` Strategic Initiative**: `STRAT-GOAL-DXAIX-01..06` (Customer Value, Trust, Fair ROI, Responsiveness, 24/7 Service, Confidential Knowledge Protection)
- **`H2` Key Business Question**: `KBQ-DXAIX-01` (How do we eliminate language friction for Vietnamese project planning teams in ACCORD / ItsAPlan?)
- **`H3` Measurable OKR**: `OBJ-53-201` / `KR-53-201.3` (100% key and ICU placeholder parity across all 33 i18n namespaces)
- **`H4` 9-Block BMC**: `BMC-ENT-DXAIX-2026` (`BMC-VP`, `BMC-CS`, `BMC-CH`)
- **`H5` Enterprise Capability**: `CAP-I18N-01` (Multi-Locale UI & Cultural Adaptation Engine)
- **`H6` Capability Gap**: `GAP-ITSAPLAN-VI-283` (Missing `vi` locale in `locales.ts`, `useDateFnsLocale.ts`, `user-preferences`, and `messages/vi/*.json`)
- **`H7` Execution Work Package**: `53.ACT.283` (`SPEC-ITSAPLAN-VIETNAMESE-I18N-283`)

### Phase 2 Bookending Contract (Task Goal, Pre-Mortem Stress Test, 360-Degree Multi-Lens Feedback & DoD-1..5)
- **Task Goal (4-Block Statement)**:
  - **Target & Scope**: Register `vi` (`🇻🇳` / `VN` flag, `Tiếng Việt` label) across `58_ITSAPLAN` web/API locale registries and generate all 33 Vietnamese namespace catalogs in `58_ITSAPLAN/apps/web/messages/vi/*.json`.
  - **Evaluation / Beneficiary Lens**: Selecting `VN Tiếng Việt` in the header `LocaleToggle` dropdown or Account Preferences switches the entire UI to idiomatic Vietnamese with 0 missing translation keys and 100% ICU variable compatibility.
  - **Fail-Fast Exclusion Criteria**: Any missing JSON namespace file (`< 33` files), any missing nested key relative to `messages/en/*.json`, or any corrupted ICU interpolation variable (`{variable}`) fails `tests/test_itsaplan_vietnamese_i18n_283.py`.
  - **Expected Output**: Idempotent generator `scripts/add_vietnamese_locale_to_itsaplan.py`, 33 governed `messages/vi/*.json` catalogs, updated web/API locale modules, and `0 FAIL` in `pytest`.
- **Phase 2 Pre-Mortem Stress Test (Inception Failure-Mode Analysis — `GW-P2-STRESS-360-01`)**:
  - **Failure Mode 1 (ICU Placeholder Corruption)**: Translating text inside `{count, plural, ...}` or `{name}` tokens breaks `next-intl` runtime formatting. *Mitigation*: `_extract_top_level_icu_vars()` deterministically verifies 100% variable parity on every leaf key across all 33 JSON files.
  - **Failure Mode 2 (Accept-Language Tag Negotiation Mismatch)**: Browsers sending `vi-VN,vi;q=0.9` fail to resolve to `'vi'` if prefix matching is not wired in both `apps/web/src/i18n/accept-language.ts` and `apps/api/src/modules/user-preferences/locale.ts`. *Mitigation*: Unit tests explicitly assert `vi-VN` resolves to `'vi'` in both web and API modules.
  - **Failure Mode 3 (Unlisted Locale Rejected by API Schema)**: Updating only frontend `LOCALES` causes `PATCH /api/v1/user/preferences` with `{"locale": "vi"}` to fail Elysia validation. *Mitigation*: Add `t.Literal('vi')` to `apps/api/src/modules/user-preferences/model.ts`.
- **Phase 2 360-Degree Multi-Lens Feedback Matrix (`GW-P2-STRESS-360-01`)**:
  - **Upward Lens (Human / Strategic Alignment — `HUM`)**: Delivers native Vietnamese UX for ACCORD (`58_ITSAPLAN`) aligned with brand terminology (`Không gian làm việc`, `Bảng điều khiển`, `Ngôn ngữ`).
  - **Downward Lens (Beneficiary / UX Impact — `GW-DELIV-SANITY-01`)**: Ensures Vietnamese users see `🇻🇳 Tiếng Việt` in `LocaleToggle` and localized dates via `date-fns/locale/vi`.
  - **Lateral Peer Lens (Engineering & Architecture — `AGT`)**: Preserves 1:1 structural parity across all 33 JSON namespaces without altering component call sites.
  - **Adversarial Governance Lens (Security, FinOps & QualityGate — `DET`)**: Rejects unsupported locale codes, enforces UTF-8 NFC encoding, and verifies zero canary residuals (`GW-CANARY-01`).
- **Definition of Done (`DoD-1..5`)**:
  - [x] `DoD-1` (`TC-ITSAPLAN-VIETNAMESE-I18N-283-01`): `vi` (`🇻🇳` / `VN` flag, `Tiếng Việt` label) is registered in `locales.ts`, `useDateFnsLocale.ts`, and `apps/api/src/modules/user-preferences/{locale.ts,model.ts}`.
  - [x] `DoD-2` (`TC-ITSAPLAN-VIETNAMESE-I18N-283-02`): All 33 JSON files exist in `58_ITSAPLAN/apps/web/messages/vi/*.json` with 100% nested key parity and 100% ICU variable parity against `messages/en/*.json`.
  - [x] `DoD-3` (`TC-ITSAPLAN-VIETNAMESE-I18N-283-03`): Upstream UTOP specification (`docs/specs/SPEC-ITSAPLAN-VIETNAMESE-I18N-283.md`), `TC-ITSAPLAN-VIETNAMESE-I18N-283_data.json` (`MinTC >= 12`), and generator script pass `MicroUTOPScaffolder.validate(..., require_stress_360=True)`.
  - [x] `DoD-4` (`TC-ITSAPLAN-VIETNAMESE-I18N-283-04`): `pytest tests/test_itsaplan_vietnamese_i18n_283.py -v` passes with `0 FAIL`.
  - [x] `DoD-5` (`TC-ITSAPLAN-VIETNAMESE-I18N-283-05`): Headless Playwright visual proof confirms `VN Tiếng Việt` in the language switcher dropdown and `GW-CANARY-01` `residual_count == 0`.

---

## 2. Functional Requirements Catalog

### `FR-ITSAPLAN-VIETNAMESE-I18N-283-01`: Frontend & Backend Locale Registry (`vi`)
The system shall register `'vi'` in `apps/web/src/i18n/locales.ts` (`LOCALES`, `LOCALE_LABELS['vi'] = 'Tiếng Việt'`, `LOCALE_FLAGS['vi'] = '🇻🇳'`), `apps/web/src/hooks/useDateFnsLocale.ts` (`date-fns/locale` `vi`), and `apps/api/src/modules/user-preferences/{locale.ts,model.ts}` (`t.Literal('vi')`).

### `FR-ITSAPLAN-VIETNAMESE-I18N-283-02`: 33-Namespace Vietnamese Message Catalog Parity
The system shall provide all 33 JSON message catalog files under `58_ITSAPLAN/apps/web/messages/vi/*.json` with 100% nested key parity against `58_ITSAPLAN/apps/web/messages/en/*.json`.

### `FR-ITSAPLAN-VIETNAMESE-I18N-283-03`: ICU MessageFormat Variable & Plural Integrity
Every translated Vietnamese message string in `messages/vi/*.json` shall preserve the exact top-level ICU interpolation variables (`{var}`, `{count, plural, ...}`) present in the corresponding `messages/en/*.json` entry.

### `FR-ITSAPLAN-VIETNAMESE-I18N-283-04`: Idiomatic Vietnamese Enterprise Terminology
Core UI namespaces (`common.json`, `nav.json`, `meta.json`, `auth.json`, `dashboard.json`) shall use idiomatic Vietnamese terminology (`Ngôn ngữ`, `Lưu`, `Hủy`, `Tìm kiếm hoặc chạy lệnh…`) while preserving the `ACCORD` product brand identity.

### `FR-ITSAPLAN-VIETNAMESE-I18N-283-05`: Headless Visual Proof & Canary Zero-Residual Gate
The system shall verify Vietnamese locale rendering via headless Playwright visual proof (`itsaplan_vietnamese_locale_verified.png`) and enforce `GW-CANARY-01` (`residual_count == 0`).

---

## 3. Declarative BDD Gherkin Specifications

```gherkin
Feature: Vietnamese (vi / Tiếng Việt) Localization across ItsAPlan Web and API
  As a Vietnamese enterprise project manager using ACCORD (ItsAPlan)
  I want to select "VN Tiếng Việt" in the language switcher and user preferences
  So that all 33 application namespaces, dates, and navigation controls render in idiomatic Vietnamese.

  Scenario: Registering and negotiating Vietnamese locale across Web and API
    Given "vi" is registered in LOCALES, LOCALE_LABELS as "Tiếng Việt", and LOCALE_FLAGS as "🇻🇳"
    When a browser sends Accept-Language header "vi-VN,vi;q=0.9,en-US;q=0.8" or updates user preferences to "vi"
    Then both web and API locale resolvers return "vi" and useDateFnsLocale maps "vi" to the date-fns Vietnamese locale

  Scenario: Enforcing 100% key and ICU variable parity across all 33 message namespaces
    Given the 33 canonical English JSON files in apps/web/messages/en/*.json
    When the Vietnamese catalog suite in apps/web/messages/vi/*.json is audited
    Then all 33 JSON filenames, nested dot-separated keys, and top-level ICU placeholders match 100% with zero empty strings

  Scenario: Rejecting unsupported locale codes and corrupted ICU placeholders
    Given an adversarial locale payload such as "tlh-KL" or a translation missing required ICU placeholder "{count}"
    When the schema validator and ICU parity verifier inspect the payload
    Then the validator rejects the invalid locale and flags the ICU placeholder mismatch before deployment
```

---

## 4. Test Case Specifications (TC-SPECS) & MinTC Boundary Data

| Test Case ID | Traced FR ID | Expected Verdict | Boundary / Edge Condition |
| :--- | :--- | :---: | :--- |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-01` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-01` | `PASS` | `'vi'`, `'Tiếng Việt'`, and `'🇻🇳'` registered in `apps/web/src/i18n/locales.ts` |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-02` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-01` | `PASS` | `useDateFnsLocale.ts` maps `'vi'` to `date-fns/locale` `vi` |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-03` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-01` | `PASS` | `apps/api/src/modules/user-preferences/{locale.ts,model.ts}` accepts `t.Literal('vi')` and `vi-VN` |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-04` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-02` | `PASS` | All 33 namespace JSON files exist in `apps/web/messages/vi/*.json` |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-05` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-02` | `PASS` | 100% nested key parity between `messages/en/*.json` and `messages/vi/*.json` |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-06` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-03` | `PASS` | 100% top-level ICU placeholder parity across all 33 Vietnamese catalogs |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-07` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-04` | `PASS` | Idiomatic Vietnamese labels (`Ngôn ngữ`, `Lưu`, `Hủy`) and visual proof (`residual_count == 0`) |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-08` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-01` | `REJECT` | Adversarial unsupported locale code (`"xx-INVALID"`) rejected by API preference model |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-09` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-02` | `REJECT` | Missing namespace JSON file (`< 33` files in `messages/vi/`) rejected by parity check |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-10` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-02` | `REJECT` | Missing or extra nested translation key in any `messages/vi/*.json` catalog rejected |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-11` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-03` | `REJECT` | Mutated or dropped ICU interpolation placeholder (`{count}` -> `{so_luong}`) rejected |
| `TC-ITSAPLAN-VIETNAMESE-I18N-283-12` | `FR-ITSAPLAN-VIETNAMESE-I18N-283-05` | `REJECT` | Residual `__CANARY_VERIFY__` token in source or JSON catalogs rejected by `GW-CANARY-01` |

---

## 5. Scope Cutlines & Non-Goals Fences

### Priority Cutlines
- **P0**: Register `vi` across Web + API, generate all 33 `messages/vi/*.json` catalogs with 100% key/ICU parity, and verify with automated pytest suite.
- **P1**: Headless Playwright visual proof of `VN Tiếng Việt` in `LocaleToggle` and date-fns `vi` integration.
- **P2**: Automated glossary refinement for specialized domain plugins.

### Explicit Non-Goals (Boundary Fences)
- [NON-GOAL] Will NOT alter database tables or perform destructive DDL/DML migrations.
- [NON-GOAL] Will NOT remove or modify existing locales (`en`, `uk`, `ru`, `zh-CN`, `ar`, `fr`, `pt-BR`, `id`, `es-ES`).
- [NON-GOAL] Will NOT introduce external paid translation API dependencies at runtime.

---

## 6. Metrics Duality Hierarchy

| Metric Type | Metric Name | Target / Guardrail | Description |
| :--- | :--- | :--- | :--- |
| **Leading Indicator** | Namespace & ICU Key Parity | `33/33 files, 100% keys, 0 ICU diffs` | Deterministic structural and placeholder parity against `messages/en` |
| **Lagging Indicator** | Vietnamese UI Runtime Defect Rate | `0 missing translation warnings` | Zero `MISSING_MESSAGE` or `FORMATTING_ERROR` exceptions in `next-intl` |

---
*Micro-UTOP Specification for `ITSAPLAN-VIETNAMESE-I18N-283` sealed with P=1 determinism.*
