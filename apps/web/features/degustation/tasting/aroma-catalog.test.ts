import { describe, expect, it } from "vitest";

import {
  AROMA_FAMILIES,
  allAromaIds,
  aromaFamilyLabel,
  getAromaById,
  isAromaId,
} from "./aroma-catalog";

describe("aroma catalog (#35/#36)", () => {
  it("exposes the seven Hortense families", () => {
    expect(AROMA_FAMILIES.map((f) => f.id)).toEqual([
      "empyreumatic",
      "animal",
      "spices",
      "vegetal",
      "fruity",
      "floral",
      "faults",
    ]);
  });

  it("has unique aroma ids across the wheel vocabulary", () => {
    const ids = allAromaIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(50);
  });

  it("resolves known aromas from the source wheel", () => {
    expect(getAromaById("framboise")?.labelFr).toBe("Framboise");
    expect(getAromaById("pierre_fusil")?.labelFr).toBe("Pierre à fusil");
    expect(getAromaById("bouchon")?.labelFr).toBe("Bouchon");
    expect(isAromaId("vanille")).toBe(true);
    expect(isAromaId("not_a_real_aroma")).toBe(false);
  });

  it("places miel under épices (Hortense wheel), not floral", () => {
    const spices = AROMA_FAMILIES.find((f) => f.id === "spices");
    const floral = AROMA_FAMILIES.find((f) => f.id === "floral");
    expect(spices?.subfamilies.some((s) => s.aromas.some((a) => a.id === "miel"))).toBe(
      true,
    );
    expect(floral?.subfamilies.some((s) => s.aromas.some((a) => a.id === "miel"))).toBe(
      false,
    );
  });

  it("labels families including legacy chip ids", () => {
    expect(aromaFamilyLabel("fruity", "fr")).toBe("Fruité");
    expect(aromaFamilyLabel("Fruity", "en")).toBe("Fruity");
  });

  it("keeps vegetal Bois subfamily without inventing a standalone bois aroma", () => {
    const vegetal = AROMA_FAMILIES.find((f) => f.id === "vegetal");
    const bois = vegetal?.subfamilies.find((s) => s.id === "vegetal_bois");
    expect(bois?.aromas.map((a) => a.id)).toEqual([
      "sous_bois",
      "feuille_morte",
      "mousse_chene",
      "fougere",
      "herbace",
      "foin_frais",
      "champignon",
      "truffe",
      "resine",
      "pin",
      "cedre",
      "chene",
    ]);
    expect(isAromaId("bois")).toBe(false);
  });
});
