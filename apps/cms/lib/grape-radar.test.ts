import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeGrapeRadarFields,
  normalizeRadarAxis,
  validateGrapeRadarFields,
} from "./grape-radar";

describe("normalizeRadarAxis", () => {
  it("accepts 0–8", () => {
    assert.equal(normalizeRadarAxis(0), 0);
    assert.equal(normalizeRadarAxis(8), 8);
    assert.equal(normalizeRadarAxis("5"), 5);
  });

  it("nulls empty and out of range", () => {
    assert.equal(normalizeRadarAxis(null), null);
    assert.equal(normalizeRadarAxis(""), null);
    assert.equal(normalizeRadarAxis(9), null);
    assert.equal(normalizeRadarAxis(-1), null);
  });
});

describe("validateGrapeRadarFields", () => {
  it("allows all null", () => {
    assert.equal(
      validateGrapeRadarFields({
        radar_acidity: null,
        radar_body: null,
        radar_aromatic_intensity: null,
        radar_tannins: null,
        radar_alcohol_potential: null,
      }),
      null,
    );
  });

  it("rejects out of range", () => {
    assert.ok(
      validateGrapeRadarFields({
        radar_acidity: 9,
        radar_body: null,
        radar_aromatic_intensity: null,
        radar_tannins: null,
        radar_alcohol_potential: null,
      }),
    );
  });

  it("normalizes valid set", () => {
    assert.deepEqual(
      normalizeGrapeRadarFields({
        radar_acidity: 6,
        radar_body: null,
        radar_aromatic_intensity: 4,
        radar_tannins: 0,
        radar_alcohol_potential: 8,
      }),
      {
        radar_acidity: 6,
        radar_body: null,
        radar_aromatic_intensity: 4,
        radar_tannins: 0,
        radar_alcohol_potential: 8,
      },
    );
  });
});
