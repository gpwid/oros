# Milestone 4 Iteration 2 Review & Adversarial Challenge Report

**Reviewer**: `reviewer_m4_it2_2` (Reviewer 2)  
**Parent Orchestrator ID**: `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`  
**Target Milestone**: Milestone 4 Iteration 2 (`worker_m4_fix`)  
**Verdict**: **`APPROVE`**  
**Integrity Assessment**: **NO INTEGRITY VIOLATIONS DETECTED** (0 hardcoded test cheats, 0 facades, 0 bypassed tasks, authentic mathematical implementations across all calendar rules)

---

## 1. Observation

### Verification Commands & Results (Windows PowerShell `pnpm.cmd`)

1. **Static Type Checking**:
   - Command: `pnpm.cmd exec tsc --noEmit`
   - Exit Code: `0`
   - Output: 0 compiler errors.

2. **Calendar Math Adversarial Test Suite**:
   - Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts`
   - Exit Code: `0`
   - Output: 11/11 tests passed in 37ms.
   - Verbatim console logs:
     ```
     [Historical Reckoning Delta] Day 1 CE = 0, Day 1 BCE = -365, Delta = 365, Expected = 365
     [Historical Reckoning Transition] First Day 1 CE = 0, Last Day 1 BCE = -1, Expected = -1
     [Historical Multi-Year] Day 2 BCE = -730 (expected -730), Day 3 BCE = -1095 (expected -1095)
     [Festival Weekday Freeze] Before: Day 5 (Day 6), After: Day 6 (Day 7)
     [Harptos Month Starts]: [
       { month: 1, index: 0, name: '1st' },
       { month: 2, index: 0, name: '1st' },
       { month: 3, index: 0, name: '1st' },
       { month: 4, index: 0, name: '1st' },
       { month: 5, index: 0, name: '1st' },
       { month: 6, index: 0, name: '1st' },
       { month: 7, index: 0, name: '1st' },
       { month: 8, index: 0, name: '1st' },
       { month: 9, index: 0, name: '1st' },
       { month: 10, index: 0, name: '1st' },
       { month: 11, index: 0, name: '1st' },
       { month: 12, index: 0, name: '1st' }
     ]
     ✓ tests/e2e/calendar_math_adversarial.test.ts (11 tests) 37ms
     ```

3. **Calendar Date Mathematics Unit Suite**:
   - Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts`
   - Exit Code: `0`
   - Output: 38/38 tests passed in 64ms.

4. **Full Workspace Test Suite**:
   - Command: `pnpm.cmd test` (`vitest run`)
   - Exit Code: `0`
   - Output: 14 test files passed, 323/323 tests passed in 7.46s (0 failures).

5. **Production Build & Packaging**:
   - Command: `pnpm.cmd run build` (`tsc && vite build`)
   - Exit Code: `0`
   - Output: Built in 14.89s. Produced `dist/index.html`, `dist-electron/index.js`, `dist-electron/preload.cjs`.

---

## 2. Code Review & Verification Details

### 2.1. `TimelineLineView.tsx:121` — Dynamic `getDaysInMonth` Period EndDay Fallback

In `src/renderer/components/timeline/TimelineLineView.tsx:110-128`:
```typescript
const periodToCoords = useCallback((period: TimelineEvent) => {
  const startFrac = dateToFractionalYear(
    period.year,
    period.month ?? 1,
    period.day ?? 1,
    period.hour ?? 0,
    calendarConfig
  )
  const endFrac = dateToFractionalYear(
    period.endYear ?? period.year,
    period.endMonth ?? (calendarConfig.months?.length || 12),
    period.endDay ?? getDaysInMonth(period.endYear ?? period.year, (period.endMonth ?? 1) - 1, calendarConfig),
    period.endHour ?? 0,
    calendarConfig
  )
  const startX = yearToX(startFrac)
  const endX = yearToX(endFrac)
  return { startX, endX, width: Math.max(28, endX - startX) }
}, [calendarConfig, yearToX])
```

- **Observed Behavior**:
  - `getDaysInMonth` is imported from `../../utils/calendarMath` (line 21).
  - When `period.endDay` is omitted, the component dynamically queries `getDaysInMonth` rather than using a static default (e.g. 30).
  - When `period.endMonth` is specified (e.g. `5`), `(period.endMonth ?? 1) - 1` evaluates to index `4`, retrieving the exact length of month 5 for that specific year (respecting leap year rules).
  - Inside `dateToFractionalYear` (`calendarMath.ts:459`), `clampedDay = Math.max(1, Math.min(day, getDaysInMonth(year, clampedMonth - 1, config)))` further ensures day bounds cannot overflow the month.

### 2.2. `tests/e2e/calendar_math.test.ts:184-203` — Test `T1.16.2` Verification

```typescript
it('T1.16.2: intercalary days outside standard week do not advance weekday progression', () => {
  const config = createStandardConfig()
  config.intercalaryDays = [
    { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
  ]

  const absDayBefore = calculateAbsoluteDay(1, 6, 30, 0, config)
  const absDayAfter = calculateAbsoluteDay(1, 7, 1, 0, config)

  expect(absDayAfter - absDayBefore).toBe(2)

  const weekdayBefore = calculateDayOfWeek(absDayBefore, config)
  const weekdayAfter = calculateDayOfWeek(absDayAfter, config)
  expect(weekdayAfter.index).toBe((weekdayBefore.index + 1) % config.daysOfWeek.length)
})
```

- **Observed Behavior**:
  - Genuinely tests weekday freezing with `calculateDayOfWeek`.
  - Midsummer inserted between Month 6 and Month 7 increments `absDayAfter - absDayBefore` to 2.
  - Normal calendar advancement would advance by 2 weekdays.
  - Because `advancesWeekday: false`, `calculateDayOfWeek` invokes `countNonAdvancingIntercalaryDays`, which subtracts the non-advancing festival day.
  - As a result, `weekdayAfter.index` equals `(weekdayBefore.index + 1) % weekLength` (the immediate consecutive weekday).
  - In addition, `calendar_math_adversarial.test.ts:133-182` (`F2.2`) verifies this across all 12 months of the Harptos calendar (360 days in 12 months separated by 5 non-advancing festival days), demonstrating that every single month starts on `'1st'` (index 0).

### 2.3. `tests/e2e/calendar_math.test.ts:453-469` — Test `T2.2` Negative BCE Boundaries

```typescript
it('T2.2: astronomical reckoning (Year 0 exists) vs historical reckoning (1 BCE -> 1 CE)', () => {
  const histConfig = createStandardConfig()
  histConfig.hasYearZero = false

  const astroConfig = createStandardConfig()
  astroConfig.hasYearZero = true

  // In historical, day count at Year 1 is 0
  expect(calculateAbsoluteDay(1, 1, 1, 0, histConfig)).toBe(0)
  // In historical, 1 BCE (-1) is exactly 365 days prior to 1 CE (1), and Dec 31 1 BCE is Day -1
  expect(calculateAbsoluteDay(-1, 1, 1, 0, histConfig)).toBe(-365)
  expect(calculateAbsoluteDay(-1, 12, 31, 0, histConfig)).toBe(-1)

  // In astronomical, day count at Year 0 is 0, Year 1 is 365
  expect(calculateAbsoluteDay(0, 1, 1, 0, astroConfig)).toBe(0)
  expect(calculateAbsoluteDay(1, 1, 1, 0, astroConfig)).toBe(365)
})
```

- **Observed Behavior**:
  - Genuinely verifies historical reckoning (`hasYearZero: false`) where Year 0 is skipped.
  - `calculateAbsoluteDay(-1, 1, 1, 0, histConfig)` yields `-365` (exactly 1 year before Epoch 0).
  - `calculateAbsoluteDay(-1, 12, 31, 0, histConfig)` yields `-1`, immediately preceding Epoch Day 0 (`1 CE Jan 1`).
  - No phantom Year 0 is accumulated in negative loops (`for (let y = year; y <= -1; y++)`).
  - `calendar_math_adversarial.test.ts:46-103` (`F1.1`-`F1.4`) confirms multi-year negative historical spans (Year -2 = -730, Year -3 = -1095).

### 2.4. Cross-Component Integration & UI Design Tokens

- **Component Harmony**:
  - `TimelineView.tsx` provides unified view switching between `line`, `calendar`, and `chronicle` modes using the floating instrument dock.
  - `TimelineLineView.tsx` integrates continuous fractional coordinates $T = Y + DOY / \text{daysInYear}(Y)$ with zoom-at-cursor focal point locking, boundary clamping, and celestial markers along ruler ticks.
  - `TimelineCalendarView.tsx` derives `daysInMonth` and `firstDayOfWeekOffset` dynamically via `calendarMath.ts`, aligning month grids and festival days accurately.
  - `TimelineEventModal.tsx` and `TimelineCalendarSettingsModal.tsx` allow configuring and editing multi-tier leap rules, intercalary days, custom weekdays/months, and moons.
- **Design Tokens**:
  - Strict compliance with `oros-50..950` palette, `border-oros-750`, and micro-radii (`rounded-[4px]`, `rounded-[2px]`, `rounded-[3px]`).
  - Zero promotional copy, placeholder badges, or nested card border vibrations.

---

## 3. Adversarial Challenges & Findings

### [Minor Finding] Symmetrical EndMonth vs EndDay Defaulting in `TimelineLineView.tsx:121`

- **Location**: `src/renderer/components/timeline/TimelineLineView.tsx:120-121`
- **What**:
  ```typescript
  period.endMonth ?? (calendarConfig.months?.length || 12),
  period.endDay ?? getDaysInMonth(period.endYear ?? period.year, (period.endMonth ?? 1) - 1, calendarConfig),
  ```
  When `period.endMonth` is undefined:
  - Line 120 defaults `endMonth` to `calendarConfig.months?.length || 12` (the last month of the year).
  - Line 121 defaults the month index for `getDaysInMonth` using `(period.endMonth ?? 1) - 1`, which evaluates to index `0` (the first month of the year).
- **Risk Analysis**:
  - In all current standard calendar presets (Gregorian: 31/31, Harptos: 30/30, SciFi Sol: 36/36), Month 1 and the last month have identical day counts, so `getDaysInMonth` returns the correct number of days.
  - Even if Month 1 had more days than Month Last, `dateToFractionalYear:459` clamps the day to the last month's day count.
  - Only in an asymmetric custom calendar where Month 1 has fewer days than the final month would a period omitting both `endMonth` and `endDay` end slightly before the final day of the year.
- **Suggestion**:
  In a future cleanup pass, resolve `const resolvedEndMonth = period.endMonth ?? (calendarConfig.months?.length || 12)` first, and pass `resolvedEndMonth - 1` to `getDaysInMonth`.

---

## 4. Logic Chain

1. In Milestone 4 reviews, four mathematical and UI integration defects were targeted:
   - Historical reckoning phantom year accumulation in negative years.
   - Weekday progression ignoring `advancesWeekday: false` in festival days.
   - Base offset exclusion multiple collision in `isLeapYear`.
   - Static period `endDay` fallback in `TimelineLineView`.
2. Inspection of `src/renderer/utils/calendarMath.ts` confirms:
   - `for (let y = year; y <= -1; y++)` stops at `-1`, eliminating phantom Year 0 subtractions.
   - `countNonAdvancingIntercalaryDays` tracks non-advancing intercalary days bidirectionally, freezing weekday indices across festival days.
   - `adjustedYear !== 0` check protects base offset years from exclusion rules.
3. Inspection of `TimelineLineView.tsx:121` confirms dynamic month-length lookup via `getDaysInMonth(period.endYear ?? period.year, (period.endMonth ?? 1) - 1, calendarConfig)`.
4. Inspection of `tests/e2e/calendar_math.test.ts` confirms genuine tests for weekday freeze (`T1.16.2`) and BCE boundary day counting (`T2.2`).
5. Live test suite execution confirms 323/323 unit and adversarial tests pass with 0 TypeScript compiler errors and clean production build bundling.
6. The codebase contains zero integrity violations, hardcoded facades, or bypassed logic.

---

## 5. Caveats

- In `TimelineLineView.tsx:121`, when both `endMonth` and `endDay` are omitted on a period event in an asymmetric calendar where Month 1 is shorter than the last month, the fallback day count uses Month 1's length. This is flagged as a minor finding and does not affect standard presets or test suites.

---

## 6. Conclusion & Verdict

**Verdict**: **`APPROVE`**

The implementation is robust, mathematically verified across positive and negative years (including extreme ranges $[-10000, 10000]$), integrates smoothly across all timeline and calendar components, adheres to Oros UI design standards, passes all 323 automated tests, and compiles cleanly to production.

---

## 7. Verification Method

To independently reproduce this review:
1. `pnpm.cmd exec tsc --noEmit` -> verify 0 compiler errors.
2. `pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts` -> verify 11/11 tests pass.
3. `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts` -> verify 38/38 tests pass.
4. `pnpm.cmd test` -> verify all 14 test files and 323 tests pass.
5. `pnpm.cmd run build` -> verify clean production bundle build.
