import { describe, expect, it } from "vitest";

import { filterAopItemsBySubregion } from "./filter-aop-items-by-subregion";

describe("filterAopItemsBySubregion", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const links = new Map<number, number[]>([
    [1, [10, 20]],
    [2, [20]],
    [3, [30]],
  ]);

  it("returns all items when no subregion is selected", () => {
    expect(filterAopItemsBySubregion(items, null, links)).toEqual(items);
    expect(filterAopItemsBySubregion(items, undefined, links)).toEqual(items);
  });

  it("keeps only AOPs linked to the selected subregion", () => {
    expect(filterAopItemsBySubregion(items, "20", links)).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(filterAopItemsBySubregion(items, "30", links)).toEqual([{ id: 3 }]);
  });

  it("excludes AOPs with no link to the selected subregion", () => {
    expect(filterAopItemsBySubregion(items, "99", links)).toEqual([]);
    expect(
      filterAopItemsBySubregion(
        items,
        "10",
        new Map([[1, [10]], [2, []]]),
      ),
    ).toEqual([{ id: 1 }]);
  });
});
