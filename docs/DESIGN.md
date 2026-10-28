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

The header separator and final footer background extend to the viewport edges; their contents remain aligned with the page container. Use the `ac` monogram without a decorative star. The homepage, detail and lite headers share one wordmark (monogram, name, FULL-STACK DEVELOPER) and the same nav labels: About me, Work, Experience, Say hello, which jumps to that page's contact section. Keep the Lite version link quiet. About me links to the main page's How I Work section (`#about`). Place a map-pin icon inline with the Delhi location.

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

The homepage uses an image-led project collection. Recon Desk leads as a compact, full-width featured preview, followed by four professional projects in a balanced two-column gallery. Each project has a complete screenshot, kind, title, short summary, all technology tags and a detail link. Below 700px the gallery becomes one column. Do not alternate sides or use sticky text columns. Short index summaries live in `projects.json` as `indexSummary`; full summaries, ownership statements and complete screenshot galleries remain on the existing project detail pages. Order projects by résumé weight after the flagship: operations, CRM, visualization package, website and CMS.

The full comparison demo has moved from the homepage to `/work/recon-desk#comparison-demo`, replacing that page's smaller reconciliation demonstration. Preserve its scenarios, tolerance control, before/after tables, validation, result explanation, reset, benefits and expandable build notes. The homepage links directly to it. Reconciliation behavior is still explained by the project's source-backed narrative and screenshots; do not imply that the comparison demo demonstrates bank reconciliation.

Detail pages use a two-column introduction on desktop, a numbered in-page index, and an editorial section rail. Contributions form a two-column grid; engineering challenges emphasise the decision in a tinted panel between the problem and trade-off. Results have a distinct soft surface, with measurement caveats alongside every fact. All layouts stack on phones. Each project needs a distinct explanation of its actual behavior, not a generic forward-arrow sequence. Recon Desk demonstrates key-based comparison, duplicate review and tolerance boundaries; operations uses device/server state and rejection recovery; CRM separates browser and provider events; the shared package shows host-driven selection and late eligibility updates; website/CMS separates draft publishing from CRM outcome routing. Demonstrations are browser-local, explicitly labelled simplifications with synthetic data, reset controls, keyboard access and announced results. The surrounding source-backed narrative and screenshot evidence remain available without interaction. Project-specific copy and section headings live in projects.json.

Detail pages follow one order: heading (with an optional one-line context of role, team and duration, shown only when supplied) and tags, screenshot gallery, The problem with its diagram, My contribution, Engineering challenges, Result and Scope limits, then previous and next project links that wrap around the project list. Each challenge states its problem, decision and trade-off, and the strongest story goes first so whichever page a visitor opens leads with its best material. A diagram or demonstration depicts the specific branching, recovery, state or ownership boundary that project needs. Its layout should follow the system rather than a shared sequence template. Result states what changed in plain terms, qualitative when nothing was measured, and says so when no measurement exists; its fact list holds only counted or measured figures, each with its caveat (environment, input size, what was timed) beside it. Scope limits say what the project is not. Take each field from the supplied project notes; omit a block rather than fill it with assumptions. Every page gets its own title (`Name — Ankit Chandola`), description and Open Graph tags from its project data, with the first screenshot as the share image. Display-font numbers avoid symbols the face lacks, such as ≈ and →.

Prefer actual sanitised screenshots with clear captions. If an illustration is necessary, depict the project's real purpose and flow; avoid decorative generic dashboards. Never invent metrics or plausible business records and present them as evidence.

Gallery controls must clearly invite interaction, show the selected view, expose accessible names and preserve keyboard operation. Keep useful screenshot context visible. Always show the entire screenshot at its natural aspect ratio. Homepage previews use equal 16:10 presentation areas with `object-fit: contain`; detail galleries use responsive width and automatic height. Do not crop, zoom, transform or apply focus metadata to project previews. Full-size images may open separately with an explicit link and safe external-link attributes. Do not recolour screenshots to match the portfolio.

The current-work summary has no bottom separator. Technology tags use a very light neutral tint with a quiet border and readable text. The three comparison benefits now live below the demo on Recon's detail page, retaining their heading/body hierarchy and icons without a coloured panel or icon discs. Small icons align with the headings.

Screenshot galleries use an open composition: underlined view selectors, a bordered image frame and a caption below without an enclosing card. The original card styling remains available for comparison with `?gallery=original` on the homepage or a project detail URL; omitting the query uses the new frame. Both retain the same complete screenshots and keyboard controls; neither version crops or zooms the images.

Project challenges have sequential two-digit numbers and 24px between each title and its description list. Previous/next navigation uses open text links beneath a single top rule, without card borders.

### Experience

Use large sequence numbers, not unexplained icons. The first two cards use lighter mint (`#E4EEE7`) and apricot (`#F5E6D8`) surfaces in light mode; keep their existing dark-theme surfaces. Give each number its own accent family. Maintain readable tags and a clear separation between employer, role, dates, responsibilities and supported outcomes.

When cards stack, the previous card's separator must not show through. Use opaque surfaces and check actual scrolling behaviour. On narrow screens use normal document flow rather than a cramped sticky stack.

### Engineering Decisions

On devices with a fine pointer, hovering for a moment (150ms) temporarily opens a decision, and only one hover preview is open at a time; leaving closes it unless focus remains within it. Clicking pins a hover-open decision; subsequent clicks close it. Native click/keyboard/touch access remains available. Do not show a divider between its summary and expanded content.

Expanded content currently has two blocks: Implementation and Boundary. Use two equal columns on wide screens and one column on mobile. Align the content with the title text, leaving space for the summary number. Put the project link on its own full-width row.

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

Use a compact search icon beside the existing header controls, not a permanent search bar. Search is local and filters project names, summaries, ownership and technology tags from the shared project data. All query words must match, ignoring case and extra whitespace. Show an explicit empty state, an announced result count and links to project details. Opening focuses the input; Escape closes the disclosure and restores focus. Outside interaction closes it. Without JavaScript, including lite, the same native disclosure is a project directory: show working links and omit the inactive search field. Never add scripts to lite for search.

## Motion and interaction

The main hero cycles through `<ankit chandola>`, `</>`, `<full stack developer>`, `<problem solver>` and `<tool builder>`. Keep a stable accessible identity alongside decorative animation. The skills banner runs continuously with relevant technologies.

Respect reduced-motion preferences. Place the pause control at the trailing edge of the skills banner, outside the hero copy. Centre the banner type optically within the band. Sections that start below the fold enter once with a short 70ms stagger, and only when motion is allowed and not paused. Content is visible without JavaScript. Pressable controls give press feedback; hover transforms apply only on devices that can hover. Gallery views crossfade in 180ms. Essential content must not depend on animation. Use short, restrained transitions for actions and expansion.

The hero uses an explorable miniature architectural world, not an abstract pattern. Five buildings represent the five projects. Selecting a building or its keyboard-accessible project control replaces the city with that project's distinct miniature: paired records for Recon, an offline device and workflow stations for operations, browser/provider/call endpoints for CRM, tiered unit selection for visualization, and publishing panels for website/CMS. These are visual metaphors, not real offices, deployment diagrams or additional product demonstrations. Include Back to overview and a link to the selected project's detail page. Keep the instruction short and close to the model; do not restore the separate “Work, in miniature” title band.

Keep identity, introduction and navigation outside the canvas. Lazy-load the Three.js scene near the viewport and cap pixel density. Render on demand; only scene selection transitions animate, and those settle immediately offscreen, in hidden tabs, under reduced motion or with the existing pause preference. Keep a local static illustration available without JavaScript, when WebGL2 is unavailable or while the graphics context recovers. Project selection and links must remain usable without WebGL. The scene does not block scrolling or require dragging to reach content.

Interactive demonstrations must be visibly inviting before the first click: explain what to try, show controls, indicate the result and make reset clear. Label simplified sample data. The portfolio's CSV demo has deliberately limited scope; it is not the full Recon Desk engine.

## Content integrity

Use supplied project notes, screenshots and direct ownership clarifications. Do not assume business impact, authorship, scale, production infrastructure, uptime or technical decisions. If a detail is missing, omit it or request it when needed. A longer narrative does not justify invented case-study content.

Keep OpsGate frontend/backend under one operations project. Keep shared package ownership distinct from its two consuming applications. Distinguish custom CRM work from inherited Frappe functionality and CMS configuration from writing Strapi itself. Infrastructure evidence describes shared staging; do not convert it into a production availability claim.

Keep internal project names and private infrastructure identifiers anonymous. Use only approved sanitised screenshots. Do not commit credentials, private source notes or raw business data. Poke Hack Hub remains pending until its details are supplied.

## Implementation map

- `index.html`: homepage document head and a placeholder for the rendered sections.
- `src/home/`: homepage section components. They are rendered to static markup and never hydrated.
- `src/content/projects.json`: homepage project sections, engineering decisions, project details and lite summaries.
- `src/content/profile.ts`: contact links, résumé path and the current-scope list shared by the homepage and lite.
- `src/App.tsx`: lite, project detail, `/play` and 404 layouts.
- `src/play/`: the Ricochet model, solver, level generator, storage, page component and its stylesheet. `src/content/levels.json` holds the campaign levels. [docs/RICOCHET.md](RICOCHET.md) explains the logic.
- `src/home/PlayInvite.tsx`: the homepage invitation to `/play`, styled in `public/assets/v2.css`.
- `src/home/client.js`, `src/home/interactions.js`: homepage project-world selection, disclosures and motion preferences, attached to static markup by element ids and data attributes.
- `src/home/project-world.ts`: lazy-loaded Three.js city and project-specific miniatures.
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
