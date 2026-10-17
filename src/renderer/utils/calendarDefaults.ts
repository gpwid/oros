import { WorldCalendarConfig, TimelineEvent } from '@shared/types'

export const DEFAULT_FANTASY_CALENDAR_CONFIG: WorldCalendarConfig = {
  firstYear: 400,
  lastYear: 1200,
  yearPrefix: 'Year',
  yearSuffix: 'AC',
  hoursInDay: 24,
  daysOfWeek: ['Moonday', 'Trueday', 'Windsday', 'Thornsday', 'Fireday', 'Starday', 'Sundown'],
  months: [
    { id: 'm-1', name: 'Frostfall', days: 30, season: 'Winter' },
    { id: 'm-2', name: 'Deepwinter', days: 30, season: 'Winter' },
    { id: 'm-3', name: 'Awakening', days: 30, season: 'Spring' },
    { id: 'm-4', name: 'Rainbloom', days: 30, season: 'Spring' },
    { id: 'm-5', name: 'Highmeadow', days: 30, season: 'Spring' },
    { id: 'm-6', name: 'Sunreach', days: 30, season: 'Summer' },
    { id: 'm-7', name: 'Solstice', days: 30, season: 'Summer' },
    { id: 'm-8', name: 'Goldgrain', days: 30, season: 'Summer' },
    { id: 'm-9', name: 'Emberleaf', days: 30, season: 'Autumn' },
    { id: 'm-10', name: 'Mistveil', days: 30, season: 'Autumn' },
    { id: 'm-11', name: 'Gloomfrost', days: 30, season: 'Autumn' },
    { id: 'm-12', name: 'Starveil', days: 30, season: 'Winter' }
  ]
}

export const GREGORIAN_CALENDAR_CONFIG: WorldCalendarConfig = {
  firstYear: 1500,
  lastYear: 2050,
  yearPrefix: '',
  yearSuffix: 'CE',
  hoursInDay: 24,
  daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  months: [
    { id: 'g-1', name: 'January', days: 31, season: 'Winter' },
    { id: 'g-2', name: 'February', days: 28, season: 'Winter' },
    { id: 'g-3', name: 'March', days: 31, season: 'Spring' },
    { id: 'g-4', name: 'April', days: 30, season: 'Spring' },
    { id: 'g-5', name: 'May', days: 31, season: 'Spring' },
    { id: 'g-6', name: 'June', days: 30, season: 'Summer' },
    { id: 'g-7', name: 'July', days: 31, season: 'Summer' },
    { id: 'g-8', name: 'August', days: 31, season: 'Summer' },
    { id: 'g-9', name: 'September', days: 30, season: 'Autumn' },
    { id: 'g-10', name: 'October', days: 31, season: 'Autumn' },
    { id: 'g-11', name: 'November', days: 30, season: 'Autumn' },
    { id: 'g-12', name: 'December', days: 31, season: 'Winter' }
  ]
}

export const SCIFI_SOL_CALENDAR_CONFIG: WorldCalendarConfig = {
  firstYear: 2100,
  lastYear: 3200,
  yearPrefix: 'Sol Epoch',
  yearSuffix: '',
  hoursInDay: 28,
  daysOfWeek: ['Sol 1', 'Sol 2', 'Sol 3', 'Sol 4', 'Sol 5', 'Sol 6', 'Rest Day'],
  months: [
    { id: 's-1', name: 'Perhelion', days: 36, season: 'Warm' },
    { id: 's-2', name: 'Zephyr', days: 36, season: 'Warm' },
    { id: 's-3', name: 'Equinox Alpha', days: 36, season: 'Temperate' },
    { id: 's-4', name: 'Aphelion', days: 36, season: 'Cold' },
    { id: 's-5', name: 'Cryostasis', days: 36, season: 'Cold' },
    { id: 's-6', name: 'Equinox Beta', days: 36, season: 'Temperate' }
  ]
}

export function formatYear(year: number, config: WorldCalendarConfig): string {
  const parts: string[] = []
  if (config.yearPrefix) parts.push(config.yearPrefix)
  parts.push(year.toString())
  if (config.yearSuffix) parts.push(config.yearSuffix)
  return parts.join(' ')
}

export function getMonthName(config: WorldCalendarConfig, monthIndex1Based?: number): string {
  if (!monthIndex1Based || monthIndex1Based < 1 || monthIndex1Based > config.months.length) return ''
  return config.months[monthIndex1Based - 1]?.name || ''
}

export function getDaysInMonth(config: WorldCalendarConfig, monthIndex1Based?: number): number {
  if (!monthIndex1Based || monthIndex1Based < 1 || monthIndex1Based > config.months.length) return 30
  return config.months[monthIndex1Based - 1]?.days || 30
}

export function formatTimelineDate(event: TimelineEvent, config: WorldCalendarConfig): string {
  const yearStr = formatYear(event.year, config)
  if (event.isPeriod && event.endYear !== undefined) {
    const endYearStr = formatYear(event.endYear, config)
    const duration = formatPeriodDuration(
      event.year,
      event.endYear,
      event.month,
      event.endMonth,
      event.day,
      event.endDay,
      config
    )
    return `${yearStr} → ${endYearStr} · ${duration}`
  }

  const parts: string[] = []
  if (event.month) {
    const monthName = getMonthName(config, event.month)
    if (event.day) {
      parts.push(`${monthName} ${event.day}`)
    } else {
      parts.push(monthName)
    }
  }
  parts.push(yearStr)
  return parts.join(', ')
}

export function formatPeriodDuration(
  startYear: number,
  endYear: number,
  startMonth?: number,
  endMonth?: number,
  startDay?: number,
  endDay?: number,
  config?: WorldCalendarConfig
): string {
  if (endYear < startYear) return '0 yrs'
  
  let yearDiff = endYear - startYear
  let monthDiff = (endMonth ?? 1) - (startMonth ?? 1)
  
  if (monthDiff < 0 && yearDiff > 0) {
    yearDiff -= 1
    const totalMonths = config?.months?.length || 12
    monthDiff += totalMonths
  }

  if (yearDiff === 0 && monthDiff === 0) {
    const dayDiff = Math.max(1, (endDay ?? 1) - (startDay ?? 1))
    return `${dayDiff} ${dayDiff === 1 ? 'day' : 'days'}`
  }

  if (yearDiff === 0) {
    return `${monthDiff} ${monthDiff === 1 ? 'mo' : 'mos'}`
  }

  if (monthDiff > 0) {
    return `${yearDiff}y, ${monthDiff}m`
  }

  return `${yearDiff} ${yearDiff === 1 ? 'yr' : 'yrs'}`
}

export function isEventInYearMonth(event: TimelineEvent, year: number, month: number): boolean {
  if (!event.isPeriod) {
    if (event.year !== year) return false
    if (event.month && event.month !== month) return false
    return true
  }

  const startY = event.year
  const startM = event.month || 1
  const endY = event.endYear ?? event.year
  const endM = event.endMonth || 12

  const currentVal = year * 100 + month
  const startVal = startY * 100 + startM
  const endVal = endY * 100 + endM

  return currentVal >= startVal && currentVal <= endVal
}

export const PERIOD_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; border: string; bg: string }> = {
  war: { label: 'War & Conflict', icon: 'Swords', color: '#f87171', border: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  reign: { label: 'Reign & Rule', icon: 'Crown', color: '#facc15', border: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  epoch: { label: 'Epoch / Era', icon: 'Hourglass', color: '#818cf8', border: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  crisis: { label: 'Crisis / Plague', icon: 'Flame', color: '#fb923c', border: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  dynasty: { label: 'Dynasty / Age', icon: 'Shield', color: '#a78bfa', border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  cultural: { label: 'Cultural Renaissance', icon: 'Sparkles', color: '#34d399', border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  custom: { label: 'Period Span', icon: 'Clock', color: '#38bdf8', border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' }
}
