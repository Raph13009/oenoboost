# GitHub Issue workflow

GitHub Issues are the source of truth for OenoBoost development in this monorepo.

## Flow

**Issue → Development → Human product review → Full QA (`npm run qa:full`) → Merge**

## Recommended issue structure

```markdown
## Context

## Expected behaviour

## Acceptance Criteria

## Regression requirements

## QA scenarios
```

## Rules for implementers

- Use the Issue as the product contract.
- Do not invent product behavior beyond what is written.
- If something is ambiguous, ask instead of guessing.
- Add regression / QA coverage for the scenarios listed in the Issue when the feature ships.
- Keep `docs/DATABASE_SCHEMA.sql` (and app/CMS schema references) synchronized when DB structure changes.
