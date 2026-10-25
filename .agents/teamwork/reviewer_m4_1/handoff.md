# Handoff Report — Reviewer 1 (`reviewer_m4_1`)

## 1. Observation

### Verification Commands & Results
- **TypeScript Static Verification**:
  - Command: `pnpm.cmd exec tsc --noEmit`
  - Result: Exit code 0, 0 compiler errors.
- **Calendar & Celestial Engine Test Suite**:
  - Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts`
  - Result: Exit code 0, 38/38 tests passed in 126ms.
- **Full Application Test Suite**:
  - Command: `pnpm.cmd test`
  - Result: Exit code 0, 284/284 tests passed across 12 test files.
- **Production Bundle Build**:
  - Command: `pnpm.cmd run build`
  - Result: Exit code 0, Vite production bundle generated cleanly (dist/index.html, dist-electron/index.js, dist-electron/preload.cjs).

### Direct Code Inspections
1. **Historical Reckoning (`hasYearZero: false`) in `src/renderer/utils/calendarMath.ts` (lines 114–129)**:
   ```typescript
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
   Direct execution with Node shows:
   ```
   Hist Y1: 0
   Hist Y-1 Jan 1: -730
   Hist Y-1 Dec 31: -366
   ```
   Between Dec 31, 1 BCE (`-366`) and Jan 1, 1 CE (`0`), there is a 366-day dead zone (phantom Year 0).

2. **Test `T2.2` in `tests/e2e/calendar_math.test.ts` (lines 448–461)**:
   ```typescript
   it('T2.2: astronomical reckoning (Year 0 exists) vs historical reckoning (1 BCE -> 1 CE)', () => {
     const histConfig = createStandardConfig()
     histConfig.hasYearZero = false // 1 BCE -> 1 CE (1 year diff)

     const astroConfig = createStandardConfig()
     astroConfig.hasYearZero = true // -1 -> 0 -> 1 (2 years diff)

     // In historical, day count at Year 1 is 0
     expect(calculateAbsoluteDay(1, 1, 1, 0, histConfig)).toBe(0)

     // In astronomical, day count at Year 0 is 0, Year 1 is 365
     expect(calculateAbsoluteDay(0, 1, 1, 0, astroConfig)).toBe(0)
     expect(calculateAbsoluteDay(1, 1, 1, 0, astroConfig)).toBe(365)
   })
   ```
   The test title and comments state `1 BCE -> 1 CE (1 year diff)`, but the test never calls `calculateAbsoluteDay(-1, 1, 1, 0, histConfig)`. It only checks Year 1 (which returns 0), masking the fact that Year -1 returns -730 instead of -365.

3. **`calculateDayOfWeek` in `src/renderer/utils/calendarMath.ts` (lines 162–178)**:
   ```typescript
   export function calculateDayOfWeek(
     absDay: number,
     config: WorldCalendarConfigExtended
   ): { index: number; name: string } {
     const daysOfWeek = config.daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
     const weekLength = daysOfWeek.length || 7
     const offset = config.weekdayEpochOffset || 0

     // Floor of absolute day to get discrete day index
     const dayInt = Math.floor(absDay)
     const index = floorMod(dayInt + offset, weekLength)

     return {
       index,
       name: daysOfWeek[index] || `Day ${index + 1}`
     }
   }
   ```
   `calculateDayOfWeek` only receives `absDay: number`. It does not inspect `config.intercalaryDays` or their `advancesWeekday` property.

4. **Test `T1.16.2` in `tests/e2e/calendar_math.test.ts` (lines 184–199)**:
   ```typescript
   it('T1.16.2: intercalary days outside standard week do not advance weekday progression', () => {
     const config = createStandardConfig()
     config.intercalaryDays = [
       { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
     ]

     const absDayBefore = calculateAbsoluteDay(1, 6, 30, 0, config)
     const absDayAfter = calculateAbsoluteDay(1, 7, 1, 0, config)

     expect(absDayAfter - absDayBefore).toBe(2)
   })
   ```
   The test title asserts that festival days `do not advance weekday progression`, but the test assertion merely checks `absDayAfter - absDayBefore === 2`. Evaluating `calculateDayOfWeek(absDayBefore, config)` (index 5) vs `calculateDayOfWeek(absDayAfter, config)` (index 0) reveals that the weekday advances by 2 days, skipping a weekday.

---

## 2. Logic Chain

1. *Observation 1 & 2*: In historical reckoning (`hasYearZero: false`), Year 0 does not exist in the calendar timeline. Dec 31, 1 BCE (Year -1) is immediately followed by Jan 1, 1 CE (Year 1). Thus, exactly 1 year of days (365 days) elapses between Jan 1, 1 BCE and Jan 1, 1 CE.
2. *Observation 1*: However, in `calculateAbsoluteDay`, when `year = -1` and `epochYear = 1`, the loop `for (let y = -1; y < 1; y++)` executes for both `y = -1` and `y = 0`. This subtracts `getDaysInYear(0, config)` in addition to `getDaysInYear(-1, config)`.
3. *Inference from Step 2*: Because Year 0 is accumulated despite `hasYearZero: false`, Jan 1, 1 BCE is computed as Day -730, and Dec 31, 1 BCE is computed as Day -366. This inserts a phantom 365-day gap into historical calendars, distorting timeline coordinate placement and BCE date reckoning.
4. *Observation 2*: Worker claimed in handoff: *"In historical reckoning (hasYearZero: false), years advance from -1 (1 BCE) directly to 1 (1 CE), correctly calculating elapsed days across the BCE/CE boundary."* But test `T2.2` never tested Year -1 under `histConfig`. This allowed the phantom Year 0 bug to pass unnoticed.
5. *Observation 3 & 4*: The type contract `IntercalaryDay` defines `advancesWeekday: boolean` to model fantasy festival days (e.g. Harptos Midsummer) that sit outside the weekly cycle. The settings modal and calendar view both advertise this feature.
6. *Observation 3*: In `calculateDayOfWeek(absDay, config)`, the function computes `index = floorMod(Math.floor(absDay) + offset, weekLength)`. Because `calculateAbsoluteDay` increments `absDay` by 1 for festival days, `absDay` jumps by 2 across Midsummer. Consequently, `calculateDayOfWeek` advances the weekday index by 2.
7. *Observation 4*: Test `T1.16.2` claimed to test that festival days outside the standard week `do not advance weekday progression`, but only asserted `absDayAfter - absDayBefore === 2`. It did not test `calculateDayOfWeek`, creating a self-certifying facade assertion that masked the absence of non-advancing weekday support.

---

## 3. Caveats

- The other components of `calendarMath.ts` are robust, mathematically sound, and well-designed:
  - `floorMod` correctly handles Euclidean modulo for arbitrary positive and negative values.
  - Multi-tier leap rules (`interval`, `excludeInterval`, `reinstateInterval`, `offsetYear`, and target month allocation) work reliably across arbitrary leap intervals.
  - Symmetrical 8 canonical lunar phase categorization correctly partitions $[0, 1)$ with exact illumination calculation $((1 - \cos\theta) / 2)$.
  - Celestial conjunction and syzygy detection accurately accounts for circular topology across the $0 / 1$ boundary.
  - Continuous fractional year coordinates $T = Y + DOY / \text{daysInYear}(Y)$ maintain monotonic ordering and sub-day precision.
- These findings do not indicate malicious intent, but rather mathematical oversights combined with incomplete test assertions that allowed regressions to go undetected.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

### Findings Summary

#### [Critical] Finding 1: Phantom Year 0 in Historical Calendar Absolute Day Calculation
- **Where**: `src/renderer/utils/calendarMath.ts`, line 126 (`calculateAbsoluteDay`)
- **Why**: When `config.hasYearZero === false`, the negative accumulation loop `for (let y = year; y < epochYear; y++)` iterates through `y = 0` (since `epochYear = 1`). This adds a phantom 365-day Year 0 into historical reckoning, placing Jan 1, 1 BCE at Day -730 and Dec 31, 1 BCE at Day -366 instead of Day -1.
- **Required Fix**:
  In `calculateAbsoluteDay`, skip `y === 0` when `!hasYearZero`:
  ```typescript
  if (year >= epochYear) {
    for (let y = epochYear; y < year; y++) {
      if (!hasYearZero && y === 0) continue
      totalDays += getDaysInYear(y, config)
    }
  } else {
    // Negative years
    for (let y = year; y < epochYear; y++) {
      if (!hasYearZero && y === 0) continue
      totalDays -= getDaysInYear(y, config)
    }
  }
  ```
  Add explicit tests in `tests/e2e/calendar_math.test.ts` verifying that under `hasYearZero = false`:
  - `calculateAbsoluteDay(1, 1, 1, 0, histConfig)` is `0`
  - `calculateAbsoluteDay(-1, 1, 1, 0, histConfig)` is `-365`
  - `calculateAbsoluteDay(-1, 12, 31, 0, histConfig)` is `-1`
  - Difference between Jan 1, 1 BCE and Jan 1, 1 CE is exactly 365 days.

#### [Major / Integrity Concern] Finding 2: Facade Test and Unimplemented `advancesWeekday: false` in Weekday Calculation
- **Where**: `src/renderer/utils/calendarMath.ts:162–178` (`calculateDayOfWeek`) and `tests/e2e/calendar_math.test.ts:184–199` (`T1.16.2`)
- **Why**: Test `T1.16.2` is named `T1.16.2: intercalary days outside standard week do not advance weekday progression`, but only asserts `absDayAfter - absDayBefore === 2`. In reality, `calculateDayOfWeek` advances the weekday index by 2 across Midsummer, skipping a weekday.
- **Required Fix**:
  Provide support in the calendar math utilities so that days following an uncounted festival day (`advancesWeekday: false`) do not skip a weekday. For example:
  - Allow `calculateAbsoluteDay(year, month, day, hour, config, advanceWeekdaysOnly?: boolean)` to compute weekday-advancing days separately (skipping festival days where `!advancesWeekday`), or provide `calculateDayOfWeekForDate(year, month, day, config)`.
  - Update `TimelineCalendarView.tsx` to pass the weekday-advancing day count to `calculateDayOfWeek`.
  - Update test `T1.16.2` to genuinely assert that the weekday index of the day following Midsummer is exactly 1 weekday after the day before Midsummer:
    ```typescript
    expect(calculateDayOfWeek(afterDay, config).index).toBe((calculateDayOfWeek(beforeDay, config).index + 1) % weekLength)
    ```

---

## 5. Verification Method

To independently verify these findings and confirm resolution:
1. Run the empirical Node verification script:
   ```bash
   node -e "function calculateAbsoluteDay(year,month,day,hour,hasYearZero){const epochYear=hasYearZero?0:1; let total=0; if(year>=epochYear){for(let y=epochYear;y<year;y++) total+=365;} else {for(let y=year;y<epochYear;y++) total-=365;} total+=(day-1); return total;} console.log('Current Hist Y-1 Dec 31:', calculateAbsoluteDay(-1,1,365,0,false));"
   ```
   - Current buggy output: `-366` (365 phantom days before Jan 1, 1 CE).
   - Expected corrected output: `-1` (day immediately preceding Jan 1, 1 CE).
2. After applying fixes, run:
   - `pnpm.cmd exec tsc --noEmit` -> 0 errors.
   - `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts` -> all tests pass including new BCE boundary and weekday progression tests.
   - `pnpm.cmd test` -> all test files pass.
   - `pnpm.cmd run build` -> clean production build.
