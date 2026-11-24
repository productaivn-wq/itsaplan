# ItsAPlan Stateless OAuth2 Relay (`auth.itsaplan.com`)

A zero-database, zero-storage OAuth2 relay for packaged self-hosted ItsAPlan deployments.

## Mode A (Stateless Relay) vs. Mode B (Sovereign BYO-App)

- **Mode A (Relay — 0 setup for clients):** Deploy this script once at `https://auth.itsaplan.com`. Self-hosted ItsAPlan instances set `ITSAPLAN_OAUTH_RELAY_URL=https://auth.itsaplan.com` (or enter it in the Integrations UI). Client tokens are exchanged in RAM and immediately returned to the client's own PostgreSQL `integration_credential` table — the relay stores **nothing**.
- **Mode B (Sovereign BYO-App — 0 external traffic):** Clients enter their own OAuth `clientId` and `clientSecret` directly inside ItsAPlan's Integrations drawer. No traffic leaves their infrastructure.

## Quick Start

```bash
PORT=8787 \
RELAY_PUBLIC_URL=https://auth.itsaplan.com \
RELAY_STATE_SECRET=$(openssl rand -hex 32) \
ALLOWED_RETURN_ORIGINS=https://plan.client-a.com,https://plan.client-b.com \
RELAY_GITHUB_CLIENT_ID=... \
RELAY_GITHUB_CLIENT_SECRET=... \
bun run scripts/oauth-relay/server.ts
```

## Provider Review Notes for Public SaaS / Packaged Clients

- **Free, zero-audit:** GitHub, Atlassian (Jira/Confluence), Slack, Notion, Linear, Discord, Google Calendar (sensitive scope verification only).
- **1-time review when scaling:** Meta (Threads/Instagram App Review), Google Gmail/Drive restricted scopes (CASA Tier 2 — early clients can bypass CASA using Mode B with their own Google Workspace **Internal** OAuth app).
