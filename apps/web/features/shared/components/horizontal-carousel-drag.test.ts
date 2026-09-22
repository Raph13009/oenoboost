import { describe, expect, it } from "vitest";

import {
  DRAG_ACTIVATION_PX,
  shouldActivateMouseDrag,
} from "./horizontal-carousel-drag";

describe("shouldActivateMouseDrag", () => {
  it("keeps small wobble as a click (no drag)", () => {
    expect(shouldActivateMouseDrag(100, 100)).toBe(false);
    expect(shouldActivateMouseDrag(100, 100 + DRAG_ACTIVATION_PX - 1)).toBe(
      false,
    );
    expect(shouldActivateMouseDrag(100, 100 - (DRAG_ACTIVATION_PX - 1))).toBe(
      false,
    );
  });

  it("activates drag once movement reaches the threshold", () => {
    expect(shouldActivateMouseDrag(100, 100 + DRAG_ACTIVATION_PX)).toBe(true);
    expect(shouldActivateMouseDrag(100, 100 - DRAG_ACTIVATION_PX)).toBe(true);
  });
});
