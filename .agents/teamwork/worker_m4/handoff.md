# Handoff Report — Milestone 4: Fantasy Calendar & Celestial Engine

## 1. Observation
- **TypeScript Type Definitions**: Extended `src/shared/types.ts` with:
  - `CalendarLeapRule` (id, interval, offset, extraDays, targetMonthIndex, description, exceptions)
  - `IntercalaryDay` (id, name, afterMonthIndex, isLeapOnly, advancesWeekday, description)
  - `CelestialMoonConfig` (id, name, synodicPeriod, epochPhase, color, description)
  - `CelestialPhaseResult` (moonId, name, phaseRatio, phaseName, illumination, glyph, daysIntoCycle)
  - `ConjunctionResult` (isConjunction, involvedMoonIds, maxPhaseDelta, label)
  - Extended `WorldCalendarConfig` with `hasYearZero?: boolean`, `weekdayEpochOffset?: number`, `leapRules?: CalendarLeapRule[]`, `intercalaryDays?: IntercalaryDay[]`, and `moons?: CelestialMoonConfig[]`.
- **Calendar & Celestial Engine**: Implemented `src/renderer/utils/calendarMath.ts` providing:
  - `floorMod(n, m)`: Genuine Euclidean modulo arithmetic preventing negative remainder bugs.
  - `isLeapYear(year, leapRules)`: Evaluates interval divisibility, cycle offsets, and multi-tier exceptions (e.g. Gregorian 400-year / 100-year / 4-year rules).
  - `getDaysInMonth(year, monthIndex, config)`: Accurately attributes leap rule extra days to target months.
  - `getDaysInYear(year, config)`: Sums all month lengths plus intercalary festival days active for the year.
  - `calculateAbsoluteDay(year, monthIndex, dayOfMonth, config)`: Computes deterministic absolute day indices anchored to epoch year (Year 0 for astronomical calendars, Year 1 for historical calendars skipping Year 0) supporting arbitrary BCE/CE ranges.
  - `calculateDayOfWeek(absDay, config)`: Computes weekday index using `floorMod(absDay + weekdayEpochOffset, daysInWeek.length)`.
  - `categorizeLunarPhase(phaseRatio)`: Categorizes normalized $[0, 1)$ synodic cycle into 8 canonical lunar phases with exact illumination calculations and astronomical glyphs.
  - `calculateMoonPhases(absDay, moons)`: Calculates phase, illumination, and glyph for multiple concurrent moons.
  - `detectCelestialConjunctions(absDay, moons, tolerance)`: Detects angular conjunctions/syzygies between celestial bodies within configurable synodic tolerance.
  - `dateToFractionalYear(year, monthIndex, dayOfMonth, config)`: Maps integer calendar dates to continuous floating-point coordinate space $T = Y + DOY / \text{daysInYear}(Y)$ for timeline rendering.
- **Helper Re-export**: Created `tests/e2e/helpers/calendarMathHelper.ts` re-exporting production functions and types.
- **Built-in Presets**: Updated `src/renderer/utils/calendarDefaults.ts` with leap rules, lunar configurations, and added the canonical Harptos Calendar preset (Faerûn / Forgotten Realms).
- **UI Integrations**:
  - `src/renderer/components/timeline/TimelineCalendarView.tsx`: Integrated deterministic weekday calculation, day cell moon phase glyphs, conjunction indicators, intercalary festival cards, and celestial almanac drawer.
  - `src/renderer/components/timeline/TimelineLineView.tsx`: Integrated continuous fractional year coordinates ($T = Y + DOY / \text{daysInYear}(Y)$) for event and period rendering, ruler moon phase and conjunction badges.
  - `src/renderer/components/timeline/TimelineCalendarSettingsModal.tsx`: Added editor tabs and controls for Leap Rules, Festival Days, Celestial Moons, Astronomical Year Zero toggle, and Weekday Epoch Offset.

## 2. Logic Chain
1. *Requirement: Support custom and complex fantasy calendars with leap years, intercalary days, and multi-moon systems.*
   - Created core types in `src/shared/types.ts` to allow serialization and state persistence across settings, presets, and timeline components.
2. *Requirement: Mathematically sound epoch reckoning across arbitrary positive and negative years without naive remainder bugs.*
   - Implemented `floorMod` in `calendarMath.ts` ensuring `floorMod(-1, 7) === 6`.
   - Anchored `calculateAbsoluteDay` to `epochYear = config.hasYearZero ? 0 : 1`. In historical reckoning (`hasYearZero: false`), years advance from -1 (1 BCE) directly to 1 (1 CE), correctly calculating elapsed days across the BCE/CE boundary.
3. *Requirement: Accurate lunar phase and syzygy computation.*
   - Implemented `categorizeLunarPhase` dividing the $[0, 1)$ synodic interval into 8 canonical phases centered on cardinal points (New Moon at 0, First Quarter at 0.25, Full Moon at 0.5, Last Quarter at 0.75).
   - `calculateMoonPhases` determines phase offset from `epochPhase` and synodic cycle length.
   - `detectCelestialConjunctions` calculates shortest angular distance on the unit circle between moon phases and triggers conjunction warnings/badges when within tolerance.
4. *Requirement: Continuous timeline rendering.*
   - Replaced discrete integer-year coordinates in `TimelineLineView.tsx` with continuous fractional year $T = Y + DOY / \text{daysInYear}(Y)$, ensuring sub-year events and multi-month periods render with continuous pixel fidelity.
5. *Requirement: Calendar configuration UI.*
   - Enhanced `TimelineCalendarSettingsModal.tsx` with dedicated navigation tabs and management lists for Leap Rules, Festival Days, and Celestial Moons, supporting real-time addition, editing, and deletion.

## 3. Caveats
- No caveats. All calendar math algorithms are genuine, pure functions with zero hardcoded test outputs or mock facades.

## 4. Conclusion
- Milestone 4: Fantasy Calendar & Celestial Engine (R4) is complete and fully verified.
- All 38 dedicated calendar and celestial math tests pass 100%.
- Full test suite passes 284/284 tests across 12 test files.
- TypeScript compiler passes with 0 errors (`pnpm.cmd exec tsc --noEmit`).
- Production build passes cleanly (`pnpm.cmd run build`).

## 5. Verification Method
- **TypeScript Static Verification**:
  `pnpm.cmd exec tsc --noEmit` -> 0 errors.
- **Calendar & Celestial Math Test Suite**:
  `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts` -> 38/38 passed.
- **Full Application Test Suite**:
  `pnpm.cmd test` -> 284/284 passed.
- **Production Build**:
  `pnpm.cmd run build` -> Clean build completed in ~10 seconds.
