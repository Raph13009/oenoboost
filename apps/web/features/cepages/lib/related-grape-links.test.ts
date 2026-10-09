import { describe, expect, it } from "vitest";

import { expandRelatedGrapeLinks } from "./related-grape-links";

describe("expandRelatedGrapeLinks", () => {
  const grapes = [
    { id: "syrah", slug: "syrah", name_fr: "Syrah", is_premium: false },
    { id: "grenache", slug: "grenache", name_fr: "Grenache", is_premium: false },
  ];

  it("emits one entry per link so the same grape can be red and rosé", () => {
    const links = [
      { grape_id: "syrah", is_primary: true, wine_color: "red" },
      { grape_id: "syrah", is_primary: false, wine_color: "rose" },
      { grape_id: "grenache", is_primary: true, wine_color: "red" },
    ];

    expect(expandRelatedGrapeLinks(links, grapes)).toEqual([
      {
        id: "grenache",
        slug: "grenache",
        name_fr: "Grenache",
        is_premium: false,
        is_primary: true,
        wine_color: "red",
      },
      {
        id: "syrah",
        slug: "syrah",
        name_fr: "Syrah",
        is_premium: false,
        is_primary: true,
        wine_color: "red",
      },
      {
        id: "syrah",
        slug: "syrah",
        name_fr: "Syrah",
        is_premium: false,
        is_primary: false,
        wine_color: "rose",
      },
    ]);
  });

  it("drops links whose grape row is missing", () => {
    expect(
      expandRelatedGrapeLinks(
        [{ grape_id: "missing", is_primary: true, wine_color: "red" }],
        grapes,
      ),
    ).toEqual([]);
  });
});
