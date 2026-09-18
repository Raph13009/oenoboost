-- Allow AOP wine-color totals below 100%. The editor still caps the sum at 100
-- by reducing other non-zero shares, but there is no minimum-total requirement.

begin;

alter table public.aop
  drop constraint if exists aop_wine_pct_sum_100;

alter table public.aop
  add constraint aop_wine_pct_sum_100
    check (
      (
        wine_pct_red is null
        and wine_pct_rose is null
        and wine_pct_white is null
        and wine_pct_sparkling is null
        and wine_pct_liqueur is null
      )
      or (
        coalesce(wine_pct_red, 0)
        + coalesce(wine_pct_rose, 0)
        + coalesce(wine_pct_white, 0)
        + coalesce(wine_pct_sparkling, 0)
        + coalesce(wine_pct_liqueur, 0)
      ) <= 100
    );

commit;
