import { describe, it, expect } from 'vitest'
import {
  WorldCalendarConfigExtended,
  CelestialMoonConfig,
  IntercalaryDay,
  calculateMoonPhases,
  detectCelestialConjunctions,
  dateToFractionalYear,
  calculateAbsoluteDay,
  categorizeLunarPhase,
  floorMod,
  isLeapYear,
  getDaysInYear,
  getDaysInMonth
} from './helpers/calendarMathHelper'

describe('Empirical Celestial, Syzygy & Timeline Coordinates Challenge Suite', () => {
  // Helper to construct a standard calendar configuration
  const createBaseConfig = (): WorldCalendarConfigExtended => ({
    firstYear: 1,
    lastYear: 1000,
    hoursInDay: 24,
    daysOfWeek: ['Sol', 'Luna', 'Ares', 'Hermes', 'Zeus', 'Aphrodite', 'Kronos'],
    months: [
      { id: 'm1', name: 'Primus', days: 31 },
      { id: 'm2', name: 'Secundus', days: 28 },
      { id: 'm3', name: 'Tertius', days: 31 },
      { id: 'm4', name: 'Quartus', days: 30 },
      { id: 'm5', name: 'Quintus', days: 31 },
      { id: 'm6', name: 'Sextus', days: 30 },
      { id: 'm7', name: 'Septimus', days: 31 },
      { id: 'm8', name: 'Octavus', days: 31 },
      { id: 'm9', name: 'Nonus', days: 30 },
      { id: 'm10', name: 'Decimus', days: 31 },
      { id: 'm11', name: 'Undecimus', days: 30 },
      { id: 'm12', name: 'Duodecimus', days: 31 }
    ],
    leapRules: [
      { id: 'leap4', name: 'Quadrennial', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' }
    ],
    hasYearZero: false,
    weekdayEpochOffset: 0
  })

  // =========================================================================
  // FOCUS 1: MULTI-MOON SYSTEMS (1 TO 5 MOONS) WITH INCOMMENSURABLE SYNODIC PERIODS
  // =========================================================================

  describe('Focus 1: Multi-Moon Systems (1 to 5 Moons) & Incommensurable Periods', () => {
    it('1-Moon System: verifies Earth-Moon synodic cycle (29.530588 days) over 1,000 orbits', () => {
      const moon: CelestialMoonConfig = {
        id: 'earth-moon',
        name: 'Luna',
        synodicPeriodDays: 29.530588,
        epochPhase: 0.0,
        color: '#e2e8f0'
      }

      // Test epoch Day 0
      const phase0 = calculateMoonPhases(0, [moon])[0]
      expect(phase0.phaseFraction).toBe(0.0)
      expect(phase0.phaseName).toBe('New Moon')
      expect(phase0.illuminationPercent).toBe(0)
      expect(phase0.isMajorPhase).toBe(true)

      // Test over 1,000 orbits
      for (let orbit = 1; orbit <= 1000; orbit += 100) {
        const absDay = orbit * 29.530588
        const p = calculateMoonPhases(absDay, [moon])[0]
        // Should return to phase fraction 0.0 within floating point rounding
        const diffFromZero = Math.min(p.phaseFraction, 1.0 - p.phaseFraction)
        expect(diffFromZero).toBeLessThan(1e-4)
        expect(p.phaseName).toBe('New Moon')
        expect(p.illuminationPercent).toBeCloseTo(0, 0)
      }

      // Quarter orbits: 0.25 (First Quarter), 0.5 (Full Moon), 0.75 (Last Quarter)
      const q1Day = 29.530588 * 0.25
      const q1 = calculateMoonPhases(q1Day, [moon])[0]
      expect(q1.phaseFraction).toBeCloseTo(0.25, 4)
      expect(q1.phaseName).toBe('First Quarter')
      expect(q1.illuminationPercent).toBeCloseTo(50, 0)

      const fullDay = 29.530588 * 0.5
      const full = calculateMoonPhases(fullDay, [moon])[0]
      expect(full.phaseFraction).toBeCloseTo(0.50, 4)
      expect(full.phaseName).toBe('Full Moon')
      expect(full.illuminationPercent).toBeCloseTo(100, 0)

      const q3Day = 29.530588 * 0.75
      const q3 = calculateMoonPhases(q3Day, [moon])[0]
      expect(q3.phaseFraction).toBeCloseTo(0.75, 4)
      expect(q3.phaseName).toBe('Last Quarter')
      expect(q3.illuminationPercent).toBeCloseTo(50, 0)
    })

    it('2-Moon System: evaluates fast and slow moons with disparate synodic cycles', () => {
      const moons: CelestialMoonConfig[] = [
        { id: 'fast', name: 'Phobos-like', synodicPeriodDays: 7.25, epochPhase: 0.1, color: '#f59e0b' },
        { id: 'slow', name: 'Callisto-like', synodicPeriodDays: 45.8, epochPhase: 0.6, color: '#6366f1' }
      ]

      const day100 = calculateMoonPhases(100, moons)
      expect(day100).toHaveLength(2)

      // Fast moon at Day 100: phase = floorMod(0.1 + 100 / 7.25, 1.0)
      const expectedFast = floorMod(0.1 + 100 / 7.25, 1.0)
      expect(day100[0].phaseFraction).toBeCloseTo(expectedFast, 5)

      // Slow moon at Day 100: phase = floorMod(0.6 + 100 / 45.8, 1.0)
      const expectedSlow = floorMod(0.6 + 100 / 45.8, 1.0)
      expect(day100[1].phaseFraction).toBeCloseTo(expectedSlow, 5)
    })

    it('3-Moon System: verifies Dragonlance Krynn trio harmonic phase relations', () => {
      const krynnMoons: CelestialMoonConfig[] = [
        { id: 'solinari', name: 'Solinari', synodicPeriodDays: 36.0, epochPhase: 0.0, color: '#ffffff' },
        { id: 'lunitari', name: 'Lunitari', synodicPeriodDays: 28.0, epochPhase: 0.0, color: '#ef4444' },
        { id: 'nuitari', name: 'Nuitari', synodicPeriodDays: 8.0, epochPhase: 0.0, color: '#1e293b' }
      ]

      // LCM of (36, 28, 8):
      // 36 = 2^2 * 3^2
      // 28 = 2^2 * 7
      // 8 = 2^3
      // LCM = 2^3 * 3^2 * 7 = 8 * 9 * 7 = 504 days
      const phasesAt504 = calculateMoonPhases(504, krynnMoons)
      expect(phasesAt504[0].phaseFraction).toBeCloseTo(0.0, 5)
      expect(phasesAt504[1].phaseFraction).toBeCloseTo(0.0, 5)
      expect(phasesAt504[2].phaseFraction).toBeCloseTo(0.0, 5)

      // Grand Dark Conjunction at Day 504
      const conj = detectCelestialConjunctions(phasesAt504, 0.04)
      expect(conj?.type).toBe('dark_solar_conjunction')
      expect(conj?.alignedMoonIds).toHaveLength(3)
    })

    it('4-Moon System: handles complex irrational/incommensurable cycles without numeric breakdown', () => {
      const fourMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon Alpha', synodicPeriodDays: 11.23, epochPhase: 0.12, color: '#10b981' },
        { id: 'm2', name: 'Moon Beta', synodicPeriodDays: 19.87, epochPhase: 0.45, color: '#3b82f6' },
        { id: 'm3', name: 'Moon Gamma', synodicPeriodDays: 31.4159, epochPhase: 0.78, color: '#ec4899' },
        { id: 'm4', name: 'Moon Delta', synodicPeriodDays: 47.654, epochPhase: 0.02, color: '#8b5cf6' }
      ]

      // Step through 1,000 consecutive days and assert strict invariants
      for (let day = 0; day <= 1000; day += 25) {
        const phases = calculateMoonPhases(day, fourMoons)
        expect(phases).toHaveLength(4)
        for (const p of phases) {
          expect(p.phaseFraction).toBeGreaterThanOrEqual(0.0)
          expect(p.phaseFraction).toBeLessThan(1.0)
          expect(p.illuminationPercent).toBeGreaterThanOrEqual(0.0)
          expect(p.illuminationPercent).toBeLessThanOrEqual(100.0)
          expect(Number.isFinite(p.phaseAngleRad)).toBe(true)
          expect(['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']).toContain(p.phaseName)
        }
      }
    })

    it('5-Moon System: incommensurable synodic periods (29.53, 14.28, 41.333, 9.18, 63.45) stress test', () => {
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Astra', synodicPeriodDays: 29.53, epochPhase: 0.0, color: '#f8fafc' },
        { id: 'm2', name: 'Vesper', synodicPeriodDays: 14.28, epochPhase: 0.25, color: '#f59e0b' },
        { id: 'm3', name: 'Chronos', synodicPeriodDays: 41.333, epochPhase: 0.50, color: '#06b6d4' },
        { id: 'm4', name: 'Nyx', synodicPeriodDays: 9.18, epochPhase: 0.75, color: '#6366f1' },
        { id: 'm5', name: 'Titan', synodicPeriodDays: 63.45, epochPhase: 0.33, color: '#d946ef' }
      ]

      const startTime = performance.now()
      let invalidCount = 0
      // Simulate 5,000 steps of 5-moon calculations (25,000 moon phase evaluations)
      for (let d = 0; d < 5000; d += 5) {
        const phases = calculateMoonPhases(d, fiveMoons)
        if (phases.length !== 5) invalidCount++
        for (const p of phases) {
          if (p.phaseFraction < 0.0 || p.phaseFraction >= 1.0 || !Number.isFinite(p.illuminationPercent)) {
            invalidCount++
          }
        }
      }
      const duration = performance.now() - startTime
      expect(invalidCount).toBe(0)
      // Must compute 1,000 phase arrays (5,000 moon calculations) in under 200ms
      expect(duration).toBeLessThan(200)
    })

    it('handles negative absolute days (BCE reckoning) for celestial phases without negative remainder', () => {
      const moons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 28.0, epochPhase: 0.0, color: '#fff' }
      ]

      // Day -7: 7 days before epoch Day 0 (which was New Moon at 0.0).
      // Day -7 should be phase: floorMod(0 + (-7 / 28), 1.0) = floorMod(-0.25, 1.0) = 0.75 (Last Quarter)
      const p = calculateMoonPhases(-7, moons)[0]
      expect(p.phaseFraction).toBeCloseTo(0.75, 4)
      expect(p.phaseName).toBe('Last Quarter')
      expect(p.illuminationPercent).toBeCloseTo(50, 0)

      // Day -14: 14 days before epoch -> Full Moon (0.50)
      const pFull = calculateMoonPhases(-14, moons)[0]
      expect(pFull.phaseFraction).toBeCloseTo(0.50, 4)
      expect(pFull.phaseName).toBe('Full Moon')
      expect(pFull.illuminationPercent).toBeCloseTo(100, 0)
    })
  })

  // =========================================================================
  // FOCUS 2: MULTI-MOON SYZYGY & CONJUNCTION DETECTION
  // =========================================================================

  describe('Focus 2: Multi-Moon Syzygy & Conjunction Detection', () => {
    it('detects 5-Moon Grand Full Conjunction when all 5 moons reach Full Moon', () => {
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.50, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.49, color: '#fff' },
        { id: 'm3', name: 'Moon 3', synodicPeriodDays: 40.0, epochPhase: 0.51, color: '#fff' },
        { id: 'm4', name: 'Moon 4', synodicPeriodDays: 50.0, epochPhase: 0.48, color: '#fff' },
        { id: 'm5', name: 'Moon 5', synodicPeriodDays: 60.0, epochPhase: 0.52, color: '#fff' }
      ]

      const phases = calculateMoonPhases(0, fiveMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('grand_full_conjunction')
      expect(conjunction?.alignedMoonIds).toHaveLength(5)
      expect(conjunction?.severity).toBe(1.0)
      expect(conjunction?.description).toContain('All 5 celestial bodies')
    })

    it('detects 5-Moon Dark Solar Conjunction across 0.0 / 1.0 circular boundary', () => {
      // Moons clustered near New Moon with phase fractions wrapping around 0 and 1
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.01, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.02, color: '#fff' },
        { id: 'm3', name: 'Moon 3', synodicPeriodDays: 40.0, epochPhase: 0.99, color: '#fff' },
        { id: 'm4', name: 'Moon 4', synodicPeriodDays: 50.0, epochPhase: 0.98, color: '#fff' },
        { id: 'm5', name: 'Moon 5', synodicPeriodDays: 60.0, epochPhase: 0.00, color: '#fff' }
      ]

      const phases = calculateMoonPhases(0, fiveMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('dark_solar_conjunction')
      expect(conjunction?.alignedMoonIds).toHaveLength(5)
      expect(conjunction?.severity).toBe(1.0)
      expect(conjunction?.description).toContain('total solar conjunction')
    })

    it('detects Partial Alignment for 2 out of 5 moons while 3 moons are dispersed', () => {
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.35, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.36, color: '#fff' }, // Aligned with m1
        { id: 'm3', name: 'Moon 3', synodicPeriodDays: 40.0, epochPhase: 0.10, color: '#fff' },
        { id: 'm4', name: 'Moon 4', synodicPeriodDays: 50.0, epochPhase: 0.70, color: '#fff' },
        { id: 'm5', name: 'Moon 5', synodicPeriodDays: 60.0, epochPhase: 0.85, color: '#fff' }
      ]

      const phases = calculateMoonPhases(0, fiveMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('partial_alignment')
      expect(conjunction?.alignedMoonIds).toEqual(['m1', 'm2'])
      expect(conjunction?.severity).toBe(2 / 5)
    })

    it('detects Partial Alignment for 3 out of 5 moons (severity = 0.6)', () => {
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.20, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.21, color: '#fff' },
        { id: 'm3', name: 'Moon 3', synodicPeriodDays: 40.0, epochPhase: 0.22, color: '#fff' },
        { id: 'm4', name: 'Moon 4', synodicPeriodDays: 50.0, epochPhase: 0.75, color: '#fff' },
        { id: 'm5', name: 'Moon 5', synodicPeriodDays: 60.0, epochPhase: 0.90, color: '#fff' }
      ]

      const phases = calculateMoonPhases(0, fiveMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('partial_alignment')
      expect(conjunction?.alignedMoonIds).toContain('m1')
      expect(conjunction?.alignedMoonIds).toContain('m2')
      expect(conjunction?.alignedMoonIds).toContain('m3')
      expect(conjunction?.alignedMoonIds).not.toContain('m4')
      expect(conjunction?.alignedMoonIds).not.toContain('m5')
      expect(conjunction?.severity).toBe(3 / 5)
    })

    it('evaluates exact tolerance threshold boundaries (inside vs outside tolerance)', () => {
      // Pair with delta exactly 0.039 (inside 0.040)
      const insidePair: CelestialMoonConfig[] = [
        { id: 'a', name: 'A', synodicPeriodDays: 20.0, epochPhase: 0.200, color: '#fff' },
        { id: 'b', name: 'B', synodicPeriodDays: 20.0, epochPhase: 0.239, color: '#fff' }
      ]
      const conjInside = detectCelestialConjunctions(calculateMoonPhases(0, insidePair), 0.04)
      expect(conjInside).not.toBeNull()

      // Pair with delta 0.045 (strictly outside 0.040)
      const outsidePair: CelestialMoonConfig[] = [
        { id: 'c', name: 'C', synodicPeriodDays: 20.0, epochPhase: 0.200, color: '#fff' },
        { id: 'd', name: 'D', synodicPeriodDays: 20.0, epochPhase: 0.245, color: '#fff' }
      ]
      const conjOutside = detectCelestialConjunctions(calculateMoonPhases(0, outsidePair), 0.04)
      expect(conjOutside).toBeNull()
    })

    it('evaluates circular wrap-around tolerance boundary near 0.0 / 1.0', () => {
      // Moon A at 0.015, Moon B at 0.980 -> circular distance = 0.015 + 0.020 = 0.035 <= 0.040
      const wrapInside: CelestialMoonConfig[] = [
        { id: 'a', name: 'A', synodicPeriodDays: 20.0, epochPhase: 0.015, color: '#fff' },
        { id: 'b', name: 'B', synodicPeriodDays: 20.0, epochPhase: 0.980, color: '#fff' },
        { id: 'c', name: 'C', synodicPeriodDays: 20.0, epochPhase: 0.500, color: '#fff' }
      ]
      const conjWrap = detectCelestialConjunctions(calculateMoonPhases(0, wrapInside), 0.04)
      expect(conjWrap).not.toBeNull()
      expect(conjWrap?.alignedMoonIds).toContain('a')
      expect(conjWrap?.alignedMoonIds).toContain('b')
      expect(conjWrap?.alignedMoonIds).not.toContain('c')

      // Moon D at 0.060, Moon E at 0.900 -> circular distance = 0.060 + 0.100 = 0.160 > 0.040 (and neither in New Moon zone)
      const wrapOutside: CelestialMoonConfig[] = [
        { id: 'd', name: 'D', synodicPeriodDays: 20.0, epochPhase: 0.060, color: '#fff' },
        { id: 'e', name: 'E', synodicPeriodDays: 20.0, epochPhase: 0.900, color: '#fff' }
      ]
      const conjWrapOut = detectCelestialConjunctions(calculateMoonPhases(0, wrapOutside), 0.04)
      expect(conjWrapOut).toBeNull()
    })

    it('returns null when single moon or empty moon list is supplied', () => {
      const singleMoon: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Single Moon', synodicPeriodDays: 28.0, epochPhase: 0.5, color: '#fff' }
      ]
      expect(detectCelestialConjunctions([])).toBeNull()
      expect(detectCelestialConjunctions(calculateMoonPhases(0, singleMoon))).toBeNull()
    })
  })

  // =========================================================================
  // FOCUS 3: TIMELINE FRACTIONAL COORDINATES STRICT MONOTONICITY & BOUNDARY INVARIANTS
  // =========================================================================

  describe('Focus 3: Fractional Year Coordinates T = Y + DOY / daysInYear(Y)', () => {
    it('verifies strict monotonic ordering across consecutive days within non-leap year', () => {
      const config = createBaseConfig()
      const year = 101 // Non-leap year: 365 days
      expect(isLeapYear(year, config)).toBe(false)

      let prevT = -Infinity
      for (let m = 1; m <= config.months.length; m++) {
        const daysInMonth = getDaysInMonth(year, m - 1, config)
        for (let d = 1; d <= daysInMonth; d++) {
          const t = dateToFractionalYear(year, m, d, 0, config)
          expect(t).toBeGreaterThan(prevT)
          prevT = t
        }
      }

      // Year start is exact integer
      expect(dateToFractionalYear(year, 1, 1, 0, config)).toBe(101.0)
      // End of year approaches 102.0
      const endYearT = dateToFractionalYear(year, 12, 31, 23, config)
      expect(endYearT).toBeGreaterThan(101.99)
      expect(endYearT).toBeLessThan(102.0)
    })

    it('verifies strict monotonic ordering across consecutive days within leap year (366 days)', () => {
      const config = createBaseConfig()
      const year = 104 // Leap year: 366 days
      expect(isLeapYear(year, config)).toBe(true)
      expect(getDaysInMonth(year, 1, config)).toBe(29) // Secundus has 29 days

      let prevT = -Infinity
      for (let m = 1; m <= config.months.length; m++) {
        const daysInMonth = getDaysInMonth(year, m - 1, config)
        for (let d = 1; d <= daysInMonth; d++) {
          const t = dateToFractionalYear(year, m, d, 0, config)
          expect(t).toBeGreaterThan(prevT)
          prevT = t
        }
      }

      // Verify leap day (Month 2 Day 29) is ordered between Day 28 and Month 3 Day 1
      const tFeb28 = dateToFractionalYear(year, 2, 28, 0, config)
      const tFeb29 = dateToFractionalYear(year, 2, 29, 0, config)
      const tMar1 = dateToFractionalYear(year, 3, 1, 0, config)

      expect(tFeb29).toBeGreaterThan(tFeb28)
      expect(tMar1).toBeGreaterThan(tFeb29)
    })

    it('verifies strict monotonic ordering across leap to non-leap year boundary (Year 4 -> Year 5)', () => {
      const config = createBaseConfig()
      expect(isLeapYear(4, config)).toBe(true)
      expect(isLeapYear(5, config)).toBe(false)

      const tLastMomentLeap = dateToFractionalYear(4, 12, 31, 23.999, config)
      const tFirstMomentNonLeap = dateToFractionalYear(5, 1, 1, 0, config)

      expect(tFirstMomentNonLeap).toBe(5.0)
      expect(tFirstMomentNonLeap).toBeGreaterThan(tLastMomentLeap)
      expect(5.0 - tLastMomentLeap).toBeLessThan(0.001)
    })

    it('verifies strict monotonic ordering across non-leap to leap year boundary (Year 3 -> Year 4)', () => {
      const config = createBaseConfig()
      expect(isLeapYear(3, config)).toBe(false)
      expect(isLeapYear(4, config)).toBe(true)

      const tLastMomentNonLeap = dateToFractionalYear(3, 12, 31, 23.999, config)
      const tFirstMomentLeap = dateToFractionalYear(4, 1, 1, 0, config)

      expect(tFirstMomentLeap).toBe(4.0)
      expect(tFirstMomentLeap).toBeGreaterThan(tLastMomentNonLeap)
      expect(4.0 - tLastMomentNonLeap).toBeLessThan(0.001)
    })

    it('verifies monotonic advancement across intercalary festival days occurring mid-year', () => {
      const config = createBaseConfig()
      config.intercalaryDays = [
        { id: 'f-midsummer', name: 'Midsummer Festival', occursAfterMonthId: 'm6', advancesWeekday: false }
      ]

      // Month 6 Day 30 (last day of Sextus)
      const tM6Last = dateToFractionalYear(10, 6, 30, 12, config)
      // Month 7 Day 1 (first day of Septimus, after Midsummer)
      const tM7First = dateToFractionalYear(10, 7, 1, 0, config)

      // The jump from M6 D30 to M7 D1 spans 1.5 days because of Midsummer
      const daysInYear = getDaysInYear(10, config) // 365 + 1 = 366
      expect(daysInYear).toBe(366)

      const deltaDays = (tM7First - tM6Last) * daysInYear
      expect(deltaDays).toBeCloseTo(1.5, 4) // 0.5 day remaining in M6 + 1 day for Midsummer
      expect(tM7First).toBeGreaterThan(tM6Last)
    })

    it('verifies strict monotonicity for negative years across chronological sequence', () => {
      const config = createBaseConfig()

      const tNeg5Mid = dateToFractionalYear(-5, 6, 1, 0, config)
      const tNeg5End = dateToFractionalYear(-5, 12, 31, 0, config)
      const tNeg4Start = dateToFractionalYear(-4, 1, 1, 0, config)

      expect(tNeg5End).toBeGreaterThan(tNeg5Mid)
      expect(tNeg4Start).toBeGreaterThan(tNeg5End)
    })
  })

  // =========================================================================
  // FOCUS 4: HOUR-LEVEL RESOLUTION IN CALCULATEABSOLUTEDAY & DATETOFRACTIONALYEAR
  // =========================================================================

  describe('Focus 4: Hour-Level Resolution in Absolute Day & Fractional Year', () => {
    it('verifies hour-level precision in calculateAbsoluteDay (step = 1 / hoursInDay)', () => {
      const config = createBaseConfig()
      const hoursInDay = config.hoursInDay || 24

      for (let h = 0; h < 24; h++) {
        const absDay = calculateAbsoluteDay(1, 1, 1, h, config)
        expect(absDay).toBeCloseTo(h / hoursInDay, 6)

        if (h > 0) {
          const prevAbsDay = calculateAbsoluteDay(1, 1, 1, h - 1, config)
          expect(absDay - prevAbsDay).toBeCloseTo(1 / hoursInDay, 6)
        }
      }
    })

    it('verifies hour-level precision in dateToFractionalYear (step = 1 / (hoursInDay * daysInYear))', () => {
      const config = createBaseConfig()
      const year = 20
      const daysInYr = getDaysInYear(year, config)
      const hoursInDay = config.hoursInDay || 24

      const expectedHourStep = 1 / (hoursInDay * daysInYr)

      for (let h = 0; h < 24; h++) {
        const t = dateToFractionalYear(year, 1, 1, h, config)
        const expectedT = year + (h / hoursInDay) / daysInYr
        expect(t).toBeCloseTo(expectedT, 8)

        if (h > 0) {
          const prevT = dateToFractionalYear(year, 1, 1, h - 1, config)
          expect(t - prevT).toBeCloseTo(expectedHourStep, 8)
        }
      }
    })

    it('supports non-standard fantasy hours per day (e.g., 30 hours per day)', () => {
      const config = createBaseConfig()
      config.hoursInDay = 30 // Fantasy planet with 30-hour diurnal rotation

      const absDayNoon = calculateAbsoluteDay(1, 1, 1, 15, config)
      expect(absDayNoon).toBe(0.5)

      const tMidday = dateToFractionalYear(1, 1, 1, 15, config)
      expect(tMidday - 1).toBeCloseTo(0.5 / 365, 8)

      // 30 hours advances 1 full day
      const absDayNext = calculateAbsoluteDay(1, 1, 1, 30, config)
      expect(absDayNext).toBe(1.0)
    })

    it('ensures hour progression maintains monotonic continuity at month transition midnight', () => {
      const config = createBaseConfig()

      // Month 1 Day 31 Hour 23
      const absM1LastHour = calculateAbsoluteDay(1, 1, 31, 23, config)
      // Month 2 Day 1 Hour 0
      const absM2FirstHour = calculateAbsoluteDay(1, 2, 1, 0, config)

      // Difference should be exactly 1 hour (1 / 24 of a day)
      expect(absM2FirstHour - absM1LastHour).toBeCloseTo(1 / 24, 6)

      // Fractional year counterpart
      const tM1LastHour = dateToFractionalYear(1, 1, 31, 23, config)
      const tM2FirstHour = dateToFractionalYear(1, 2, 1, 0, config)
      expect(tM2FirstHour - tM1LastHour).toBeCloseTo(1 / (24 * 365), 8)
      expect(tM2FirstHour).toBeGreaterThan(tM1LastHour)
    })
  })

  // =========================================================================
  // FOCUS 5: HARMONIC BEAT AND ECLIPSE PREDICTION ORACLE
  // =========================================================================

  describe('Focus 5: Harmonic Beat & Alignment Recurrence Oracle', () => {
    it('accurately predicts periodic conjunction recurrences for commensurable moon pairs', () => {
      // Moon 1: P = 12 days, starts New (phase 0.0)
      // Moon 2: P = 18 days, starts New (phase 0.0)
      // Synodic beat period = 1 / |1/12 - 1/18| = 1 / (1/36) = 36 days.
      const pair: CelestialMoonConfig[] = [
        { id: 'm12', name: 'Moon 12', synodicPeriodDays: 12.0, epochPhase: 0.0, color: '#fff' },
        { id: 'm18', name: 'Moon 18', synodicPeriodDays: 18.0, epochPhase: 0.0, color: '#000' }
      ]

      // At Day 0: Conjunction (New Moon)
      const conj0 = detectCelestialConjunctions(calculateMoonPhases(0, pair), 0.04)
      expect(conj0?.type).toBe('dark_solar_conjunction')

      // At Day 12: Moon 1 is phase 0, Moon 2 is 12/18 = 0.667 -> No conjunction
      const conj12 = detectCelestialConjunctions(calculateMoonPhases(12, pair), 0.04)
      expect(conj12).toBeNull()

      // At Day 18: Moon 1 is 18/12 = 0.5 (Full), Moon 2 is phase 0 -> No conjunction
      const conj18 = detectCelestialConjunctions(calculateMoonPhases(18, pair), 0.04)
      expect(conj18).toBeNull()

      // At Day 36: Moon 1 is 36/12 = 3 cycles (phase 0), Moon 2 is 36/18 = 2 cycles (phase 0) -> Conjunction!
      const conj36 = detectCelestialConjunctions(calculateMoonPhases(36, pair), 0.04)
      expect(conj36?.type).toBe('dark_solar_conjunction')

      // At Day 72: Conjunction!
      const conj72 = detectCelestialConjunctions(calculateMoonPhases(72, pair), 0.04)
      expect(conj72?.type).toBe('dark_solar_conjunction')

      // At Day 108: Conjunction!
      const conj108 = detectCelestialConjunctions(calculateMoonPhases(108, pair), 0.04)
      expect(conj108?.type).toBe('dark_solar_conjunction')
    })
  })

  // =========================================================================
  // FOCUS 6: ADVERSARIAL BOUNDARY EDGE CASES & FUZZ STRESS HARNESS
  // =========================================================================

  describe('Focus 6: Adversarial Edge Cases & Fuzz Stress Harness', () => {
    it('gracefully handles zero or negative synodic period without division by zero or NaN', () => {
      const zeroMoon: CelestialMoonConfig[] = [
        { id: 'zero', name: 'Zero Period', synodicPeriodDays: 0, epochPhase: 0.5, color: '#fff' },
        { id: 'neg', name: 'Negative Period', synodicPeriodDays: -10, epochPhase: 0.2, color: '#fff' }
      ]

      const phases = calculateMoonPhases(100, zeroMoon)
      expect(phases).toHaveLength(2)
      for (const p of phases) {
        expect(Number.isFinite(p.phaseFraction)).toBe(true)
        expect(Number.isFinite(p.phaseAngleRad)).toBe(true)
        expect(Number.isFinite(p.illuminationPercent)).toBe(true)
        expect(p.phaseFraction).toBeGreaterThanOrEqual(0.0)
        expect(p.phaseFraction).toBeLessThan(1.0)
      }
    })

    it('correctly handles 4 out of 5 moons at Full Moon with 1 moon at New Moon', () => {
      const fiveMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'M1', synodicPeriodDays: 20.0, epochPhase: 0.50, color: '#fff' },
        { id: 'm2', name: 'M2', synodicPeriodDays: 20.0, epochPhase: 0.51, color: '#fff' },
        { id: 'm3', name: 'M3', synodicPeriodDays: 20.0, epochPhase: 0.49, color: '#fff' },
        { id: 'm4', name: 'M4', synodicPeriodDays: 20.0, epochPhase: 0.50, color: '#fff' },
        { id: 'm5', name: 'M5', synodicPeriodDays: 20.0, epochPhase: 0.00, color: '#fff' } // New Moon
      ]

      const phases = calculateMoonPhases(0, fiveMoons)
      const conj = detectCelestialConjunctions(phases, 0.04)

      expect(conj).not.toBeNull()
      expect(conj?.type).toBe('partial_alignment')
      expect(conj?.alignedMoonIds).toEqual(['m1', 'm2', 'm3', 'm4'])
      expect(conj?.severity).toBe(4 / 5)
      expect(conj?.alignedMoonIds).not.toContain('m5')
    })

    it('handles fractional hour resolution (e.g., 14.5 hours = 2:30 PM) monotonically', () => {
      const config = createBaseConfig()
      const t1 = dateToFractionalYear(50, 6, 15, 14.0, config)
      const t2 = dateToFractionalYear(50, 6, 15, 14.5, config)
      const t3 = dateToFractionalYear(50, 6, 15, 15.0, config)

      expect(t2).toBeGreaterThan(t1)
      expect(t3).toBeGreaterThan(t2)
      expect(t2 - t1).toBeCloseTo(t3 - t2, 10)
    })

    it('Fuzz Test: executes 200 random celestial configurations across extreme BCE/CE epochs', () => {
      for (let run = 0; run < 200; run++) {
        const numMoons = 1 + (run % 5) // 1 to 5 moons
        const moons: CelestialMoonConfig[] = []
        for (let m = 0; m < numMoons; m++) {
          moons.push({
            id: `fuzz-m${m}`,
            name: `Fuzz Moon ${m}`,
            synodicPeriodDays: 0.5 + Math.random() * 80.0, // 0.5 to 80.5 days
            epochPhase: Math.random() * 2.0 - 1.0, // -1.0 to 1.0
            color: '#fff'
          })
        }

        // Random absolute day between -50,000 and +50,000
        const randDay = (Math.random() - 0.5) * 100000
        const phases = calculateMoonPhases(randDay, moons)

        expect(phases).toHaveLength(numMoons)
        for (const p of phases) {
          expect(p.phaseFraction).toBeGreaterThanOrEqual(0.0)
          expect(p.phaseFraction).toBeLessThan(1.0)
          expect(p.illuminationPercent).toBeGreaterThanOrEqual(0.0)
          expect(p.illuminationPercent).toBeLessThanOrEqual(100.0)
          expect(Number.isFinite(p.phaseAngleRad)).toBe(true)
        }

        const conj = detectCelestialConjunctions(phases, 0.04)
        if (conj) {
          expect(['grand_full_conjunction', 'dark_solar_conjunction', 'partial_alignment']).toContain(conj.type)
          expect(conj.alignedMoonIds.length).toBeGreaterThanOrEqual(2)
          expect(conj.severity).toBeGreaterThan(0)
          expect(conj.severity).toBeLessThanOrEqual(1.0)
        }
      }
    })
  })
})

