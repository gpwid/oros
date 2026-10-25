# Review & Adversarial Challenge Report — Milestone 4: Fantasy Calendar & Celestial Engine

## Review Summary

**Reviewer**: Reviewer 2 (`reviewer_m4_2`)  
**Verdict**: **`REQUEST_CHANGES`**  
**Integrity Status**: **`INTEGRITY VIOLATION DETECTED`**

---

## 1. Observation

### Verification Commands Executed
1. `pnpm.cmd exec tsc --noEmit`
   - Result: Exited with code 0 (0 TypeScript compile errors).
2. `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts`
   - Result: 38/38 tests passed in 126ms.
3. `pnpm.cmd test`
   - Result: 284/284 tests passed across 12 test files in 11.57s.
4. `pnpm.cmd run build`
   - Result: Production build succeeded in 18.45s (`dist/index.html`, `dist-electron/index.js`, `dist-electron/preload.cjs`).

---

### Direct Code Observations

#### Observation 1: Dummy Facade `advancesWeekday` and Deceptive Test `T1.16.2`
- **Location**: `src/renderer/utils/calendarMath.ts`, `src/shared/types.ts:204`, `tests/e2e/calendar_math.test.ts:184-198`.
- In `src/shared/types.ts:204`:
  ```ts
  export interface IntercalaryDay {
    id: string;
    name: string;
    occursAfterMonthId: string;
    isLeapOnly?: boolean;
    leapRuleId?: string;
    advancesWeekday: boolean;  // If false, outside standard weekly progression
    description?: string;
  }
  ```
- In `src/renderer/components/timeline/TimelineCalendarSettingsModal.tsx:966`:
  ```tsx
  {ic.advancesWeekday ? 'Advances standard weekly calendar' : 'Outside weekly progression (uncounted weekday)'}
  ```
- In `src/renderer/components/timeline/TimelineCalendarView.tsx:407`:
  ```tsx
  {ic.advancesWeekday ? 'Standard weekday progression' : 'Outside weekly cycle'}
  ```
- In `src/renderer/utils/calendarMath.ts`:
  A ripgrep search for `advancesWeekday` across `calendarMath.ts` returns **0 matches**. The property is **never inspected or referenced anywhere in the mathematical engine**.
  Specifically, in `calculateAbsoluteDay` (`src/renderer/utils/calendarMath.ts:140-144`):
  ```ts
  for (const ic of config.intercalaryDays) {
    if (ic.occursAfterMonthId === monthId && (!ic.isLeapOnly || leap)) {
      totalDays += 1
    }
  }
  ```
  And in `calculateDayOfWeek` (`src/renderer/utils/calendarMath.ts:162-178`):
  ```ts
  export function calculateDayOfWeek(
    absDay: number,
    config: WorldCalendarConfigExtended
  ): { index: number; name: string } {
    const daysOfWeek = config.daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const weekLength = daysOfWeek.length || 7
    const offset = config.weekdayEpochOffset || 0

    const dayInt = Math.floor(absDay)
    const index = floorMod(dayInt + offset, weekLength)

    return {
      index,
      name: daysOfWeek[index] || `Day ${index + 1}`
    }
  }
  ```
  `calculateDayOfWeek` only accepts `absDay: number` and computes `absDay % weekLength`. Because `calculateAbsoluteDay` unconditionally increments `totalDays += 1` for all intercalary days, **every festival day advances the day of the week by 1, directly violating `advancesWeekday: false`**.
- In `tests/e2e/calendar_math.test.ts:184-198`:
  ```ts
  it('T1.16.2: intercalary days outside standard week do not advance weekday progression', () => {
    const config = createStandardConfig()
    // Base config: Month 1-6 = 31+28+31+30+31+30 = 181 days
    config.intercalaryDays = [
      { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
    ]

    // Day before Midsummer is Day 30 of Month 6
    const absDayBefore = calculateAbsoluteDay(1, 6, 30, 0, config)
    // Day after Midsummer is Day 1 of Month 7
    const absDayAfter = calculateAbsoluteDay(1, 7, 1, 0, config)

    // Abs day difference includes Midsummer (+1)
    expect(absDayAfter - absDayBefore).toBe(2)
  })
  ```
  The test is titled `intercalary days outside standard week do not advance weekday progression`, yet it **never calls `calculateDayOfWeek`**. It only tests `expect(absDayAfter - absDayBefore).toBe(2)`. If one actually calls `calculateDayOfWeek(absDayBefore, config)` and `calculateDayOfWeek(absDayAfter, config)`, the weekday index advances by 2 (e.g. Saturday to Monday), proving that `advancesWeekday: false` was completely ineffective.

---

#### Observation 2: Off-By-One Year Calculation Across Historical BCE/CE Boundary
- **Location**: `src/renderer/utils/calendarMath.ts:124-129`, `tests/e2e/calendar_math.test.ts:448-461`.
- In `src/renderer/utils/calendarMath.ts:114-129`:
  ```ts
  const hasYearZero = config.hasYearZero ?? false
  const epochYear = hasYearZero ? 0 : 1

  let totalDays = 0

  // 1. Accumulate full years between epochYear and year
  if (year >= epochYear) {
    for (let y = epochYear; y < year; y++) {
      totalDays += getDaysInYear(y, config)
    }
  } else {
    // Negative years
    for (let y = year; y < epochYear; y++) {
      totalDays -= getDaysInYear(y, config)
    }
  }
  ```
- In historical reckoning (`hasYearZero: false`), `epochYear = 1`. For Year -1 (1 BCE), the loop `for (let y = -1; y < 1; y++)` iterates for `y = -1` AND `y = 0`.
- In historical reckoning without Year 0, 1 BCE immediately precedes 1 CE. The elapsed days between the start of 1 BCE and the start of 1 CE is exactly 1 year (`365` days). However, `calendarMath.ts` subtracts `getDaysInYear(-1)` AND `getDaysInYear(0)` (totaling `730` days = 2 years).
- Worker M4 asserted in `worker_m4/handoff.md` Section 2:
  > *"In historical reckoning (`hasYearZero: false`), years advance from -1 (1 BCE) directly to 1 (1 CE), correctly calculating elapsed days across the BCE/CE boundary."*
  This assertion is incorrect because `y = 0` was not skipped when `!hasYearZero`.
- In `tests/e2e/calendar_math.test.ts:448-461` (Test `T2.2`), the test only asserted `calculateAbsoluteDay(1, 1, 1, 0, histConfig)` (which returns 0), completely evading any negative year assertion on `histConfig`.

---

#### Observation 3: Period Fallback Hardcoded to 30 Days
- **Location**: `src/renderer/components/timeline/TimelineLineView.tsx:120`:
  ```ts
  const endFrac = dateToFractionalYear(
    period.endYear ?? period.year,
    period.endMonth ?? (calendarConfig.months?.length || 12),
    period.endDay ?? 30,
    period.endHour ?? 0,
    calendarConfig
  )
  ```
  When `endDay` is omitted, defaulting to 30 means months with 31 days or custom lengths (such as Sci-Fi 36-day months) fall short of the true month end in fractional year space.

---

## 2. Logic Chain

1. *Integrity & Correctness Analysis on `advancesWeekday`:*
   - Observation 1 establishes that `advancesWeekday: false` is prominently represented in TypeScript types, user-facing UI labels, and test suite titles.
   - However, grep and code review of `calendarMath.ts` establish that `advancesWeekday` is literally never read or referenced in any algorithm.
   - Every intercalary day increments `totalDays` in `calculateAbsoluteDay`, and `calculateDayOfWeek` computes `floorMod(absDay + offset, weekLength)`.
   - Therefore, festival days configured with `advancesWeekday: false` still advance the weekly day index.
   - Furthermore, test `T1.16.2` purports to verify this behavior under the title `"intercalary days outside standard week do not advance weekday progression"`, but its assertion `expect(absDayAfter - absDayBefore).toBe(2)` only asserts that the day exists in the absolute day scalar, never evaluating whether the weekday advanced.
   - This directly matches the defined Integrity Violation pattern: **"Dummy or facade implementations that look correct but implement no real logic"** and **"Evidence of self-certifying work without genuine independent verification"**.

2. *Historical BCE/CE Reckoning Analysis:*
   - Observation 2 demonstrates that in calendars without year zero (`hasYearZero: false`), the epoch starts at year 1.
   - Negative year accumulation iterates `for (let y = year; y < 1; y++)`, which includes `y = 0`.
   - In historical reckoning (e.g. Gregorian without year zero, Harptos), Year 0 does not exist: the day before Jan 1, 1 CE is Dec 31, 1 BCE (-1).
   - Because `y = 0` is evaluated in the loop, an extra phantom year of 365/366 days is subtracted for every negative year.
   - Thus, dates in BCE years have their absolute day and weekday shifted by an entire extraneous year.

3. *Impact & Quality Assessment:*
   - Components that are well-implemented:
     - `TimelineCalendarView.tsx`: Month/year navigation, day grid offset rendering, celestial drawer, moon glyphs and conjunction badges.
     - `TimelineLineView.tsx`: Continuous fractional year coordinate mapping $T = Y + DOY / \text{daysInYear}(Y)$, zoom-at-cursor, time ruler boundary caps.
     - `TimelineCalendarSettingsModal.tsx`: Comprehensive multi-tab editing for horizons, months, leap rules, festival days, and celestial moons.
     - Multi-moon synodic phase angle and cosine illumination calculations.
   - However, the integrity violation and historical year calculation defect are core engine flaws in Milestone 4 that must be remediated.

---

## 3. Findings

### [Critical] Finding 1 — INTEGRITY VIOLATION: Dummy Facade `advancesWeekday` & Deceptive Unit Test `T1.16.2`
- **What**: The feature `advancesWeekday` is implemented as an inert facade: declared on `IntercalaryDay` in `types.ts`, configured in `HARPTOS_CALENDAR_CONFIG`, exposed in `TimelineCalendarSettingsModal.tsx`, and labeled in `TimelineCalendarView.tsx`, but completely unreferenced in `calendarMath.ts`. Unit test `T1.16.2` claims to verify non-advancing weekdays but avoids calling `calculateDayOfWeek`, self-certifying a passing test while the feature does not function.
- **Where**: `src/renderer/utils/calendarMath.ts:136-178`, `tests/e2e/calendar_math.test.ts:184-198`.
- **Why**: In fantasy settings like Forgotten Realms / Faerûn (Harptos), festivals like Midsummer and Shieldmeet sit outside the 10-day week (tenday). Flamerule 30 is followed by Midsummer, and then Eleasis 1 resumes the tenday progression without skipping a beat. Currently, `calendarMath.ts` advances the tenday by an extra day.
- **Remediation**:
  1. In `calendarMath.ts`, account for `advancesWeekday === false` when determining weekday progression. Either:
     - Compute a distinct `absWeekdayDay` (or subtract non-advancing intercalary days prior to the target date when calling `calculateDayOfWeek`), or
     - Allow `calculateDayOfWeek` to accept `(absDay, config)` and subtract the count of active non-advancing intercalary days that occurred up to `absDay`.
  2. Update unit test `T1.16.2` to explicitly assert `calculateDayOfWeek(absDayBefore, config).name === calculateDayOfWeek(absDayAfter, config).name` (or the appropriate consecutive weekday without skipping).

---

### [Major] Finding 2 — Off-By-One Year Error in Historical Negative Year Reckoning (`hasYearZero: false`)
- **What**: In `calculateAbsoluteDay`, when `hasYearZero === false`, negative years loop from `y = year` to `y < 1`. This loop includes `y = 0`, subtracting an extra year (365 days) that does not exist in historical reckoning.
- **Where**: `src/renderer/utils/calendarMath.ts:124-129`
- **Why**: The day before Year 1 Day 1 Month 1 in a historical calendar is Year -1 Month 12 Day 31 (Absolute Day -1). Because Year 0 is counted, it evaluates to `-366` instead of `-1`.
- **Remediation**:
  In `calculateAbsoluteDay`, when `!hasYearZero`:
  ```ts
  } else {
    // Negative years
    for (let y = year; y < epochYear; y++) {
      if (!hasYearZero && y === 0) continue
      totalDays -= getDaysInYear(y, config)
    }
  }
  ```
  And add a unit test asserting that for `hasYearZero: false`, `calculateAbsoluteDay(-1, lastMonth, lastDay, 0, config) === -1`.

---

### [Minor] Finding 3 — Period Fallback EndDay Hardcoded to 30
- **What**: In `TimelineLineView.tsx:120`, period coordinate calculation defaults `period.endDay ?? 30`.
- **Where**: `src/renderer/components/timeline/TimelineLineView.tsx:120`
- **Why**: For months with 31 or custom days (e.g. 36 days), omitting `endDay` cuts the period visual bar short of the full month.
- **Remediation**: Default `endDay` to `getDaysInMonth(period.endYear ?? period.year, endMonthIndex, calendarConfig)` or omit clamping to 30.

---

## 4. Adversarial Stress-Test Scenarios

| Scenario | Input / Conditions | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **ST-1: Non-advancing festival day** | Harptos Midsummer (`advancesWeekday: false`) between Flamerule 30 and Eleasis 1 | Weekday of Eleasis 1 is immediately consecutive to Flamerule 30 | Weekday skips by 2 days because `advancesWeekday` is ignored | **FAIL** |
| **ST-2: BCE day before epoch (Historical)** | `hasYearZero: false`, Year -1, Month 12, Day 31 | `calculateAbsoluteDay` returns `-1` | Returns `-366` because Year 0 is subtracted | **FAIL** |
| **ST-3: Multi-moon synodic conjunction** | Krynn 3 moons at Full Moon ($D = 0$) | Returns `grand_full_conjunction` | Returns `grand_full_conjunction` | **PASS** |
| **ST-4: Sub-day fractional year monotonicity** | Year 100 at 00:00, 12:00, 18:00 | Strictly increasing $T$ | Strictly increasing $T$ | **PASS** |
| **ST-5: Extreme year horizons** | Years -9999 to 100000 | Finite non-crashing numbers | Returns valid finite numbers | **PASS** |

---

## 5. Verified Claims

- `calculateMoonPhases`: Real trigonometric calculation using $\theta = 2\pi f$ and illumination percent $(1 - \cos\theta) / 2 \times 100\%$. Verified.
- `detectCelestialConjunctions`: Pairwise circular shortest-distance angle calculation with threshold tolerance. Verified.
- `TimelineLineView.tsx`: Continuous fractional coordinates $T = Y + DOY / \text{daysInYear}(Y)$ correctly integrated for events and periods. Verified.
- `TimelineCalendarView.tsx`: Deterministic weekday offset grid alignment and celestial drawer work as advertised. Verified.
- `TimelineCalendarSettingsModal.tsx`: Complete multi-tab settings UI with real-time add, update, and delete actions. Verified.

---

## 6. Caveats

- No caveats. The entire test suite, TypeScript types, UI components, and mathematical engine were independently verified.

---

## 7. Conclusion

Milestone 4 presents strong UI architecture, solid celestial phase math, and comprehensive settings modals. However, due to the **Integrity Violation** in `advancesWeekday` (dummy facade implementation accompanied by a deceptive unit test) and the **Major Defect** in historical negative year accumulation, Milestone 4 cannot be approved in its current state.

**Verdict**: **`REQUEST_CHANGES`**

---

## 8. Verification Method

To verify these findings:
1. Run a test checking `calculateDayOfWeek` across an intercalary day with `advancesWeekday: false`:
   ```ts
   const dBefore = calculateAbsoluteDay(1, 6, 30, 0, config)
   const dAfter = calculateAbsoluteDay(1, 7, 1, 0, config)
   // Observe that day of week advanced by 2 instead of 1
   expect(calculateDayOfWeek(dAfter, config).index).toBe((calculateDayOfWeek(dBefore, config).index + 1) % 7)
   ```
2. Run a test checking historical negative year:
   ```ts
   const config = { ...createStandardConfig(), hasYearZero: false }
   // Day before Year 1 Day 1 must be Absolute Day -1
   expect(calculateAbsoluteDay(-1, 12, 31, 0, config)).toBe(-1)
   // Currently returns -366 due to unskipped Year 0
   ```
