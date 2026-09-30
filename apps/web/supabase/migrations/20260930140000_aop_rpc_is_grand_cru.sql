-- Issue #6: expose is_grand_cru on get_aop_communes_geojson for map markers.
-- Same region-share threshold as before (10%).

drop function if exists public.get_aop_communes_geojson(
  double precision, double precision, double precision, double precision, uuid
);

create or replace function public.get_aop_communes_geojson(
  min_lng      double precision,
  min_lat      double precision,
  max_lng      double precision,
  max_lat      double precision,
  region_id_in uuid default null
)
returns table (
  aop_id       integer,
  aop_name     text,
  area_m2      double precision,
  is_grand_cru boolean,
  geometry     json
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with region_aops as (
    select cal.aop_id,
           count(*) filter (where s.region_id = region_id_in)::numeric
             / nullif(count(*), 0) as share
      from public.communes_full_aop_link cal
      left join public.communes_full_subregion_link csl
        on csl.commune_code_insee = cal.commune_code_insee
      left join public.subregions s on s.id = csl.subregion_id
     group by cal.aop_id
  )
  select
    a.id                                     as aop_id,
    a.name                                   as aop_name,
    a.area_m2                                as area_m2,
    a.is_grand_cru                           as is_grand_cru,
    st_asgeojson(st_union(c.geometry))::json as geometry
  from public.aop a
  join public.communes_full_aop_link l on l.aop_id = a.id
  join public.communes_full c          on c.code_insee = l.commune_code_insee
  where
    c.geometry is not null
    and c.geometry && st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    and (
      region_id_in is null
      or a.id = any (
        select aop_id from region_aops where share >= 0.10
      )
    )
  group by a.id, a.name, a.area_m2, a.is_grand_cru
  order by a.area_m2 desc nulls last
$$;
