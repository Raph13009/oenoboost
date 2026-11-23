import { describe, expect, it } from "vitest";

import {
  WINE_TYPE_PALETTES,
  colorsForWineType,
  isColorCompatibleWithWineType,
  type WineTypeId,
} from "./wine-colors";

describe("wine color palettes by wine type (#34)", () => {
  it("exposes exactly blanc / rouge / rosé families", () => {
    expect(Object.keys(WINE_TYPE_PALETTES).sort()).toEqual([
      "red",
      "rose",
      "white",
    ]);
  });

  it("returns only the shades for the selected wine type", () => {
    const white = colorsForWineType("white").map((c) => c.id);
    const red = colorsForWineType("red").map((c) => c.id);
    const rose = colorsForWineType("rose").map((c) => c.id);

    expect(white).toEqual([
      "pale_yellow",
      "lemon_yellow",
      "golden_yellow",
      "pale_gold",
      "intense_gold",
      "light_amber",
    ]);
    expect(red).toEqual([
      "ruby",
      "garnet",
      "purple",
      "violet",
      "tawny",
      "mahogany",
    ]);
    expect(rose).toEqual([
      "pale_rose",
      "salmon_rose",
      "peach_rose",
      "raspberry_rose",
      "deep_rose",
      "orange_rose",
    ]);

    expect(white.some((id) => red.includes(id))).toBe(false);
    expect(red.some((id) => rose.includes(id))).toBe(false);
  });

  it.each([
    ["white", "pale_yellow", true],
    ["white", "ruby", false],
    ["red", "ruby", true],
    ["red", "pale_rose", false],
    ["rose", "salmon_rose", true],
    ["rose", "lemon_yellow", false],
  ] as [WineTypeId, string, boolean][])(
    "compatibility %s + %s => %s",
    (wineType, colorId, ok) => {
      expect(isColorCompatibleWithWineType(colorId, wineType)).toBe(ok);
    },
  );
});
