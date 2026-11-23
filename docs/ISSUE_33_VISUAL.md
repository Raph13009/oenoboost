# Issue #33 — Visual system status

## Converted (this branch)

| Screen | Source | Notes |
|---|---|---|
| Homepage `/` | Figma Make | Immersive Make composition; OenoBoost branding; real data |
| AOP browse `/vignoble/aop` | Figma Make language | Hero + cream/wine/sage + chip filters; same browse/favorites logic |
| Tasting wine name `/degustation/vin/start` | Product step | Feeds Figma « Dans votre verre » card |
| Tasting Œil `/degustation/oeil/start` | Figma [Épure — Dégustation guidée](https://www.figma.com/design/ZRpFpqou3wGifXp5xeW998) | Exact layout: hero, stepper Visuel/Odorat/Dégustation, robe 6 teintes, intensité, limpidité, sidebar |

## Shared foundations

- `apps/web/styles/visual-system.css` — tokens (`--vs-*`)
- Cormorant Garamond (`--font-cormorant`) for tasting Épure headings
- Assets in `apps/web/public/tasting/epure/`
- Daily Question FAB on homepage aligns with #13 via existing `DailyQuestionBubble`

## Future work (no approved mockup applied)

- Nez / Bouche tasting steps (Épure Odorat / Dégustation when mockups exist)
- Dégustation hub, history, onboarding
- Vignoble Mapbox map shell
- Cépages, Sols, Climat, Vinification, Dictionnaire, Quiz, Blog, Auth, Profil

## Explicit non-goals in this pass

- No schema / backend changes
- No Figma demo wine name as fake data (user enters it first)
- Global app header stays OenoBoost (not the Épure mock nav)
