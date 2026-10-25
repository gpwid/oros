# Empirical Challenge Report — Milestone 4: Celestial Calculations, Syzygy Conjunctions & Timeline Fractional Coordinates

**Challenger**: `challenger_m4_2`  
**Verdict**: `REQUEST_CHANGES`  
**Timestamp**: 2026-10-24T21:49:30Z  

---

## 1. Observation

### Mandated Verification Commands & Direct Outputs
1. **TypeScript Static Typecheck**:
   - Command: `pnpm.cmd exec tsc --noEmit`
   - Exit Code: `0`
   - Stdout/Stderr: None (0 compiler errors).

2. **Milestone 4 Worker Unit & E2E Suite**:
   - Command: `pnpm.cmd exec vitest run tests/e2e/calendar_math.test.ts`
   - Exit Code: `0`
   - Output: `✓ tests/e2e/calendar_math.test.ts (38 tests) 44ms` (38/38 passed).

3. **Challenger 2 Empirical Celestial & Timeline Stress Suite**:
   - File created: `tests/e2e/celestial_math_empirical.test.ts`
   - Command: `pnpm.cmd exec vitest run tests/e2e/celestial_math_empirical.test.ts`
   - Exit Code: `0`
   - Output: `✓ tests/e2e/celestial_math_empirical.test.ts (28 tests) 77ms` (28/28 passed).

4. **Full Application Test Suite**:
   - Command: `pnpm.cmd test` (`vitest run`)
   - Exit Code: `1` (FAIL)
   - Test Results: `1 failed | 13 passed (14 test files)`
   - Passing tests: 317 passed.
   - Failing tests: **6 failed in `tests/e2e/calendar_math_adversarial.test.ts`** (authored by peer `challenger_m4_1`).

5. **Production Build**:
   - Command: `pnpm.cmd run build` (`tsc && vite build`)
   - Exit Code: `0`
   - Output: `✓ built in 8.75s` (dist/index.html, bundles, electron main and preload cleanly built with 0 warnings/errors).

---

### Detailed Empirical Observations on Celestial & Timeline Focus Areas

#### Focus A: Systems with 1 to 5 Moons & Incommensurable Synodic Periods
- Evaluated synodic period calculations in `src/renderer/utils/calendarMath.ts` (`calculateMoonPhases`):
  - 1-moon system (Earth-Moon $P = 29.530588$ days): Over 1,000 orbits (29,530.588 days), phase fraction returns precisely to $0.0000$ (New Moon) within floating-point error ($< 10^{-4}$). Illuminations at quarter phases ($D = 0.25P \implies 50.0\%$, $D = 0.50P \implies 100.0\%$, $D = 0.75P \implies 50.0\%$) match theoretical values exactly.
  - 2-moon system ($P_1 = 7.25$ days, $P_2 = 45.8$ days): Independent phase evolution verified with disparate periods.
  - 3-moon system (Dragonlance Krynn: Solinari 36d, Lunitari 28d, Nuitari 8d): Least Common Multiple ($\text{LCM}(36, 28, 8) = 504$ days) alignment returns all three moons simultaneously to phase $0.0000$.
  - 4-moon and 5-moon systems with incommensurable periods ($P \in [29.53, 14.28, 41.333, 9.18, 63.45]$ solar days): Across 5,000 simulation days, all phase fractions remain strictly bounded in $[0.0, 1.0)$, illuminations in $[0.0, 100.0]\%$, and angles in $[0.0, 2\pi)$. Execution performance measured at 25,000 moon calculations in $< 50$ms.
  - Zero and negative synodic periods: `Math.max(0.001, moon.synodicPeriodDays)` on line 216 prevents division-by-zero, yielding finite numerical outputs.
  - Negative absolute days (BCE reckoning): `floorMod(epochPhase + absDay / period, 1.0)` on line 217 prevents negative remainder anomalies (e.g. Day -7 for $P = 28$ yields phase $0.75$, Last Quarter).

#### Focus B: Multi-Moon Syzygy & Conjunction Detection
- Evaluated `detectCelestialConjunctions(phases, tolerance = 0.04)`:
  - 5-Moon Grand Full Conjunction: When all 5 moons reach phase $0.50 \pm 0.04$, correctly triggers `grand_full_conjunction` with `severity = 1.0`, all 5 `alignedMoonIds`, and full descriptive text.
  - 5-Moon Dark Solar Conjunction: Moons clustering across the $0.0 / 1.0$ circular boundary (e.g., $0.01, 0.02, 0.99, 0.98, 0.00$) correctly trigger `dark_solar_conjunction` with `severity = 1.0`.
  - Partial Alignments:
    - 2 of 5 moons aligned at arbitrary phase angle (e.g. $0.35$ and $0.36$) yields `type: 'partial_alignment'`, `alignedMoonIds: ['m1', 'm2']`, and `severity = 0.40`.
    - 3 of 5 moons aligned yields `severity = 0.60`.
    - 4 of 5 moons aligned (e.g., 4 at Full Moon, 1 at New Moon) yields `severity = 0.80`, correctly excluding the unaligned body.
  - Circular wrap-around tolerance check on line 275: `diff <= tolerance || (1 - diff) <= tolerance` correctly captures circular angular proximity on the unit circle.
  - Harmonic beat period oracle: For $P_1 = 12$d and $P_2 = 18$d ($T_{\text{beat}} = \frac{1}{|1/12 - 1/18|} = 36$d), conjunctions recur exactly at Days $0, 36, 72, 108\dots$, while intermediate non-conjunction days ($12, 18$) return `null`.

#### Focus C: Timeline Fractional Coordinates $T = Y + DOY / \text{daysInYear}(Y)$
- Evaluated `dateToFractionalYear` in `src/renderer/utils/calendarMath.ts` (lines 298–330) and `TimelineLineView.tsx` (lines 98–127):
  - Monotonicity within non-leap year (365 days): Strict $T_{d+1} > T_d$ across all 365 days, bounded by $[101.0, 102.0)$.
  - Monotonicity within leap year (366 days): Strict $T_{d+1} > T_d$ across all 366 days, with leap day (Month 2 Day 29) strictly satisfying $T(\text{Feb 28}) < T(\text{Feb 29}) < T(\text{Mar 1})$.
  - Monotonicity across leap to non-leap boundary: $T(\text{Year 4, M12, D31, H23.999}) \approx 4.99988 < 5.0 = T(\text{Year 5, M1, D1, H0})$.
  - Monotonicity across non-leap to leap boundary: $T(\text{Year 3, M12, D31, H23.999}) \approx 3.99988 < 4.0 = T(\text{Year 4, M1, D1, H0})$.
  - Intercalary festival day placement: `doy` accumulation on line 319 accounts for festival days between months, scaling against `daysInYear` denominator, preserving continuity.

#### Focus D: Hour-Level Resolution
- `calculateAbsoluteDay(Y, M, D, H)`: Each hour advances the absolute day by exactly $\frac{1}{\text{hoursInDay}}$ ($\Delta = 0.0416666...$ for 24h).
- `dateToFractionalYear(Y, M, D, H)`: Each hour advances fractional coordinate by exactly $\frac{1}{\text{hoursInDay} \times \text{daysInYear}(Y)}$ ($\Delta = \frac{1}{8760} \approx 0.000114155$ for 365d/24h).
- Continuity across midnight month transitions: Day 31 Hour 23 to Day 1 Hour 0 difference equals exactly 1 hour ($1/24$ day).
- Non-standard hours (e.g. 30 hours/day) and fractional hours (e.g. 14.5h) advance monotonically without drift.

---

### Observations on Root Causes of Failures in `pnpm test`
While the celestial and fractional coordinates engine behaves correctly, the whole-test-suite run (`pnpm.cmd test`) failed with 6 test failures in `tests/e2e/calendar_math_adversarial.test.ts`. Inspection reveals 3 concrete implementation defects in `src/renderer/utils/calendarMath.ts`:

1. **Phantom Year 0 in Historical Reckoning (`hasYearZero: false`)**:
   - Location: `src/renderer/utils/calendarMath.ts`, lines 126–129:
     ```ts
     } else {
       // Negative years
       for (let y = year; y < epochYear; y++) {
         totalDays -= getDaysInYear(y, config)
       }
     }
     ```
   - In historical reckoning (`hasYearZero: false`), `epochYear = 1`. For `year = -1` (1 BCE), the loop iterates for `y = -1` AND `y = 0`.
   - Year 0 does not exist in historical calendar reckoning (1 BCE is followed immediately by 1 CE, a span of 1 year / 365 days).
   - Because the loop counts `y = 0`, it subtracts an extra phantom year (365 extra days), yielding -730 days instead of -365 days for 1 BCE Jan 1, and -366 days instead of -1 day for 1 BCE Dec 31.

2. **Non-advancing Intercalary Festival Days Ignored in Weekday Progression**:
   - Location: `src/renderer/utils/calendarMath.ts`, lines 162–178:
     `calculateDayOfWeek(absDay, config)` computes `floorMod(Math.floor(absDay) + offset, weekLength)`.
   - It only takes `absDay`. When an intercalary festival day occurs with `advancesWeekday: false` (e.g. Midsummer in Harptos), `calculateAbsoluteDay` increments `totalDays` by 1.
   - Because `calculateDayOfWeek` only receives `absDay`, the weekday counter increments by 1 anyway! The festival day fails to "freeze" weekday progression, throwing off all subsequent months and breaking tenday alignment.

3. **Leap Rule Offset Calculation with Exclusion Intervals**:
   - Location: `src/renderer/utils/calendarMath.ts`, lines 26–46:
     In `isLeapYear`, when `offsetYear` and `excludeInterval` are combined, the modular arithmetic fails to properly align the exclusion cycle with the offset epoch.

---

## 2. Logic Chain

1. **Observation**: `PROJECT.md` line 68 and `ORIGINAL_REQUEST.md` line 32 specify that all automated test suites must pass 100% with 0 errors (`pnpm test`).
2. **Observation**: Executing `pnpm.cmd test` resulted in exit code 1 with 6 failing tests in `tests/e2e/calendar_math_adversarial.test.ts`.
3. **Observation**: The 6 test failures stem from verified bugs in `src/renderer/utils/calendarMath.ts`:
   - Historical negative year calculations (`calculateAbsoluteDay`) include a phantom Year 0, introducing a 365-day error for all negative dates.
   - Intercalary festival days with `advancesWeekday: false` fail to hold the weekday progression constant in `calculateDayOfWeek`.
   - Multi-tier leap rules with custom offsets miscalculate leap intervals.
4. **Observation**: In accordance with the Challenger protocol:
   - "Review-only — do NOT modify implementation code"
   - "Report any failures as findings — do NOT fix them yourself."
5. **Logic**: Although the celestial calculation and timeline fractional coordinates components tested by Challenger 2 function correctly (passing all 28 empirical stress tests in `tests/e2e/celestial_math_empirical.test.ts`), the overall codebase cannot be approved while core calendar date arithmetic contains active regressions that break `pnpm test`.
6. **Conclusion**: The worker must remediate the defects in `calendarMath.ts` so that both the baseline tests and the adversarial stress suites achieve a 100% pass rate.

---

## 3. Caveats

- **No Caveats Regarding Scope**: All assigned celestial mechanics (1 to 5 moons, incommensurable periods, syzygy conjunctions, fractional coordinates, hour resolution) have been empirically tested with dedicated generators and oracles.
- **Worker Fix Required**: As Challenger agents are strictly prohibited from editing implementation code in `src/`, the required fixes in `calendarMath.ts` must be performed by `worker_m4`.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

### Summary of Passed Verification
- `pnpm.cmd exec tsc --noEmit`: **PASS** (0 errors)
- `tests/e2e/calendar_math.test.ts`: **PASS** (38/38 tests passed)
- `tests/e2e/celestial_math_empirical.test.ts`: **PASS** (28/28 tests passed)
- `pnpm.cmd run build`: **PASS** (Clean build)

### Blocking Issues Requiring Worker Changes
1. **Fix Historical Reckoning Loop in `calculateAbsoluteDay`**:
   Skip `y = 0` when `!hasYearZero`:
   ```ts
   for (let y = year; y < epochYear; y++) {
     if (!hasYearZero && y === 0) continue
     totalDays -= getDaysInYear(y, config)
   }
   ```
2. **Support Non-advancing Weekdays in `calculateDayOfWeek` / `calculateAbsoluteDay`**:
   Either pass the date components to `calculateDayOfWeek` or compute an `absoluteWeekdayDay` that subtracts elapsed non-advancing intercalary festival days.
3. **Fix Multi-Tier Leap Rule Offset & Exclusion Logic**:
   Ensure `isLeapYear` respects `offsetYear` when evaluating both primary `interval` and `excludeInterval`.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Celestial & Timeline Stress Suite (Challenger 2)**:
   ```powershell
   pnpm.cmd exec vitest run tests/e2e/celestial_math_empirical.test.ts
   ```
   *Expected*: All 28 tests pass.

2. **Verify Calendar Math Adversarial Suite (Challenger 1)**:
   ```powershell
   pnpm.cmd exec vitest run tests/e2e/calendar_math_adversarial.test.ts
   ```
   *Expected*: 6 tests fail demonstrating the 3 root causes detailed above.

3. **Verify Full Application Test Suite**:
   ```powershell
   pnpm.cmd test
   ```
   *Expected*: Exit code 1 due to the 6 failing tests in `calendar_math_adversarial.test.ts`.

4. **Verify TypeScript & Production Build**:
   ```powershell
   pnpm.cmd exec tsc --noEmit
   pnpm.cmd run build
   ```
   *Expected*: Exit code 0 for both commands.
