# Portfolio city: separate destination scenes

Implementation plan · 28 October 2026

Status: the shared renderer boundary and playable Arcade vertical slice are implemented locally. Journey, Studio and Contact retain their reading panels pending the Arcade review checkpoint; their separate scenes are not implemented. Nothing has been committed or published for this milestone.

This plan builds on [the previous city plan](CITY-PORTFOLIO-PLAN.md). It supersedes that plan's destination-panel presentation, its restriction against an embedded miniature puzzle, and its rule that Back to city always resets the camera. Preserve the current implementation until each replacement scene is ready.

## 1. Direction

Keep the city as the overview. Entering one of its four active buildings opens a different, purpose-built 3D scene inside the same explorer. Each destination gets its own composition, camera and interactions, instead of a closer view of the same city with a text panel beside it.

The complete visitor flow is:

**Homepage preview → expanded city → choose a building → enter its scene → interact or follow a portfolio link → return to the same city view.**

Scenes are miniature sets inspired by their destinations, not literal interiors of the existing geometry or models of real workplaces. This allows a workbench, railway and puzzle table to have useful proportions without fitting inside the tiny buildings.

Retain direct portfolio links throughout. No visitor must solve a puzzle, assemble an object, ride a tram or complete a tour to access work, employment or contact information.

## 2. Existing progress to reuse

The local implementation already provides a strong base:

- Nine city sites: four active destinations, two noninteractive Future space plots and three scenery buildings.
- Building signs, hover/selection footprints, occlusion-aware picking and matching destination buttons.
- Studio project content, chronological Journey content, Arcade routing and contact links drawn from shared sources.
- A native modal with desktop and phone layouts, scroll locking, keyboard access, focus handling, Escape and Close.
- One canvas and renderer shared between the hero and modal; lazy loading, bounded city controls, material batching, static shadows and demand-driven rendering.
- Static artwork and useful destination panels when WebGL is unavailable.
- Browser coverage for selection, navigation, gestures, reduced motion, focus, graphics recovery and idle rendering.

The preceding review passed formatting, lint, TypeScript, 47 model tests, the build, generated-site checks and 96 desktop/phone browser tests. These are baseline results, not validation of the new scenes.

The existing local work is uncommitted. Preserve it and extend it incrementally. Do not rebuild the original five-project building system or the discarded machine. The separate original interactive Site remains outside this work.

## 3. Destination scenes

| Destination | Separate setting      | Main interaction                          | Portfolio connection                        |
| ----------- | --------------------- | ----------------------------------------- | ------------------------------------------- |
| Studio      | Developer's workbench | Inspect and unfold project objects        | Five actual projects and their detail pages |
| Journey     | Miniature railway     | Send a tram between three named stops     | Supplied career dates, roles and employers  |
| Arcade      | Close-up puzzle table | Rotate mirrors and fire a beam            | A small playable introduction to Ricochet   |
| Say hello   | Café terrace          | Open a contact folio and choose an action | Email, social profiles and résumé           |

The four scenes share palette, lighting quality and navigation. Their activities should feel different. Avoid a common scene template that merely exchanges an object and a paragraph.

### Arcade: first complete scene

Create a tabletop Ricochet board inside a small arcade set. Keep the playable board front and centre, with the arcade sign and surrounding architecture as a quiet frame.

Reuse the existing first handcrafted lesson for the initial implementation. Its level data and reflection rules already exist and are tested. Import only the required level/model logic, not the full `/play` page or its entire application bundle. If a later bespoke city puzzle is wanted, author and validate it separately rather than silently changing a campaign lesson.

The reflection model is reusable. The Arcade milestone extracted `Board` into `src/play/Board.tsx` and shared path helpers into `src/play/board-path.ts`, without pulling in the page component, generated-puzzle features or persistence wiring. Keep the existing `/play` presentation and behaviour unchanged.

Interaction:

1. Enter to see an unsolved board, one instruction and clearly available mirror controls.
2. Clicking/tapping a mirror toggles its orientation; matching HTML controls provide keyboard and assistive-technology access.
3. Fire draws the beam through the board using the existing model's traced path.
4. A successful shot briefly lights the arcade sign and announces success. Misses state the actual outcome and invite another attempt.
5. Reset restores the original puzzle. Play full Ricochet is always visible and links to `/play`.

Use the existing beam/mirror timing limits and reduced-motion conventions. Keep the final beam visible until another action changes it. A failed shot is not a loss of progress or a timed penalty.

Use a fixed, readable board camera. Do not bind orbit dragging to the playable board: it would compete with mirror taps. Each target must remain at least 44 CSS pixels on a 320px screen; if the 3D projection cannot meet that, use the same-model accessible flat board presentation at that size.

Select the flat presentation from measured projected target dimensions and available stage width **and height**, not a phone-width breakpoint alone. The first lesson has six columns, requiring at least 264px of board width for 44px cells before surrounding padding. Re-evaluate after resizing and orientation changes; preserve puzzle state and focus when changing presentation.

The city's puzzle state lasts only for the current explorer session. It must not write campaign completion, daily completion or preferences to `/play` storage. There is no leaderboard, score, timer or forced reward screen.

### Journey: travel through career stops

Replace the selected-city sidebar with a miniature railway, three recognisable stations and a small tram. The stations represent chronological entries from the shared experience data: Nethues, Hippo Homes by Dalmia and Green Fortune Technologies. Dates and current-employment status come from that source.

Selecting a named station immediately updates the nearby HTML role card with that employer's name, role, dates and one short scope statement, and sends the tram along a visible track. Arrival provides visual confirmation only; animation never delays access to information.

Provide three station buttons and Previous/Next stop controls. No dragging of a precise slider is required. Use an overview that shows the whole short route on phones; a restrained follow-camera is optional on wider screens if it improves clarity.

Rapidly choosing another stop interrupts and retargets the trip. Under reduced motion or pause, move directly to the selected station. There is no continuously circling tram.

Keep Read experience and View résumé available. Read experience closes the explorer cleanly and moves to the existing homepage section. These are metaphorical career stops, not geographic addresses, company buildings or a claim about commuting.

### Studio: a workbench visitors can inspect

Create a close-up workbench with five distinct project objects, a small `ac` mark and room for one object to be inspected at a time. Use clearly labelled HTML project selectors so the objects do not become another unexplained mapping exercise.

Suggested decorative objects:

- Recon Desk: two trays holding paired record tiles.
- Operations: a field device beside a small workflow tray.
- CRM: a browser panel with a handset.
- Visualization library: a modular stack of selectable blocks.
- Website/CMS: a publishing folio with a page and editing layer.

These are visual cues, not product screenshots, deployment diagrams or new simulations of professional software. Keep the user's actual product demonstrations on their existing detail pages.

Selecting a project brings its object to the central inspection area and reveals its real title, existing index summary and View project link. A clearly named Inspect action unfolds or separates the object's parts: record trays slide apart, the device's stand opens, or the folio reveals its layers. Reverse the action with Put back. This is a small tangible interaction, not an invented claim about how the product is implemented.

Use bounded turn-left/turn-right controls where inspection benefits from another angle, with direct pointer manipulation as an optional equivalent. Do not require free orbit or precision dragging. Repeated actions must be reversible and settle into a clear resting pose.

At phone widths, feature one large object with all five project choices available in readable controls. Keep the objects ordered by the shared project list. Do not compress five tiny objects into the same narrow canvas or add screenshots to the workbench.

### Say hello: a quiet contact scene

Open into a small café terrace with a table, an `ac` contact folio and a restrained Delhi location cue. Keep this scene simpler than the puzzle and railway.

The folio can open once through an explicit action, giving the scene a tangible response. Email Ankit, GitHub, LinkedIn and View résumé are regular, readable HTML links available from the moment the scene opens. The folio's decoration does not gate them.

Use approved profile data. No fake message form, simulated message delivery, unsupplied availability claim or recurring contact animation. Follow existing email/external-link conventions; clicking Email opens the mail action, not a fabricated sent confirmation.

### Future spaces and scenery

Keep the two construction plots and the other three buildings in the overview. They do not load destination scenes, receive hover highlights or show dead-end dialogs. Retain the Future space signs and explanatory legend.

Only turn a plot into Work in progress after an actual ongoing project and approved description have been supplied. A future ready destination should join the scene registry rather than introduce another navigation system.

## 4. Entering and leaving scenes

### Entry transition

Building clicks and destination buttons trigger the same entry operation. Keep existing tap-versus-drag qualification and occlusion handling.

1. Capture the city camera and focus state before any entry movement.
2. Load the selected scene lazily. Keep the city visible, show Loading Arcade/Studio/etc. and keep Back/Close responsive.
3. When ready, briefly move toward the chosen landmark and use a short fade to replace the view with the destination set.
4. Render the new scene with its own camera, then focus its heading and announce the destination.

Aim for 450–650ms of total visual transition after assets are ready. Use the same canvas and an HTML fade layer; do not create a second renderer just to crossfade. Avoid a long fly-through, a camera passing through walls or a blank loading interval.

Keyboard entry, reduced motion and the existing pause preference switch directly to the final scene. If the user chooses another destination during loading, the latest request wins. A stale import completion must never reopen a scene after Back or Close.

Track each entry with a monotonically increasing request generation. Back, Close, recovery and newer selections invalidate the previous generation. Dynamic imports cannot be cancelled: ignore stale completions, and dispose any scene resources already created for a stale request. Keep activity state separate from these transient loading and transition operations.

### Return to city

Back to city restores the exact saved camera position, orbit target and zoom from before entry. It also restores focus to the corresponding destination button. Selecting a second room directly must not overwrite that saved city view.

The selected city's angle is deliberately different from the current implementation, which resets the overview on Back. Add explicit view capture/restore methods rather than trying to approximate the previous pose with a preset.

Capture the return pose once per excursion from the city, before entry motion. Direct room switches, retries and failed loads must not overwrite it. After a viewport resize, restore the saved position, target and zoom while recomputing projection for the current stage dimensions. Exact pose restoration does not promise identical pixels across different aspect ratios.

Escape always closes the whole explorer in one action. Close remains available during loading, animation, play and fallback. Closing restores the hero's compact default composition and page scroll; reopening begins at the normal city overview. Scene activity state is discarded when the explorer closes, but may survive room-to-room navigation within that open session.

### Controls and state

Use an explicit state model: closed, city overview, destination loading, destination active and destination error. Keep transition state separate from scene activity state. Centralise active-destination state so the renderer, heading, buttons and content cannot disagree.

Within a destination, keep the destination switcher and Back to city visible. Replace the generic city zoom/rotation bar with scene-appropriate controls. Do not show a misleading 170% city zoom value while displaying a puzzle table or railway.

Use distinct action names:

- City: Reset view resets only the city camera.
- Destination: Reset view resets that scene's camera or inspection angle where useful.
- Arcade: Reset puzzle resets mirrors and beam.
- Journey: First stop changes the selected station.
- Studio: Put back reverses the current object's inspection.

Do not install a global Home handler that resets a puzzle or unexpectedly exits a room. Keep canvas keyboard controls scoped to the active scene, with their instructions updated accordingly.

## 5. Layout, visual design and readability

Remove the permanent 340px city information sidebar as each separate scene replaces it. Let the new scene establish its own layout rather than squeezing it into the old selected-building panel.

On desktop, keep a compact header/navigation strip and a large central stage. Scene instructions, selectors and links sit beside or below the meaningful objects. Long Studio or Journey content uses a modest reading region with a visible scroll affordance; do not cover an interaction target with text.

On phones, retain the fullscreen explorer, prominent Close and Back, and readable destination controls. Stack interactive scene and content; for the Arcade prioritise a usable board over decorative room framing. In short landscape views, use side-by-side areas when it preserves control sizes.

Preserve local display/body/label fonts, cream/teal/apricot palette, strong contrast and 44px targets. Use HTML for all essential reading text and controls. Scene signs and texture text are supplementary. Selected state must have shape, text or outline cues as well as colour.

Give each set a distinct silhouette and purpose: low workbench, long railway, upright arcade framing, open terrace. Reuse material families and lighting quality so they still belong to the same portfolio.

## 6. Technical structure and scene lifecycle

Refactor the existing view incrementally rather than replacing it wholesale:

- Keep `city-model.ts` responsible for the overview's efficient geometry, landmarks and hit bounds.
- Extract the renderer host and active-view lifecycle from `city-preview.ts`. Retain the city camera, picking and capture/restore behaviour in a city-view module.
- Introduce lazy destination modules under a proposed `src/home/city-scenes/` directory: Arcade first, then Journey, Studio and Contact.
- Keep `city-explorer.ts` responsible for the native dialog, navigation state, load cancellation, focus and scroll lifecycle.
- Adapt `CityDestinations.tsx` into static headings, controls and useful content for the scenes. Preserve shared project, experience, profile and Ricochet sources.
- Keep `src/content/city.ts` as the typed destination registry; do not put camera coordinates or arbitrary scene animation values into project content.

Define a small common scene contract covering creation, activation, resize, input, snapshot/restore of activity state, settling motion, deactivation and disposal. A scene supplies its camera and accessible action mapping to the host. It must not create its own WebGL renderer, global animation loop or document-wide input handlers.

Activity controllers must not depend on renderer creation. Keep one lightweight source of truth for puzzle mirrors/shot, selected project and career stop; HTML and 3D consume that state rather than maintaining parallel copies. The flat puzzle, project selectors, career content and contact actions remain functional when WebGL initialization fails or a 3D module cannot load.

Retain the overview scene in memory because it serves the hero and return path. Initially retain only the active destination's GPU resources. Store lightweight activity state separately, and recreate a room from its already-loaded module when revisiting. Module caching and geometry caching are different: avoid retaining every room's meshes/textures indefinitely without measurement.

Dispose scene-owned geometry, textures, materials, listeners and controls on replacement. Shared resources must have explicit ownership so disposing one scene does not break another. Disable inactive controls, stop scene timers and release pointer capture on exit.

Use one demand-driven scheduler. Render while a camera, tram, beam or inspect action is changing, then stop. Recompute cached shadow maps on scene activation or when shadow-casting objects move; the current static-city shadow setting cannot be carried over unchanged to moving trams and objects.

Keep pixel density capped at 1.5, preserve lazy loading, and avoid adding a physics engine, animation framework, postprocessing stack or large texture pack for this stage. Use simple deterministic motion and existing Three.js capabilities.

## 7. Accessibility, fallback and failures

All useful information and actions remain available through HTML. Destination navigation must work without building picking. Headings receive focus on entry; Back returns it predictably; Tab containment includes the current scene's visible buttons, links and interactive controls while excluding inactive scene content.

The Arcade needs a genuinely playable non-WebGL presentation, not just an image of the board. Reuse the same level/model state with a flat SVG/HTML board and real buttons. Projected 3D click targets and accessible controls must map to the same mirrors, with clearly named orientations and announced shot results. Test screen-reader usability separately from axe checks.

When WebGL is unavailable, use static scene artwork where available, keep Studio selection, career stops and contact links functional, and present the flat Arcade. Do not offer camera controls that cannot work. The original homepage and script-free lite experience remain useful without JavaScript; no new scene code is added to lite.

If a scene import fails, keep the modal navigable and present its existing text content/links with Retry and Back to city. A loading error must not strand visitors on a blank canvas.

Context loss retains the chosen destination and lightweight activity state. On restoration, recreate the active scene resources and restore that state. If recovery fails, retain the HTML/flat fallback. Offscreen/hidden-tab changes settle finite motion without changing which room the user selected or treating an unfinished puzzle as solved.

## 8. Delivery stages

1. **Baseline and renderer boundary.** Record the current checks and behaviour. Add city view snapshot/restore and a shared scene host while preserving the existing panels. Verify repeated open/close and camera restoration before creating new experiences.
2. **Arcade vertical slice.** Complete overview → entry → playable table → full-game link → exact Back restoration, including keyboard, mobile and non-WebGL fallback. Keep other destinations on their existing panels during this milestone; make that transitional scope explicit in the review.
3. **Validate the interaction pattern.** Review the complete Arcade in both themes and narrow layouts before approving the remaining three scenes. Check whether it feels like entering a distinct place, whether controls are understandable and whether loading/return feel reliable. Establish resource and draw-cost measurements before multiplying scenes. Warm up the renderer and room modules first, then compare repeated room-switch cycles against a stable resource-count baseline; internal renderer caches need not return to zero. Record counts and load cost without calling them measured GPU bytes or an FPS benchmark.
4. **Journey scene.** Add stations, shared career content, interruptible tram movement and the existing experience/résumé actions. Test direct destination switching as well as returning through the city.
5. **Studio scene.** Build and review one project object's inspect interaction first, then add the other four using shared project content. Validate selection and access on phones without tiny objects or overloaded controls.
6. **Contact scene and visual consistency.** Add the restrained terrace, contact folio and working links. Check all four scenes as one experience and regenerate matching fallback artwork.
7. **Complete migration and documentation.** Remove obsolete selected-building panel/camera code only after its replacements and fallback uses are accounted for. Update the design contract, README and relevant tests to describe the implemented behaviour. Preserve the previous plan as the history of the first city stage.

No automatic deployment, dependency change or unrelated portfolio redesign is part of writing this plan. During implementation, review a complete Arcade slice before treating the full four-scene direction as visually finished.

### Arcade milestone review

The implemented table has a fixed oblique camera, a raised board and supplementary Ricochet sign. Its controlled flat board shares the original lesson and path helpers; neither representation imports campaign storage. Back restores a nondefault city pose even after room switching and aspect-ratio changes. Loading cancellation, failed-import retry, initial WebGL failure and context recovery have dedicated browser coverage.

Rendered review covered light/dark at 320×812, 375×812, 768×1024, 1024×900, 1440×1000 and 812×375. Phones and short landscape use the flat board; the reviewed tablet/desktop sizes use the table. The review caught and fixed opaque city-button styling covering the flat pieces, border rounding shrinking cells below 44px, and a clipped full-game link in landscape. The narrowest reviewed flat target is now approximately 44.3px in both dimensions. Full-game navigation and Back sit outside the scrollable instruction area.

Chromium WebGL instrumentation over five enter/return cycles recorded a stable warmed city baseline of 45 live buffer allocations and 9 textures. The warmed active Arcade used 60 buffers and 13 textures, returning to the same city baseline on each exit. These are API allocation counts, not measured GPU memory or an FPS benchmark. Idle/paused rendering is covered separately. The lazy Arcade chunk is approximately 5.11kB minified / 2.59kB gzip; the shared city/Three.js chunk remains approximately 579kB minified and still triggers Vite's existing 500kB warning.

Physical-device performance, real screen-reader interaction, Safari/Firefox and actual browser text zoom remain unverified. The Arcade composition is ready for owner review; this does not approve or implement the remaining three scene designs.

Validation passed formatting, lint, strict TypeScript, 48 model tests, production build and generated-site checks. Of 114 browser cases, 110 passed in the final parallel run; four desktop cases hit the 45-second limit and then all passed with one worker. No timeout limits or unrelated visual baselines were changed. Parallel-run timing remains a limitation of this validation, rather than a claim of a completely green single-run pipeline.

## 9. Verification and acceptance

Run formatting, lint, strict TypeScript, model tests, production build, generated-site checks and the browser suite. Reuse current city tests, deliberately updating assertions that expect the old sidebar or overview reset. Do not update unrelated visual baselines to hide a regression.

Add meaningful coverage for:

- Building clicks and destination controls enter the same scene; drag/pinch and scenery remain nonactivating.
- Exact city pose restoration after entry, room switching, Back, loading cancellation and resize.
- Latest-selection-wins loading, failed imports, retries, closing during a transition and reopening safely.
- One renderer/canvas, no inactive scene input, no idle render loop and no growing GPU-resource count after repeated scene changes.
- Scene-specific keyboard actions, focus containment, Back/Close/Escape, hidden controls and reduced motion.
- Arcade outcomes match the shared model, reset restores its initial state and no `/play` storage is modified.
- Journey station selection matches the correct employer/role/dates, including the current job and interrupted travel.
- Studio selectors use current shared content and all five project links remain accessible without inspection.
- Contact links match the profile and do not require opening the decorative folio.
- WebGL-unavailable and context-loss states retain content and usable actions, including the flat puzzle.
- Internal links finish dialog cleanup before section navigation; external and résumé links retain existing conventions.

Review light/dark at 320, 375, 768, 1024 and 1440px, plus short landscape layouts. Inspect the overview and every room, not just default entry screens. Check long content, browser text zoom, screen-reader interaction, touch targets and physical-device performance where available, reporting unavailable checks honestly.

The extension is complete when every active building opens a recognisably different scene, its interaction has a clear purpose, portfolio information remains directly accessible, and returning restores the visitor's place in the city. A camera zoom followed by the same information card does not meet that bar.

## 10. Scope and documentation changes

Update [DESIGN.md](DESIGN.md) alongside implementation to reflect these deliberate changes: separate scenes, the small Arcade game, scene-specific controls, exact city-view restoration and temporary per-session activity state. Keep unrelated colour, footer, typography, employment, source-content and lite rules intact.

Relevant foundations: [city explorer](../src/home/city-explorer.ts), [city rendering](../src/home/city-preview.ts), [city geometry](../src/home/city-model.ts), [current destination markup](../src/home/CityDestinations.tsx), [destination registry](../src/content/city.ts), [Ricochet model](../src/play/model.ts), [handcrafted levels](../src/content/levels.json), [Ricochet design notes](RICOCHET.md), [browser interactions](../tests/browser/interactions.spec.mjs) and [accessibility checks](../tests/browser/accessibility.spec.mjs).

Keep walking avatars, first-person controls, traffic systems, sound, achievements, saved city progression, full building interiors and extra future-room content outside this release. The first goal is four well-designed places with reliable entry, meaningful activity and easy return.
