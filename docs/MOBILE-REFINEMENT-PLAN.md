# Mobile portfolio review and refinement plan

Reviewed 29 October 2026. Status: implemented 29 October 2026, recorded in [DESIGN.md](DESIGN.md) under Phone layouts. At 375px Selected Work now starts at about y=1,843px (was 1,944px in this review's development build, 2,218px in the production build), above the 1,400–1,600px review target because the city preview, static skills list and current-work scope rows were kept. The detail-page index stays a two-column grid instead of a disclosure, so its links remain directly visible. Physical-phone, software-keyboard and Safari checks have not been run.

## Recommendation

Recompose the portfolio for a narrow reading column. The current phone version largely stacks a desktop page: it keeps repeated introductions, multiple identity treatments, long card metadata and some narrow multi-column content. The problem is hierarchy and density more than a single broken breakpoint.

Keep the portfolio’s own city, artwork, palette and source-backed project stories. This is not a mobile copy of the reference portfolio. The owner permits design changes where the existing design is a blocker; record accepted changes in [DESIGN.md](DESIGN.md) when implementing them.

## Review performed

Reviewed the current local development site, shared design contract, component markup and applicable rules across the homepage, shared theme and detail/lite styles. Browser viewport checks:

- 320 × 740: hero, header and capabilities.
- 375 × 812: homepage hero, current work, project collection, a professional project card, capabilities, experience, contact and footer.
- 390 × 844: operations detail introduction/gallery, lite introduction and collapsed/expanded engineering decisions.
- 430 × 932: dark homepage hero, search panel and city overview dialog.

These are browser viewport reviews, not physical-phone testing. The development `/lite` route is not evidence that the built edition is script-free. No production build, complete interaction regression suite, mobile keyboard test, Safari check, or full dark/light matrix was run for this documentation-only review. Other project demos and `/play` still need focused checks during implementation. Browser viewport overrides were reset afterwards.

## Findings

| Priority | Observed issue                                       | Evidence and implication                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1       | Crowded header                                       | At 320–375px, monogram, a two-line name, search, theme and menu compete in one row. Controls dominate the small brand area.                                                                                                                                                                                                                                              |
| P1       | Too many layers before the work                      | At 375px the hero measures about 995px tall; current work is another 805px. Selected Work begins around document y=1,944px. Employment eyebrow, decorative name, large headline, introductory paragraph, actions, location, city, technology ribbon and a second work introduction all precede the collection.                                                           |
| P1       | Capability columns are too narrow                    | Frontend and Backend stay side by side at 320 and 375px. Tool names and evidence links wrap into short fragments; this is the clearest layout problem.                                                                                                                                                                                                                   |
| P1       | Project cards have accumulated content               | At 375px, the four professional cards measure roughly 709–715px each. Illustration, title, summary, ownership paragraph, several tag rows and two actions create a dense repeated sequence. The featured card also has an extra inset, so its text edge differs from neighboring cards. Height alone is not a defect, but the repeated density makes scanning difficult. |
| P2       | Mobile hierarchy varies between sections             | The hero headline is 45px at 375px, while section headings and card titles use other treatments. Forced breaks and several strong headings close together make the page feel composed section by section rather than as one phone layout.                                                                                                                                |
| P2       | Experience uses too much competing structure         | Employer heading, another large work headline, numbered responsibility rows, separators and tags repeat inside padded cards. The first card is about 666px tall at 375px.                                                                                                                                                                                                |
| P2       | Search is desktop-oriented in a phone panel          | The search panel is a tall scrolling list with long technology metadata and section shortcuts below projects. Keyboard-shortcut instructions do not help the ordinary touch path. Its behavior with the on-screen keyboard remains unverified.                                                                                                                           |
| P2       | City overview has excessive empty space              | At 430 × 932, the overview has a large gap between destination controls and the city, and more space before controls at the bottom. The scene is visible, but the available height is not used efficiently.                                                                                                                                                              |
| P3       | Detail and lite introductions can be more economical | The operations page spends nearly the first screen on introduction, tags and a six-item index before screenshots. Lite repeats the broad introduction and current-work overview. These are readable, but can get to evidence sooner.                                                                                                                                     |

No document-level horizontal overflow was measured on the 320/375px homepage or the sampled 390px lite view. That does not establish that every interaction is overflow-free. The operations gallery keeps its image uncropped, its selectors are usable, expanded decision paragraphs use the full column, and the sampled contact/footer layout is reasonably coherent. Preserve those strengths.

## Proposed changes

### 1. Establish one phone layout system

- Use 20px page gutters for ordinary phone widths and 16px at the narrowest width. Keep the same content edge through hero, section introductions and project text.
- Use a deliberate scale: approximately 36–42px hero, 30–34px section headings, 25–28px card titles, 17–18px body and 14–16px metadata. These are starting ranges to review with real text, not blanket reductions.
- Use 48–64px between sections, 24–32px between distinct content groups, and 12–16px within groups. Reduce redundant margins before reducing readable text.
- Allow headings to wrap naturally on phones; retain explicit line breaks only when they improve the narrow composition.
- Consolidate applicable mobile rules instead of appending another override block. Audit global `.hero` selectors against lite/detail styles and the final `theme.css` layer.

### 2. Simplify header and rebuild the hero rhythm

- Keep monogram and name legible, with theme and menu as the primary header controls. Move the phone search entry into the navigation disclosure while retaining search access and desktop shortcuts. Preserve native navigation without JavaScript.
- Make role and employer a compact, intentional two-line context block instead of a long uppercase sentence wrapping by accident.
- Remove the duplicate code-style name from the phone composition; the header already identifies Ankit. Preserve an appropriate accessible page heading. Update the current static-name design decision explicitly if this is implemented.
- Shorten the introduction using existing facts. Avoid repeating the same list of work areas in hero, current-work paragraph and scope rows.
- Put primary and secondary actions in a stable arrangement across 320–430px. Start with a full-width primary action and a clear secondary row; do not let incidental text width determine the layout.
- Keep the city below the reading/actions block as a compact optional preview, with its invitation in normal flow. Preserve the complete city and accessible full-screen explorer.
- Trial a quieter, static phone treatment for the technology ribbon. Keep the global motion control accessible if other motion remains. This is an explicit proposed departure from the continuously moving banner decision.

Target: identity, proposition and main actions comfortably available within the first 740–812px viewport at default text size. Text enlargement takes precedence over this target.

### 3. Shorten the route to Selected Work

- Keep current employment visible and the existing section order in the first implementation.
- Turn current work into a compact employer/role introduction plus the three scope rows. Remove the paragraph’s repeated inventory where the rows already communicate it.
- Shorten the two “Start here” link labels while preserving their meaning and destinations; allow their context to sit below rather than inside long underlined lines.
- Reassess the cumulative height after hero and current-work edits. Aim to bring the Selected Work introduction from about 1,944px to roughly 1,400–1,600px at 375px, without hiding important content or shrinking body text. Treat this as a review target, not a fixed-height constraint.

### 4. Rebalance project cards

- Preserve the project order and original 16:10 cover illustrations. Give every card a common text edge; remove the featured card’s extra mobile inset while keeping its featured status through a small label or restrained surface treatment.
- Keep one concise purpose statement and one concise contribution statement. Retain team size and ownership qualifiers where material; full explanations remain on detail pages. Put all copy edits in `projects.json`.
- Keep all technology tags readable and visible. Reduce chip padding and improve wrapping if needed; do not hide tags or shrink text to force a single row.
- Stack “Project details” and the secondary demo link consistently. Shorten long visible demo wording with a meaningful project-specific label stored in the shared data, while keeping accessible names unambiguous.
- Let card height follow its content. Do not introduce fixed heights or line clamps to make unequal stories appear equal.

Target: cards remain substantial but quickly answer what the project does, what Ankit contributed and where to go next. Review Recon and Operations first, then apply the pattern to all five.

### 5. Repair the supporting sections

- **Capabilities:** stack Frontend and Backend as full-width rows on phones. Place their small sequence number alongside the heading, followed by readable details and evidence links. Keep evidence links on deliberate lines instead of dense underlined prose.
- **Decisions:** retain full-width expanded reading. Reduce competing number/title/control widths in the collapsed row where needed; keep the entire summary tappable and expansion behavior intact.
- **Experience:** retain employer, role and dates prominently. Make the work-summary heading subordinate to the employer, simplify row separators, and use the full available reading width. Keep responsibilities visible in the first pass rather than adding another accordion.
- **Contact:** keep the useful prompt, email and copy action, but make their spacing consistent with the rest of the page. Review the decorative arrow action for redundancy. Preserve the contact colours and the separate final footer colour exactly.

### 6. Make mobile navigation and exploration comfortable

- Give search a clearly visible close action and a height constrained to the available viewport. Ensure results remain reachable when the on-screen keyboard opens. Show touch-relevant guidance on narrow screens; retain keyboard support without making its hint the primary instruction.
- Verify menu/search mutual behavior, focus restoration and outside dismissal after moving search into the menu. Retain a functioning no-script project directory and native menu on lite.
- Rebalance the city overview with content-aware scene height and a more useful camera framing. Keep Close and destinations accessible, then scene and controls; avoid making the model fill space by cropping it.
- Check Studio/Journey/Say hello panels and Arcade separately. Verify scrolling, safe-area insets, orientation changes and touch targets, including 320px. Do not redesign the game or add more scenes in this pass.

### 7. Align detail and lite pages

- Apply the same header, gutters, type scale and contact rhythm across routes.
- Reduce detail-introduction spacing and try a native “On this project” disclosure for the six index links on phones. Preserve the index and direct anchor access; evaluate discoverability before adopting the disclosure.
- Keep screenshot selectors, full uncropped images and the full-size-image link. The existing gallery is a useful baseline, not a candidate for decorative redesign.
- Remove repeated introductory phrasing from lite while keeping current employment, all projects, ownership and consecutive section numbers. Verify the production output remains script-free.
- Review all project demonstrations for nested padding, table overflow and long labels. Keep intentionally wide tables locally scrollable, without sideways page scrolling.

## Implementation order and files

1. Header, hero and current-work composition: `src/components/HeaderNavigation.tsx`, `src/components/SiteSearch.tsx`, `src/home/Hero.tsx`, `src/home/CurrentWork.tsx`, relevant style rules and interaction wiring.
2. Recon/Operations cards and capabilities as representative mobile components; then remaining project cards: `src/home/SelectedWork.tsx`, `src/home/HowIWork.tsx`, `src/content/projects.json` and typed content contracts where fields change.
3. Decisions, experience, contact and search/city overlays: their existing components and shared interaction/style sources. Preserve dependent IDs and data attributes.
4. Shared detail/lite layout in `src/App.tsx`, `src/style.css`, `src/case-theme.css`; update `docs/DESIGN.md` for accepted decisions.

Read the full affected cascade before editing: `public/assets/style.css`, `public/assets/v2.css`, `src/style.css`, `src/case-theme.css`, and final `public/assets/theme.css`. Keep desktop composition stable unless a shared change is deliberate. Do not modify the separate original Site.

## Acceptance and validation

- Review the complete scroll at 320, 375, 390 and 430px in both themes, plus 768px at the phone/tablet transition and desktop regression checks at 1024/1440px.
- Check long names, long demo links, all tags, expanded decisions, each experience card, email wrapping and footer alignment.
- Check no sideways document scrolling, no clipped text or controls, minimum 44px targets, visible focus, text enlargement, reduced motion, menu/search dismissal and city modal scrolling.
- Test search with the software keyboard on a real phone or a suitable device environment; include Safari and Android Chrome when available. Report unavailable checks honestly.
- Verify production no-JavaScript homepage access and script-free lite. Do not judge lite from the development route alone.
- Run `npm run build` and `python3 tests/check-site.py` for UI changes, relevant browser regressions for changed interactions, and `npm test` if comparison/puzzle behavior changes. Use rendered review, not passing tests alone, for visual acceptance.
- Save before/after captures of hero, project cards, capabilities and experience at the same widths. Do not approve the whole mobile design from the hero alone.

Success means a coherent phone reading experience with clear priorities, not simply a shorter page. Preserve facts, readable typography, original identity and optional exploration.
