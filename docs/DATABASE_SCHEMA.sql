-- OenoBoost — canonical database schema reference (documentation only).
-- Not a bootstrap / migration script. Source of truth for incremental DDL:
--   apps/web/supabase/migrations/
-- Keep this file in sync when the shared Supabase schema changes.
--
-- Policy / pointers (issue #25): docs/DATABASE_SCHEMA.md
--   apps/web/.cursor/rules/DATABASE_SCHEMA.md  → pointer only
--   apps/cms/docs/DATABASE_SCHEMA.md           → pointer only
--
-- Last focused updates:
--   #24 — public.aop.recognition_year (year-only)
--   #21 — public.wine_region_history_milestones

-- WARNING: Table order and constraints may not be valid for execution.
-- Legacy uuid `public.appellations` still exists as historical backup; the
-- CMS and public app read/write the int4 `public.aop` entity below.

CREATE TABLE public.aop (
  id integer NOT NULL,
  name text NOT NULL,
  area_m2 double precision,
  slug character varying NOT NULL,
  area_hectares numeric,
  producer_count integer,
  production_volume_hl integer,
  price_range_min_eur numeric,
  price_range_max_eur numeric,
  history_fr text,
  history_en text,
  colors_grapes_fr text,
  colors_grapes_en text,
  soils_description_fr text,
  soils_description_en text,
  is_premium boolean NOT NULL DEFAULT true,
  status character varying NOT NULL DEFAULT 'published'::character varying,
  published_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  is_grand_cru boolean NOT NULL DEFAULT false,
  wine_pct_red smallint,
  wine_pct_white smallint,
  wine_pct_sparkling smallint,
  wine_pct_liqueur smallint,
  climate_fr text,
  climate_en text,
  wine_pct_rose smallint,
  -- Year the appellation was recognized as AOP/AOC (e.g. 1936). NULL if unknown.
  -- Year-only on purpose: do not store invented month/day.
  recognition_year smallint,
  CONSTRAINT aop_pkey PRIMARY KEY (id),
  CONSTRAINT aop_status_check CHECK (
    (status)::text = ANY (
      ARRAY[
        'draft'::character varying,
        'published'::character varying,
        'archived'::character varying
      ]::text[]
    )
  ),
  CONSTRAINT aop_recognition_year_range CHECK (
    recognition_year IS NULL
    OR (recognition_year >= 1800 AND recognition_year <= 2100)
  ),
  CONSTRAINT aop_wine_pct_red_range CHECK (
    wine_pct_red IS NULL OR (wine_pct_red >= 0 AND wine_pct_red <= 100)
  ),
  CONSTRAINT aop_wine_pct_rose_range CHECK (
    wine_pct_rose IS NULL OR (wine_pct_rose >= 0 AND wine_pct_rose <= 100)
  ),
  CONSTRAINT aop_wine_pct_white_range CHECK (
    wine_pct_white IS NULL OR (wine_pct_white >= 0 AND wine_pct_white <= 100)
  ),
  CONSTRAINT aop_wine_pct_sparkling_range CHECK (
    wine_pct_sparkling IS NULL OR (wine_pct_sparkling >= 0 AND wine_pct_sparkling <= 100)
  ),
  CONSTRAINT aop_wine_pct_liqueur_range CHECK (
    wine_pct_liqueur IS NULL OR (wine_pct_liqueur >= 0 AND wine_pct_liqueur <= 100)
  ),
  CONSTRAINT aop_wine_pct_sum_100 CHECK (
    (
      wine_pct_red IS NULL
      AND wine_pct_rose IS NULL
      AND wine_pct_white IS NULL
      AND wine_pct_sparkling IS NULL
      AND wine_pct_liqueur IS NULL
    )
    OR (
      COALESCE(wine_pct_red, 0)
      + COALESCE(wine_pct_rose, 0)
      + COALESCE(wine_pct_white, 0)
      + COALESCE(wine_pct_sparkling, 0)
      + COALESCE(wine_pct_liqueur, 0)
    ) <= 100
  )
);

CREATE UNIQUE INDEX aop_slug_idx ON public.aop (slug);

-- Issue #21: ordered history milestones for wine regions (CMS-managed timeline).
-- Period labels are free text (not typed dates). Parent: public.wine_regions.
CREATE TABLE public.wine_region_history_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL,
  milestone_order integer NOT NULL,
  period_label_fr character varying(100) NOT NULL DEFAULT ''::character varying,
  period_label_en character varying(100) NOT NULL DEFAULT ''::character varying,
  title_fr character varying(255) NOT NULL DEFAULT ''::character varying,
  title_en character varying(255) NOT NULL DEFAULT ''::character varying,
  detail_fr text,
  detail_en text,
  icon_url text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wine_region_history_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT wine_region_history_milestones_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.wine_regions(id) ON DELETE CASCADE,
  CONSTRAINT wine_region_history_milestones_region_order_unique UNIQUE (region_id, milestone_order)
);

CREATE INDEX idx_wine_region_history_milestones_region
  ON public.wine_region_history_milestones (region_id);
