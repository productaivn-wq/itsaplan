<!-- GOVERNED_ITSAPLAN_IAD_PROMPT_ADAPTER: UTOP:iad_button_list_prompt (PromptDBStore id=225 v1) -->
# ItsAPlan / ACCORD Prompt Adapter: IAD_BUTTON_LIST_PROMPT.md

> **Role**: Detailed Button & Trigger Catalog (`iad_buttons.md` & `iad_buttons.csv` with `wbs_id` + API/notice links)  
> **Upstream SSOT**: `UTOP:iad_button_list_prompt` (`PromptDBStore id=225 v1` in `data/project_management.db`) + `53.ACT.550`  

---

# You are an Interaction Designer cum Frontend Engineer. I want you to generate an exhaustive, self-explaining Button and Interaction list for our software based on the following context.

# IAD:
{{IAD_CONTENT}}

# Views & Forms Hierarchy:
{{VIEWS_AND_FORMS_HIERARCHY}}

# Format of your answer:
## Output MUST follow CSV format:
wbs_id,button_name,button_type,parent_component,action_trigger,target_destination,self_explaining_purpose,confirmation_notice,failure_notice

## Rules:
1. **MECE Principle**: Every button in the IAD must have exactly one parent View or Form.
2. **Button Types**: Top Button (header level), Inline Button (row/card level), CTA Button (primary conversion/submit), Redirect Button.
3. **Target Destination**: Explicitly define where the user is led to: opens Modal/Drawer Form [WBS ID], navigates to View [WBS ID], or triggers API state transition.
4. **Mandatory Self-Explaining Invariant**:
   - `self_explaining_purpose`: State the explicit business outcome and prerequisites required before this button is actionable.
   - `confirmation_notice`: For financial, irreversible, or state-mutating actions (e.g. approval, deposit verification, quote dispatch, session revocation), specify the plain-language confirmation dialog explaining the consequences of the action.
   - `failure_notice`: State the exact, exhaustive error notice displayed if the action fails (e.g., 2-node Separation of Duties violation, unfulfilled prerequisite gate, network error).
5. **Cognitive Action Density (Rule of 6 — Zero 7+ Actions)**:
   - No single toolbar, view header, or form footer SHALL display 7 or more direct action buttons (`action_count < 7`, max 3–5 primary/secondary buttons) to prevent decision paralysis.
   - If $> 5$ actions are necessary, secondary actions MUST be grouped under a contextual menu ("..." more actions dropdown).
