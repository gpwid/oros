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
  floorMod
} from './helpers/calendarMathHelper'

describe('Calendar Date Mathematics Adversarial Stress Test Suite', () => {
  const createStandardConfig = (): WorldCalendarConfigExtended => ({
    firstYear: 1,
    lastYear: 1000,
    hoursInDay: 24,
    daysOfWeek: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    months: [
      { id: 'm1', name: 'Month 1', days: 31 },
      { id: 'm2', name: 'Month 2', days: 28 },
      { id: 'm3', name: 'Month 3', days: 31 },
      { id: 'm4', name: 'Month 4', days: 30 },
      { id: 'm5', name: 'Month 5', days: 31 },
      { id: 'm6', name: 'Month 6', days: 30 },
      { id: 'm7', name: 'Month 7', days: 31 },
      { id: 'm8', name: 'Month 8', days: 31 },
      { id: 'm9', name: 'Month 9', days: 30 },
      { id: 'm10', name: 'Month 10', days: 31 },
      { id: 'm11', name: 'Month 11', days: 30 },
      { id: 'm12', name: 'Month 12', days: 31 }
    ],
    hasYearZero: false,
    weekdayEpochOffset: 0
  })

  // =========================================================================
  // FOCUS 1: HISTORICAL RECKONING (YEAR 0 SKIPPED) vs ASTRONOMICAL RECKONING
  // =========================================================================

  describe('Focus 1: Historical Reckoning (Year 0 Skipped: 1 BCE -> 1 CE)', () => {
    it('F1.1: Historical reckoning day delta between 1 BCE (-1) and 1 CE (1) must equal exactly 1 year of days', () => {
      const config = createStandardConfig()
      config.hasYearZero = false

      const daysInYear1BCE = getDaysInYear(-1, config) // 365 days
      const day1CE = calculateAbsoluteDay(1, 1, 1, 0, config) // Epoch anchor: 0
      const day1BCE = calculateAbsoluteDay(-1, 1, 1, 0, config)

      const actualDelta = day1CE - day1BCE

      // In historical reckoning, Year 0 does not exist.
      // Day 1 of 1 CE is immediately preceded by the last day of 1 BCE.
      // Therefore, the delta between 1 BCE Jan 1 and 1 CE Jan 1 MUST be exactly daysInYear1BCE (365 days).
      console.log(`[Historical Reckoning Delta] Day 1 CE = ${day1CE}, Day 1 BCE = ${day1BCE}, Delta = ${actualDelta}, Expected = ${daysInYear1BCE}`)
      expect(actualDelta).toBe(daysInYear1BCE)
    })

    it('F1.2: Last day of 1 BCE (-1 Month 12 Day 31) must immediately precede First day of 1 CE (1 Month 1 Day 1)', () => {
      const config = createStandardConfig()
      config.hasYearZero = false

      const firstDay1CE = calculateAbsoluteDay(1, 1, 1, 0, config) // 0
      const lastDay1BCE = calculateAbsoluteDay(-1, 12, 31, 0, config)

      // The day before day 0 MUST be day -1
      console.log(`[Historical Reckoning Transition] First Day 1 CE = ${firstDay1CE}, Last Day 1 BCE = ${lastDay1BCE}, Expected = -1`)
      expect(lastDay1BCE).toBe(-1)
      expect(firstDay1CE - lastDay1BCE).toBe(1)
    })

    it('F1.3: Astronomical reckoning (hasYearZero: true) correctly accounts for Year 0 between Year -1 and Year 1', () => {
      const config = createStandardConfig()
      config.hasYearZero = true

      const dayYear1 = calculateAbsoluteDay(1, 1, 1, 0, config)
      const dayYear0 = calculateAbsoluteDay(0, 1, 1, 0, config)
      const dayYearNeg1 = calculateAbsoluteDay(-1, 1, 1, 0, config)

      expect(dayYear0).toBe(0)
      expect(dayYear1).toBe(365)
      expect(dayYearNeg1).toBe(-365)
      expect(dayYear1 - dayYearNeg1).toBe(730) // 2 full years: Year -1 and Year 0
    })

    it('F1.4: Multi-year negative historical reckoning (Year -2, Year -3) does not accumulate extra phantom years', () => {
      const config = createStandardConfig()
      config.hasYearZero = false

      const day1CE = calculateAbsoluteDay(1, 1, 1, 0, config) // 0
      const day2BCE = calculateAbsoluteDay(-2, 1, 1, 0, config) // 2 years before 1 CE = 730 days
      const day3BCE = calculateAbsoluteDay(-3, 1, 1, 0, config) // 3 years before 1 CE = 1095 days

      console.log(`[Historical Multi-Year] Day 2 BCE = ${day2BCE} (expected -730), Day 3 BCE = ${day3BCE} (expected -1095)`)
      expect(day1CE - day2BCE).toBe(365 * 2)
      expect(day1CE - day3BCE).toBe(365 * 3)
    })
  })

  // =========================================================================
  // FOCUS 2: INTERCALARY FESTIVAL DAYS AND WEEKDAY PROGRESSION FREEZING
  // =========================================================================

  describe('Focus 2: Intercalary Festival Days and Weekday Progression', () => {
    it('F2.1: Non-advancing intercalary festival day freezes weekday progression', () => {
      const config = createStandardConfig()
      config.intercalaryDays = [
        { id: 'midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
      ]

      // Month 6 Day 30 is the last day of month 6
      const absBefore = calculateAbsoluteDay(1, 6, 30, 0, config)
      const weekdayBefore = calculateDayOfWeek(absBefore, config)

      // Month 7 Day 1 is immediately after Midsummer
      const absAfter = calculateAbsoluteDay(1, 7, 1, 0, config)
      const weekdayAfter = calculateDayOfWeek(absAfter, config)

      console.log(`[Festival Weekday Freeze] Before: Day ${weekdayBefore.index} (${weekdayBefore.name}), After: Day ${weekdayAfter.index} (${weekdayAfter.name})`)

      // If Midsummer is outside the weekly cycle (advancesWeekday: false),
      // then weekdayAfter.index MUST be (weekdayBefore.index + 1) % weekLength.
      // E.g. if before was Day 5 (index 4), after must be Day 6 (index 5), NOT skipping to Day 7.
      const expectedNextIndex = (weekdayBefore.index + 1) % config.daysOfWeek.length
      expect(weekdayAfter.index).toBe(expectedNextIndex)
    })

    it('F2.2: Harptos Tenday Calendar maintains 1st day-of-tenday alignment across all 12 months', () => {
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
        { id: 'f5', name: 'The Feast of the Moon', occursAfterMonthId: 'h11', advancesWeekday: false }
      ]

      const harptosConfig: WorldCalendarConfigExtended = {
        firstYear: 1,
        lastYear: 2000,
        hoursInDay: 24,
        daysOfWeek: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'], // Tenday (10 days)
        months: harptosMonths,
        intercalaryDays: harptosFestivals,
        hasYearZero: false,
        weekdayEpochOffset: 0
      }

      // In Harptos, every month has 30 days = 3 tendays.
      // Because all 5 annual festivals do NOT advance the tenday,
      // EVERY single month (Month 1 through Month 12) MUST begin on '1st' (weekday index 0)!
      const monthStartWeekdays: { month: number; index: number; name: string }[] = []
      for (let m = 1; m <= 12; m++) {
        const abs = calculateAbsoluteDay(1371, m, 1, 0, harptosConfig)
        const wk = calculateDayOfWeek(abs, harptosConfig)
        monthStartWeekdays.push({ month: m, index: wk.index, name: wk.name })
      }

      console.log('[Harptos Month Starts]:', monthStartWeekdays)
      for (const entry of monthStartWeekdays) {
        expect(entry.index, `Month ${entry.month} should start on '1st' (index 0) but started on ${entry.name} (index ${entry.index})`).toBe(0)
      }
    })
  })

  // =========================================================================
  // FOCUS 3: MULTI-TIER LEAP RULES & YEAR 0 / NEGATIVE YEARS
  // =========================================================================

  describe('Focus 3: Multi-tier Leap Rules', () => {
    it('F3.1: Gregorian multi-tier rule correctly evaluates Year 0, positive and negative century years', () => {
      const config = createStandardConfig()
      config.leapRules = [
        {
          id: 'gregorian',
          name: 'Gregorian',
          interval: 4,
          offsetYear: 0,
          extraDays: 1,
          targetMonthId: 'm2',
          excludeInterval: 100,
          reinstateInterval: 400
        }
      ]

      // Astronomical Year 0 is divisible by 400 -> leap
      expect(isLeapYear(0, config)).toBe(true)

      // Positive century rules
      expect(isLeapYear(1600, config)).toBe(true)
      expect(isLeapYear(1700, config)).toBe(false)
      expect(isLeapYear(1800, config)).toBe(false)
      expect(isLeapYear(1900, config)).toBe(false)
      expect(isLeapYear(2000, config)).toBe(true)
      expect(isLeapYear(2024, config)).toBe(true)
      expect(isLeapYear(2025, config)).toBe(false)

      // Negative century rules (Euclidean modulo)
      expect(isLeapYear(-400, config)).toBe(true)
      expect(isLeapYear(-300, config)).toBe(false)
      expect(isLeapYear(-200, config)).toBe(false)
      expect(isLeapYear(-100, config)).toBe(false)
      expect(isLeapYear(-4, config)).toBe(true)
      expect(isLeapYear(-1, config)).toBe(false)
    })

    it('F3.2: Custom offset with exclusion and negative years', () => {
      const config = createStandardConfig()
      // Leap every 6 years with offset 2 (Years 2, 8, 14, 20...), exclude every 30
      config.leapRules = [
        {
          id: 'custom-leap',
          name: 'Custom',
          interval: 6,
          offsetYear: 2,
          extraDays: 2,
          targetMonthId: 'm2',
          excludeInterval: 30
        }
      ]

      expect(isLeapYear(2, config)).toBe(true)
      expect(isLeapYear(8, config)).toBe(true)
      expect(isLeapYear(14, config)).toBe(true)
      // Year 32: 32 - 2 = 30. Divisible by 30 -> excluded
      expect(isLeapYear(32, config)).toBe(false)

      // Negative side: Year -4: -4 - 2 = -6. floorMod(-6, 6) === 0. floorMod(-6, 30) = 24 !== 0 -> leap
      expect(isLeapYear(-4, config)).toBe(true)
      // Year -28: -28 - 2 = -30. floorMod(-30, 30) === 0 -> excluded
      expect(isLeapYear(-28, config)).toBe(false)
    })
  })

  // =========================================================================
  // FOCUS 4: EUCLIDEAN MODULO INVARIANTS & EXTREME YEAR RANGES (-10,000 to +10,000)
  // =========================================================================

  describe('Focus 4: Euclidean Modulo & Extreme Year Ranges', () => {
    it('F4.1: floorMod satisfies 0 <= floorMod(n, m) < m across entire range [-10000, 10000]', () => {
      const testCases = [-10000, -9999, -701, -7, -6, -1, 0, 1, 6, 7, 701, 9999, 10000]
      const divisors = [7, 10, 12, 28, 30, 100, 365]

      for (const n of testCases) {
        for (const m of divisors) {
          const mod = floorMod(n, m)
          expect(mod).toBeGreaterThanOrEqual(0)
          expect(mod).toBeLessThan(m)
          // Mathematical Euclidean invariant: n - mod is divisible by m
          expect(floorMod(n - mod, m)).toBe(0)
        }
      }
    })

    it('F4.2: Absolute day monotonicity across extreme range [-10000 to +10000]', () => {
      const config = createStandardConfig()
      config.hasYearZero = true

      const yearsToTest = [-10000, -5000, -1000, -100, -1, 0, 1, 100, 1000, 5000, 10000]
      let prevAbs = -Infinity

      for (const y of yearsToTest) {
        const abs = calculateAbsoluteDay(y, 1, 1, 0, config)
        expect(abs).toBeGreaterThan(prevAbs)
        prevAbs = abs
      }
    })

    it('F4.3: Month boundary clamping clamps dayOfMonth and monthIndex to valid ranges', () => {
      const config = createStandardConfig()

      // Clamp month > 12
      const absMonth13 = calculateAbsoluteDay(1, 15, 1, 0, config)
      const absMonth12 = calculateAbsoluteDay(1, 12, 1, 0, config)
      expect(absMonth13).toBe(absMonth12)

      // Clamp month < 1
      const absMonth0 = calculateAbsoluteDay(1, 0, 1, 0, config)
      const absMonth1 = calculateAbsoluteDay(1, 1, 1, 0, config)
      expect(absMonth0).toBe(absMonth1)

      // Clamp day > daysInMonth
      const absDay40 = calculateAbsoluteDay(1, 2, 40, 0, config) // Month 2 has 28 days
      const absDay28 = calculateAbsoluteDay(1, 2, 28, 0, config)
      expect(absDay40).toBe(absDay28)

      // Clamp day < 1
      const absDayNeg = calculateAbsoluteDay(1, 2, -5, 0, config)
      const absDay1 = calculateAbsoluteDay(1, 2, 1, 0, config)
      expect(absDayNeg).toBe(absDay1)
    })
  })
})
