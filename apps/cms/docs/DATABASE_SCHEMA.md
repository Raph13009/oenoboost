# OenoBoost — Database Schema (CMS pointer)

> **Canonical monorepo reference:** [`docs/DATABASE_SCHEMA.sql`](../../../docs/DATABASE_SCHEMA.sql)  
> **Policy (issue #25):** [`docs/DATABASE_SCHEMA.md`](../../../docs/DATABASE_SCHEMA.md)

This CMS package does **not** own a separate schema dump. The public app and CMS share one Supabase database. When you change the DB:

1. Ship a migration in `apps/web/supabase/migrations/`.
2. Update `docs/DATABASE_SCHEMA.sql` in the same change set.
3. Keep this file as a pointer only.

## Quick orientation for editors / agents

| Topic | Note |
| --- | --- |
| Active AOP table | `public.aop` (int4 PK) — not legacy uuid `appellations` |
| AOP ↔ subregion | `aop_subregion_link` → int4 `subregions` |
| AOP ↔ soil | `aop_soil_link` |
| AOP ↔ grape | `aop_grape_link` (`is_primary` = main vs accessory) |
| AOP DGC parent/child | `aop.is_dgc_parent` + `aop_dgc_link` (unique child) |
| Recognition year | `aop.recognition_year` (`smallint`, nullable, 1800–2100) |
| Region history | `wine_region_history_milestones` |
| Content status | `draft` / `published` / `archived` + soft delete via `deleted_at` where present |
| Bilingual fields | Usually `*_fr` / `*_en` (AOP `name` is a single column) |

For exact columns and constraints, always open the canonical SQL file.
