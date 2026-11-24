import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function resolveConnectionString(): string | undefined {
  if (process.env.ITSAPLAN_RESOLVED_DATABASE_URL) {
    return process.env.ITSAPLAN_RESOLVED_DATABASE_URL;
  }
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  if (raw.startsWith('vault://') || raw.endsWith('/task_manager')) {
    return 'postgresql://postgres:postgres_local@127.0.0.1:5432/itsaplan';
  }
  return raw;
}

const connectionString = resolveConnectionString();
if (connectionString) {
  process.env.DATABASE_URL = connectionString;
}

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Check your .env (see .env.example at the monorepo root).',
  );
}

// One connection per process. postgres-js manages the pool internally.
const queryClient = postgres(connectionString, { prepare: false });

export const db = drizzle(queryClient, { schema });

// Either the plain db or a transaction, for a function whose caller may need to
// share one transaction across several reads/writes that must observe the same
// snapshot (a lock taken, then a read, then a write, all inside one db.transaction).
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
