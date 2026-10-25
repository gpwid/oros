# Original User Request

## 2026-10-24T18:06:00Z

Comprehensive feature expansion, performance optimization, and visual de-vibecoding for Oros Worldbuilding Studio across two phased milestones: UI unification and wiki linking first, followed by canvas enhancements, fantasy calendars, and ecosystem bridges.

Working directory: c:\Users\azisk\Documents\codes\orosapp
Integrity mode: development

## Requirements

### R1. UI De-vibecoding, Performance Optimization & Design Unification
Audit and refactor the entire UI to adhere strictly to a clean, cohesive desktop software design system. Remove all generic marketing copy, AI boilerplate subtitles, and decorative nested card borders across all dialogs, headers, and views. Optimize React render trees, remove redundant re-renders, and ensure instantaneous tab and view transitions.

### R2. Wiki Bi-directional Linking & Global Spotlight Search (Ctrl+K)
Provide a bi-directional linking system in the rich-text editor that auto-completes existing entities via `[[query]]`, maintains an updated index of incoming backlinks and outgoing forward links, and shows hover previews when mousing over linked entities. Implement a global `Ctrl+K` quick-search modal that instantly searches across all articles, cards, timeline events, and battlemaps with keyboard navigation.

### R3. Advanced Canvas & Whiteboard Engine
Upgrade the canvas connection system to calculate smart orthogonal routes that cleanly avoid intersecting node boundaries, provide an auto-layout clustering action for organizing complex relationship graphs, and support embedding interactive entity cards directly onto the canvas.

### R4. Fantasy Calendar & Celestial Engine
Implement a configurable calendar creation and management system supporting custom days per week, custom months, leap year rules, multiple moon orbits with phase calculations, and chronological integration with the Timeline view.

### R5. Obsidian & Foundry VTT Ecosystem Bridges
Provide robust export and import adapters for Obsidian Markdown vaults (preserving folder hierarchies, YAML frontmatter, and wiki-links) and Foundry VTT battlemap scenes (grid dimensions, wall/door data, and token metadata).

## Acceptance Criteria

### Verification Suite & Code Quality
- [ ] `pnpm exec tsc --noEmit` passes with 0 TypeScript compiler errors.
- [ ] `pnpm run build` passes with 0 build or bundling warnings/errors.
- [ ] Automated unit test suite executes and passes for wiki-link parsing, backlink index computation, calendar date mathematics, and Obsidian/Foundry roundtrip serialization.

### UI & Performance Standard
- [ ] Zero instances of placeholder/AI marketing subtitles (e.g. generic promotional blurbs in modals or headers) remain in user-facing UI strings.
- [ ] Global style consistency: all modals, buttons, segmented controls, and menus use the shared Oros design token palette without divergent accent borders.

### Functional Verification
- [ ] Typing `[[` inside the article editor displays an interactive dropdown of world entities that inserts a functional link upon selection.
- [ ] Hovering over a wiki-link displays a popover card with title, summary, and status, and clicking navigates to the target entity.
- [ ] Pressing `Ctrl+K` from any screen opens the global search palette, filters results in under 50ms, and navigates to the selected target on Enter.
- [ ] Canvas connectors automatically route around obstacle cards without overlapping them directly, and triggering Auto-Layout repositions nodes without overlapping.
- [ ] Custom calendar date calculations accurately project weekday names, leap days, and celestial phases over arbitrary year ranges.
- [ ] Exporting to Obsidian format produces a valid folder of `.md` files with readable frontmatter and bi-directional links that can be re-imported without data loss.


## Follow-up — 2026-10-24T20:57:53Z

Quota has reset. Please resume teamwork coordination where you left off (Milestone 2 review gate clearance and dispatching Milestone 3). All tests are currently passing 247/247 and build is verified.
