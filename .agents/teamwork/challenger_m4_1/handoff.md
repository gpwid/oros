# Empirical Challenge Report — Milestone 4: Calendar Date Mathematics

**Challenger**: `challenger_m4_1`  
**Verdict**: `REQUEST_CHANGES`  
**Date**: 2026-10-24T21:48:00Z  

---

## 1. Observation

### Verification of Baseline Claims
1. **TypeScript Typecheck**:
   Command: `pnpm.cmd exec tsc --noEmit`
   Result: Exit code 0 (0 errors).
2. **Original Worker Test Suite**:
   Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts`
   Result: 38/38 passed.
3. **Full Application Test Suite**:
   Command: `pnpm.cmd test`
   Result: 12 test files passed, 284/284 passed.
4. **Production Build**:
   Command: `pnpm.cmd run build`
   Result: Exit code 0, bundled cleanly in 16.22s.

### Empirical Adversarial Stress Test Findings
We created and executed an empirical stress harness in `tests/e2e/calendar_math_adversarial.test.ts`:
Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts`
Result: **6 failed out of 11 tests** (Exit code 1).

#### Failure 1: Historical Reckoning Phantom Year 0 Off-By-One Year Bug
- **Location**: `src/renderer/utils/calendarMath.ts`, lines 114–129:
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
- **Verbatim Test Failure**:
  ```
  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 1: Historical Reckoning (Year 0 Skipped: 1 BCE -> 1 CE) > F1.1
  AssertionError: expected 730 to be 365 // Object.is equality
  [Historical Reckoning Delta] Day 1 CE = 0, Day 1 BCE = -730, Delta = 730, Expected = 365

  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 1: Historical Reckoning (Year 0 Skipped: 1 BCE -> 1 CE) > F1.2
  AssertionError: expected -366 to be -1 // Object.is equality
  [Historical Reckoning Transition] First Day 1 CE = 0, Last Day 1 BCE = -366, Expected = -1

  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 1: Historical Reckoning (Year 0 Skipped: 1 BCE -> 1 CE) > F1.4
  AssertionError: expected 1095 to be 730 // Object.is equality
  [Historical Multi-Year] Day 2 BCE = -1095 (expected -730), Day 3 BCE = -1460 (expected -1095)
  ```

#### Failure 2: Non-advancing Intercalary Festival Days Completely Ignored by Weekday Progression
- **Location**: `src/shared/types.ts` line 204 defines:
  ```ts
  export interface IntercalaryDay {
    id: string
    name: string
    occursAfterMonthId: string
    isLeapOnly?: boolean
    advancesWeekday: boolean  // If false, outside standard weekly progression
    description?: string
  }
  ```
  In `src/renderer/utils/calendarMath.ts`:
  `advancesWeekday` is NEVER read or referenced anywhere in `calendarMath.ts`.
  In `calculateAbsoluteDay` (lines 137–146):
  ```ts
  if (config.intercalaryDays) {
    const monthId = config.months[m]?.id
    const leap = isLeapYear(year, config)
    for (const ic of config.intercalaryDays) {
      if (ic.occursAfterMonthId === monthId && (!ic.isLeapOnly || leap)) {
        totalDays += 1
      }
    }
  }
  ```
  In `calculateDayOfWeek` (lines 162–178):
  ```ts
  export function calculateDayOfWeek(
    absDay: number,
    config: WorldCalendarConfigExtended
  ): { index: number; name: string } {
    const daysOfWeek = config.daysOfWeek || ...
    const weekLength = daysOfWeek.length || 7
    const offset = config.weekdayEpochOffset || 0

    const dayInt = Math.floor(absDay)
    const index = floorMod(dayInt + offset, weekLength)
    ...
  }
  ```
- **Verbatim Test Failure**:
  ```
  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 2: Intercalary Festival Days and Weekday Progression > F2.1
  AssertionError: expected +0 to be 6
  [Festival Weekday Freeze] Before: Day 5 (Day 6), After: Day 0 (Day 1)

  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 2: Intercalary Festival Days and Weekday Progression > F2.2
  AssertionError: Month 2 should start on '1st' (index 0) but started on 2nd (index 1): expected 1 to be +0
  [Harptos Month Starts]: [
    { month: 1, index: 0, name: '1st' },
    { month: 2, index: 1, name: '2nd' },
    { month: 3, index: 1, name: '2nd' },
    { month: 4, index: 1, name: '2nd' },
    { month: 5, index: 2, name: '3rd' },
    { month: 6, index: 2, name: '3rd' },
    { month: 7, index: 2, name: '3rd' },
    { month: 8, index: 3, name: '4th' },
    { month: 9, index: 3, name: '4th' },
    { month: 10, index: 4, name: '5th' },
    { month: 11, index: 4, name: '5th' },
    { month: 12, index: 5, name: '6th' }
  ]
  ```

#### Failure 3: Leap Year Exclusion Rule Erroneously Excludes Era Base Year
- **Location**: `src/renderer/utils/calendarMath.ts`, lines 26–46:
  ```ts
  return rules.some(rule => {
    const adjustedYear = year - (rule.offsetYear || 0)

    // Check primary interval
    if (floorMod(adjustedYear, rule.interval) !== 0) {
      return false
    }

    // Check exclusion interval (e.g. Gregorian 100-year rule)
    if (rule.excludeInterval && rule.excludeInterval > 0) {
      if (floorMod(adjustedYear, rule.excludeInterval) === 0) {
        // Check reinstatement interval (e.g. Gregorian 400-year rule)
        if (rule.reinstateInterval && rule.reinstateInterval > 0) {
          return floorMod(adjustedYear, rule.reinstateInterval) === 0
        }
        return false
      }
    }

    return true
  })
  ```
- **Verbatim Test Failure**:
  ```
  FAIL tests/e2e/calendar_math_adversarial.test.ts > Focus 3: Multi-tier Leap Rules > F3.2
  AssertionError: expected false to be true
  Rule: { interval: 6, offsetYear: 2, extraDays: 2, targetMonthId: 'm2', excludeInterval: 30 }
  isLeapYear(2, config) -> returned false because adjustedYear = 0, floorMod(0, 30) === 0.
  ```

---

## 2. Logic Chain

1. *Claim by Worker*: "In historical reckoning (`hasYearZero: false`), years advance from -1 (1 BCE) directly to 1 (1 CE), correctly calculating elapsed days across the BCE/CE boundary."
   - *Observation*: In `calendarMath.ts:126`, the loop is `for (let y = year; y < epochYear; y++)`. When `year = -1` and `epochYear = 1` (`hasYearZero: false`), `y` executes for `-1` and then `0`.
   - *Logic*: Year 0 is accumulated and subtracted despite `hasYearZero === false`. Consequently, `calculateAbsoluteDay(-1, 1, 1, 0, config)` returns `-730` instead of `-365`, adding 365 phantom days (an entire phantom year) to all BCE calculations. The day immediately prior to 1 CE Jan 1 (which should be absolute day -1) is calculated as -366.
   - *Conclusion*: A severe off-by-one year error corrupts all historical reckoning BCE dates.

2. *Requirement*: "Intercalary festival days: verify non-advancing weekday festival days (e.g. Midsummer) freeze weekday progression."
   - *Observation*: `src/shared/types.ts` defines `advancesWeekday: boolean`. In `calendarMath.ts`, `advancesWeekday` is never inspected.
   - *Logic*: `calculateAbsoluteDay` increments `totalDays` for every intercalary day. `calculateDayOfWeek` performs `floorMod(absDay + offset, weekLength)`. Because `absDay` is incremented by 1 for the festival day, the day after the festival advances by 2 weekdays instead of 1.
   - *Impact*: In the canonical Harptos calendar preset, each month has 30 days (3 tendays). Each festival was designed with `advancesWeekday: false` so that every month begins on '1st'. Because `advancesWeekday: false` is ignored, Month 2 starts on '2nd', Month 5 starts on '3rd', Month 8 starts on '4th', Month 10 starts on '5th', and Month 12 starts on '6th'. The calendar display in `TimelineCalendarView.tsx` shows drifted empty cells on every month.

3. *Requirement*: "Multi-tier leap rules: 4-year, 100-year skip, 400-year reinstate, custom offsets, negative year leap cycles."
   - *Observation*: When a rule defines `offsetYear` and `excludeInterval` without `reinstateInterval`, `adjustedYear = year - offsetYear`.
   - *Logic*: At `year = offsetYear` (the start of the leap cycle), `adjustedYear = 0`. Since `0 % excludeInterval === 0`, `isLeapYear` treats the base year as an exclusion year and returns `false`. The initial year of the leap cycle is skipped.

---

## 3. Caveats

- In astronomical reckoning (`hasYearZero: true`), year 0 calculations, century modulo evaluations, and negative years are mathematically sound and passed all tests.
- Euclidean modulo `floorMod` correctly handles large negative dividends (`floorMod(-1, 7) === 6`).
- Month and day boundary clamping functions correctly as expected.
- Celestial moon phase calculations and syzygy conjunction detection functions are accurate.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

Milestone 4 cannot be approved in its current state due to 3 reproducible mathematical defects:
1. **Critical: Historical Reckoning Phantom Year 0**: Non-existent Year 0 is accumulated in `calculateAbsoluteDay` when `hasYearZero === false`, shifting all BCE dates by -365 days.
2. **Critical: Broken Intercalary Weekday Freezing**: `advancesWeekday: false` is ignored in `calendarMath.ts`, causing festival days to advance the weekday progression and breaking month alignments in fantasy calendars (including the built-in Harptos preset).
3. **High: Leap Year Exclusion Base Year Skipping**: `isLeapYear` excludes `year === offsetYear` because `floorMod(0, excludeInterval) === 0`.

### Required Worker Remediations:
1. In `calculateAbsoluteDay` in `src/renderer/utils/calendarMath.ts`:
   - When `!hasYearZero && y === 0`, skip Year 0 (`continue;`).
2. Implement weekday freezing for non-advancing intercalary days:
   - Provide a mechanism (or helper) that accounts for `advancesWeekday: false` days when determining weekday index, ensuring that festival days outside the weekly progression do not push subsequent calendar days to later weekday indices.
3. In `isLeapYear` in `src/renderer/utils/calendarMath.ts`:
   - Ensure exclusion intervals only apply when `adjustedYear !== 0` (or when `adjustedYear` is a non-zero multiple of `excludeInterval`).

---

## 5. Verification Method

To verify these findings independently:
```powershell
pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts
```
Expected: 6 test failures demonstrating the exact defects described above.
Following worker remediations, the command must pass 11/11 tests alongside `pnpm.cmd test` (284+ tests) and `pnpm.cmd run build`.
