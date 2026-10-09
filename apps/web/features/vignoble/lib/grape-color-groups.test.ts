import { describe, expect, it } from "vitest";

import {
  groupPublicGrapesByColor,
  producedGrapeColors,
} from "./grape-color-groups";

const emptyPct = {
  wine_pct_red: null,
  wine_pct_rose: null,
  wine_pct_white: null,
  wine_pct_sparkling: null,
  wine_pct_liqueur: null,
};

describe("producedGrapeColors", () => {
  it("returns nothing when the breakdown is empty", () => {
    expect(producedGrapeColors(emptyPct)).toEqual([]);
  });

  it("follows blanc, rouge, rosé, effervescent, liquoreux and drops zero shares", () => {
    expect(
      producedGrapeColors({
        wine_pct_red: 70,
        wine_pct_rose: 0,
        wine_pct_white: 20,
        wine_pct_sparkling: null,
        wine_pct_liqueur: 10,
      }),
    ).toEqual(["white", "red", "liqueur"]);
  });
});

describe("groupPublicGrapesByColor", () => {
  const grapes = [
    { id: "a", is_primary: true, wine_color: "red" },
    { id: "b", is_primary: false, wine_color: "red" },
    { id: "c", is_primary: true, wine_color: "white" },
    { id: "d", is_primary: true, wine_color: null },
    { id: "e", is_primary: false, wine_color: "sparkling" },
  ];

  it("hides unclassified grapes and colors the AOP does not produce", () => {
    const groups = groupPublicGrapesByColor(grapes, ["white", "red"]);
    expect(groups).toEqual([
      {
        color: "white",
        main: [{ id: "c", is_primary: true, wine_color: "white" }],
        accessory: [],
      },
      {
        color: "red",
        main: [{ id: "a", is_primary: true, wine_color: "red" }],
        accessory: [{ id: "b", is_primary: false, wine_color: "red" }],
      },
    ]);
  });

  it("keeps the same grape id once under red and once under rosé", () => {
    const sameGrapeBothColors = [
      { id: "syrah", is_primary: true, wine_color: "red" },
      { id: "syrah", is_primary: false, wine_color: "rose" },
    ];
    expect(groupPublicGrapesByColor(sameGrapeBothColors, ["red", "rose"])).toEqual([
      {
        color: "red",
        main: [{ id: "syrah", is_primary: true, wine_color: "red" }],
        accessory: [],
      },
      {
        color: "rose",
        main: [],
        accessory: [{ id: "syrah", is_primary: false, wine_color: "rose" }],
      },
    ]);
  });
});
