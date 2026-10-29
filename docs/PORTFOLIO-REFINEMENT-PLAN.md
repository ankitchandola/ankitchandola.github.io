# Portfolio refinement plan

Status: phases 1 and 2 first pass implemented 29 October 2026 (hero positioning, start-here links, card contribution lines and demo links). Phase 4 (contact prompt and homepage copy-email) implemented the same day. Phase 3 first pass (capability evidence links, readable capability text, tighter work-section spacing), lite alignment, a static hero name and a Ctrl/⌘ K section jump were added afterwards.

## Intent

Use [Aadarsh’s portfolio](https://aadarsh-builds.vercel.app/) as a reference for communication and discovery, not as a layout, asset or copy template. The owner explicitly permits improving the existing design where it is a blocker, while keeping the result original. This plan proposes changes; it does not silently replace settled decisions in DESIGN.md.

The proposed direction is **a working developer’s field guide**: clear editorial typography, concise ownership statements, visual explanations of real work, and the miniature city as an optional way to explore. This is a design direction, not new visitor-facing copy.

## Review basis and limits

- Read the repository design contract, README, homepage components and project ownership data.
- Inspected the reference’s rendered mobile hero and other page areas, and its full homepage DOM, including project metadata, experience, skills, demos and contact.
- Inspected the current local homepage’s desktop hero and featured project rendering, alongside its homepage content and implementation.
- This is a qualitative review. It does not establish comparative conversion rates, load performance, accessibility conformance, or complete desktop/mobile parity. The reference’s case studies were not audited.
- No application code or design contract changed for this review. A full responsive review belongs to implementation.

## What is worth learning from the reference

| Observed pattern                                                                  | Opportunity in this portfolio                                                                                               | Original adaptation                                                                                                                          |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Its hero surfaces current employment and a concise professional position early.   | Your hero explains the work well, but current employment arrives later and several identity elements compete for attention. | Establish one dominant proposition, a stable identity and a compact current-role line using your verified information.                       |
| A “Start here” area points to two work stories.                                   | A visitor can browse five projects but receives little guidance on which demonstrates which strength.                       | Integrate two small text recommendations into the existing current-work summary, rather than adding another card section.                    |
| Project cards expose ownership such as co-built, backend ownership or solo build. | Ownership is carefully documented in your detail pages but unevenly visible in the index.                                   | Add a concise, source-backed contribution line to each card. Keep qualifiers such as “most” and distinguish shared work from sole ownership. |
| Related demo links sit beside project links.                                      | Recon’s card exposes its demo; the other projects’ demonstrations require deeper discovery.                                 | Keep “Project details” consistently available and add one quiet, specific demo link where useful.                                            |
| Skills are connected to project context.                                          | Your capabilities section names tools, while evidence is located elsewhere.                                                 | Link the existing Frontend and Backend blocks to relevant projects or decisions. Avoid another skills section.                               |
| Its contact section explains what to include in a message.                        | “Want to talk?” offers little context beyond the email address.                                                             | Add a brief prompt to describe the problem, team or timeline; retain direct email access.                                                    |

These patterns are useful independently of the reference’s appearance. Its metrics, employment claims and project narratives are not evidence for this portfolio, even where the employer or subject matter overlaps.

## Proposed implementation

### 1. Clarify the first screen — highest priority

- Reduce the number of competing identity treatments: name and current role as stable context, one dominant headline, then a short supporting paragraph.
- Explore a more specific headline around operations software and browser tools instead of increasing the size of a generic developer slogan. Draft alternatives only from existing claims.
- Keep “Explore my work” primary and give “View résumé” a clear secondary treatment. Keep the lite link quiet but explain its benefit with wording such as “Quick overview”.
- Preserve the city as the signature visual, with a short visible explanation of what it opens. Adjust its scale and alignment so it belongs to the hero composition without competing with the main action.
- Reduce excess vertical gaps on narrow screens; keep introduction and actions ahead of the city.
- Consider retiring the rotating identity text if a stable identity makes the composition clearer. This would be an explicit change to the existing motion decision, recorded in DESIGN.md when implemented.

Primary files: `src/home/Hero.tsx`, `src/home/CurrentWork.tsx`, `src/home/interactions.js`, and the relevant existing style rules.

Acceptance: a visitor can quickly identify Ankit, his current role, what he builds and how to open his work or résumé. All of this remains available without operating the city or waiting for animation.

### 2. Make the project index communicate ownership

- Preserve Recon Desk as the featured project and the four professional projects in their existing order for the first iteration.
- Use a consistent information order: project type, title, what it does, contribution, technologies, actions.
- Add short ownership summaries to `src/content/projects.json`, derived from the existing ownership fields. Examples of supported distinctions: end-to-end personal application; most frontend plus offline work across frontend/backend; primarily maintained shared package used by two applications.
- Give Recon an explicit “Project details” text link alongside its comparison-demo link. Its image already links to details, but the reading path should also be clear in text.
- Add descriptive links to existing project demonstrations where they help explain the work. Verify or add stable section anchors; do not build more demos for this redesign.
- Preserve all technology tags, complete screenshot galleries and ownership caveats.

Primary files: `src/home/SelectedWork.tsx`, `src/content/projects.json`, `src/content/types.ts`, `src/content/projects.ts`, and detail-page anchor markup if needed.

Acceptance: readers can distinguish the product’s purpose from Ankit’s contribution without opening every page. Demo links describe what they demonstrate and retain simulation boundaries.

### 3. Refine visual composition, without adopting the reference’s style

- Keep the warm teal/apricot/olive direction and local display/body/label fonts as the starting point. Improve hierarchy through type scale, line length, spacing and alignment before adding new decoration.
- Keep original project illustrations. Review their legibility at card size; simplify small internal details where necessary instead of recreating the reference’s simulated product windows.
- Establish consistent vertical rhythm between the hero, current work and project collection. Compress repeated introductions rather than shrinking readable text.
- Use open layouts and quiet separators for explanatory content, reserving stronger surfaces for project emphasis and contact.
- Review the capability and engineering-decision sections together to reduce repeated explanation. Add direct evidence links within the existing sections.
- Preserve the precise third-experience and footer colours, section numbering, uncropped screenshots and script-free lite behavior unless a later explicit decision changes them. The footer remains only the final bar.

Before styling, inspect the complete applicable cascade: `public/assets/style.css`, `public/assets/v2.css`, `src/style.css`, `src/case-theme.css`, and final shared `public/assets/theme.css`. Edit authoritative existing rules rather than accumulating overrides.

Acceptance: hero, work cards and contact form a coherent composition in both themes; descriptions and tags remain readable. The result should still be identifiable as Ankit’s portfolio with names and logos hidden.

### 4. Make contact easier and more purposeful

- Replace or supplement the generic invitation with a concise prompt for a role, project or technical conversation, without claiming unconfirmed availability.
- Keep email and professional profile links prominent. Add copy-email only if implemented with a visible success/error message and a usable fallback.
- Do not add a contact-service dependency solely because the reference uses a form.
- A genuine recommendation could be considered later only if supplied and approved for publication. Do not invent social proof or borrow a colleague’s endorsement.

Primary files: `src/home/Contact.tsx`, shared profile content and corresponding detail/lite contact markup in `src/App.tsx`.

Acceptance: a visitor knows how to contact Ankit and what information would be useful, without encountering a form requirement or unsupported availability claim.

## What not to import

- The reference’s exact headline, italic typography treatment, coral/lime palette, workbench scene, project titles, layout sequence or illustration compositions.
- A terminal, extra game, friends carousel, large social directory or new homepage demo laboratory. The city, Ricochet and existing project demonstrations already provide personality and technical depth.
- Project filters for only five items, duplicated collections, or a larger project count as a goal in itself.
- Unverified scale metrics, seniority, availability, testimonials or business impact.

## Delivery sequence

1. Implement the hero and one representative project card as a coherent visual first pass. Record deliberate departures from the design contract in the same change.
2. Review the rendered result in light/dark and narrow/wide layouts. Assess clarity and originality before propagating styling.
3. Apply the agreed treatment across all five projects, refine capability links and contact, and align shared elements in detail/lite pages.
4. Run the build and generated-site checks. Run model tests if comparison behavior changes; run relevant browser checks for interaction changes.
5. Review 320, 375, 768, 1024 and 1440px layouts, keyboard focus, touch targets, reduced motion, no-JavaScript behavior, gallery controls, experience scrolling and footer width. Report checks actually completed.

The first implementation should focus on phases 1 and 2 above: clearer positioning and visible ownership. Further visual changes should support those goals rather than expand the feature count. No deployment is part of this planning task.
