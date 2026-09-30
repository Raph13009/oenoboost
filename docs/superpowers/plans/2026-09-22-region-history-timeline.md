# Region history timeline (#21 + #8 nav/timeline) Implementation Plan

> **For agentic workers:** Inline execution in the parent session (user approved design B).

**Goal:** Editors manage ordered wine-region history milestones in the CMS; public app exposes a regions discovery entry, enriched region pages with key info + horizontal interactive timeline, and map access to the same page.

**Architecture:** Child table `wine_region_history_milestones` (vinification_steps pattern). CMS Historique card on `RegionEditor`. Public `/vignoble/regions` listing + nav entry; `/vignoble/[region]` shows key figures, horizontal timeline (hidden if empty), then subregions. Map popup gains a link to the region fiche.

**Tech Stack:** Supabase/Postgres, Next.js CMS + web, existing CMS drag-reorder pattern.

## Global Constraints

- Period labels are free text (not date/year columns) — client content uses periods like “XIIe siècle”.
- Optional field values; no invented/backfilled milestones.
- Optional `icon_url` text only (no new storage bucket).
- Do not redesign unrelated CMS/map UI.
- Update canonical schema refs when DB changes.
- Targeted checks only; no `qa:full` until product approval.

## Tasks

### Task 1: Migration + schema docs
- Create `apps/web/supabase/migrations/20260922150000_wine_region_history_milestones.sql`
- Apply via Supabase
- Update `docs/DATABASE_SCHEMA.sql`, `apps/cms/docs/DATABASE_SCHEMA.md`, `apps/web/.cursor/rules/DATABASE_SCHEMA.md`

### Task 2: CMS milestone CRUD
- Extend `apps/cms/app/admin/(cms)/wine-regions/actions.ts` with milestone types + CRUD/reorder
- Add Historique section to `RegionEditor.tsx` (clone vinification steps UI)

### Task 3: Public data + timeline UI
- Types + `getRegionHistoryMilestones` query
- `region-history-timeline.tsx` (horizontal, select → detail)
- Enrich `[region]/page.tsx` with key info + timeline
- `/vignoble/regions` listing + mobile-menu nav entry (like AOP)
- Map region card link to `/vignoble/{slug}`

### Task 4: i18n + targeted checks
- FR/EN dictionary strings
- CMS unit test if validation helpers added; `npm test` in cms; lint/typecheck touched packages
---
