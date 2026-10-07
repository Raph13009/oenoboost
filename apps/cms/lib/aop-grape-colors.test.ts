import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { producedGrapeColors } from "./aop-grape-colors";
import type { WineColorBreakdown } from "./aop-wine-color-breakdown";

function pct(
  red: number | null,
  rose: number | null,
  white: number | null,
  sparkling: number | null,
  liqueur: number | null,
): WineColorBreakdown {
  return {
    wine_pct_red: red,
    wine_pct_rose: rose,
    wine_pct_white: white,
    wine_pct_sparkling: sparkling,
    wine_pct_liqueur: liqueur,
  };
}

describe("producedGrapeColors", () => {
  it("returns nothing when every share is empty or zero", () => {
    assert.deepEqual(producedGrapeColors(pct(null, null, null, null, null)), []);
    assert.deepEqual(producedGrapeColors(pct(0, 0, 0, 0, 0)), []);
  });

  it("keeps only shares above zero, in blanc / rouge / rosé / effervescent / liquoreux order", () => {
    assert.deepEqual(
      producedGrapeColors(pct(40, 0, 50, 10, null)),
      ["white", "red", "sparkling"],
    );
  });
});
