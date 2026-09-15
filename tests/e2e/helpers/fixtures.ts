import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type QaFixtures = {
  regionSlug: string | null;
  regionName: string | null;
  subregionSlug: string | null;
  aopSlug: string | null;
  aopName: string | null;
  grapeSlug: string | null;
  soilSlug: string | null;
  vinificationSlug: string | null;
  premiumAopSlug: string | null;
  freeAopSlug: string | null;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(env("NEXT_PUBLIC_SUPABASE_URL") && env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

export function getSupabaseAnon(): SupabaseClient {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Discover stable published fixtures from the live test DB. */
export async function loadFixtures(): Promise<QaFixtures> {
  const fixtures: QaFixtures = {
    regionSlug: env("QA_FIXTURE_REGION_SLUG") ?? null,
    regionName: null,
    subregionSlug: env("QA_FIXTURE_SUBREGION_SLUG") ?? null,
    aopSlug: env("QA_FIXTURE_AOP_SLUG") ?? null,
    aopName: null,
    grapeSlug: env("QA_FIXTURE_GRAPE_SLUG") ?? null,
    soilSlug: env("QA_FIXTURE_SOIL_SLUG") ?? null,
    vinificationSlug: env("QA_FIXTURE_VINIFICATION_SLUG") ?? null,
    premiumAopSlug: null,
    freeAopSlug: null,
  };

  if (!hasSupabaseEnv()) return fixtures;

  const supabase = getSupabaseAnon();

  if (!fixtures.regionSlug) {
    const { data } = await supabase
      .from("wine_regions")
      .select("slug, name_fr")
      .is("deleted_at", null)
      .not("geojson", "is", null)
      .order("map_order", { ascending: true })
      .limit(1);
    fixtures.regionSlug = data?.[0]?.slug ?? null;
    fixtures.regionName = data?.[0]?.name_fr ?? null;
  } else {
    const { data } = await supabase
      .from("wine_regions")
      .select("name_fr")
      .eq("slug", fixtures.regionSlug)
      .maybeSingle();
    fixtures.regionName = data?.name_fr ?? null;
  }

  if (fixtures.regionSlug && !fixtures.subregionSlug) {
    const { data: region } = await supabase
      .from("wine_regions")
      .select("id")
      .eq("slug", fixtures.regionSlug)
      .maybeSingle();
    if (region?.id) {
      const { data } = await supabase
        .from("subregions")
        .select("slug")
        .eq("region_id", region.id)
        .is("deleted_at", null)
        .order("map_order", { ascending: true })
        .limit(1);
      fixtures.subregionSlug = data?.[0]?.slug ?? null;
    }
  }

  if (!fixtures.aopSlug) {
    const { data } = await supabase
      .from("aop")
      .select("slug, name, is_premium")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(20);
    const rows = data ?? [];
    fixtures.aopSlug = rows[0]?.slug ?? null;
    fixtures.aopName = rows[0]?.name ?? null;
    fixtures.freeAopSlug = rows.find((r) => r.is_premium === false)?.slug ?? null;
    fixtures.premiumAopSlug = rows.find((r) => r.is_premium === true)?.slug ?? null;
  } else {
    const { data } = await supabase
      .from("aop")
      .select("name, is_premium")
      .eq("slug", fixtures.aopSlug)
      .maybeSingle();
    fixtures.aopName = data?.name ?? null;
  }

  if (!fixtures.grapeSlug) {
    const { data } = await supabase
      .from("grapes")
      .select("slug")
      .is("deleted_at", null)
      .order("name_fr", { ascending: true })
      .limit(1);
    fixtures.grapeSlug = data?.[0]?.slug ?? null;
  }

  if (!fixtures.soilSlug) {
    const { data } = await supabase
      .from("soil_types")
      .select("slug")
      .order("carousel_order", { ascending: true })
      .limit(1);
    fixtures.soilSlug = data?.[0]?.slug ?? null;
  }

  if (!fixtures.vinificationSlug) {
    const { data } = await supabase
      .from("vinification_types")
      .select("slug")
      .is("deleted_at", null)
      .order("carousel_order", { ascending: true })
      .limit(1);
    fixtures.vinificationSlug = data?.[0]?.slug ?? null;
  }

  return fixtures;
}

export function freeAuthConfigured(): boolean {
  return Boolean(env("QA_FREE_EMAIL") && env("QA_FREE_PASSWORD"));
}

export function premiumAuthConfigured(): boolean {
  return Boolean(env("QA_PREMIUM_EMAIL") && env("QA_PREMIUM_PASSWORD"));
}

export function cmsSecretConfigured(): boolean {
  return Boolean(
    env("ADMIN_SESSION_SECRET") || env("SUPABASE_SERVICE_ROLE_KEY"),
  );
}
