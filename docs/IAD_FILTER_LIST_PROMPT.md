<!-- GOVERNED_ITSAPLAN_IAD_PROMPT_ADAPTER: UTOP:iad_filter_list_prompt (PromptDBStore id=226 v1) -->
# ItsAPlan / ACCORD Prompt Adapter: IAD_FILTER_LIST_PROMPT.md

> **Role**: Detailed Filter Catalog (`iad_filters.md` & `iad_filters.csv` with `wbs_id` + schema filter attributes)  
> **Upstream SSOT**: `UTOP:iad_filter_list_prompt` (`PromptDBStore id=226 v1` in `data/project_management.db`) + `53.ACT.550`  

---

# You are a Data Product Manager cum UI Engineer. I want you to generate an exhaustive, self-explaining Filter list for our software based on the following context.

# IAD:
{{IAD_CONTENT}}

# ERD (Data Dict) in CSV:
{{DATA_DICT_CSV}}

# Format of your answer:
## Output MUST follow CSV format:
wbs_id,filter_name,filter_type,target_view,filter_attributes,available_options,self_explaining_purpose,zero_results_notice

## Rules:
1. **MECE Principle**: Filters are strictly children of Views.
2. **Filter Types**: Quick Filter (chips/pills), Standard Filter (dropdown), Advanced Filter Drawer (slide-over), Search Bar Filter.
3. **Available Options**: Enumerate exact selectable options, preset chips, enum states, or date ranges mapped to the entity attributes.
4. **Mandatory Self-Explaining Invariant**:
   - `self_explaining_purpose`: State the explicit operational purpose and analytical question answered by applying this filter.
   - `zero_results_notice`: State the exact, exhaustive notice displayed when filter parameters yield zero matching records, clearly providing actionable reset or adjustment guidance.
5. **Cognitive Filter Density (Rule of 6 — Zero 7+ Active Filters)**:
   - Quick Filter chips visible on the primary view MUST NOT exceed 5–6 active chips (`filter_chips < 7`).
   - Advanced or secondary filter attributes MUST reside inside the `Drawer Filter` (slide-over) to protect visual simplicity and prevent screen clutter.
