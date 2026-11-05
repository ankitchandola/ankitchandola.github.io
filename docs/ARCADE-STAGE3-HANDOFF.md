# Stage 3 hand-off: finish 3D Ricochet on /play and in the city Arcade

Working notes for whoever finishes stage 3 of [CITY-ISLAND-EXPANSION-PLAN.md](CITY-ISLAND-EXPANSION-PLAN.md). Delete this file in the final 3c commit.

## Ground rules

- Read `AGENTS.md`, `docs/DESIGN.md` (city and Ricochet sections) and plan section 3 before editing.
- Commit as the repo's configured personal identity. Use Conventional Commits, one coherent change per commit, and end each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never use `--no-verify`. If a hook reformats files, re-stage them and commit again.
- **Do not push.** Pushing `main` deploys the live site. The owner pushes after their review.
- No force-push, `reset --hard` or deleting other people's work.
- Comments only for a non-obvious "why". No ticket or Figma IDs.
- `src/play/model.ts` stays the only code that knows the rules. Never fork game logic into the city.
- Full gate before every commit: `npm run check` (format, lint, typecheck, unit tests, build, check-site, Playwright). Run `npm run format` first. Browser tests use the built `dist`, so run `npm run build` before running Playwright on its own.
- Report honestly. If a check can't run, say so; never claim it passed.

## Already done (committed, not pushed)

- `a41f26f`: level-driven table (`src/play/three/table.ts`) plus projection maths (`src/play/three/projection.ts`).
- `681a08b`: shared controller `createGame({ urls })` in `src/play/game.ts`, and view parts in `src/play/GameParts.tsx` (`useGame`, `useHeadingFocus`, `Modes`, `Heading`, `Controls`, `Status`, `Pickers`).

## Step 3b: /play 3D table (code written, uncommitted)

These files are new or modified:

- `src/play/BoardView.tsx`
- `src/play/three/surface.ts`
- `src/play/table-fit.ts`
- `src/play/three/projection.ts`
- `src/play/progress.ts` (adds `presentation`)
- `src/play/play.css`
- `src/play/Ricochet.tsx`
- tests: `tests/table.test.mjs` and `tests/browser/{interactions,visual,accessibility}.spec.mjs`

Steps:

1. **Fix the one failing test.** In `tests/browser/interactions.spec.mjs`, in test "puzzle plays on the 3D table when it fits and remembers the flat board choice" (near line 1063), replace

   ```js
   await page.setViewportSize({ width: 700, height: 900 });
   await expect(view).toHaveAttribute('data-presentation', 'flat');
   ```

   with

   ```js
   await page.setViewportSize({ width: 420, height: 900 });
   await expect(view).toHaveAttribute('data-presentation', 'flat');
   await expect(page.getByRole('group', { name: 'Board view' })).toHaveCount(0);
   ```

   Lesson 1 still fits in 3D at 700px, so this is a test mistake, not a bug.

2. Run `npm run build`, then `npx playwright test tests/browser/interactions.spec.mjs tests/browser/arcade.spec.mjs tests/browser/visual.spec.mjs tests/browser/accessibility.spec.mjs`.
   - The city Arcade uses the new table framing (asymmetric bounds, 1.1 margin).
   - If the arcade tap test fails, it should already import `frameTable`/`mirrorRects` from src, so check the framing. Do not loosen the assertions.
3. Run `npm run check`. It must pass fully.
4. Commit: `feat: play Ricochet on a 3D table on /play`.

## Step 3c: the full game in the city Arcade

### Target behaviour

The Arcade destination is the whole game: Learn, Random easy/medium/hard and Today. It has Undo, Reset, Next and New puzzle, uses the same storage as `/play`, and offers the same 3D/Flat toggle. It shows the 3D table when it fits and the flat board otherwise.

Kept:

- the "Play full Ricochet" link (`#arcade-full`) and Back to city;
- Escape closes the dialog;
- city orbit, zoom and Home reset stay disabled in the Arcade.

Not in the city:

- Copy link and any URL change (`urls: false`; pass `share={false}` to `Controls`);
- the old "lesson one only / never writes progress" rule, which is retired.

### Architecture (recommended)

The Arcade gets its own canvas through `BoardView`, the same component `/play` uses. The city renderer pauses while the Arcade is open. This drops all canvas picking and the `ArcadeView` lifecycle from the explorer; the `BoardView` overlay buttons handle taps and keyboard.

1. **City/Arcade signal store**: new `src/home/city-arcade.ts`, framework-free.

   ```ts
   interface CityArcadeSnapshot { session: number; active: boolean }
   export const cityArcade = { subscribe, getSnapshot, getServerSnapshot, open(), setActive(active) };
   ```

   - `open()` increments `session`; call it each time the dialog opens.
   - `setActive(active)` sets `active` to `selected === 'arcade' && dialog.open`.
   - Keep the snapshot immutable, replacing the object on each change, like `game.ts`.

2. **`CityArcade` component**: new `src/home/CityArcade.tsx`, rendered inside the hydrated tree.
   - Read the store with `useSyncExternalStore`.
   - Create the game per session so each dialog open re-reads storage changed at `/play`:

     ```tsx
     function CityArcadeGame({ active }) {
       const [game] = useState(() => createGame({ urls: false }));
       useEffect(() => game.start(), [game]);
       ...
     }
     // parent: <CityArcadeGame key={session} active={active} />
     ```

     Room state is kept while switching destinations within one open, and resets on a new open. Mention this in DESIGN.md.

   - It renders two parts. They live in different DOM places, so either export two components that share one game through a context provider wrapping both, or lift the game into the store keyed by session.
     - **Stage part**, which replaces `<ArcadeBoard />` in `src/home/Hero.tsx`: `<BoardView game={game} active={active} fill />` inside a wrapper `div#arcade-stage`, hidden unless the Arcade is selected.
     - **Panel part**, inside `#city-panel-arcade` in `src/home/CityDestinations.tsx`, keeping the `h3#city-heading-arcade` (tabIndex -1) and the summary:

       ```
       <Modes game />  <Heading game level="h4" headingRef />  <Controls game share={false} />
       <Status game id="arcade-result" exit={<a href="/play">Open full page</a>} />  <Pickers game />
       ```

       - Extend `Heading`'s `level` prop type to `'h2' | 'h3' | 'h4'`.
       - Use `useHeadingFocus(game)` so Next or lesson picks focus the level heading, as on `/play`.
       - Keep the opening focus on `#city-heading-arcade`.
3. **Explorer** (`src/home/city-explorer.ts`). Remove:
   - `createArcadeActivity`, `arcadeScene`, `loadArcade`, `releaseScene`'s arcade disposal and `presentation()`;
   - `useFlat`, `tappedMirror`, the `pickMirror` code in `pointermove`/`pointerup`/`click`;
   - the Tab special case for `city-heading-arcade` → `[data-board-fire]`;
   - the `#arcade-loading`/`#arcade-retry` handling. `BoardView` has its own note and "Retry 3D".

   Then add or change:

   - **Opening the Arcade:** in `showDestination`, when `id === 'arcade'`, call `view?.setPaused(true)`, set phase `'active'` and call `cityArcade.setActive(true)`.
   - **Leaving the Arcade:** for any other id, call `view?.setPaused(false)` and `cityArcade.setActive(false)`, then do the existing focus/restore.
   - **Dialog open and close:** on open, `cityArcade.open()`. On `finishClose`, `setActive(false)` and `setPaused(false)`.
   - **Canvas:** while the Arcade is selected, the city canvas is `tabIndex=-1`, `aria-hidden="true"` and hidden by CSS. Drop the arcade-specific `aria-label`/`aria-describedby`.
   - **Context loss:** the `city-unavailable`/`city-available` handlers no longer touch the Arcade, because `BoardView` handles its own context loss.
   - **Fade:** keep the `#city-fade` animation on entering the Arcade if it still reads well. Otherwise drop it and use instant under reduced motion.

4. **Pause API**: `src/home/city-scenes/host.ts` and `src/home/city-preview.ts`.
   - Add a `paused` flag to `createSceneHost`. `draw` and `invalidate` return early while paused. `pause()` calls `stop()`; `resume()` calls `invalidate(true)`.
   - Expose it as `setPaused(value)` on the city view.
   - One city context stays alive while paused. Only the Arcade canvas draws.
5. **Delete**:
   - `src/home/ArcadeBoard.tsx`
   - `src/home/city-scenes/arcade.ts`, `arcade-state.ts` and `arcade-activity.ts`
   - the `arcadeLevel` import in `CityDestinations.tsx`
   - the old `.arcade-controls` markup, `#arcade-loading` and `#arcade-retry`

   Also delete the Arcade test in `tests/play.test.mjs` (its rules are covered by `tests/game.test.mjs`). Leave `SceneView`/`showScene` in place; later scenes (Journey, Studio, Say hello) use them.

6. **CSS** (`public/assets/theme.css`, around lines 1584–1700, the `.arcade-flat` and `[data-destination='arcade']` rules). Inspect the full cascade first and remove dead rules rather than overriding them.
   - **Above 760px:** the panel is the normal right drawer (≤380px) holding the panel part and scrolling on its own. The stage left of it holds `#arcade-stage`, filling the area between the top bar and the bottom of the stage. `BoardView fill` measures this box.
   - **At 760px and below:** keep the bottom sheet. The stage above it holds the board. It will usually be the flat board; that is expected.
   - **Flat board in fill mode:** `.ricochet-view.is-fill` must size the SVG board to fit inside both dimensions (`max-height: 100%`, keep its aspect, centre it). Check `play.css` `.is-fill`.
   - **Fixed rules:** 44px targets, 17px body and ≥13px labels. Back to city stays visible. No horizontal scroll at 320px.
   - **Styles:** `play.css` styles must reach the city. Import `../play/play.css` from `CityArcade.tsx`; `arcade-activity.ts` used to import it.

### Tests (`tests/browser/arcade.spec.mjs`: rewrite to the new markup)

Keep the `enter()` helper. Replace the old selectors:

- `[data-arcade-mirror]` → `[data-table-mirror]:visible, [data-board-mirror]:visible`
- `[data-arcade-action="fire"]` → `[data-table-fire]:visible, [data-board-fire]:visible`, or the `Fire` button in `Controls`

Required cases:

1. **Full game:** solve lesson 1, then Next to lesson 2.
   - `localStorage['ricochet-solved']` contains `first-bounce`.
   - Open `/play` in the same context: lesson 1 shows solved. Also check the reverse direction.
   - The homepage URL never changes: assert `page.url()` before and after.
2. **Modes:** Random hard and Today work in the Arcade. The city never shows Copy link.
3. **Room state:** Switching Arcade → Studio → Arcade within one open keeps mirrors and shot. Back to city restores the exact non-default city pose (keep the existing pose test).
4. **3D taps:** on desktop, the 3D table is ready (`#arcade-stage canvas[data-ready=true]`), overlay mirrors are ≥44px, and click and Enter rotate. Keep the projection-based tap test, now targeting the overlay button position.
5. **Fit switch:** at 375×812 and in short landscape (e.g. 900×420) the flat board shows with no 3D toggle, targets are ≥44px, and focus survives the switch.
6. **Failure:** abort `/assets/surface-*.js`. The flat board stays playable, the note shows, "Retry 3D" works after unrouting.
7. **No WebGL from the start:** the flat board is playable.
8. **GPU stability:** enter and leave the Arcade 5×. WebGL allocation counts for the Arcade canvas return to baseline (reuse the existing counting helper in the old GPU test). The city draws nothing while the Arcade is open, and the Arcade draws nothing while idle.
9. **Closing:** closing before the surface module arrives never shows or activates a hidden table (delay the route, close, release it, then assert `data-table-status` and no `canvas[data-ready]`).
10. **Keyboard:** Escape closes the dialog in one press. Tab wraps through visible buttons and links only.

Also run `accessibility.spec.mjs` with the Arcade open (axe), in both themes.

### Docs

- **`docs/DESIGN.md`:**
  - Rewrite the Arcade paragraphs (lines ~173, 177, 185, 193). It is the full game with shared progress and preferences, no URL changes, room state reset on each dialog open, the 3D/Flat toggle, and "Open full page" for share links.
  - Update the architecture lines ~223–224: `BoardView`, `game.ts`, `GameParts`, `three/surface.ts`, `city-arcade.ts`, and the host pause.
- **`docs/RICOCHET.md`:** add a short "Presentations" section covering:
  - the 3D table and its overlay buttons;
  - the fit rule (`mayFitTable` cheap pre-check, then measured spans ≥44px and table height ≥260px);
  - the `presentation` preference;
  - fallbacks.
- **`docs/CITY-ISLAND-EXPANSION-PLAN.md`:** set the status line to "stages 1–3 implemented, awaiting owner review".
- **This file:** delete it.

### Rendered review (before the commit)

- **Sizes and themes:** screenshot `/play` and the city Arcade in light and dark at 320, 375, 768, 1024 and 1440 widths plus 900×420 landscape.
- **Content:** cover lessons 1, 5 and the last one (6×8), Random easy/medium/hard and Today.
- **What to check:**
  - no clipped sign or board;
  - overlays aligned to the mirrors;
  - no overlap with bars or the panel;
  - contrast holds.
- **Where:** save screenshots in the scratchpad or `test-results/`, not the repo.
- **Unverified:** list Safari, Firefox, real phones and screen readers as unverified.

### Commits

1. `feat: play the full Ricochet game in the city Arcade`: code plus tests.
2. `docs: describe the shared 3D Ricochet presentations`. Or fold this into commit 1 if it's small.

Then stop. **Owner review checkpoint:** do not start Journey, Studio or Say hello, and do not push.
