import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyWineColorPctChange,
  hasWineColorBreakdownData,
  validateWineColorBreakdown,
  wineColorBreakdownTotal,
  type WineColorBreakdown,
} from "./aop-wine-color-breakdown";

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

describe("validateWineColorBreakdown", () => {
  it("accepts all-null breakdown", () => {
    assert.equal(validateWineColorBreakdown(pct(null, null, null, null, null)), null);
  });

  it("accepts five shares summing to 100", () => {
    assert.equal(validateWineColorBreakdown(pct(60, 10, 25, 5, 0)), null);
  });

  it("accepts totals below 100", () => {
    assert.equal(validateWineColorBreakdown(pct(20, 20, 20, 20, 19)), null);
  });

  it("rejects partial data with missing rosé", () => {
    assert.match(validateWineColorBreakdown(pct(70, null, 30, 0, 0)) ?? "", /cinq pourcentages/);
  });

  it("rejects totals over 100", () => {
    assert.match(validateWineColorBreakdown(pct(40, 30, 20, 10, 1)) ?? "", /100 %/);
  });
});

describe("applyWineColorPctChange", () => {
  it("sets a value when the total stays at or below 100", () => {
    assert.deepEqual(applyWineColorPctChange(pct(20, 10, 10, 0, 0), "wine_pct_red", 50), pct(50, 10, 10, 0, 0));
  });

  it("allows decreasing a value without filling the others", () => {
    assert.deepEqual(applyWineColorPctChange(pct(60, 20, 20, 0, 0), "wine_pct_red", 10), pct(10, 20, 20, 0, 0));
  });

  it("reduces later non-zero colors when an increase would exceed 100", () => {
    assert.deepEqual(
      applyWineColorPctChange(pct(40, 30, 20, 10, 0), "wine_pct_red", 80),
      pct(80, 0, 10, 10, 0),
    );
  });

  it("never produces negative percentages", () => {
    const next = applyWineColorPctChange(pct(20, 20, 20, 20, 20), "wine_pct_red", 100);
    assert.deepEqual(next, pct(100, 0, 0, 0, 0));
    assert.equal(wineColorBreakdownTotal(next), 100);
    for (const value of Object.values(next)) {
      assert.ok((value ?? 0) >= 0);
    }
  });

  it("clamps the edited value between 0 and 100", () => {
    assert.deepEqual(applyWineColorPctChange(pct(10, 0, 0, 0, 0), "wine_pct_red", 140), pct(100, 0, 0, 0, 0));
    assert.deepEqual(applyWineColorPctChange(pct(10, 0, 0, 0, 0), "wine_pct_red", -8), pct(0, 0, 0, 0, 0));
  });
});

describe("wineColorBreakdownTotal", () => {
  it("includes rosé in the total", () => {
    assert.equal(wineColorBreakdownTotal(pct(40, 10, 30, 15, 5)), 100);
  });
});

describe("hasWineColorBreakdownData", () => {
  it("detects rosé-only data", () => {
    assert.equal(hasWineColorBreakdownData(pct(null, 100, null, null, null)), true);
  });
});
