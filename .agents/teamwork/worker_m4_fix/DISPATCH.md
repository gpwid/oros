## 2026-10-25T00:41:14Z
Parent orchestrator conversation ID: `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`

Mission: Remediate the 4 specific defects in Milestone 4 (Fantasy Calendar & Celestial Engine):

1. **Fix 1: Phantom Year 0 in Historical Epoch Reckoning (`hasYearZero: false`)**:
   In `src/renderer/utils/calendarMath.ts`:
   In `calculateAbsoluteDay`:
   When `hasYearZero === false`, Year 0 does not exist. For negative years (`year < epochYear`), the loop must iterate from `year` up to `-1` (i.e. `for (let y = year; y <= -1; y++) totalDays -= getDaysInYear(y, config)`), NOT up to `epochYear = 1` which included Year 0.
   Verify tests F1.1, F1.2, and F1.4 pass:
   - Delta between 1 BCE Jan 1 and 1 CE Jan 1 is exactly 365 days.
   - Last day of 1 BCE is absolute day -1.

2. **Fix 2: Intercalary Festival Weekday Freezing (`advancesWeekday: false`)**:
   In `src/renderer/utils/calendarMath.ts`:
   Implement `countNonAdvancingIntercalaryDays(absDay: number, config: WorldCalendarConfigExtended): number` or calculate the effective weekday day in `calculateDayOfWeek`:
   When `config.intercalaryDays` contains entries where `advancesWeekday === false`, calculate how many such non-advancing intercalary days occurred between Epoch Day 0 and `absDay`.
   Subtract this count from `dayInt` before computing the modulo:
   `effectiveDay = dayInt - nonAdvancingCount`
   `index = floorMod(effectiveDay + offset, weekLength)`
   Verify tests F2.1 and F2.2 pass:
   - Day after Midsummer is the immediate successor weekday of the day before Midsummer.
   - In Harptos calendar, all 12 months start on '1st' (index 0).

3. **Fix 3: Leap Year Base Offset Exclusion**:
   In `src/renderer/utils/calendarMath.ts`:
   In `isLeapYear`:
   When evaluating `rule.excludeInterval`, if `adjustedYear === 0` (the starting base offset year), do NOT exclude it (`if (rule.excludeInterval && adjustedYear !== 0 && floorMod(adjustedYear, rule.excludeInterval) === 0)`).
   Verify test F3.2 passes: Year 2 with offset 2 is leap; Year 32 is excluded.

4. **Fix 4: Timeline Period EndDay Fallback**:
   In `src/renderer/components/timeline/TimelineLineView.tsx:120`:
   Update fallback `period.endDay ?? 30` to dynamically query `getDaysInMonth(period.endYear ?? period.year, (period.endMonth ?? 1) - 1, calendarConfig)`.

5. **Fix 5: Update Unit Test `T1.16.2`**:
   In `tests/e2e/calendar_math.test.ts:184-198`:
   Update test `T1.16.2` to assert that `calculateDayOfWeek(absDayAfter, config).index === (calculateDayOfWeek(absDayBefore, config).index + 1) % config.daysOfWeek.length`.

Verification Requirements:
- On Windows, always use `pnpm.cmd`.
- Run: `pnpm.cmd exec tsc --noEmit` -> 0 errors.
- Run: `pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts` -> 11/11 MUST PASS.
- Run: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts` -> 38/38 MUST PASS.
- Run: `pnpm.cmd exec vitest run tests/e2e/celestial_math_empirical.test.ts` -> 28/28 MUST PASS.
- Run: `pnpm.cmd test` -> ALL 312+ tests across all 14 test files MUST PASS with 0 failures.
- Run: `pnpm.cmd run build` -> Clean build.
