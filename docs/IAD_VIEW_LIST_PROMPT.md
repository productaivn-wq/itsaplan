<!-- GOVERNED_ITSAPLAN_IAD_PROMPT_ADAPTER: UTOP:iad_view_list_prompt (PromptDBStore id=223 v1) -->
# ItsAPlan / ACCORD Prompt Adapter: IAD_VIEW_LIST_PROMPT.md

> **Role**: Detailed View Catalog (`iad_views.md` & `iad_views.csv` with `wbs_id` bijection + `<=6` schema columns)  
> **Upstream SSOT**: `UTOP:iad_view_list_prompt` (`PromptDBStore id=223 v1` in `data/project_management.db`) + `53.ACT.550`  
- **ItsAPlan 1:1 WBS & Lineage Extension**: Include `wbs_id` as column 1 alongside `table_name`, all required prompt columns, and `uc_refs`/`fr_refs` so every CSV row maps 1:1 deterministically (`P=1`) back to `docs/iad.md`, `docs/erd.md`, `docs/FIELD_PERMISSION_MATRIX.md`, `docs/STATUS_ACTION_MATRIX.md`, `docs/function_list.md`, and `docs/function_rules.md`.

---

# You are a Data Engineer cum Business Analyst. I want you to generate a comprehensive, self-explaining View list for our software based on the following context.

# IAD:
{{IAD_CONTENT}}

# ERD (Data Dict) in CSV:
{{DATA_DICT_CSV}}

# Format of your answer:
## Output MUST follow CSV format:
table_name,view_name,fields,view_purpose,empty_state_notice,error_state_notice

## Rules:
1. **MECE Principle**: Follow MECE (Mutually Exclusive, Collectively Exhaustive) principles in generating views directly mapped to the ERD and IAD.
2. **One Entity Per View**: Each view in the IAD must be represented by its primary entity in the ERD.
3. **Valid Schema Attributes**: Only include fields that explicitly exist in the target entity data dictionary.
4. **Mandatory Self-Explaining Invariant**:
   - `view_purpose`: Explicitly state the operational objective and business goal of the view.
   - `empty_state_notice`: State the self-explaining message and user action shown when zero records are returned.
   - `error_state_notice`: State the self-explaining message and remediation guidance shown if data retrieval fails or permissions are denied.
5. **Cognitive Ergonomics & View Density Invariant (Rule of 6 — Zero 7+ Visible Fields/Groups)**:
   - **Strict Density Ceiling**: No view (Table, Card View, Detail View, Kanban, List) SHALL render 7 or more primary data fields/columns or data groups concurrently on initial load without progressive disclosure (`visible_fields < 7`, max 5–6 visible items) to prevent information overwhelm.
   - **Table & List Density**: Default visible columns are capped at 5–6 primary identifier and status attributes. Secondary/deep attributes MUST be placed in an on-demand detail drawer, modal, or expandable row panel.
   - **Card View Density**: A single card MUST NOT contain 7 or more data badges, labels, or metrics. Limit to 3–5 key attributes + 1 status badge + primary action.
   - **Detail View Grouping**: Detailed entity views with $\ge 7$ attributes MUST be organized into distinct visual cards or tabs, with each individual card/tab containing $\le 6$ attributes.
