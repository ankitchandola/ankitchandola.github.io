# Ankit Chandola — Interactive Edition

This checkout is the updated interactive portfolio; the original interactive Site remains separate.

## Content

Project descriptions are based on the supplied project Markdown notes and direct ownership clarifications. Screenshots use the supplied dummy records. Internal project identities are anonymised.

- Recon Desk: documented comparison demo, actual comparison and reconciliation screenshots.
- Internal Operations Platform: frontend/backend combined; offline ownership described explicitly.
- Project Visualization Library: shared package used by operations and customer applications.
- Public Brand Website & CMS: SSR website, Frappe integration, Strapi configuration and shared EC2 staging setup.
- Sales CRM & Browser Telephony: custom CRM workflows and call handling on the existing Frappe platform.

Ricochet (`/play`) is a small mirror puzzle built for this site, linked from the homepage. It has five handcrafted levels, seeded random puzzles at three difficulties, a daily puzzle and shareable puzzle links. Its rules and level constraints are in the design guide; [docs/RICOCHET.md](docs/RICOCHET.md) explains the beam tracing, game state, solver and how to add levels.

`src/content/projects.json` supplies the homepage project collection, engineering decisions, project detail pages, interactive explanation copy and lite summaries. Recon's detail page hosts the full comparison demo in `src/home/ReconDemo.tsx`, with typed interaction wiring in `src/home/comparison.ts`. `src/projects/ProjectDemonstration.tsx` supplies the other project explanations: offline save recovery, call-event correlation, host-driven unit selection, and CMS publishing / enquiry routing. These use synthetic examples and never call the source applications.

The lazy-loaded Three.js neighbourhood is an optional portfolio map with nine sites and matching static artwork. “Explore the city” opens a large desktop or full-screen phone dialog. Studio links to five projects, Journey reads employment oldest first, and Say hello uses shared contact details. Arcade enters a separate playable Ricochet table, reusing the first lesson and rules without changing full-game progress. Small projected targets or unavailable graphics use a playable flat board with the same state. Two construction plots are noninteractive “Future space”; three buildings remain scenery. These are fictional destinations, not real workplaces.

Persistent HTML destination controls supplement occlusion-aware building selection. Back restores the exact previous city pose, including after switching destinations or resizing. The preview, city and Arcade share one on-demand renderer; inactive room resources are disposed, while puzzle state lasts until Close. Loading, retry, context recovery, keyboard access, focus containment and scroll restoration preserve useful HTML actions. Arcade is the first milestone of the [separate-scenes plan](docs/CITY-DESTINATION-SCENES-PLAN.md); the other three destinations retain reading panels pending its review.

The destination extension uses 12 static material batches and 112,050 model triangles, versus 11 and 133,100 before conversion. Chromium instrumentation recorded 28 draw calls on the initial shadow-generating frame, 13 on a subsequent overview redraw and 14 with a selected footprint; these are rendering-cost observations, not an FPS benchmark. Camera transitions run only while needed. No animation library or new dependency was added.

Header search filters project content locally, falling back to a native project directory without JavaScript. Homepage sections are React components in `src/home/`, rendered to static HTML at build time; `index.html` holds only the document head. No fictional role or payment model remains. Project details describe supplied implementation facts, not inferred business outcomes.

## Design and development

Read [the design language](docs/DESIGN.md) for the palette, typography, layout, component, motion and content rules. [AGENTS.md](AGENTS.md) directs future coding assistants to follow it.

Use Node 24 (`nvm use`, or install the version in `.nvmrc`) and npm. Python 3
must be available as `python3` for the generated-site checks; they use only its
standard library. GitHub's Ubuntu runners provide it.

Run `npm ci` to install dependencies, then `npm run dev` for local development.
`npm run build` produces the prerendered site in `dist/`.

## Deployment

`.github/workflows/deploy.yml` runs `npm run check` on pull requests, pushes to
`main` and manual runs. Validation has read-only repository permissions and never
uploads Pages artifacts. New runs cancel older validation for the same PR or
branch.

After successful validation, pushes to `main` publish to
https://ankitchandola.github.io/. Manual runs publish only when run on `main`
with the **deploy** input explicitly enabled. Publication rebuilds the same
commit in its own job; only that job receives Pages/OIDC write permissions and
uploads the Pages artifact. Deployments are serialized separately from
validation and use the `github-pages` environment. The site URL used for
canonical links and the sitemap is set in `scripts/prerender.mjs`.

**Owner setup:** require the **Validate** status check in the ruleset or branch
protection for `main`. These changes do not enable branch protection; the active
GitHub account has read-only access to repository settings. Configure
required reviewers on the `github-pages` environment if an additional human
deployment approval is desired.

## Validation

Run `npm run format` to format maintained source and documentation, or
`npm run format:check` to verify formatting without changing files. Generated
output, dependencies, local tool artifacts and third-party assets are excluded.

After `npm ci`, install the pinned browser with `npx playwright install chromium`.
CI uses `npx playwright install --with-deps chromium` for browser system libraries.
Run `npm run check` for formatting verification, zero-warning lint, strict type
checks, model tests, the production build, generated-site checks and browser
regressions, in that order. Individual commands are `npm run format:check`,
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
`npm run check:site` and `npm run test:browser` (the last two require an existing
`dist/` build).

ESLint covers application JS/JSX/TS/TSX, Node scripts/tests, Vite and ESLint
configuration, and the public theme script, with separate browser and Node
globals. JSX uses the recommended React Hooks and accessibility rules. ESLint
stays on version 9 while the React/JSX accessibility plugins declare support
through that major. Browser storage is optional: documented catches keep theme
and motion controls usable when persistence is blocked.

The checks cover the comparison model, the puzzle model and levels,
prerendered links and assets, headings, duplicate IDs, script-free lite output
and principal palette contrast. They do not replace a rendered visual review
in a browser.

## Browser regression checks

Playwright runs Chromium at 1440px desktop and 375px phone widths, against
production `dist/` served on `127.0.0.1:4173`. It refuses to reuse another server.
`scripts/serve-dist.mjs` serves generated files and directory indexes; missing
routes and assets return the generated custom 404 with HTTP 404, never an SPA
fallback.

The suite covers both gallery variants, keyboard gallery selection, comparison
scenarios/validation/reset, puzzle controls/progress and generated links,
clipboard fallback, theme persistence, navigation, reduced motion and visible
keyboard focus. Each test fails on uncaught page errors or React hydration
errors. Separate JavaScript-disabled contexts check homepage reading and
navigation, script-free lite output and its native phone menu.

Axe checks WCAG 2/2.1 A/AA on the homepage, a project detail, lite and play in
both themes, including expanded decisions/notes and phone menus. These checks
do not establish complete accessibility conformance or replace screen-reader
and touch-device testing.

Four reviewed screenshots in `tests/browser/__screenshots__/` pin the solved
first puzzle board in each theme and viewport. They deliberately exclude
font-sensitive surrounding copy and dynamic dates. Playwright/Chromium is pinned;
snapshots are never updated implicitly. For an intentional visual change, run
`npm run build` followed by
`npm run test:browser -- --grep "visual baseline" --update-snapshots`, inspect
every changed image and include the reviewed goldens in the same change.
Do not update goldens to hide an unexplained mismatch.

Failure screenshots and traces go to ignored `test-results/`; CI also uploads
the HTML report and traces as the `browser-failures` artifact for seven days.
Open a trace with `npx playwright show-trace <trace.zip>`.

Manual review still covers light/dark at 320, 375, 768, 1024 and 1440px:
expanded accordions, experience stacking while scrolling, long project copy,
uncropped gallery images, footer width, touch controls, lite descriptions and
keyboard focus. The board-only visual baseline is not a whole-site approval.
Real screen-reader, Safari/Firefox and physical-device checks remain manual.

## TypeScript migration boundary

The comparison model (`src/csv-model.ts`), puzzle rules/reducer, generator,
solver, random helpers and progress/preferences storage (`src/play/*.ts`)
are migrated. Tests import these `.ts` files directly using Node 24's native
type stripping; there is no emitted JavaScript copy or replacement test runner.
`tests/model-types.ts` contains compile-only checks for invalid action, state,
shot, evaluation and preference combinations.

Shared content, all React components and both React entries are typed.
`src/content/types.ts` defines the project, profile and experience contracts,
including fixed-length image/challenge/scope tuples and project-specific
demonstration copy with explicit simulation boundaries. `src/content/projects.ts` adapts the JSON
arrays to those tuples with checked lengths; `projects.json` remains the
authoritative copy. `tests/content-types.ts` pins the content contracts.
Full build-time content/link/asset validation remains a later delivery.
The homepage still renders static markup without hydration, and lite remains
script-free.

`tsconfig.json` shares strict, no-emit and unchecked-index settings.
`tsconfig.app.json` checks application TypeScript with browser libraries and no
Node globals. `tsconfig.node.json` checks the ESLint and Playwright JavaScript
configurations, production test server and compile-only model contracts with
Node globals and no DOM libraries. Native browser specs remain `.mjs`; their
Node test callbacks and browser-evaluated callbacks are linted with both
environments available.
Type-aware ESLint rules, including unhandled promises and exhaustive switches,
apply to migrated source and typed tests.

This is an incremental boundary, not a claim that all JavaScript is type-checked.
Browser interactions and Vite tooling stay JavaScript for the next
migration batches; they remain linted. Native `.mjs` tests stay on `node:test`.
The prerender entry, public theme script and inline pre-paint theme bootstrap
also stay JavaScript: prerendering imports the generated SSR bundle, public
scripts bypass Vite's TypeScript transformation, and early theme application
must not wait for the application bundle. Broader checked-JavaScript coverage
for these intentional exceptions belongs to the tooling batch.
