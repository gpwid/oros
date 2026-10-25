export {
  CalendarLeapRule,
  IntercalaryDay,
  CelestialMoonConfig,
  CelestialPhaseResult,
  ConjunctionResult,
  WorldCalendarConfigExtended,
  WorldCalendarConfig,
  WorldCalendarMonth
} from '@shared/types'

export {
  floorMod,
  isLeapYear,
  getDaysInMonth,
  getDaysInYear,
  calculateAbsoluteDay,
  calculateDayOfWeek,
  categorizeLunarPhase,
  calculateMoonPhases,
  detectCelestialConjunctions,
  dateToFractionalYear,
  countNonAdvancingIntercalaryDays
} from '../../../src/renderer/utils/calendarMath'
