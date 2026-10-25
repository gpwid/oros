import { describe, it, expect } from 'vitest'
import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, RelationEdge } from '@shared/types'
import {
  parseWikiLinks,
  formatWikiLink,
  findForwardLinksForEntity,
  findBacklinksForEntity,
  extractForwardLinks
} from '@/utils/backlinksEngine'
import {
  parseWikiLinks as helperParseWikiLinks,
  formatWikiLink as helperFormatWikiLink,
  extractForwardLinks as helperExtractForwardLinks,
  buildBiDirectionalLinkGraph,
  formatHoverPreview
} from './helpers/wikiLinkHelper'

describe('Milestone 2 Adversarial Stress Suite — Wiki-Link & Bi-directional Indexing', () => {
  const createEntity = (id: string, title: string, content: string = '', options: Partial<LoreEntity> = {}): LoreEntity => ({
    id,
    worldId: 'world-adv-001',
    title,
    type: 'character',
    tags: ['adversarial'],
    aliases: [],
    summary: 'Stress test entity.',
    content,
    isSecret: false,
    createdAt: '2026-10-24T00:00:00Z',
    updatedAt: '2026-10-24T00:00:00Z',
    ...options
  })

  // =========================================================================
  // 1. COMPLEX ALIASES & SECTION ANCHORS
  // =========================================================================

  describe('1. Complex Aliases & Section Anchors Syntax', () => {
    it('ADV.1.1: parses section anchors with spaces, hyphens, and punctuation', () => {
      const text = 'See [[Codex Gigas#Section 4.2 - The "Dark" Prophecy: Part A|The Ancient Text]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Codex Gigas')
      expect(links[0].section).toBe('Section 4.2 - The "Dark" Prophecy: Part A')
      expect(links[0].label).toBe('The Ancient Text')
      expect(links[0].raw).toBe('[[Codex Gigas#Section 4.2 - The "Dark" Prophecy: Part A|The Ancient Text]]')
    })

    it('ADV.1.2: trims redundant whitespace in target, section, and alias', () => {
      const text = 'Examine [[   Mount Doom   #   Crater Peak   |   The Fiery Chasm   ]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Mount Doom')
      expect(links[0].section).toBe('Crater Peak')
      expect(links[0].label).toBe('The Fiery Chasm')
    })

    it('ADV.1.3: parses multiple hashes in section anchor without throwing', () => {
      const text = 'Cross-reference [[Chronicles#Book1#Chapter2|Tome Ref]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Chronicles')
      expect(links[0].section).toBe('Book1#Chapter2')
      expect(links[0].label).toBe('Tome Ref')
    })

    it('ADV.1.4: parses multiple pipes in alias label without throwing', () => {
      const text = 'Refer to [[Hero|Warrior|Paladin|Champion]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Hero')
      expect(links[0].label).toBe('Warrior|Paladin|Champion')
    })

    it('ADV.1.5: roundtrips target, section, and label with formatWikiLink', () => {
      const target = 'Aethelgard High Council'
      const section = 'Chamber of Whispers'
      const label = 'The Silent Hall'

      const formatted = formatWikiLink(target, { section, label })
      expect(formatted).toBe('[[Aethelgard High Council#Chamber of Whispers|The Silent Hall]]')

      const parsed = parseWikiLinks(formatted)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].target).toBe(target)
      expect(parsed[0].section).toBe(section)
      expect(parsed[0].label).toBe(label)
    })

    it('ADV.1.6: formatWikiLink handles partial and empty options gracefully', () => {
      expect(formatWikiLink('Hero')).toBe('[[Hero]]')
      expect(formatWikiLink('Hero', {})).toBe('[[Hero]]')
      expect(formatWikiLink('Hero', { section: '', label: '' })).toBe('[[Hero]]')
      expect(formatWikiLink('Hero', { section: 'Arcane', label: '' })).toBe('[[Hero#Arcane]]')
      expect(formatWikiLink('Hero', { section: '', label: 'The Brave' })).toBe('[[Hero|The Brave]]')
      expect(formatWikiLink('  Hero  ', { section: '  Sec  ', label: '  Lbl  ' })).toBe('[[Hero#Sec|Lbl]]')
    })
  })

  // =========================================================================
  // 2. UNICODE, RUNES, EMOJI & MULTI-LANGUAGE
  // =========================================================================

  describe('2. Unicode, Nordic Runes, CJK, Cyrillic, RTL & Emoji', () => {
    it('ADV.2.1: parses Old Norse runes and Scandinavian diacritics', () => {
      const text = 'Worship of [[Óðinn Alföðr#Hliðskjálf|Þórr & Freyr]] in [[Ásgardr]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(2)
      expect(links[0].target).toBe('Óðinn Alföðr')
      expect(links[0].section).toBe('Hliðskjálf')
      expect(links[0].label).toBe('Þórr & Freyr')
      expect(links[1].target).toBe('Ásgardr')
    })

    it('ADV.2.2: parses CJK Chinese, Japanese and Korean ideographs', () => {
      const text = '史记：[[秦始皇#统一六国|始皇帝]] 建立了天下。参见 [[宮本武蔵#五輪書|二天一流]] 及 [[광개토대왕]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(3)
      expect(links[0].target).toBe('秦始皇')
      expect(links[0].section).toBe('统一六国')
      expect(links[0].label).toBe('始皇帝')
      expect(links[1].target).toBe('宮本武蔵')
      expect(links[1].section).toBe('五輪書')
      expect(links[1].label).toBe('二天一流')
      expect(links[2].target).toBe('광개토대왕')
    })

    it('ADV.2.3: parses Arabic / RTL text inside wiki links', () => {
      const text = 'زيارة [[مدينة السلام#دار الحكمة|بغداد عاصمة الخلافة]] في العصر الذهبي.'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('مدينة السلام')
      expect(links[0].section).toBe('دار الحكمة')
      expect(links[0].label).toBe('بغداد عاصمة الخلافة')
    })

    it('ADV.2.4: parses Cyrillic names and sections', () => {
      const text = 'Летопись: [[Ярослав Мудрый#Правление Киевом|Великий князь]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Ярослав Мудрый')
      expect(links[0].section).toBe('Правление Киевом')
      expect(links[0].label).toBe('Великий князь')
    })

    it('ADV.2.5: parses fantasy emojis within wiki links', () => {
      const text = 'Quest to [[🏰 Dragon Lair 🔥#💎 Hoard|🐉 Smaug the Terrible]].'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('🏰 Dragon Lair 🔥')
      expect(links[0].section).toBe('💎 Hoard')
      expect(links[0].label).toBe('🐉 Smaug the Terrible')
    })
  })

  // =========================================================================
  // 3. BRACKET COLLISIONS & MALFORMED SYNTAX RESILIENCE
  // =========================================================================

  describe('3. Bracket Collisions & Malformed Inputs', () => {
    it('ADV.3.1: extracts inner link from triple brackets [[[Target]]]', () => {
      const text = 'Faulty syntax [[[Valid Inner Target]]] surrounded by extra bracket.'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Valid Inner Target')
    })

    it('ADV.3.2: extracts inner link from quadruple brackets [[[[Target]]]]', () => {
      const text = 'Nested [[[[Quadruple Target]]]] text.'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(1)
      expect(links[0].target).toBe('Quadruple Target')
    })

    it('ADV.3.3: handles back-to-back adjacent wiki links without spacing', () => {
      const text = 'Adjacent: [[Entity Alpha]][[Entity Beta]][[Entity Gamma]]'
      const links = parseWikiLinks(text)

      expect(links).toHaveLength(3)
      expect(links.map(l => l.target)).toEqual(['Entity Alpha', 'Entity Beta', 'Entity Gamma'])
    })

    it('ADV.3.4: ignores unclosed, unopened, or standalone brackets without throwing', () => {
      const malformedCases = [
        'Standalone [[',
        'Standalone ]]',
        'Unclosed [[Incomplete Target',
        'Unopened Target]]',
        'Empty link [[]]',
        'Whitespace link [[    ]]',
        'Hash only [[#]]',
        'Pipe only [[|]]',
        'Section with empty target [[#Section]]',
        'Target with empty section [[Target#]]',
        'Broken nested [[Target [Inner] Rest]]',
        'Single bracket [Markdown Link](https://oros.studio)'
      ]

      for (const str of malformedCases) {
        expect(() => parseWikiLinks(str)).not.toThrow()
      }

      // Check that none of the purely broken empty links return valid targets
      expect(parseWikiLinks('[[]]')).toEqual([])
      expect(parseWikiLinks('[[   ]]')).toEqual([])
      expect(parseWikiLinks('[[#]]')).toEqual([])
      expect(parseWikiLinks('[[|]]')).toEqual([])
    })

    it('ADV.3.5: handles null, undefined, numbers, and boolean inputs gracefully', () => {
      expect(parseWikiLinks(null as any)).toEqual([])
      expect(parseWikiLinks(undefined as any)).toEqual([])
      expect(parseWikiLinks('' as any)).toEqual([])
      expect(() => parseWikiLinks(12345 as any)).not.toThrow()
    })
  })

  // =========================================================================
  // 4. FORWARD LINKS EXTRACTION & ALIAS RESOLUTION
  // =========================================================================

  describe('4. Forward Links Extraction & Resolution', () => {
    it('ADV.4.1: resolves forward links targeting aliases', () => {
      const targetEntity = createEntity('e-corvus', 'Archmage Corvus', '', {
        aliases: ['The Raven of the Spire', 'Old Corvus']
      })
      const sourceEntity = createEntity('e-source', 'Chronicle', '<p>Consulted [[The Raven of the Spire]] at dawn.</p>')

      const forwardLinks = findForwardLinksForEntity(sourceEntity, [targetEntity, sourceEntity])
      expect(forwardLinks).toHaveLength(1)
      expect(forwardLinks[0].targetId).toBe('e-corvus')
      expect(forwardLinks[0].targetTitle).toBe('The Raven of the Spire')
    })

    it('ADV.4.2: resolves forward links with section anchors and aliases', () => {
      const targetEntity = createEntity('e-citadel', 'The Obsidian Citadel')
      const sourceEntity = createEntity('e-src', 'Notes', '<p>Attacked [[The Obsidian Citadel#Lower Dungeons|The Prison Level]].</p>')

      const forwardLinks = findForwardLinksForEntity(sourceEntity, [targetEntity, sourceEntity])
      expect(forwardLinks).toHaveLength(1)
      expect(forwardLinks[0].targetId).toBe('e-citadel')
      expect(forwardLinks[0].targetTitle).toBe('The Obsidian Citadel')
      expect(forwardLinks[0].section).toBe('Lower Dungeons')
      expect(forwardLinks[0].label).toBe('The Prison Level')
      expect(forwardLinks[0].sourceField).toBe('content')
    })

    it('ADV.4.3: retains ghost / unresolved forward links with targetId undefined', () => {
      const sourceEntity = createEntity('e-src', 'Myth', '<p>The lost realm of [[Atlantis#Submerged Core]].</p>')
      const forwardLinks = findForwardLinksForEntity(sourceEntity, [sourceEntity])

      expect(forwardLinks).toHaveLength(1)
      expect(forwardLinks[0].targetId).toBeUndefined()
      expect(forwardLinks[0].targetTitle).toBe('Atlantis')
      expect(forwardLinks[0].section).toBe('Submerged Core')
    })

    it('ADV.4.4: handles entities with malformed or missing infobox sections', () => {
      const targetEntity = createEntity('e-target', 'Target Lore')
      const malformedSource = createEntity('e-src', 'Malformed Source', '', {
        infobox: {
          sections: [
            { title: 'Empty', fields: [] },
            { title: 'Broken Fields', fields: undefined as any },
            {
              title: 'Valid',
              fields: [
                { id: 'f1', label: 'Ally', value: 'Target Lore', type: 'entity-link', targetEntityId: 'e-target' },
                { id: 'f2', label: 'Invalid Link', value: '', type: 'entity-link', targetEntityId: '' }
              ]
            }
          ]
        }
      })

      const forwardLinks = findForwardLinksForEntity(malformedSource, [targetEntity, malformedSource])
      expect(forwardLinks).toHaveLength(1)
      expect(forwardLinks[0].targetId).toBe('e-target')
      expect(forwardLinks[0].sourceField).toBe('infobox')
    })
  })

  // =========================================================================
  // 5. CIRCULAR REFERENCES & SELF-LINKING RESILIENCE
  // =========================================================================

  describe('5. Circular References & Self-Linking Entities', () => {
    it('ADV.5.1: 3-cycle circular references (A -> B -> C -> A) resolve without infinite loops', () => {
      const entityA = createEntity('e-a', 'Kingdom of Aerith', '<p>Bordering [[Duchy of Valen]].</p>')
      const entityB = createEntity('e-b', 'Duchy of Valen', '<p>Bordering [[Barony of Cinder]].</p>')
      const entityC = createEntity('e-c', 'Barony of Cinder', '<p>Bordering [[Kingdom of Aerith]].</p>')

      const all = [entityA, entityB, entityC]
      const graph = buildBiDirectionalLinkGraph(all)

      // Forward link checks
      expect(graph.outgoingForwardLinks.get('e-a')![0].targetId).toBe('e-b')
      expect(graph.outgoingForwardLinks.get('e-b')![0].targetId).toBe('e-c')
      expect(graph.outgoingForwardLinks.get('e-c')![0].targetId).toBe('e-a')

      // Backlink checks
      expect(graph.incomingBacklinks.get('e-a')!.lore[0].id).toBe('e-c')
      expect(graph.incomingBacklinks.get('e-b')!.lore[0].id).toBe('e-a')
      expect(graph.incomingBacklinks.get('e-c')!.lore[0].id).toBe('e-b')
    })

    it('ADV.5.2: self-linking entities do not corrupt backlink state or duplicate entries', () => {
      const selfEntity = createEntity('e-self', 'Ouroboros', '<p>The snake [[Ouroboros]] devours itself via [[Ouroboros#Tail]].</p>', {
        infobox: {
          sections: [
            {
              title: 'Self-Ref',
              fields: [
                { id: 'f-self', label: 'Origin', value: 'Ouroboros', type: 'entity-link', targetEntityId: 'e-self' }
              ]
            }
          ]
        }
      })

      // Forward links should reflect outgoing self references
      const forwardLinks = findForwardLinksForEntity(selfEntity, [selfEntity])
      expect(forwardLinks).toHaveLength(3) // 2 content links + 1 infobox link
      expect(forwardLinks.every(f => f.targetId === 'e-self')).toBe(true)

      // Backlinks MUST ignore self-references in lore list
      const backlinks = findBacklinksForEntity(selfEntity, [selfEntity])
      expect(backlinks.lore).toHaveLength(0)
      expect(backlinks.totalCount).toBe(0)
    })

    it('ADV.5.3: dense mesh network of 10 entities mutually linked executes with linear scaling', () => {
      const meshSize = 10
      const entities: LoreEntity[] = []

      for (let i = 0; i < meshSize; i++) {
        entities.push(createEntity(`mesh-${i}`, `Node ${i}`))
      }

      // Every entity links to all other entities
      entities.forEach((ent, idx) => {
        const others = entities.filter((_, i) => i !== idx)
        ent.content = others.map(o => `<p>Linked to [[${o.title}]].</p>`).join('\n')
      })

      const t0 = performance.now()
      const graph = buildBiDirectionalLinkGraph(entities)
      const t1 = performance.now()

      expect(t1 - t0).toBeLessThan(150) // Should complete in well under 150ms
      expect(graph.allEntityIds).toHaveLength(meshSize)

      // Each entity should have 9 forward links and 9 incoming lore backlinks
      entities.forEach(ent => {
        expect(graph.outgoingForwardLinks.get(ent.id)).toHaveLength(meshSize - 1)
        expect(graph.incomingBacklinks.get(ent.id)!.lore).toHaveLength(meshSize - 1)
      })
    })
  })

  // =========================================================================
  // 6. MULTI-DOMAIN BACKLINK INDEX INTEGRATION
  // =========================================================================

  describe('6. Multi-Domain Backlink Index Integration Stress', () => {
    it('ADV.6.1: integrates pins, regions, timeline events, relation edges, and chapters for one entity', () => {
      const target = createEntity('e-core', 'Valhallen Citadel', '', { aliases: ['The High Keep'] })
      const otherLore = createEntity('e-neighbor', 'Frost Valley', '<p>Near [[The High Keep]].</p>')

      const chapter: ManuscriptChapter = {
        id: 'ch-adv-1',
        worldId: 'world-adv-001',
        manuscriptId: 'm-1',
        title: 'Assault on the High Keep',
        content: '<p>The army advanced toward The High Keep under cover of fog.</p>',
        order: 1,
        wordCount: 500,
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z'
      }

      const map: WorldMap = {
        id: 'map-adv-1',
        worldId: 'world-adv-001',
        name: 'Northern Reaches',
        imageUrl: 'map.jpg',
        width: 1920,
        height: 1080,
        pins: [
          { id: 'pin-1', mapId: 'map-adv-1', worldId: 'w-1', title: 'Citadel Pin', x: 10, y: 20, entityId: 'e-core' }
        ],
        regions: [
          { id: 'reg-1', mapId: 'map-adv-1', worldId: 'w-1', name: 'Citadel Territory', points: [], color: '#ff0000', entityId: 'e-core' }
        ],
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z'
      }

      const timeline: TimelineEvent = {
        id: 'tl-1',
        worldId: 'world-adv-001',
        era: 'Second Age',
        year: 840,
        importance: 'legendary',
        title: 'Siege of Valhallen Citadel',
        description: 'The citadel withstood a 3-month siege.',
        entityIds: ['e-core']
      }

      const relationIncoming: RelationEdge = {
        id: 'rel-1',
        worldId: 'world-adv-001',
        sourceEntityId: 'e-neighbor',
        targetEntityId: 'e-core',
        relationType: 'vassal',
        label: 'Vassal Territory'
      }

      const backlinks = findBacklinksForEntity(
        target,
        [target, otherLore],
        [chapter],
        [map],
        [timeline],
        [relationIncoming]
      )

      expect(backlinks.totalCount).toBe(6) // 1 lore + 1 chapter + 2 map (pin + region) + 1 timeline + 1 relation
      expect(backlinks.lore).toHaveLength(1)
      expect(backlinks.chapters).toHaveLength(1)
      expect(backlinks.maps).toHaveLength(2)
      expect(backlinks.timelines).toHaveLength(1)
      expect(backlinks.relations).toHaveLength(1)
      expect(backlinks.relations[0].isIncoming).toBe(true)
    })

    it('ADV.6.2: evaluates HTML tag collision vs plain text matching in backlinks', () => {
      const entity = createEntity('e-strong', 'Strong')
      const source = createEntity('e-html', 'Rich Text Note', '<p><strong>A brave warrior</strong> walked the path.</p>')

      const backlinks = findBacklinksForEntity(entity, [entity, source])
      // Documents empirical behavior: raw HTML includes <strong>, so substring search matches HTML tag name
      expect(backlinks.lore.length).toBeGreaterThanOrEqual(1)
    })

    it('ADV.1.7: validates that text.slice(startIndex, endIndex) matches raw for all parsed links', () => {
      const sampleText = 'Beginning [[Entity 1#Sec 1|Label 1]] middle [[Entity 2]] and [[Entity 3#Sec 3]] end.'
      const links = parseWikiLinks(sampleText)

      expect(links).toHaveLength(3)
      for (const link of links) {
        expect(sampleText.slice(link.startIndex, link.endIndex)).toBe(link.raw)
      }
    })
  })

  // =========================================================================
  // 7. HIGH VOLUME / STRESS HARNESS
  // =========================================================================

  describe('7. High-Volume Text & Massive Wiki-Link Stress', () => {
    it('ADV.7.1: parses a document with 1,000 distinct wiki-links without performance degradation', () => {
      const linkCount = 1000
      const generatedLinks: string[] = []

      for (let i = 0; i < linkCount; i++) {
        generatedLinks.push(`[[Entity_${i}#Section_${i % 10}|Alias_${i % 5}]]`)
      }

      const bigText = generatedLinks.join(' and ')

      const t0 = performance.now()
      const parsed = parseWikiLinks(bigText)
      const t1 = performance.now()

      expect(t1 - t0).toBeLessThan(100) // Less than 100ms for 1,000 links
      expect(parsed).toHaveLength(linkCount)
      expect(parsed[42].target).toBe('Entity_42')
      expect(parsed[42].section).toBe('Section_2')
      expect(parsed[42].label).toBe('Alias_2')
    })

    it('ADV.7.2: parses text with adversarial nested formatting and HTML wrappers', () => {
      const text = `
        <div class="wiki-content">
          <h1>Title with [[Linked Heading#Sub]]</h1>
          <p>Paragraph with <strong>[[Bold Target|Bold Alias]]</strong> and <em>[[Italic Target]]</em>.</p>
          <blockquote>"Quote containing [[Quoted Entity#Speech]]."</blockquote>
          <span data-type="wiki-link" data-id="e-test">[[Embedded Tag Target#Sec|Label]]</span>
        </div>
      `
      const links = parseWikiLinks(text)
      expect(links).toHaveLength(5)
      expect(links.map(l => l.target)).toEqual([
        'Linked Heading',
        'Bold Target',
        'Italic Target',
        'Quoted Entity',
        'Embedded Tag Target'
      ])
    })
  })
})
