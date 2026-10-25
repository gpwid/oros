# Specification Mining Report: R4 (Fantasy Calendar & Celestial Engine) & R5 (Obsidian & Foundry VTT Bridges)

**Working Directory:** `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3`  
**Date:** 2026-10-24T18:16:00Z  
**Author:** Specification Miner (spec_miner_survey_3)  
**Parent Orchestrator:** `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`  
**Baseline Verification:** `pnpm.cmd exec tsc --noEmit` (0 errors), `pnpm.cmd run build` (0 errors, 13.96s)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R4 Calendar | Custom Weekdays & Week Length | Arbitrary number of days per week with custom naming (e.g. 7-day fantasy, 6-day sci-fi, 10-day dekad). | `daysOfWeek: string[]` | Day-of-week index & label for any date | Fallback to default 7-day week if empty | `src/shared/types.ts:194`, `calendarDefaults.ts:16` |
| 2 | R4 Calendar | Custom Months & Days per Month | Configurable array of months with variable day counts and optional season metadata. | `months: WorldCalendarMonth[]` | Month lengths, days in year, month index | Minimum 1 month enforced; fallback to 30 days | `src/shared/types.ts:180-186`, `TimelineCalendarSettingsModal.tsx:49` |
| 3 | R4 Calendar | Configurable Leap Year Rules | Regular intervals, starting offsets, exclusion intervals (Gregorian-style), and targeted leap day destination (specific month or intercalary day). | `leapRules: LeapRuleConfig[]` | Extra days added to target month or leap period | Ignored if no leap rules defined; gracefully handles non-leap years | New Specification Requirement (R4) |
| 4 | R4 Calendar | Intercalary & Festival Days | Special days occurring outside standard months or weekdays (e.g. Midsummer festival in Harptos/Shire). | `intercalaryDays: IntercalaryDay[]` | Uncounted or fixed festival dates | Option to skip weekday progression or assign special festival weekday | New Specification Requirement (R4) |
| 5 | R4 Calendar | Era Definitions & Year Offsets | Named historical eras with start/end years and color tags displayed along timeline and calendar. | `eras: WorldEraDefinition[]` | Active era display and boundary markers | Events outside eras display default era prefix/suffix | `src/shared/types.ts:127-134`, `calendarDefaults.ts:108-111` |
| 6 | R4 Celestial | Multiple Moon Orbits & Periods | Independent orbits for multiple celestial bodies with custom synodic periods (in solar days), phase offsets, and visual colors. | `moons: CelestialMoonConfig[]` | Synodic cycle, current phase angle $\theta$, illumination percentage $I$ | Clamped to $P_{syn} > 0$; default to single moon if none | New Specification Requirement (R4) |
| 7 | R4 Celestial | 8-Phase Lunar Calculation | Discrete canonical phase identification (New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, Last Quarter, Waning Crescent). | Absolute Day $D$, Moon parameters | Phase name, icon glyph, illumination % | Seamless cycle wrapping at $1.0 \equiv 0.0$ | New Specification Requirement (R4) |
| 8 | R4 Celestial | Multi-Moon Conjunctions (Syzygy) | Computation of celestial alignment when multiple moons simultaneously achieve Full Moon or New Moon. | Array of `CelestialMoonConfig`, Date | Alignment event flag, beat period $P_{beat}$, confluence severity | Detected via threshold tolerance $\epsilon \le 0.04$ | New Specification Requirement (R4) |
| 9 | R4 Timeline | Fractional Year Timeline Coordinates | Chronological positioning on the timeline ruler integrating year, month, day, and hour into continuous axis coordinates. | Year, Month, Day, Hour | Continuous axis coordinate $T \in \mathbb{R}$ | Defaults to beginning of year if month/day omitted | `TimelineLineView.tsx:83-89` (upgraded spec) |
| 10 | R5 Obsidian | Vault Hierarchy Export/Import | Directory structure mapping between Oros nested `DirectoryFolder` / `DirectoryItem` tree and Obsidian filesystem directories. | Oros world vault or disk folder tree | Preserved nested folder tree of `.md` files | Flattened to root if parent folder missing | `src/shared/types.ts:308-326`, New Bridge Spec |
| 11 | R5 Obsidian | YAML Frontmatter Mapping | Lossless extraction and injection of YAML metadata block preserving entity ID, title, type, aliases, tags, summary, and infobox schema. | Markdown with `---` header or Oros `LoreEntity` | Frontmatter string or parsed `LoreEntity` metadata | Syntax error in YAML preserves raw text in entity content | New Specification Requirement (R5) |
| 12 | R5 Obsidian | `[[wiki-links]]` Bidirectional Translation | Conversion between TipTap mention nodes (`<span data-type="mention">`) and Obsidian wikilinks (`[[Target]]`, `[[Target\|Display]]`, `[[Target#Section]]`). | Editor HTML/JSON or Markdown text | Converted string with bidirectional index updates | Unmatched link renders as unresolved wiki-link stub | `backlinksEngine.ts:113`, `mentionSuggestion.ts:92` |
| 13 | R5 Obsidian | Lossless Roundtrip Guarantee | Invariant verification: `import(export(world)) == world` without loss of tags, infobox fields, aliases, or secret flags. | Full entity set & metadata | Exact deserialized structural state | Roundtrip drift detected via checksum / schema validator | Acceptance Criteria (ORIGINAL_REQUEST.md:44) |
| 14 | R5 Foundry | Scene Geometry & Grid Translation | Export and import of scene background image, canvas pixel dimensions, grid type (square/hex), cell pixel size, and scale distance. | `TTRPGBattlemap` or Foundry Scene JSON | Converted scene document or Oros battlemap | Default to square 100px grid if missing or invalid | `src/shared/types.ts:412-428`, New Bridge Spec |
| 15 | R5 Foundry | Walls and Doors Data Model | Representation of vision-blocking and movement-blocking wall segments, open/closed/locked doors, and secret doors. | Wall coordinate segments `[x1, y1, x2, y2]`, door state | `TTRPGWall[]` with door metadata or Foundry `walls` array | Zero-length walls discarded; unclosed doors default to closed | New Specification Requirement (R5) |
| 16 | R5 Foundry | Token Placement & Metadata | Conversion of character/enemy tokens between Oros percentage coordinates `(0-100%)` and Foundry pixel space `(x, y)` with HP, AC, size, disposition. | `TTRPGToken[]` or Foundry `tokens` array | Positioned tokens with stat bars and token dimensions | Out-of-bounds tokens clamped to scene canvas | `src/shared/types.ts:359-376`, New Bridge Spec |

---

## Edge Cases

| # | Feature | Input / Condition | Observed / Specified Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | R4 Calendar Math | Year 0 in Historical vs Astronomical Reckoning | In historical reckoning (... 1 BCE -> 1 CE), Year 0 does not exist. In astronomical reckoning (... -1, 0, 1 ...), Year 0 exists. The engine must support a boolean `hasYearZero: boolean`. If `false`, year diff between $1\text{ CE}$ and $1\text{ BCE}$ is 1 year (not 2). Modulo arithmetic must shift negative years by $+1$ to avoid off-by-one errors. |
| 2 | R4 Calendar Math | Negative Years ($Y < 0$) in JavaScript `%` Modulo | In JavaScript, `-1 % 7 === -1`. Naive `%` produces negative weekday offsets. Mathematical floor modulo must be enforced: `((val % N) + N) % N` to guarantee weekday indices are strictly in $[0, N-1]$. |
| 3 | R4 Calendar Math | Irregular / Multi-Tier Leap Cycles | Calendars like Earth Gregorian (every 4 years, skip 100, keep 400) or complex fantasy cycles (e.g. leap every 5 years except every 50). Leap year evaluation must execute in order of decreasing tier precedence: if $Y \pmod{400} == 0 \to \text{true}$; else if $Y \pmod{100} == 0 \to \text{false}$; else if $Y \pmod{4} == 0 \to \text{true}$. |
| 4 | R4 Calendar Math | Month Boundary Clamping on Date Edits | An event recorded on Day 31 of a 31-day month when switched to a 30-day month or non-leap February (28 days) must clamp $D = \min(D, \text{daysInMonth}(Y, M))$ rather than overflowing into the subsequent month. |
| 5 | R4 Calendar Math | Intercalary Days outside Weekday Sequence | In calendars like Forgotten Realms Harptos, the 5 festival days do not advance the 10-day week (the day following Midsummer has the same weekday as the day preceding it). Weekday index must only accumulate non-intercalary days: $\text{regularDaysCount} \pmod{\text{weekLength}}$. |
| 6 | R4 Celestial Engine | Non-Integer Synodic Periods | A moon's synodic period is rarely an exact integer of days (e.g., Earth Moon is $29.530588$ days, fantasy moons can be $14.28$ or $41.333$ days). Calculating phase by integer day truncates fractional drift. Phase angle must be computed with floating-point day: $\theta(D) = 2\pi \cdot ((\phi_0 + D / P_{syn}) \pmod 1)$. |
| 7 | R4 Celestial Engine | Multi-Moon Convergence with Incommensurable Periods | If Moon 1 has $P_1 = 28$ and Moon 2 has $P_2 = 29.53$, they will never achieve an exact mathematical $0.000000$ alignment at midnight. Conjunction/Syzygy detection must evaluate an angular tolerance threshold $|\theta_1(D) - \theta_2(D)| < \epsilon_{angle}$ (where $\epsilon \approx 0.04 \approx 14.4^\circ$). |
| 8 | R4 Celestial Engine | Day/Hour Resolution in Phase Prediction | A Full Moon may peak at 14:00 (midday). Displaying the phase on a calendar day grid must evaluate phase at midnight ($H=0$) or solar noon ($H=\text{hoursInDay}/2$), with a secondary badge indicating peak opposition hour. |
| 9 | R5 Obsidian Bridge | Illegal Windows/UNIX Characters in File Titles | Entity titles frequently include characters forbidden in filenames (`:`, `/`, `\`, `?`, `*`, `"`, `<`, `>`, `|`). The bridge must maintain a bidirectional sanitizer: `sanitizeFilename(title)` replaces forbidden characters with `_` or URL encoding, and stores `originalTitle` in the YAML frontmatter so roundtrip title fidelity is 100%. |
| 10 | R5 Obsidian Bridge | Wiki-Links with Aliases, Headings, and Case Variations | `[[Archmage Corvus|The Raven]]` or `[[Dun Carrow#Tithe Barns]]`. Importer must parse the three-part regex `\[\[([^#\|\]]+)(?:#([^\|\]]+))?(?:\|([^\]]+))?\]\]`: Part 1 is target entity title/alias/ID, Part 2 is heading anchor, Part 3 is display label. |
| 11 | R5 Obsidian Bridge | Circular Entity Backlink References | Entities A and B both referencing each other via `[[wiki-links]]` must not cause infinite recursion in markdown serializers or graph traversals. Backlink indices must be calculated from a single pass inverted index. |
| 12 | R5 Obsidian Bridge | Complex / Nested Infobox Structures in YAML | Oros infoboxes contain sections with arrays of typed fields (text, date, number, entity-link, tag-list). The YAML serializer must cleanly format nested lists without dropping `targetEntityId`. On import, unrecognized YAML keys must be captured in a `customFrontmatter` catch-all so third-party Obsidian plugins (e.g. Dataview) do not corrupt Oros data. |
| 13 | R5 Foundry Bridge | Coordinate Scaling with Scene Padding | Foundry VTT scenes apply a padding factor (default $P = 0.25$, creating a canvas $1.5 \times$ image dimensions). Placing an Oros token at $(x\%, y\%)$ without accounting for padding shifts tokens into the empty margin. Formal coordinate transformation must explicitly apply or remove padding. |
| 14 | R5 Foundry Bridge | Wall Segment Vertex Snapping & T-Junctions | Foundry wall segments sharing endpoints must have identical coordinates $(x, y)$ to allow the lighting/vision engine to seal rooms. Coordinate conversion from normalized percentages must round to integer pixel space with an $\epsilon = 1\text{px}$ proximity snap. |
| 15 | R5 Foundry Bridge | Secret Doors vs Normal Doors | Foundry represents walls as an array with `door: 0` (wall), `door: 1` (door), `door: 2` (secret door), and `ds: 0` (closed), `ds: 1` (open), `ds: 2` (locked). The Oros battlemap schema must model these exact states so GMs see secret door badges that players cannot see in player mode. |
| 16 | R5 Foundry Bridge | Missing Background Image in Air-gapped / Local Environments | A Foundry scene JSON may reference a local file path (e.g. `worlds/myworld/scenes/dungeon.webp`). On import into Oros desktop or web, if the file is not bundled, the bridge must create a fallback placeholder canvas with grid dimensions preserved and prompt the user to locate or replace the background image. |

---

## 1. Observation

### 1.1 Existing Calendar & Timeline Architecture
- **Data Models:** Located in `src/shared/types.ts`:
  - `WorldCalendarMonth` (lines 180-185): `{ id: string, name: string, days: number, season?: string }`.
  - `WorldCalendarConfig` (lines 187-200): `{ firstYear: number, lastYear: number, yearPrefix?: string, yearSuffix?: string, hoursInDay: number, daysOfWeek: string[], months: WorldCalendarMonth[], eras?: WorldEraDefinition[], customCategories?: TimelineCategoryDefinition[], customPeriodTypes?: TimelinePeriodClassification[] }`.
  - `TimelineEvent` (lines 158-179): `{ id: string, worldId: string, era: string, isPeriod?: boolean, periodType?: TimelinePeriodType, year: number, month?: number, day?: number, hour?: number, endYear?: number, endMonth?: number, endDay?: number, endHour?: number, category?: TimelineCategory, importance: 'mythic' | 'major' | 'minor', title: string, description: string, entityIds: string[], color?: string }`.
- **Default Presets & Utilities:** Located in `src/renderer/utils/calendarDefaults.ts`:
  - Presets: `DEFAULT_FANTASY_CALENDAR_CONFIG` (12 months x 30 days = 360 days, 7-day week, 400-1200 AC), `GREGORIAN_CALENDAR_CONFIG` (1500-2050 CE), `SCIFI_SOL_CALENDAR_CONFIG` (6 periods x 36 days = 216 days, 28-hr day).
  - Date formatting: `formatTimelineDate`, `formatPeriodDuration`, `isEventInYearMonth`.
  - Day-of-week calculation in `TimelineCalendarView.tsx:76-84`:
    ```ts
    const firstDayOfWeekOffset = useMemo(() => {
      const weekLen = daysOfWeek.length
      let totalDaysPrior = activeYear * (calendarConfig.months.reduce((acc, m) => acc + m.days, 0) || 360)
      for (let i = 0; i < activeMonthIndex - 1; i++) {
        totalDaysPrior += calendarConfig.months[i]?.days || 30
      }
      return Math.abs(totalDaysPrior) % weekLen
    }, [activeYear, activeMonthIndex, daysOfWeek.length, calendarConfig.months])
    ```
    *Flaw Observed:* This calculation multiplies `activeYear` by a fixed year length, does not support leap years, has no epoch offset, flips negative years incorrectly with `Math.abs`, and starts year 1 at `1 * yearDays` instead of `0`.
  - Coordinate Mapping in `TimelineLineView.tsx:83-89`:
    `yearToX = (yr - minYear) * pxPerYear + 300`. It only uses integer year, ignoring month/day/hour.
  - Zero Celestial / Moon support exists currently in the codebase.

### 1.2 Existing Export/Import & Battlemap Architecture
- **Export Utilities:** Located in `src/renderer/utils/exportUtils.ts`:
  - `exportMapToJson` (lines 302-322): Exports map JSON with scale, gridConfig, regions, pins.
  - `exportRelationsToJson` (lines 324-344): Exports entity relations web.
  - `exportConnectionsToJson` & `exportConnectionsToCsv` (lines 346-410): Exports graph connectivity.
  - `exportCanvasToJson` (lines 412-428): Exports whiteboard canvas.
  - `exportTimelineToJson` & `exportTimelineToCsv` (lines 430-473): Exports timeline events and calendar config.
  - Zero Obsidian export/import or Foundry VTT export/import exists currently.
- **World Serialization:** Located in `src/renderer/store/useWorldStore.ts`:
  - `exportWorld` (lines 2179-2221): Bundles world, entities, maps, relations, timelines, manuscripts, folders, directoryItems, canvases, categories, calendar into `.oros.json`.
  - `importWorld` (lines 2223-2280): Reads and deserializes single world bundle or full vault.
- **TTRPG Battlemaps:** Located in `src/shared/types.ts`:
  - `TTRPGBattlemap` (lines 412-428): `{ id, campaignId, name, imageUrl, description?, gridType: 'square' | 'hex', gridSize: number, gridOpacity: number, gridUnitFeet: number, showCoordinates: boolean, snapToGrid: boolean, tokens: TTRPGToken[], effects?: TTRPGBattlemapEffect[], createdAt, updatedAt }`.
  - `TTRPGToken` (lines 359-376): `{ id, campaignId, battlemapId, name, avatarUrl?, x: number (0-100), y: number (0-100), size: number (1, 2, 3), color?, hpCurrent?, hpMax?, armorClass?, speed?, characterId?, conditions?, isEnemy? }`.
  - Note: There are currently no fields for walls, doors, or lights in `TTRPGBattlemap`.

---

## 2. Logic Chain & Authoritative Specifications

### 2.1 Specification for R4: Fantasy Calendar & Celestial Engine

#### 2.1.1 Core Mathematical Model for Fantasy Calendars

1. **Epoch & Absolute Day Count ($D$):**
   To reliably convert between calendar dates $(Y, M, D, H)$ and continuous timeline coordinates, all time is calculated relative to an **Anchor Epoch** $(Y=0 \text{ or } 1, M=1, D=1, H=0)$ as a scalar absolute solar day count $D \in \mathbb{R}$.

   Let:
   - $Y$: Year (integer $\in \mathbb{Z}$)
   - $M$: Month index ($1 \le M \le N_M$, 1-based)
   - $D_m$: Day of month ($1 \le D_m \le \text{daysInMonth}(Y, M)$, 1-based)
   - $H$: Hour of day ($0 \le H < H_{day}$, default $H_{day} = 24$)

2. **Leap Year Evaluation Function:**
   A general fantasy leap rule is parameterized by:
   - `interval`: Leap occurs every $I$ years.
   - `offset`: Starting phase $S$ (e.g. year $Y$ leaps if $(Y - S) \pmod I == 0$).
   - `extraDays`: Number of leap days added (default 1).
   - `targetMonthId` or `targetMonthIndex`: Which month receives the extra days.
   - `excludeInterval`: Exception rule (e.g., skip every $K$ years).
   - `reinstateInterval`: Exception override (e.g., reinstate every $J$ years).

   **Mathematical Predicate:**
   $$\text{isLeapYear}(Y) = \bigvee_{r \in \text{rules}} \left( ((Y - r.S) \pmod{r.I} == 0) \land (r.K == 0 \lor (Y - r.S) \pmod{r.K} \ne 0 \lor (r.J > 0 \land (Y - r.S) \pmod{r.J} == 0)) \right)$$

3. **Days in Year Function:**
   $$\text{daysInYear}(Y) = \sum_{m=1}^{N_M} \text{baseDays}(m) + \sum_{r \in \text{rules}, \text{applies}(r, Y)} r.\text{extraDays} + \sum_{f \in \text{intercalaryDays}, \text{applies}(f, Y)} 1$$

4. **Year to Absolute Day Count ($D_{year}(Y)$):**
   For positive years ($Y \ge Y_{epoch}$):
   $$D_{year}(Y) = \sum_{y = Y_{epoch}}^{Y - 1} \text{daysInYear}(y)$$
   For negative years ($Y < Y_{epoch}$):
   $$D_{year}(Y) = -\sum_{y = Y}^{Y_{epoch} - 1} \text{daysInYear}(y)$$

5. **Day of Year ($DOY(Y, M, D_m)$):**
   $$DOY(Y, M, D_m) = \sum_{i=1}^{M-1} \text{daysInMonth}(Y, i) + (D_m - 1)$$

6. **Total Absolute Day ($D_{total}$):**
   $$D_{total}(Y, M, D_m, H) = D_{year}(Y) + DOY(Y, M, D_m) + \frac{H}{H_{day}}$$

7. **Day of Week Calculation:**
   Given a week with $N_W$ days (e.g. 7) and an epoch weekday offset $W_0 \in [0, N_W - 1]$:
   - If intercalary days advance the weekday:
     $$W(D_{total}) = \left( \left( \lfloor D_{total} \rfloor + W_0 \right) \bmod N_W + N_W \right) \bmod N_W$$
   - If intercalary days are outside the weekday cycle (festival days):
     $$W(Y, M, D_m) = \left( \left( \text{regularDaysCount}(Y, M, D_m) + W_0 \right) \bmod N_W + N_W \right) \bmod N_W$$

#### 2.1.2 Celestial Engine (Multiple Moon Orbits & Lunar Phases)

Each moon $k$ in the celestial system is defined by:
- $P_{k}$: Synodic period in solar days (time from New Moon to New Moon, e.g. $28.0$, $29.53059$, $14.25$).
- $\phi_{0, k}$: Phase offset at epoch $D=0$ ($\phi_{0, k} \in [0, 1)$, where $0.0 = \text{New Moon}$, $0.5 = \text{Full Moon}$).
- $C_k$: Color / tint (e.g. `#e2e8f0` Silver, `#ef4444` Blood Moon, `#38bdf8` Azure Moon).

**Moon Phase Angle & Illumination Equations:**
1. **Normalized Phase Fraction ($f_k(D)$):**
   $$f_k(D) = \left( \left( \phi_{0, k} + \frac{D}{P_k} \right) \bmod 1.0 + 1.0 \right) \bmod 1.0$$
2. **Phase Angle ($\theta_k(D) \in [0, 2\pi)$):**
   $$\theta_k(D) = 2\pi \cdot f_k(D)$$
3. **Geometric Illumination Percentage ($I_k(D) \in [0, 100\%]$):**
   $$I_k(D) = \frac{1 - \cos(\theta_k(D))}{2} \times 100\%$$
4. **8-Phase Canonical Categorization:**
   - **New Moon:** $f_k \in [0.97, 1.0) \cup [0.0, 0.03)$
   - **Waxing Crescent:** $f_k \in [0.03, 0.22)$
   - **First Quarter:** $f_k \in [0.22, 0.28)$ (Illumination $\approx 50\%$)
   - **Waxing Gibbous:** $f_k \in [0.28, 0.47)$
   - **Full Moon:** $f_k \in [0.47, 0.53)$ (Illumination $\approx 100\%$)
   - **Waning Gibbous:** $f_k \in [0.53, 0.72)$
   - **Last Quarter:** $f_k \in [0.72, 0.78)$ (Illumination $\approx 50\%$)
   - **Waning Crescent:** $f_k \in [0.78, 0.97)$

5. **Multi-Moon Conjunction / Syzygy Synchronization:**
   When a world has $K \ge 2$ moons, celestial events occur when phases synchronize:
   - **Grand Full Conjunction (Double/Triple Full Moon):**
     $$\forall i, j \in \{1 \dots K\}: \quad |f_i(D) - 0.5| < 0.03 \land |f_j(D) - 0.5| < 0.03$$
   - **Celestial Eclipse / Solar Dark Conjunction:**
     $$\forall i, j \in \{1 \dots K\}: \quad f_i(D) < 0.03 \lor f_i(D) > 0.97$$
   - **Beat Period between any two moons ($i, j$):**
     $$P_{\text{beat}, ij} = \frac{1}{\left| \frac{1}{P_i} - \frac{1}{P_j} \right|}$$

#### 2.1.3 Chronological Integration with Timeline View
In `TimelineLineView.tsx`, the horizontal pixel position of any event or milestone must use the fractional year coordinate:
$$T(Y, M, D_m, H) = Y + \frac{DOY(Y, M, D_m) + \frac{H}{H_{day}}}{\text{daysInYear}(Y)}$$
$$\text{pixelX}(T) = (T - Y_{min}) \cdot \text{pxPerYear} + 300$$
This eliminates event clumping at identical integer years and enables seamless micro-zooming from multi-century macro views down to individual months and days.

#### 2.1.4 Data Model Extensions for R4 in `src/shared/types.ts`

```typescript
export interface CalendarLeapRule {
  id: string;
  name: string;
  interval: number;          // e.g. every 4 years
  offsetYear: number;        // e.g. 0
  extraDays: number;         // e.g. 1 day
  targetMonthId: string;     // Month that receives the leap day(s)
  excludeInterval?: number;  // e.g. skip every 100 years
  reinstateInterval?: number;// e.g. reinstate every 400 years
}

export interface IntercalaryDay {
  id: string;
  name: string;              // e.g. "Midsummer", "Shieldmeet", "Overlithe"
  occursAfterMonthId: string;// Placed directly after this month
  isLeapOnly?: boolean;      // Only occurs on leap years (e.g. Shieldmeet)
  leapRuleId?: string;
  advancesWeekday: boolean;  // If false, treated outside standard weekly cycle
  description?: string;
}

export interface CelestialMoonConfig {
  id: string;
  name: string;              // e.g. "Selûne", "Tear of Selûne", "Crimson Eye"
  synodicPeriodDays: number; // Duration of lunar phase cycle in solar days (e.g. 29.53)
  orbitalPeriodDays?: number;// Sidereal period (optional for constellation transit)
  epochPhase: number;        // Phase fraction at Day 0 [0.0 - 1.0], 0.0 = New, 0.5 = Full
  color: string;             // Display tint (e.g. "#e2e8f0", "#ef4444")
  radiusPixels?: number;     // Render size in UI widgets
  description?: string;
}

export interface CelestialPhaseResult {
  moonId: string;
  moonName: string;
  color: string;
  phaseFraction: number;     // 0.0 to 1.0
  phaseAngleRad: number;     // 0 to 2pi
  illuminationPercent: number; // 0% to 100%
  phaseName: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  isMajorPhase: boolean;     // True for New, First Quarter, Full, Last Quarter
}

// Extension to WorldCalendarConfig:
export interface WorldCalendarConfigExtended extends WorldCalendarConfig {
  hasYearZero?: boolean;     // Default false for historical, true for astronomical
  weekdayEpochOffset?: number; // Day of week on Year 0/1 Day 1
  leapRules?: CalendarLeapRule[];
  intercalaryDays?: IntercalaryDay[];
  moons?: CelestialMoonConfig[];
}
```

---

### 2.2 Specification for R5: Obsidian & Foundry VTT Ecosystem Bridges

#### 2.2.1 Obsidian Markdown Vault Adapter

1. **Vault Directory Mapping:**
   - Root folder corresponds to the World name: `Vault_{WorldName}/`.
   - Folders mirror Oros `DirectoryFolder` nested hierarchy:
     - `DirectoryFolder` with `parentId: null` becomes top-level folder `/FolderName/`.
     - Nested `DirectoryFolder` with `parentId` becomes nested folder `/Parent/Child/`.
   - If an entity is not explicitly placed in a `DirectoryFolder`, it is categorized by its `type`:
     `/Characters/`, `/Locations/`, `/Factions/`, `/Items/`, `/Events/`, `/Lore/`.
   - Vault Assets folder: `assets/` contains all avatars, banners, and map attachments.

2. **YAML Frontmatter Schema:**
   Every entity `.md` file begins with a YAML block enclosed in `---`:
   ```yaml
   ---
   id: "char-vaelen"
   title: "Vaelen the Northguard"
   type: "character"
   tags:
     - "soldier"
     - "ostergard"
     - "hearth-guard"
   aliases:
     - "The Boreal Warden"
     - "Vaelen of Horn-Keep"
   summary: "A battle-hardened veteran of the Bitter Coast skirmishes."
   avatar: "assets/char-vaelen.png"
   banner: "assets/banner-ostergard.png"
   isSecret: false
   createdAt: "2026-10-18T10:00:00.000Z"
   updatedAt: "2026-10-24T18:00:00.000Z"
   infobox:
     subtitle: "Hearth-Guard of Ostergard"
     imageCaption: "Vaelen in standard boreal plate"
     sections:
       - title: "Biographical Data"
         fields:
           - id: "field-1"
             label: "Faction"
             value: "[[Ostergard Hearth-Guard]]"
             type: "entity-link"
             targetEntityId: "faction-ostergard"
           - id: "field-2"
             label: "Age"
             value: "34"
             type: "number"
   ---
   ```

3. **Content Translation (`TipTap/HTML` $\leftrightarrow$ `Markdown`):**
   - **HTML to Markdown:**
     - `<h1..3>` $\to$ `#`, `##`, `###`
     - `<p>` $\to$ paragraph blocks with blank line separation
     - `<strong>`, `<em>`, `<s>` $\to$ `**bold**`, `*italic*`, `~~strike~~`
     - `<ul>`, `<ol>`, `<li>` $\to$ `- `, `1. `
     - `<blockquote>` $\to$ `> `
     - `<code>`, `<pre>` $\to$ `` `code` ``, ```` ```codeblock ``` ````
     - Tables: HTML `<table>` $\to$ GFM markdown tables
     - Mentions: `<span data-type="mention" data-id="xyz" data-label="Title">@Title</span>` $\to$ `[[Title]]` (or `[[Title|Custom Label]]`)
     - Spoilers: `<span class="spoiler">secret</span>` $\to$ `%%secret%%` or `||secret||`
   - **Markdown to HTML (Importer):**
     - Parses frontmatter via YAML parser.
     - Parses Markdown body into TipTap-compatible HTML.
     - Resolves `[[Title]]` and `[[Title|Alias]]`: looks up matching entity by `title` or `aliases` in the world; injects `<span data-type="mention" data-id="<found-id>" data-label="<label>">@<label></span>`. If entity does not exist yet, creates a placeholder stub or maintains unresolved link.

4. **Bidirectional Roundtrip Losslessness Proof:**
   $$\text{World}_1 \xrightarrow{\text{Export}} \text{Vault}_{\text{Obsidian}} \xrightarrow{\text{Import}} \text{World}_2 \implies \text{World}_1 \equiv \text{World}_2$$
   - All standard fields (`id`, `title`, `type`, `summary`, `tags`, `aliases`, `isSecret`, `dates`) are preserved identically in YAML frontmatter.
   - The structured infobox schema (sections, field labels, types, target IDs) is serialized into the YAML `infobox` dictionary and reconstituted identically.
   - Unrecognized frontmatter tags from other Obsidian plugins (e.g. `cssclasses`, `publish`) are stored in `entity.infobox.customProperties` to avoid stripping third-party data on re-export.

---

#### 2.2.2 Foundry VTT Battlemap Scene Adapter

1. **Foundry VTT Scene Document Schema (Foundry v10-v12):**
   Foundry exports and imports scenes as JSON documents matching the `SceneData` schema:
   ```json
   {
     "_id": "sceneOros00000001",
     "name": "The Sunken Quay & Salt-Cairn Tavern",
     "active": false,
     "navigation": true,
     "img": "worlds/myworld/scenes/salt-quay.webp",
     "width": 1920,
     "height": 1080,
     "padding": 0.25,
     "initial": { "x": 960, "y": 540, "scale": 1.0 },
     "backgroundColor": "#0e141c",
     "grid": {
       "type": 1,
       "size": 64,
       "distance": 5,
       "units": "ft",
       "color": "#000000",
       "alpha": 0.35
     },
     "shiftX": 0,
     "shiftY": 0,
     "walls": [
       {
         "_id": "wall000000000001",
         "c": [450, 320, 850, 320],
         "move": 20,
         "sense": 20,
         "sound": 20,
         "dir": 0,
         "door": 0,
         "ds": 0
       },
       {
         "_id": "door000000000001",
         "c": [850, 320, 950, 320],
         "move": 20,
         "sense": 20,
         "sound": 20,
         "dir": 0,
         "door": 1,
         "ds": 0
       }
     ],
     "tokens": [
       {
         "_id": "token00000000001",
         "name": "Vaelen the Northguard",
         "actorId": null,
         "actorLink": false,
         "x": 537.6,
         "y": 475.2,
         "width": 1,
         "height": 1,
         "scale": 1.0,
         "rotation": 0,
         "elevation": 0,
         "disposition": 1,
         "texture": {
           "src": "assets/char-vaelen.png",
           "scaleX": 1,
           "scaleY": 1
         },
         "bar1": { "attribute": "attributes.hp", "value": 44, "max": 44 },
         "hidden": false
       }
     ],
     "lights": [],
     "drawings": [],
     "notes": []
   }
   ```

2. **Coordinate Transformation Mathematics:**
   Let:
   - $W_{img}, H_{img}$: Battlemap image pixel dimensions (e.g. $1920 \times 1080$).
   - $P$: Foundry scene padding factor (default $0.25$, meaning canvas total dimensions are $W_{canvas} = W_{img} \cdot (1 + 2P)$, $H_{canvas} = H_{img} \cdot (1 + 2P)$).
   - $x_{\%}, y_{\%}$: Oros token/wall position in percentage ($0.0 \dots 100.0\%$).
   - $G$: Grid size in pixels (e.g. 64px).

   **Oros Percentage to Foundry Scene Pixel Coordinates:**
   $$X_{\text{scene}} = P \cdot W_{img} + \frac{x_{\%}}{100} \cdot W_{img}$$
   $$Y_{\text{scene}} = P \cdot H_{img} + \frac{y_{\%}}{100} \cdot H_{img}$$

   **Token Bounding Box Offset (Center vs Top-Left):**
   In Oros, a token of grid size $S$ (where $S=1$ for $1\times 1$, $S=2$ for $2\times 2$) is positioned at its center coordinate. In Foundry, token $(x, y)$ represents the top-left corner of the grid cell:
   $$X_{\text{token, foundry}} = X_{\text{scene}} - \frac{S \cdot G}{2}$$
   $$Y_{\text{token, foundry}} = Y_{\text{scene}} - \frac{S \cdot G}{2}$$

   **Foundry Scene Pixel Coordinates to Oros Percentage:**
   $$x_{\%} = \frac{(X_{\text{token, foundry}} + \frac{S \cdot G}{2}) - P \cdot W_{img}}{W_{img}} \times 100\%$$
   $$y_{\%} = \frac{(Y_{\text{token, foundry}} + \frac{S \cdot G}{2}) - P \cdot H_{img}}{H_{img}} \times 100\%$$

3. **Wall and Door Mapping:**
   - Oros Battlemap Schema Extension:
     ```typescript
     export interface TTRPGWall {
       id: string;
       battlemapId: string;
       p1: { x: number; y: number }; // percentage 0-100
       p2: { x: number; y: number }; // percentage 0-100
       wallType: 'wall' | 'window' | 'terrain' | 'ethereal';
       blocksMovement: boolean;
       blocksVision: boolean;
       blocksSound?: boolean;
       isDoor?: boolean;
       doorType?: 'regular' | 'secret';
       doorState?: 'closed' | 'open' | 'locked';
     }
     ```
   - **Foundry Wall Type Translation:**
     - Standard Wall: `move = 20`, `sense = 20`, `door = 0`
     - Window / Ethereal: `move = 20`, `sense = 0` (blocks movement, allows sight)
     - Terrain Wall: `sense = 10` (limited vision wall)
     - Normal Door: `door = 1`, `ds = 0 (closed) | 1 (open) | 2 (locked)`
     - Secret Door: `door = 2`, `ds = 0 | 1 | 2`

4. **Token Metadata Mapping:**
   - **Disposition:**
     - Player Character (`isEnemy: false`): Foundry `disposition = 1` (Friendly)
     - Hostile NPC (`isEnemy: true`): Foundry `disposition = -1` (Hostile)
     - Neutral NPC: Foundry `disposition = 0` (Neutral)
   - **Vitals:**
     - HP current & max $\leftrightarrow$ `bar1.value`, `bar1.max`
     - Armor Class & Speed $\leftrightarrow$ stored in token system flags or actor link.

---

## 3. Caveats & Constraints

1. **No Existing Wall/Door Storage:** Currently, `TTRPGBattlemap` in `src/shared/types.ts` does not contain a `walls?: TTRPGWall[]` array. Implementing the Foundry VTT bridge requires extending `TTRPGBattlemap` and `StorageData` to persist wall segments.
2. **ExecutionPolicy in Windows PowerShell:** Standard `pnpm` command invokes `pnpm.ps1`, which fails under Windows execution policy restrictions unless called via `pnpm.cmd`. All terminal executions must use `pnpm.cmd`.
3. **Markdown Parser Dependencies:** The current project dependencies include `@tiptap/react`, `@tiptap/starter-kit`, etc., but do not include a dedicated markdown-to-html compiler like `marked` or a YAML frontmatter parser like `js-yaml`. Implementing the Obsidian bridge will either require lightweight built-in YAML/Markdown serializers or adding `js-yaml` / `marked`.
4. **Foundry VTT Version Differences:** Foundry VTT shifted schema structures between v9 and v10+ (e.g. `texture.src` instead of `img`, nested `grid` object). The specification targets the canonical modern standard (v10 / v11 / v12) while providing graceful fallback for v9 field names.

---

## 4. Conclusion & Architectural Directives

1. **For R4 (Fantasy Calendar & Celestial Engine):**
   - Create a centralized math module `src/renderer/utils/calendarMath.ts` implementing the complete epoch day counting, floor-modulo weekday calculations, leap year rule evaluator, and multi-moon orbit phase functions.
   - Extend `WorldCalendarConfig` in `src/shared/types.ts` to include `leapRules`, `intercalaryDays`, and `moons`.
   - Update `TimelineCalendarSettingsModal.tsx` with dedicated tabs for "Leap Rules" and "Celestial Bodies (Moons)".
   - Update `TimelineCalendarView.tsx` to render multi-moon phase glyphs and badges on day cells.
   - Update `TimelineLineView.tsx` to use continuous fractional year coordinates $T = Y + \frac{DOY}{daysInYear(Y)}$.

2. **For R5 (Obsidian & Foundry VTT Ecosystem Bridges):**
   - Create `src/renderer/utils/obsidianBridge.ts`:
     - `exportWorldToObsidianVault(world, entities, folders, directoryItems)`: creates a zip archive or folder of `.md` files with formatted YAML frontmatter and `[[wiki-links]]`.
     - `importObsidianVaultToWorld(files)`: parses frontmatter and markdown body, reconstructs entity directory hierarchy, and resolves `[[wiki-links]]` to entity references.
   - Create `src/renderer/utils/foundryBridge.ts`:
     - `exportBattlemapToFoundryScene(battlemap, campaignName)`: generates Foundry v10-v12 JSON scene format with grid, walls, doors, tokens, and coordinates.
     - `importFoundrySceneToBattlemap(sceneJson, campaignId)`: translates Foundry scene back into `TTRPGBattlemap`.
   - Add "Export to Obsidian Vault (.zip)" and "Export to Foundry VTT (.json)" actions in `ExportDropdown.tsx` and map viewer toolbar.

---

## 5. Verification Method

### 5.1 Independent Verification Commands
1. **Type Safety & Build Verification:**
   ```powershell
   pnpm.cmd exec tsc --noEmit
   pnpm.cmd run build
   ```
   Both commands must exit with code 0.

2. **Unit Test Verification Suite (to be implemented):**
   - Calendar Date Math Unit Tests:
     - Gregorian leap year check (1900 is non-leap, 2000 is leap, 2024 is leap).
     - Negative year day-of-week continuity across Year 0 / 1 BCE.
     - Month day clamping on boundary transitions.
     - Multi-moon synodic cycle: verify Moon phase at $D = P_{syn} / 2$ yields Full Moon ($100\%$ illumination), and $D = P_{syn}$ yields New Moon ($0\%$).
   - Obsidian Serialization Unit Tests:
     - Roundtrip frontmatter test: export `LoreEntity` with all fields and infobox $\to$ string $\to$ import $\to$ assert deep equality.
     - Wiki-link parser test: verify `[[Archmage Corvus]]` and `[[Archmage Corvus|The Raven]]` resolve correctly.
   - Foundry VTT Coordinate Conversion Tests:
     - Verify $(50\%, 50\%)$ maps to center of Foundry scene canvas with padding.
     - Verify inverse conversion maps Foundry pixel coordinates back to original percentage within $\pm 0.01\%$.
