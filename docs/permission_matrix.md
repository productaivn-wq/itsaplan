# Permission Matrix & Security Rules

- **identifier**: `PERM-ITSAPLAN-v3.3.25`
- **version**: `3.3.25`
- **ssot_code**: `packages/db/src/permissions.ts` (`PERMISSION_RESOURCES` — `24` resources, `PERMISSION_ACTIONS` — `create`, `edit`, `read`, `delete`)

## Section 1 — Project RBAC Role Baseline (`defaultMemberPermissions`)

| Resource (`PERMISSION_RESOURCES`) | Owner / Team Admin | Member (`defaultMemberPermissions`) | Viewer | AI Agent Bot |
| :--- | :--- | :--- | :--- | :--- |
| `work_items`, `initiatives`, `cycles`, `documents`, `note_boards` | `allowAll` (`C,R,E,D`) | `allowAll` (`create,edit,read,delete`) | `read` only | Explicit `team_role` grants (`0` destructive `delete_*` by default) |
| `dashboards`, `views`, `labels`, `issue_types`, `custom_fields`, `issue_templates` | `allowAll` (`C,R,E,D`) | `read` (or team-role CRUD) | `read` | `read` (unless role granted) |
| `members_invite`, `members_manage`, `states`, `workflow_config`, `actions`, `webhooks`, `repositories`, `import_export`, `ai_agents`, `agent_skills`, `agent_tools`, `integrations` | `allowAll` (`C,R,E,D`) | Restricted (`none` unless custom role) | `none` | Denied (Tier-2 Owner/Admin only) |
| `danger_zone` (Project Delete / Archive) | `Owner` / `Admin` | Denied | Denied | Strictly Denied (`0` grants) |

## Section 2 — OpenOfficeContract & Governance Surfaces

| Action / Surface | Required Role / Gate | Owner | Member | Viewer / Agent | Enforcement Path & Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OpenOfficeContract` Approve / Rework | `GW-SOD-01` (`approver_id != executor_id`) | `ALLOW` | `ALLOW` (if not executor) | `DENY` (Agent self-approve) | `ACTIVE` |
| `OpenOfficeContract` Dispatch Task | Active project member (`work_items:create`) | `ALLOW` | `ALLOW` | `ALLOW` (Agent Worker) | `ACTIVE` |
| Team Settings (`/[teamRef]/settings/*` — `12` live pages) | Team Owner / Admin (`requireGod` / role check) | `ALLOW` | `READ` / Redirect | `DENY` | `ACTIVE` (`12` team-level routes live) |
| Project Settings Redirects (`/[projectKey]/settings/*` — `12` routes) | `<ProjectSettingsCutRedirect />` (`SPEC-284`) | Redirects | Redirects | Redirects | Redirects to team/project canonical surfaces |
| Frontend `/god` Index (`apps/web/src/app/god/page.tsx`) | UI entry permanently retired (`redirect('/')`) | Redirects | Redirects | Redirects | UI hidden; backend `/god/*` (`godRoutes`, `33` endpoints) active behind `requireGod(user)` |
