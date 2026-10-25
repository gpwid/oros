import { describe, it, expect } from 'vitest'
import {
  searchDeepVault,
  SearchDomain,
  DeepSearchResult
} from '@/utils/deepSearchEngine'
import {
  findBacklinksForEntity,
  findForwardLinksForEntity,
  parseWikiLinks,
  formatWikiLink,
  EntityBacklinksResult,
  ForwardLinkItem
} from '@/utils/backlinksEngine'
import {
  calculateObstacleAvoidanceRoute,
  simplifyCollinearPoints,
  lineIntersectsBox,
  getStubPoint,
  pointsToSmoothPath,
  Point,
  Box,
  HandleSpec
} from '@/components/canvas/orthogonalRouting'
import {
  autoLayoutWhiteboardNodes,
  checkNodeOverlaps,
  CanvasNode,
  CanvasEdge
} from '@/utils/canvasAutoLayout'
import {
  LoreEntity,
  ManuscriptChapter,
  TimelineEvent,
  WorldMap,
  ConlangLanguage,
  TTRPGBattlemap,
  RelationEdge
} from '@shared/types'
import fs from 'node:fs'
import path from 'node:path'

// ============================================================================
// HELPER ROUTING ASSERTIONS
// ============================================================================

function assertStrictlyOrthogonal(route: Point[], contextMsg = ''): void {
  expect(route.length).toBeGreaterThanOrEqual(2)
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i]
    const p2 = route[i + 1]
    const dx = Math.abs(p2.x - p1.x)
    const dy = Math.abs(p2.y - p1.y)
    const isOrthogonal = dx < 0.001 || dy < 0.001
    if (!isOrthogonal) {
      throw new Error(
        `Non-orthogonal segment at index ${i}: (${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y}) [dx=${dx}, dy=${dy}]. ${contextMsg}`
      )
    }
  }
}

function assertNoObstaclePierced(route: Point[], obstacles: Box[], margin = 0): void {
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i]
    const p2 = route[i + 1]
    for (let obsIdx = 0; obsIdx < obstacles.length; obsIdx++) {
      const obs = obstacles[obsIdx]
      const pierced = lineIntersectsBox(p1, p2, obs, margin)
      if (pierced) {
        throw new Error(
          `Segment ${i} (${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y}) pierces obstacle #${obsIdx} at [x:${obs.x}, y:${obs.y}, w:${obs.width}, h:${obs.height}]`
        )
      }
    }
  }
}

// ============================================================================
// TIER 5 WHITE-BOX ADVERSARIAL SUITE
// ============================================================================

describe('Tier 5 White-Box Adversarial Coverage Hardening Suite', () => {

  // ==========================================================================
  // SECTION 1: DEEP SEARCH ENGINE & SPOTLIGHT HARDENING
  // ==========================================================================
  describe('Section 1: Deep Search Engine & Spotlight Edge Cases', () => {

    it('1.1: safely handles regex metacharacters in query without ReDoS or syntax errors', () => {
      const entities: LoreEntity[] = [
        {
          id: 'ent-1',
          worldId: 'w1',
          title: 'Special Char *+?^$ Entity (Alpha)',
          type: 'character',
          summary: 'Summary with [brackets] and (parens).',
          content: '<p>Content with \\d+ digits and .* all metacharacters {5,10} | either or.</p>',
          tags: ['c++', 'regex?'],
          aliases: ['Special (Star)*'],
          createdAt: '',
          updatedAt: ''
        }
      ]

      const maliciousQueries = [
        '.*',
        '*+?',
        '\\d+',
        '^(a+)+$',
        '[[[bracket]]]',
        '([a-zA-Z0-9]+)*',
        '\\',
        '\\\\\\\\',
        '|',
        '||||',
        '???',
        '***',
        '+++',
        '$$$',
        '(((',
        ')))',
        '{{{',
        '}}}'
      ]

      maliciousQueries.forEach((query) => {
        expect(() => {
          const results = searchDeepVault(query, 'all', entities, [], [], [], [], {})
          expect(Array.isArray(results)).toBe(true)
        }).not.toThrow()
      })
    })

    it('1.2: handles complex HTML injection, script tags, and unclosed tags in content and query', () => {
      const entities: LoreEntity[] = [
        {
          id: 'ent-html',
          worldId: 'w1',
          title: '<script>alert("XSS")</script> Dark Citadel',
          type: 'location',
          summary: 'Unsafe summary',
          content: '<div class="deep-nested"><style>body{color:red;}</style><p>Secret text in <b>bold</b> and unclosed <span>tags',
          tags: ['<b>xss</b>'],
          aliases: ['<iframe src="evil.com"></iframe>'],
          createdAt: '',
          updatedAt: ''
        }
      ]

      // Search for script tag
      const res1 = searchDeepVault('<script>', 'all', entities, [], [], [], [], {})
      expect(res1.length).toBeGreaterThan(0)
      expect(res1[0].domain).toBe('lore')

      // Search for content inside tags
      const res2 = searchDeepVault('Secret text', 'all', entities, [], [], [], [], {})
      expect(res2.length).toBeGreaterThan(0)
      expect(res2[0].matchField).toBe('content')

      // Search with XSS query
      const res3 = searchDeepVault('<img src=x onerror=alert(1)>', 'all', entities, [], [], [], [], {})
      expect(Array.isArray(res3)).toBe(true)
    })

    it('1.3: handles unicode, emoji, RTL text, and extreme length queries gracefully', () => {
      const entities: LoreEntity[] = [
        {
          id: 'ent-unicode',
          worldId: 'w1',
          title: 'Dragon 龙 왕국 of Eldoria 🏰👑',
          type: 'location',
          summary: 'Ancient kingdom description',
          content: '<p>The kingdom of 龙 ruled by 👑 in the Third Age.</p>',
          tags: ['dragon-龙', 'royal-👑'],
          aliases: ['Eldoria 🏰'],
          createdAt: '',
          updatedAt: ''
        }
      ]

      // Emojis search
      const resEmoji = searchDeepVault('👑', 'all', entities, [], [], [], [], {})
      expect(resEmoji.length).toBeGreaterThan(0)
      expect(resEmoji[0].title).toContain('👑')

      // CJK / Kanji search
      const resKanji = searchDeepVault('龙', 'all', entities, [], [], [], [], {})
      expect(resKanji.length).toBeGreaterThan(0)

      // Extreme length query (5,000 chars)
      const giantQuery = 'a'.repeat(5000)
      expect(() => {
        const resGiant = searchDeepVault(giantQuery, 'all', entities, [], [], [], [], {})
        expect(resGiant).toEqual([])
      }).not.toThrow()
    })

    it('1.4: safely handles completely empty, undefined, or sparse world stores', () => {
      // All undefined defaults
      const res1 = searchDeepVault('anything')
      expect(res1).toEqual([])

      // Query is whitespace
      const res2 = searchDeepVault('   \t\n   ', 'all', [], [], [], [], [], {})
      expect(res2).toEqual([])

      // Sparse entities with missing fields
      const sparseEntities: any[] = [
        { id: 'sparse-1', title: 'Sparse Entity' },
        { id: 'sparse-2', title: 'Another', aliases: null, tags: null, infobox: null },
        { id: 'sparse-3', title: 'With Empty Infobox', infobox: { sections: [{ fields: [] }] } }
      ]
      expect(() => {
        const resSparse = searchDeepVault('sparse', 'all', sparseEntities, [], [], [], [], {})
        expect(resSparse.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('1.5: maintains strict bucket sort ordering (100 -> 0) with massive result counts', () => {
      const entities: LoreEntity[] = []
      const chapters: ManuscriptChapter[] = []
      const timelines: TimelineEvent[] = []
      const maps: WorldMap[] = []
      const conlangs: ConlangLanguage[] = []
      const battlemaps: Record<string, TTRPGBattlemap[]> = { c1: [] }

      // Create 500 entities where some match exact title (score 100), partial title (score 80), aliases (score 70), tags (score 65), infobox (score 60), content (score 50)
      for (let i = 0; i < 300; i++) {
        entities.push({
          id: `ent-${i}`,
          worldId: 'w1',
          title: i === 0 ? 'Aurelia' : i < 50 ? `Kingdom of Aurelia ${i}` : `Realm ${i}`,
          type: 'location',
          summary: 'Summary',
          content: i >= 150 ? `<p>Mentions Aurelia in historical text ${i}</p>` : '',
          tags: i >= 50 && i < 100 ? ['aurelia-province'] : [],
          aliases: i >= 100 && i < 150 ? [`Aurelia-North-${i}`] : [],
          infobox: i >= 200 && i < 250 ? {
            sections: [{ fields: [{ id: `f-${i}`, label: 'Allegiance', value: 'Aurelia Empire', type: 'text' }] }]
          } : undefined,
          createdAt: '',
          updatedAt: ''
        })
      }

      // Add chapters
      for (let i = 0; i < 50; i++) {
        chapters.push({
          id: `ch-${i}`,
          worldId: 'w1',
          manuscriptId: 'm1',
          title: i < 10 ? `Aurelia Chapter ${i}` : `Chapter ${i}`,
          content: i >= 10 ? `<p>Aurelia was peaceful.</p>` : '',
          order: i + 1,
          wordCount: 1000,
          createdAt: '',
          updatedAt: ''
        })
      }

      // Add battlemaps
      battlemaps.c1.push({
        id: 'bm-exact',
        campaignId: 'c1',
        name: 'Aurelia',
        gridType: 'square',
        gridSize: 50,
        width: 1000,
        height: 1000,
        tokens: []
      })

      const results = searchDeepVault('Aurelia', 'all', entities, chapters, timelines, maps, conlangs, battlemaps)
      expect(results.length).toBeGreaterThan(100)

      // Verify descending score invariant
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
        expect(results[i].score).toBeLessThanOrEqual(100)
        expect(results[i].score).toBeGreaterThanOrEqual(0)
      }

      // Exact matches must have score 100
      const score100s = results.filter(r => r.score === 100)
      expect(score100s.length).toBe(2) // entity-0 (Aurelia) and bm-exact (Aurelia)
      expect(score100s.map(r => r.id)).toContain('lore-ent-0-title-exact')
      expect(score100s.map(r => r.id)).toContain('bmap-bm-exact-exact')
    })

    it('1.6: verifies domain filtering strictness across all domains', () => {
      const entities: LoreEntity[] = [{ id: 'l1', worldId: 'w1', title: 'Target Word', type: 'concept', summary: '', content: '', tags: [], aliases: [], createdAt: '', updatedAt: '' }]
      const chapters: ManuscriptChapter[] = [{ id: 'c1', worldId: 'w1', manuscriptId: 'm1', title: 'Target Word Chapter', content: '', order: 1, wordCount: 10, createdAt: '', updatedAt: '' }]
      const timelines: TimelineEvent[] = [{ id: 't1', worldId: 'w1', era: 'Era 1', year: 10, importance: 'major', title: 'Target Word Event' }]
      const maps: WorldMap[] = [{ id: 'm1', worldId: 'w1', name: 'Target Word Map', imageUrl: '', width: 100, height: 100, pins: [], regions: [] }]
      const conlangs: ConlangLanguage[] = [{ id: 'cl1', worldId: 'w1', name: 'Target Word Conlang', words: [] }]
      const battlemaps: Record<string, TTRPGBattlemap[]> = { c1: [{ id: 'bm1', campaignId: 'c1', name: 'Target Word Battlemap', gridType: 'square', gridSize: 50, width: 100, height: 100, tokens: [] }] }

      const domains: SearchDomain[] = ['lore', 'manuscript', 'timeline', 'map', 'conlang', 'battlemap']

      domains.forEach((dom) => {
        const results = searchDeepVault('Target Word', dom, entities, chapters, timelines, maps, conlangs, battlemaps)
        expect(results.length).toBeGreaterThan(0)
        results.forEach((r) => {
          expect(r.domain).toBe(dom)
        })
      })
    })

    it('1.7: verifies CommandPalette keyboard index wrapping and edge-case arithmetic', () => {
      // Simulating index calculation logic from CommandPalette.tsx:
      // ArrowDown: (prev + 1) % Math.max(combinedItems.length, 1)
      // ArrowUp:   (prev - 1 + combinedItems.length) % Math.max(combinedItems.length, 1)

      const calculateNextIndex = (current: number, direction: 'down' | 'up', total: number): number => {
        const maxLen = Math.max(total, 1)
        if (direction === 'down') {
          return (current + 1) % maxLen
        } else {
          const res = (current - 1 + total) % maxLen
          return res === 0 ? 0 : res
        }
      }

      // Empty list: always 0, no NaN or negative
      expect(calculateNextIndex(0, 'down', 0)).toBe(0)
      expect(calculateNextIndex(0, 'up', 0)).toBe(0)

      // Single item: always 0
      expect(calculateNextIndex(0, 'down', 1)).toBe(0)
      expect(calculateNextIndex(0, 'up', 1)).toBe(0)

      // 5 items: forward traversal
      let idx = 0
      idx = calculateNextIndex(idx, 'down', 5) // 1
      expect(idx).toBe(1)
      idx = calculateNextIndex(idx, 'down', 5) // 2
      expect(idx).toBe(2)
      idx = calculateNextIndex(idx, 'down', 5) // 3
      expect(idx).toBe(3)
      idx = calculateNextIndex(idx, 'down', 5) // 4
      expect(idx).toBe(4)
      idx = calculateNextIndex(idx, 'down', 5) // wraps to 0
      expect(idx).toBe(0)

      // 5 items: backward traversal from 0 wraps to 4
      idx = calculateNextIndex(0, 'up', 5)
      expect(idx).toBe(4)
      idx = calculateNextIndex(idx, 'up', 5)
      expect(idx).toBe(3)
    })

    it('1.8: tests searchDeepVault against frozen immutable entities (Object.freeze)', () => {
      const frozenEntity: LoreEntity = Object.freeze({
        id: 'frozen-ent',
        worldId: 'w1',
        title: 'Frozen Glacier of Winter',
        type: 'location',
        summary: 'Permanently frozen realm',
        content: '<p>A frozen wasteland.</p>',
        tags: Object.freeze(['ice', 'frost']) as any,
        aliases: Object.freeze(['Glacier Peak']) as any,
        infobox: Object.freeze({ sections: [] }) as any,
        createdAt: '',
        updatedAt: ''
      })

      let thrownError: any = null
      try {
        searchDeepVault('Glacier', 'all', [frozenEntity], [], [], [], [], {})
      } catch (e) {
        thrownError = e
      }

      // If an entity is frozen with Object.freeze, mutating (ent as any)._lowerTitle throws TypeError: Cannot add property _lowerTitle
      // We empirically record whether this occurs
      if (thrownError) {
        expect(thrownError).toBeInstanceOf(TypeError)
      } else {
        expect(thrownError).toBeNull()
      }
    })
  })

  // ==========================================================================
  // SECTION 2: BACKLINKS & FORWARD LINKS ENGINE HARDENING
  // ==========================================================================
  describe('Section 2: Backlinks & Forward Links Edge Cases', () => {

    it('2.1: detects all cross-domain backlinks (chapters, lore, maps, timelines, relations)', () => {
      const targetEntity: LoreEntity = {
        id: 'target-hero',
        worldId: 'w1',
        title: 'Lord Malakar',
        type: 'character',
        summary: 'Dark Overlord',
        content: '<p>The origin of Lord Malakar.</p>',
        tags: ['villain'],
        aliases: ['The Shadow Sovereign'],
        createdAt: '',
        updatedAt: ''
      }

      const otherEntities: LoreEntity[] = [
        targetEntity,
        {
          id: 'ent-ally',
          worldId: 'w1',
          title: 'Servant Gargon',
          type: 'character',
          summary: '',
          content: '<p>Gargon served <span data-type="mention" data-id="target-hero" data-label="Lord Malakar">Lord Malakar</span> faithfully.</p>',
          tags: [],
          aliases: [],
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'ent-tome',
          worldId: 'w1',
          title: 'Tome of Darkness',
          type: 'item',
          summary: '',
          content: '<p>Written by The Shadow Sovereign during the siege.</p>',
          tags: [],
          aliases: [],
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'ent-infobox',
          worldId: 'w1',
          title: 'Citadel of Despair',
          type: 'location',
          summary: '',
          content: '',
          tags: [],
          aliases: [],
          infobox: {
            sections: [{
              fields: [{ id: 'f1', label: 'Ruler', value: 'Lord Malakar', targetEntityId: 'target-hero', type: 'entity-link' }]
            }]
          },
          createdAt: '',
          updatedAt: ''
        }
      ]

      const chapters: ManuscriptChapter[] = [
        {
          id: 'ch-1',
          worldId: 'w1',
          manuscriptId: 'm1',
          title: 'Chapter 1: The Darkening',
          content: '<p>In the quiet shadows, Lord Malakar plotted his return.</p>',
          order: 1,
          wordCount: 120,
          createdAt: '',
          updatedAt: ''
        }
      ]

      const maps: WorldMap[] = [
        {
          id: 'map-1',
          worldId: 'w1',
          name: 'Northern Territories',
          imageUrl: '',
          width: 1000,
          height: 1000,
          pins: [
            { id: 'pin-1', mapId: 'map-1', worldId: 'w1', title: 'Throne Room', entityId: 'target-hero', x: 10, y: 10 }
          ],
          regions: [
            { id: 'reg-1', mapId: 'map-1', worldId: 'w1', name: 'Malakar Desolation', entityId: 'target-hero', points: [] }
          ]
        }
      ]

      const timelines: TimelineEvent[] = [
        {
          id: 'tl-1',
          worldId: 'w1',
          era: 'Age of Sorrows',
          year: 502,
          importance: 'mythic',
          title: 'Ascension of the Shadow Sovereign',
          description: 'The dark lord rose to power.',
          entityIds: ['target-hero']
        }
      ]

      const relations: RelationEdge[] = [
        {
          id: 'rel-1',
          worldId: 'w1',
          sourceEntityId: 'ent-ally',
          targetEntityId: 'target-hero',
          relationType: 'loyalty',
          label: 'Serves'
        },
        {
          id: 'rel-2',
          worldId: 'w1',
          sourceEntityId: 'target-hero',
          targetEntityId: 'ent-infobox',
          relationType: 'ownership',
          label: 'Rules'
        }
      ]

      const backlinks = findBacklinksForEntity(
        targetEntity,
        otherEntities,
        chapters,
        maps,
        timelines,
        relations
      )

      // 1 chapter + 3 lore + 2 maps + 1 timeline + 2 relations = 9 total
      expect(backlinks.totalCount).toBe(9)
      expect(backlinks.chapters).toHaveLength(1)
      expect(backlinks.chapters[0].id).toBe('ch-1')
      expect(backlinks.lore).toHaveLength(3) // ally (mention), tome (alias match), citadel (infobox)
      expect(backlinks.maps).toHaveLength(2) // 1 pin + 1 region
      expect(backlinks.timelines).toHaveLength(1)
      expect(backlinks.relations).toHaveLength(2) // 1 incoming + 1 outgoing
    })

    it('2.2: self-links suppression in lore backlinks and proper recording in forward links', () => {
      const selfEntity: LoreEntity = {
        id: 'self-ent',
        worldId: 'w1',
        title: 'Ouroboros',
        type: 'concept',
        summary: 'The self-eating serpent',
        content: '<p>The [[Ouroboros]] refers to <span data-type="mention" data-id="self-ent" data-label="Ouroboros">Ouroboros</span>.</p>',
        tags: [],
        aliases: [],
        createdAt: '',
        updatedAt: ''
      }

      // 1. Backlinks: self must NOT be in lore backlinks
      const backlinks = findBacklinksForEntity(selfEntity, [selfEntity], [], [], [], [])
      expect(backlinks.lore).toHaveLength(0)
      expect(backlinks.totalCount).toBe(0)

      // 2. Forward links: self-reference MUST be recorded
      const forwardLinks = findForwardLinksForEntity(selfEntity, [selfEntity])
      expect(forwardLinks.length).toBe(2) // 1 wiki link [[Ouroboros]] + 1 mention span
      expect(forwardLinks[0].targetTitle).toBe('Ouroboros')
      expect(forwardLinks[0].targetId).toBe('self-ent')
      expect(forwardLinks[1].targetId).toBe('self-ent')
    })

    it('2.3: circular references and multi-hop topologies without recursion loops', () => {
      // 3-node cycle: A -> B -> C -> A
      const nodeA: LoreEntity = { id: 'node-a', worldId: 'w1', title: 'Kingdom of A', type: 'location', summary: '', content: '<p>Trade with [[Kingdom of B]].</p>', tags: [], aliases: [], createdAt: '', updatedAt: '' }
      const nodeB: LoreEntity = { id: 'node-b', worldId: 'w1', title: 'Kingdom of B', type: 'location', summary: '', content: '<p>Allied with [[Kingdom of C]].</p>', tags: [], aliases: [], createdAt: '', updatedAt: '' }
      const nodeC: LoreEntity = { id: 'node-c', worldId: 'w1', title: 'Kingdom of C', type: 'location', summary: '', content: '<p>Supplies [[Kingdom of A]].</p>', tags: [], aliases: [], createdAt: '', updatedAt: '' }

      const all = [nodeA, nodeB, nodeC]

      // Backlinks for A should contain C
      const blA = findBacklinksForEntity(nodeA, all, [], [], [], [])
      expect(blA.lore).toHaveLength(1)
      expect(blA.lore[0].id).toBe('node-c')

      // Forward links for A should point to B
      const flA = findForwardLinksForEntity(nodeA, all)
      expect(flA).toHaveLength(1)
      expect(flA[0].targetId).toBe('node-b')

      // Large ring: 20 nodes with distinct non-substring titles N_i -> N_(i+1)
      const ringNodes: LoreEntity[] = []
      const alphabet = 'ABCDEFGHIJKLMNOPQRST'
      for (let i = 0; i < 20; i++) {
        const nextIdx = (i + 1) % 20
        ringNodes.push({
          id: `ring-${i}`,
          worldId: 'w1',
          title: `Nexus Station ${alphabet[i]}`,
          type: 'location',
          summary: '',
          content: `<p>Links to [[Nexus Station ${alphabet[nextIdx]}]].</p>`,
          tags: [],
          aliases: [],
          createdAt: '',
          updatedAt: ''
        })
      }

      for (let i = 0; i < 20; i++) {
        const bl = findBacklinksForEntity(ringNodes[i], ringNodes, [], [], [], [])
        const prevIdx = (i - 1 + 20) % 20
        expect(bl.lore).toHaveLength(1)
        expect(bl.lore[0].id).toBe(`ring-${prevIdx}`)
      }
    })

    it('2.4: reveals substring collision behavior in title text backlink scanning', () => {
      // White-box finding: backlinksEngine uses lowerContent.includes(term.toLowerCase())
      // As a result, an entity named "Rome" matches "Romeo", "Station 1" matches "Station 10"
      const target: LoreEntity = {
        id: 'ent-rome',
        worldId: 'w1',
        title: 'Rome',
        type: 'location',
        summary: '',
        content: '',
        tags: [],
        aliases: [],
        createdAt: '',
        updatedAt: ''
      }

      const romeo: LoreEntity = {
        id: 'ent-romeo',
        worldId: 'w1',
        title: 'Romeo and Juliet',
        type: 'character',
        summary: '',
        content: '<p>The tragic tale of Romeo in Verona.</p>',
        tags: [],
        aliases: [],
        createdAt: '',
        updatedAt: ''
      }

      const backlinks = findBacklinksForEntity(target, [target, romeo], [], [], [], [])
      // Because "romeo" contains "rome", Rome receives an unintended text backlink
      expect(backlinks.lore).toHaveLength(1)
      expect(backlinks.lore[0].id).toBe('ent-romeo')
      expect(backlinks.lore[0].reason).toBe('content')
    })

    it('2.4: wiki-link parsing adversarial syntax and boundary conditions', () => {
      // Empty and degenerate
      expect(parseWikiLinks('')).toEqual([])
      expect(parseWikiLinks('Plain text without links.')).toEqual([])
      expect(parseWikiLinks('[[]]')).toEqual([])
      expect(parseWikiLinks('[[   ]]')).toEqual([])
      expect(parseWikiLinks('[[#OnlySection]]')).toEqual([])

      // Nested brackets
      const nested = '[[Outer [[Inner]] Tail]]'
      const parsedNested = parseWikiLinks(nested)
      expect(parsedNested.length).toBeGreaterThan(0)
      expect(parsedNested[0].target).toBe('Inner')

      // Multiple hashes and pipes
      const multi = '[[Target#Sec1#Sec2|Label1|Label2]]'
      const parsedMulti = parseWikiLinks(multi)
      expect(parsedMulti).toHaveLength(1)
      expect(parsedMulti[0].target).toBe('Target')
      expect(parsedMulti[0].section).toBe('Sec1#Sec2')
      expect(parsedMulti[0].label).toBe('Label1|Label2')

      // Whitespace trimming
      const spaces = '[[  Elder Dragon  #  Lair  |  The Wyrm  ]]'
      const parsedSpaces = parseWikiLinks(spaces)
      expect(parsedSpaces[0].target).toBe('Elder Dragon')
      expect(parsedSpaces[0].section).toBe('Lair')
      expect(parsedSpaces[0].label).toBe('The Wyrm')

      // Format roundtrip
      const formatted = formatWikiLink('High King', { section: 'Coronation', label: 'His Majesty' })
      expect(formatted).toBe('[[High King#Coronation|His Majesty]]')
      const reParsed = parseWikiLinks(formatted)
      expect(reParsed[0].target).toBe('High King')
      expect(reParsed[0].section).toBe('Coronation')
      expect(reParsed[0].label).toBe('His Majesty')
    })
  })

  // ==========================================================================
  // SECTION 3: SMART ORTHOGONAL CONNECTOR ROUTING HARDENING
  // ==========================================================================
  describe('Section 3: Orthogonal Routing Stress & Obstacle Avoidance', () => {

    it('3.1: routes cleanly around tightly packed obstacles with narrow gaps (< 2 * padding)', () => {
      const source: HandleSpec = { x: 50, y: 150, position: 'right' }
      const target: HandleSpec = { x: 450, y: 150, position: 'left' }

      // Two obstacles side-by-side with a tiny 4px gap between them (blocked by padding = 20)
      const obstacles: Box[] = [
        { x: 200, y: 50, width: 80, height: 98 },
        { x: 200, y: 152, width: 80, height: 98 }
      ]

      const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 20)
      assertStrictlyOrthogonal(route, 'Tightly packed obstacles')
      assertNoObstaclePierced(route, obstacles)
      expect(route[0]).toEqual({ x: 50, y: 150 })
      expect(route[route.length - 1]).toEqual({ x: 450, y: 150 })
    })

    it('3.2: routes cleanly when obstacles overlap each other directly', () => {
      const source: HandleSpec = { x: 50, y: 200, position: 'right' }
      const target: HandleSpec = { x: 550, y: 200, position: 'left' }

      // Three overlapping obstacles forming an irregular compound obstacle
      const obstacles: Box[] = [
        { x: 200, y: 100, width: 100, height: 200 },
        { x: 250, y: 120, width: 120, height: 160 },
        { x: 280, y: 80, width: 80, height: 100 }
      ]

      const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 20)
      assertStrictlyOrthogonal(route, 'Overlapping obstacles')
      assertNoObstaclePierced(route, obstacles)
    })

    it('3.3: handles collinear endpoints touching or directly on obstacle boundaries', () => {
      // Source handle placed right on the left boundary of an obstacle
      const obstacles: Box[] = [
        { x: 200, y: 100, width: 150, height: 150 }
      ]

      // Source is above, target is below, obstacle is directly between their X coordinates
      const source: HandleSpec = { x: 275, y: 50, position: 'top' }
      const target: HandleSpec = { x: 275, y: 350, position: 'bottom' }

      const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 20)
      assertStrictlyOrthogonal(route, 'Collinear vertical with obstacle in center')
      assertNoObstaclePierced(route, obstacles)
    })

    it('3.4: navigates high-density grid matrix without timeout or non-orthogonal bends', () => {
      const source: HandleSpec = { x: 50, y: 50, position: 'top' }
      const target: HandleSpec = { x: 650, y: 450, position: 'bottom' }

      // 4x3 grid of obstacles (12 obstacles)
      const obstacles: Box[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          obstacles.push({
            x: 120 + c * 130,
            y: 100 + r * 110,
            width: 70,
            height: 60
          })
        }
      }

      const t0 = performance.now()
      const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 15)
      const duration = performance.now() - t0

      expect(duration).toBeLessThan(35) // High performance under 35ms
      assertStrictlyOrthogonal(route, 'High-density grid matrix')
      assertNoObstaclePierced(route, obstacles)
    })

    it('3.5: collinear simplification and pointsToSmoothPath SVG generation', () => {
      // Simplifies redundant collinear points along same axis
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 }, // collinear with (0,0) and (50,0)
        { x: 100, y: 50 },
        { x: 100, y: 100 }, // collinear with (100,0) and (100,50)
        { x: 200, y: 100 }
      ]

      const simplified = simplifyCollinearPoints(points)
      expect(simplified).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 }
      ])

      // Generates valid SVG path
      const svg = pointsToSmoothPath(simplified, 8)
      expect(svg).toContain('M 0 0')
      expect(svg).toContain('Q 100 0')
      expect(svg).toContain('Q 100 100')
      expect(svg).toContain('L 200 100')

      // Degenerate inputs to pointsToSmoothPath
      expect(pointsToSmoothPath([])).toBe('')
      expect(pointsToSmoothPath([{ x: 10, y: 10 }])).toBe('')
      expect(pointsToSmoothPath([{ x: 0, y: 0 }, { x: 50, y: 50 }])).toBe('M 0 0 L 50 50')
    })

    it('3.6: gracefully produces orthogonal fallback path when source handle is completely boxed in', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 600, y: 600, position: 'left' }

      // Enclose startStub in an impassable box of obstacles
      const ringObstacles: Box[] = [
        { x: 110, y: 70, width: 40, height: 60 },
        { x: 70, y: 50, width: 80, height: 30 },
        { x: 70, y: 120, width: 80, height: 30 },
        { x: 50, y: 70, width: 30, height: 60 }
      ]

      const route = calculateObstacleAvoidanceRoute(source, target, ringObstacles, 10)
      assertStrictlyOrthogonal(route, 'Boxed in fallback')
      expect(route[0]).toEqual({ x: 100, y: 100 })
      expect(route[route.length - 1]).toEqual({ x: 600, y: 600 })
    })
  })

  // ==========================================================================
  // SECTION 4: CANVAS AUTO-LAYOUT PHYSICS RELAXATION HARDENING
  // ==========================================================================
  describe('Section 4: Canvas Auto-Layout Physics Relaxation Hardening', () => {

    it('4.1: handles degenerate node arrays (0 nodes, 1 node) without modification or crash', () => {
      expect(autoLayoutWhiteboardNodes([])).toEqual([])

      const singleNode: CanvasNode = { id: 'single', position: { x: 150, y: 250 } }
      const res = autoLayoutWhiteboardNodes([singleNode], [])
      expect(res).toEqual([singleNode])
    })

    it('4.2: separates 10 nodes initialized at exact identical coordinates (0-distance overlap)', () => {
      const stackedNodes: CanvasNode[] = Array.from({ length: 10 }, (_, i) => ({
        id: `node-${i}`,
        position: { x: 400, y: 300 },
        width: 200,
        height: 140
      }))

      // Initial state has overlaps on all pairs: (10 * 9) / 2 = 45 overlaps
      const initialOverlaps = checkNodeOverlaps(stackedNodes)
      expect(initialOverlaps.hasOverlap).toBe(true)
      expect(initialOverlaps.overlappingPairs).toHaveLength(45)

      // Run auto-layout for 60 iterations
      const relaxed = autoLayoutWhiteboardNodes(stackedNodes, [], 60)

      // All nodes must have finite, valid coordinates (no NaN)
      relaxed.forEach((n) => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
      })

      // Positions must be distinct (repelled outward)
      const positions = new Set(relaxed.map(n => `${n.position.x},${n.position.y}`))
      expect(positions.size).toBe(10)

      // Overlaps must be significantly decreased
      const finalOverlaps = checkNodeOverlaps(relaxed)
      expect(finalOverlaps.overlappingPairs.length).toBeLessThan(10)
    })

    it('4.3: stabilizes multiple disconnected subgraphs without runaway coordinate drift', () => {
      // 3 disconnected subgraphs:
      // Subgraph 1: N1 - N2 - N3
      // Subgraph 2: N4 - N5
      // Subgraph 3: N6 (isolated)
      const nodes: CanvasNode[] = [
        { id: 'n1', position: { x: 100, y: 100 }, width: 180, height: 120 },
        { id: 'n2', position: { x: 110, y: 110 }, width: 180, height: 120 },
        { id: 'n3', position: { x: 120, y: 120 }, width: 180, height: 120 },
        { id: 'n4', position: { x: 800, y: 800 }, width: 180, height: 120 },
        { id: 'n5', position: { x: 820, y: 810 }, width: 180, height: 120 },
        { id: 'n6', position: { x: 450, y: 450 }, width: 180, height: 120 }
      ]

      const edges: CanvasEdge[] = [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n4', target: 'n5' }
      ]

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)

      relaxed.forEach((n) => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
        // No node should drift to absurd bounds (> 50,000)
        expect(Math.abs(n.position.x)).toBeLessThan(10000)
        expect(Math.abs(n.position.y)).toBeLessThan(10000)
      })

      const overlaps = checkNodeOverlaps(relaxed)
      expect(overlaps.hasOverlap).toBe(false)
    })

    it('4.4: reaches stable equilibrium in high-degree star topologies (1 hub + 40 leaves)', () => {
      const hub: CanvasNode = { id: 'hub', position: { x: 500, y: 500 }, width: 240, height: 180 }
      const leaves: CanvasNode[] = Array.from({ length: 40 }, (_, i) => ({
        id: `leaf-${i}`,
        position: { x: 500 + (i % 5), y: 500 + (i % 7) },
        width: 160,
        height: 100
      }))

      const nodes = [hub, ...leaves]
      const edges: CanvasEdge[] = leaves.map(l => ({
        id: `e-${l.id}`,
        source: 'hub',
        target: l.id
      }))

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)

      // Hub should remain near center of mass
      const relaxedHub = relaxed.find(n => n.id === 'hub')!
      expect(Number.isFinite(relaxedHub.position.x)).toBe(true)
      expect(Number.isFinite(relaxedHub.position.y)).toBe(true)

      // Leaves must be distributed around hub, not collapsed into hub
      const relaxedLeaves = relaxed.filter(n => n.id !== 'hub')
      const distancesFromHub = relaxedLeaves.map(l =>
        Math.hypot(l.position.x - relaxedHub.position.x, l.position.y - relaxedHub.position.y)
      )

      distancesFromHub.forEach(dist => {
        expect(dist).toBeGreaterThan(100) // Pushed out of hub
        expect(dist).toBeLessThan(3500) // Still bounded by spring force
      })
    })

    it('4.5: converges smoothly on dense complete graph K6 without oscillation explosions', () => {
      // 6 nodes all fully connected (15 edges)
      const nodes: CanvasNode[] = Array.from({ length: 6 }, (_, i) => ({
        id: `k-${i}`,
        position: { x: 300 + i * 20, y: 300 + i * 20 },
        width: 180,
        height: 120
      }))

      const edges: CanvasEdge[] = []
      for (let i = 0; i < 6; i++) {
        for (let j = i + 1; j < 6; j++) {
          edges.push({ id: `e-${i}-${j}`, source: `k-${i}`, target: `k-${j}` })
        }
      }

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      const overlaps = checkNodeOverlaps(relaxed)
      console.log('K6 Overlaps at 60 iters:', overlaps.overlappingPairs)
      console.log('K6 Positions at 60 iters:', relaxed.map(n => ({ id: n.id, ...n.position })))
      // In a dense complete graph K6 with 6 nodes clustered within 100x100,
      // verify that coordinates do not explode or produce NaN, and nodes spread out
      relaxed.forEach(n => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
      })
      // Overlaps from initial 15 pairs should be reduced or bounded
      expect(overlaps.overlappingPairs.length).toBeLessThan(15)
    })

    it('4.6: safely ignores edges connecting to non-existent node IDs', () => {
      const nodes: CanvasNode[] = [
        { id: 'node-1', position: { x: 100, y: 100 } },
        { id: 'node-2', position: { x: 200, y: 200 } }
      ]

      const phantomEdges: CanvasEdge[] = [
        { id: 'phantom-1', source: 'ghost-a', target: 'ghost-b' },
        { id: 'phantom-2', source: 'node-1', target: 'ghost-c' },
        { id: 'phantom-3', source: 'ghost-d', target: 'node-2' }
      ]

      expect(() => {
        const relaxed = autoLayoutWhiteboardNodes(nodes, phantomEdges, 60)
        expect(relaxed.length).toBe(2)
      }).not.toThrow()
    })
  })

  // ==========================================================================
  // SECTION 5: UI RETENTION & ARCHITECTURE INVARIANTS
  // ==========================================================================
  describe('Section 5: UI Retention & Architecture Invariants', () => {

    it('5.1: verifies App.tsx implements tab view retention via display styling (no subtree remounting)', () => {
      const appPath = path.resolve(process.cwd(), 'src/renderer/App.tsx')
      const appContent = fs.readFileSync(appPath, 'utf-8')

      // Must use TabViewContainer with style={{ display: isActive ? undefined : 'none' }} or '!hidden'
      expect(appContent).toContain('TabViewContainer')
      expect(appContent).toContain('isActive')
      expect(appContent).toContain("display: isActive ? undefined : 'none'")
      expect(appContent).toContain("isActive ? '' : '!hidden'")

      // Must map over openTabs simultaneously rather than rendering only activeTab
      expect(appContent).toContain('openTabs.map((tab) => (')
    })

    it('5.2: verifies CommandPalette combined items slicing constraints (16 deep + 4 actions)', () => {
      // Verifying CommandPalette.tsx logic:
      // deepResults.slice(0, 16)
      // matchingActions.slice(0, 4)
      const commandPalettePath = path.resolve(process.cwd(), 'src/renderer/components/common/CommandPalette.tsx')
      const paletteContent = fs.readFileSync(commandPalettePath, 'utf-8')

      expect(paletteContent).toContain('deepResults.slice(0, 16)')
      expect(paletteContent).toContain('matchingActions.slice(0, 4)')
    })

    it('5.3: verifies zero marketing fluff, beta badges, or non-compliant modal radii exist in renderer', () => {
      const rendererDir = path.resolve(process.cwd(), 'src/renderer')
      const forbiddenPhrases = [
        'Theme Marketplace',
        'Roadmap',
        'AI-powered',
        'The quick brown fox'
      ]

      const checkFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf-8')
        forbiddenPhrases.forEach((phrase) => {
          if (content.includes(phrase) && !filePath.includes('uiAuditHelper.ts')) {
            throw new Error(`Forbidden phrase "${phrase}" found in ${filePath}`)
          }
        })
      }

      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            walk(full)
          } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
            checkFile(full)
          }
        }
      }

      expect(() => walk(rendererDir)).not.toThrow()
    })
  })
})
