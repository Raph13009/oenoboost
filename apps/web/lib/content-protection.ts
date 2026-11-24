/**
 * Client-side copy deterrence helpers (Issue #39).
 * Dissuasion only — not DRM. Paywall / RLS remain the real access control.
 */

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True when the event target is user-owned / editable text that must stay copyable. */
export function isCopyAllowedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (target.closest("[data-allow-copy]")) return true;

  const editable = target.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable='']",
  );
  if (!editable) return false;

  if (editable instanceof HTMLElement) {
    if (EDITABLE_TAGS.has(editable.tagName)) return true;
    if (editable.isContentEditable) return true;
  }

  return false;
}
