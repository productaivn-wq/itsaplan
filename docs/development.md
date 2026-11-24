# Local development

Requirements: [Bun](https://bun.sh) 1.3+, Docker, Git.

## Setup

```bash
git clone https://github.com/productaivn-wq/itsaplan.git
cd itsaplan
bun install
bun run setup   # "Develop", or "Generate env" for just the .env files
bun run dev     # api + web together, via Turborepo
```

**Develop** writes the env files, generates the secrets, starts Postgres and RustFS, creates
the test database, and migrates both. Run it again any time: it restarts the stack and
re-applies the migrations, keeping the data. It offers another port when one is taken, and
offers to stop the **Try it** stack, which publishes the same ones.

`bun run dev` runs the workspace in watch mode: web on <http://localhost:3001>, api on
<http://localhost:3000>, RustFS console on <http://localhost:9001/rustfs/console/>. Only Postgres and RustFS
run in Docker; the apps run on the host.

## Environment

| File            | Read by                                       |
| --------------- | --------------------------------------------- |
| `.env`          | api, worker, bot, drizzle                     |
| `apps/web/.env` | web — Next reads env only from its own folder |
| `.env.test`     | the api test suite                            |

`.env.example` documents every variable and its default. The three secrets have none and are
generated while the database volume does not exist — past that the instance is using them,
and a new value would lock it out of its own data.

## Commands

Run everything from the repository root through Turborepo. Use `bun`, never npm, yarn, or
pnpm: the lockfile is `bun.lock`.

| Command               | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `bun run dev`         | all apps in watch mode                       |
| `bun run typecheck`   | `tsc --noEmit` across the workspace          |
| `bun run lint`        | ESLint                                       |
| `bun run format`      | Prettier, writes                             |
| `bun run db:generate` | generate a migration from the Drizzle schema |
| `bun run db:migrate`  | apply migrations                             |
| `bun run test`        | all test suites                              |

## Tests

Integration tests against a real Postgres, not mocks. The setup prepared a separate `*_test`
database with `.env.test` pointing at it; the name must contain "test", since the reset
helper TRUNCATEs every table between tests and refuses otherwise.

```bash
bun run test
```

The same gate CI runs — the suite against a throwaway Postgres, in a container built from
the production image:

```bash
docker compose -f docker-compose.test.yml build
docker compose -f docker-compose.test.yml run --rm api-test
```

The integration suite is in `apps/api`. `apps/api/AGENTS.md` explains how to write a test.

The mechanisms that span several apps — the revision engine, the interface languages — are
described in [`docs/dev/`](dev/).

## Runtime Subsystems (`apps/worker` & `apps/bot`)

### Background Worker (`apps/worker/src` — `23` modules)

| Module | Path | Responsibility |
| :--- | :--- | :--- |
| `agent-worker` | `apps/worker/src/agent-worker.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `backoff` | `apps/worker/src/backoff.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `canonical` | `apps/worker/src/canonical.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `config` | `apps/worker/src/config.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `cross-reference` | `apps/worker/src/cross-reference.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `delivery` | `apps/worker/src/delivery.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `env` | `apps/worker/src/env.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `import-store` | `apps/worker/src/import-store.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `import-worker` | `apps/worker/src/import-worker.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `index` | `apps/worker/src/index.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `notification-delivery` | `apps/worker/src/notification-delivery.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `notification-send` | `apps/worker/src/notification-send.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `plane-adapter` | `apps/worker/src/plane-adapter.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `poll-loop` | `apps/worker/src/poll-loop.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `reader` | `apps/worker/src/reader.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `schedule-timestamp` | `apps/worker/src/schedule-timestamp.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `schedules` | `apps/worker/src/schedules.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `signature` | `apps/worker/src/signature.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `store` | `apps/worker/src/store.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `telemetry-payload` | `apps/worker/src/telemetry-payload.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `telemetry-schedule` | `apps/worker/src/telemetry-schedule.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `telemetry` | `apps/worker/src/telemetry.ts` | Background queue, schedule, notification, telemetry, or import runtime module |
| `worker` | `apps/worker/src/worker.ts` | Background queue, schedule, notification, telemetry, or import runtime module |

### Telegram Bot Service (`apps/bot/src` — `5` modules)

| Module | Path | Responsibility |
| :--- | :--- | :--- |
| `bot` | `apps/bot/src/bot.ts` | Telegram supervisor, config, PostgreSQL bridge, or webhook handler |
| `config` | `apps/bot/src/config.ts` | Telegram supervisor, config, PostgreSQL bridge, or webhook handler |
| `db` | `apps/bot/src/db.ts` | Telegram supervisor, config, PostgreSQL bridge, or webhook handler |
| `index` | `apps/bot/src/index.ts` | Telegram supervisor, config, PostgreSQL bridge, or webhook handler |
| `supervisor` | `apps/bot/src/supervisor.ts` | Telegram supervisor, config, PostgreSQL bridge, or webhook handler |
