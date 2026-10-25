import { describe, it, expect } from 'vitest'
import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, RelationEdge } from '@shared/types'
import {
  parseWikiLinks,
  formatWikiLink,
  extractForwardLinks,
  buildBiDirectionalLinkGraph,
  formatHoverPreview,
  ParsedWikiLink
} from './helpers/wikiLinkHelper'
import { findBacklinksForEntity } from '@/utils/backlinksEngine'

describe('Wiki Bi-directional Linking Suite (E2E)', () => {
  // Test Fixtures
  const createEntity = (id: string, title: string, content: string = '', options: Partial<LoreEntity> = {}): LoreEntity => ({
    id,
    worldId: 'world-001',
    title,
    type: 'character',
    tags: ['hero', 'lore'],
    aliases: [],
    summary: 'A legendary figure of the Northern Reach.',
    content,
    isSecret: false,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...options
  })

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 per feature)
  // =========================================================================

  describe('Tier 1: Feature 7 - Wiki-Link Autocomplete & Syntax Parsing', () => {
    it('T1.7.1: should parse standard [[Target]] syntax', () => {
      const text = 'The hero met with [[Archmage Corvus]] at the citadel.'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Archmage Corvus')
      expect(links[0].section).toBeUndefined()
      expect(links[0].label).toBeUndefined()
      expect(links[0].raw).toBe('[[Archmage Corvus]]')
    })

    it('T1.7.2: should parse alias syntax [[Target|Custom Label]]', () => {
      const text = 'He was known as [[Archmage Corvus|The Raven of the Spire]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Archmage Corvus')
      expect(links[0].label).toBe('The Raven of the Spire')
      expect(links[0].section).toBeUndefined()
    })

    it('T1.7.3: should parse section anchor syntax [[Target#Section]]', () => {
      const text = 'Refer to the historical notes in [[Annals of the North#The Great Siege]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Annals of the North')
      expect(links[0].section).toBe('The Great Siege')
      expect(links[0].label).toBeUndefined()
    })

    it('T1.7.4: should parse combined section anchor and custom alias [[Target#Section|Label]]', () => {
      const text = 'Details in [[Annals of the North#The Great Siege|The Winter War Section]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Annals of the North')
      expect(links[0].section).toBe('The Great Siege')
      expect(links[0].label).toBe('The Winter War Section')
    })

    it('T1.7.5: should parse multiple diverse wiki-links within a single document', () => {
      const text = `
        In the year 412, [[Lord Vaelen]] journeyed from [[Horn-Keep#Upper Armory|The High Bastion]]
        to meet [[Archmage Corvus|The Raven]] in [[Ostergard]].
      `
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(4)
      expect(links.map(l => l.target)).toEqual([
        'Lord Vaelen',
        'Horn-Keep',
        'Archmage Corvus',
        'Ostergard'
      ])
      expect(links[1].section).toBe('Upper Armory')
      expect(links[1].label).toBe('The High Bastion')
      expect(links[2].label).toBe('The Raven')
    })

    it('T1.7.6: formatWikiLink generates valid wiki-link strings', () => {
      expect(formatWikiLink('Corvus')).toBe('[[Corvus]]')
      expect(formatWikiLink('Corvus', { label: 'The Mage' })).toBe('[[Corvus|The Mage]]')
      expect(formatWikiLink('Corvus', { section: 'Spells' })).toBe('[[Corvus#Spells]]')
      expect(formatWikiLink('Corvus', { section: 'Spells', label: 'Incantations' })).toBe('[[Corvus#Spells|Incantations]]')
    })
  })

  describe('Tier 1: Feature 8 - Bi-directional Link Indexing', () => {
    it('T1.8.1: extracts outgoing forward links from entity content and infoboxes', () => {
      const targetEntity = createEntity('e-target', 'Sunken Quay')
      const sourceEntity = createEntity('e-source', 'Salt-Cairn Tavern', '<p>Located near [[Sunken Quay]].</p>', {
        infobox: {
          sections: [
            {
              title: 'Geography',
              fields: [
                { id: 'f1', label: 'Port', value: 'Sunken Quay', type: 'entity-link', targetEntityId: 'e-target' }
              ]
            }
          ]
        }
      })

      const forwardLinks = extractForwardLinks(sourceEntity, [sourceEntity, targetEntity])
      expect(forwardLinks).toHaveLength(2)
      expect(forwardLinks.some(f => f.targetId === 'e-target' && f.sourceField === 'content')).toBe(true)
      expect(forwardLinks.some(f => f.targetId === 'e-target' && f.sourceField === 'infobox')).toBe(true)
    })

    it('T1.8.2: calculates incoming backlinks from manuscript chapters', () => {
      const targetEntity = createEntity('e-vaelen', 'Vaelen the Northguard', '', { aliases: ['The Boreal Warden'] })
      const chapter: ManuscriptChapter = {
        id: 'ch-1',
        worldId: 'world-001',
        manuscriptId: 'm-1',
        title: 'Chapter 1: The Boreal Gale',
        content: '<p>The wind howled as Vaelen the Northguard stood atop the battlement.</p>',
        order: 1,
        wordCount: 120,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }

      const backlinks = findBacklinksForEntity(targetEntity, [targetEntity], [chapter])
      expect(backlinks.totalCount).toBe(1)
      expect(backlinks.chapters).toHaveLength(1)
      expect(backlinks.chapters[0].title).toBe('Chapter 1: The Boreal Gale')
      expect(backlinks.chapters[0].snippet).toContain('Vaelen the Northguard')
    })

    it('T1.8.3: calculates incoming backlinks from other lore entities via alias', () => {
      const targetEntity = createEntity('e-corvus', 'Archmage Corvus', '', { aliases: ['The Raven'] })
      const sourceEntity = createEntity('e-apprentice', 'Kaelen', '<p>Apprentice to [[The Raven]].</p>')

      const backlinks = findBacklinksForEntity(targetEntity, [targetEntity, sourceEntity])
      expect(backlinks.totalCount).toBe(1)
      expect(backlinks.lore).toHaveLength(1)
      expect(backlinks.lore[0].id).toBe('e-apprentice')
      expect(backlinks.lore[0].title).toBe('Kaelen')
    })

    it('T1.8.4: calculates incoming backlinks from map pins and regions', () => {
      const targetEntity = createEntity('e-tower', 'Tower of Eyes')
      const map: WorldMap = {
        id: 'map-1',
        worldId: 'world-001',
        name: 'Northern Territories',
        imageUrl: 'map.png',
        width: 2000,
        height: 1500,
        pins: [
          {
            id: 'pin-1',
            mapId: 'map-1',
            worldId: 'world-001',
            title: 'Tower of Eyes Pin',
            x: 45,
            y: 30,
            entityId: 'e-tower'
          }
        ],
        regions: [],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }

      const backlinks = findBacklinksForEntity(targetEntity, [targetEntity], [], [map])
      expect(backlinks.maps).toHaveLength(1)
      expect(backlinks.maps[0].mapName).toBe('Northern Territories')
      expect(backlinks.maps[0].targetId).toBe('pin-1')
    })

    it('T1.8.5: calculates incoming backlinks from timeline events and relationship edges', () => {
      const entityA = createEntity('e-a', 'Lord Vaelen')
      const entityB = createEntity('e-b', 'Archmage Corvus')

      const timeline: TimelineEvent = {
        id: 'ev-1',
        worldId: 'world-001',
        era: 'Fourth Age',
        year: 450,
        importance: 'major',
        title: 'Council of the Spire',
        description: 'Lord Vaelen meets with Archmage Corvus to sign the alliance treaty.',
        entityIds: ['e-a', 'e-b']
      }

      const relation: RelationEdge = {
        id: 'rel-1',
        worldId: 'world-001',
        sourceEntityId: 'e-a',
        targetEntityId: 'e-b',
        relationType: 'ally',
        label: 'Oath of Fealty'
      }

      const backlinksA = findBacklinksForEntity(entityA, [entityA, entityB], [], [], [timeline], [relation])
      expect(backlinksA.timelines).toHaveLength(1)
      expect(backlinksA.timelines[0].title).toBe('Council of the Spire')
      expect(backlinksA.relations).toHaveLength(1)
      expect(backlinksA.relations[0].relatedEntityTitle).toBe('Archmage Corvus')
      expect(backlinksA.relations[0].isIncoming).toBe(false)

      const backlinksB = findBacklinksForEntity(entityB, [entityA, entityB], [], [], [timeline], [relation])
      expect(backlinksB.relations[0].relatedEntityTitle).toBe('Lord Vaelen')
      expect(backlinksB.relations[0].isIncoming).toBe(true)
    })
  })

  describe('Tier 1: Feature 9 - Wiki-Link Hover Previews & Navigation', () => {
    it('T1.9.1: extracts full hover preview data from entity', () => {
      const entity = createEntity('e-1', 'Vaelen', '<p>Leader of the Northguard.</p>', {
        summary: 'Boreal warden and military commander.',
        avatarUrl: 'assets/vaelen.png',
        bannerUrl: 'assets/vaelen-banner.png',
        tags: ['commander', 'canonical'],
        infobox: {
          sections: [
            {
              title: 'Stats',
              fields: [
                { id: 'f1', label: 'Rank', value: 'High Warden', type: 'text' },
                { id: 'f2', label: 'Age', value: '38', type: 'number' }
              ]
            }
          ]
        }
      })

      const preview = formatHoverPreview(entity)
      expect(preview.id).toBe('e-1')
      expect(preview.title).toBe('Vaelen')
      expect(preview.status).toBe('canonical')
      expect(preview.summary).toBe('Boreal warden and military commander.')
      expect(preview.avatarUrl).toBe('assets/vaelen.png')
      expect(preview.quickFacts).toHaveLength(2)
      expect(preview.quickFacts[0]).toEqual({ label: 'Rank', value: 'High Warden' })
    })

    it('T1.9.2: falls back to first content paragraph when summary is missing', () => {
      const entity = createEntity('e-2', 'The Iron Gate', '<p>An ancient monolith forged in the First Age.</p>', {
        summary: ''
      })

      const preview = formatHoverPreview(entity)
      expect(preview.summary).toContain('An ancient monolith forged in the First Age.')
    })

    it('T1.9.3: correctly flags secret status for secret entities', () => {
      const secretEntity = createEntity('e-secret', 'The Obsidian Dagger', '<p>Secret relic.</p>', {
        isSecret: true
      })

      const preview = formatHoverPreview(secretEntity)
      expect(preview.status).toBe('secret')
    })

    it('T1.9.4: truncates overlong summaries cleanly with ellipsis', () => {
      const longSummary = 'A'.repeat(250)
      const entity = createEntity('e-3', 'Long Article', '', { summary: longSummary })

      const preview = formatHoverPreview(entity, 100)
      expect(preview.summary.length).toBeLessThanOrEqual(104)
      expect(preview.summary.endsWith('...')).toBe(true)
    })

    it('T1.9.5: limits quickFacts to maximum 4 items for compact preview presentation', () => {
      const entity = createEntity('e-4', 'Detailed Entity', '', {
        infobox: {
          sections: [
            {
              title: 'Attributes',
              fields: [
                { id: '1', label: 'A', value: '1', type: 'text' },
                { id: '2', label: 'B', value: '2', type: 'text' },
                { id: '3', label: 'C', value: '3', type: 'text' },
                { id: '4', label: 'D', value: '4', type: 'text' },
                { id: '5', label: 'E', value: '5', type: 'text' }
              ]
            }
          ]
        }
      })

      const preview = formatHoverPreview(entity)
      expect(preview.quickFacts).toHaveLength(4)
    })
  })

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 per feature)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: handles empty input, pure whitespace, and empty link brackets [[]]', () => {
      expect(parseWikiLinks('')).toEqual([])
      expect(parseWikiLinks('   ')).toEqual([])
      expect(parseWikiLinks('[[]]')).toEqual([])
      expect(parseWikiLinks('[[   ]]')).toEqual([])
    })

    it('T2.2: handles special characters, punctuation, quotes, and slashes in entity titles', () => {
      const text = 'Wielding [[Axe & Shield / "The Blade" of Oros: Vol. 1?]] in battle.'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Axe & Shield / "The Blade" of Oros: Vol. 1?')
    })

    it('T2.3: handles malformed, unclosed, or triple brackets gracefully without throwing', () => {
      const text = 'Here is [[[Invalid Triple]]] and [[Unclosed bracket at end'
      const links = parseWikiLinks(text)

      // Should extract inner valid link or ignore broken brackets
      expect(links.length).toBeGreaterThanOrEqual(1)
      expect(links.some(l => l.target === 'Invalid Triple')).toBe(true)
    })

    it('T2.4: resilient against cyclic entity references (A -> B -> A)', () => {
      const entityA = createEntity('e-a', 'Entity Alpha', '<p>References [[Entity Beta]].</p>')
      const entityB = createEntity('e-b', 'Entity Beta', '<p>References [[Entity Alpha]].</p>')

      const graph = buildBiDirectionalLinkGraph([entityA, entityB])

      const forwardA = graph.outgoingForwardLinks.get('e-a')!
      const forwardB = graph.outgoingForwardLinks.get('e-b')!
      const backA = graph.incomingBacklinks.get('e-a')!
      const backB = graph.incomingBacklinks.get('e-b')!

      expect(forwardA[0].targetTitle).toBe('Entity Beta')
      expect(forwardB[0].targetTitle).toBe('Entity Alpha')
      expect(backA.lore[0].title).toBe('Entity Beta')
      expect(backB.lore[0].title).toBe('Entity Alpha')
    })

    it('T2.5: self-referencing links do not create duplicate or self-corrupted backlinks', () => {
      const entity = createEntity('e-self', 'Self Referencer', '<p>I am [[Self Referencer]] itself.</p>')
      const backlinks = findBacklinksForEntity(entity, [entity])

      // Self-backlink should be ignored in lore list
      expect(backlinks.lore).toHaveLength(0)
    })

    it('T2.6: case-insensitive target resolution matches entities regardless of casing', () => {
      const target = createEntity('e-upper', 'ARCHMAGE CORVUS')
      const source = createEntity('e-src', 'Apprentice', '<p>Studies under [[archmage corvus]].</p>')

      const forward = extractForwardLinks(source, [target])
      expect(forward[0].targetId).toBe('e-upper')
    })
  })

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Wiki-linking + Manuscript Chapters + Timeline Event complete integration', () => {
      const hero = createEntity('e-hero', 'Kaelen Sun-Walker')
      const chapter: ManuscriptChapter = {
        id: 'ch-2',
        worldId: 'world-001',
        manuscriptId: 'm-1',
        title: 'The Eclipse',
        content: '<p>[[Kaelen Sun-Walker]] looked upon the darkened sky.</p>',
        order: 2,
        wordCount: 80,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }
      const event: TimelineEvent = {
        id: 'ev-2',
        worldId: 'world-001',
        era: 'Third Age',
        year: 120,
        importance: 'mythic',
        title: 'The Great Eclipse',
        description: 'Kaelen Sun-Walker seals the rift during the eclipse.',
        entityIds: ['e-hero']
      }

      const backlinks = findBacklinksForEntity(hero, [hero], [chapter], [], [event])
      expect(backlinks.totalCount).toBe(2)
      expect(backlinks.chapters).toHaveLength(1)
      expect(backlinks.timelines).toHaveLength(1)
    })
  })

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIO
  // =========================================================================

  describe('Tier 4: Real-World Scenario - "The Chronicles of Ostergard"', () => {
    it('T4.1: executes end-to-end codex linking across 5 interlinked entities and chapters', () => {
      const ostergard = createEntity('e-ost', 'Ostergard Faction', '<p>Guarded by [[Lord Vaelen|The High Commander]].</p>')
      const vaelen = createEntity('e-vae', 'Lord Vaelen', '<p>Boreal Warden of [[Horn-Keep#Upper Bastion]].</p>', {
        aliases: ['The High Commander', 'Boreal Warden']
      })
      const hornKeep = createEntity('e-horn', 'Horn-Keep', '<p>Seat of power in [[Ostergard Faction]]. Contains [[The Frost Glaive]].</p>')
      const frostGlaive = createEntity('e-glaive', 'The Frost Glaive', '<p>Legendary weapon forged in [[Horn-Keep]].</p>')
      const battleOfPass = createEntity('e-battle', 'Battle of the Boreal Pass', '<p>Where [[Lord Vaelen]] defeated the horde with [[The Frost Glaive]].</p>')

      const allEntities = [ostergard, vaelen, hornKeep, frostGlaive, battleOfPass]
      const graph = buildBiDirectionalLinkGraph(allEntities)

      // 1. Verify forward links
      const vaelenForward = graph.outgoingForwardLinks.get('e-vae')!
      expect(vaelenForward.some(f => f.targetTitle === 'Horn-Keep' && f.section === 'Upper Bastion')).toBe(true)

      const battleForward = graph.outgoingForwardLinks.get('e-battle')!
      expect(battleForward).toHaveLength(2)
      expect(battleForward.map(f => f.targetTitle)).toContain('Lord Vaelen')
      expect(battleForward.map(f => f.targetTitle)).toContain('The Frost Glaive')

      // 2. Verify incoming backlinks
      const vaelenBacklinks = graph.incomingBacklinks.get('e-vae')!
      expect(vaelenBacklinks.lore.map(l => l.title)).toContain('Ostergard Faction')
      expect(vaelenBacklinks.lore.map(l => l.title)).toContain('Battle of the Boreal Pass')

      const glaiveBacklinks = graph.incomingBacklinks.get('e-glaive')!
      expect(glaiveBacklinks.lore.map(l => l.title)).toContain('Horn-Keep')
      expect(glaiveBacklinks.lore.map(l => l.title)).toContain('Battle of the Boreal Pass')

      // 3. Verify hover previews
      const preview = formatHoverPreview(vaelen)
      expect(preview.title).toBe('Lord Vaelen')
      expect(preview.status).toBe('draft')
      expect(preview.summary).toBe('A legendary figure of the Northern Reach.')
    })
  })
})
