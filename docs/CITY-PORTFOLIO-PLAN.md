# Portfolio city: destinations and future spaces

Implementation plan · 28 October 2026

Status: planned extension of the existing local city explorer. This document does not mark the features below as implemented.

## 1. Intended experience

Turn the existing zoomable neighbourhood into an optional way to discover Ankit's work, career, side project and contact details. Visitors should understand the destinations from their names before interacting with the architecture.

The city has four useful destinations, two visibly reserved future spaces and three ordinary scenery buildings. Preserve the current nine-site composition by adapting existing buildings rather than expanding the footprint. Future spaces imply room to grow; they do not advertise projects that have not been supplied.

The normal homepage remains the direct reading and navigation experience. The city offers a more personal route through that material, with short introductions and working links. Do not reproduce project galleries, full demonstrations or long case studies inside the city.

Success means a first-time visitor can open the city, recognise a destination, select it and reach useful portfolio content without guessing what an unlabeled building means.

## 2. Current progress to preserve

The local implementation already includes:

- Nine structures around a central plaza, including a taller office, apartments, a café and a pavilion; planting, roof terraces, benches, pavements and road details.
- A compact hero preview and matching static illustration.
- An Explore the city trigger and native dialog, large on desktop and full-screen on phones.
- Rotation, scroll/pinch zoom, rotation/zoom buttons, Reset view and canvas keyboard controls.
- Zoom limits of 100–220%, bounded viewing elevation and disabled free panning.
- Close and Escape handling, focus restoration, background scroll locking and preview restoration.
- One canvas moved between preview and dialog, lazy loading, pixel density capped at 1.5, cached shadows and rendering on demand.
- Static geometry batched by material, plus WebGL fallback and context-recovery handling.
- Browser tests covering existing modal behaviour, gestures, accessibility, fallback and rendering lifecycle.

In the preceding progress review, the production build and generated-site checks passed; desktop opening, rotation buttons, zoom, reset and Escape were manually exercised. That is not confirmation that the entire browser suite, mobile devices or every theme has been reviewed for this extension.

Keep the existing uncommitted work intact. This is an incremental extension, not a return to the original five-project city or the discarded sculptural machine.

## 3. City layout and destination identity

Use physical differences, readable labels and consistent selection feedback together. Colour alone must not distinguish active places from scenery.

| Destination            | Adapt an existing place                              | Visual identity                                                  | Portfolio purpose                              |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| Studio · Selected work | Prominent apartment on the rear-left side            | `ac` entrance sign, broad studio windows, restrained teal canopy | Introduce and link to all five projects        |
| Journey · Experience   | Taller rear-centre office and its entrance forecourt | Three small timeline markers at the entrance; clear Journey sign | Present the three supplied employment periods  |
| Arcade · Ricochet      | Smaller front-right building                         | Apricot entrance detail and a mirror/beam sign                   | Link to the existing puzzle                    |
| Say hello · Contact    | Existing café and patio                              | Welcoming awning, seats and a clear contact label                | Offer email, social profiles and résumé        |
| Future space A         | Smaller front-left building plot                     | Low unfinished structure, scaffolding and Future space sign      | Reserve capacity for a future addition         |
| Future space B         | One right-side apartment plot                        | Partially built upper floor, restrained hoarding                 | Reserve another future addition                |
| Scenery                | Remaining three structures, including pavilion       | Ordinary neighbourhood architecture                              | Keep the city believable and visually balanced |

Treat this placement as the initial composition to verify from the default angle and rotated views. Adjust positions if one destination hides another; do not enlarge the neighbourhood just to accommodate labels.

The Journey building is a fictional place to read career history. It is not a model of any employer's office. A modest introductory line in the explorer can establish that this is a miniature map of the portfolio.

Keep construction subordinate to the finished destinations. Prefer scaffolding and exposed floor plates over a large crane that competes with the main landmark. Retain some height at a converted plot where needed to preserve the skyline.

## 4. Content inside each destination

### Studio

Display a short introduction and five compact project rows. Each row contains the approved project name, its existing index summary and one link to its detail page. Preserve the portfolio order: Recon Desk, operations, CRM, visualization library, website/CMS.

Read names, summaries, order and route slugs from the shared project data. The physical studio may contain a small board or workbench, but actual reading text belongs in the HTML panel. Do not make people zoom into tiny 3D text to discover projects.

No screenshots, duplicate comparison demo, invented metrics or descriptions of confidential systems. Five short rows should be easy to scan; the panel can scroll independently when necessary.

### Journey

Show the supplied experience chronologically:

1. Nethues — 2021–2024.
2. Hippo Homes by Dalmia — 2024–2025.
3. Green Fortune Technologies — 2025–present, explicitly identified as current.

Read dates, roles and employer names from the shared experience source. Include at most one source-backed scope sentence per stop. Use an explicit chronological mapping without mutating the shared array, since the homepage lists current employment first.

Provide Read experience to close the city and move to the existing homepage experience section. Do not create a separate fictional career story or imply the city structures represent real workplaces.

### Arcade

Introduce Ricochet as the existing side-project mirror puzzle. Include one short sentence about reflecting a beam toward the target and one primary Play Ricochet link to `/play`.

Use a simple mirror-and-beam motif as a sign. The playable game remains on its existing page, with its current progress storage and controls. Do not place a second game, iframe or nested dialog inside the city.

### Say hello

Use the existing Delhi location and approved profile links. Present Email Ankit as the primary action, followed by GitHub, LinkedIn and View résumé as secondary links. Use the shared profile source for addresses and URLs.

Do not add a contact form, availability claims, response-time promises or an unsupplied personal biography. Location wording should come from a shared profile field if it needs reuse, rather than diverging between the hero and this panel.

### Future spaces

For this release, both plots say Future space. They may show physical construction details but remain noninteractive scenery: no pointer cursor, hover highlight, destination button or dead-end panel. An unobtrusive legend can explain that construction plots are reserved for future additions.

Use Work in progress only after the owner supplies an actual ongoing project. Promotion to WIP requires a real title and approved short description. A progress panel is appropriate only if there is something substantive to say; do not add percentages, dates or disabled View project buttons without supporting information.

When a future project is ready, add its content and route first, finish its building, and then activate its destination. Do not assign either plot to an unsupplied project now.

## 5. Visitor flow and controls

### Opening the city

Keep the existing hero preview and Explore the city action. At compact size, show the city as a composition rather than covering it with labels. Destination selection happens inside the expanded explorer.

On opening, show the existing overview plus a clearly visible destination strip: Studio / Work, Journey / Experience, Arcade / Puzzle, Say hello / Contact. Keep these four controls available while a panel is open. Use a two-by-two arrangement on narrow phones rather than an easily missed horizontal strip.

### Discovering and selecting places

- Hovering a destination control or its building highlights the corresponding place and shows its short name. Keyboard focus on a destination control provides equivalent feedback.
- Hover only previews; it does not open content or move the camera.
- Clicking a building or activating its control selects the same destination, opens its panel and moves to a curated camera view.
- Selection remains visibly distinct from hover. Switching destinations replaces the existing panel.
- Raycast selection must distinguish a click/tap from dragging and pinching. A gesture that rotates the camera must never open a destination on release.
- Ignore scenery and future plots when selecting. A click on empty ground leaves the current state unchanged.

The permanent destination controls are the reliable navigation surface. Projected labels are supporting cues: avoid overlaps, hide labels behind buildings or outside the view, and keep them out of a duplicate keyboard tab sequence.

### Camera behaviour

Provide a saved overview and one curated pose per destination. A pose includes camera orientation, focus point and zoom. Frame the selected place in the visible scene area after accounting for the content panel.

Animate a selection for roughly 350–450ms with gentle easing. Respect reduced motion and the global pause preference by applying the final view immediately. User dragging cancels an in-flight camera transition and returns control immediately. Closing, hiding the tab or changing motion preferences must not leave a continuing render loop.

Retain the current elevation and zoom limits as the starting constraints. Disable user panning even though code may adjust the focus point for a destination. Test every saved pose at each viewport so no building is clipped or hidden by the panel.

### Returning and leaving

- Back to city closes the destination panel, clears selection and restores the overview. Return keyboard focus to the destination control that opened it.
- Reset view and the existing Home key return to the overview and clear the active destination, avoiding a reset camera with a stale destination panel.
- Escape continues to close the entire dialog in one action. Keep this established behaviour rather than introducing a second Escape layer.
- The persistent Close action closes the explorer from any state and restores the hero trigger and prior page scroll.
- Reopening starts at the overview; no new saved city preference is needed in the first release.
- A link to an existing homepage section must finish dialog cleanup before scrolling to and focusing that section heading. Do not let restoration of the old scroll position override the requested destination.
- Project and puzzle links use normal same-tab navigation. Email, social and résumé links follow the site's existing conventions.

## 6. Desktop and phone presentation

On wide desktop layouts, reserve a side panel of approximately 320–360px inside the dialog. Let the scene use the remaining width and recalculate its camera framing. The panel contains a heading, brief content, clear links and Back to city. Avoid placing a second floating card over the selected building.

At tablet sizes, switch to a stacked layout when the scene would otherwise be cramped. On phones, place the panel at the bottom within the same fullscreen dialog. Use normal layout and internal scrolling, not another modal or a drag-to-dismiss sheet. Keep a useful area of the city visible and keep Close and destination navigation reachable.

Use the existing display/body/label fonts, theme tokens and 44px minimum targets. Labels should remain at least 13px; body text should be comfortably readable. Do not shrink the five Studio entries to fit one screen. Test portrait, landscape, long project names and browser text zoom.

## 7. Implementation architecture

### Content and markup

Add a small typed city destination registry under `src/content/`. It should hold stable destination IDs, names, status and references to existing content, not copied project descriptions or duplicated profile URLs. Keep scene coordinates and camera poses in scene configuration rather than mixing them with portfolio copy.

Render destination buttons and panel content as static HTML alongside the existing dialog in `src/home/Hero.tsx`, extracting a component if needed for readability. Use the existing client wiring pattern; do not hydrate the entire homepage or import a separate UI framework.

### Preserve geometry batching

`city-model.ts` currently merges geometry by material and returns a group. Individual source building identities do not survive that merge. Simply attaching click handlers to the current rendered meshes would select material batches across multiple buildings.

Keep static geometry batching. Extend the model's return value to expose its scene group and landmark metadata: stable IDs, label anchors and simplified pick bounds. Raycast those bounds independently of the render meshes. Check scenery occlusion so clicks cannot select an invisible landmark through a foreground building.

Use a separate lightweight footprint or outline for selection, plus an HTML label; avoid cloning an entire building for highlighting. Do not assign a separate material to every window just to enable interactions. If a material change is necessary for one landmark, preserve batching within that landmark and verify the draw-call impact.

### View and interaction responsibilities

- `city-model.ts`: architecture, construction plots, stable landmark anchors, bounds and efficient geometry.
- `city-preview.ts`: camera poses, raycasting, scene highlighting, projected label positions and demand-driven rendering. Extend its existing interface with focus/select/overview operations.
- `city-explorer.ts`: destination state, panel visibility, native links, focus handling, gesture-versus-click decisions and existing dialog lifecycle.
- `Hero.tsx` or an extracted static component: destination controls and readable panel markup.
- `public/assets/theme.css`: adapt the existing city rules for panels, labels and phone layouts after inspecting the full cascade.
- Shared content files: continue supplying projects, employment, profile links and puzzle facts.

Keep a single source of selection state so canvas clicks, keyboard controls, labels and panels cannot disagree. Represent overview and the four destinations explicitly. Keep hover separate from committed selection.

## 8. Accessibility and fallback

All destinations and actions must work through regular HTML controls without needing to operate the canvas. Use buttons with visible selected states, accessible names and the appropriate pressed/control relationships. Do not introduce tab-widget semantics unless implementing their full keyboard pattern.

When a destination is activated, move focus to the panel heading once its content is ready. Support a logical path through its links and Back to city. Update the existing focus-containment logic: it currently enumerates buttons and the canvas, so it must include the new links and correctly exclude hidden panel controls. Closing must still restore the opener.

When WebGL is unavailable, retain the static city poster, destination controls, readable panels and working links; disable only 3D camera controls. Context loss must preserve the selected content, and restoration should reapply the current destination view. Without JavaScript, preserve the static hero and ordinary homepage links; keep the script-free lite edition unchanged.

Announce destination changes and reset results briefly. Do not announce continuous zoom/rotation updates or hover changes. Verify screen-reader reading order separately from automated contrast and accessibility checks.

## 9. Performance and visual limits

Preserve one renderer, lazy loading, pixel-density limits, cached static shadows and on-demand rendering. Redraw only for interaction, camera transitions, resizing, selection changes or graphics recovery. Update projected labels with those same events, not an always-running loop.

Measure the existing and revised scene's draw calls, geometry and load cost. Avoid adding large libraries for panels, labels or animation. Reuse materials and geometries. Pointer highlighting should not repeatedly allocate resources, and rapid selections must cancel prior camera animation cleanly.

Do not add traffic, crowds, automatic orbiting, sound, a day/night simulator or interior building scenes in this release. The development effort should make the portfolio connections clear first. Refresh the matching static poster after the final city geometry is approved.

## 10. Delivery sequence and review gates

1. **Record the baseline and define content.** Preserve the local changes; run the existing city tests; define four destinations and two Future space statuses. Confirm all labels, summaries, routes and dates against shared content. Record baseline rendering cost.
2. **Refine the city composition.** Adapt four existing places, convert two plots and add restrained signs. Keep existing camera interaction working. Review the small hero and enlarged city in both themes before adding more detail.
3. **Deliver Studio end to end.** Implement the HTML controls/panel, pick bounds, highlight, camera focus, link behaviour and Back to city. Validate mouse, touch, keyboard and WebGL fallback before extending the pattern.
4. **Add Arcade, Journey and Say hello.** Reuse the interaction model while giving each panel its appropriate content. Verify route transitions, in-page navigation, contact actions and current employment.
5. **Finish responsive behaviour and motion.** Tune camera framing around panels, label overlap, phone layout, focus transitions, gesture thresholds and motion interruption. Regenerate the static fallback.
6. **Validate and document.** Run required checks, review all destinations and update the design contract and README to describe the completed experience accurately. Commit or publish only as separately requested.

Each milestone should leave the existing preview and explorer usable. The first meaningful review checkpoint is a working Studio destination, rather than four partially functioning destinations.

## 11. Verification and acceptance criteria

Run the production build and `python3 tests/check-site.py` for UI changes, plus formatting, lint and TypeScript checks for touched code. Run the targeted city interaction/accessibility browser tests during development and the full required check pipeline before shipping. Comparison and puzzle model tests need no new cases unless their behaviour changes; the existing full pipeline still runs its model tests.

Add meaningful browser coverage for:

- Selecting each destination via buttons, keyboard and building clicks produces the same content.
- Drag/pinch never accidentally activates a building; obscured landmarks do not receive clicks through scenery.
- Studio uses current project content and all destination links reach existing pages or sections.
- Journey displays all three employment periods and identifies current employment.
- Future spaces expose no misleading click actions, promises or fabricated progress.
- Selection, switching, reset, Back to city, Close and reopening maintain consistent camera/panel state.
- New panel links participate in focus containment; hidden controls do not; closing restores focus.
- In-page links close the dialog and land at the intended section without scroll restoration undoing navigation.
- Reduced motion, pause, rapid selection, resize, visibility changes and WebGL loss/recovery settle safely.
- Static/WebGL-unavailable modes still expose useful content and links; lite remains script-free.
- Rendering stops when idle/offscreen and one canvas remains shared between preview and explorer.

Manually review light and dark at 320, 375, 768, 1024 and 1440px, with overview and every selected destination. Check portrait/landscape phones, all camera limits, labels, panel overflow, touch access, keyboard focus and browser text zoom. Report physical-device, screen-reader or browser checks that were unavailable rather than treating automated tests as substitutes.

Completion means the four destinations are useful and discoverable, the future plots are honestly labelled, all existing city behaviour remains reliable, and the visuals still work as a small hero illustration. Do not call the extension complete merely because buildings respond to clicks.

## 12. Documentation and scope boundary

The current [design contract](DESIGN.md) says buildings remain scenery. The owner's new direction deliberately changes that: four named destinations become an optional portfolio route, two plots are reserved for future work and the remaining structures stay scenery. Update that contract alongside implementation, preserving unrelated typography, colour, footer, employment and lite rules.

Relevant existing references: [README](../README.md), [hero markup](../src/home/Hero.tsx), [city model](../src/home/city-model.ts), [city view](../src/home/city-preview.ts), [explorer lifecycle](../src/home/city-explorer.ts), [project content](../src/content/projects.json), [experience](../src/content/experience.ts), [profile](../src/content/profile.ts), [interaction tests](../tests/browser/interactions.spec.mjs) and [accessibility tests](../tests/browser/accessibility.spec.mjs).

This plan changes no project claims, employer identities, contact information or publication status. It extends the current repository only; the separate original interactive Site remains untouched.
