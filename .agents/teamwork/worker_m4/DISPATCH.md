## 2026-10-24T21:25:29Z
You are Worker M4 (`worker_m4`). Your working directory is `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m4`.
Parent orchestrator conversation ID: `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`.

MANDATORY FIRST STEP: Read the authoritative user request at:
`c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md`
Also read:
`c:\Users\azisk\Documents\codes\orosapp\PROJECT.md`
`c:\Users\azisk\Documents\codes\orosapp\tests\e2e\calendar_math.test.ts`
`c:\Users\azisk\Documents\codes\orosapp\tests\e2e\helpers\calendarMathHelper.ts`
`c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3\handoff.md`
`c:\Users\azisk\Documents\codes\orosapp\src\shared\types.ts`
`c:\Users\azisk\Documents\codes\orosapp\src\renderer\utils\calendarDefaults.ts`
`c:\Users\azisk\Documents\codes\orosapp\src\renderer\components\timeline\TimelineCalendarView.tsx`
`c:\Users\azisk\Documents\codes\orosapp\src\renderer\components\timeline\TimelineLineView.tsx`
`c:\Users\azisk\Documents\codes\orosapp\src\renderer\components\timeline\TimelineCalendarSettingsModal.tsx`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Mission for Milestone 4: Fantasy Calendar & Celestial Engine (R4):
1. **Data Model Extensions (`src/shared/types.ts`)**:
   - Add interfaces:
     - `CalendarLeapRule` (interval, offsetYear, extraDays, targetMonthId, excludeInterval, reinstateInterval)
     - `IntercalaryDay` (id, name, occursAfterMonthId, isLeapOnly, leapRuleId, advancesWeekday, description)
     - `CelestialMoonConfig` (id, name, synodicPeriodDays, epochPhase, color, radiusPixels, description)
     - `CelestialPhaseResult` (moonId, moonName, color, phaseFraction, phaseAngleRad, illuminationPercent, phaseName, isMajorPhase)
     - `ConjunctionResult` (type, alignedMoonIds, severity, description)
     - Extend `WorldCalendarConfig` with optional `hasYearZero?: boolean; weekdayEpochOffset?: number; leapRules?: CalendarLeapRule[]; intercalaryDays?: IntercalaryDay[]; moons?: CelestialMoonConfig[];`.

2. **Calendar Mathematics Engine (`src/renderer/utils/calendarMath.ts`)**:
   - Create `src/renderer/utils/calendarMath.ts` implementing:
     - `floorMod(n: number, m: number): number` (ensures positive modulo for negative numbers)
     - `isLeapYear(year: number, config: WorldCalendarConfigExtended): boolean` (multi-tier leap rules)
     - `getDaysInMonth(year: number, monthIndex: number, config: WorldCalendarConfigExtended): number`
     - `getDaysInYear(year: number, config: WorldCalendarConfigExtended): number`
     - `calculateAbsoluteDay(year: number, monthIndex: number, day: number, hour: number, config: WorldCalendarConfigExtended): number`
     - `calculateDayOfWeek(absDay: number, config: WorldCalendarConfigExtended): { index: number; name: string }`
     - `categorizeLunarPhase(phaseFraction: number): CelestialPhaseResult['phaseName']` (8 canonical phases)
     - `calculateMoonPhases(absDay: number, moons: CelestialMoonConfig[], hoursInDay?: number): CelestialPhaseResult[]`
     - `detectCelestialConjunctions(moonPhases: CelestialPhaseResult[], tolerance?: number): ConjunctionResult[]`
     - `dateToFractionalYear(year: number, monthIndex: number, day: number, hour: number, config: WorldCalendarConfigExtended): number`
   - Update `tests/e2e/helpers/calendarMathHelper.ts` to re-export from `src/renderer/utils/calendarMath.ts` so the test suite verifies the genuine production code.

3. **UI Integration**:
   - `src/renderer/components/timeline/TimelineCalendarView.tsx`:
     - Replace flawed weekday calculation with `calculateAbsoluteDay` and `calculateDayOfWeek`.
     - Render multi-moon phase glyphs / indicator badges on day cells using `calculateMoonPhases`.
     - Support intercalary festival days display where configured.
   - `src/renderer/components/timeline/TimelineLineView.tsx`:
     - Upgrade timeline positioning from integer year to continuous fractional year coordinates $T = Y + DOY/\text{daysInYear}(Y)$ using `dateToFractionalYear`.
     - Add celestial moon / conjunction overlay indicators along the timeline ruler.
   - `src/renderer/components/timeline/TimelineCalendarSettingsModal.tsx`:
     - Add editor tabs / sections for configuring Leap Rules, Intercalary Days, and Celestial Moons.

Verification Requirements:
- On Windows PowerShell, ALWAYS execute terminal commands using `pnpm.cmd`.
- Run: `pnpm.cmd exec tsc --noEmit` -> MUST pass with 0 errors.
- Run: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts` -> All 38 tests MUST pass.
- Run: `pnpm.cmd test` -> Full test suite (284+ tests) MUST pass without regressions.
- Run: `pnpm.cmd run build` -> Production build MUST succeed cleanly.

When complete, write your full report in `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m4\handoff.md` and send a message back to orchestrator.
