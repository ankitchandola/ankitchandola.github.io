# Portfolio city: island, 3D Ricochet and destination worlds

Implementation plan · 5 November 2026

This plan extends the [separate-scenes plan](CITY-DESTINATION-SCENES-PLAN.md), which remains the source for scene lifecycle, loading, return-to-city, accessibility and fallback rules. It adds three things the owner has asked for:

1. The city sits on an island in water, with sky, light and shading that make it a place rather than a tile floating on a page.
2. Ricochet gets a complete 3D presentation at `/play`, covering every mode of the existing game, and the city Arcade shares that renderer.
3. Each destination opens its own view, distinct from the city overview, and all of them belong to the same island world.

Stage 1 (island and atmosphere) is implemented; see DESIGN.md for the settled rules. Already delivered and committed before this plan: the full-screen explorer (`37a7cce`) and distinct destination buildings with rooftop signs (`b742fe7`). Neither commit is deployed yet.

## 1. Principles

- **One world, separate places.** The overview is the island. Each destination is its own set with its own camera, sharing the island's water, sky, palette and light so it feels like going somewhere on the same island.
- **Content stays direct.** No puzzle, ride or animation gates project, career or contact information. HTML holds every essential word and action.
- **The rules stay in one place.** `src/play/model.ts` stays the only code that knows Ricochet's rules. The 3D view renders its state and sends the same reducer actions as the SVG board.
- **Nothing renders while idle.** Water, sky and scenes are static between interactions. Motion is finite and settles: a beam, a mirror turning, a tram trip, a camera move.
- **The palette holds.** Cream, teal and restrained apricot, plus a water colour family and a sand/stone shore. Purple accents and new brand colours are not allowed.

## 2. Island and atmosphere

### Composition

- **Island:** the current plate becomes the island top. Replace the rectangular base with an irregular, rounded coastline: a low stone or sand shore band extruded from a `Shape`, with a slightly darker lip at the waterline. The roads, plaza and nine plots stay where they are.
- **Water:** a large plane well beyond the frame, so the full-screen explorer shows sea to every edge. Shallow water around the shore is lighter, deep water darker, both as a baked radial gradient texture rather than a shader.
- **Shore details** (few, deliberate): a short pier on the café side, a few rocks, one moored boat. The pier sets up Say hello's harbour terrace. No lighthouse, traffic, birds or crowds in this stage.
- **Sky:** a CSS gradient behind the transparent canvas, defined as tokens so light and dark themes can differ. A gradient texture can't drift out of step with the page, and it costs nothing to render.
- **Edges:**
  - In the full-screen explorer, the water's far edge fades into the sky gradient's horizon colour, so no edge is ever visible.
  - In the compact hero preview, the water fades to transparent in a soft oval around the island, so the hero still sits on the page background instead of becoming a blue rectangle.

### Light and shading

- **Lighting:** a warmer sun, with the hemisphere light's ground colour tinted toward the water so the undersides pick up a cool bounce. Compare ACES (current) against AgX tone mapping on screenshots before choosing.
- **Ambient occlusion:** bake it into the batched city geometry as vertex colours (darker where walls meet ground and under canopies). It costs nothing per frame, unlike postprocessing (SSAO/N8AO).
- **Shadows:** keep the cached static shadows and enlarge the shadow camera to cover the shore. Check that the 1024 map stays sharp enough over the bigger area; if not, use 2048 for the city only.
- **Depth:** a light fog, or a depth-based fade on the water only, so distant water recedes. Orthographic cameras make linear fog depend on camera distance, so test it at every zoom.

### Framing

- **Camera fit:** the camera still fits the city plate, not the whole island. Coast and water spill past the frame, which is what removes the floating-tile look.
- **Phones:** the 130% portrait overview stays; the island's shore shows at the cropped corners.
- **Poster:** regenerate the static poster (transparent PNG, 1236×1030) from the hero canvas. Its transparent oval edge must match the live hero.

### Dark theme

Decided: dusk. A deep teal-blue sky gradient and darker water, the same buildings with slightly reduced exposure, and warm lit windows as a baked emissive layer on the glazing. This uses the dark theme's existing contrast tokens; the HTML overlays don't change. The theme switch rebuilds materials without reloading the scene.

## 3. 3D Ricochet

### Goal

The whole game (Learn campaign, Random easy/medium/hard and Today's puzzle) plays on a 3D table in both the city Arcade and `/play`, with the same rules, levels, progress and preferences as today. `/play` also keeps shared links. The SVG board remains the accessible fallback and the narrow-screen presentation in both places.

### Shared renderer

- **Extraction:** extract the Arcade table from `src/home/city-scenes/arcade.ts` into a level-driven module, for example `src/play/three/table.ts`. It takes any parsed level (up to 6 columns, up to 8 rows, up to 8 mirrors) and builds walls, source, target, mirrors and the board frame from it. It does not hard-code lesson one.
- **Interface:** it implements the existing `SceneView` contract plus `sync(state, animate)`, `pickMirror()` and a projection helper that returns each mirror's and the source's on-screen rectangle.
- **Users:** the city Arcade and `/play` both use it, and both run the whole game (section 3, "One game in two places").
- **Renderer ownership:** `/play` gets its own small host built from `city-scenes/host.ts` (one renderer, demand-driven, context-loss recovery). It does not load the city.

### What the table shows

- **Mirrors:** rotate in 120ms. Under reduced motion or pause they settle instantly.
- **Beam:** a lit tube or extruded strip that draws along `beamPoints` in at most 600ms, ending exactly where the SVG beam ends for each outcome:
  - **hit:** stops at the target's outer ring;
  - **blocked:** stops at the face of the wall;
  - **escaped:** runs off the board edge;
  - **loop:** closes on itself, with a dashed overlay along the cycle.
- **Outcome feedback:** a hit lights the target and briefly the sign. A blocked shot gives a short pulse on the wall face. An escaped beam fades past the rim. Feedback is finite and never loops.
- **Level changes:** pieces settle into place in a short staggered drop (under 400ms total), instant under reduced motion. Undo and Reset animate only the mirrors that change.
- **Camera:** fixed and oblique, re-fitted to each level's width and height. There is no orbit on the playable board, because it would compete with mirror taps. An optional "Turn table" control can step the view by 90°. Defer it unless review shows a level reads badly from the default angle.

### Accessibility and input

- **Mirror buttons:** keep real buttons for every mirror and for the source. In 3D they are transparent HTML buttons positioned over the projected rectangles from the table's projection helper, and they keep their current names (row, column, slant) and the same reducer actions. Canvas picking becomes a convenience for clicks between buttons, not the primary target.
- **Size check:**
  - Measure the projected mirror rectangles after every resize and level change.
  - If any falls below 44×44 CSS pixels, or the stage is too short, switch to the SVG board. Selection follows measurement, not a breakpoint, and the switch keeps state and focus.
  - Expect phones in portrait to use the SVG board for 8-row hard levels.
- **Unchanged rules:**
  - Outcomes are announced in the status region.
  - There are no single-key shortcuts.
  - Undo and Reset follow `canUndo`/`canReset`.
  - The `--rc-*` colour roles and their 3:1 checks keep their meaning. 3D materials take their colours from the same tokens, read from CSS at creation.

### Loading and fallback

- **First render:** `/play` stays prerendered with the SVG board, so hydration and no-WebGL visitors are unaffected.
- **3D upgrade:** after mount, if WebGL2 is available and the table fits, lazy-import the 3D module and swap presentations without moving focus. Three.js is not in the `/play` bundle until then.
- **Presentation toggle:** a visible "3D table / Flat board" toggle, saved as an optional `presentation` field in the existing v1 `ricochet-prefs`. `loadPrefs` already drops invalid fields one by one, so no version bump is needed. Reduced motion does not force Flat; it only removes animation.
- **Failures:** import failure, context loss and failed recovery all fall back to the SVG board with the puzzle state intact.

### Rules and storage unchanged

- **Rules:** `model.ts`, `solve.ts`, `generate.ts`, `levels.json` and all saving rules stay as documented in [RICOCHET.md](RICOCHET.md). Progress still saves only when a shot newly hits.
- **One game in two places:** the city Arcade is the full 3D game, not a taster. It offers the same modes (Learn, Random easy/medium/hard, Today), Undo, Reset, Next and New puzzle as `/play`, from one shared game controller built on `createReducer`, so the two can never drift apart. Progress and preferences are shared through the existing `ricochet-solved` and `ricochet-prefs` storage, so a lesson solved in the city counts at `/play` and vice versa. The Arcade keeps an "Open full page" link to `/play` for a bigger board and share links; Copy link and URL query handling stay on `/play` only, because the city must not rewrite the homepage URL. This replaces the earlier DESIGN.md rule that the city Arcade plays only lesson one and never writes campaign progress; update that rule in this stage.
- **Docs:** RICOCHET.md gains a short "Presentations" section describing the 3D table, the projection overlay and the fit rule.

## 4. Destination worlds

Each destination keeps the behaviour specified in the separate-scenes plan. The island gives the sets a shared setting.

| Destination | View                                                                                                                                                                                    | Island tie-in                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Studio      | Close-up workbench with five project objects. Select, Inspect and Put back, as already planned                                                                                          | Workshop window looks out to the water                                                        |
| Journey     | Miniature coastal railway with three stations (Nethues, Hippo Homes by Dalmia, Green Fortune Technologies). Choosing a stop updates the HTML role card and sends a tram along the track | The line runs along the shore; the city's station canopy is its departure point               |
| Arcade      | The full 3D Ricochet game from section 3, sharing progress with `/play`                                                                                                                 | The table sits by an open window or arcade door over the water                                |
| Say hello   | Harbour café terrace at the end of the pier, with a contact folio. Links are live from the moment the scene opens                                                                       | Uses the pier added to the island; Delhi stays a quiet location cue, not a map or coordinates |

Scene backgrounds use the same sky gradient and a band of the same water, so moving between the city and a destination never looks like a different website.

Journey's stations are metaphorical career stops. They are not company buildings, real addresses or a claim about commuting, and the HTML says so as the current panel does. Dates, roles and current-employment status come from the shared experience data only.

## 5. Delivery stages

Each stage ends with a rendered review and a commit before the next starts. Stages 1–2 can proceed now; the stage-3 checkpoint gates the rest.

1. **Island and atmosphere.** Coastline, water, pier, rocks, boat, sky tokens, warmer light, baked occlusion, shore shadows, the edge treatment for the hero and the explorer, and the poster. Implement dark-theme dusk if approved.
2. **Shared Ricochet table.** Extract the level-driven table, port the city Arcade onto it with no visible change except quality improvements, and add the projection helper and mirror-rectangle measurements. Browser coverage: Arcade parity, fit switching, GPU resource stability across repeated entries.
3. **Full 3D game in the Arcade and `/play`.** Extract a shared game controller from `Ricochet.tsx` (modes, reducer, storage, results), then build the presentation toggle, overlay buttons, level-change motion, outcome feedback, the preference field and fallbacks, and mount the same game in the city Arcade with its explorer-specific controls. Review every campaign level plus easy/medium/hard random and today's puzzle in both places, at 320, 375, 768, 1024 and 1440px in both themes. **Checkpoint:** owner review of the game before more scenes are built.
4. **Journey coastal railway.** Stations, track, interruptible tram, role card, Previous/Next stop, Read experience and View résumé.
5. **Studio workbench.** One project object with Inspect first, reviewed; then the other four in shared project order.
6. **Say hello harbour terrace.** Terrace, folio, live links, and consistency review of all four scenes.
7. **Clean-up and documentation.** Remove the remaining selected-building panel code once every destination has its scene. Update DESIGN.md, RICOCHET.md, README and tests; regenerate the posters and fallback artwork; record measurements.

## 6. Performance budget

- **Lazy loading:** Three.js stays lazy everywhere. The `/play` 3D module and each destination load only when used.
- **Pixel density:** capped at 1.5. No postprocessing stack, physics engine, animation library or large texture packs.
- **Baseline:** record warmed WebGL buffer and texture allocation counts for the city, the Arcade, `/play` and each new scene, as the Arcade milestone did. Repeated enter/leave cycles must return to the same baseline.
- **Idle:** no draws while idle, checked by the existing draw-count tests, extended to `/play` and every scene.
- **Bundle:** report chunk sizes per stage. The shared Three.js chunk already exceeds Vite's 500kB warning; do not grow it with scene code that can be lazy.
- **Honest reporting:** these are allocation counts and bundle sizes, not GPU memory or FPS claims. Physical-device testing is reported as unverified unless it is actually done.

## 7. Verification

Every stage runs the full project check: formatting, lint, strict TypeScript, model tests, build, `python tests/check-site.py` and the browser suite.

**Stage-specific coverage:**

- **Island:** idle draw count, hero/explorer edge treatment in both themes, poster parity, scenery picking still blocked by foreground objects.
- **Ricochet table:** the 3D and SVG presentations reach identical outcomes for every shipped level and for seeded generated levels, because both consume one reducer. Overlay buttons stay aligned with projected mirrors after resize. The fit switch preserves focus. A level solved in the city Arcade shows as solved at `/play` and the reverse; the city never changes the homepage URL. Shared links, the daily seed and progress saving behave as before.
- **Scenes:** the checks already listed in section 9 of the separate-scenes plan.

**Rendered review:** light and dark at 320, 375, 768, 1024 and 1440px plus short landscape, covering the overview, every destination and every game mode. Unavailable checks (physical devices, screen readers, Safari/Firefox) are reported as unverified.

## 8. Decisions

| Decision                                         | Recommendation                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Dark theme for the island                        | Decided: dusk with lit windows                                                           |
| `/play` default presentation when the table fits | Decided: 3D table, with the Flat board one tap away and remembered                       |
| City Arcade scope                                | Decided: the full 3D game with every mode, sharing progress and preferences with `/play` |
| "Turn table" control                             | Defer until review shows a level needs it                                                |
| Order after 3D Ricochet                          | Journey, then Studio, then Say hello, as above                                           |
| Deployment                                       | Decided: push after stage 1 (island); later pushes on the owner's request                |

## 9. Out of scope

Walking avatars, first-person or free-fly cameras, physics, sound, achievements, leaderboards, saved city progress, ambient traffic or crowds, continuous water animation, and any new claims in project, career or contact content. Lite stays script-free and gains none of this.
