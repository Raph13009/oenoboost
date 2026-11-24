# Copy deterrence (Issue #39)

Light client-side discouragement of casual text copying on CMS educational modules (`/vignoble`, `/cepages`, `/sols`, `/climat`, `/vinification`, `/blog`, `/dictionnaire`, `/quiz`).

## What it does

- Intercepts `copy` / `cut` in those route trees and shows a short toast.
- Leaves text selection enabled (keyboard / screen-reader friendly).
- Always allows copying in inputs, textareas, contenteditable, and `[data-allow-copy]` (e.g. personal AOP notes).

## What it does not do

- Not DRM: screenshots, DevTools, and determined extraction still work.
- Does not replace paywall or server-side access control.
- Does not cover login, signup, dégustation notes flow, profil forms, or legal pages.
