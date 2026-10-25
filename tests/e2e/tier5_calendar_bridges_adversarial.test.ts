import { describe, it, expect } from 'vitest'
import {
  WorldCalendarConfigExtended,
  CalendarLeapRule,
  IntercalaryDay,
  CelestialMoonConfig,
  CelestialPhaseResult,
  ConjunctionResult,
  LoreEntity,
  DirectoryFolder,
  DirectoryItem,
  TTRPGBattlemap,
  TTRPGWall,
  TTRPGToken,
  FoundrySceneData
} from '@shared/types'
import {
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
} from './helpers/calendarMathHelper'
import {
  exportWorldToObsidianFiles,
  importObsidianFilesToWorld,
  serializeFrontmatter,
  parseFrontmatter,
  sanitizeFilename,
  htmlContentToObsidianMarkdown,
  obsidianMarkdownToHtmlContent
} from './helpers/obsidianBridgeHelper'
import {
  exportBattlemapToFoundryScene,
  importFoundrySceneToBattlemap,
  percentToScenePixel,
  scenePixelToPercent
} from './helpers/foundryBridgeHelper'

describe('Tier 5 Adversarial Coverage Hardening: Calendar Math & Ecosystem Bridges', () => {
  // =========================================================================
  // SECTION 1: CALENDAR MATH EXTREMES & BOUNDARY RECKONING
  // =========================================================================

  describe('1. Calendar Math Extremes & Boundary Reckoning', () => {
    const createConfig = (overrides: Partial<WorldCalendarConfigExtended> = {}): WorldCalendarConfigExtended => ({
      firstYear: 1,
      lastYear: 5000,
      hoursInDay: 24,
      daysOfWeek: ['Primus', 'Secundus', 'Tertius', 'Quartus', 'Quintus', 'Sextus', 'Septimus'],
      months: [
        { id: 'm1', name: 'Dawn', days: 30 },
        { id: 'm2', name: 'Sprout', days: 30 },
        { id: 'm3', name: 'Bloom', days: 30 },
        { id: 'm4', name: 'Sun', days: 30 },
        { id: 'm5', name: 'Heat', days: 30 },
        { id: 'm6', name: 'Harvest', days: 30 },
        { id: 'm7', name: 'Leaf', days: 30 },
        { id: 'm8', name: 'Chill', days: 30 },
        { id: 'm9', name: 'Frost', days: 30 },
        { id: 'm10', name: 'Deep', days: 30 },
        { id: 'm11', name: 'Thaw', days: 30 },
        { id: 'm12', name: 'Renewal', days: 30 }
      ],
      hasYearZero: false,
      weekdayEpochOffset: 0,
      ...overrides
    })

    it('1.1: Complex leap year rule with non-zero offset, exclusion, and reinstatement intervals', () => {
      // Rule: leap every 5 years with offset 3, exclude every 25 years, reinstate every 125 years
      const config = createConfig({
        leapRules: [
          {
            id: 'complex-pentanary',
            name: 'Complex Pentanary',
            interval: 5,
            offsetYear: 3,
            extraDays: 2,
            targetMonthId: 'm6',
            excludeInterval: 25,
            reinstateInterval: 125
          }
        ]
      })

      // Year 3: adjustedYear = 0. Not excluded -> leap
      expect(isLeapYear(3, config)).toBe(true)
      // Year 8: adjustedYear = 5. 5 % 5 === 0, not div by 25 -> leap
      expect(isLeapYear(8, config)).toBe(true)
      // Year 13: adjustedYear = 10 -> leap
      expect(isLeapYear(13, config)).toBe(true)
      // Year 4: adjustedYear = 1 -> not leap
      expect(isLeapYear(4, config)).toBe(false)

      // Exclusions:
      // Year 28: adjustedYear = 25 -> excluded (div by 25, not 125)
      expect(isLeapYear(28, config)).toBe(false)
      // Year 53: adjustedYear = 50 -> excluded
      expect(isLeapYear(53, config)).toBe(false)
      // Year 78: adjustedYear = 75 -> excluded
      expect(isLeapYear(78, config)).toBe(false)
      // Year 103: adjustedYear = 100 -> excluded
      expect(isLeapYear(103, config)).toBe(false)

      // Reinstatement:
      // Year 128: adjustedYear = 125 -> reinstated (div by 125)
      expect(isLeapYear(128, config)).toBe(true)
      // Year 253: adjustedYear = 250 -> reinstated (div by 125)
      expect(isLeapYear(253, config)).toBe(true)

      // Negative side (BCE):
      // Year -2: adjustedYear = -2 - 3 = -5. floorMod(-5, 5) === 0, floorMod(-5, 25) = 20 -> leap
      expect(isLeapYear(-2, config)).toBe(true)
      // Year -22: adjustedYear = -22 - 3 = -25. floorMod(-25, 25) === 0, floorMod(-25, 125) = 100 -> excluded
      expect(isLeapYear(-22, config)).toBe(false)
      // Year -122: adjustedYear = -122 - 3 = -125. floorMod(-125, 125) === 0 -> reinstated
      expect(isLeapYear(-122, config)).toBe(true)
    })

    it('1.2: Multi-rule calendar targeting multiple distinct months with independent intervals', () => {
      const config = createConfig({
        leapRules: [
          { id: 'r1', name: 'Spring Bonus', interval: 3, offsetYear: 0, extraDays: 1, targetMonthId: 'm3' },
          { id: 'r2', name: 'Harvest Festival', interval: 7, offsetYear: 0, extraDays: 3, targetMonthId: 'm6' },
          { id: 'r3', name: 'Centennial Solstice', interval: 100, offsetYear: 0, extraDays: 5, targetMonthId: 'm12' }
        ]
      })

      // Year 21: div by 3 and 7, but not 100
      expect(isLeapYear(21, config)).toBe(true)
      expect(getDaysInMonth(21, 2, config)).toBe(31) // m3 got +1
      expect(getDaysInMonth(21, 5, config)).toBe(33) // m6 got +3
      expect(getDaysInMonth(21, 11, config)).toBe(30) // m12 got 0
      expect(getDaysInYear(21, config)).toBe(360 + 1 + 3)

      // Year 2100: div by 3 and 7 (2100 = 3*7*100) and 100!
      expect(getDaysInMonth(2100, 2, config)).toBe(31) // m3 got +1
      expect(getDaysInMonth(2100, 5, config)).toBe(33) // m6 got +3
      expect(getDaysInMonth(2100, 11, config)).toBe(35) // m12 got +5
      expect(getDaysInYear(2100, config)).toBe(360 + 1 + 3 + 5)
    })

    it('1.3: Continuous BCE/CE boundary transition across Year -1 (1 BCE) and Year 1 (1 CE)', () => {
      const config = createConfig({ hasYearZero: false })
      const hoursInDay = config.hoursInDay // 24

      // Last hour of 1 BCE: Year -1, Month 12, Day 30, Hour 23
      const absLastBce = calculateAbsoluteDay(-1, 12, 30, 23, config)
      // First hour of 1 CE: Year 1, Month 1, Day 1, Hour 0
      const absFirstCe = calculateAbsoluteDay(1, 1, 1, 0, config)

      // In historical reckoning, 1 CE Jan 1 0:00 is exactly Epoch Day 0.0
      expect(absFirstCe).toBe(0.0)
      // The day before should be Day -1 + (23/24) = -1/24 = -0.041666...
      expect(absLastBce).toBeCloseTo(-1 / hoursInDay, 5)
      // The delta across 1 hour at midnight is exactly 1 hour (1/24 day)
      expect(absFirstCe - absLastBce).toBeCloseTo(1 / hoursInDay, 5)

      // Fractional hour progression within 1 BCE
      const noonLastBce = calculateAbsoluteDay(-1, 12, 30, 12, config)
      expect(noonLastBce).toBeCloseTo(-0.5, 5)
      const startLastDayBce = calculateAbsoluteDay(-1, 12, 30, 0, config)
      expect(startLastDayBce).toBe(-1.0)
    })

    it('1.4: Extreme millennial range monotonicity and stability [-100,000 to +100,000]', () => {
      const config = createConfig({ hasYearZero: false })
      const extremeYears = [-100000, -50000, -10000, -1000, -100, -1, 1, 100, 1000, 10000, 50000, 100000]
      let previousAbs = -Infinity

      for (const y of extremeYears) {
        const abs = calculateAbsoluteDay(y, 1, 1, 0, config)
        expect(abs).toBeGreaterThan(previousAbs)
        previousAbs = abs

        // Weekday must be robust and within [0, 6] without NaN
        const wk = calculateDayOfWeek(abs, config)
        expect(wk.index).toBeGreaterThanOrEqual(0)
        expect(wk.index).toBeLessThan(7)
        expect(config.daysOfWeek[wk.index]).toBe(wk.name)

        // Fractional year must be strictly close to the input year
        const fracYear = dateToFractionalYear(y, 1, 1, 0, config)
        expect(fracYear).toBeCloseTo(y, 4)
      }
    })

    it('1.5: Non-standard day lengths (36-hour fantasy day) and fractional hour transitions', () => {
      const config36 = createConfig({
        hoursInDay: 36
      })

      // Test quarter-day steps: 9h (0.25), 18h (0.5), 27h (0.75), 36h (1.0)
      const abs0 = calculateAbsoluteDay(1, 1, 1, 0, config36)
      const absQuarter = calculateAbsoluteDay(1, 1, 1, 9, config36)
      const absHalf = calculateAbsoluteDay(1, 1, 1, 18, config36)
      const absThreeQuarter = calculateAbsoluteDay(1, 1, 1, 27, config36)
      const absFull = calculateAbsoluteDay(1, 1, 1, 36, config36)

      expect(abs0).toBe(0.0)
      expect(absQuarter).toBe(0.25)
      expect(absHalf).toBe(0.50)
      expect(absThreeQuarter).toBe(0.75)
      expect(absFull).toBe(1.0)

      // Verify dateToFractionalYear matches
      const fracHalf = dateToFractionalYear(1, 1, 1, 18, config36)
      const expectedFracHalf = 1 + (0.5 / 360)
      expect(fracHalf).toBeCloseTo(expectedFracHalf, 6)
    })

    it('1.6: Non-advancing intercalary festival days in negative years (BCE)', () => {
      const config = createConfig({
        intercalaryDays: [
          { id: 'ic1', name: 'Winter Solstice Festival', occursAfterMonthId: 'm6', advancesWeekday: false }
        ],
        hasYearZero: false
      })

      // In Year -1: Month 6 Day 30 is followed by Winter Solstice, then Month 7 Day 1
      const dayBeforeFestival = calculateAbsoluteDay(-1, 6, 30, 0, config)
      const dayAfterFestival = calculateAbsoluteDay(-1, 7, 1, 0, config)

      const wkBefore = calculateDayOfWeek(dayBeforeFestival, config)
      const wkAfter = calculateDayOfWeek(dayAfterFestival, config)

      // The non-advancing intercalary festival day MUST freeze the weekday sequence.
      // Therefore, the weekday of dayAfterFestival must be exactly (wkBefore.index + 1) % 7
      const expectedIndex = (wkBefore.index + 1) % config.daysOfWeek.length
      expect(wkAfter.index).toBe(expectedIndex)
    })
  })

  // =========================================================================
  // SECTION 2: CELESTIAL CONJUNCTIONS & MULTI-MOON ORBITS
  // =========================================================================

  describe('2. Celestial Conjunctions & Multi-Moon Orbits', () => {
    it('2.1: 3 Moons with co-prime orbital periods (7, 11, 13 days) return to simultaneous alignment', () => {
      const moons: CelestialMoonConfig[] = [
        { id: 'm-alpha', name: 'Alpha', synodicPeriodDays: 7, epochPhase: 0.0, color: '#38bdf8' },
        { id: 'm-beta', name: 'Beta', synodicPeriodDays: 11, epochPhase: 0.0, color: '#f43f5e' },
        { id: 'm-gamma', name: 'Gamma', synodicPeriodDays: 13, epochPhase: 0.0, color: '#10b981' }
      ]

      // Day 0: All start at 0.0 -> Dark Solar Conjunction
      const phasesDay0 = calculateMoonPhases(0, moons)
      expect(phasesDay0).toHaveLength(3)
      for (const p of phasesDay0) {
        expect(p.phaseFraction).toBe(0.0)
        expect(p.phaseName).toBe('New Moon')
      }
      const conj0 = detectCelestialConjunctions(phasesDay0, 0.04)
      expect(conj0).not.toBeNull()
      expect(conj0?.type).toBe('dark_solar_conjunction')
      expect(conj0?.alignedMoonIds).toEqual(['m-alpha', 'm-beta', 'm-gamma'])

      // Recurrence: By CRT, LCM(7, 11, 13) = 7 * 11 * 13 = 1001 days
      const lcmDay = 1001
      const phasesLcm = calculateMoonPhases(lcmDay, moons)
      for (const p of phasesLcm) {
        const diffFromZero = Math.min(p.phaseFraction, 1.0 - p.phaseFraction)
        expect(diffFromZero).toBeLessThan(1e-4)
      }
      const conjLcm = detectCelestialConjunctions(phasesLcm, 0.04)
      expect(conjLcm?.type).toBe('dark_solar_conjunction')
      expect(conjLcm?.alignedMoonIds).toEqual(['m-alpha', 'm-beta', 'm-gamma'])
    })

    it('2.2: Retrograde and ultra-fast mixed orbit configurations under negative absolute days', () => {
      const moons: CelestialMoonConfig[] = [
        { id: 'ultra-fast', name: 'Sprinter', synodicPeriodDays: 1.5, epochPhase: 0.25, color: '#eab308' },
        { id: 'ultra-slow', name: 'Glacier', synodicPeriodDays: 120.0, epochPhase: 0.75, color: '#8b5cf6' }
      ]

      const negativeDays = [-10000, -750.25, -120.0, -1.5, -0.75]
      for (const day of negativeDays) {
        const phases = calculateMoonPhases(day, moons)
        for (const p of phases) {
          expect(p.phaseFraction).toBeGreaterThanOrEqual(0.0)
          expect(p.phaseFraction).toBeLessThan(1.0)
          expect(p.illuminationPercent).toBeGreaterThanOrEqual(0)
          expect(p.illuminationPercent).toBeLessThanOrEqual(100)
          expect(p.phaseAngleRad).toBeGreaterThanOrEqual(0)
          expect(p.phaseAngleRad).toBeLessThan(2 * Math.PI)
        }
      }
    })

    it('2.3: Exact syzygy threshold boundaries and tolerance limits (tolerance = 0.04)', () => {
      const createPhaseResult = (id: string, fraction: number): CelestialPhaseResult => ({
        moonId: id,
        moonName: id,
        color: '#fff',
        phaseFraction: fraction,
        phaseAngleRad: fraction * 2 * Math.PI,
        illuminationPercent: 50,
        phaseName: 'Waxing Crescent',
        isMajorPhase: false
      })

      // Grand Full Conjunction threshold: |fraction - 0.5| <= 0.04
      // Inside boundary: 0.54 and 0.46
      const insideFull = [createPhaseResult('m1', 0.54), createPhaseResult('m2', 0.46)]
      const conjInsideFull = detectCelestialConjunctions(insideFull, 0.04)
      expect(conjInsideFull?.type).toBe('grand_full_conjunction')

      // Outside boundary: 0.5401
      const outsideFull = [createPhaseResult('m1', 0.5401), createPhaseResult('m2', 0.50)]
      const conjOutsideFull = detectCelestialConjunctions(outsideFull, 0.04)
      expect(conjOutsideFull?.type).not.toBe('grand_full_conjunction')

      // Dark Solar Conjunction threshold: fraction <= 0.04 || fraction >= 0.96
      const insideDark = [createPhaseResult('m1', 0.04), createPhaseResult('m2', 0.96)]
      const conjInsideDark = detectCelestialConjunctions(insideDark, 0.04)
      expect(conjInsideDark?.type).toBe('dark_solar_conjunction')

      const outsideDark = [createPhaseResult('m1', 0.0401), createPhaseResult('m2', 0.96)]
      const conjOutsideDark = detectCelestialConjunctions(outsideDark, 0.04)
      expect(conjOutsideDark?.type).not.toBe('dark_solar_conjunction')

      // Circular wraparound alignment: Moon 1 at 0.01, Moon 2 at 0.98 (diff = 0.97, 1 - diff = 0.03 <= 0.04)
      const wraparoundPair = [createPhaseResult('m1', 0.01), createPhaseResult('m2', 0.98)]
      const conjWraparound = detectCelestialConjunctions(wraparoundPair, 0.04)
      expect(conjWraparound).not.toBeNull()
      // Since both are in the dark range, it qualifies as dark_solar_conjunction
      expect(conjWraparound?.type).toBe('dark_solar_conjunction')

      // Partial alignment between 2 out of 4 moons
      const fourMoons = [
        createPhaseResult('m1', 0.20),
        createPhaseResult('m2', 0.22), // aligned with m1 (diff 0.02)
        createPhaseResult('m3', 0.60),
        createPhaseResult('m4', 0.85)
      ]
      const partialConj = detectCelestialConjunctions(fourMoons, 0.04)
      expect(partialConj?.type).toBe('partial_alignment')
      expect(partialConj?.alignedMoonIds).toEqual(['m1', 'm2'])
      expect(partialConj?.severity).toBe(2 / 4)
    })

    it('2.4: 8-Phase Canonical Boundary Transitions', () => {
      // Boundaries:
      // [0.97, 0.03) -> New Moon
      // [0.03, 0.22) -> Waxing Crescent
      // [0.22, 0.28) -> First Quarter
      // [0.28, 0.47) -> Waxing Gibbous
      // [0.47, 0.53) -> Full Moon
      // [0.53, 0.72) -> Waning Gibbous
      // [0.72, 0.78) -> Last Quarter
      // [0.78, 0.97) -> Waning Crescent
      expect(categorizeLunarPhase(0.00).phaseName).toBe('New Moon')
      expect(categorizeLunarPhase(0.00).isMajorPhase).toBe(true)

      expect(categorizeLunarPhase(0.0299).phaseName).toBe('New Moon')
      expect(categorizeLunarPhase(0.03).phaseName).toBe('Waxing Crescent')
      expect(categorizeLunarPhase(0.03).isMajorPhase).toBe(false)

      expect(categorizeLunarPhase(0.2199).phaseName).toBe('Waxing Crescent')
      expect(categorizeLunarPhase(0.22).phaseName).toBe('First Quarter')
      expect(categorizeLunarPhase(0.22).isMajorPhase).toBe(true)

      expect(categorizeLunarPhase(0.2799).phaseName).toBe('First Quarter')
      expect(categorizeLunarPhase(0.28).phaseName).toBe('Waxing Gibbous')

      expect(categorizeLunarPhase(0.4699).phaseName).toBe('Waxing Gibbous')
      expect(categorizeLunarPhase(0.47).phaseName).toBe('Full Moon')
      expect(categorizeLunarPhase(0.47).isMajorPhase).toBe(true)

      expect(categorizeLunarPhase(0.5299).phaseName).toBe('Full Moon')
      expect(categorizeLunarPhase(0.53).phaseName).toBe('Waning Gibbous')

      expect(categorizeLunarPhase(0.7199).phaseName).toBe('Waning Gibbous')
      expect(categorizeLunarPhase(0.72).phaseName).toBe('Last Quarter')
      expect(categorizeLunarPhase(0.72).isMajorPhase).toBe(true)

      expect(categorizeLunarPhase(0.7799).phaseName).toBe('Last Quarter')
      expect(categorizeLunarPhase(0.78).phaseName).toBe('Waning Crescent')

      expect(categorizeLunarPhase(0.9699).phaseName).toBe('Waning Crescent')
      expect(categorizeLunarPhase(0.97).phaseName).toBe('New Moon')
      expect(categorizeLunarPhase(0.97).isMajorPhase).toBe(true)
    })
  })

  // =========================================================================
  // SECTION 3: OBSIDIAN BRIDGE ADVERSARIAL STRESS
  // =========================================================================

  describe('3. Obsidian Bridge Adversarial Stress', () => {
    it('3.1: Complex nested frontmatter with unicode emojis and international scripts roundtrips losslessly', () => {
      const entity: LoreEntity = {
        id: 'e-multilingual-1',
        worldId: 'world-obsidian-adv',
        title: '🧙‍♂️ Archmage ⚡ of the 🌟 Astral Realm 🛡️',
        type: 'character',
        tags: ['magic/arcane', 'hero⚔️', '日本語タグ', 'кириллица'],
        aliases: ['Grand 🔮 Magus', '神話的魔術師'],
        summary: 'Keeper of the Cosmos: ∀x ∈ Universe, Power(x) > 0. Speaks Español & Русский.',
        content: '<p>A legendary figure wielding <strong>astral force</strong>.</p>',
        isSecret: true,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z',
        infobox: {
          subtitle: 'Supreme Sorcerer 🌌',
          sections: [
            {
              title: '🔥 Elemental Affinities ❄️',
              fields: [
                { id: 'f1', label: 'Primary Spell ⚡', value: 'Meteor Strike ☄️', type: 'text' },
                { id: 'f2', label: 'Mana Rating 💎', value: '9999+', type: 'number' }
              ]
            }
          ]
        },
        customProperties: {
          sacredSymbols: ['✡️', '✝️', '☪️', '🕉️', '☸️'],
          nestedSpec: {
            manaLimit: 50000,
            allowOvercharge: true
          }
        }
      }

      // Serialize to YAML frontmatter
      const serialized = serializeFrontmatter(entity)
      expect(serialized).toContain('🧙‍♂️ Archmage ⚡ of the 🌟 Astral Realm 🛡️')
      expect(serialized).toContain('🔥 Elemental Affinities ❄️')
      expect(serialized).toContain('Meteor Strike ☄️')

      // Parse YAML frontmatter back
      const { frontmatter } = parseFrontmatter(`${serialized}\n\nBody content`)
      expect(frontmatter.id).toBe(entity.id)
      expect(frontmatter.title).toBe(entity.title)
      expect(frontmatter.isSecret).toBe(true)
      expect(frontmatter.tags).toEqual(entity.tags)
      expect(frontmatter.aliases).toEqual(entity.aliases)
      expect(frontmatter.summary).toBe(entity.summary)
      expect(frontmatter.infobox.subtitle).toBe('Supreme Sorcerer 🌌')
      expect(frontmatter.infobox.sections[0].title).toBe('🔥 Elemental Affinities ❄️')
      expect(frontmatter.infobox.sections[0].fields[0].label).toBe('Primary Spell ⚡')
      expect(frontmatter.infobox.sections[0].fields[0].value).toBe('Meteor Strike ☄️')
      expect(frontmatter.customProperties.sacredSymbols).toEqual(['✡️', '✝️', '☪️', '🕉️', '☸️'])
      expect(frontmatter.customProperties.nestedSpec).toEqual({ manaLimit: 50000, allowOvercharge: true })
    })

    it('3.2: Resilient parsing of YAML comments, anchor notations, and multiline body text', () => {
      const rawMarkdown = `---
# Top level comment about worldbuilding
id: "ent-resilient-1"
title: "The Silent Vault"
# Section comment
type: "location"
tags:
  # Internal list comment
  - "underground"
  - "vault"
aliases: []
customProperties:
  # Custom properties comment
  securityLevel: 5
  anchorRef: "*vault_anchor"
---

# The Silent Vault

This is the first paragraph with a [[Secret Archivist]] mention.

Here is another paragraph containing **bold** and *italic* lore.
`
      const { frontmatter, body } = parseFrontmatter(rawMarkdown)
      expect(frontmatter.id).toBe('ent-resilient-1')
      expect(frontmatter.title).toBe('The Silent Vault')
      expect(frontmatter.type).toBe('location')
      expect(frontmatter.tags).toEqual(['underground', 'vault'])
      expect(frontmatter.customProperties.securityLevel).toBe(5)
      expect(body).toContain('# The Silent Vault')
      expect(body).toContain('This is the first paragraph with a [[Secret Archivist]] mention.')
    })

    it('3.3: Deeply nested directory hierarchies with mixed case, spaces, and punctuation (depth 12)', () => {
      const levels = [
        'Cosmic Sphere',
        'Northern Continent',
        'Realm of Eldoria',
        'Kingdom of Silverwood',
        'Province of High_Hills',
        'Barony of St. Jude',
        'Town of Oakhaven',
        'Upper District',
        'Guild of Artificers',
        'Workshop 42',
        'Sub-Vault B',
        'Locker #7'
      ]

      const folders: DirectoryFolder[] = []
      let prevId: string | null = null
      for (let i = 0; i < levels.length; i++) {
        const folderId = `f-level-${i}`
        folders.push({
          id: folderId,
          worldId: 'world-deep',
          name: levels[i],
          parentId: prevId,
          order: i
        })
        prevId = folderId
      }

      const entity: LoreEntity = {
        id: 'e-artifact-deep',
        worldId: 'world-deep',
        title: 'Master Key of Eldoria',
        type: 'item',
        tags: ['relic'],
        aliases: [],
        summary: 'Ancient brass key.',
        content: '<p>Unlocks the innermost vault.</p>',
        isSecret: false,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z'
      }

      const items: DirectoryItem[] = [
        {
          id: 'item-deep-1',
          worldId: 'world-deep',
          folderId: `f-level-${levels.length - 1}`,
          entityId: entity.id,
          order: 0
        }
      ]

      // Export world
      const exportResult = exportWorldToObsidianFiles('Deep World', [entity], folders, items)
      const filePaths = Object.keys(exportResult.files)
      expect(filePaths).toHaveLength(1)
      const filePath = filePaths[0]

      // Verify sanitized path contains all levels
      expect(filePath.split('/')).toHaveLength(levels.length + 1) // 12 folders + 1 file

      // Re-import to world
      const importResult = importObsidianFilesToWorld(exportResult.files)
      expect(importResult.entities).toHaveLength(1)
      expect(importResult.entities[0].title).toBe('Master Key of Eldoria')
      expect(importResult.folders).toHaveLength(levels.length)

      // Verify parentId chain is fully reconstructed
      const rootFolder = importResult.folders.find(f => f.parentId === null)
      expect(rootFolder?.name).toBe('Cosmic Sphere')
    })

    it('3.4: Protected code blocks with markdown wiki-links are preserved without corruption', () => {
      const markdownBody = `# Guide to Writing Mentions

Here is code that must NOT be converted to mentions:
\`\`\`typescript
const target = "[[Dragon]]";
function findEntity() {
  return [[Castle]];
}
\`\`\`

Also inline \`[[NotAMention]]\` should be left alone.
However, this real [[Dragon]] link SHOULD be translated to a mention!`

      const entityMap = new Map<string, string>([
        ['dragon', 'ent-dragon-99'],
        ['castle', 'ent-castle-01']
      ])

      const html = obsidianMarkdownToHtmlContent(markdownBody, entityMap)

      // Protected code block must retain raw [[Dragon]] and [[Castle]]
      expect(html).toContain('const target = "[[Dragon]]";')
      expect(html).toContain('return [[Castle]];')
      expect(html).toContain('`[[NotAMention]]`')

      // The real link must be converted to mention
      expect(html).toContain('<span data-type="mention" data-id="ent-dragon-99" data-label="Dragon">@Dragon</span>')
    })

    it('3.5: Multi-file native Obsidian import without id frontmatter resolves distinct entities and wiki-links', () => {
      const files: Record<string, string> = {
        'Lore/Arthur.md': '---\ntitle: "Arthur"\n---\nArthur meets [[Lancelot]].',
        'Lore/Lancelot.md': '---\ntitle: "Lancelot"\n---\nLancelot serves [[Arthur]].'
      }
      const result = importObsidianFilesToWorld(files)
      expect(result.entities).toHaveLength(2)
      const arthur = result.entities.find(e => e.title === 'Arthur')!
      const lancelot = result.entities.find(e => e.title === 'Lancelot')!
      expect(arthur.id).not.toBe(lancelot.id)
      expect(arthur.content).toContain(`data-id="${lancelot.id}"`)
      expect(lancelot.content).toContain(`data-id="${arthur.id}"`)
    })
  })

  // =========================================================================
  // SECTION 4: FOUNDRY VTT BRIDGE ADVERSARIAL STRESS
  // =========================================================================

  describe('4. Foundry VTT Bridge Adversarial Stress', () => {
    it('4.1: Non-standard hex grid (type 2) preserves geometry, grid size, and unit distance', () => {
      const battlemap: TTRPGBattlemap = {
        id: 'bm-hex-01',
        campaignId: 'camp-hex',
        name: 'Hexagonal Wasteland',
        imageUrl: 'maps/wasteland_hex.webp',
        gridType: 'hex',
        gridSize: 128,
        gridOpacity: 0.5,
        gridUnitFeet: 10,
        showCoordinates: true,
        snapToGrid: true,
        tokens: [],
        walls: [],
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z'
      }

      const dimensions = { width: 3840, height: 2160 }
      const scene = exportBattlemapToFoundryScene(battlemap, 'Hex Campaign', [], dimensions, 0.2)

      expect(scene.grid.type).toBe(2) // Hex type in Foundry
      expect(scene.grid.size).toBe(128)
      expect(scene.grid.distance).toBe(10)
      expect(scene.grid.alpha).toBe(0.5)

      // Re-import
      const imported = importFoundrySceneToBattlemap(scene, 'camp-hex')
      expect(imported.battlemap.gridType).toBe('hex')
      expect(imported.battlemap.gridSize).toBe(128)
      expect(imported.battlemap.gridUnitFeet).toBe(10)
      expect(imported.battlemap.gridOpacity).toBe(0.5)
    })

    it('4.2: Tokens with extreme sizes (0.5 to 4.0), 0 current HP, and unusual dispositions', () => {
      const battlemap: TTRPGBattlemap = {
        id: 'bm-tokens-adv',
        campaignId: 'camp-tokens',
        name: 'Boss Arena',
        imageUrl: 'maps/arena.jpg',
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.3,
        gridUnitFeet: 5,
        showCoordinates: false,
        snapToGrid: true,
        walls: [],
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z',
        tokens: [
          {
            id: 'tok-tiny',
            campaignId: 'camp-tokens',
            battlemapId: 'bm-tokens-adv',
            name: 'Pixie (Tiny)',
            x: 25.0,
            y: 25.0,
            size: 0.5,
            isEnemy: false, // Friendly -> disposition 1
            hpCurrent: 12,
            hpMax: 12,
            armorClass: 16
          },
          {
            id: 'tok-colossal',
            campaignId: 'camp-tokens',
            battlemapId: 'bm-tokens-adv',
            name: 'Ancient Red Dragon (Gargantuan)',
            x: 50.0,
            y: 50.0,
            size: 4.0,
            isEnemy: true, // Hostile -> disposition -1
            hpCurrent: 0, // Unconscious/Dead -> must be preserved as 0, not defaulted to 10
            hpMax: 546,
            armorClass: 22
          },
          {
            id: 'tok-neutral',
            campaignId: 'camp-tokens',
            battlemapId: 'bm-tokens-adv',
            name: 'Mysterious Wandering Merchant',
            x: 75.0,
            y: 75.0,
            size: 1.0,
            isEnemy: undefined, // Neutral -> disposition 0
            hpCurrent: 30,
            hpMax: 30
          }
        ]
      }

      const dimensions = { width: 1920, height: 1080 }
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', [], dimensions, 0.25)

      // Verify Foundry export token properties
      const fPixie = scene.tokens.find(t => t.name === 'Pixie (Tiny)')!
      expect(fPixie.width).toBe(0.5)
      expect(fPixie.height).toBe(0.5)
      expect(fPixie.disposition).toBe(1)
      expect(fPixie.bar2?.value).toBe(16)

      const fDragon = scene.tokens.find(t => t.name === 'Ancient Red Dragon (Gargantuan)')!
      expect(fDragon.width).toBe(4.0)
      expect(fDragon.height).toBe(4.0)
      expect(fDragon.disposition).toBe(-1)
      expect(fDragon.bar1?.value).toBe(0) // Critical: 0 HP preserved!
      expect(fDragon.bar1?.max).toBe(546)

      const fMerchant = scene.tokens.find(t => t.name === 'Mysterious Wandering Merchant')!
      expect(fMerchant.disposition).toBe(0)

      // Re-import back to Oros
      const imported = importFoundrySceneToBattlemap(scene, 'camp-tokens')
      const impPixie = imported.battlemap.tokens.find(t => t.name === 'Pixie (Tiny)')!
      expect(impPixie.x).toBeCloseTo(25.0, 1)
      expect(impPixie.y).toBeCloseTo(25.0, 1)
      expect(impPixie.size).toBe(0.5)
      expect(impPixie.isEnemy).toBe(false)
      expect(impPixie.armorClass).toBe(16)

      const impDragon = imported.battlemap.tokens.find(t => t.name === 'Ancient Red Dragon (Gargantuan)')!
      expect(impDragon.x).toBeCloseTo(50.0, 1)
      expect(impDragon.y).toBeCloseTo(50.0, 1)
      expect(impDragon.size).toBe(4.0)
      expect(impDragon.isEnemy).toBe(true)
      expect(impDragon.hpCurrent).toBe(0) // Unconscious 0 HP preserved!
      expect(impDragon.hpMax).toBe(546)

      const impMerchant = imported.battlemap.tokens.find(t => t.name === 'Mysterious Wandering Merchant')!
      expect(impMerchant.isEnemy).toBeUndefined()
    })

    it('4.3: Zero-distance walls and subpixel micro-segments across decimal boundaries', () => {
      const battlemap: TTRPGBattlemap = {
        id: 'bm-walls-adv',
        campaignId: 'camp-walls',
        name: 'Dungeon Grid Test',
        imageUrl: 'maps/dungeon.jpg',
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.3,
        gridUnitFeet: 5,
        showCoordinates: false,
        snapToGrid: true,
        tokens: [],
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z',
        walls: [
          // Valid wall
          {
            id: 'w-valid',
            battlemapId: 'bm-walls-adv',
            p1: { x: 10.0, y: 10.0 },
            p2: { x: 20.0, y: 10.0 },
            wallType: 'wall',
            blocksMovement: true,
            blocksVision: true
          },
          // Exact zero-length wall (identical coordinates)
          {
            id: 'w-zero-exact',
            battlemapId: 'bm-walls-adv',
            p1: { x: 30.0, y: 30.0 },
            p2: { x: 30.0, y: 30.0 },
            wallType: 'wall',
            blocksMovement: true,
            blocksVision: true
          },
          // Subpixel micro-wall (< 0.0001% apart, snaps to identical pixel)
          {
            id: 'w-micro-subpixel',
            battlemapId: 'bm-walls-adv',
            p1: { x: 40.00001, y: 40.00001 },
            p2: { x: 40.00002, y: 40.00002 },
            wallType: 'wall',
            blocksMovement: true,
            blocksVision: true
          }
        ]
      }

      const dimensions = { width: 1920, height: 1080 }
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', [], dimensions, 0.25)

      // Both zero-length and subpixel micro-wall should be safely discarded
      expect(scene.walls).toHaveLength(1)
      expect(scene.walls[0]._id).toBe('w-valid')

      // Re-import
      const imported = importFoundrySceneToBattlemap(scene, 'camp-walls')
      expect(imported.walls).toHaveLength(1)
      expect(imported.walls[0].id).toBe('w-valid')
    })

    it('4.4: Complex door states and wall types (regular, secret, open, closed, locked, terrain)', () => {
      const walls: TTRPGWall[] = [
        {
          id: 'w-normal',
          battlemapId: 'bm-complex',
          p1: { x: 10, y: 10 },
          p2: { x: 20, y: 10 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true,
          blocksSound: true
        },
        {
          id: 'w-terrain',
          battlemapId: 'bm-complex',
          p1: { x: 20, y: 10 },
          p2: { x: 30, y: 10 },
          wallType: 'terrain',
          blocksMovement: true,
          blocksVision: true
        },
        {
          id: 'w-door-open',
          battlemapId: 'bm-complex',
          p1: { x: 30, y: 10 },
          p2: { x: 40, y: 10 },
          wallType: 'wall',
          blocksMovement: false,
          blocksVision: false,
          isDoor: true,
          doorType: 'regular',
          doorState: 'open'
        },
        {
          id: 'w-door-locked',
          battlemapId: 'bm-complex',
          p1: { x: 40, y: 10 },
          p2: { x: 50, y: 10 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true,
          isDoor: true,
          doorType: 'regular',
          doorState: 'locked'
        },
        {
          id: 'w-door-secret',
          battlemapId: 'bm-complex',
          p1: { x: 50, y: 10 },
          p2: { x: 60, y: 10 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true,
          isDoor: true,
          doorType: 'secret',
          doorState: 'closed'
        }
      ]

      const battlemap: TTRPGBattlemap = {
        id: 'bm-complex',
        campaignId: 'camp-complex',
        name: 'Crypt of Secrets',
        imageUrl: 'maps/crypt.webp',
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.3,
        gridUnitFeet: 5,
        showCoordinates: false,
        snapToGrid: true,
        tokens: [],
        walls,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z'
      }

      const dimensions = { width: 2000, height: 1000 }
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', walls, dimensions, 0.25)

      // Foundry assertions
      expect(scene.walls).toHaveLength(5)
      const fwNormal = scene.walls.find(w => w._id === 'w-normal')!
      expect(fwNormal.move).toBe(20)
      expect(fwNormal.sense).toBe(20)
      expect(fwNormal.sound).toBe(20)
      expect(fwNormal.door).toBe(0)

      const fwTerrain = scene.walls.find(w => w._id === 'w-terrain')!
      expect(fwTerrain.sense).toBe(10) // Terrain sense in Foundry is 10

      const fwDoorOpen = scene.walls.find(w => w._id === 'w-door-open')!
      expect(fwDoorOpen.door).toBe(1) // Regular door
      expect(fwDoorOpen.ds).toBe(1) // Open state

      const fwDoorLocked = scene.walls.find(w => w._id === 'w-door-locked')!
      expect(fwDoorLocked.door).toBe(1)
      expect(fwDoorLocked.ds).toBe(2) // Locked state

      const fwDoorSecret = scene.walls.find(w => w._id === 'w-door-secret')!
      expect(fwDoorSecret.door).toBe(2) // Secret door
      expect(fwDoorSecret.ds).toBe(0) // Closed state

      // Re-import
      const imported = importFoundrySceneToBattlemap(scene, 'camp-complex')
      expect(imported.walls).toHaveLength(5)

      const impTerrain = imported.walls.find(w => w.id === 'w-terrain')!
      expect(impTerrain.wallType).toBe('terrain')

      const impOpen = imported.walls.find(w => w.id === 'w-door-open')!
      expect(impOpen.isDoor).toBe(true)
      expect(impOpen.doorType).toBe('regular')
      expect(impOpen.doorState).toBe('open')

      const impLocked = imported.walls.find(w => w.id === 'w-door-locked')!
      expect(impLocked.isDoor).toBe(true)
      expect(impLocked.doorType).toBe('regular')
      expect(impLocked.doorState).toBe('locked')

      const impSecret = imported.walls.find(w => w.id === 'w-door-secret')!
      expect(impSecret.isDoor).toBe(true)
      expect(impSecret.doorType).toBe('secret')
      expect(impSecret.doorState).toBe('closed')
    })
  })
})
