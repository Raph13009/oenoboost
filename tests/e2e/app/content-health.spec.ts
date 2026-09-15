import { test, expect } from "@playwright/test";
import { attachErrorProbe, assertNoHardCrashes } from "../helpers/errors";
import { getSupabaseAnon, hasSupabaseEnv } from "../helpers/fixtures";

const BATCH = Number(process.env.QA_HEALTH_BATCH ?? 40);

test.describe("Published content health", () => {
  test.beforeEach(() => {
    test.skip(!hasSupabaseEnv(), "Requires Supabase env (.env.qa)");
  });

  test("published AOP fiches open without crash (sample)", async ({
    page,
  }) => {
    const supabase = getSupabaseAnon();
    const { data: aops, error } = await supabase
      .from("aop")
      .select("slug, name")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(BATCH);
    expect(error).toBeNull();
    expect((aops ?? []).length).toBeGreaterThan(0);

    const { data: regions } = await supabase
      .from("wine_regions")
      .select("slug")
      .is("deleted_at", null)
      .order("map_order", { ascending: true })
      .limit(1);
    const regionSlug = regions?.[0]?.slug;
    test.skip(!regionSlug, "No region for AOP routes");

    const failures: string[] = [];
    for (const aop of aops ?? []) {
      const probe = attachErrorProbe(page);
      const res = await page.goto(
        `/vignoble/${regionSlug}/${aop.slug}?from=list`,
        { waitUntil: "domcontentloaded" },
      );
      const status = res?.status() ?? 0;
      const heading = page.getByRole("heading", { level: 1 });
      const ok =
        status < 500 &&
        (await heading.count()) > 0 &&
        probe.pageErrors.length === 0;
      if (!ok) {
        failures.push(
          `${aop.slug} status=${status} errors=${probe.pageErrors.join("; ")}`,
        );
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("published grape fiches open without crash (sample)", async ({
    page,
  }) => {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase
      .from("grapes")
      .select("slug")
      .is("deleted_at", null)
      .order("name_fr", { ascending: true })
      .limit(BATCH);
    expect(error).toBeNull();

    const failures: string[] = [];
    for (const row of data ?? []) {
      const probe = attachErrorProbe(page);
      const res = await page.goto(`/cepages/${row.slug}`, {
        waitUntil: "domcontentloaded",
      });
      if ((res?.status() ?? 500) >= 500 || probe.pageErrors.length) {
        failures.push(row.slug);
      }
      assertNoHardCrashes(probe);
    }
    expect(failures).toEqual([]);
  });

  test("soil fiches open without crash (sample)", async ({ page }) => {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase
      .from("soil_types")
      .select("slug")
      .order("carousel_order", { ascending: true })
      .limit(BATCH);
    expect(error).toBeNull();

    for (const row of data ?? []) {
      const probe = attachErrorProbe(page);
      await page.goto(`/sols/${row.slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      assertNoHardCrashes(probe);
    }
  });

  test("vinification fiches open without crash", async ({ page }) => {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase
      .from("vinification_types")
      .select("slug")
      .is("deleted_at", null)
      .order("carousel_order", { ascending: true })
      .limit(BATCH);
    expect(error).toBeNull();

    for (const row of data ?? []) {
      const probe = attachErrorProbe(page);
      await page.goto(`/vinification/${row.slug}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      assertNoHardCrashes(probe);
    }
  });
});
