# Stages 4–7 hand-off: Journey, Studio, Say hello and clean-up

These are working notes for finishing [CITY-ISLAND-EXPANSION-PLAN.md](CITY-ISLAND-EXPANSION-PLAN.md) stages 4–7. Behaviour rules come from [CITY-DESTINATION-SCENES-PLAN.md](CITY-DESTINATION-SCENES-PLAN.md) sections 3–7 and 9, so read both plans before starting. Delete this file in the stage 7 commit.

**Start condition:** stage 3 (see [CITY-ISLAND-EXPANSION-PLAN.md](CITY-ISLAND-EXPANSION-PLAN.md)) is committed **and the owner has approved it**. Stage 3 is implemented and awaiting that approval; its Arcade handoff has been retired. If the owner hasn't approved it, stop.

## Ground rules (every stage)

**Instructions and commits**

- Read `AGENTS.md` and `docs/DESIGN.md` (the city sections) first.
- Commit with the repo's configured personal identity, using Conventional Commits.
- End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never use `--no-verify`. If a hook reformats files, re-stage them and commit again.
- **Never push.** Pushing `main` deploys the live site. Ask before any destructive git operation.
- Comments only for a non-obvious "why". No ticket or Figma IDs.

**Content and claims**

- Copy comes from the existing sources only:
  - `src/content/projects.json` / `projects.ts`
  - `src/content/experience.ts`
  - `src/content/profile.ts`
  - `src/content/city.ts`
- Invent no outcomes, metrics, availability, addresses or product internals.
- 3D objects are visual cues, never screenshots or simulations of the products.
- Every word and action that matters stays in HTML. No animation, inspect step or folio gates information or links.

**Look and motion**

- Palette: cream `#eee5d2`/`#fffaf0`, teal `#245e58`, restrained apricot `#e6ad85`, plus the island water and sand. No purple and no new brand colours.
- Reuse the material helpers and light set-up of the Arcade table and city model, so scenes look like the same island.
- Motion is finite and settles. Nothing renders while idle. Under reduced motion and the site's pause preference (`body.motion-paused`), jump straight to the end state.

**Verification**

- Run the full gate before each commit: `npm run format && npm run check`.
- Then do a rendered review in light and dark at 320, 375, 768, 1024, 1440 and 900×420, checking the overview plus the new scene.
- Save screenshots to the scratchpad or `test-results/`, never to the repo.
- Report anything not checked (Safari, Firefox, real phones, screen readers) as unverified.

## Stage 4a: shared scene foundation (do first, inside the Journey work)

Stage 3c removed the Arcade's use of the city canvas. The new scenes draw on the **city canvas through the existing host** (one renderer) via `view.showScene(sceneView)` / `view.showCity()`. The `SceneView` contract is in `src/home/city-scenes/host.ts`.

### 1. Generic scene loader in `src/home/city-explorer.ts`

Rebuild it from the pre-3c `loadArcade`; view it with `git show 681a08b:src/home/city-explorer.ts`, around lines 230–295.

```ts
type SceneId = 'journey' | 'studio' | 'contact';
const sceneModules: Record<
  SceneId,
  () => Promise<{ createScene: SceneFactory }>
> = {
  journey: () => import('./city-scenes/journey'),
  studio: () => import('./city-scenes/studio'),
  contact: () => import('./city-scenes/contact'),
};
```

What it keeps from the old loader:

- **Stale-load guard:** `generation` is bumped by every selection, Back, Close and context loss. A completion whose generation is stale disposes anything it created and returns.
- **Phases:** `loading`, then `active`, or `error`.
  - While loading: the shared status text "Opening {name}…".
  - On error: "Retry {name}" and a note that the panel content below still works.
- **Entry reveal:** the Arcade UI pass retired the covering `#city-fade` overlay. Keep loading/error text and useful HTML visible throughout entry; do not restore that overlay for later scenes.
- **Activity state:** create it before the import, so the HTML works during loading, on error and without WebGL.
- **On activation:** `view.showScene(scene)`. On leave: `scene.dispose()`, then `view.showCity()`.
- **Return to the city:** `returnPose` capture/restore stays exactly as it is.
- **Scene controls:** city zoom/rotate/Reset stay disabled in scenes. Each scene brings its own controls in its panel.
- **Context loss and restore:** recreate the active scene from its activity state.

Markup: put one `#city-scene-loading` (role=status) and one `#city-scene-retry` button in `CityDestinations.tsx`, outside the sections, inside the panel navigation.

### 2. Tiny store helper: `src/home/city-store.ts`

`createStore<T>(initial)` with `subscribe`, `getSnapshot`, `getServerSnapshot` and `set(next | updater)`. It replaces the snapshot immutably.

Each scene's activity state is one store. Two sides use it:

- the React panel, via `useSyncExternalStore`;
- the 3D scene, via `subscribe`.

Stage 3c's `city-arcade.ts` can move onto this helper.

Lifetime: reset the stores on dialog open. Room state may survive switching destinations within one open; that matches the separate-scenes plan.

### 3. Scene module shape

Each scene lives in `src/home/city-scenes/<id>.ts`:

```ts
export function createScene(
  store,
  invalidate: (shadows?: boolean) => void,
  helpers,
): SceneView & {
  pick?(clientX: number, clientY: number): string | null;
};
```

- **Camera:** the scene owns an orthographic camera. Fit it in `resize` to the box left over after the city insets, with the same insets maths the city view uses. Measure the panel/drawer the way `measure()` does.
- **Backdrop:** the sky stays the CSS gradient. Each scene adds a band of the same water (reuse the water material and colours from `city-model.ts`; extract a small shared `island-materials.ts` if needed) so scenes match the island.
- **Shadows:** set `dynamicShadows: true` only while something that casts shadows moves.
- **Dispose:** free all geometry, materials and textures the scene created, and remove any listeners it added.
- **Input:** canvas picking only through the explorer's existing pointer handlers. Generalise the old `tappedMirror` path into `tappedSceneItem` and `scene.pick()`. The tap-versus-drag rule (6px) stays, and orbit stays off.

### 4. Panel layout

All scenes use the existing panel container:

- **Desktop:** a right drawer of up to 380px.
- **≤760px:** a bottom sheet.

The scene camera frames the stage area the panel leaves free. Keep the panel's existing reading content as the HTML source of truth, and add only the scene controls listed per stage.

### 5. Shared test helpers

In `tests/browser/fixtures.mjs` add:

- `enterDestination(page, id)`;
- a WebGL allocation counter (lift it from the Arcade GPU test).

## Stage 4: Journey coastal railway

**Set:** a stretch of shore with a single curved track (a `CatmullRomCurve3` of about 6 control points) running along sand beside water.

- **Stations:** three small stations, oldest first, using `cityExperienceOrder` = [2, 1, 0]:
  1. Nethues
  2. Hippo Homes by Dalmia
  3. Green Fortune Technologies, the current job

  Each station has a platform, a canopy (teal roof, cream posts) and a name board drawn on a CanvasTexture in the Label font. Company names keep their natural proportions and are never stretched.

- **Tram:** a small cream/apricot tram. The departure platform echoes the city's station canopy.
- **Not real places:** no real buildings, logos or addresses.

**Activity store:** `{ stop: 0 | 1 | 2 }`. It starts at the current job (index 2 in reading order), or at the stop the visitor last chose in this open.

**HTML panel** (rework `#city-panel-journey`):

- Keep the heading and the "fictional, not the companies' offices" line.
- **Station buttons:** a group of 3 buttons (`aria-pressed`), named by company.
- **Previous stop / Next stop:** disabled at the ends. Optionally add "First stop", per the action names in the scenes plan.
- **Role card** (`role="region"`, `aria-live="polite"`): company and note, role, dates, a "Current" badge for index 0 of `experience`, and `home.points[0]`. This is exactly the data the timeline shows today.
- **Links:** keep "Read experience" (`#experience`, with `data-city-section` so cleanup runs first). Add "View résumé" from `profile.resume` with the existing résumé link conventions.
- **Full timeline:** keep the full ordered timeline below as a "All roles" list, so no information depends on the scene.

**Motion:**

- Choosing a stop updates the card **immediately**.
- The tram then travels along the curve in at most `min(1400, 450 * |Δstations|)` ms with ease-in-out, rendering only while it moves.
- A new choice mid-trip retargets from the tram's current position along the curve (store `t` on the curve; never jump back).
- Reduced motion or pause places the tram at the stop instantly.
- On arrival, the stop's sign glows briefly (under 300ms) and then settles.

**Picking:** tapping a station (platform bounds) selects it. The tram is not a target.

**Camera:**

- Fixed and oblique, framing the whole route.
- Phones: the same whole-route view, never a follow-camera.
- Desktop: no follow-camera unless review shows the route is too small.

**Tests** (new `tests/browser/journey.spec.mjs`):

- **Selection:** buttons and canvas tap both select. The card shows the right company, role and dates for all 3 stops. The current job shows the badge.
- **Previous/Next:** the end stops disable the right button.
- **Interrupted trip:** select 1 then 3 quickly; it ends at 3 with no stale arrival glow on 1.
- **Reduced motion:** the tram renders immediately at the stop (check that draw count settles).
- **Links:** "Read experience" closes the dialog and focuses `#experience`. "View résumé" has the right href.
- **Return:** Back restores a non-default city pose. Switching Journey → Arcade → Journey also works.
- **Failures:**
  - Failed import (route-abort `/assets/journey-*.js`): the panel works, Retry recovers.
  - No WebGL: the panel works.
  - Closing during load activates nothing.
- **Idle and GPU:** no idle draws, and stable allocations over 5 enter/leave cycles.
- **Accessibility:** run axe with Journey open in both themes.

**Docs:** update the Journey lines in DESIGN.md (the destinations paragraph near line 173, and replace the "retain reading panels" sentence near line 175).

**Commit:** `feat: open Journey as a coastal railway scene`.

## Stage 5: Studio workbench

Two commits: a single-object slice for review, then the remaining four.

**Set:**

- A wooden workbench (wood `#b18d66`) by a window with the water visible beyond, a small `ac` mark, and a central inspection mat.
- The objects sit on the bench in shared project order (`projects.ts` order):

| Project (slug)  | Object                                              | Inspect does                           |
| --------------- | --------------------------------------------------- | -------------------------------------- |
| `recon-desk`    | Two trays of paired record tiles                    | Trays slide apart; matched tiles align |
| `operations`    | Field device on a stand, small workflow tray beside | Stand opens, tray slides out           |
| `sales-crm`     | Browser panel with a handset                        | Handset lifts, panel tilts up          |
| `visualization` | Stack of modular blocks                             | Blocks separate into layers            |
| `website-cms`   | Publishing folio                                    | Folio opens to show page + edit layer  |

- Objects are simple primitives (RoundedBox, Cylinder). No text on them except the `ac` mark, no screenshots and no logos.

**Activity store:** `{ selected: slug, inspected: boolean, angle: -1 | 0 | 1 }`. It starts with the first project selected and not inspected.

**HTML panel** (rework `#city-panel-studio`):

- **Selector:** a group of 5 project buttons (`aria-pressed`) in shared order.
- **Detail for the selected project:** its real `name`, `indexSummary ?? summary`, and **View project** (`/work/{slug}`).
- **Actions:**
  - **Inspect / Put back**: one toggle button whose label changes, with `aria-pressed`.
  - **Turn left / Turn right**: bounded to ±1 step of 25°. Each button is disabled at its limit.
  - **Reset view**: returns to angle 0 and puts the object back.
- **Always visible:** keep the full list of 5 projects and their links ("All projects"), so every project link works without inspecting anything.

**Motion:**

- Selecting moves the chosen object onto the mat and the previous one back to its slot: one 350ms ease-out move.
- Inspect and Put back take 300ms.
- Turning takes 200ms.
- Everything is interruptible, retargets from the current pose, and settles.
- Reduced motion or pause: instant.

**Phones (≤760px):** frame only the mat object, large. The bench objects are offscreen or hidden from the camera; selection happens through the HTML buttons. Never shrink five objects into a narrow canvas.

**Picking:** tapping a bench object selects it. Tapping the object on the mat toggles Inspect.

**Slice (commit 1):**

- Build the bench plus **Recon Desk only**.
- The other four buttons still select and show their text, but no 3D object moves for them yet; show the mat empty with a soft placeholder plinth.
- Do the rendered review.
- Commit: `feat: open Studio as a workbench with the Recon Desk object`.

Pause here and report to the owner, per the plan ("one project object with Inspect first, reviewed"). Continue only once approved.

**Remaining four (commit 2):** add the other objects, then commit `feat: add the remaining Studio project objects`.

**Tests** (`tests/browser/studio.spec.mjs`):

- **Selection:** button and canvas selection both work. The detail shows the right name, summary and link for all 5.
- **Inspect:** Inspect/Put back toggles the name and pressed state. The turn limits disable correctly.
- **Links:** all 5 links work without inspecting.
- **Phone:** one large object, and the 5 buttons are ≥44px.
- **Reduced motion:** instant.
- **Failures:** failed import + Retry, no WebGL, and close during load.
- **Idle and GPU:** no idle draws and stable allocations.
- **Return:** Back restores the pose.
- **Accessibility:** axe in both themes.

## Stage 6: Say hello harbour terrace

**Set:**

- The café terrace at the end of the island pier (reuse the pier and planks look from `city-model.ts`): two tables with parasols, a moored boat, and water on three sides.
- On the front table, a cream folio with a teal `ac` mark.
- Delhi is a quiet cue only: the HTML says "Based in Delhi, India." No map, skyline or coordinates.
- Simpler and calmer than the other scenes.

**Activity store:** `{ open: boolean }`.

**HTML panel** (keep the current `#city-panel-contact` content exactly; the links are live from the start):

- Location line, **Email Ankit** (`mailto:`), GitHub, LinkedIn, View résumé. Keep the existing external-link attributes.
- Add one button, **Open folio / Close folio** (`aria-pressed`). It only animates the folio: the cover hinges open over 400ms and the inside shows the email and the `ac` mark on a CanvasTexture.
- Nothing is gated, and there is no form, sent confirmation or availability claim.
- Tapping the folio in the canvas toggles it too.

**Motion:** only the folio hinge. Optionally, a parasol fabric settles once on entry (under 400ms). No looping water or boat motion.

**Tests** (`tests/browser/contact-scene.spec.mjs`):

- **Links:** each href equals the profile value and is usable before the folio opens.
- **Folio:** the toggle sets its name and pressed state, works on canvas tap, and is instant under reduced motion.
- **Failures:** failed import + Retry, no WebGL, and close during load.
- **Idle and GPU:** no idle draws and stable allocations.
- **Return:** Back restores the pose.
- **Accessibility:** axe in both themes.

**Consistency review across all 4 scenes:** compare the same sky, water band, light warmth, material roughness, sign typography, panel layout and control naming. Fix any drift.

**Commit:** `feat: open Say hello as a harbour terrace scene`.

## Stage 7: clean-up and documentation

1. Remove leftover selected-building code:
   - `view.focus(id)` paths used only for destination close-ups;
   - unused `.city-panels` styles;
   - any `[data-destination=…]` CSS that no scene uses.

   Check every use with `grep` before deleting. Keep the fallbacks for no-WebGL and failed imports.

2. **Fallback art:** regenerate the city posters if city geometry changed (`city-neighbourhood.webp` and `city-neighbourhood-dusk.webp`, 1236×1030, transparent, from the hero canvas). Add per-scene fallback art only if review shows an empty stage looks broken without WebGL.
3. **DESIGN.md:**
   - Replace the "Arcade is the first complete scene… other panels retain reading panels" text with the final four-scene rules: each scene's controls, motion limits, phone layout and fallback.
   - Update the architecture list: `city-store.ts`, `city-scenes/{journey,studio,contact}.ts` and the loader.
4. **README:** a short "City explorer" note pointing to DESIGN.md.
5. **RICOCHET.md:** make sure it is current after stage 3.
6. **Plan status:**
   - Mark stages 4–7 done in CITY-ISLAND-EXPANSION-PLAN.md.
   - Add a "Scenes review" section to CITY-DESTINATION-SCENES-PLAN.md, like the Arcade milestone review. Include:
     - warmed WebGL buffer and texture counts for the city and each scene;
     - lazy chunk sizes (raw/gzip) per scene;
     - the shared Three.js chunk size;
     - an explicit list of what is unverified.

     State these as allocation counts and chunk sizes, never as GPU memory or FPS claims.
7. **Delete this handoff file.** The Arcade stage-3 handoff was already retired at its milestone.
8. **Final check and commit:** run `npm run check` in full, then commit `docs: record the finished city scenes` (code removals may be a separate `refactor:` commit).

Then stop and report to the owner. **No push.**

## Performance budget (all scenes)

- Each scene is its own lazy chunk; aim for under 15kB gzip each. Never add scene code to the shared Three.js chunk.
- No new dependencies, physics, animation libraries, postprocessing or texture packs. Only CanvasTexture labels and procedural geometry.
- Cap pixel ratio at 1.5 (from the host).
- Static shadows except while a shadow caster moves.
- Repeated enter/leave cycles return to the warmed city baseline (stage 2 recorded 45 buffers / 9 textures; re-measure first, since the island changed it).
