# Project: Oros Worldbuilding Studio — Feature Expansion, Performance & De-vibecoding

## Architecture
Oros is a local-first creative worldbuilding studio built on Electron, React 18, Vite, TypeScript, and Tailwind CSS.
State is managed via Zustand stores (`useWorldStore`, `useTtrpgStore`), persistent storage writes to local JSON/vault structures, and rich views utilize `@xyflow/react` (Whiteboard Canvas) and TipTap 2 (Prose & Wiki Editor).

### Module Boundaries & Data Flow
1. **Design System & Shell**:
   - Palette: 13-step neutral `oros-50..950` with strict micro-radii (`rounded-[4px]` containers, `rounded-[2px]` controls) and hairline `border-oros-750`.
   - Modals follow the canonical triple-container architecture: Pinned Header, Scrollable Body, Pinned Footer.
   - Root View Container: Tab switching preserves view instances with display styling rather than remounting entire subtrees.
2. **Wiki Linking & Search**:
   - Editor (`WikiEditor`): TipTap 2 with `WikiLink` suggestion extension for `[[query]]` autocomplete and markdown rendering.
   - Indexing (`backlinksEngine`): Bi-directional graph computing both incoming backlinks and outgoing forward links across entities, chapters, timelines, and maps.
   - Spotlight Search (`CommandPalette` & `deepSearchEngine`): Global `Ctrl+K` searching articles, cards, timeline events, and battlemaps with keyboard navigation.
3. **Canvas & Whiteboard Engine**:
   - Custom React Flow 12 nodes and edges.
   - Smart orthogonal routing with A* grid search avoiding node bounding boxes.
   - Auto-layout clustering using 60-iteration physics relaxation with bounding-box collision avoidance.
   - Interactive entity cards on canvas with inline details and drag-and-drop instantiation.
4. **Calendar & Celestial Engine**:
   - Math core (`calendarMath.ts`): Continuous scalar epoch day counting, floor modulo for negative years, multi-tier leap rules, intercalary festival days.
   - Celestial core: Multiple moon synodic periods, continuous phase angle, 8 canonical lunar phases, syzygy/conjunction alignment detection.
   - Timeline integration: Continuous fractional year coordinates $T = Y + DOY / \text{daysInYear}(Y)$.
5. **Ecosystem Bridges**:
   - Obsidian Bridge (`obsidianBridge.ts`): Export/import of nested directory vault folders, YAML frontmatter, and `[[wiki-links]]` with 100% roundtrip fidelity.
   - Foundry VTT Bridge (`foundryBridge.ts`): Scene JSON export/import with padding coordinate transformation, walls, regular/secret doors, and token metadata.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Test Harness Baseline | Install Vitest, configure `pnpm test`, and create baseline unit test runner infrastructure | M1 | Survey 1 |
| 2 | UI De-vibecoding (Settings) | Remove roadmap stubs, fake theme marketplace, fake toasts, and demo typing placeholders | M1 | Survey 1 |
| 3 | UI De-vibecoding (Home & Navigation) | Remove BETA badges and generic promotional marketing blurbs across Home and Command Atelier | M1 | Survey 1 |
| 4 | UI De-vibecoding (Command Palette & Editor) | Strip redundant action subtitles in Command Palette and deprecate `@title` helper for `[[query]]` | M1 | Survey 1 |
| 5 | Design System Unification | Standardize all modals to `rounded-[4px]`, `border-oros-750`, and triple-container layout; eliminate nested border vibration in Card Gallery | M1 | Survey 1 |
| 6 | View Retention & Tab Performance | Prevent unmount/remount churn on tab switches in `App.tsx` and optimize root store selectors | M1 | Survey 1 |
| 7 | Wiki-Link Autocomplete (`[[query]]`) | TipTap 2 `WikiLink` suggestion extension triggering dropdown on `[[` and inserting wiki-links | M2 | Survey 2 |
| 8 | Bi-directional Link Indexing | Compute both incoming backlinks and outgoing forward links in `backlinksEngine.ts` | M2 | Survey 2 |
| 9 | Wiki-Link Hover Previews & Navigation | Activate mouseover preview popovers (`QuickPeekCard`) and click-to-navigate in `WikiArticleView` | M2 | Survey 2 |
| 10 | Global Spotlight Search (`Ctrl+K`) | Index battlemaps from `useTtrpgStore` in `deepSearchEngine`, keyboard scroll-into-view in `CommandPalette` | M2 | Survey 2 |
| 11 | Smart Orthogonal Connector Routing | A* grid routing avoiding obstacle node bounding boxes with minimal bends | M3 | Survey 2 |
| 12 | Whiteboard Auto-Layout Clustering | 60-iteration physics relaxation layout organizing whiteboard nodes without overlap | M3 | Survey 2 |
| 13 | Interactive Canvas Entity Cards & Dnd | Inline summary toggle, status badges, codex link, and drag-and-drop instantiation from sidebar | M3 | Survey 2 |
| 14 | Custom Calendar Weekdays & Months | Configurable days per week, custom month names and lengths with year epoch anchor | M4 | Survey 3 |
| 15 | Configurable Leap Year Rules | Multi-tier leap rules (intervals, offsets, exceptions) with targeted month leap days | M4 | Survey 3 |
| 16 | Intercalary Days & Festival Days | Days outside regular months or non-advancing weekly progression | M4 | Survey 3 |
| 17 | Multi-Moon Celestial Engine | Multiple independent moon orbits, synodic cycles, illumination %, and 8 lunar phases | M4 | Survey 3 |
| 18 | Celestial Syzygy & Conjunctions | Detecting multi-moon alignments (grand full conjunctions, eclipses) | M4 | Survey 3 |
| 19 | Chronological Timeline Integration | Continuous fractional year coordinates $T = Y + DOY / \text{daysInYear}(Y)$ in timeline line view | M4 | Survey 3 |
| 20 | Obsidian Vault Hierarchy Export/Import | Directory structure mapping between Oros folders and Obsidian vault markdown files | M5 | Survey 3 |
| 21 | Obsidian YAML Frontmatter Mapping | Lossless serialization and deserialization of entity metadata and infobox schema | M5 | Survey 3 |
| 22 | Obsidian `[[wiki-links]]` Translation | Bidirectional conversion between TipTap mentions/wiki-links and Obsidian `[[Target]]` syntax | M5 | Survey 3 |
| 23 | Foundry VTT Scene Geometry Translation | Canvas pixel dimensions, grid type (square/hex), grid size, and padding coordinate transformation | M5 | Survey 3 |
| 24 | Foundry VTT Walls & Doors Adapter | Data model and conversion for walls, windows, open/closed/locked doors, and secret doors | M5 | Survey 3 |
| 25 | Foundry VTT Token Metadata Mapping | Conversion between percentage coordinates and scene pixel coordinates with HP, AC, size, disposition | M5 | Survey 3 |
| 26 | Comprehensive E2E Verification & Hardening | 100% pass of E2E opaque-box test suite (Tiers 1-4) followed by Tier 5 adversarial coverage hardening | M6 | Survey 1, 2, 3 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI De-vibecoding, Performance & Test Harness | Vitest baseline, remove marketing fluff/roadmaps, modal standardization, tab view retention | none | DONE (Vitest configured, 200/200 tests pass, 0 TS errors, clean build) |
| M2 | Wiki Bi-directional Linking & Spotlight Search | TipTap `[[query]]` extension, backlink/forward link engine, hover preview, Ctrl+K battlemaps | M1 | DONE (TipTap WikiLink atom, forward/backlinks engine, hover preview, battlemaps search) |
| M3 | Advanced Canvas & Whiteboard Engine | Smart orthogonal routing with obstacle avoidance, auto-layout clustering, interactive cards & DnD | M1 | DONE (orthogonalRouting.ts, canvasAutoLayout.ts, 284 tests pass) |
| M4 | Fantasy Calendar & Celestial Engine | `calendarMath.ts`, leap rules, intercalary days, multi-moon phases, timeline fractional coordinates | M1 | DONE (calendarMath.ts, celestial orbits, BCE/CE transitions, festival freezes, 334 tests pass) |
| M5 | Obsidian & Foundry VTT Ecosystem Bridges | `obsidianBridge.ts`, `foundryBridge.ts`, YAML frontmatter, walls/doors model, lossless roundtrip | M1, M2 | DONE (obsidianBridge.ts, foundryBridge.ts, 401 tests pass, 0 TS errors, clean build) |
| M6 | Final Verification & Adversarial Hardening | Phase 1: 100% E2E tests passing. Phase 2: Tier 5 adversarial coverage hardening with Challenger loop | M1, M2, M3, M4, M5 | DONE (448/448 tests pass across 20 suites, 0 TS errors, clean build, clean project-wide forensic audit) |

---

## Interface Contracts

### M1 ↔ Project Root
- Test Runner: `pnpm.cmd test` executes `vitest run`.
- Tab Container: `App.tsx` retains mounted tab components via CSS hidden toggles or memoized cache, eliminating full subtree rebuilds on tab switches.

### M2 ↔ M1 & TipTap Editor
- `wikiLinkExtension.ts` exports `WikiLink` TipTap Node with `char: '[['` suggestion plugin.
- Markup convention: `<span class="oros-wiki-link" data-type="wiki-link" data-id="<id>" data-title="<title>">[[<title>]]</span>`.
- `backlinksEngine.ts` exports:
  - `findBacklinksForEntity(targetEntityId, worldData): BacklinkItem[]`
  - `findForwardLinksForEntity(sourceEntity, allEntities): ForwardLinkItem[]`
- `deepSearchEngine.ts` accepts optional `battlemaps: Record<string, TTRPGBattlemap[]>` and yields results with domain `'battlemap'`.

### M3 ↔ Whiteboard Canvas
- `orthogonalRouting.ts` exports:
  - `calculateObstacleAvoidanceRoute(source, target, obstacles: Box[], padding?: number): Point[]`
- `canvasAutoLayout.ts` exports:
  - `autoLayoutWhiteboardNodes(nodes: Node[], edges: Edge[], iterations?: number): Node[]`

### M4 ↔ Timeline & Calendar
- `calendarMath.ts` exports:
  - `calculateAbsoluteDay(year, month, day, hour, config): number`
  - `calculateDayOfWeek(absDay, config): { index: number; name: string }`
  - `isLeapYear(year, config): boolean`
  - `getDaysInYear(year, config): number`
  - `getDaysInMonth(year, monthIndex, config): number`
  - `calculateMoonPhases(absDay, moons: CelestialMoonConfig[]): CelestialPhaseResult[]`
  - `detectCelestialConjunctions(phases: CelestialPhaseResult[]): ConjunctionResult | null`
  - `dateToFractionalYear(year, month, day, hour, config): number`

### M5 ↔ Ecosystem Bridges
- `obsidianBridge.ts` exports:
  - `exportWorldToObsidianFiles(world, entities, folders, directoryItems): Record<string, string>`
  - `importObsidianFilesToWorld(files: Record<string, string>): { entities: LoreEntity[]; folders: DirectoryFolder[]; directoryItems: DirectoryItem[] }`
- `foundryBridge.ts` exports:
  - `exportBattlemapToFoundryScene(battlemap: TTRPGBattlemap, campaignName?: string): FoundrySceneData`
  - `importFoundrySceneToBattlemap(sceneData: FoundrySceneData, campaignId: string): { battlemap: TTRPGBattlemap; walls: TTRPGWall[] }`

---

## Code Layout
- `package.json`, `vitest.config.ts`: Root configuration and test runner
- `src/shared/types.ts`: Core data structures (extended with Calendar, Celestial, Wall, Door types)
- `src/renderer/App.tsx`: Main application shell and tab view container
- `src/renderer/components/common/`: Shared UI components (`CommandPalette.tsx`, buttons, modals)
- `src/renderer/components/wiki/`: Wiki editor, viewer, suggestion plugins (`WikiEditor.tsx`, `WikiArticleView.tsx`, `wikiLinkExtension.ts`)
- `src/renderer/components/canvas/`: Whiteboard engine and routing (`WhiteboardCanvas.tsx`, `orthogonalRouting.ts`)
- `src/renderer/components/timeline/`: Calendar and timeline views (`TimelineCalendarView.tsx`, `TimelineLineView.tsx`)
- `src/renderer/utils/`: Algorithmic engines (`calendarMath.ts`, `canvasAutoLayout.ts`, `backlinksEngine.ts`, `deepSearchEngine.ts`, `obsidianBridge.ts`, `foundryBridge.ts`)
- `src/__tests__/`: Automated unit and integration test suite
