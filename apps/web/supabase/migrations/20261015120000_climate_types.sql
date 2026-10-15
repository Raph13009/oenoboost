-- Issue #15 — Climate module (Météo-France 5-climate typology).
-- Geography: no invented climate polygons. Map colors existing wine_regions.geojson
-- via climate_wine_region_link (N:N, is_primary for dominant climate).
-- Source: https://meteofrance.com/changement-climatique/le-climat-en-france-hexagonale-et-corse

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.climate_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name_fr text not null,
  name_en text not null,
  color_hex text,
  definition_fr text,
  definition_en text,
  characteristics_fr text,
  characteristics_en text,
  temperature_amplitude_fr text,
  temperature_amplitude_en text,
  rainfall_fr text,
  rainfall_en text,
  sunshine_fr text,
  sunshine_en text,
  frost_hail_risk_fr text,
  frost_hail_risk_en text,
  vine_wine_impact_fr text,
  vine_wine_impact_en text,
  carousel_order integer,
  is_premium boolean not null default false,
  status character varying not null default 'published',
  published_at timestamp without time zone default now(),
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  deleted_at timestamp without time zone,
  constraint climate_types_slug_key unique (slug),
  constraint climate_types_status_check check (
    (status)::text = any (
      array[
        'draft'::character varying,
        'published'::character varying,
        'archived'::character varying
      ]::text[]
    )
  )
);

create index if not exists climate_types_carousel_order_idx
  on public.climate_types (carousel_order)
  where deleted_at is null;

create table if not exists public.climate_wine_region_link (
  climate_id uuid not null references public.climate_types(id) on delete cascade,
  region_id uuid not null references public.wine_regions(id) on delete cascade,
  is_primary boolean not null default false,
  constraint climate_wine_region_link_pkey primary key (climate_id, region_id)
);

create index if not exists climate_wine_region_link_region_idx
  on public.climate_wine_region_link (region_id);

-- At most one primary climate per wine region.
create unique index if not exists climate_wine_region_link_primary_region_uidx
  on public.climate_wine_region_link (region_id)
  where is_primary;

create table if not exists public.climate_grape_link (
  climate_id uuid not null references public.climate_types(id) on delete cascade,
  grape_id uuid not null references public.grapes(id) on delete cascade,
  constraint climate_grape_link_pkey primary key (climate_id, grape_id)
);

create index if not exists climate_grape_link_grape_idx
  on public.climate_grape_link (grape_id);

-- ---------------------------------------------------------------------------
-- Favorites CHECK extensions
-- ---------------------------------------------------------------------------

alter table public.favorites drop constraint if exists favorites_content_type_check;
alter table public.favorites
  add constraint favorites_content_type_check
  check (
    (content_type)::text = any (
      array[
        'aop'::character varying,
        'grape'::character varying,
        'soil_type'::character varying,
        'vinification_type'::character varying,
        'dictionary_term'::character varying,
        'climate_type'::character varying
      ]::text[]
    )
  );

alter table public.favorites drop constraint if exists favorites_module_check;
alter table public.favorites
  add constraint favorites_module_check
  check (
    (module)::text = any (
      array[
        'vignoble'::character varying,
        'cepages'::character varying,
        'sols'::character varying,
        'vinification'::character varying,
        'dictionnaire'::character varying,
        'climat'::character varying
      ]::text[]
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (mirror soil_types / content tables)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete, truncate, references, trigger
  on public.climate_types to anon, authenticated, service_role;
grant select, insert, update, delete, truncate, references, trigger
  on public.climate_wine_region_link to anon, authenticated, service_role;
grant select, insert, update, delete, truncate, references, trigger
  on public.climate_grape_link to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPC: region features colored by primary climate
-- ---------------------------------------------------------------------------

create or replace function public.get_climate_map_geojson()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_build_object(
      'type', 'FeatureCollection',
      'features', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'id', wr.id,
              'properties', jsonb_build_object(
                'region_id', wr.id,
                'region_slug', wr.slug,
                'region_name_fr', wr.name_fr,
                'region_name_en', wr.name_en,
                'climate_id', ct.id,
                'climate_slug', ct.slug,
                'climate_name_fr', ct.name_fr,
                'climate_name_en', ct.name_en,
                'color_hex', coalesce(ct.color_hex, wr.color_hex, '#888888'),
                'secondary_climate_slugs', (
                  select coalesce(jsonb_agg(ct2.slug order by ct2.carousel_order), '[]'::jsonb)
                  from public.climate_wine_region_link l2
                  join public.climate_types ct2 on ct2.id = l2.climate_id
                  where l2.region_id = wr.id
                    and l2.is_primary = false
                    and ct2.deleted_at is null
                    and ct2.status = 'published'
                )
              ),
              'geometry', wr.geojson
            )
            order by wr.map_order nulls last, wr.name_fr
          )
          from public.wine_regions wr
          join public.climate_wine_region_link l
            on l.region_id = wr.id and l.is_primary = true
          join public.climate_types ct
            on ct.id = l.climate_id
          where wr.deleted_at is null
            and wr.status = 'published'
            and wr.geojson is not null
            and ct.deleted_at is null
            and ct.status = 'published'
        ),
        '[]'::jsonb
      )
    ),
    jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb)
  );
$$;

grant execute on function public.get_climate_map_geojson() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed: 5 climates (fixed UUIDs for stable links)
-- ---------------------------------------------------------------------------

-- océanique
insert into public.climate_types (
  id, slug, name_fr, name_en, color_hex, carousel_order, is_premium, status, published_at,
  definition_fr, definition_en,
  characteristics_fr, characteristics_en,
  temperature_amplitude_fr, temperature_amplitude_en,
  rainfall_fr, rainfall_en,
  sunshine_fr, sunshine_en,
  frost_hail_risk_fr, frost_hail_risk_en,
  vine_wine_impact_fr, vine_wine_impact_en
) values (
  'a1111111-1111-4111-8111-111111111101',
  'oceanique',
  'Océanique',
  'Oceanic',
  '#3b82f6',
  1,
  false,
  'published',
  now(),
  'Climat tempéré dominé par les masses d''air atlantiques : hivers doux, étés modérés, humidité régulière.',
  'Temperate climate dominated by Atlantic air masses: mild winters, moderate summers, steady humidity.',
  'Façade atlantique et vallées ouvertes à l''ouest. Perturbations fréquentes, saisons peu contrastées, vents d''ouest dominants.',
  'Atlantic façade and west-facing valleys. Frequent weather systems, mild seasonal contrast, prevailing westerlies.',
  'Faible à modérée : écarts hiver–été parmi les plus faibles de France métropolitaine.',
  'Low to moderate: winter–summer swings among the smallest in mainland France.',
  'Pluviométrie assez abondante, répartie sur l''année, avec un léger maximum d''octobre à février.',
  'Fairly abundant rainfall spread through the year, with a slight peak from October to February.',
  'Ensoleillement modéré (souvent 1 600–2 000 h/an selon le lieu).',
  'Moderate sunshine (often 1,600–2,000 h/year depending on location).',
  'Gelées printanières possibles mais hivers généralement moins sévères qu''à l''est. Humidité favorable aux maladies cryptogamiques ; grêle localisée.',
  'Spring frosts possible but winters generally milder than in the east. Humidity favors fungal disease; localized hail.',
  'Maturation progressive, acidité préservée, vins souvent élégants et frais. Favours Merlot, Cabernets et Sauvignon sur la façade atlantique.',
  'Gradual ripening, preserved acidity, often elegant fresh wines. Favours Merlot, Cabernets and Sauvignon on the Atlantic façade.'
)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  color_hex = excluded.color_hex,
  carousel_order = excluded.carousel_order,
  definition_fr = excluded.definition_fr,
  definition_en = excluded.definition_en,
  characteristics_fr = excluded.characteristics_fr,
  characteristics_en = excluded.characteristics_en,
  temperature_amplitude_fr = excluded.temperature_amplitude_fr,
  temperature_amplitude_en = excluded.temperature_amplitude_en,
  rainfall_fr = excluded.rainfall_fr,
  rainfall_en = excluded.rainfall_en,
  sunshine_fr = excluded.sunshine_fr,
  sunshine_en = excluded.sunshine_en,
  frost_hail_risk_fr = excluded.frost_hail_risk_fr,
  frost_hail_risk_en = excluded.frost_hail_risk_en,
  vine_wine_impact_fr = excluded.vine_wine_impact_fr,
  vine_wine_impact_en = excluded.vine_wine_impact_en,
  updated_at = now(),
  deleted_at = null;

-- océanique altéré
insert into public.climate_types (
  id, slug, name_fr, name_en, color_hex, carousel_order, is_premium, status, published_at,
  definition_fr, definition_en,
  characteristics_fr, characteristics_en,
  temperature_amplitude_fr, temperature_amplitude_en,
  rainfall_fr, rainfall_en,
  sunshine_fr, sunshine_en,
  frost_hail_risk_fr, frost_hail_risk_en,
  vine_wine_impact_fr, vine_wine_impact_en
) values (
  'a1111111-1111-4111-8111-111111111102',
  'oceanique-altere',
  'Océanique altéré',
  'Altered oceanic',
  '#60a5fa',
  2,
  false,
  'published',
  now(),
  'Zone de transition entre océanique, semi-continental et montagne : influence atlantique encore présente mais atténuée par la distance à la mer.',
  'Transition between oceanic, semi-continental and mountain climates: Atlantic influence remains but fades inland.',
  'Bassin parisien, Champagne, contreforts du Massif central et plaine intérieure. Écarts saisonniers plus marqués qu''en bord de mer.',
  'Paris basin, Champagne, Massif Central foothills and inland plains. Stronger seasonal swings than on the coast.',
  'Modérée : hivers plus frais et étés plus chauds qu''en climat océanique franc.',
  'Moderate: cooler winters and warmer summers than pure oceanic climate.',
  'Plus faible qu''en façade atlantique, sauf près des reliefs.',
  'Lower than on the Atlantic coast, except near relief.',
  'Intermédiaire, croissant vers le sud-est.',
  'Intermediate, increasing toward the south-east.',
  'Risque de gel printanier non négligeable (Champagne, marges continentales). Orages estivaux possibles.',
  'Meaningful spring frost risk (Champagne, continental margins). Summer storms possible.',
  'Équilibre entre fraîcheur et maturité. Propice aux cépages blancs élégants et aux bulles (Chardonnay, Pinot).',
  'Balance of freshness and ripeness. Suits elegant whites and sparkling styles (Chardonnay, Pinot).'
)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  color_hex = excluded.color_hex,
  carousel_order = excluded.carousel_order,
  definition_fr = excluded.definition_fr,
  definition_en = excluded.definition_en,
  characteristics_fr = excluded.characteristics_fr,
  characteristics_en = excluded.characteristics_en,
  temperature_amplitude_fr = excluded.temperature_amplitude_fr,
  temperature_amplitude_en = excluded.temperature_amplitude_en,
  rainfall_fr = excluded.rainfall_fr,
  rainfall_en = excluded.rainfall_en,
  sunshine_fr = excluded.sunshine_fr,
  sunshine_en = excluded.sunshine_en,
  frost_hail_risk_fr = excluded.frost_hail_risk_fr,
  frost_hail_risk_en = excluded.frost_hail_risk_en,
  vine_wine_impact_fr = excluded.vine_wine_impact_fr,
  vine_wine_impact_en = excluded.vine_wine_impact_en,
  updated_at = now(),
  deleted_at = null;

-- semi-continental
insert into public.climate_types (
  id, slug, name_fr, name_en, color_hex, carousel_order, is_premium, status, published_at,
  definition_fr, definition_en,
  characteristics_fr, characteristics_en,
  temperature_amplitude_fr, temperature_amplitude_en,
  rainfall_fr, rainfall_en,
  sunshine_fr, sunshine_en,
  frost_hail_risk_fr, frost_hail_risk_en,
  vine_wine_impact_fr, vine_wine_impact_en
) values (
  'a1111111-1111-4111-8111-111111111103',
  'semi-continental',
  'Semi-continental',
  'Semi-continental',
  '#f59e0b',
  3,
  false,
  'published',
  now(),
  'Climat du quart nord-est et de plaines abritées : hivers marqués, étés chauds, saisons nettement contrastées.',
  'Climate of the north-east and sheltered plains: marked winters, warm summers, clear seasonal contrast.',
  'Alsace, Bourgogne, Beaujolais et marges jurassiennes. Abri des vents d''ouest par le relief ; effet de fœhn possible (Alsace).',
  'Alsace, Burgundy, Beaujolais and Jura margins. Sheltered from westerlies by relief; föhn possible (Alsace).',
  'Élevée : gelées et neige possibles en plaine l''hiver ; étés chauds.',
  'High: frost and snow possible in the plains in winter; warm summers.',
  'Souvent abondante, avec maximum estival orageux (sauf Alsace plus sèche grâce au relief).',
  'Often abundant, with a stormy summer peak (except drier Alsace thanks to relief).',
  'Correct à bon, avec de fortes variations locales selon exposition.',
  'Fair to good, with strong local variation by aspect.',
  'Gel printanier et grêle : risques majeurs pour la vigne. Hivers froids sélectionnent les cépages précoces.',
  'Spring frost and hail are major vineyard risks. Cold winters favour earlier-ripening varieties.',
  'Vins structurés, acidité vive, expression aromatique nette. Pinot Noir et Chardonnay y sont emblématiques.',
  'Structured wines, bright acidity, clear aromatics. Pinot Noir and Chardonnay are emblematic.'
)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  color_hex = excluded.color_hex,
  carousel_order = excluded.carousel_order,
  definition_fr = excluded.definition_fr,
  definition_en = excluded.definition_en,
  characteristics_fr = excluded.characteristics_fr,
  characteristics_en = excluded.characteristics_en,
  temperature_amplitude_fr = excluded.temperature_amplitude_fr,
  temperature_amplitude_en = excluded.temperature_amplitude_en,
  rainfall_fr = excluded.rainfall_fr,
  rainfall_en = excluded.rainfall_en,
  sunshine_fr = excluded.sunshine_fr,
  sunshine_en = excluded.sunshine_en,
  frost_hail_risk_fr = excluded.frost_hail_risk_fr,
  frost_hail_risk_en = excluded.frost_hail_risk_en,
  vine_wine_impact_fr = excluded.vine_wine_impact_fr,
  vine_wine_impact_en = excluded.vine_wine_impact_en,
  updated_at = now(),
  deleted_at = null;

-- méditerranéen
insert into public.climate_types (
  id, slug, name_fr, name_en, color_hex, carousel_order, is_premium, status, published_at,
  definition_fr, definition_en,
  characteristics_fr, characteristics_en,
  temperature_amplitude_fr, temperature_amplitude_en,
  rainfall_fr, rainfall_en,
  sunshine_fr, sunshine_en,
  frost_hail_risk_fr, frost_hail_risk_en,
  vine_wine_impact_fr, vine_wine_impact_en
) values (
  'a1111111-1111-4111-8111-111111111104',
  'mediterraneen',
  'Méditerranéen',
  'Mediterranean',
  '#ef4444',
  4,
  false,
  'published',
  now(),
  'Climat du Sud-Est et de la Corse : hivers doux, étés chauds et secs, fort ensoleillement et vents fréquents.',
  'Climate of the south-east and Corsica: mild winters, hot dry summers, strong sunshine and frequent winds.',
  'Provence, Languedoc-Roussillon, Corse et bas Rhône. Épisodes méditerranéens automnaux possibles près du relief.',
  'Provence, Languedoc-Roussillon, Corsica and lower Rhône. Autumn Mediterranean storm episodes possible near relief.',
  'Modérée à élevée en été ; hivers rarement très froids hors altitude.',
  'Moderate to high in summer; winters rarely severe except at altitude.',
  'Faible en nombre de jours, concentrée au printemps et à l''automne ; sécheresse estivale marquée.',
  'Few rainy days, concentrated in spring and autumn; marked summer drought.',
  'Très élevé (souvent > 2 500 h/an sur le littoral).',
  'Very high (often > 2,500 h/year on the coast).',
  'Gel moins fréquent qu''au nord, mais mistral / tramontane et grêle orageuse. Stress hydrique estival.',
  'Frost less frequent than further north, but mistral/tramontane and storm hail. Summer water stress.',
  'Maturation rapide, vins généreux, tanins et alcool souvent plus élevés. Syrah, Grenache et Mourvèdre y excellent (selon cépages disponibles).',
  'Fast ripening, generous wines, often higher tannin and alcohol. Syrah, Grenache and Mourvèdre thrive where planted.'
)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  color_hex = excluded.color_hex,
  carousel_order = excluded.carousel_order,
  definition_fr = excluded.definition_fr,
  definition_en = excluded.definition_en,
  characteristics_fr = excluded.characteristics_fr,
  characteristics_en = excluded.characteristics_en,
  temperature_amplitude_fr = excluded.temperature_amplitude_fr,
  temperature_amplitude_en = excluded.temperature_amplitude_en,
  rainfall_fr = excluded.rainfall_fr,
  rainfall_en = excluded.rainfall_en,
  sunshine_fr = excluded.sunshine_fr,
  sunshine_en = excluded.sunshine_en,
  frost_hail_risk_fr = excluded.frost_hail_risk_fr,
  frost_hail_risk_en = excluded.frost_hail_risk_en,
  vine_wine_impact_fr = excluded.vine_wine_impact_fr,
  vine_wine_impact_en = excluded.vine_wine_impact_en,
  updated_at = now(),
  deleted_at = null;

-- montagne
insert into public.climate_types (
  id, slug, name_fr, name_en, color_hex, carousel_order, is_premium, status, published_at,
  definition_fr, definition_en,
  characteristics_fr, characteristics_en,
  temperature_amplitude_fr, temperature_amplitude_en,
  rainfall_fr, rainfall_en,
  sunshine_fr, sunshine_en,
  frost_hail_risk_fr, frost_hail_risk_en,
  vine_wine_impact_fr, vine_wine_impact_en
) values (
  'a1111111-1111-4111-8111-111111111105',
  'montagne',
  'Montagne',
  'Mountain',
  '#8b5cf6',
  5,
  false,
  'published',
  now(),
  'Climat lié à l''altitude : température qui baisse avec l''élévation, forte variabilité selon exposition et versant.',
  'Altitude-driven climate: temperature falls with elevation; high variability by aspect and slope.',
  'Savoie, Jura, piémonts et hautes vallées. Se superpose aux autres domaines dès que le relief s''élève.',
  'Savoie, Jura, foothills and high valleys. Overlays other climate domains as soon as relief rises.',
  'Forte diurne et saisonnière ; nuits fraîches même en été.',
  'Strong diurnal and seasonal range; cool nights even in summer.',
  'Souvent abondante, très variable selon versant et exposition aux vents humides.',
  'Often abundant, highly variable by slope and exposure to moist winds.',
  'Variable : nébulosité minimale en hiver, maximale en été sur certains massifs.',
  'Variable: minimum cloudiness in winter, maximum in summer on some ranges.',
  'Gel tardif, grêle orageuse et neige : contraintes fortes. Sites en coteau bien exposés sont stratégiques.',
  'Late frost, storm hail and snow are major constraints. Well-exposed hillside sites are strategic.',
  'Fraîcheur, acidité élevée, maturité plus tardive. Styles tendus ; cépages locaux et Pinot/Chardonnay selon altitude.',
  'Freshness, high acidity, later ripening. Taut styles; local varieties and Pinot/Chardonnay by altitude.'
)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  color_hex = excluded.color_hex,
  carousel_order = excluded.carousel_order,
  definition_fr = excluded.definition_fr,
  definition_en = excluded.definition_en,
  characteristics_fr = excluded.characteristics_fr,
  characteristics_en = excluded.characteristics_en,
  temperature_amplitude_fr = excluded.temperature_amplitude_fr,
  temperature_amplitude_en = excluded.temperature_amplitude_en,
  rainfall_fr = excluded.rainfall_fr,
  rainfall_en = excluded.rainfall_en,
  sunshine_fr = excluded.sunshine_fr,
  sunshine_en = excluded.sunshine_en,
  frost_hail_risk_fr = excluded.frost_hail_risk_fr,
  frost_hail_risk_en = excluded.frost_hail_risk_en,
  vine_wine_impact_fr = excluded.vine_wine_impact_fr,
  vine_wine_impact_en = excluded.vine_wine_impact_en,
  updated_at = now(),
  deleted_at = null;

-- ---------------------------------------------------------------------------
-- Seed: region links (primary + secondary)
-- Mapping documented in issue #15 plan; based on Météo-France descriptions
-- applied to existing wine_regions (no invented polygons).
-- ---------------------------------------------------------------------------

-- Clear then re-insert for idempotent re-runs of this seed block.
delete from public.climate_wine_region_link
where climate_id in (
  'a1111111-1111-4111-8111-111111111101',
  'a1111111-1111-4111-8111-111111111102',
  'a1111111-1111-4111-8111-111111111103',
  'a1111111-1111-4111-8111-111111111104',
  'a1111111-1111-4111-8111-111111111105'
);

insert into public.climate_wine_region_link (climate_id, region_id, is_primary)
select c.id, r.id, v.is_primary
from (values
  -- océanique primary
  ('oceanique', 'bordeaux', true),
  ('oceanique', 'vallee-de-la-loire', true),
  ('oceanique', 'sud-ouest', true),
  -- océanique secondary
  -- (none beyond primary set for océanique)

  -- océanique altéré primary
  ('oceanique-altere', 'champagne', true),
  -- océanique altéré secondary
  ('oceanique-altere', 'vallee-de-la-loire', false),
  ('oceanique-altere', 'bourgogne', false),
  ('oceanique-altere', 'sud-ouest', false),
  ('oceanique-altere', 'beaujolais', false),

  -- semi-continental primary
  ('semi-continental', 'alsace', true),
  ('semi-continental', 'bourgogne', true),
  ('semi-continental', 'beaujolais', true),
  -- semi-continental secondary
  ('semi-continental', 'jura', false),
  ('semi-continental', 'vallee-du-rhone', false),

  -- méditerranéen primary
  ('mediterraneen', 'provence', true),
  ('mediterraneen', 'languedoc-roussillon', true),
  ('mediterraneen', 'corse', true),
  ('mediterraneen', 'vallee-du-rhone', true),
  -- méditerranéen secondary
  ('mediterraneen', 'sud-ouest', false),

  -- montagne primary
  ('montagne', 'savoie', true),
  ('montagne', 'jura', true),
  -- montagne secondary
  ('montagne', 'languedoc-roussillon', false),
  ('montagne', 'sud-ouest', false),
  ('montagne', 'vallee-du-rhone', false)
) as v(climate_slug, region_slug, is_primary)
join public.climate_types c on c.slug = v.climate_slug
join public.wine_regions r on r.slug = v.region_slug
where r.deleted_at is null;

-- ---------------------------------------------------------------------------
-- Seed: grape links (only grapes that exist in DB)
-- ---------------------------------------------------------------------------

delete from public.climate_grape_link
where climate_id in (
  'a1111111-1111-4111-8111-111111111101',
  'a1111111-1111-4111-8111-111111111102',
  'a1111111-1111-4111-8111-111111111103',
  'a1111111-1111-4111-8111-111111111104',
  'a1111111-1111-4111-8111-111111111105'
);

insert into public.climate_grape_link (climate_id, grape_id)
select c.id, g.id
from (values
  ('oceanique', 'merlot'), -- may not exist
  ('oceanique', 'cabernet-sauvignon'),
  ('oceanique', 'cabernet-franc'),
  ('oceanique', 'sauvignon'),
  ('oceanique-altere', 'chardonnay'),
  ('oceanique-altere', 'pinot-noir'),
  ('oceanique-altere', 'sauvignon'),
  ('semi-continental', 'pinot-noir'),
  ('semi-continental', 'chardonnay'),
  ('mediterraneen', 'clairette'),
  ('mediterraneen', 'cabernet-sauvignon'),
  ('montagne', 'pinot-noir'),
  ('montagne', 'chardonnay')
) as v(climate_slug, grape_slug)
join public.climate_types c on c.slug = v.climate_slug
join public.grapes g on g.slug = v.grape_slug
where g.deleted_at is null;

commit;
