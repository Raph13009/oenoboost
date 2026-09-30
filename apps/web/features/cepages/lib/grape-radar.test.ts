import { describe, expect, it } from "vitest";
import {
  hasAnyRadarValue,
  normalizeRadarValue,
  radarAxesForChart,
} from "./grape-radar";

describe("normalizeRadarValue", () => {
  it("accepts integers 0–8", () => {
    expect(normalizeRadarValue(0)).toBe(0);
    expect(normalizeRadarValue(8)).toBe(8);
    expect(normalizeRadarValue(5)).toBe(5);
  });

  it("rejects out of range and non-finite", () => {
    expect(normalizeRadarValue(null)).toBeNull();
    expect(normalizeRadarValue(undefined)).toBeNull();
    expect(normalizeRadarValue(9)).toBeNull();
    expect(normalizeRadarValue(-1)).toBeNull();
    expect(normalizeRadarValue(Number.NaN)).toBeNull();
  });
});

describe("hasAnyRadarValue / radarAxesForChart", () => {
  it("hides empty profiles", () => {
    expect(
      hasAnyRadarValue({
        acidity: null,
        body: null,
        aromaticIntensity: null,
        tannins: null,
        alcoholPotential: null,
      }),
    ).toBe(false);
  });

  it("plots missing axes as 0 when any value exists", () => {
    expect(
      hasAnyRadarValue({
        acidity: 6,
        body: null,
        aromaticIntensity: null,
        tannins: null,
        alcoholPotential: null,
      }),
    ).toBe(true);
    expect(
      radarAxesForChart({
        acidity: 6,
        body: null,
        aromaticIntensity: 4,
        tannins: null,
        alcoholPotential: 2,
      }),
    ).toEqual([6, 0, 4, 0, 2]);
  });
});
