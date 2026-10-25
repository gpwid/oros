import {
  WorldCalendarConfig,
  WorldCalendarConfigExtended,
  CalendarLeapRule,
  IntercalaryDay,
  CelestialMoonConfig,
  CelestialPhaseResult,
  ConjunctionResult
} from '@shared/types'

/**
 * Floor modulo utility ensuring positive results even for negative dividends.
 * E.g., floorMod(-1, 7) === 6.
 */
export function floorMod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/**
 * Evaluates whether a given year is a leap year according to multi-tier rules.
 */
export function isLeapYear(year: number, config: WorldCalendarConfigExtended): boolean {
  const rules = config.leapRules || []
  if (rules.length === 0) return false

  return rules.some(rule => {
    const adjustedYear = year - (rule.offsetYear || 0)

    // Check primary interval
    if (floorMod(adjustedYear, rule.interval) !== 0) {
      return false
    }

    // Check exclusion interval (e.g. Gregorian 100-year rule)
    if (rule.excludeInterval && rule.excludeInterval > 0) {
      if (adjustedYear !== 0 && floorMod(adjustedYear, rule.excludeInterval) === 0) {
        // Check reinstatement interval (e.g. Gregorian 400-year rule)
        if (rule.reinstateInterval && rule.reinstateInterval > 0) {
          return floorMod(adjustedYear, rule.reinstateInterval) === 0
        }
        return false
      }
    }

    return true
  })
}

/**
 * Returns the number of days in a specific month for a given year (monthIndex is 0-indexed).
 */
export function getDaysInMonth(year: number, monthIndex: number, config: WorldCalendarConfigExtended): number {
  const month = config.months[monthIndex]
  if (!month) return 30

  let days = month.days || 30

  // Apply leap days if any rule targets this month
  const leap = isLeapYear(year, config)
  if (leap && config.leapRules) {
    for (const rule of config.leapRules) {
      if (rule.targetMonthId === month.id) {
        const adjustedYear = year - (rule.offsetYear || 0)
        let applies = floorMod(adjustedYear, rule.interval) === 0
        if (rule.excludeInterval && rule.excludeInterval > 0 && adjustedYear !== 0 && floorMod(adjustedYear, rule.excludeInterval) === 0) {
          applies = Boolean(rule.reinstateInterval && floorMod(adjustedYear, rule.reinstateInterval) === 0)
        }
        if (applies) {
          days += rule.extraDays !== undefined ? rule.extraDays : 1
        }
      }
    }
  }

  return days
}

/**
 * Returns total days in a given year, including months, leap days, and intercalary days.
 */
export function getDaysInYear(year: number, config: WorldCalendarConfigExtended): number {
  let total = 0

  for (let m = 0; m < config.months.length; m++) {
    total += getDaysInMonth(year, m, config)
  }

  // Add intercalary festival days
  if (config.intercalaryDays) {
    const leap = isLeapYear(year, config)
    for (const day of config.intercalaryDays) {
      if (!day.isLeapOnly || leap) {
        total += 1
      }
    }
  }

  return total || 360
}

/**
 * Calculates continuous scalar absolute day from Year, Month, Day, Hour.
 * Month and Day are 1-based.
 * Epoch Anchor is Day 1 of Month 1 of Year 0 (or Year 1 if hasYearZero is false).
 */
export function calculateAbsoluteDay(
  year: number,
  month: number, // 1-based month
  day: number,   // 1-based day
  hour: number = 0,
  config: WorldCalendarConfigExtended
): number {
  const hoursInDay = config.hoursInDay || 24
  const hasYearZero = config.hasYearZero ?? false
  const epochYear = hasYearZero ? 0 : 1

  let totalDays = 0

  // 1. Accumulate full years between epochYear and year
  if (year >= epochYear) {
    for (let y = epochYear; y < year; y++) {
      totalDays += getDaysInYear(y, config)
    }
  } else {
    // Negative years: Year 0 is skipped when hasYearZero is false (1 BCE -> 1 CE),
    // and when hasYearZero is true, epochYear is 0, so negative years are always <= -1.
    for (let y = year; y <= -1; y++) {
      totalDays -= getDaysInYear(y, config)
    }
  }

  // 2. Accumulate prior months in the active year
  const clampedMonth = Math.max(1, Math.min(month, config.months.length))
  for (let m = 0; m < clampedMonth - 1; m++) {
    totalDays += getDaysInMonth(year, m, config)

    // Check if any intercalary days occurred after this month
    if (config.intercalaryDays) {
      const monthId = config.months[m]?.id
      const leap = isLeapYear(year, config)
      for (const ic of config.intercalaryDays) {
        if (ic.occursAfterMonthId === monthId && (!ic.isLeapOnly || leap)) {
          totalDays += 1
        }
      }
    }
  }

  // 3. Add day of month (0-indexed offset from 1-based day)
  const maxDaysInCurrentMonth = getDaysInMonth(year, clampedMonth - 1, config)
  const clampedDay = Math.max(1, Math.min(day, maxDaysInCurrentMonth))
  totalDays += (clampedDay - 1)

  // 4. Fractional day from hour
  totalDays += hour / hoursInDay

  return totalDays
}

/**
 * Helper to count non-advancing intercalary days within a single year up to dayInYear.
 */
function countNonAdvancingInYearUpToDay(
  year: number,
  dayInYear: number,
  config: WorldCalendarConfigExtended
): number {
  if (!config.intercalaryDays) return 0
  let count = 0
  let d = dayInYear
  const leap = isLeapYear(year, config)

  for (let m = 0; m < config.months.length; m++) {
    const dim = getDaysInMonth(year, m, config)
    if (d < dim) break
    d -= dim

    const monthId = config.months[m]?.id
    for (const ic of config.intercalaryDays) {
      if (ic.occursAfterMonthId === monthId && (!ic.isLeapOnly || leap)) {
        if (d >= 0) {
          if (!ic.advancesWeekday) count++
          d -= 1
        }
        if (d < 0) break
      }
    }
    if (d < 0) break
  }
  return count
}

/**
 * Counts non-advancing intercalary festival days between Epoch Day 0 and absDay.
 * Used to freeze weekday progression across festival days outside the weekly cycle.
 * For positive days, returns a positive count. For negative days, returns a negative count
 * such that effectiveDay = dayInt - count correctly freezes the weekday cycle in both directions.
 */
export function countNonAdvancingIntercalaryDays(
  absDay: number,
  config: WorldCalendarConfigExtended
): number {
  if (!config.intercalaryDays || config.intercalaryDays.length === 0) return 0
  const nonAdv = config.intercalaryDays.filter(ic => !ic.advancesWeekday)
  if (nonAdv.length === 0) return 0

  const targetDay = Math.floor(absDay)
  const hasYearZero = config.hasYearZero ?? false
  const epochYear = hasYearZero ? 0 : 1

  if (targetDay >= 0) {
    let count = 0
    let currentAbs = 0
    let y = epochYear

    // Fast-forward full years if no leap rules
    if (!config.leapRules || config.leapRules.length === 0) {
      const diy = getDaysInYear(y, config)
      const nonAdvPerYear = nonAdv.length
      const fullYears = Math.floor(targetDay / diy)
      if (fullYears > 0) {
        count += fullYears * nonAdvPerYear
        currentAbs += fullYears * diy
        y += fullYears
      }
    }

    while (true) {
      const diy = getDaysInYear(y, config)
      if (currentAbs + diy <= targetDay) {
        const leap = isLeapYear(y, config)
        for (const ic of nonAdv) {
          if (!ic.isLeapOnly || leap) count++
        }
        currentAbs += diy
        y++
      } else {
        break
      }
    }

    const dayInYear = targetDay - currentAbs
    count += countNonAdvancingInYearUpToDay(y, dayInYear, config)
    return count
  } else {
    // Negative days: targetDay < 0
    let count = 0
    let currentEnd = 0
    let y = -1

    // Fast-forward full years if no leap rules
    if (!config.leapRules || config.leapRules.length === 0) {
      const diy = getDaysInYear(y, config)
      const nonAdvPerYear = nonAdv.length
      const fullYears = Math.floor((-targetDay - 1) / diy)
      if (fullYears > 0) {
        count += fullYears * nonAdvPerYear
        currentEnd -= fullYears * diy
        y -= fullYears
      }
    }

    while (true) {
      const diy = getDaysInYear(y, config)
      if (currentEnd - diy >= targetDay + 1) {
        const leap = isLeapYear(y, config)
        for (const ic of nonAdv) {
          if (!ic.isLeapOnly || leap) count++
        }
        currentEnd -= diy
        y--
      } else {
        break
      }
    }

    const diy = getDaysInYear(y, config)
    const yearStart = currentEnd - diy
    const dayInYear = targetDay - yearStart
    const leap = isLeapYear(y, config)
    let totalInY = 0
    for (const ic of nonAdv) {
      if (!ic.isLeapOnly || leap) totalInY++
    }
    const upToTarget = countNonAdvancingInYearUpToDay(y, dayInYear, config)
    count += (totalInY - upToTarget)
    return -count
  }
}

/**
 * Calculates weekday for any absolute day using floor modulo.
 */
export function calculateDayOfWeek(
  absDay: number,
  config: WorldCalendarConfigExtended
): { index: number; name: string } {
  const daysOfWeek = config.daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekLength = daysOfWeek.length || 7
  const offset = config.weekdayEpochOffset || 0

  // Floor of absolute day to get discrete day index
  const dayInt = Math.floor(absDay)
  const nonAdvancingCount = countNonAdvancingIntercalaryDays(absDay, config)
  const effectiveDay = dayInt - nonAdvancingCount
  const index = floorMod(effectiveDay + offset, weekLength)

  return {
    index,
    name: daysOfWeek[index] || `Day ${index + 1}`
  }
}

/**
 * Categorizes a normalized phase fraction into one of the 8 canonical phases.
 */
export function categorizeLunarPhase(fraction: number): {
  phaseName: CelestialPhaseResult['phaseName'];
  isMajorPhase: boolean;
} {
  const f = Math.round(floorMod(fraction, 1.0) * 1e8) / 1e8

  if (f >= 0.97 || f < 0.03) {
    return { phaseName: 'New Moon', isMajorPhase: true }
  } else if (f >= 0.03 && f < 0.22) {
    return { phaseName: 'Waxing Crescent', isMajorPhase: false }
  } else if (f >= 0.22 && f < 0.28) {
    return { phaseName: 'First Quarter', isMajorPhase: true }
  } else if (f >= 0.28 && f < 0.47) {
    return { phaseName: 'Waxing Gibbous', isMajorPhase: false }
  } else if (f >= 0.47 && f < 0.53) {
    return { phaseName: 'Full Moon', isMajorPhase: true }
  } else if (f >= 0.53 && f < 0.72) {
    return { phaseName: 'Waning Gibbous', isMajorPhase: false }
  } else if (f >= 0.72 && f < 0.78) {
    return { phaseName: 'Last Quarter', isMajorPhase: true }
  } else {
    return { phaseName: 'Waning Crescent', isMajorPhase: false }
  }
}

/**
 * Computes lunar phase positions and illumination for all configured moons.
 */
export function calculateMoonPhases(
  absDay: number,
  moons: CelestialMoonConfig[] = []
): CelestialPhaseResult[] {
  return moons.map(moon => {
    const period = Math.max(0.001, moon.synodicPeriodDays)
    const phaseFraction = floorMod(moon.epochPhase + (absDay / period), 1.0)
    const phaseAngleRad = phaseFraction * 2 * Math.PI
    // Illumination: 0% at New Moon (cos = 1), 100% at Full Moon (cos = -1)
    const illuminationPercent = Math.round(((1 - Math.cos(phaseAngleRad)) / 2) * 1000) / 10

    const { phaseName, isMajorPhase } = categorizeLunarPhase(phaseFraction)

    return {
      moonId: moon.id,
      moonName: moon.name,
      color: moon.color,
      phaseFraction,
      phaseAngleRad,
      illuminationPercent,
      phaseName,
      isMajorPhase
    }
  })
}

/**
 * Detects celestial syzygy / conjunction alignments across multiple moons.
 */
export function detectCelestialConjunctions(
  phases: CelestialPhaseResult[],
  tolerance: number = 0.04
): ConjunctionResult | null {
  if (phases.length < 2) return null

  const eps = 1e-9

  // 1. Check Grand Full Conjunction (all moons near 0.5 Full Moon)
  const allFull = phases.every(p => Math.abs(p.phaseFraction - 0.5) <= tolerance + eps)
  if (allFull) {
    return {
      type: 'grand_full_conjunction',
      alignedMoonIds: phases.map(p => p.moonId),
      severity: 1.0,
      description: `Grand Full Conjunction: All ${phases.length} celestial bodies have reached Full Moon simultaneously.`
    }
  }

  // 2. Check Dark Solar Conjunction (all moons near New Moon 0.0 or 1.0)
  const allNew = phases.every(p => p.phaseFraction <= tolerance + eps || p.phaseFraction >= (1 - tolerance - eps))
  if (allNew) {
    return {
      type: 'dark_solar_conjunction',
      alignedMoonIds: phases.map(p => p.moonId),
      severity: 1.0,
      description: `Celestial Dark Conjunction: All ${phases.length} celestial bodies are in total solar conjunction.`
    }
  }

  // 3. Check pairwise alignments
  const alignedIds: string[] = []
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      const p1 = phases[i].phaseFraction
      const p2 = phases[j].phaseFraction
      const diff = Math.abs(p1 - p2)
      if (diff <= tolerance + eps || (1 - diff) <= tolerance + eps) {
        if (!alignedIds.includes(phases[i].moonId)) alignedIds.push(phases[i].moonId)
        if (!alignedIds.includes(phases[j].moonId)) alignedIds.push(phases[j].moonId)
      }
    }
  }

  if (alignedIds.length >= 2) {
    return {
      type: 'partial_alignment',
      alignedMoonIds: alignedIds,
      severity: alignedIds.length / phases.length,
      description: `Partial Celestial Alignment: ${alignedIds.length} celestial bodies are in orbital conjunction.`
    }
  }

  return null
}

/**
 * Calculates continuous fractional year coordinate T = Y + DOY / daysInYear(Y).
 * Month and day are 1-based.
 */
export function dateToFractionalYear(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  config: WorldCalendarConfigExtended
): number {
  const daysInYear = getDaysInYear(year, config)
  const hoursInDay = config.hoursInDay || 24

  let doy = 0
  const clampedMonth = Math.max(1, Math.min(month, config.months.length))
  for (let m = 0; m < clampedMonth - 1; m++) {
    doy += getDaysInMonth(year, m, config)

    // Account for any intercalary days occurring after month m
    if (config.intercalaryDays) {
      const monthId = config.months[m]?.id
      const leap = isLeapYear(year, config)
      for (const ic of config.intercalaryDays) {
        if (ic.occursAfterMonthId === monthId && (!ic.isLeapOnly || leap)) {
          doy += 1
        }
      }
    }
  }

  const clampedDay = Math.max(1, Math.min(day, getDaysInMonth(year, clampedMonth - 1, config)))
  doy += (clampedDay - 1)
  doy += (hour / hoursInDay)

  return year + (doy / daysInYear)
}
