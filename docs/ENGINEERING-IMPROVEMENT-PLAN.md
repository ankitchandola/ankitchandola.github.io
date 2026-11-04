# Engineering improvement plan

## Goal and scope

Add automated quality gates, migrate application JavaScript to TypeScript, and improve maintainability without changing the portfolio's design, content claims, routes, or rendering architecture.

Status updated 4 November 2026: formatting, lint, strict type checks, PR validation, production browser/accessibility tests, typed models and React/content migration are implemented. DOM interaction/tooling migration, full build-time content validation, broader component/CSS cleanup and measured performance work remain. Screenshot dimensions are now stored and checked against the assets. Use [README.md](../README.md) for the current commands and validation coverage.

The baseline below describes the original review, not the current checkout. Follow [DESIGN.md](DESIGN.md) throughout implementation. Keep the original interactive Site separate.

## Original planning baseline

- npm with `package-lock.json`; React 19, React Router 7, and Vite 7.
- `npm test` runs the native Node test runner against `tests/*.test.mjs`.
- The build creates client assets and an SSR bundle, then prerenders HTML through `scripts/prerender.mjs`.
- Homepage components produce static markup and are never hydrated. Small browser modules attach interactions.
- Detail pages and `/play` hydrate React. `/lite` must remain script-free.
- No lint, format, or type-check commands are currently configured.
- Deployment checks run after pushes to `main`, not on pull requests.
- Existing tests cover comparison and puzzle models, progress storage, levels, and selected generated-site invariants.

The review baseline passed 23 tests, the production build, and `python3 tests/check-site.py`. Re-establish the baseline before implementation: other work may have changed the checkout.

## Working rules

- Inspect the current worktree and integrate existing changes; do not revert unrelated work.
- Deliver one coherent change per PR. Keep formatting-only diffs separate from semantic changes.
- Use npm and update the lockfile whenever dependencies change.
- Preserve routes, DOM IDs, data attributes, storage keys, metadata, gallery variants, and no-JavaScript behavior.
- Do not add a framework, state library, test runner replacement, or mandatory Git hooks.
- Do not introduce blanket lint suppressions, unchecked casts, or empty fallbacks to make checks pass.
- Do not use screenshot approval or snapshot updates to hide unintended UI changes.

## Phase 1: Readable source and basic quality gates

### 1A. Formatting

- Add Prettier with repository configuration and an ignore file.
- Format maintained JS/JSX, JSON, CSS, HTML, workflow YAML, and relevant documentation.
- Exclude generated output (`dist/`, `.build/`), dependencies, local tool artifacts, and third-party assets.
- Add `format` and `format:check` scripts.
- Preserve CSS rule order and specificity. Formatting is not permission to reorganize the cascade.

**Acceptance:** `format:check` passes; existing tests, build, and site checks pass. The diff contains no intentional behavior or visual changes.

### 1B. Linting

- Add ESLint flat configuration using the recommended JavaScript rules, React Hooks rules, and JSX accessibility rules.
- Define separate environments for browser modules, Node tooling/tests, and public browser scripts.
- Cover `src/`, maintained scripts/tests, Vite configuration, and `public/assets/theme.js`.
- Add TypeScript-aware rules when TypeScript files land in Phase 3.
- Add `lint` with zero permitted warnings. Use Prettier for formatting rather than competing ESLint style rules.
- Fix real findings surgically; record a narrow exception only when the architecture requires it.

**Acceptance:** all maintained JavaScript is linted without a blanket legacy exclusion. Hook and accessibility findings are resolved or individually justified.

## Phase 2: PR validation and reproducible tooling

Depends on Phase 1.

- Declare the supported Node 24 range in `package.json` and add a matching local version file.
- Keep `npm ci` as the CI installation command.
- Add `check:site` and an aggregate `check` command using the existing test runner and build pipeline.
- The aggregate runs formatting verification, lint, tests, build, and site checks; add type-checking and content validation when available.
- Run validation on pull requests and main pushes. Keep deployment restricted to trusted main pushes and explicitly approved main-branch manual runs.
- Separate validation from Pages publication so PRs never upload or deploy Pages artifacts.
- Scope Pages/OIDC write permissions to deployment; validation needs only read permissions.
- Use cancellable, per-PR validation concurrency separately from deployment concurrency.
- Document required commands and Python availability in the README.
- Configure the validation job as a required branch check where repository settings permit. Record if this requires owner action.

**Acceptance:** a PR runs validation without deployment permissions or deployment steps; a passing main build remains deployable.

## Phase 3: Incremental TypeScript migration

Depends on Phases 1 and 2. Keep every migration batch independently passing.

### Configuration

- Add TypeScript, React/React DOM type definitions, Node types, and typescript-eslint.
- Use separate browser and Node/tooling configurations with shared strict defaults.
- Use `strict` and `noEmit`; Vite continues to produce application assets.
- Enable `noUncheckedIndexedAccess` for migrated code and fix index assumptions with real guards or stronger domain types.
- Add `typecheck` using `tsc`, independently of `vite build`.
- Restrict browser and Node globals to the files that use them.
- Use a temporary, explicit JS migration boundary rather than silently excluding JavaScript forever.
- Enable type-aware lint rules on migrated files, including unhandled promises.

### 3A. Pure models and storage

- Convert `src/csv-model.js`, `src/play/model.js`, and `src/play/progress.js` to `.ts`.
- Define comparison rows, scenarios, evaluation success/error results, directions, mirrors, levels, shots, game state, and reducer actions.
- Use discriminated unions for outcomes and actions so impossible combinations are rejected.
- Keep integer-cent calculations, puzzle rules, state transitions, and storage compatibility unchanged.
- Keep `node:test`. Existing `.mjs` tests can import erasable `.ts` modules directly under supported Node 24; use explicit `.ts` paths and compatible compiler settings.
- Do not use enums or other syntax requiring runtime TypeScript transformation in native Node imports.

**Acceptance:** current model tests run against migrated source, not stale emitted JavaScript. Add focused tests only for bugs or behavior introduced by the migration.

### 3B. Content and React components

- Define project, experience, profile, image tuple, challenge tuple, and diagram variant types.
- Preserve `projects.json` as the content source; do not move project copy into components.
- Convert shared components and homepage sections, then detail/lite layouts and the puzzle component to `.tsx`.
- Type props, event handlers, refs, reducer dispatch, and custom CSS properties without `any`.
- Convert client and SSR entries together with their import references and build paths.
- Keep homepage rendering static and `/lite` script-free.

### 3C. Browser interactions

- Convert `src/home/interactions.js` and `src/home/client.js` to `.ts`.
- Narrow queried elements to their actual DOM types and validate required elements at initialization.
- Validate `dataset` values at their boundary instead of asserting arbitrary strings are domain values.
- Preserve optional enhancement behavior, motion preferences, keyboard behavior, and gallery hooks.
- Keep initialization and listener ownership explicit; avoid broad catches around interaction setup.

### 3D. Build tooling and exceptions

- Convert `vite.config.js` to `.ts` and type its development plugin.
- Update entry names in HTML, Vite, build scripts, and development SSR loading in the same batch.
- Keep `scripts/prerender.mjs` as a small Node entry initially; check it with TypeScript/JSDoc. Convert it separately only when the runtime and generated-bundle imports remain straightforward.
- Keep native `.mjs` tests unless converting them improves meaningful type coverage.
- Do not rename `public/assets/theme.js` to `.ts`: public files bypass Vite transformation. Either retain checked JavaScript or deliberately introduce a bundled entry while preserving early theme application.
- Preserve the small inline pre-paint theme bootstrap. Document these intentional JavaScript exceptions.

**Acceptance:** all application modules are typed; retained JavaScript has an explicit reason and check coverage. Tests, dev routes, SSR/prerendering, and production routes still work.

## Phase 4: Browser and accessibility regression tests

Depends on Phase 2. Can run before or alongside Phase 3; complete before structural or CSS refactoring.

- Add Playwright against production-built output, not only Vite development behavior.
- Serve real generated routes and the custom 404 without an SPA fallback that masks missing output.
- Test homepage and detail galleries, comparison scenarios/validation/reset, puzzle fire/undo/reset/progress, theme persistence, and navigation.
- Fail relevant tests on uncaught page errors and React hydration errors.
- Cover keyboard navigation, focus visibility, reduced motion, and the mobile navigation.
- Verify `/lite` contains no scripts and remains readable with JavaScript disabled.
- Verify homepage core content and links without JavaScript.
- Add focused axe checks for homepage, a project detail, lite, and play, including representative expanded states.
- Start with desktop and phone Chromium smoke tests; broaden browser coverage only for identified risks.
- Automate a small stable visual baseline and retain manual checks at the widths and themes listed in the design contract.

**Acceptance:** browser checks run in PR CI and catch interaction failures that model/static tests cannot. Keep a documented manual review list for behavior automation cannot establish.

## Phase 5: Content validation

Depends on Phase 3B.

- Validate project and level inputs before rendering. Keep validation build-time, not in every browser route.
- Use one schema/type source for content rather than independently maintained runtime and TypeScript definitions.
- Prefer a small schema dependency with type inference if handwritten validation would duplicate substantial structures.
- Check required fields, tuple lengths, diagram variants, unique slugs/anchors, valid references, and approved screenshot paths.
- Preserve optional blocks: missing evidence must not be filled with invented narrative.
- Reuse existing level parsing and solver checks instead of building a second puzzle validator.
- Add a `check:content` command and make production builds fail on invalid content.
- Keep generated-site checks for output-level links, metadata, assets, and script-free lite behavior.

**Acceptance:** malformed content fails with the project/field identified before prerendering; schema code does not increase browser payload.

## Phase 6: Targeted maintainability work

Depends on Phases 3, 4, and 5.

- Extract cohesive detail/lite components from `src/App.tsx`; keep route composition easy to scan.
- Share only genuinely common presentation or data logic. Do not force static homepage galleries and hydrated galleries into one lifecycle.
- Audit the complete CSS cascade before changing it.
- Consolidate duplicate and superseded rules into their intended existing layers in small batches.
- Preserve the final shared theme layer, exact color exceptions, responsive rules, motion preferences, and `?gallery=original`.
- Consider Stylelint after formatting and cascade cleanup. Do not enable rule sets that require broad visual rewrites.

**Acceptance:** simpler components and fewer contradictory overrides, with no intended content or visual changes. Browser, accessibility, and rendered checks pass.

## Phase 7: Measured performance and dependency upkeep

Depends on Phase 4. Independent of CSS cleanup.

- Measure production page transfers, route JavaScript, image loading, layout shifts, and LCP before setting budgets.
- Add intrinsic screenshot dimensions to reserve layout space.
- Generate responsive WebP/AVIF variants where measurements justify them; preserve uncropped screenshots and original full-size links.
- Keep below-fold screenshots lazy-loaded; decide eager loading from actual viewport/LCP evidence.
- Investigate route-level loading for the puzzle only if bundle analysis shows a useful benefit. Preserve prerendering and hydration.
- Add modest regression budgets based on the measured baseline, not arbitrary thresholds.
- Add Dependabot for npm and GitHub Actions; keep major upgrades separate from this migration.

**Acceptance:** measured improvements or explicit regression budgets, without degraded screenshot legibility, hydration, or no-JavaScript reading.

## Suggested delivery sequence

1. Formatting-only PR.
2. ESLint, runtime declaration, aggregate commands, and PR CI.
3. TypeScript configuration and pure model/storage migration.
4. Production browser and accessibility smoke tests.
5. Typed content and React component migration.
6. DOM interaction migration, Vite configuration, and checked tooling exceptions.
7. Build-time content validation.
8. Small component and CSS cleanup PRs.
9. Measured asset/bundle improvements and dependency automation.

## Completion checklist

- Fresh installation works using the declared Node version and `npm ci`.
- Formatting, lint, type-checking, model tests, content checks, build, generated-site checks, and browser tests pass through documented commands.
- PR validation blocks broken changes without granting deployment permissions.
- Main deployment still publishes the prerendered output.
- Homepage remains unhydrated; lite remains script-free; detail/play hydration has no errors.
- Existing routes, metadata, storage, gallery variants, design constraints, and privacy rules remain intact.
- Intentional JavaScript exceptions and unavailable manual checks are documented honestly.
