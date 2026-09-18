/** Move this far before mouse drag-scroll starts (lets plain Link clicks through). */
export const DRAG_ACTIVATION_PX = 8;

/** True once the pointer has moved enough to treat the gesture as a drag. */
export function shouldActivateMouseDrag(
  startX: number,
  clientX: number,
  thresholdPx: number = DRAG_ACTIVATION_PX,
): boolean {
  return Math.abs(clientX - startX) >= thresholdPx;
}
