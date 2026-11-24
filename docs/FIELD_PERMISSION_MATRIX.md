# Field-Level Permission Matrix (ITSAPLAN v3.3.22)

- **SSOT Implementation**: `packages/db/src/permissions.ts` (`24` canonical `PERMISSION_RESOURCES`, `4` actions: `create`, `edit`, `read`, `delete`) + `apps/api/src/shared/features.ts` (`12` project feature flags).
- **Portfolio Registry**: `60` SSOT projects (`40` active / `20` archived) synchronized with live PostgreSQL.

| Domain / Surface | Canonical Resource Key | Admin / Owner | Member (`defaultMemberPermissions`) | Viewer | AI Agent Bot |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Project Metadata & Feature Flags (`12` flags) | `workflow_config:edit` | Full `C,R,E,D` | `read` | `read` | Denied |
| Destructive Project Controls | `danger_zone:edit` / `danger_zone:delete` | Full `Owner` | Denied | Denied | Denied |
| Work Items (Title, Column, Assignee, Labels, Estimate) | `work_items:create,edit,read,delete` | Full `C,R,E,D` | `allowAll` (`C,R,E,D`) | `read` | `create,edit,read` |
| Initiatives & Cycles (Start, Complete, Rollover) | `initiatives` / `cycles` | Full `C,R,E,D` | `allowAll` (`C,R,E,D`) | `read` | `read` |
| Docs & Note Boards | `documents` / `note_boards` | Full `C,R,E,D` | `allowAll` (`C,R,E,D`) | `read` | `create,edit,read` |
| AI Agents, Skills, Tools & Schedules | `ai_agents:edit` / `agent_skills:edit` / `agent_tools:edit` | Full `C,R,E,D` | `none` | `none` | Denied (cannot mutate own permissions) |
| Custom Fields, Issue Types & Templates | `custom_fields` / `issue_types` / `issue_templates` | Full `C,R,E,D` | `read` | `read` | `read` |
