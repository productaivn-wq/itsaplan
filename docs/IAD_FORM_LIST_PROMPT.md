<!-- GOVERNED_ITSAPLAN_IAD_PROMPT_ADAPTER: UTOP:iad_form_list_prompt (PromptDBStore id=224 v1) -->
# ItsAPlan / ACCORD Prompt Adapter: IAD_FORM_LIST_PROMPT.md

> **Role**: Detailed Form Catalog (`iad_forms.md` & `iad_forms.csv` with `wbs_id` bijection + `<=6` schema inputs)  
> **Upstream SSOT**: `UTOP:iad_form_list_prompt` (`PromptDBStore id=224 v1` in `data/project_management.db`) + `53.ACT.550`  
- **ItsAPlan 1:1 WBS & Lineage Extension**: Include `wbs_id` as column 1 alongside `table_name`, all required prompt columns, and `uc_refs`/`fr_refs` so every CSV row maps 1:1 deterministically (`P=1`) back to `docs/iad.md`, `docs/erd.md`, `docs/FIELD_PERMISSION_MATRIX.md`, `docs/STATUS_ACTION_MATRIX.md`, `docs/function_list.md`, and `docs/function_rules.md`.

---

# You are a UI/UX Engineer cum Business Analyst. I want you to generate an exhaustive, self-explaining Form list for our software based on the following context.

# IAD:
{{IAD_CONTENT}}

# ERD (Data Dict) in CSV:
{{DATA_DICT_CSV}}

# Format of your answer:
## Output MUST follow CSV format:
table_name,form_name,form_type,fields,options,validation_rules,self_explaining_guidance,validation_error_notice

## Rules:
1. **MECE Principle**: Follow MECE principles in generating forms directly mapped to the IAD and ERD entities.
2. **One Entity / Transaction Per Form**: Each form must target one primary entity or transactional event.
3. **Form Types**: Options include Create, Update, Stepper Form, Modal Form, Drawer Form, Multi-step Wizard.
4. **Options & Validation**: Clearly enumerate selectable values (dropdowns, radio buttons, toggles) and validation constraints (e.g. required, min length, regex).
5. **Mandatory Self-Explaining Invariant**:
   - `self_explaining_guidance`: State the in-form helper text and tooltip descriptions that explain the business purpose, units, and formatting expectations of each field to the user.
   - `validation_error_notice`: State the exact, exhaustive error notice displayed when input fails validation, clearly explaining (1) what failed, (2) which policy rule or constraint was violated, and (3) concrete correction guidance.
6. **Cognitive Chunking & Anti-Overwhelm Invariant (Rule of 6 — Zero 7+ Fields/Groups)**:
   - **Strict Field Ceiling**: No form, modal, drawer, or individual step/card SHALL contain 7 or more input fields (`field_count < 7`, max 5–6 fields per group/step) to prevent cognitive overload.
   - **Mandatory Progressive Disclosure**: Whenever an entity or transaction requires $\ge 7$ total fields:
     - MUST be partitioned into a `Stepper Form` (Multi-Step Wizard) with max 3–5 fields per step, OR
     - Segmented into collapsible/tabbed fieldset cards where each individual card/section strictly contains $\le 6$ fields.
   - **Flat 7+ Form Prohibition**: Flat single-screen forms containing $\ge 7$ fields without progressive grouping or stepping are strictly prohibited.
