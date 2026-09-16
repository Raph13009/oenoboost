import test from "node:test";
import assert from "node:assert/strict";

import { slugifyAopSlug } from "./aop-slug";

test("slugifies DGC names with spaces and accents", () => {
  assert.equal(
    slugifyAopSlug("Côtes-de-Provence Sainte-Victoire"),
    "cotes-de-provence-sainte-victoire",
  );
  assert.equal(slugifyAopSlug("Anjou Brissac"), "anjou-brissac");
});
