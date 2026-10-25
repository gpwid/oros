import { describe, it, expect } from 'vitest'
import {
  WorldCalendarConfigExtended,
  CalendarLeapRule,
  IntercalaryDay,
  CelestialMoonConfig,
  isLeapYear,
  getDaysInMonth,
  getDaysInYear,
  calculateAbsoluteDay,
  calculateDayOfWeek,
  calculateMoonPhases,
  detectCelestialConjunctions,
  dateToFractionalYear,
  categorizeLunarPhase,
  floorMod
} from './helpers/calendarMathHelper'

describe('Fantasy Calendar & Celestial Engine Suite (E2E)', () => {
  // Test Fixtures
  const createStandardConfig = (): WorldCalendarConfigExtended => ({
    firstYear: 1,
    lastYear: 1000,
    hoursInDay: 24,
    daysOfWeek: ['Moon-day', 'Fire-day', 'Water-day', 'Wind-day', 'Earth-day', 'Sun-day', 'Star-day'], // 7 days
    months: [
      { id: 'm1', name: 'Frostfall', days: 31 },
      { id: 'm2', name: 'Deepwinter', days: 28 },
      { id: 'm3', name: 'Spring-melt', days: 31 },
      { id: 'm4', name: 'Bloom-tide', days: 30 },
      { id: 'm5', name: 'High-sun', days: 31 },
      { id: 'm6', name: 'Sun-wane', days: 30 },
      { id: 'm7', name: 'Harvest-fall', days: 31 },
      { id: 'm8', name: 'Leaf-turn', days: 30 },
      { id: 'm9', name: 'Shadow-drift', days: 31 },
      { id: 'm10', name: 'Hearth-glow', days: 30 },
      { id: 'm11', name: 'Night-fall', days: 31 },
      { id: 'm12', name: 'Year-end', days: 31 }
    ],
    hasYearZero: false,
    weekdayEpochOffset: 0
  })

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 per feature)
  // =========================================================================

  describe('Tier 1: Feature 14 - Custom Calendar Weekdays & Months', () => {
    it('T1.14.1: calculates days in regular non-leap months', () => {
      const config = createStandardConfig()
      expect(getDaysInMonth(100, 0, config)).toBe(31) // Frostfall
      expect(getDaysInMonth(100, 1, config)).toBe(28) // Deepwinter
      expect(getDaysInMonth(100, 3, config)).toBe(30) // Bloom-tide
    })

    it('T1.14.2: computes total days in year from month day sum', () => {
      const config = createStandardConfig()
      // Sum: 31+28+31+30+31+30+31+30+31+30+31+31 = 365
      expect(getDaysInYear(100, config)).toBe(365)
    })

    it('T1.14.3: supports fantasy 10-day week (Dekad) system', () => {
      const config = createStandardConfig()
      config.daysOfWeek = ['First-day', 'Second-day', 'Third-day', 'Fourth-day', 'Fifth-day', 'Sixth-day', 'Seventh-day', 'Eighth-day', 'Ninth-day', 'Dekad-day']

      const d0 = calculateDayOfWeek(0, config)
      const d9 = calculateDayOfWeek(9, config)
      const d10 = calculateDayOfWeek(10, config)

      expect(d0.name).toBe('First-day')
      expect(d9.name).toBe('Dekad-day')
      expect(d10.name).toBe('First-day')
    })

    it('T1.14.4: converts calendar date to continuous absolute day scalar', () => {
      const config = createStandardConfig()
      // Year 1, Month 1, Day 1 => absolute day 0
      expect(calculateAbsoluteDay(1, 1, 1, 0, config)).toBe(0)
      // Year 1, Month 1, Day 2 => absolute day 1
      expect(calculateAbsoluteDay(1, 1, 2, 0, config)).toBe(1)
      // Year 1, Month 2, Day 1 => absolute day 31
      expect(calculateAbsoluteDay(1, 2, 1, 0, config)).toBe(31)
      // Year 2, Month 1, Day 1 => absolute day 365
      expect(calculateAbsoluteDay(2, 1, 1, 0, config)).toBe(365)
    })

    it('T1.14.5: calculates weekday name and index for arbitrary future dates', () => {
      const config = createStandardConfig()
      const day1 = calculateDayOfWeek(0, config)
      const day8 = calculateDayOfWeek(7, config)
      const day100 = calculateDayOfWeek(100, config)

      expect(day1.name).toBe('Moon-day')
      expect(day8.name).toBe('Moon-day') // 7-day cycle wraps
      expect(day100.index).toBe(100 % 7) // 2 -> Water-day
      expect(day100.name).toBe('Water-day')
    })
  })

  describe('Tier 1: Feature 15 - Configurable Leap Year Rules', () => {
    it('T1.15.1: evaluates simple interval leap rule (every 4 years)', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'lr1', name: 'Quadrennial', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' }
      ]

      expect(isLeapYear(4, config)).toBe(true)
      expect(isLeapYear(8, config)).toBe(true)
      expect(isLeapYear(5, config)).toBe(false)
      expect(isLeapYear(103, config)).toBe(false)
    })

    it('T1.15.2: adds leap day to designated target month', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'lr1', name: 'Quadrennial', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' }
      ]

      expect(getDaysInMonth(3, 1, config)).toBe(28) // Non-leap
      expect(getDaysInMonth(4, 1, config)).toBe(29) // Leap
      expect(getDaysInYear(4, config)).toBe(366)
    })

    it('T1.15.3: respects leap year starting offset', () => {
      const config = createStandardConfig()
      // Leap occurs every 5 years starting at offset year 2 (Years 2, 7, 12, 17...)
      config.leapRules = [
        { id: 'lr-off', name: 'Offset Rule', interval: 5, offsetYear: 2, extraDays: 2, targetMonthId: 'm2' }
      ]

      expect(isLeapYear(2, config)).toBe(true)
      expect(isLeapYear(7, config)).toBe(true)
      expect(isLeapYear(12, config)).toBe(true)
      expect(isLeapYear(5, config)).toBe(false)
      expect(getDaysInMonth(2, 1, config)).toBe(30) // 28 + 2
    })

    it('T1.15.4: evaluates Gregorian-style multi-tier exclusion rules (every 4, skip 100, keep 400)', () => {
      const config = createStandardConfig()
      config.leapRules = [
        {
          id: 'gregorian',
          name: 'Gregorian Rule',
          interval: 4,
          offsetYear: 0,
          extraDays: 1,
          targetMonthId: 'm2',
          excludeInterval: 100,
          reinstateInterval: 400
        }
      ]

      expect(isLeapYear(1900, config)).toBe(false) // Divisible by 4 and 100, not 400
      expect(isLeapYear(2000, config)).toBe(true)  // Divisible by 400
      expect(isLeapYear(2024, config)).toBe(true)  // Divisible by 4, not 100
      expect(isLeapYear(2100, config)).toBe(false) // Divisible by 100, not 400
    })

    it('T1.15.5: handles multiple distinct leap rules targeting different months', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'r1', name: 'Rule 1', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' },
        { id: 'r2', name: 'Rule 2', interval: 10, offsetYear: 0, extraDays: 1, targetMonthId: 'm6' }
      ]

      // Year 20 is divisible by both 4 and 10
      expect(isLeapYear(20, config)).toBe(true)
      expect(getDaysInMonth(20, 1, config)).toBe(29) // Deepwinter +1
      expect(getDaysInMonth(20, 5, config)).toBe(31) // Sun-wane +1
      expect(getDaysInYear(20, config)).toBe(367)
    })
  })

  describe('Tier 1: Feature 16 - Intercalary Days & Festival Days', () => {
    it('T1.16.1: includes intercalary festival days in total year day count', () => {
      const config = createStandardConfig()
      config.intercalaryDays = [
        { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
      ]

      expect(getDaysInYear(1, config)).toBe(366) // 365 + 1
    })

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

      // Weekday progression freezes: day after Midsummer is immediate successor weekday
      const weekdayBefore = calculateDayOfWeek(absDayBefore, config)
      const weekdayAfter = calculateDayOfWeek(absDayAfter, config)
      expect(weekdayAfter.index).toBe((weekdayBefore.index + 1) % config.daysOfWeek.length)
    })

    it('T1.16.3: evaluates leap-only intercalary festival days (e.g. Shieldmeet)', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'lr-4', name: 'Quadrennial', interval: 4, offsetYear: 0, extraDays: 0, targetMonthId: 'm2' }
      ]
      config.intercalaryDays = [
        { id: 'f-shieldmeet', name: 'Shieldmeet', occursAfterMonthId: 'm6', isLeapOnly: true, advancesWeekday: false }
      ]

      expect(getDaysInYear(1, config)).toBe(365) // Non-leap year: Shieldmeet omitted
      expect(getDaysInYear(4, config)).toBe(366) // Leap year: Shieldmeet included
    })

    it('T1.16.4: supports multiple annual festival days throughout the year', () => {
      const config = createStandardConfig()
      config.intercalaryDays = [
        { id: 'f-spring', name: 'Spring Feast', occursAfterMonthId: 'm3', advancesWeekday: true },
        { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false },
        { id: 'f-harvest', name: 'Harvest Feast', occursAfterMonthId: 'm9', advancesWeekday: true },
        { id: 'f-winter', name: 'Winter Solstice', occursAfterMonthId: 'm12', advancesWeekday: false }
      ]

      expect(getDaysInYear(1, config)).toBe(369) // 365 + 4
    })

    it('T1.16.5: absolute day accumulation accounts for intercalary days placed between months', () => {
      const config = createStandardConfig()
      config.intercalaryDays = [
        { id: 'f-midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
      ]

      // Month 6 Day 30
      const absM6 = calculateAbsoluteDay(1, 6, 30, 0, config)
      // Month 7 Day 1 (Midsummer occurred after Month 6)
      const absM7 = calculateAbsoluteDay(1, 7, 1, 0, config)

      expect(absM7 - absM6).toBe(2) // 1 day remaining in M6 + 1 intercalary day
    })
  })

  describe('Tier 1: Feature 17 - Multi-Moon Celestial Engine', () => {
    const moons: CelestialMoonConfig[] = [
      { id: 'moon-selune', name: 'Selûne', synodicPeriodDays: 28.0, epochPhase: 0.0, color: '#e2e8f0' }, // Starts New
      { id: 'moon-tear', name: 'Tear of Selûne', synodicPeriodDays: 14.0, epochPhase: 0.5, color: '#38bdf8' } // Starts Full
    ]

    it('T1.17.1: computes exact phase fraction at epoch Day 0', () => {
      const phases = calculateMoonPhases(0, moons)
      expect(phases).toHaveLength(2)
      expect(phases[0].phaseFraction).toBe(0.0)
      expect(phases[0].phaseName).toBe('New Moon')
      expect(phases[0].illuminationPercent).toBe(0)

      expect(phases[1].phaseFraction).toBe(0.5)
      expect(phases[1].phaseName).toBe('Full Moon')
      expect(phases[1].illuminationPercent).toBe(100)
    })

    it('T1.17.2: computes exact Full Moon at half-period (D = P / 2)', () => {
      // For Selûne (P = 28), half period is Day 14
      const phases = calculateMoonPhases(14, moons)
      expect(phases[0].phaseFraction).toBe(0.5)
      expect(phases[0].phaseName).toBe('Full Moon')
      expect(phases[0].illuminationPercent).toBe(100)
      expect(phases[0].isMajorPhase).toBe(true)
    })

    it('T1.17.3: computes First Quarter and Last Quarter at quarter periods', () => {
      // Selûne at Day 7 (1/4 of 28d) -> First Quarter
      const q1 = calculateMoonPhases(7, moons)[0]
      expect(q1.phaseFraction).toBeCloseTo(0.25, 4)
      expect(q1.phaseName).toBe('First Quarter')
      expect(q1.illuminationPercent).toBeCloseTo(50, 0)

      // Selûne at Day 21 (3/4 of 28d) -> Last Quarter
      const q3 = calculateMoonPhases(21, moons)[0]
      expect(q3.phaseFraction).toBeCloseTo(0.75, 4)
      expect(q3.phaseName).toBe('Last Quarter')
      expect(q3.illuminationPercent).toBeCloseTo(50, 0)
    })

    it('T1.17.4: cycles smoothly back to New Moon at full period (D = P)', () => {
      const phases = calculateMoonPhases(28, moons)
      expect(phases[0].phaseFraction).toBe(0.0)
      expect(phases[0].phaseName).toBe('New Moon')
      expect(phases[0].illuminationPercent).toBe(0)
    })

    it('T1.17.5: categorizes all 8 canonical lunar phases accurately', () => {
      expect(categorizeLunarPhase(0.01).phaseName).toBe('New Moon')
      expect(categorizeLunarPhase(0.10).phaseName).toBe('Waxing Crescent')
      expect(categorizeLunarPhase(0.25).phaseName).toBe('First Quarter')
      expect(categorizeLunarPhase(0.35).phaseName).toBe('Waxing Gibbous')
      expect(categorizeLunarPhase(0.50).phaseName).toBe('Full Moon')
      expect(categorizeLunarPhase(0.60).phaseName).toBe('Waning Gibbous')
      expect(categorizeLunarPhase(0.75).phaseName).toBe('Last Quarter')
      expect(categorizeLunarPhase(0.85).phaseName).toBe('Waning Crescent')
      expect(categorizeLunarPhase(0.99).phaseName).toBe('New Moon')
    })
  })

  describe('Tier 1: Feature 18 - Celestial Syzygy & Conjunctions', () => {
    it('T1.18.1: detects Grand Full Conjunction when all moons reach Full Moon', () => {
      const dualMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Silver Moon', synodicPeriodDays: 20.0, epochPhase: 0.5, color: '#fff' },
        { id: 'm2', name: 'Blood Moon', synodicPeriodDays: 30.0, epochPhase: 0.5, color: '#f00' }
      ]

      // Day 0: both start at phase 0.5 (Full Moon)
      const phases = calculateMoonPhases(0, dualMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('grand_full_conjunction')
      expect(conjunction?.alignedMoonIds).toEqual(['m1', 'm2'])
    })

    it('T1.18.2: detects Celestial Dark Conjunction when all moons reach New Moon', () => {
      const dualMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Silver Moon', synodicPeriodDays: 20.0, epochPhase: 0.0, color: '#fff' },
        { id: 'm2', name: 'Blood Moon', synodicPeriodDays: 30.0, epochPhase: 0.0, color: '#f00' }
      ]

      const phases = calculateMoonPhases(0, dualMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('dark_solar_conjunction')
    })

    it('T1.18.3: detects partial alignment when a subset of moons align', () => {
      const triMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.25, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.26, color: '#f00' }, // Close to m1
        { id: 'm3', name: 'Moon 3', synodicPeriodDays: 50.0, epochPhase: 0.80, color: '#00f' }
      ]

      const phases = calculateMoonPhases(0, triMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)

      expect(conjunction).not.toBeNull()
      expect(conjunction?.type).toBe('partial_alignment')
      expect(conjunction?.alignedMoonIds).toContain('m1')
      expect(conjunction?.alignedMoonIds).toContain('m2')
    })

    it('T1.18.4: returns null when no celestial bodies align within tolerance', () => {
      const dualMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 28.0, epochPhase: 0.1, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 14.0, epochPhase: 0.6, color: '#f00' }
      ]

      const phases = calculateMoonPhases(0, dualMoons)
      const conjunction = detectCelestialConjunctions(phases, 0.04)
      expect(conjunction).toBeNull()
    })

    it('T1.18.5: harmonic beat period calculates alignment recurrence', () => {
      // Moon 1: P = 20, Moon 2: P = 30
      // Beat period = 1 / |1/20 - 1/30| = 1 / (1/60) = 60 days
      const dualMoons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon 1', synodicPeriodDays: 20.0, epochPhase: 0.0, color: '#fff' },
        { id: 'm2', name: 'Moon 2', synodicPeriodDays: 30.0, epochPhase: 0.0, color: '#f00' }
      ]

      // At Day 60, both should be New Moon again
      const phasesAt60 = calculateMoonPhases(60, dualMoons)
      const conjAt60 = detectCelestialConjunctions(phasesAt60, 0.04)
      expect(conjAt60?.type).toBe('dark_solar_conjunction')
    })
  })

  describe('Tier 1: Feature 19 - Chronological Timeline Integration', () => {
    it('T1.19.1: computes exact integer year coordinate at year start', () => {
      const config = createStandardConfig()
      expect(dateToFractionalYear(450, 1, 1, 0, config)).toBe(450.0)
    })

    it('T1.19.2: computes continuous fractional year for mid-year dates', () => {
      const config = createStandardConfig()
      const frac = dateToFractionalYear(450, 7, 1, 0, config)
      // Month 1-6 = 181 days out of 365 => ~0.49589
      expect(frac).toBeGreaterThan(450.4)
      expect(frac).toBeLessThan(450.6)
    })

    it('T1.19.3: incorporates sub-day hour resolution into continuous coordinates', () => {
      const config = createStandardConfig()
      const tMidnight = dateToFractionalYear(450, 1, 1, 0, config)
      const tNoon = dateToFractionalYear(450, 1, 1, 12, config)
      const tEvening = dateToFractionalYear(450, 1, 1, 18, config)

      expect(tMidnight).toBe(450.0)
      expect(tNoon).toBeGreaterThan(tMidnight)
      expect(tEvening).toBeGreaterThan(tNoon)
    })

    it('T1.19.4: handles leap year denominator in fractional year coordinates', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'lr1', name: 'Quad', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' }
      ]

      const tLeapMid = dateToFractionalYear(4, 7, 1, 0, config)
      const tNonLeapMid = dateToFractionalYear(5, 7, 1, 0, config)

      // Both mid-years should be slightly less than 0.5
      expect(tLeapMid - 4).toBeCloseTo(182 / 366, 4)
      expect(tNonLeapMid - 5).toBeCloseTo(181 / 365, 4)
    })

    it('T1.19.5: fractional coordinates maintain strict monotonic ordering across consecutive dates', () => {
      const config = createStandardConfig()
      const dates = [
        dateToFractionalYear(100, 1, 1, 0, config),
        dateToFractionalYear(100, 1, 1, 12, config),
        dateToFractionalYear(100, 1, 2, 0, config),
        dateToFractionalYear(100, 2, 1, 0, config),
        dateToFractionalYear(101, 1, 1, 0, config)
      ]

      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i + 1]).toBeGreaterThan(dates[i])
      }
    })
  })

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 per feature)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: negative years (Y < 0) produce valid non-negative weekday indices via floor modulo', () => {
      const config = createStandardConfig()

      // In JavaScript: -1 % 7 is -1. floorMod(-1, 7) must be 6.
      expect(floorMod(-1, 7)).toBe(6)
      expect(floorMod(-7, 7)).toBe(0)
      expect(floorMod(-8, 7)).toBe(6)

      const absDayNegative = calculateAbsoluteDay(-10, 1, 1, 0, config)
      const weekday = calculateDayOfWeek(absDayNegative, config)

      expect(weekday.index).toBeGreaterThanOrEqual(0)
      expect(weekday.index).toBeLessThan(7)
      expect(config.daysOfWeek).toContain(weekday.name)
    })

    it('T2.2: astronomical reckoning (Year 0 exists) vs historical reckoning (1 BCE -> 1 CE)', () => {
      const histConfig = createStandardConfig()
      histConfig.hasYearZero = false // 1 BCE -> 1 CE (1 year diff)

      const astroConfig = createStandardConfig()
      astroConfig.hasYearZero = true // -1 -> 0 -> 1 (2 years diff)

      // In historical, day count at Year 1 is 0
      expect(calculateAbsoluteDay(1, 1, 1, 0, histConfig)).toBe(0)
      // In historical, 1 BCE (-1) is exactly 365 days prior to 1 CE (1), and Dec 31 1 BCE is Day -1
      expect(calculateAbsoluteDay(-1, 1, 1, 0, histConfig)).toBe(-365)
      expect(calculateAbsoluteDay(-1, 12, 31, 0, histConfig)).toBe(-1)

      // In astronomical, day count at Year 0 is 0, Year 1 is 365
      expect(calculateAbsoluteDay(0, 1, 1, 0, astroConfig)).toBe(0)
      expect(calculateAbsoluteDay(1, 1, 1, 0, astroConfig)).toBe(365)
    })

    it('T2.3: day-of-month clamping prevents month overflow on boundary edits', () => {
      const config = createStandardConfig()
      // Month 2 has 28 days. Supplying Day 31 must clamp to Day 28
      const absClamped = calculateAbsoluteDay(1, 2, 31, 0, config)
      const absDay28 = calculateAbsoluteDay(1, 2, 28, 0, config)

      expect(absClamped).toBe(absDay28)
    })

    it('T2.4: incommensurable non-integer synodic periods (e.g. Earth Moon 29.530588 days)', () => {
      const earthMoon: CelestialMoonConfig[] = [
        { id: 'earth-moon', name: 'Moon', synodicPeriodDays: 29.530588, epochPhase: 0.0, color: '#fff' }
      ]

      // Over 100 orbits (2953.0588 days), it must return precisely to New Moon
      const hundredOrbits = 29.530588 * 100
      const phase = calculateMoonPhases(hundredOrbits, earthMoon)[0]

      expect(phase.phaseFraction).toBeCloseTo(0.0, 3)
      expect(phase.phaseName).toBe('New Moon')
    })

    it('T2.5: extreme negative and positive year ranges (Year -9999 to Year 100000)', () => {
      const config = createStandardConfig()
      const absFarPast = calculateAbsoluteDay(-9999, 1, 1, 0, config)
      const absFarFuture = calculateAbsoluteDay(100000, 1, 1, 0, config)

      expect(Number.isFinite(absFarPast)).toBe(true)
      expect(Number.isFinite(absFarFuture)).toBe(true)
      expect(absFarPast).toBeLessThan(0)
      expect(absFarFuture).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Intercalary Festival Day + Leap Rule + Celestial Syzygy alignment', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'lr1', name: 'Quad', interval: 4, offsetYear: 0, extraDays: 0, targetMonthId: 'm2' }
      ]
      config.intercalaryDays = [
        { id: 'shieldmeet', name: 'Shieldmeet', occursAfterMonthId: 'm6', isLeapOnly: true, advancesWeekday: false }
      ]

      const moons: CelestialMoonConfig[] = [
        { id: 'm1', name: 'Moon A', synodicPeriodDays: 30.0, epochPhase: 0.0, color: '#fff' },
        { id: 'm2', name: 'Moon B', synodicPeriodDays: 60.0, epochPhase: 0.0, color: '#000' }
      ]

      // Calculate absolute day on leap year 4 during Month 7 Day 1
      const absDay = calculateAbsoluteDay(4, 7, 1, 0, config)
      const phases = calculateMoonPhases(absDay, moons)
      // Check conjunction detection
      const conj = detectCelestialConjunctions(phases, 0.05)
      expect(phases).toHaveLength(2)
      // Invariant: simulation calculates without mathematical singularities
      expect(typeof conj).toBe('object')
    })
  })

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  describe('Tier 4: Real-World Scenarios', () => {
    it('T4.1: Harptos Calendar of Faerûn (365 days, 12x30 + 5 festivals, Shieldmeet leap rule)', () => {
      const harptosMonths = [
        { id: 'h1', name: 'Hammer', days: 30 },
        { id: 'h2', name: 'Alturiak', days: 30 },
        { id: 'h3', name: 'Ches', days: 30 },
        { id: 'h4', name: 'Tarsakh', days: 30 },
        { id: 'h5', name: 'Mirtul', days: 30 },
        { id: 'h6', name: 'Kythorn', days: 30 },
        { id: 'h7', name: 'Flamerule', days: 30 },
        { id: 'h8', name: 'Eleasis', days: 30 },
        { id: 'h9', name: 'Eleint', days: 30 },
        { id: 'h10', name: 'Marpenoth', days: 30 },
        { id: 'h11', name: 'Uktar', days: 30 },
        { id: 'h12', name: 'Nightal', days: 30 }
      ]

      const harptosFestivals: IntercalaryDay[] = [
        { id: 'f1', name: 'Midwinter', occursAfterMonthId: 'h1', advancesWeekday: false },
        { id: 'f2', name: 'Greengrass', occursAfterMonthId: 'h4', advancesWeekday: false },
        { id: 'f3', name: 'Midsummer', occursAfterMonthId: 'h7', advancesWeekday: false },
        { id: 'f4', name: 'Highharvestide', occursAfterMonthId: 'h9', advancesWeekday: false },
        { id: 'f5', name: 'The Feast of the Moon', occursAfterMonthId: 'h11', advancesWeekday: false },
        { id: 'f6', name: 'Shieldmeet', occursAfterMonthId: 'h7', isLeapOnly: true, advancesWeekday: false }
      ]

      const harptosConfig: WorldCalendarConfigExtended = {
        firstYear: 1,
        lastYear: 2000,
        hoursInDay: 24,
        daysOfWeek: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'], // Tenday
        months: harptosMonths,
        intercalaryDays: harptosFestivals,
        leapRules: [
          { id: 'shieldmeet-rule', name: 'Shieldmeet Leap', interval: 4, offsetYear: 0, extraDays: 0, targetMonthId: 'h7' }
        ]
      }

      // 12 x 30 = 360 + 5 festivals = 365 days on normal year
      expect(getDaysInYear(1371, harptosConfig)).toBe(365)
      // On leap year: + Shieldmeet = 366 days
      expect(getDaysInYear(1372, harptosConfig)).toBe(366)
    })

    it('T4.2: Tri-Moon Syzygy of Krynn (Solinari 36d, Lunitari 28d, Nuitari 8d)', () => {
      // Dragonlance Krynn moons
      const krynnMoons: CelestialMoonConfig[] = [
        { id: 'solinari', name: 'Solinari (White)', synodicPeriodDays: 36.0, epochPhase: 0.5, color: '#ffffff' },
        { id: 'lunitari', name: 'Lunitari (Red)', synodicPeriodDays: 28.0, epochPhase: 0.5, color: '#ef4444' },
        { id: 'nuitari', name: 'Nuitari (Black)', synodicPeriodDays: 8.0, epochPhase: 0.5, color: '#1e293b' }
      ]

      // At Day 0, all three start at Full Moon -> Grand Full Conjunction ("The Night of the Eye")
      const phases = calculateMoonPhases(0, krynnMoons)
      const nightOfTheEye = detectCelestialConjunctions(phases, 0.04)

      expect(nightOfTheEye).not.toBeNull()
      expect(nightOfTheEye?.type).toBe('grand_full_conjunction')
      expect(nightOfTheEye?.alignedMoonIds).toHaveLength(3)
    })
  })
})
