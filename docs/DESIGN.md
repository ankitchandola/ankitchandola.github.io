# Portfolio design language

This is the design contract for Ankit Chandola's portfolio, including the interactive homepage, lite page and project detail pages. It records approved decisions and gives rules for future additions. A new explicit owner request may change a rule; update this guide alongside that change.

## Character

Professional, welcoming and practical. The portfolio should feel like a developer showing useful work: warm surfaces, confident typography, visible controls and real product evidence. Prefer quiet surfaces, aligned project rows and flat actions over decorative panels and offset button shadows. Give content enough presence and contrast. Do not drift into an overly sparse template, tiny technical labels or a generic terminal aesthetic.

Use teal, apricot and olive as a coordinated palette. Do not introduce violet or purple into portfolio UI. Original product screenshots may retain their own colours.

## Colour roles

| Role            | Light     | Dark      |
| --------------- | --------- | --------- |
| Page            | `#F5F2E9` | `#101E20` |
| Raised surface  | `#FFFDF7` | `#182A2D` |
| Main text       | `#172F31` | `#F1F2E9` |
| Secondary text  | `#4B6260` | `#B7C8C2` |
| Teal accent     | `#245E58` | `#9AD9C7` |
| Mint surface    | `#C6DFD4` | `#294A43` |
| Apricot accent  | `#F4C7A4` | `#EFB98E` |
| Divider         | `#BDC8BE` | `#4C6761` |
| Contact section | `#245E58` | `#20473F` |

Use semantic CSS variables instead of new isolated hex values where a role already exists. The homepage calls the main accent `--teal`; detail/lite styles also use `--accent`. Read the final cascade before editing: earlier styles contain superseded colours.

### Fixed exceptions — preserve precisely

- Third experience card: background `#E8E9DA`, ordinary body text `#172F31`, and sequence number/date/role/outcome/tag accents `#626B3D`. Keep the card light in both themes. Olive is an accent, not the whole card fill or all body text.
- Footer means **only the final bar**, with its spaced content groups. Its background is `#E8E9DA`, edge to edge, with `#172F31` text in both themes and both editions. Do not apply this colour to the contact section above it.
- Scope sequence numbers use three distinct accents: 01 `#245E58`, 02 `#86532B`, 03 `#626B3D` in light mode. Use existing theme adaptations for dark surfaces.
- The contact section retains teal with apricot emphasis. Section numbering changes must not accidentally recolour it.
- Every contact section shows the shared `contactPrompt` from `profile.ts` below its heading: what to write about and what helps a reply. It must not claim availability. The homepage adds an outlined Copy email button beside the address, hidden until script confirms clipboard support, with the outcome announced in a visible status line; lite stays script-free and keeps the plain mailto link.

## Typography

| Purpose                             | Typeface           | Local assets                    |
| ----------------------------------- | ------------------ | ------------------------------- |
| Display headings and large numbers  | URW Gothic         | `display.woff`                  |
| Paragraphs and descriptions         | Nimbus Sans        | `body.woff`, `body-bold.woff`   |
| Section labels and compact headings | Nimbus Sans Narrow | `label.woff`, `label-bold.woff` |
| Actual code/data, when useful       | Nimbus Mono PS     | `mono.woff`                     |

Keep the font licence in `public/assets/fonts/LICENSE.txt`. Use the final `--display`, `--body` and `--label` variables rather than assuming the initial font aliases are identical on every page.

Section labels such as `01 / SELECTED WORK` should be distinctive condensed sans, not monospace. Paragraphs should read naturally beside headings. Do not use monospace as the default card description or tag font.

For new content, target 18px body text with approximately 1.5–1.65 line height, 17–19px card descriptions and 14–16px tags. Small screens may reduce body text to 17px. These are design targets, not a claim that every legacy selector has been normalised. Do not shrink text to solve a layout problem. No readable text goes below 13px at any width; the final readable-minimum block in `theme.css` enforces this for legacy labels. Section intros put the label on its own row, the headline on the left and the description in the right column on wide screens, stacking below 1000px. Keep long reading passages around 60–75 characters per line.

## Layout and hierarchy

Use the existing centred container, approximately 1320px maximum width, with responsive side gutters. Use an 8px spacing rhythm with the existing 12, 16, 24, 32, 48 and 64px intervals where appropriate. Avoid adding a new spacing system for one component.

Give each section a clear label, headline and supporting description. Emphasised headline words use the same accent treatment as neighbouring sections. Borders and colour blocks should establish structure without making every item a floating card.

The header separator and final footer background extend to the viewport edges; their contents remain aligned with the page container. Use the `ac` monogram without a decorative star. The homepage, detail and lite headers share one wordmark (monogram, name, FULL-STACK DEVELOPER) and the same nav labels: About me, Work, Experience, Say hello, which jumps to that page's contact section. Keep the Lite version link quiet; the hero labels it “Quick overview”. About me links to the main page's How I Work section (`#about`). Place a map-pin icon inline with the Delhi location.

### Main and lite editions

Projects are not numbered, so section numbers stay the only sequence on the homepage. Main sections: 01 Selected Work, 02 How I Work, 03 Engineering Decisions, 04 Today & Yesterday, 05 Contact. The current-work summary appears before these, and the unnumbered Ricochet invitation sits immediately after all Selected Work projects, before How I Work.

Lite has its own consecutive numbering: 01 Today, 02 Selected Work, 03 Experience. It may omit How I Work and the interactive demo. Do not leave only a stray 03 label.

Lite's current-work summary places introductory copy beside three scope columns on wide screens and stacks the layout when space is insufficient. Numbers identify scope, not unverified performance metrics:

1. CRM & operations — Frontend + backend
2. Shared React package — Two applications
3. Website & CMS — Staging infrastructure

Both editions retain current employment: Green Fortune Technologies, followed by Hippo Homes and Nethues. Anonymous internal project titles do not require hiding the employer in employment history.

Lite remains script-free after prerendering. Project descriptions may expand on hover, must also appear on keyboard focus, and must remain available on touch devices without hover. Do not add a nonfunctional theme toggle to the script-free page.

### Phone layouts

At 700px and below, use the full reading column for content. Scope summaries become three numbered rows, with the name and detail beside each number. Lite experience numbers sit beside the date; employer descriptions span the full width below. Lite project descriptions stay visible at phone widths regardless of pointer type.

Use 17–18px reading text and labels of at least 13px. Project introductions use 18px body copy and responsive 36–48px titles. Gallery controls form two columns with 48px touch targets, and screenshots remain uncropped. The demo uses fewer nested gutters, larger controls and a stacked result. Use a compact wordmark without the subtitle on phones, followed by the theme control and a native disclosure menu. The menu exposes all four navigation links with comfortable touch targets and also works on script-free lite. On scripted pages it closes after selection, outside click or Escape. These changes are scoped to phone widths so desktop composition is preserved.

Phone footers use an aligned two-column link grid below the copyright; the homepage role label occupies its own row. Remove the decorative “Next conversation” label from the shared contact section; location and email already provide the useful context.

## Components

### Work and project details

Keep one Selected Work collection instead of duplicating it as a second Closer Look section. Each project links to its own expandable detail page in the same tab. Use Project details wording until supplied material supports a fuller case study. Add future projects to the existing model rather than inventing another navigation category.

The homepage uses an image-led project collection. Recon Desk leads as a compact, full-width featured preview, followed by four professional projects in a balanced two-column gallery. Each project has original vector cover artwork, kind, title, short summary, a contribution line, all technology tags, a Project details link and, where the detail page has one, a link to its demonstration (Recon’s comparison demo at `#comparison-demo`, others at `#workflow`, named by the demonstration title). The contribution line comes from `contribution` in `projects.json`, derived from the ownership statement and context; keep qualifiers such as “most” and distinguish shared from sole work. Covers depict each project's actual work: keyed export comparison, offline survey saves, browser calling and quotations, shared unit grids, and CMS publishing with enquiry routing. Use the coordinated teal, mint, apricot and olive palette with distinct compositions and colour fields, not five white application windows. These are illustrations, not product screenshots or evidence of shipped UI. Cover paths and accessible descriptions live in `projects.json` under `cover`; artwork lives in `public/assets/projects/covers/`. Preserve real sanitised screenshots in project-detail galleries and as project share images. Below 700px the gallery becomes one column. Do not alternate sides or use sticky text columns. Short index summaries live in `projects.json` as `indexSummary`; full summaries, ownership statements and complete screenshot galleries remain on the existing project detail pages. Order projects by résumé weight after the flagship: operations, CRM, visualization package, website and CMS.

The full comparison demo has moved from the homepage to `/work/recon-desk#comparison-demo`, replacing that page's smaller reconciliation demonstration. Preserve its scenarios, tolerance control, before/after tables, validation, result explanation, reset, benefits and expandable build notes. The homepage links directly to it. Reconciliation behavior is still explained by the project's source-backed narrative and screenshots; do not imply that the comparison demo demonstrates bank reconciliation.

Detail pages use a two-column introduction on desktop, a numbered in-page index, and an editorial section rail. Contributions form a two-column grid; engineering challenges emphasise the decision in a tinted panel between the problem and trade-off. Results have a distinct soft surface, with measurement caveats alongside every fact. All layouts stack on phones. Each project needs a distinct explanation of its actual behavior, not a generic forward-arrow sequence. Recon Desk demonstrates key-based comparison, duplicate review and tolerance boundaries; operations uses device/server state and rejection recovery; CRM separates browser and provider events; the shared package shows host-driven selection and late eligibility updates; website/CMS separates draft publishing from CRM outcome routing. Demonstrations are browser-local, explicitly labelled simplifications with synthetic data, reset controls, keyboard access and announced results. The surrounding source-backed narrative and screenshot evidence remain available without interaction. Project-specific copy and section headings live in projects.json.

Detail pages follow one order: heading (with an optional one-line context of role, team and duration, shown only when supplied) and tags, screenshot gallery, The problem with its diagram, My contribution, Engineering challenges, Result and Scope limits, then previous and next project links that wrap around the project list. Each challenge states its problem, decision and trade-off, and the strongest story goes first so whichever page a visitor opens leads with its best material. A diagram or demonstration depicts the specific branching, recovery, state or ownership boundary that project needs. Its layout should follow the system rather than a shared sequence template. Result states what changed in plain terms, qualitative when nothing was measured, and says so when no measurement exists; its fact list holds only counted or measured figures, each with its caveat (environment, input size, what was timed) beside it. Scope limits say what the project is not. Take each field from the supplied project notes; omit a block rather than fill it with assumptions. Every page gets its own title (`Name — Ankit Chandola`), description and Open Graph tags from its project data, with the first screenshot as the share image. Display-font numbers avoid symbols the face lacks, such as ≈ and →.

Prefer actual sanitised screenshots with clear captions. If an illustration is necessary, depict the project's real purpose and flow; avoid decorative generic dashboards. Never invent metrics or plausible business records and present them as evidence.

Gallery controls must clearly invite interaction, show the selected view, expose accessible names and preserve keyboard operation. Keep useful screenshot context visible. Always show the entire screenshot at its natural aspect ratio. Homepage cover illustrations fill equal 16:10 presentation areas without an extra padded frame; detail galleries use responsive width and automatic height. Do not crop, zoom, transform or apply focus metadata to screenshots. Full-size screenshots may open separately with an explicit link and safe external-link attributes. Do not recolour screenshots to match the portfolio.

The current-work summary has no bottom separator. Below the role line, a small “Start here” list links Recon Desk and the operations project as the two recommended first reads. Technology tags use a very light neutral tint with a quiet border and readable text. The three comparison benefits now live below the demo on Recon's detail page, retaining their heading/body hierarchy and icons without a coloured panel or icon discs. Small icons align with the headings.

Screenshot galleries use an open composition: underlined view selectors, a bordered image frame and a caption below without an enclosing card. The original card styling remains available for comparison with `?gallery=original` on the homepage or a project detail URL; omitting the query uses the new frame. Both retain the same complete screenshots and keyboard controls; neither version crops or zooms the images.

Project challenges have sequential two-digit numbers and 24px between each title and its description list. Previous/next navigation uses open text links beneath a single top rule, without card borders.

### Experience

Use large sequence numbers, not unexplained icons. The first two cards use lighter mint (`#E4EEE7`) and apricot (`#F5E6D8`) surfaces in light mode; keep their existing dark-theme surfaces. Give each number its own accent family. Maintain readable tags and a clear separation between employer, role, dates, responsibilities and supported outcomes.

When cards stack, the previous card's separator must not show through. Use opaque surfaces and check actual scrolling behaviour. On narrow screens use normal document flow rather than a cramped sticky stack.

### Engineering Decisions

On devices with a fine pointer, hovering for a moment (150ms) temporarily opens a decision, and only one hover preview is open at a time; leaving closes it unless focus remains within it. Clicking pins a hover-open decision; subsequent clicks close it. Native click/keyboard/touch access remains available. Do not show a divider between its summary and expanded content.

Expanded content currently has two blocks: Implementation and Boundary. Use two equal columns on wide screens and one column on mobile. Align the content with the title text, leaving space for the summary number. Put the project link on its own full-width row.

### How I Work

The Frontend and Backend capability blocks use readable 16px detail text and end with a “Seen in” line linking the projects that show that work. The section introduction points to the engineering decisions instead of repeating their questions.

Existing desktop alignment uses an 86px left inset (60px number plus 26px gap), 48px column gap and 24px row gap. Mobile removes the inset. Do not preserve an empty third column from an older accordion design. Check open and closed states with long content.

### Ricochet puzzle

`/play` is a side project and is labelled as one. It makes no claims about professional work and never appears in Selected Work, Engineering Decisions or Evidence. Visitors find it through an unnumbered homepage invitation immediately after Selected Work: a plain link with no client script, styled as an outlined secondary action, using neither the contact teal block nor the footer colour. Lite and the footer do not link to it.

The rules are deliberately small. Double-sided mirrors toggle between `/` and `\`, walls block, leaving the grid escapes, the target ends the shot, and the beam passes through its own source. That last rule is what makes loops possible: every rule is reversible, so a loop always returns to the first state. One-way pieces, splitters or multiple targets need their own design rather than a quiet extension.

Levels live in `src/content/levels.json` as row strings. Keep them at most 6 columns wide so mirror cells stay at least 44px on a 320px screen, and at most 8 mirrors so the solver can enumerate every layout. Each level starts unsolved, and its minimum rotation count is pinned in `tests/play.test.mjs`. Change that number deliberately, and play a changed level by hand; solvable is not the same as enjoyable.

The board is SVG with a real button over each mirror, named by row, column and slant, and one over the source arrow that fires like the Fire button. Hovering these buttons shows an inset outline, never a fill, because the buttons sit above the drawing and a fill would hide it. The beam starts at the arrow's tip and stops at the target's outer ring. Each shot's outcome is announced in a status region with an icon and text. Reset is enabled whenever a beam is shown or a mirror has moved. There are no single-key shortcuts. Progress is stored under `ricochet-solved`, loaded after hydration and saved only when a shot newly hits. Board colours are the `--rc-*` tokens in `src/play/play.css` and are checked at 3:1 in `tests/check-site.py`; loop dashes use the board surface colour over the beam. The beam draws in at most 600ms and mirrors turn in 120ms, both instant under reduced motion.

A Learn / Random / Today switch sits above the board. It uses the same pressed-button style as the lesson picker.

- **Learn** is the five handcrafted levels, presented as lessons (`LESSON 3 OF 5`). Each teaches one idea in order: turning a mirror, chaining reflections, loops, walls, decoys. Random puzzles cannot guarantee that order; Easy puzzles never loop, and few Medium ones can. Finishing all five offers Random and Today's puzzle as the main actions, with Back to the work as a quieter link. First-time visitors start on lesson 1. Solved lessons show a check badge on the button's corner and a teal border, and the label counts progress (`LESSONS · 2 OF 5 SOLVED`). Each button's accessible name also says "solved", so completion never depends on colour alone.

- **Random** offers Easy, Medium and Hard, plus New puzzle.
- **Today** is one Medium puzzle for everyone, dated in UTC.
- **Headings** of generated puzzles state what they are, such as `RANDOM · HARD · SEED 5YFHNR` or `PUZZLE OF THE DAY · 22 OCT 2026`. They are titled "Generated puzzle" or "Shared puzzle". Their hint states the actual minimum number of turns, and they are never presented as handcrafted.
- **Copy link** appears outside the campaign. "Link copied" is announced in the status region; if the clipboard is unavailable, a pre-selected read-only field shows the link.
- **Saved preferences:** `ricochet-prefs` reopens the last mode and difficulty and records the daily solve. Generated solves never touch campaign progress.
- **Prerendering:** the page always prerenders level 1. The URL and saved preferences are applied after hydration.

### Actions and icons

Reuse existing teal primary actions, outlined secondary actions and small corner radii. Header and standard button actions use flat fills, restrained hover movement and quick press feedback, without hard offset shadows. Keep the contact CTA in the same visual family. Use Lucide consistently; prefer icons around 24px and comfortable controls of at least 44px. Icon-only buttons need accessible labels. Draw icons from the Lucide set in `src/home/icons.tsx`; do not use unicode glyphs (▤ ✓ ✳ ↺ ⇅) as icons. Footer social links include recognisable GitHub and LinkedIn icons alongside names.

### Header search

Use a compact search icon beside the existing header controls, not a permanent search bar. Search is local and filters project names, summaries, ownership and technology tags from the shared project data. All query words must match, ignoring case and extra whitespace. Show an explicit empty state, an announced result count and links to project details. Opening focuses the input; Escape closes the disclosure and restores focus. Outside interaction closes it. Without JavaScript, including lite, the same native disclosure is a project directory: show working links and omit the inactive search field. Never add scripts to lite for search. Below the projects, a “Jump to” list links Selected work, How I work, Engineering decisions, Experience and Say hello, filtered by the same query; the project count ignores it. With script, Ctrl K or ⌘ K opens the visible search from anywhere, arrow keys move through visible results and a hint states both. The shortcut acts only on the rendered instance, since desktop and phone headers each mount one.

## Motion and interaction

The hero eyebrow names the current role and employer, followed by the headline “Operations software, front to back.” The visible “Explore the city” button has a one-line caption naming what the city opens; it is hidden with the button when scripts are unavailable. The hero shows a static `<ankit chandola>` code-style name with a blinking caret; it no longer cycles through phrases, so the headline stays the single dominant statement. Keep a stable accessible identity alongside the decorative name. The skills banner runs continuously with relevant technologies.

Respect reduced-motion preferences. Place the pause control at the trailing edge of the skills banner, outside the hero copy. Centre the banner type optically within the band. Sections that start below the fold enter once with a short 70ms stagger, and only when motion is allowed and not paused. Content is visible without JavaScript. Pressable controls give press feedback; hover transforms apply only on devices that can hover. Gallery views crossfade in 180ms. Essential content must not depend on animation. Use short, restrained transitions for actions and expansion.

The hero is a coherent miniature neighbourhood and an optional map of the portfolio. Preserve its nine-site footprint, central plaza, apartments, balconies, taller office landmark, café and pavilion. Connect entrances with pavements and streets; use trees, benches, planters, awnings and roof terraces as close-up details. Keep cream, teal and restrained apricot, recessed glazing, bevelled edges, consistent proportions and soft shadows. The ordinary homepage and “Explore my work” remain the direct reading and navigation path.

Four named destinations adapt existing buildings: rear-left Studio introduces all five projects in shared portfolio order; rear-centre Journey presents employment chronologically; front-right Arcade opens a playable Ricochet table; the café is Say hello, with shared location, email, social and résumé links. Journey is a fictional reading place, not an employer's office. Two construction plots say “Future space” and remain noninteractive: no hover, pointer, button, project promise or progress panel. The remaining three buildings stay scenery. Do not assign a future plot until real content is supplied. The Arcade miniature is an explicit exception to the previous ban on embedded games; do not add other demonstrations or invented claims to the reading panels.

The [separate-scenes plan](CITY-DESTINATION-SCENES-PLAN.md) is being delivered incrementally. Arcade is the first complete scene; Studio, Journey and Say hello deliberately retain their existing reading panels until its review checkpoint. Do not treat those panels as finished versions of the planned workbench, railway or terrace.

Arcade replaces the selected-building view with a distinct, fixed-camera puzzle table and supplementary sign. It reuses the first handcrafted Ricochet lesson, reflection model, controlled board component and beam-path helpers, without importing the full game page or persistence. Turn mirror, Fire, Reset puzzle and Play full Ricochet remain explicit actions. Announce actual shot outcomes immediately; retain the final beam until the next action. Mirror motion lasts 120ms, beam motion at most 600ms, and success briefly lights the sign. Keyboard actions, reduced motion and pause settle immediately. Do not enable city orbit, zoom or Home reset in this room.

When projected mirror targets would be smaller than 44 CSS pixels, or stage height is insufficient, show the same-state SVG/HTML board instead. Measure both projection and available space after resizing; keep flat cells at least 44px, preserve focus across representation changes and expose only one keyboard mirror sequence. Flat mode does not draw a hidden 3D scene. Puzzle state survives destination switching within one open explorer and is discarded on Close; never write campaign progress, daily completion or preferences.

The compact preview shows the composition without destination overlays. A visible “Explore the city” expand action covers it and opens an accessible immersive dialog: desktop large, phone full-screen. Four persistent destination buttons use pressed states and a two-by-two phone layout. Hover or keyboard focus previews a footprint and short projected label; selection is distinct and opens one HTML panel. Labels are supplementary, nonfocusable, hidden when occluded or outside the view, and limited to one at a time to avoid overlaps. Raycast simplified pick bounds independently of the batched render meshes; foreground scenery blocks selection. Dragging more than 6 CSS pixels or using multiple pointers disqualifies a tap.

Drag rotates, pinch or scroll zooms; buttons provide rotation, zoom and Reset view. A focused canvas supports arrow keys, plus/minus and Home. Limit elevation to 30–64 degrees from the vertical and zoom to 100–220%; disable user panning so the city cannot be lost. Selection uses a curated orientation, target and zoom, with a 400ms cubic ease-out transition. Keyboard activation, reduced motion and global pause apply the final pose immediately. User manipulation cancels the camera transition at its current pose. Closing, hiding the page or changing motion preferences settles pending motion without an idle rendering loop.

Wide dialogs reserve a 340px side panel, not an overlay over the building. Tablet and portrait phone layouts stack the panel below a useful scene area, with more room allocated to reading. Short landscape layouts use a side panel and compact view controls. Panel content scrolls independently; Back to city remains visible. Keep 17px body copy, at least 13px labels and 44px targets. Studio retains complete summaries and does not shrink five entries to fit.

Activation focuses the selected destination heading. Capture city position, target and zoom once when leaving the overview; direct destination switching must not overwrite that snapshot. Back to city restores the exact pose using the current viewport projection and focuses its destination button. City Reset view and Home deliberately reset to the default overview; these controls are unavailable in Arcade. Escape always closes the whole dialog in one action. Keep visible Close, an initial city interaction hint, explicit Tab wrapping through visible buttons, links and canvas, focus restoration and background scroll locking. A homepage-section link finishes cleanup before scrolling to and focusing the requested heading. Project and puzzle links navigate normally in the same tab. No city state is persisted beyond the open dialog.

Move the same canvas into the dialog rather than running two renderers. The hero shows its static poster while exploration is open. Closing restores the overview, page scroll position and trigger focus; reopening starts at the overview. Pointer opening uses a 240ms opacity/0.97-scale transition; closing uses 200ms, both with `cubic-bezier(0.23, 1, 0.32, 1)`. Keyboard actions, reduced motion and the global pause preference bypass those transitions. Camera manipulation remains directly responsive without auto-rotation or momentum.

Keep identity, introduction and navigation outside the canvas. Lazy-load Three.js near the viewport and cap pixel density at 1.5. Batch static geometry by material, share a sign-text atlas, cache static city shadows and render only on demand; no idle loop or offscreen rendering. The common scene host owns the renderer and scheduler. Retain the city, but dispose replaced room geometry, materials, textures and shadow targets; keep activity state separately. Refresh shadows when room objects change, including their final frame.

Keep matching city artwork without JavaScript or WebGL2. The Arcade module loads on selection, with explicit loading, error and retry states. Generation checks prevent stale loads from activating after switching, Back or Close. Its flat puzzle remains playable after an import failure or unavailable WebGL; context recovery recreates the room from the current activity state. Other destination panels and links remain usable throughout. Without JavaScript, keep ordinary homepage links and static hero. Lite remains script-free. Do not intercept page scrolling in the compact preview.

Interactive demonstrations must be visibly inviting before the first click: explain what to try, show controls, indicate the result and make reset clear. Label simplified sample data. The portfolio's CSV demo has deliberately limited scope; it is not the full Recon Desk engine.

## Content integrity

Write visitor-facing copy in plain, specific language. Say what I built and how it works; avoid generic portfolio slogans, repeated three-part punchlines and vague claims about quality. Keep technical terms when they explain a real decision. Use direct control labels and error messages, and retain ownership boundaries, measured-result caveats and simulation labels. A copy edit must not add facts or turn a limitation into a claim.

Use supplied project notes, screenshots and direct ownership clarifications. Do not assume business impact, authorship, scale, production infrastructure, uptime or technical decisions. If a detail is missing, omit it or request it when needed. A longer narrative does not justify invented case-study content.

Keep OpsGate frontend/backend under one operations project. Keep shared package ownership distinct from its two consuming applications. Distinguish custom CRM work from inherited Frappe functionality and CMS configuration from writing Strapi itself. Infrastructure evidence describes shared staging; do not convert it into a production availability claim.

Keep internal project names and private infrastructure identifiers anonymous. Use only approved sanitised screenshots. Do not commit credentials, private source notes or raw business data. Poke Hack Hub remains pending until its details are supplied.

## Implementation map

- `index.html`: homepage document head and a placeholder for the rendered sections.
- `src/home/`: homepage section components. They are rendered to static markup and never hydrated.
- `src/content/projects.json`: homepage project sections, engineering decisions, project details and lite summaries.
- `src/content/profile.ts`: shared location, contact links, résumé path and current-scope list.
- `src/content/city.ts`: typed destination registry, reserved-space statuses and explicit chronological experience mapping. Content remains in the shared project, experience and profile sources.
- `src/content/ricochet.ts`: shared puzzle invitation, description and route.
- `src/App.tsx`: lite, project detail, `/play` and 404 layouts.
- `src/play/`: the Ricochet model, solver, level generator, storage, page component and its stylesheet. `src/content/levels.json` holds the campaign levels. [docs/RICOCHET.md](RICOCHET.md) explains the logic.
- `src/home/PlayInvite.tsx`: the homepage invitation to `/play`, styled in `public/assets/v2.css`.
- `src/home/client.js`, `src/home/interactions.js`: lazy hero loading, disclosures and motion preferences, attached to static markup by element ids and data attributes.
- `src/home/CityDestinations.tsx`: static destination buttons and readable panels, rendered alongside the dialog in `Hero.tsx`.
- `src/home/city-model.ts`: batched neighbourhood geometry, signs, construction plots, stable landmark anchors and occlusion/pick bounds.
- `src/home/city-preview.ts`: shared Three.js view, curated poses, bounded OrbitControls, occlusion-aware picking, footprints, projected labels and on-demand rendering.
- `src/home/city-explorer.ts`: destination state, native dialog, shared-canvas handoff, gesture qualification, keyboard controls and focus/scroll lifecycle.
- `src/home/city-scenes/host.ts`: single renderer, demand-driven scheduling and active-view lifecycle. `arcade.ts` owns disposable table geometry; `arcade-state.ts` and `arcade-activity.ts` keep puzzle state and HTML controls independent of rendering.
- `src/play/Board.tsx`, `src/play/board-path.ts`: controlled board markup and path helpers shared by the full game and city Arcade.
- `src/home/ReconDemo.tsx`, `comparison.ts`, `recon-demo.css`: the full comparison demo on Recon's detail page, using the existing comparison model.
- `src/components/SiteSearch.tsx`, `site-search.ts`: native project directory with progressively enhanced local search.
- `public/assets/style.css`, `v2.css`: main styles; some legacy rules remain.
- `src/style.css`, `src/case-theme.css`: detail and lite styles.
- `public/assets/theme.css`: final shared theme overrides and recent component corrections.
- `scripts/prerender.mjs`: homepage rendering, route generation and script-free lite output.

Update all affected representations together. Prefer editing the relevant existing rule over appending another conflicting override. Do not change the retained original interactive Site when updating this edition. Internal filenames may contain v2; visible branding should not.

## Review before shipping UI changes

Run `npm run build` and `python tests/check-site.py`. Run `npm test` when changing comparison or puzzle behaviour. Static checks cover selected contrast pairs and output structure; they do not replace rendered visual review.

When browser review is available, inspect light/dark themes at 375, 768, 1024 and 1440px, plus a narrow 320px check. Review expanded accordions, experience stacking, gallery controls, keyboard focus, touch access, footer width and lite layout. Aim for at least 4.5:1 normal-text contrast and 3:1 large-text/control contrast. Never communicate meaning by colour alone.

Record which checks actually ran and any limitations. Documentation-only edits need link/content checks, not a website deployment. When an approved visual decision changes, update this guide in the same change.
