import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildNewVinificationStepInsert,
  nextVinificationStepOrder,
  vinificationStepFormToRow,
} from "./vinification-steps";

describe("buildNewVinificationStepInsert", () => {
  it("includes both required titles so Add step is not rejected by NOT NULL", () => {
    const row = buildNewVinificationStepInsert("type-1", 5);

    assert.equal(row.vinification_type_id, "type-1");
    assert.equal(row.step_order, 5);
    assert.equal(typeof row.title_fr, "string");
    assert.ok(row.title_fr.length > 0);
    assert.equal(typeof row.title_en, "string");
    assert.ok(row.title_en.length > 0);
  });
});

describe("nextVinificationStepOrder", () => {
  it("starts at 1 when a type has no steps", () => {
    assert.equal(nextVinificationStepOrder(undefined), 1);
    assert.equal(nextVinificationStepOrder(null), 1);
  });

  it("appends after the current max order", () => {
    assert.equal(nextVinificationStepOrder(4), 5);
  });
});

describe("vinificationStepFormToRow", () => {
  it("does not send null for required titles when the draft left English empty", () => {
    const row = vinificationStepFormToRow({
      vinification_type_id: "type-1",
      step_order: 1,
      icon_url: null,
      title_fr: "Vendange",
      title_en: null,
      summary_fr: null,
      summary_en: null,
      detail_fr: null,
      detail_en: null,
    });

    assert.equal(row.title_fr, "Vendange");
    assert.equal(row.title_en, "");
  });
});
