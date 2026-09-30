import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateRecognitionYear } from "./aop-recognition-year";

describe("validateRecognitionYear", () => {
  it("accepts null / undefined (optional field)", () => {
    assert.equal(validateRecognitionYear(null), null);
    assert.equal(validateRecognitionYear(undefined), null);
  });

  it("accepts integer years in range", () => {
    assert.equal(validateRecognitionYear(1800), null);
    assert.equal(validateRecognitionYear(1936), null);
    assert.equal(validateRecognitionYear(2100), null);
  });

  it("rejects non-integers and out-of-range years", () => {
    assert.match(validateRecognitionYear(1936.5) ?? "", /année/i);
    assert.match(validateRecognitionYear(1799) ?? "", /1800/);
    assert.match(validateRecognitionYear(2101) ?? "", /2100/);
  });
});
