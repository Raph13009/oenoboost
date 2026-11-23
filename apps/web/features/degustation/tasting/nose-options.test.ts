import { describe, expect, it } from "vitest";

import {
  NOSE_INTENSITY_OPTIONS,
  NOSE_PLUS_OPTIONS,
  isNosePlusId,
} from "./nose-options";

describe("nose options (#35)", () => {
  it("exposes three aromatic intensities", () => {
    expect(NOSE_INTENSITY_OPTIONS.map((o) => o.id)).toEqual([
      "light",
      "medium",
      "pronounced",
    ]);
  });

  it("exposes Hortense plus qualifiers", () => {
    expect(NOSE_PLUS_OPTIONS.map((o) => o.id)).toEqual([
      "plaisant",
      "agreable",
      "appetant",
      "elegant",
      "race",
      "simpliste",
      "rustique",
      "ferme",
    ]);
  });

  it("validates plus ids", () => {
    expect(isNosePlusId("elegant")).toBe(true);
    expect(isNosePlusId("not-a-plus")).toBe(false);
  });
});
