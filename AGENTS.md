# OenoBoost Agent Instructions

## Standard workflow

**GitHub Issue → Development → Human Product Review → Full QA → Merge**

1. Treat the GitHub Issue as the product contract.
2. Implement only what the Issue specifies. If ambiguous, ask — do not invent product behavior.
3. During development / visual iteration, run **targeted** checks only (`qa:app`, `qa:cms`, unit tests, lint on touched packages).
4. Do **not** run `npm run qa:full` until the user explicitly says the feature is product-approved / ready for QA.
5. After product approval, run full QA. Human approval remains required before merge.

## When full QA fails

1. Inspect the actual failure (logs, Playwright HTML report, screenshots, videos, traces).
2. Decide whether it is a real regression, flaky test, environment issue, or product ambiguity.
3. Fix the implementation (preferred) or fix a genuinely wrong/flaky test with an explanation.
4. Re-run the failing tests, then re-run full QA.
5. **Maximum autonomous repair cycles: 4.** After 4 unsuccessful cycles: stop, summarize remaining failures clearly, and ask for human input.

## Critical test rule

**Never change or weaken a test simply to make CI green.**

A test may only be updated when:
- expected product behavior intentionally changed, or
- the test itself is genuinely wrong / flaky,

…and that reason is explained clearly.

Bug fixes should add a permanent regression test whenever reasonably possible.

## Issue template (source of truth)

```markdown
## Context

## Expected behaviour

## Acceptance Criteria

## Regression requirements

## QA scenarios
```

## Commands

See `docs/QA.md`.

## Database schema reference (issue #25)

- **Canonical file:** `docs/DATABASE_SCHEMA.sql` (documentation only; migrations live in `apps/web/supabase/migrations/`).
- **Policy:** `docs/DATABASE_SCHEMA.md`.
- App and CMS keep **pointers only** (`apps/web/.cursor/rules/DATABASE_SCHEMA.md`, `apps/cms/docs/DATABASE_SCHEMA.md`) — do not maintain divergent full dumps.
- Any DB-impacting Issue/PR must update the canonical SQL in the same change set.
