import { describe, it, expect } from 'vitest'
import {
  WorldCalendarConfigExtended,
  CalendarLeapRule,
  IntercalaryDay,
  isLeapYear,
  getDaysInMonth,
  getDaysInYear,
  calculateAbsoluteDay,
  calculateDayOfWeek,
  countNonAdvancingIntercalaryDays,
  dateToFractionalYear,
  floorMod
} from './helpers/calendarMathHelper'

describe('Empirical Challenger: Calendar Date Mathematics Invariant & Stress Suite', () => {
  const createStandardConfig = (): WorldCalendarConfigExtended => ({
    firstYear: 1,
    lastYear: 1000,
    hoursInDay: 24,
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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
  // 1. STRICT DAY-BY-DAY CONTINUITY ACROSS BCE/CE TRANSITIONS
  // =========================================================================

  describe('1. BCE Multi-Year & Boundary Day-by-Day Strict Invariants', () => {
    it('S1.1: Every consecutive day across historical transition (-2 BCE -> -1 BCE -> 1 CE -> 2 CE) increases absDay by exactly 1', () => {
      const config = createStandardConfig()
      config.hasYearZero = false

      // Generate sequence of dates across 4 years
      const years = [-2, -1, 1, 2]
      let previousAbs: number | null = null

      for (const y of years) {
        for (let m = 1; m <= config.months.length; m++) {
          const daysInM = getDaysInMonth(y, m - 1, config)
          for (let d = 1; d <= daysInM; d++) {
            const abs = calculateAbsoluteDay(y, m, d, 0, config)
            if (previousAbs !== null) {
              const delta = abs - previousAbs
              expect(delta, `Gap or discontinuity between prior day and ${y}-${m}-${d}: delta was ${delta}`).toBe(1)
            }
            previousAbs = abs
          }
        }
      }
    })

    it('S1.2: Every consecutive day across astronomical transition (-2 -> -1 -> 0 -> 1 -> 2) increases absDay by exactly 1', () => {
      const config = createStandardConfig()
      config.hasYearZero = true

      const years = [-2, -1, 0, 1, 2]
      let previousAbs: number | null = null

      for (const y of years) {
        for (let m = 1; m <= config.months.length; m++) {
          const daysInM = getDaysInMonth(y, m - 1, config)
          for (let d = 1; d <= daysInM; d++) {
            const abs = calculateAbsoluteDay(y, m, d, 0, config)
            if (previousAbs !== null) {
              const delta = abs - previousAbs
              expect(delta, `Discontinuity in astronomical transition at ${y}-${m}-${d}`).toBe(1)
            }
            previousAbs = abs
          }
        }
      }
    })

    it('S1.3: Deep BCE historical accumulation check: Year -100 Jan 1 to Year 1 Jan 1 equals exact sum of days in all 100 BCE years', () => {
      const config = createStandardConfig()
      config.hasYearZero = false
      // Add a leap rule to make BCE years have varying lengths
      config.leapRules = [
        { id: 'quad', name: 'Quad', interval: 4, offsetYear: 0, extraDays: 1, targetMonthId: 'm2' }
      ]

      let expectedTotalBceDays = 0
      for (let y = -100; y <= -1; y++) {
        expectedTotalBceDays += getDaysInYear(y, config)
      }

      const dayYear1 = calculateAbsoluteDay(1, 1, 1, 0, config) // 0
      const dayYearNeg100 = calculateAbsoluteDay(-100, 1, 1, 0, config)

      expect(dayYear1).toBe(0)
      expect(dayYear1 - dayYearNeg100).toBe(expectedTotalBceDays)
      expect(dayYearNeg100).toBe(-expectedTotalBceDays)
    })
  })

  // =========================================================================
  // 2. CONSECUTIVE FESTIVALS, TENDAYS, CUSTOM WEEKS & NEGATIVE YEAR FESTIVALS
  // =========================================================================

  describe('2. Non-advancing Festivals, Consecutive Festivals & Custom Week Systems', () => {
    it('S2.1: Harptos Leap Year with TWO consecutive non-advancing festivals (Midsummer + Shieldmeet) preserves 1st tenday start', () => {
      // In Faerun Harptos, in a leap year:
      // Month 7 (Flamerule, 30 days) is followed by Midsummer (festival 1) AND Shieldmeet (leap festival 2).
      // Both are non-advancing!
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
        { id: 'f3_leap', name: 'Shieldmeet', occursAfterMonthId: 'h7', isLeapOnly: true, advancesWeekday: false },
        { id: 'f4', name: 'Highharvestide', occursAfterMonthId: 'h9', advancesWeekday: false },
        { id: 'f5', name: 'The Feast of the Moon', occursAfterMonthId: 'h11', advancesWeekday: false }
      ]

      const config: WorldCalendarConfigExtended = {
        firstYear: 1,
        lastYear: 2000,
        hoursInDay: 24,
        daysOfWeek: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'],
        months: harptosMonths,
        intercalaryDays: harptosFestivals,
        leapRules: [
          { id: 'shieldmeet-leap', name: 'Shieldmeet Quadrennial', interval: 4, offsetYear: 0, extraDays: 0, targetMonthId: 'h7' }
        ],
        hasYearZero: false,
        weekdayEpochOffset: 0
      }

      // Year 4 is a leap year (Shieldmeet occurs!)
      expect(isLeapYear(4, config)).toBe(true)
      expect(getDaysInYear(4, config)).toBe(366) // 360 + 6 festivals

      // Verify that Month 8 (Eleasis) still begins on '1st' (index 0) despite two back-to-back festivals
      for (let m = 1; m <= 12; m++) {
        const abs = calculateAbsoluteDay(4, m, 1, 0, config)
        const wk = calculateDayOfWeek(abs, config)
        expect(wk.index, `In leap year 4, Month ${m} must start on '1st' (index 0) but started on ${wk.name} (${wk.index})`).toBe(0)
      }
    })

    it('S2.2: Weekday progression with non-advancing festival in BCE negative years', () => {
      const config = createStandardConfig()
      config.intercalaryDays = [
        { id: 'midsummer', name: 'Midsummer', occursAfterMonthId: 'm6', advancesWeekday: false }
      ]

      // Test across year -1:
      // Day before Midsummer is Year -1 Month 6 Day 30
      const absBefore = calculateAbsoluteDay(-1, 6, 30, 0, config)
      // Day after Midsummer is Year -1 Month 7 Day 1
      const absAfter = calculateAbsoluteDay(-1, 7, 1, 0, config)

      // Abs day delta is 2 (30 -> Midsummer -> 1)
      expect(absAfter - absBefore).toBe(2)

      const wkBefore = calculateDayOfWeek(absBefore, config)
      const wkAfter = calculateDayOfWeek(absAfter, config)

      // Even in negative absolute days, weekday progression must freeze across Midsummer!
      const expectedNext = (wkBefore.index + 1) % config.daysOfWeek.length
      expect(wkAfter.index, `In BCE negative year, weekday freeze failed: before=${wkBefore.name}(${wkBefore.index}), after=${wkAfter.name}(${wkAfter.index})`).toBe(expectedNext)
    })

    it('S2.3: Custom 5-day week with non-zero weekdayEpochOffset and mixed advancing/non-advancing festivals', () => {
      const config: WorldCalendarConfigExtended = {
        firstYear: 1,
        lastYear: 100,
        hoursInDay: 24,
        daysOfWeek: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'], // 5-day week
        months: [
          { id: 'm1', name: 'First', days: 25 },
          { id: 'm2', name: 'Second', days: 25 }
        ],
        intercalaryDays: [
          // After M1: non-advancing festival
          { id: 'f-freeze', name: 'Freeze Day', occursAfterMonthId: 'm1', advancesWeekday: false }
        ],
        hasYearZero: false,
        weekdayEpochOffset: 3 // Starts at Delta (index 3)
      }

      // Day 1 Month 1 Day 1: abs = 0, offset = 3 -> index 3 (Delta)
      const d1 = calculateDayOfWeek(0, config)
      expect(d1.name).toBe('Delta')
      expect(d1.index).toBe(3)

      // M1 has 25 days (0 to 24).
      // Day 25 is M1 Day 25: abs = 24.
      // 24 + 3 = 27 = 2 mod 5 -> Gamma
      const dLastM1 = calculateDayOfWeek(calculateAbsoluteDay(1, 1, 25, 0, config), config)
      expect(dLastM1.name).toBe('Gamma') // (24 + 3) % 5 = 2

      // Day after Freeze Day is M2 Day 1:
      const dFirstM2 = calculateDayOfWeek(calculateAbsoluteDay(1, 2, 1, 0, config), config)
      // Progression should advance to immediate next: Delta (index 3)!
      expect(dFirstM2.name).toBe('Delta')
      expect(dFirstM2.index).toBe(3)
    })
  })

  // =========================================================================
  // 3. MULTI-TIER LEAP RULE OFFSET VARIATIONS & EXTREME BOUNDARIES
  // =========================================================================

  describe('3. Multi-Tier Leap Rule Offset Variations', () => {
    it('S3.1: Complex multi-tier rule with positive offsetYear (interval: 8, offsetYear: 5, excludeInterval: 40, reinstateInterval: 200)', () => {
      const config = createStandardConfig()
      config.leapRules = [
        {
          id: 'complex-offset',
          name: 'Complex Offset',
          interval: 8,
          offsetYear: 5,
          extraDays: 2,
          targetMonthId: 'm2',
          excludeInterval: 40,
          reinstateInterval: 200
        }
      ]

      // Base offset year: Year 5 -> adjustedYear = 0.
      // adjustedYear !== 0 prevents exclusion at year 5!
      expect(isLeapYear(5, config)).toBe(true)
      expect(getDaysInMonth(5, 1, config)).toBe(30) // 28 + 2

      // Year 13: 13 - 5 = 8. floorMod(8, 8) = 0. Not divisible by 40 -> leap
      expect(isLeapYear(13, config)).toBe(true)

      // Year 45: 45 - 5 = 40. Divisible by 40, not divisible by 200 -> excluded
      expect(isLeapYear(45, config)).toBe(false)
      expect(getDaysInMonth(45, 1, config)).toBe(28)

      // Year 205: 205 - 5 = 200. Divisible by 40 AND 200 -> reinstated!
      expect(isLeapYear(205, config)).toBe(true)
      expect(getDaysInMonth(205, 1, config)).toBe(30)

      // Negative direction:
      // Year -3: -3 - 5 = -8. floorMod(-8, 8) = 0. Not divisible by 40 -> leap
      expect(isLeapYear(-3, config)).toBe(true)

      // Year -35: -35 - 5 = -40. Divisible by 40, not by 200 -> excluded
      expect(isLeapYear(-35, config)).toBe(false)

      // Year -195: -195 - 5 = -200. Reinstated!
      expect(isLeapYear(-195, config)).toBe(true)
    })

    it('S3.2: Multi-tier rule with negative offsetYear (offsetYear: -7, interval: 4, excludeInterval: 20)', () => {
      const config = createStandardConfig()
      config.leapRules = [
        {
          id: 'neg-offset',
          name: 'Negative Offset',
          interval: 4,
          offsetYear: -7,
          extraDays: 1,
          targetMonthId: 'm2',
          excludeInterval: 20
        }
      ]

      // Base year: Year -7 -> adjustedYear = 0 -> leap
      expect(isLeapYear(-7, config)).toBe(true)

      // Year -3: -3 - (-7) = 4 -> leap
      expect(isLeapYear(-3, config)).toBe(true)

      // Year 1: 1 - (-7) = 8 -> leap
      expect(isLeapYear(1, config)).toBe(true)

      // Year 13: 13 - (-7) = 20 -> excluded!
      expect(isLeapYear(13, config)).toBe(false)
    })

    it('S3.3: Multiple leap rules targeting different months simultaneously', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'r1', name: 'Rule 1', interval: 3, offsetYear: 1, extraDays: 1, targetMonthId: 'm2' },
        { id: 'r2', name: 'Rule 2', interval: 5, offsetYear: 2, extraDays: 3, targetMonthId: 'm6' }
      ]

      // Year 7:
      // Rule 1: 7 - 1 = 6. 6 % 3 = 0 -> applies to m2 (+1)
      // Rule 2: 7 - 2 = 5. 5 % 5 = 0 -> applies to m6 (+3)
      expect(isLeapYear(7, config)).toBe(true)
      expect(getDaysInMonth(7, 1, config)).toBe(29) // 28 + 1
      expect(getDaysInMonth(7, 5, config)).toBe(33) // 30 + 3
      expect(getDaysInYear(7, config)).toBe(365 + 1 + 3) // 369
    })
  })

  // =========================================================================
  // 4. TIMELINE CONTINUOUS FRACTIONAL YEAR RESOLUTION
  // =========================================================================

  describe('4. Timeline Fractional Year Invariants', () => {
    it('S4.1: Fractional year is strictly monotonically increasing across consecutive days in both CE and BCE', () => {
      const config = createStandardConfig()
      const dates = [
        dateToFractionalYear(-2, 12, 30, 0, config),
        dateToFractionalYear(-2, 12, 31, 0, config),
        dateToFractionalYear(-1, 1, 1, 0, config),
        dateToFractionalYear(-1, 6, 15, 12, config),
        dateToFractionalYear(-1, 12, 31, 23, config),
        dateToFractionalYear(1, 1, 1, 0, config),
        dateToFractionalYear(1, 1, 1, 12, config),
        dateToFractionalYear(1, 1, 2, 0, config),
        dateToFractionalYear(2, 1, 1, 0, config)
      ]

      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i + 1], `Non-monotonic fractional year transition from ${dates[i]} to ${dates[i + 1]}`).toBeGreaterThan(dates[i])
      }
    })

    it('S4.2: Fractional year correctly normalizes for leap years with varying denominators', () => {
      const config = createStandardConfig()
      config.leapRules = [
        { id: 'quad', name: 'Quad', interval: 4, offsetYear: 0, extraDays: 5, targetMonthId: 'm2' }
      ]

      // Year 4 has 365 + 5 = 370 days
      expect(getDaysInYear(4, config)).toBe(370)
      // Month 1 has 31 days. Day 1 is doy = 0.
      expect(dateToFractionalYear(4, 1, 1, 0, config)).toBe(4.0)
      // Day 31 is doy = 30.
      expect(dateToFractionalYear(4, 1, 31, 0, config)).toBe(4 + 30 / 370)
      // Month 2 Day 1 is doy = 31.
      expect(dateToFractionalYear(4, 2, 1, 0, config)).toBe(4 + 31 / 370)
    })
  })
})
