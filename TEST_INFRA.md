# Test Infrastructure & Opaque-Box Verification Methodology

## Executive Summary & Test Philosophy

The testing framework for **Oros Worldbuilding Studio** adheres strictly to an **opaque-box, requirement-driven verification methodology**. All test suites, test cases, and assertions are derived directly and authoritatively from:
1. `ORIGINAL_REQUEST.md` (Core user specifications and acceptance criteria)
2. `PROJECT.md` (System architecture, interface contracts, and Features 1–26)
3. Domain Specification Mining and Architectural Surveys (`spec_miner_survey_3` and `explorer_survey_2`)

### Core Verification Principles
- **Opaque-Box Isolation**: Tests evaluate public interfaces, observable state transitions, mathematical correctness, data invariants, and serialized contracts. Tests do not rely on or assert internal implementation ephemera.
- **Test Integrity**: Facade tests, tautological assertions (`expect(true).toBe(true)`), and artificial mocks designed solely to pass without exercising logic are strictly forbidden. Every test asserts concrete, derived values from authoritative reference models or observable system behavior.
- **Adversarial & Boundary Verification**: Suites systematically probe edge conditions, negative inputs, mathematical singularities, format escapes, circular dependencies, and corrupt schemas.
- **Zero-Regression Assurance**: All tests execute under continuous automated test harnesses via Vitest (`vitest run tests/e2e`).

---

## Test Architecture & Tooling

- **Test Framework**: Vitest v5.0.5 running on Node.js v22.14.0 (x64) and TypeScript 5.7.3.
- **Test Configuration**: `vitest.config.ts` includes `src/**/*.{test,spec}.{ts,tsx}` and `tests/**/*.{test,spec}.{ts,tsx}` with `@` and `@shared` path aliases.
- **Execution Commands**:
  - `vitest run tests/e2e`: Executes the comprehensive end-to-end and integration verification suite.
  - `pnpm.cmd test`: Executes the complete test harness (all unit and E2E suites).

### Directory & File Structure
```
c:/Users/azisk/Documents/codes/orosapp/
├── TEST_INFRA.md                              # This authoritative test infrastructure specification
├── TEST_READY.md                              # Test suite readiness certification & execution guide
├── vitest.config.ts                           # Vitest runner configuration
├── src/
│   └── __tests__/                             # Co-located unit test suites
│       ├── exportUtils.test.ts                # JSON/CSV serialization unit tests
│       └── snapEngine.test.ts                 # Map & pin snapping geometry unit tests
└── tests/
    └── e2e/                                   # Comprehensive E2E test suites
        ├── helpers/                           # Reference engines, AST analyzers & test fixtures
        │   ├── wikiLinkHelper.ts              # Wiki-link AST parser & bi-directional graph engine
        │   ├── calendarMathHelper.ts          # Continuous epoch math, leap evaluator & celestial engine
        │   ├── obsidianBridgeHelper.ts        # Obsidian vault serializer & YAML frontmatter parser
        │   ├── foundryBridgeHelper.ts         # Foundry VTT scene geometry, wall & token transformer
        │   ├── canvasLayoutHelper.ts          # A* orthogonal obstacle router & physics layout relaxation
        │   └── uiAuditHelper.ts               # AST & token scanner for UI de-vibecoding & design tokens
        ├── wiki_linking.test.ts               # Feature 7, 8, 9, 22 verification
        ├── calendar_math.test.ts              # Feature 14, 15, 16, 17, 18, 19 verification
        ├── obsidian_foundry_serialization.test.ts # Feature 20, 21, 23, 24, 25 verification
        ├── canvas_layout.test.ts              # Feature 11, 12, 13 verification
        └── ui_standards.test.ts               # Feature 2, 3, 4, 5, 6 verification
```

---

## 4-Tier Test Methodology

The verification suite is structured across four rigorous tiers ensuring total coverage from atomic feature invariants to real-world worldbuilding workflows:

```
+-----------------------------------------------------------------------+
|  Tier 4: Real-World Application Scenarios (>=5 complex end-to-end flows)|
+-----------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations (Pairwise system integration)     |
+-----------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (>=5 stress/adversarial cases/feat)  |
+-----------------------------------------------------------------------+
|  Tier 1: Feature Coverage (>=5 test cases per Feature 1-26)           |
+-----------------------------------------------------------------------+
```

---

### Tier 1: Feature Coverage (Features 1–26)

Every feature in the `PROJECT.md` Feature Inventory is verified by at least 5 dedicated, reproducible test cases:

#### Feature 1: Test Harness Baseline
- `T1.1.1`: Vitest discovery matches files matching `tests/**/*.{test,spec}.ts`.
- `T1.1.2`: Test runner executes in Node.js environment without DOM emulation requirement for pure algorithmic suites.
- `T1.1.3`: Path alias `@shared` correctly resolves to `src/shared/types.ts`.
- `T1.1.4`: Clean exit code 0 when all assertions pass.
- `T1.1.5`: Non-zero exit code on assertion failure.

#### Feature 2: UI De-vibecoding (Settings)
- `T1.2.1`: Verifies absence of Theme Marketplace preview card (`theme-marketplace`, fake preview).
- `T1.2.2`: Verifies absence of fake roadmap pill stubs in Settings modals.
- `T1.2.3`: Verifies removal of fake "Settings saved!" toast simulation.
- `T1.2.4`: Verifies absence of demo editing typing placeholders in font customization.
- `T1.2.5`: Confirms functional settings controls (accent color, font scale, auto-save interval) remain accessible.

#### Feature 3: UI De-vibecoding (Home & Navigation)
- `T1.3.1`: Verifies removal of `BETA` badge on TTRPG workspace tab.
- `T1.3.2`: Verifies template cards in HomePage contain no generic promotional marketing copy.
- `T1.3.3`: Verifies Command Atelier quick-launch items have concise functional titles without secondary marketing descriptions.
- `T1.3.4`: Confirms workspace tab navigation retains functional tab switching.
- `T1.3.5`: Confirms recent projects and quick actions display valid project statistics.

#### Feature 4: UI De-vibecoding (Command Palette & Editor)
- `T1.4.1`: Verifies removal of redundant action subtitles ("Create a new article in the codex") in Command Palette.
- `T1.4.2`: Verifies deprecation of `@title` helper text in WikiArticleView in favor of `[[query]]`.
- `T1.4.3`: Verifies Command Palette input focuses immediately upon trigger.
- `T1.4.4`: Verifies keyboard arrow navigation highlights search results cleanly.
- `T1.4.5`: Verifies Enter key triggers immediate navigation to selected entity.

#### Feature 5: Design System Unification
- `T1.5.1`: Standardizes modals to `rounded-[4px]` container radius.
- `T1.5.2`: Standardizes control elements to `rounded-[2px]`.
- `T1.5.3`: Enforces hairline border standard (`border-oros-750`).
- `T1.5.4`: Verifies triple-container layout (pinned header, scrollable body, pinned footer) across modal dialogs.
- `T1.5.5`: Eliminates stacked internal card borders in CardGallery in favor of subtle background tints.

#### Feature 6: View Retention & Tab Performance
- `T1.6.1`: Verifies tab switching does not unmount active view trees.
- `T1.6.2`: Verifies CSS hidden styling or view memoization preserves scroll position across tab switches.
- `T1.6.3`: Verifies WhiteboardCanvas retains node state and pan/zoom coordinates across tab toggles.
- `T1.6.4`: Verifies root store selector memoization prevents redundant re-renders.
- `T1.6.5`: Verifies view transition latency is instantaneous without layout shift.

#### Feature 7: Wiki-Link Autocomplete (`[[query]]`)
- `T1.7.1`: Parser detects `[[` trigger pattern and extracts partial query string.
- `T1.7.2`: Suggestion engine filters world entities matching query against title and aliases.
- `T1.7.3`: Selection inserts standard wiki-link node syntax `[[Target Title]]`.
- `T1.7.4`: Supports custom display label syntax `[[Target Title|Custom Display Label]]`.
- `T1.7.5`: Supports section heading anchor syntax `[[Target Title#Section Heading]]`.

#### Feature 8: Bi-directional Link Indexing
- `T1.8.1`: Calculates incoming backlinks from manuscript chapters to target lore entity.
- `T1.8.2`: Calculates incoming backlinks from other lore entity prose content.
- `T1.8.3`: Calculates incoming backlinks from structured infobox entity-link fields.
- `T1.8.4`: Extracts outgoing forward links referenced within an entity's content.
- `T1.8.5`: Computes complete bi-directional link graph with cycle resilience.

#### Feature 9: Wiki-Link Hover Previews & Navigation
- `T1.9.1`: Generates hover preview payload containing entity title, type, category, and status.
- `T1.9.2`: Extracts and formats preview summary, falling back to initial content paragraph.
- `T1.9.3`: Formats infobox key-value pairs for quick peek presentation.
- `T1.9.4`: Resolves click-to-navigate action payload with correct target ID and tab type.
- `T1.9.5`: Truncates overlong preview summaries with clean ellipsis.

#### Feature 10: Global Spotlight Search (`Ctrl+K`)
- `T1.10.1`: Indexes lore articles, cards, chapters, and timeline events.
- `T1.10.2`: Integrates battlemaps from TTRPG store with `'battlemap'` domain category.
- `T1.10.3`: Executes deep vault search query in under 50ms.
- `T1.10.4`: Verifies keyboard selection scroll-into-view behavior.
- `T1.10.5`: Formats search result highlights around matched search terms.

#### Feature 11: Smart Orthogonal Connector Routing
- `T1.11.1`: Calculates orthogonal route with right-angle segments between source and target handles.
- `T1.11.2`: Detects obstacle node bounding boxes and inflates collision padding ($pad \ge 20px$).
- `T1.11.3`: Executes A* grid routing navigating around obstacles without intersecting bounding boxes.
- `T1.11.4`: Minimizes bend count by applying turn cost penalty in A* heuristic.
- `T1.11.5`: Falls back gracefully to direct orthogonal stub route when path is completely enclosed.

#### Feature 12: Whiteboard Auto-Layout Clustering
- `T1.12.1`: Executes 60-iteration physics relaxation force simulation.
- `T1.12.2`: Applies pairwise anti-overlap bounding box repulsion preventing node collisions.
- `T1.12.3`: Applies edge spring attraction drawing connected nodes toward optimal distance.
- `T1.12.4`: Applies center-of-mass gravity preventing disconnected graph drift.
- `T1.12.5`: Guarantees deterministic, stable node positions after 60 iterations.

#### Feature 13: Interactive Canvas Entity Cards & DnD
- `T1.13.1`: Renders entity portrait banner, title, and category icon on canvas card node.
- `T1.13.2`: Toggles inline card summary and tag pills without opening external drawer.
- `T1.13.3`: Displays secret status badge and entity classification pill.
- `T1.13.4`: Handles HTML5 drag-and-drop payload to instantiate new canvas card at drop coordinates.
- `T1.13.5`: Preserves custom card dimensions upon user resize.

#### Feature 14: Custom Calendar Weekdays & Months
- `T1.14.1`: Configures arbitrary week lengths (e.g., 6-day, 7-day, 10-day Dekad) with custom names.
- `T1.14.2`: Configures arbitrary months with variable day counts (e.g., 12 x 30 days, 16 x 28 days).
- `T1.14.3`: Converts calendar date $(Y, M, D, H)$ to continuous scalar absolute day count $D$.
- `T1.14.4`: Calculates exact day-of-week index and name for any positive year date.
- `T1.14.5`: Validates month day clamping when transitioning between months of differing lengths.

#### Feature 15: Configurable Leap Year Rules
- `T1.15.1`: Evaluates regular interval leap rules (e.g., every 4 years).
- `T1.15.2`: Applies starting offset years (e.g., leap every 4 years starting at year offset 2).
- `T1.15.3`: Evaluates exclusion rules (e.g., skip leap every 100 years).
- `T1.15.4`: Evaluates reinstatement rules (e.g., reinstate leap every 400 years).
- `T1.15.5`: Correctly allocates leap days to designated target month.

#### Feature 16: Intercalary Days & Festival Days
- `T1.16.1`: Places intercalary days outside standard month sequences (e.g., Midsummer after Month 6).
- `T1.16.2`: Implements weekday-skipping intercalary days that do not advance the weekly progression.
- `T1.16.3`: Evaluates leap-only intercalary festival days (e.g., Shieldmeet every 4 years).
- `T1.16.4`: Accumulates intercalary days into annual day count $\text{daysInYear}(Y)$.
- `T1.16.5`: Formats display dates for festival days with custom naming.

#### Feature 17: Multi-Moon Celestial Engine
- `T1.17.1`: Simulates multiple independent moon orbits with distinct synodic periods $P_{syn} \in \mathbb{R}^+$.
- `T1.17.2`: Computes continuous phase angle $\theta(D) = 2\pi ((\phi_0 + D/P_{syn}) \bmod 1.0)$.
- `T1.17.3`: Computes geometric illumination percentage $I(D) = \frac{1 - \cos(\theta(D))}{2} \times 100\%$.
- `T1.17.4`: Categorizes lunar phase into 8 canonical phases (New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, Last Quarter, Waning Crescent).
- `T1.17.5`: Renders distinct display color tint per celestial body.

#### Feature 18: Celestial Syzygy & Conjunctions
- `T1.18.1`: Detects multi-moon Grand Full Conjunction when all moons achieve Full Moon within tolerance $\epsilon \le 0.04$.
- `T1.18.2`: Detects Celestial Dark Conjunction when all moons achieve New Moon within tolerance $\epsilon \le 0.04$.
- `T1.18.3`: Computes harmonic beat period $P_{beat} = 1 / |1/P_1 - 1/P_2|$.
- `T1.18.4`: Identifies opposition alignments (one moon Full while second moon New).
- `T1.18.5`: Computes peak conjunction hour within calendar day.

#### Feature 19: Chronological Timeline Integration
- `T1.19.1`: Computes continuous fractional year coordinate $T = Y + DOY / \text{daysInYear}(Y)$.
- `T1.19.2`: Integrates sub-day hour resolution into fractional coordinate: $+ H / (H_{day} \cdot \text{daysInYear}(Y))$.
- `T1.19.3`: Projects fractional year $T$ onto horizontal ruler pixel space $(T - Y_{min}) \cdot pxPerYear + 300$.
- `T1.19.4`: Prevents visual event clustering for events sharing the same calendar year.
- `T1.19.5`: Supports multi-era timeline boundaries with designated historical era tags.

#### Feature 20: Obsidian Vault Hierarchy Export/Import
- `T1.20.1`: Maps Oros `DirectoryFolder` tree to nested filesystem paths `/Folder/SubFolder/`.
- `T1.20.2`: Categorizes unfiled entities into standard directories (`/Characters/`, `/Locations/`, `/Factions/`).
- `T1.20.3`: Generates Markdown files with `.md` extension containing sanitized filenames.
- `T1.20.4`: Maps vault media attachments into dedicated `assets/` directory.
- `T1.20.5`: Reconstructs complete `DirectoryFolder` hierarchy upon importing folder structure.

#### Feature 21: Obsidian YAML Frontmatter Mapping
- `T1.21.1`: Serializes entity `id`, `title`, `type`, `tags`, `aliases`, `summary`, and dates into YAML frontmatter.
- `T1.21.2`: Serializes structured infobox sections, labels, values, and field types.
- `T1.21.3`: Preserves secret status (`isSecret: boolean`) in YAML header.
- `T1.21.4`: Captures unrecognized third-party frontmatter in `customProperties` catch-all.
- `T1.21.5`: Proves lossless roundtrip: `import(export(entity)) == entity`.

#### Feature 22: Obsidian `[[wiki-links]]` Translation
- `T1.22.1`: Converts TipTap `<span data-type="mention">` to Obsidian `[[Title]]`.
- `T1.22.2`: Converts alias mentions to `[[Title|Custom Label]]`.
- `T1.22.3`: Parses Obsidian heading links `[[Title#Section]]`.
- `T1.22.4`: Resolves imported `[[wiki-links]]` against world entity registry by title and aliases.
- `T1.22.5`: Retains unresolved wiki-link stubs without corrupting content.

#### Feature 23: Foundry VTT Scene Geometry Translation
- `T1.23.1`: Exports battlemap image URL, width, and height to Foundry scene JSON document.
- `T1.23.2`: Maps grid type (`square` $\to 1$, `hex` $\to 2$ or $3$).
- `T1.23.3`: Maps grid size, grid opacity, and scale distance units.
- `T1.23.4`: Applies scene padding factor ($P = 0.25$, canvas $1.5 \times$ image dimensions).
- `T1.23.5`: Inverts padding transformation on import from Foundry scene JSON.

#### Feature 24: Foundry VTT Walls & Doors Adapter
- `T1.24.1`: Converts Oros wall segments to Foundry wall format `c: [x1, y1, x2, y2]`.
- `T1.24.2`: Maps regular walls (`door: 0`, `move: 20`, `sense: 20`).
- `T1.24.3`: Maps regular doors (`door: 1`) with states: closed (`ds: 0`), open (`ds: 1`), locked (`ds: 2`).
- `T1.24.4`: Maps secret doors (`door: 2`) with closed/open states.
- `T1.24.5`: Discards zero-length wall segments and snaps adjacent wall vertices within $\epsilon = 1px$.

#### Feature 25: Foundry VTT Token Metadata Mapping
- `T1.25.1`: Converts Oros percentage coordinates $(x\%, y\%)$ to Foundry pixel coordinates accounting for padding.
- `T1.25.2`: Translates token center coordinates to Foundry top-left cell coordinates based on token size $S$.
- `T1.25.3`: Maps token hit points (`hpCurrent`, `hpMax`) to Foundry `bar1.value` and `bar1.max`.
- `T1.25.4`: Maps disposition (friendly `1`, neutral `0`, hostile `-1`) based on `isEnemy` flag.
- `T1.25.5`: Clamps out-of-bounds tokens to scene canvas boundary.

#### Feature 26: Comprehensive E2E Verification & Hardening
- `T1.26.1`: Verifies all 26 features under automated test runner without failure.
- `T1.26.2`: Verifies zero memory leaks during intensive layout and math iterations.
- `T1.26.3`: Verifies type integrity via TypeScript compiler (`tsc --noEmit`).
- `T1.26.4`: Verifies production packaging via Vite build without bundling errors.
- `T1.26.5`: Validates complete system integrity with adversarial stress payloads.

---

### Tier 2: Boundary & Corner Cases (>=5 per Feature Domain)

#### Calendar Mathematics Boundary Cases
1. **Astronomical vs Historical Year Zero**:
   - `hasYearZero: true`: $-1 \to 0 \to 1$ (difference between $-1$ and $1$ is 2 years).
   - `hasYearZero: false`: $-1 \to 1$ (difference between $-1$ BCE and $1$ CE is 1 year).
2. **Negative Year Floor Modulo**:
   - In JavaScript, `-1 % 7 === -1`. The engine enforces mathematical floor modulo `((val % N) + N) % N` ensuring weekday indices are strictly in $[0, N-1]$.
3. **Gregorian Leap Precedence Edge Cases**:
   - Year 1900: Divisible by 4 and 100, not 400 $\to$ Non-leap.
   - Year 2000: Divisible by 4, 100, and 400 $\to$ Leap year.
   - Year 2024: Divisible by 4, not 100 $\to$ Leap year.
   - Year 2100: Divisible by 4 and 100 $\to$ Non-leap.
4. **Day-of-Month Clamping on Boundary Transitions**:
   - Transitioning an event from Day 31 of a 31-day month to a 30-day month or non-leap February (28 days) clamps $D = \min(D, \text{daysInMonth}(Y, M))$ without overflowing.
5. **Weekday Progression with Festival Days**:
   - Forgotten Realms Harptos calendar has 5 festival days outside the 10-day week; the day after Midsummer has the identical weekday index as the day before Midsummer.

#### Celestial Engine Boundary Cases
1. **Incommensurable Synodic Periods**:
   - Moons with fractional periods ($P_1 = 28.0$, $P_2 = 29.53059$) never hit exact $0.000000$ alignment; evaluated with angular tolerance threshold $|\theta_1 - \theta_2| < \epsilon = 0.04$.
2. **Phase Boundary Wrapping**:
   - Exact phase transitions at $0.0 \equiv 1.0$; phase fraction $0.999$ and $0.001$ both correctly classify as New Moon.
3. **Extreme Sub-Day Conjunctions**:
   - Evaluating alignments across 1-hour intervals accurately detects the exact peak opposition hour.
4. **Zero & Negative Moon Phase Offsets**:
   - Normalizes negative epoch phase offsets $(\phi_0 < 0)$ via `((phi % 1) + 1) % 1`.
5. **Single-Moon System Graceful Degradation**:
   - Celestial conjunction detector returns `null` or single-phase result when $K < 2$.

#### Obsidian & Foundry Serialization Boundary Cases
1. **Forbidden Windows/UNIX Filename Characters**:
   - Entity titled `"Kaelen: The Wolf / Crow?"` sanitized to `"Kaelen_ The Wolf _ Crow_"`, storing original title in frontmatter for 100% roundtrip restoration.
2. **Multi-Part Wiki-Links with Colons and Anchors**:
   - `[[Atlas: The Northern Realms#The Ice Spire|Spire of Frost]]` decomposes into target `"Atlas: The Northern Realms"`, anchor `"The Ice Spire"`, and label `"Spire of Frost"`.
3. **Scene Coordinate Clamping with Zero/Max Padding**:
   - Padding $P=0$ (tight bounding box) and $P=0.5$ (double canvas dimension) calculate accurate token positions without negative indices.
4. **Vertex Snapping with Floating-Point Imprecision**:
   - Wall coordinates with slight float discrepancies ($x=450.00001$ vs $450.0$) snap within $\epsilon = 1px$ to form contiguous enclosed rooms.
5. **Secret Door Privacy Invariant**:
   - Secret doors (`door: 2`) retain hidden flag during serialization so player view filters out secret door geometry.

#### Canvas & Routing Boundary Cases
1. **Zero Line-of-Sight Maze Obstacles**:
   - When an obstacle node blocks the direct path between source and target, A* searches around the bounding box with 3 or 4 right-angle turns.
2. **Overlapping Nodes Auto-Layout Repulsion**:
   - Nodes placed at identical coordinates $(x, y)$ apply randomized perturbation force, resolving overlap within 60 iterations.
3. **Collinear Waypoint Simplification**:
   - Three consecutive collinear points $(0,0) \to (50,0) \to (100,0)$ simplify to $(0,0) \to (100,0)$.
4. **Disconnected Graph Components**:
   - Auto-layout clusters disconnected components around center-of-mass without infinite repulsion drift.
5. **Boundary-Padding Collision Immunity**:
   - Routes maintain minimum $20px$ separation from obstacle edges.

---

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)

| Matrix Pair | Features Involved | Verification Scenario |
|-------------|-------------------|-----------------------|
| **C1** | F7 + F20 + F22 | **Wiki-Linking & Obsidian Vault Roundtrip**: TipTap article with `[[query]]` wiki-links exported to Obsidian vault `.md` files, preserving link syntax and restoring bi-directional graph upon re-import. |
| **C2** | F14 + F15 + F19 | **Leap Year Calendar & Timeline Line Coordinates**: A custom 10-month calendar with 4-year leap rules accurately plots fractional year coordinates $T$ across a 500-year timeline ruler. |
| **C3** | F16 + F17 + F18 | **Festival Days & Multi-Moon Conjunctions**: Calculating celestial phases for an intercalary Midsummer festival day outside standard months to detect a rare dual-moon Grand Full Conjunction. |
| **C4** | F8 + F10 | **Bi-directional Indexing & Spotlight Search**: Typing `Ctrl+K` searches across battlemaps, manuscript chapters, and lore cards, displaying backlink count badges in search results. |
| **C5** | F11 + F12 + F13 | **Interactive Whiteboard Graph**: Canvas entity cards dropped from sidebar, auto-laid out with 60-iteration physics relaxation, connected via obstacle-avoiding orthogonal routing. |
| **C6** | F21 + F23 + F25 | **Ecosystem Bridge Data Cohesion**: Exporting an entire campaign world containing Obsidian lore vaults and Foundry VTT battlemap scenes with synchronized token and entity IDs. |
| **C7** | F2 + F3 + F4 + F5 | **Design System & UI De-vibecoding**: Full UI audit ensuring modals, settings, home page, and palette adhere strictly to unified design tokens without marketing boilerplate. |

---

### Tier 4: Real-World Application Scenarios (>=5 Realistic Scenarios)

#### Scenario 1: "The Chronicles of Ostergard" (Epic Worldbuilding Codex)
- **Context**: A comprehensive fantasy setting comprising 3 eras, 12 factions, 40 lore articles, 6 manuscript chapters, and an atlas map.
- **Workflow**:
  1. Author introduces characters using `[[Character Name|Alias]]` links.
  2. Bi-directional link index computes incoming backlinks from chapters and outgoing forward links from lore articles.
  3. User hovers over wiki-link; hover preview popover displays summary, status, and faction affiliation.
  4. User searches via `Ctrl+K` for a faction; navigates instantaneously.
- **Success Criteria**: 0 broken links, 100% graph connectivity accuracy, sub-50ms search latency.

#### Scenario 2: "Harptos Forgotten Realms Vault Migration"
- **Context**: Importing an existing campaign world utilizing the Faerûn Calendar of Harptos (365 days, 12 months of 30 days, 5 intercalary festival days, Shieldmeet leap rule every 4 years).
- **Workflow**:
  1. Initialize calendar with Harptos months and 5 intercalary days (Midwinter, Greengrass, Midsummer, Highharvestide, Feast of the Moon).
  2. Configure Shieldmeet leap rule (occurs once every 4 years after Midsummer).
  3. Export world to Obsidian Markdown vault.
  4. Validate all YAML frontmatter, tags, aliases, and `[[wiki-links]]`.
  5. Re-import vault into fresh Oros world instance.
- **Success Criteria**: Invariant holds: $\text{import}(\text{export}(\text{World})) \equiv \text{World}$.

#### Scenario 3: "Sunken Citadel Tactical Battlemap Foundry Integration"
- **Context**: A $1920 \times 1080$ dungeon battlemap with 20 wall segments, 4 doors (2 normal, 1 locked, 1 secret), and 6 character tokens.
- **Workflow**:
  1. Configure grid (square, $64px$, $5ft$ per cell).
  2. Place wall segments and define door states.
  3. Place tokens with HP, AC, and player/enemy disposition.
  4. Export battlemap to Foundry VTT Scene JSON.
  5. Verify coordinate translation applying scene padding $P = 0.25$.
  6. Re-import scene JSON into Oros and verify walls and tokens retain exact locations within $\pm 0.01\%$.
- **Success Criteria**: Zero geometry distortion, secret door privacy preserved, wall endpoints snapped.

#### Scenario 4: "Celestial Conjunction at the Winter Solstice"
- **Context**: A world with three moons: Selûne ($P_1 = 28.0$ days, Silver), Moran ($P_2 = 14.0$ days, Blue), and Crimson Eye ($P_3 = 42.0$ days, Red).
- **Workflow**:
  1. Initialize multi-moon celestial engine with specified synodic periods and epoch phase offsets.
  2. Run simulation across 500 calendar years.
  3. Identify all triple-moon Syzygy events (Grand Full Conjunctions) where all three moons reach illumination $I \ge 98\%$.
  4. Map conjunction dates onto timeline ruler with continuous fractional coordinates.
- **Success Criteria**: Conjunction periods match theoretical harmonic beat period: $P_{beat} = \text{lcm}(P_1, P_2, P_3) = 84$ days.

#### Scenario 5: "Dense Faction Alliance Network on Whiteboard"
- **Context**: A complex political intrigue whiteboard with 10 faction cards, 5 character cards, and 22 relationship edges with cross-cutting connections.
- **Workflow**:
  1. Nodes initially placed randomly in a clustered heap with multiple bounding box overlaps.
  2. Trigger Auto-Layout clustering (60-iteration physics relaxation).
  3. Orthogonal routing engine calculates connector lines between all related cards.
- **Success Criteria**: 0 overlapping node bounding boxes after relaxation; 0 connector lines intersecting intervening obstacle cards; clean right-angle routing with minimal bends.

---

## Verification & Execution Protocol

The E2E test suite is executed via:
```powershell
pnpm.cmd exec vitest run tests/e2e
```

### Invalidation Conditions
- Any test failure in `tests/e2e/`.
- Any TypeScript compilation error (`pnpm.cmd exec tsc --noEmit`).
- Any build or bundling failure (`pnpm.cmd run build`).
- Any presence of mock tautologies (`expect(true).toBe(true)`) or bypass facades.
