# Issue #33 — Visual system status

## Converted (this branch)

| Screen | Source | Notes |
|---|---|---|
| Homepage `/` | Figma Make | Immersive Make composition; OenoBoost branding; real data |
| AOP browse `/vignoble/aop` | Figma Make language | Hero + cream/wine/sage + chip filters; same browse/favorites logic |
| Tasting Œil `/degustation/oeil/start` | Figma design « Dégustation — Le visuel » | Full layout restyle; draft fields unchanged |

## Shared foundations

- `apps/web/styles/visual-system.css` — tokens (`--vs-*`), chips, cards, buttons
- Homepage-scoped Make CSS remains in `features/home/home-make.css`
- Daily Question FAB on homepage aligns with #13 behaviour via existing `DailyQuestionBubble`

## Future work (no approved mockup applied)

- Nez / Bouche tasting steps (keep current UX until dedicated mockups)
- Dégustation hub, history, onboarding
- Vignoble Mapbox map shell
- Cépages, Sols, Climat, Vinification, Dictionnaire, Quiz, Blog, Auth, Profil
- Full Make AOP schematic SVG map (not ported; Mapbox remains source of truth)

## Explicit non-goals in this pass

- No schema / backend changes
- No new product flows
- No Figma demo imagery or mock CMS content
