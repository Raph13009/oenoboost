/**
 * Documented deterministic fixture catalogue for QA.
 * Runtime discovery lives in `tests/e2e/helpers/fixtures.ts`.
 *
 * Prefer env overrides (QA_FIXTURE_*) for a locked seed set once a dedicated
 * test Supabase project is provisioned.
 */
export const FIXTURE_CATALOGUE = {
  users: ["free user", "premium user"],
  aop: [
    "normal AOP",
    "Grand Cru AOP (is_grand_cru)",
    "parent AOP (future DGC)",
    "child DGC (future)",
    "AOP with subregion",
    "region without subregion (corse/provence/jura map mode)",
  ],
  content: [
    "grape with complete data",
    "grape with incomplete data",
    "soil",
    "vinification type",
    "quiz / question of the day",
    "region with history timeline (future)",
  ],
} as const;
