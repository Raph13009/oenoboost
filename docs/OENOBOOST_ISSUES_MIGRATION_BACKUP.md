# OenoBoost — GitHub Issues Migration Backup

> Purpose: preserve the current GitHub backlog before migrating `oenoboost-app` and `oenoboost-cms` into a monorepo.
>
> Migration rule:
> - Do **not** delete the original repositories during the migration.
> - Recreate the relevant issues in the future monorepo once the code migration is validated.
> - Keep the original issue reference in each migrated issue, e.g. `Migrated from Raph13009/oenoboost-app#21`.
> - Features spanning both app + CMS + DB can be consolidated into a single product issue in the monorepo when that reduces duplication.
> - Preserve all functional context and acceptance criteria below.
>
> Source repositories:
> - `Raph13009/oenoboost-app`
> - `Raph13009/oenoboost-cms`

---

# Repository: `Raph13009/oenoboost-app`

## #7 — Setup a monorepos
Original: https://github.com/Raph13009/oenoboost-app/issues/7

Use turbo to setup a monoreps with [the cms repos](https://github.com/Raph13009/oenoboost-cms).
See https://vercel.com/docs/monorepos

---

## #10 — Feature: display rivers and watercourses on the map
Original: https://github.com/Raph13009/oenoboost-app/issues/10

### Description
When a user is on the map and selects a wine region, the map currently displays either sub-regions or AOPs.  
We should also display the main rivers and watercourses, including their names.

### Expected behavior
After selecting a region on the map:
- Rivers and watercourses should be displayed in blue
- Their names should be visible on the map
- They should remain readable alongside:
  - colored wine regions
  - AOP boundaries
  - city names
  - sub-region labels

### Design requirement
The rivers must be visually clear but not overpower the existing map layers.  
The blue color, line thickness, and labels should be adjusted to stay readable on top of the colored regions and AOPs.

### Goal
Improve geographic understanding of each wine region by showing important natural landmarks directly on the map.

---

## #17 — Fix: vinification pages cannot be opened
Original: https://github.com/Raph13009/oenoboost-app/issues/17

## Context
The vinification experience is already built and should **not be redesigned**. During the client review, vinification pages could not be opened from the app, which prevents users from seeing the existing timeline.

## Expected behavior
Keep the current vinification UI and interaction unchanged. Fix the navigation/runtime issue so an existing vinification page opens normally from the vinification module.

## Acceptance criteria
- A user can open each published vinification type from the vinification module.
- The existing vertical timeline and step interaction remain visually and functionally unchanged.
- Direct navigation to a vinification detail URL works.
- Missing or invalid vinification data is handled gracefully instead of crashing the page.
- Verify the fix on desktop and mobile.

---

## #18 — Fix: some AOP detail pages crash when opened
Original: https://github.com/Raph13009/oenoboost-app/issues/18

## Context
During the client review, some AOP detail pages displayed an error instead of opening. A concrete example mentioned during the call was **Côtes de Provence Sainte-Victoire**.

## Expected behavior
All published AOP pages should open reliably, including AOPs/DGCs that may have incomplete or slightly different data structures.

## Acceptance criteria
- Reproduce the current error using affected AOPs, starting with Côtes de Provence Sainte-Victoire.
- Fix the underlying issue rather than adding a one-off exception for a single appellation.
- Published AOP pages open without runtime errors.
- Optional/missing fields do not crash the page.
- Existing working AOP pages are not regressed.
- Verify on desktop and mobile.

---

## #19 — Feature: improve free AOP preview with key visual information
Original: https://github.com/Raph13009/oenoboost-app/issues/19

## Context
The first AOP preview is free and should remain free. The goal is to make this first view more useful and visual without exposing the full premium fiche.

The client wants the preview to focus on the information users should immediately retain.

## Expected behavior
On the first AOP preview, display:
- area in hectares;
- production volume in hectolitres;
- soil types as compact chips, without soil descriptions;
- only the **main/classic grape varieties** as chips;
- creation/recognition date;
- the existing color distribution visual.

Accessory grape varieties must not clutter this first preview. They remain available in the full AOP fiche.

## Acceptance criteria
- The preview remains accessible to free users exactly as today.
- Main grape varieties are visually distinct chips and can link to their grape fiche when available.
- Soil types are displayed as compact chips and can link to their soil fiche when available.
- Accessory grape varieties are not displayed in the free preview.
- Creation/recognition date and color distribution are visible when data exists.
- Missing values do not create empty or broken UI blocks.
- The layout remains clear on mobile even when several chips are present.
- The full premium AOP fiche continues to expose the complete information.

---

## #20 — Feature: display Grand Cru AOPs as red markers on the vineyard map
Original: https://github.com/Raph13009/oenoboost-app/issues/20

## Context
Grand Cru status is already represented visually in parts of the app (e.g. the star on some AOP fiches), but the client also wants Grand Crus to be visible directly on the vineyard map.

This should only appear once the user is at the AOP-level map view. Showing all Grand Crus on the full France view would be too noisy.

## Expected behavior
- When AOPs are displayed for a region/subregion, Grand Cru AOPs are additionally represented by a small red point/marker.
- Add a clear Grand Cru item to the map legend.
- Clicking the Grand Cru marker should open the corresponding AOP fiche, using the same destination as clicking that AOP.
- Keep the current Grand Cru star/badge behavior on the fiche.
- If no dedicated Grand Cru coordinates exist, use the AOP centroid rather than creating a new geolocation project.

## Acceptance criteria
- Grand Cru markers are visible only at the relevant AOP-level zoom/view.
- Non-Grand-Cru AOPs never receive the red marker.
- Markers remain clickable even when an AOP polygon sits underneath them.
- Marker click opens the correct AOP fiche.
- The map legend explains the red marker.
- The implementation works on desktop and mobile.

---

## #21 — Feature: add grape profile radar and linked emblematic AOPs
Original: https://github.com/Raph13009/oenoboost-app/issues/21

## Context
The client wants grape fiches to be more visual and better connected to the AOP module.

Two changes are required:
1. a free radar chart titled **Profil du cépage**;
2. emblematic wines should become linked AOP chips instead of plain text.

## Expected behavior
### Grape profile radar
Display a 5-axis radar chart using values from 0 to 8 for:
- Acidity
- Body / Power
- Aromatic intensity
- Tannins
- Alcohol potential

The radar is visible to everyone, including free users. It complements the tasting text rather than replacing it.

### Emblematic wines / AOPs
At the end of the grape fiche, display associated emblematic AOPs as compact clickable chips/buttons, using the same visual language already used for linked AOPs in the soil module.

## Acceptance criteria
- Radar values are rendered on a 0–8 scale.
- The chart is readable on desktop and mobile.
- The radar remains accessible to free users even if the rest of the grape fiche is premium.
- Missing radar values do not break the page.
- Multiple emblematic AOPs can be displayed.
- Clicking an emblematic AOP opens the correct AOP fiche.
- Reuse existing OenoBoost visual patterns where possible.

---

## #22 — Feature: add dedicated wine region pages with interactive history timeline
Original: https://github.com/Raph13009/oenoboost-app/issues/22

## Context
The client wants wine regions to have their own editorial page instead of keeping all region information only inside the map popup.

The final direction agreed during the call is:
- create a dedicated region page;
- make regions accessible from a dedicated navigation entry/module, in a similar discovery logic to soils;
- keep access from the vineyard map as well;
- include the region's key information and its history.

## Expected behavior
Each wine region page should include the existing key regional information and a **horizontal historical timeline**.

Each timeline milestone contains:
- a date or period;
- a short visible title;
- optional illustration/icon if supported by the existing design system;
- a detailed explanation revealed when the milestone is selected.

The map flow to subregions/AOPs must remain available and important; the history page is complementary, not a replacement for vineyard exploration.

## Acceptance criteria
- Users can access a region page from the relevant navigation entry.
- Users can also reach the same region page from the vineyard map/region experience.
- The page shows the region's key information already available in OenoBoost.
- Historical milestones are displayed chronologically in a horizontal timeline.
- Selecting a milestone clearly reveals its detailed text.
- The interaction remains usable on mobile, including overflow/scroll behavior when many milestones exist.
- Regions without history content do not show broken/empty timeline UI.
- Existing vineyard map navigation to subregions and AOPs is preserved.

---

## #23 — Feature: support DGC parent/child AOP relationships and shared fiches
Original: https://github.com/Raph13009/oenoboost-app/issues/23

## Context
Some DGCs are already represented on the vineyard map as separate AOP-like geographic entities. The client does **not** want users to discover a full duplicate fiche for every DGC.

The agreed product model is:
- an AOP can be configured as a **parent AOP**;
- one or more existing AOPs/DGCs from the same region can be attached as children;
- children remain visible and clickable on the map;
- opening a child should use the parent AOP's main fiche;
- the parent fiche also contains a dedicated DGC section at the bottom with the children and their specific short explanations.

## Expected behavior
When a child/DGC is opened from the map, the user lands on the parent fiche context rather than a duplicate independent fiche. The DGC section at the bottom of the parent fiche lists all configured children.

Each DGC tab/card should be compact when closed and reveal its own complementary information when selected. Only one needs to be expanded at a time.

## Acceptance criteria
- Existing DGC geographic entities remain visible on the map.
- Clicking a configured child/DGC opens the relevant parent AOP fiche.
- The UI makes clear which DGC the user came from when relevant.
- Parent AOP fiches display a DGC section only when children exist.
- Each configured child appears as a selectable tab/item in that section.
- Selecting a DGC reveals its specific short content without replacing the parent fiche.
- Only one DGC detail is expanded at a time.
- AOPs without children show no empty DGC block.
- Mobile horizontal scrolling is supported when many DGCs exist.

## Data note
This feature may require database changes. Inspect the current model first and implement only what is necessary. When the database schema changes, keep the repository schema reference synchronized and ensure the same current schema reference is also available/up to date in the CMS repository.

---

## #24 — Feature: add private user notes to AOP fiches
Original: https://github.com/Raph13009/oenoboost-app/issues/24

## Context
The client wants connected users to be able to write their own private notes at the bottom of an AOP fiche and come back later to read or edit them.

This is a **Premium feature** and is not editorial content managed from the CMS.

## Expected behavior
- At the bottom of an AOP fiche, Premium connected users can create a personal note.
- The note is private to that user and that AOP.
- The saved note is automatically restored when the user returns to the same AOP.
- The user can edit/update the note later.
- Free or logged-out users must not get editable note storage; use the existing OenoBoost upgrade/auth patterns rather than inventing a new flow.

## Acceptance criteria
- Notes are stored per user + per AOP.
- One user's note is never visible to another user.
- Saving, reloading and editing work reliably.
- An empty note state is simple and unobtrusive.
- The feature works on desktop and mobile.
- Existing AOP content remains unchanged for users who do not use notes.

## Data note
This feature requires persisted user data. Inspect the current schema/auth patterns first and add only what is necessary. If the DB schema changes, update the repository schema reference and keep the same current schema reference synchronized in the CMS repository.

---

## #25 — Feature: show AOP grape varieties as linked chips with main vs accessory separation
Original: https://github.com/Raph13009/oenoboost-app/issues/25

## Context
The current AOP fiche contains grape information as text. The client wants this to work like the existing linked soil chips: more visual, easier to scan, and directly connected to grape fiches.

The editorial distinction is important:
- **main/classic grapes** = the varieties users should primarily retain;
- **accessory grapes** = still part of the full AOP information, but secondary.

## Expected behavior
- In the full AOP fiche, show grape varieties as clickable chips rather than one unstructured text block.
- Clearly separate main/classic grapes from accessory grapes.
- Clicking a grape chip opens the corresponding grape fiche.
- The free first preview only uses the main/classic set (covered by the separate AOP preview issue).

## Acceptance criteria
- Main and accessory grapes are visually separated in the full fiche.
- Each grape is displayed as a compact chip using the same interaction language as linked soils where appropriate.
- Chips link to the correct grape fiche.
- Empty accessory lists do not create an empty section.
- Existing color information remains available and understandable.
- Mobile layouts wrap/scroll cleanly without becoming unreadable.

---

## #26 — Feature: filter AOP side list by selected subregion
Original: https://github.com/Raph13009/oenoboost-app/issues/26

## Context
When a region contains subregions, the current side list can become too long and confusing because it may show AOPs outside the selected subregion.

## Expected behavior
- When a user selects a subregion on the vineyard map, the AOP side list should only show AOPs linked to that subregion.
- For regions without subregions (e.g. Provence), keep the current behavior and show all AOPs for the region.
- Returning to a broader region view should restore the broader AOP list.

## Acceptance criteria
- Selecting a subregion filters the side list to that subregion only.
- AOP links remain clickable and open the correct fiche.
- Regions without subregions continue to show all their AOPs.
- Changing subregion updates the list immediately and correctly.
- No AOP outside the selected subregion is shown in the filtered state.
- Desktop and mobile behavior remain consistent.

---

## #27 — Feature: restyle Question of the Day as a floating quiz bubble
Original: https://github.com/Raph13009/oenoboost-app/issues/27

## Context
The Question of the Day logic already exists. The requested change is visual/navigation only.

The client wants it to feel like a small floating, lively bubble near the Quiz area on the home/dashboard rather than a standard card/tab.

## Expected behavior
- Keep the existing Question of the Day rules, content and completion behavior.
- Replace/restyle its home entry point as a small floating bubble/cloud-like element positioned near the Quiz section.
- The element can have a subtle motion to attract attention, but should remain tasteful and consistent with OenoBoost.
- Clicking it opens the existing Question of the Day experience.

## Acceptance criteria
- No quiz business logic is changed.
- The floating element is clearly associated with the Quiz area.
- It does not obstruct other content or navigation.
- Motion, if used, is subtle and does not harm readability/usability.
- Clicking it opens the current Question of the Day flow.
- It behaves correctly on desktop and mobile.

---

## #28 — Feature: render CMS rich-text content consistently across modules
Original: https://github.com/Raph13009/oenoboost-app/issues/28

## Context
The CMS will be extended so editorial text fields across grapes, vinification, regions and other content areas can use the same rich-text editing capabilities already working in AOP content.

The app must display that formatting consistently rather than flattening or exposing raw markup.

## Expected behavior
Where a CMS field supports rich text, preserve supported formatting in the public app (paragraphs, emphasis, underline where supported, lists, etc.) while keeping the existing OenoBoost typography and spacing.

## Acceptance criteria
- Rich-text content from supported CMS fields renders correctly in the app.
- No raw HTML/markup is visible to users.
- Existing plain-text records continue to render normally.
- Formatting is visually consistent across AOPs, grapes, vinification and region content where enabled.
- Rich text does not break mobile layouts.
- Reuse the existing rendering approach already proven in AOP content rather than introducing a conflicting content system.

---

## #29 — WIP — Feature: climate module and interactive climate map
Original: https://github.com/Raph13009/oenoboost-app/issues/29

## Status
**WIP / NOT FOR IMMEDIATE IMPLEMENTATION**

This feature should be done at the end, after the current priority updates. The product direction is clear, but the geographic data source for the map is not yet validated.

## Context
The client wants a dedicated Climate entry/module explaining the main climates affecting French vineyards. The long-term experience should include an interactive France map and educational climate fiches.

Target climate categories discussed:
- Oceanic
- Altered oceanic
- Semi-continental / continental
- Mediterranean
- Mountain / altitude

## Intended experience
- A dedicated Climate entry in navigation.
- A France map with the main climate zones and a clear legend.
- Clicking a climate opens its educational fiche/content.
- Each climate fiche should cover: short definition, key characteristics, temperature amplitude, rainfall, sunshine, frost/hail risk, wine regions concerned, impact on vine/wine style, and grapes that thrive there with links to grape fiches.

## Important constraint
Do **not** invent geographic boundaries. Before implementation, validate an authoritative/reliable dataset or agree on a product-approved simplified mapping approach.

## Acceptance criteria for future implementation
- Climate geography is based on a validated source or explicitly approved simplified dataset.
- Climate zones are readable and clickable on desktop/mobile.
- Each climate can be opened from the map/legend.
- Climate fiches support the agreed educational fields and grape links.
- Regions spanning multiple climates can visually reflect that reality.

This issue is intentionally a product placeholder until the data approach is resolved.

---

# Repository: `Raph13009/oenoboost-cms`

## #4 — Fix: allow adding new vinification steps
Original: https://github.com/Raph13009/oenoboost-cms/issues/4

## Context
During the client review, creating a new vinification step from the CMS was blocked by a validation/error state. Existing steps are visible, but the editor cannot add a new one.

The public vinification timeline is already built; this ticket is only about restoring normal CMS authoring.

## Expected behavior
An editor can create a new step for any vinification type, fill the step content, save it, and then continue editing/reordering steps as supported today.

## Acceptance criteria
- “Add step” creates a valid new editable step instead of immediately failing.
- Required-field validation only blocks saving when genuinely required data is missing; it must not prevent creation of an empty draft form.
- Saved steps persist and reappear after refresh.
- Existing vinification steps are not altered or lost.
- The fix works for all vinification types, not only Vin Blanc.

---

## #5 — Fix: keep AOP color distribution capped at 100%
Original: https://github.com/Raph13009/oenoboost-cms/issues/5

## Context
The AOP color distribution editor can currently produce inconsistent totals when one percentage is increased too far.

The agreed behavior is simple: the total may be below 100%, but it must **never exceed 100%**.

## Expected behavior
When an editor increases one color percentage and the total would exceed 100%, automatically reduce another existing color percentage so the total remains at 100% maximum.

There is no minimum-total requirement.

## Acceptance criteria
- The sum of all AOP color percentages can never exceed 100%.
- Increasing one value beyond the remaining available percentage automatically reduces another non-zero value as needed.
- The editor never ends up with negative percentages.
- Totals below 100% are allowed.
- The visual distribution preview updates immediately and matches the saved values.
- Saving and reopening the AOP preserves the adjusted distribution.

---

## #6 — Feature: manage main vs accessory grape varieties on AOPs
Original: https://github.com/Raph13009/oenoboost-cms/issues/6

## Context
AOP grape information is currently too text-based. The product now needs a structured distinction between:
- **main/classic grape varieties**;
- **accessory grape varieties**.

Editors should manage these directly from the AOP CMS using grape records, similarly to the existing soil selection experience.

## Expected behavior
On an AOP edit page, provide clear controls to select grape varieties and classify them as main/classic or accessory.

The app will use:
- only main/classic grapes in the free AOP preview;
- both main and accessory grapes in the full fiche.

## Acceptance criteria
- Editors can add/remove grape varieties from an AOP using existing grape records.
- Each selected grape can be classified as main/classic or accessory.
- Existing AOP grape links/data are preserved as safely as possible during the change.
- Editors do not have to maintain the same grape list manually in a separate plain-text field.
- Saved classifications are available to the public app.
- The interaction remains manageable when the grape database contains many entries.

## Data note
Inspect the current DB first; there is already an appellation↔grape relationship and an `is_primary` concept in the current schema, so reuse existing data semantics where appropriate rather than duplicating them.

If any DB change is needed, update the schema reference and keep the same current database schema reference synchronized in both `oenoboost-cms` and `oenoboost-app`.

---

## #7 — Feature: expose Grand Cru status in AOP management
Original: https://github.com/Raph13009/oenoboost-cms/issues/7

## Context
Grand Cru status already appears visually in parts of the public app, but the editor currently has no clear CMS control to manage it.

The client needs to be able to decide whether an AOP is a Grand Cru directly from the AOP editor.

## Expected behavior
Add a simple, explicit Grand Cru control on AOP records. This status will drive the existing Grand Cru badge/star behavior and the new red map markers in the app.

## Acceptance criteria
- Editors can clearly see whether an AOP is marked as Grand Cru.
- Editors can toggle/update that status from the CMS.
- Saving persists the value and reopening the AOP shows the correct status.
- Existing Grand Cru AOPs should retain their current status wherever possible; inspect current app/data logic before migrating anything.
- The public app can consume the same canonical status for both fiche and map display.

## Data note
Do not assume the current storage mechanism. Inspect the existing implementation first because some Grand Cru behavior already exists in the app. If a DB change is required, update the schema reference and keep the current schema reference synchronized in both repositories.

---

## #8 — Feature: manage grape profile radar values and emblematic AOP links
Original: https://github.com/Raph13009/oenoboost-cms/issues/8

## Context
Grape fiches need two new structured content areas controlled from the CMS:
1. the 5-value **Profil du cépage** radar;
2. linked emblematic AOPs instead of plain-text wine names.

## Expected behavior
### Radar values
Add an editor experience similar in spirit to the existing AOP color distribution controls, with values from **0 to 8** for:
- Acidity
- Body / Power
- Aromatic intensity
- Tannins
- Alcohol potential

### Emblematic AOPs
Allow the editor to select one or more existing AOP records to associate with the grape. This should replace the need to manually type AOP names into one plain-text field for this use case.

## Acceptance criteria
- Each of the five radar values can be edited from 0 to 8.
- Invalid values outside 0–8 cannot be saved.
- Existing grape records can be edited even when radar values are not yet filled.
- Editors can search/select multiple existing AOPs as emblematic AOPs.
- Selected AOPs can be removed/reordered if the current CMS patterns support ordering.
- Saved radar values and AOP associations are available to the public app.
- Existing plain-text content is not silently deleted during migration.

## Data note
This likely requires DB changes. Inspect the current schema first, implement the minimal clean model needed, then update the database schema reference and keep it synchronized in both the app and CMS repositories.

---

## #9 — Feature: manage wine region history timelines
Original: https://github.com/Raph13009/oenoboost-cms/issues/9

## Context
Wine regions will get dedicated public pages with a horizontal historical timeline. Editors need to manage that history directly from the CMS.

The client already has historical content structured around key dates/periods and short events, with a longer explanation revealed on interaction.

## Expected behavior
For each wine region, allow editors to create and manage ordered history milestones containing:
- date or period label;
- short title;
- detailed explanation;
- optional illustration/icon if the current media system supports it.

Editors should be able to add, edit, remove and order milestones without editing code.

## Acceptance criteria
- Region records expose a clear History/Timeline section.
- Multiple milestones can be created for one region.
- Each milestone supports date/period, short title and detailed text.
- Milestones can be ordered chronologically/editorially.
- Saved history is available to the public region page.
- Regions with no timeline remain valid and editable.
- Existing region data is preserved.

## Data note
This may require a new persisted relationship/table. Inspect the current schema first and choose the minimal model that supports ordered milestones cleanly. If the DB schema changes, update the schema reference and keep the current reference synchronized in both repositories.

---

## #10 — Feature: manage DGC parent AOPs and child appellations
Original: https://github.com/Raph13009/oenoboost-cms/issues/10

## Context
DGCs already exist as map entities/appellations, but the client wants to manage them as children of a parent AOP instead of maintaining full duplicate fiches.

The agreed editorial workflow is:
- mark an AOP as a parent AOP when relevant;
- attach existing child appellations/DGCs from the same wine region;
- keep those children visible on the map;
- use the parent AOP as the main public fiche;
- maintain a short DGC-specific explanation for each child shown in the DGC section of the parent fiche.

## Expected behavior
From an AOP edit page, editors can define parent/child relationships using searchable dropdown/select controls, ideally restricted to AOPs from the same region to reduce mistakes.

For each child/DGC, support the complementary content needed for the public DGC section, including the short explanation and relevant key facts where available.

## Acceptance criteria
- An AOP can be configured as a parent AOP.
- Editors can search/select multiple existing child AOPs/DGCs.
- The selection is restricted to the same wine region where practical.
- A child cannot accidentally belong to multiple conflicting parents.
- Editors can remove/change child assignments later.
- DGC-specific complementary content can be edited without duplicating the full parent fiche.
- Existing map entities remain intact.
- Saved relationships/content are available to the public app.

## Data note
This will likely require DB changes. Inspect the current model and existing geographic AOP data first; do not duplicate existing AOP records. Update the database schema reference after any schema change and keep the same current reference synchronized in both repositories.

---

## #11 — Feature: reuse rich-text editing across editorial text fields
Original: https://github.com/Raph13009/oenoboost-cms/issues/11

## Context
Rich-text editing already works well in parts of the AOP CMS. The client wants the same writing experience anywhere meaningful editorial explanations are entered, instead of plain textarea fields.

This is not a request for a new editor system. Reuse the proven existing AOP rich-text behavior and extend it where currently missing.

## Scope
Audit the CMS and apply the existing rich-text editor to relevant long-form editorial fields, especially:
- grape content;
- vinification content/step explanations;
- wine region/history content;
- other comparable explanation/description fields where plain text currently limits formatting.

Short labels, names, numeric values, slugs and other structured fields should remain simple inputs.

## Acceptance criteria
- Editors can use the same supported formatting already available in AOP content (e.g. bold, italic, underline/list/paragraph formatting as supported by the existing editor).
- Existing stored content remains editable and is not lost.
- The editor is only added to genuine editorial text areas, not every input indiscriminately.
- Saved formatting is preserved and available to the public app.
- The experience is consistent across the affected CMS modules.
- Reuse the current working editor implementation rather than introducing a second incompatible rich-text system.

---

## #12 — Feature: manage AOP creation / recognition date
Original: https://github.com/Raph13009/oenoboost-cms/issues/12

## Context
The improved free AOP preview should display the AOP's creation/recognition date. This information needs to be editable in the CMS and available to the public app.

## Expected behavior
Add a clear field on AOP records for the official creation/recognition date (or year, depending on the precision supported by the source data). Do not infer or auto-generate historical dates.

## Acceptance criteria
- Editors can enter/edit the AOP recognition/creation date from the AOP CMS.
- The field can remain empty for records where the information has not yet been entered.
- Saving and reopening preserves the value.
- The public app can consume the value for the AOP preview.
- Existing AOP records remain valid without a value.

## Data note
This may require a DB field. Inspect the existing schema first and choose the minimal appropriate representation based on the actual data precision used by the project. If the DB schema changes, update the schema reference and keep it synchronized in both repositories.

---

## #13 — Chore: keep the database schema reference synchronized across app and CMS
Original: https://github.com/Raph13009/oenoboost-cms/issues/13

## Context
OenoBoost is currently split across two repositories (`oenoboost-app` and `oenoboost-cms`) but both depend on the same Supabase database. Several upcoming features require schema changes, so Cursor needs one reliable reference in both codebases.

The app repository currently contains a database schema reference under its Cursor rules. The intended project rule is that the current schema reference must also exist in the CMS repository and stay synchronized whenever the database changes.

## Expected behavior
- Ensure the CMS repository contains the same current database schema reference used by the app repository.
- Treat the schema file as documentation/reference for the actual Supabase schema, not as a blind migration script.
- Whenever a feature changes the DB, update the schema reference in both repositories as part of that work.
- Avoid allowing the two copies to silently diverge.

## Acceptance criteria
- Both repositories contain an up-to-date database schema reference.
- The two references describe the same current Supabase structure.
- Future DB-impacting issues can clearly update both references.
- Existing application/CMS behavior is unchanged by this documentation task alone.

## Note
Do not restructure the repositories as part of this issue. There is already a separate monorepo issue in `oenoboost-app` for that larger topic.

---

# Migration checklist

- [ ] Create new monorepo repository.
- [ ] Import `oenoboost-app` into `apps/web`.
- [ ] Import `oenoboost-cms` into `apps/cms`.
- [ ] Preserve both apps as independently buildable applications.
- [ ] Add one canonical DB schema reference at monorepo level.
- [ ] Verify local builds before any Vercel changes.
- [ ] Record current Vercel projects, domains, root directories and environment variables.
- [ ] Point the two existing Vercel projects to the new monorepo with the correct root directories.
- [ ] Recreate/migrate all relevant issues in the monorepo.
- [ ] Keep original issue URLs in migrated tickets for traceability.
- [ ] Do not delete original repositories immediately.
- [ ] Archive old repositories only after production deployment is confirmed stable.
