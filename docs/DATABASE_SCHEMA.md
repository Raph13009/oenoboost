# Database schema — monorepo policy (issue #25)

## Canonical reference

**Single source of truth:** [`docs/DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql)

- Documentation / agent context only — **not** a bootstrap or migration runner.
- Incremental DDL that actually ships lives in `apps/web/supabase/migrations/`.
- App (`apps/web`) and CMS (`apps/cms`) share the same Supabase project; do **not** maintain divergent full schema dumps in each package.

## Package pointers

| Location | Role |
| --- | --- |
| `docs/DATABASE_SCHEMA.sql` | Canonical current schema reference |
| `apps/web/.cursor/rules/DATABASE_SCHEMA.md` | Pointer to the canonical file (Cursor context) |
| `apps/cms/docs/DATABASE_SCHEMA.md` | Pointer to the canonical file (CMS docs) |

Do not paste a second full schema into app or CMS. If agents need table definitions, open the canonical SQL file.

## When a feature changes the database

1. Add / update a migration under `apps/web/supabase/migrations/`.
2. Update `docs/DATABASE_SCHEMA.sql` in the **same** PR / commit set.
3. Leave the app/CMS pointer files as pointers (update their “last focused” note only if helpful).
4. Mention the schema update in the PR / Issue notes.

## Active vs legacy

- **Active AOP entity:** `public.aop` (int4 PK, comagri IDA). CMS + public app read/write this table.
- **Legacy:** uuid `public.appellations` (and related uuid junction tables) may still exist as historical backup — do not treat them as the editorial source of truth for new work.
