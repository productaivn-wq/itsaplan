import { t } from 'elysia';

export const revQuery = t.Object({
  scopes: t.Optional(
    t.String({
      description:
        "Comma-separated scopes to read, each '<kind>:<id>' — board, documents, issue, initiative, inbox, project, or agents (by project/entity id).",
    }),
  ),
});

export const RevResponse = t.Object({ revs: t.Record(t.String(), t.String()) });
