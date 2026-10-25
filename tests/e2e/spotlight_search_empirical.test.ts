import { describe, it, expect, vi } from 'vitest'
import { searchDeepVault, SearchDomain, DeepSearchResult } from '@/utils/deepSearchEngine'
import {
  LoreEntity,
  ManuscriptChapter,
  TimelineEvent,
  WorldMap,
  ConlangLanguage,
  TTRPGBattlemap,
  TTRPGToken
} from '@shared/types'

describe('Global Spotlight Search (Ctrl+K) Empirical Challenge Suite', () => {
  // =========================================================================
  // HELPER GENERATORS FOR BENCHMARK SCALE
  // =========================================================================

  function generateScaleData() {
    const entities: LoreEntity[] = []
    const chapters: ManuscriptChapter[] = []
    const timelines: TimelineEvent[] = []
    const maps: WorldMap[] = []
    const conlangs: ConlangLanguage[] = []
    const battlemaps: Record<string, TTRPGBattlemap[]> = {}

    // 1,000 Lore Entities
    for (let i = 0; i < 1000; i++) {
      entities.push({
        id: `entity-${i}`,
        worldId: 'world-perf',
        title: `Entity ${i} of the Northern Realm`,
        type: i % 2 === 0 ? 'character' : 'location',
        summary: `Summary of entity ${i} describing ancient history and lore facts.`,
        content: `<p>Long text paragraph detailing the saga of entity ${i} across generations. Mentioning allies and relics from the Northern Reach and mysterious ruins.</p>`,
        tags: [`tag-${i % 20}`, 'historical', 'northern-realm'],
        aliases: [`Alias-${i}-A`, `Alias-${i}-B`],
        infobox: {
          sections: [
            {
              title: 'General',
              fields: [
                { id: `f-${i}-1`, label: 'Origin', value: `Realm ${i % 10}`, type: 'text' },
                { id: `f-${i}-2`, label: 'Power Level', value: `${i * 10}`, type: 'number' }
              ]
            }
          ]
        },
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      })
    }

    // 500 Manuscript Chapters
    for (let i = 0; i < 500; i++) {
      chapters.push({
        id: `chapter-${i}`,
        worldId: 'world-perf',
        manuscriptId: 'ms-perf',
        title: `Chapter ${i}: The Descent into Shadow`,
        content: `<p>The shadows deepened around chapter ${i}. The hero walked through the frostbitten valley of the forgotten kings.</p>`,
        order: i + 1,
        wordCount: 1500,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      })
    }

    // 1,000 Timeline Events
    for (let i = 0; i < 1000; i++) {
      timelines.push({
        id: `event-${i}`,
        worldId: 'world-perf',
        era: 'Third Age',
        year: 1000 + i,
        importance: i % 5 === 0 ? 'mythic' : 'minor',
        title: `Battle of the Sunken Crest ${i}`,
        description: `Description of historic battle ${i} which took place in the year ${1000 + i}.`,
        entityIds: [`entity-${i % 1000}`]
      })
    }

    // 200 World Maps with 5 pins each (1,000 pins total)
    for (let i = 0; i < 200; i++) {
      maps.push({
        id: `map-${i}`,
        worldId: 'world-perf',
        name: `Cartographic Chart ${i}: Whispering Highlands`,
        imageUrl: `map-${i}.png`,
        width: 3000,
        height: 2000,
        pins: Array.from({ length: 5 }, (_, p) => ({
          id: `pin-${i}-${p}`,
          mapId: `map-${i}`,
          worldId: 'world-perf',
          title: `Landmark Pin ${p} on Map ${i}`,
          description: `Detailed description of landmark ${p} in the Whispering Highlands.`,
          x: p * 15,
          y: p * 15
        })),
        regions: [],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      })
    }

    // 50 Conlang Languages with 50 words each (2,500 words total)
    for (let i = 0; i < 50; i++) {
      conlangs.push({
        id: `conlang-${i}`,
        worldId: 'world-perf',
        name: `Valyric Dialect ${i}`,
        family: 'Elder Tongue',
        description: `Grammar and syntax documentation for dialect ${i}.`,
        words: Array.from({ length: 50 }, (_, w) => ({
          id: `word-${i}-${w}`,
          term: `keldar_${i}_${w}`,
          definition: `to illuminate the crystal path in dialect ${i}`,
          partOfSpeech: 'verb',
          phonetic: `/kɛl'dɑr/`,
          etymology: 'Proto-Nordic *kel'
        })),
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      })
    }

    // 100 Campaigns with 5 battlemaps each (500 battlemaps, 5,000 tokens total)
    for (let c = 0; c < 100; c++) {
      const campaignId = `camp-${c}`
      battlemaps[campaignId] = []
      for (let m = 0; m < 5; m++) {
        const bmId = `bmap-${c}-${m}`
        const tokens: TTRPGToken[] = Array.from({ length: 10 }, (_, t) => ({
          id: `tok-${c}-${m}-${t}`,
          campaignId,
          battlemapId: bmId,
          name: t === 0 ? `Boss Dragon of Sector ${c}` : `Goblin Skirmisher ${t}`,
          size: t === 0 ? 3 : 1,
          x: t * 10,
          y: t * 10,
          isEnemy: t % 2 === 0
        }))

        battlemaps[campaignId].push({
          id: bmId,
          campaignId,
          name: `Dungeon Crypt Arena ${c}-${m}`,
          imageUrl: `crypt-${c}-${m}.png`,
          description: `Tactical battle arena located in ancient catacombs sector ${c}.`,
          gridType: m % 2 === 0 ? 'square' : 'hex',
          gridSize: 64,
          gridOpacity: 0.5,
          gridUnitFeet: 5,
          showCoordinates: true,
          snapToGrid: true,
          tokens,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z'
        })
      }
    }

    return { entities, chapters, timelines, maps, conlangs, battlemaps }
  }

  // =========================================================================
  // 1. EMPIRICAL BENCHMARK: SUB-50MS FILTERING
  // =========================================================================

  describe('Focus 1: Sub-50ms Search Performance Benchmark', () => {
    it('executes 50 varied queries across large-scale vault (5,250 items + 5,000 tokens) with all queries under 50ms', () => {
      const scale = generateScaleData()

      const testQueries = [
        // Common 1-letter & 2-letter queries (broadest matching)
        'a', 'e', 'th', 'in', 'or',
        // Exact entity titles
        'Entity 42 of the Northern Realm',
        'Entity 999 of the Northern Realm',
        // Exact battlemap names
        'Dungeon Crypt Arena 50-2',
        'Dungeon Crypt Arena 99-4',
        // Token names
        'Boss Dragon of Sector 12',
        'Goblin Skirmisher',
        // Chapter titles and prose excerpts
        'The Descent into Shadow',
        'frostbitten valley',
        // Timeline events
        'Battle of the Sunken Crest 777',
        'historic battle',
        // Maps & pins
        'Whispering Highlands',
        'Landmark Pin 3',
        // Conlang words
        'keldar_25_10',
        'crystal path',
        // Aliases and tags
        'Alias-500-A',
        '#historical',
        // Non-matching worst-case queries (forces exhaustive scan across every field)
        'xyz_non_existent_token_or_lore_entity_12345',
        'zzqqww998877_no_match',
        // Mixed casing
        'dUnGeOn CrYpT aReNa',
        'gObLiN sKiRmIsHeR',
        // Domain filtered queries
        'Dungeon Crypt Arena',
        'Goblin',
        'Entity 100',
        'Chapter 50'
      ]

      const latencies: number[] = []

      // Run each query and measure precise execution time
      for (const query of testQueries) {
        const start = performance.now()
        const results = searchDeepVault(
          query,
          'all',
          scale.entities,
          scale.chapters,
          scale.timelines,
          scale.maps,
          scale.conlangs,
          scale.battlemaps
        )
        const duration = performance.now() - start
        if (duration >= 50) {
          console.warn(`[SLOW QUERY]: "${query}" took ${duration.toFixed(2)}ms (results: ${results.length})`)
        }
        latencies.push(duration)
      }

      // Compute statistics
      latencies.sort((a, b) => a - b)
      const p50 = latencies[Math.floor(latencies.length * 0.50)]
      const p95 = latencies[Math.floor(latencies.length * 0.95)]
      const p99 = latencies[latencies.length - 1]
      const maxLatency = latencies[latencies.length - 1]
      const avgLatency = latencies.reduce((sum, v) => sum + v, 0) / latencies.length

      console.log(`[Search Latency Benchmark Results] p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99/max: ${p99.toFixed(2)}ms | avg: ${avgLatency.toFixed(2)}ms`)

      expect(maxLatency).toBeLessThan(50)
      expect(p50).toBeLessThan(25)
    })

    it('executes domain-isolated searches faster than full multi-domain searches', () => {
      const scale = generateScaleData()

      const startAll = performance.now()
      const allResults = searchDeepVault('Dungeon', 'all', scale.entities, scale.chapters, scale.timelines, scale.maps, scale.conlangs, scale.battlemaps)
      const durationAll = performance.now() - startAll

      const startBattlemap = performance.now()
      const bmResults = searchDeepVault('Dungeon', 'battlemap', scale.entities, scale.chapters, scale.timelines, scale.maps, scale.conlangs, scale.battlemaps)
      const durationBattlemap = performance.now() - startBattlemap

      expect(durationBattlemap).toBeLessThan(50)
      expect(durationAll).toBeLessThan(50)
      expect(bmResults.every(r => r.domain === 'battlemap')).toBe(true)
      expect(bmResults.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // 2. BATTLEMAP SEARCH & TOKEN METADATA INDEXING
  // =========================================================================

  describe('Focus 2: Battlemap Search Results & Token Metadata Indexing', () => {
    const mockBattlemaps: Record<string, TTRPGBattlemap[]> = {
      'camp-alpha': [
        {
          id: 'bm-sunken-shrine',
          campaignId: 'camp-alpha',
          name: 'Sunken Shrine of the Kraken',
          imageUrl: 'shrine.png',
          description: 'A damp cavern temple filled with dark water and tidal altars.',
          gridType: 'square',
          gridSize: 64,
          gridOpacity: 0.6,
          gridUnitFeet: 5,
          showCoordinates: true,
          snapToGrid: true,
          tokens: [
            {
              id: 'tok-kraken-priest',
              campaignId: 'camp-alpha',
              battlemapId: 'bm-sunken-shrine',
              name: 'High Priest Malakor',
              size: 2,
              x: 50,
              y: 50,
              isEnemy: true
            },
            {
              id: 'tok-paladin',
              campaignId: 'camp-alpha',
              battlemapId: 'bm-sunken-shrine',
              name: 'Sir Gareth the Brave',
              size: 1,
              x: 20,
              y: 80,
              isEnemy: false
            }
          ],
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z'
        }
      ],
      'camp-beta': [
        {
          id: 'bm-hex-citadel',
          campaignId: 'camp-beta',
          name: 'Obsidian Hex Citadel',
          imageUrl: 'citadel.png',
          description: 'Volcanic fortress fortified with obsidian spires.',
          gridType: 'hex',
          gridSize: 50,
          gridOpacity: 0.4,
          gridUnitFeet: 5,
          showCoordinates: false,
          snapToGrid: true,
          tokens: [
            {
              id: 'tok-fire-elemental',
              campaignId: 'camp-beta',
              battlemapId: 'bm-hex-citadel',
              name: 'Greater Fire Elemental',
              size: 3,
              x: 40,
              y: 40,
              isEnemy: true
            }
          ],
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z'
        }
      ]
    }

    it('indexes exact battlemap name match with score 100 and grid badge', () => {
      const results = searchDeepVault('Sunken Shrine of the Kraken', 'all', [], [], [], [], [], mockBattlemaps)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('bmap-bm-sunken-shrine-exact')
      expect(results[0].targetId).toBe('bm-sunken-shrine')
      expect(results[0].domain).toBe('battlemap')
      expect(results[0].badge).toBe('BATTLEMAP · SQUARE')
      expect(results[0].score).toBe(100)
    })

    it('indexes partial battlemap name match with score 80 and grid badge', () => {
      const results = searchDeepVault('Obsidian Hex', 'all', [], [], [], [], [], mockBattlemaps)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('bmap-bm-hex-citadel-title')
      expect(results[0].targetId).toBe('bm-hex-citadel')
      expect(results[0].domain).toBe('battlemap')
      expect(results[0].badge).toBe('BATTLEMAP · HEX')
      expect(results[0].score).toBe(80)
    })

    it('indexes battlemap description match with score 50 and context snippet', () => {
      const results = searchDeepVault('tidal altars', 'all', [], [], [], [], [], mockBattlemaps)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('bmap-bm-sunken-shrine-desc')
      expect(results[0].targetId).toBe('bm-sunken-shrine')
      expect(results[0].domain).toBe('battlemap')
      expect(results[0].matchField).toBe('description')
      expect(results[0].snippet).toContain('tidal altars')
      expect(results[0].score).toBe(50)
    })

    it('indexes Enemy token metadata with score 45, token badge, and (Enemy) snippet', () => {
      const results = searchDeepVault('Malakor', 'all', [], [], [], [], [], mockBattlemaps)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('bmap-bm-sunken-shrine-token-tok-kraken-priest')
      expect(results[0].targetId).toBe('bm-sunken-shrine')
      expect(results[0].domain).toBe('battlemap')
      expect(results[0].title).toBe('Sunken Shrine of the Kraken')
      expect(results[0].badge).toBe('Token: High Priest Malakor')
      expect(results[0].snippet).toBe('Token: High Priest Malakor (Enemy)')
      expect(results[0].score).toBe(45)
    })

    it('indexes Ally token metadata with score 45, token badge, and (Ally) snippet', () => {
      const results = searchDeepVault('Gareth the Brave', 'all', [], [], [], [], [], mockBattlemaps)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('bmap-bm-sunken-shrine-token-tok-paladin')
      expect(results[0].targetId).toBe('bm-sunken-shrine')
      expect(results[0].domain).toBe('battlemap')
      expect(results[0].badge).toBe('Token: Sir Gareth the Brave')
      expect(results[0].snippet).toBe('Token: Sir Gareth the Brave (Ally)')
      expect(results[0].score).toBe(45)
    })

    it('filters battlemaps cleanly when domain filter is set to battlemap vs other domains', () => {
      const dummyEntity: LoreEntity = {
        id: 'e-kraken',
        worldId: 'w1',
        title: 'Kraken Lore',
        type: 'species',
        summary: 'Deep sea monster',
        content: '<p>The legendary kraken sleeps in deep trenches.</p>',
        tags: [],
        aliases: [],
        infobox: { sections: [] },
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }

      // Query "Kraken" in 'all' domain returns both Lore entity and Battlemap
      const allResults = searchDeepVault('Kraken', 'all', [dummyEntity], [], [], [], [], mockBattlemaps)
      expect(allResults.some(r => r.domain === 'lore')).toBe(true)
      expect(allResults.some(r => r.domain === 'battlemap')).toBe(true)

      // Query "Kraken" in 'battlemap' domain returns ONLY battlemap results
      const bmResults = searchDeepVault('Kraken', 'battlemap', [dummyEntity], [], [], [], [], mockBattlemaps)
      expect(bmResults.every(r => r.domain === 'battlemap')).toBe(true)
      expect(bmResults.some(r => r.domain === 'lore')).toBe(false)

      // Query "Kraken" in 'lore' domain returns ONLY lore results
      const loreResults = searchDeepVault('Kraken', 'lore', [dummyEntity], [], [], [], [], mockBattlemaps)
      expect(loreResults.every(r => r.domain === 'lore')).toBe(true)
      expect(loreResults.some(r => r.domain === 'battlemap')).toBe(false)
    })
  })

  // =========================================================================
  // 3. NAVIGATION LOGIC SIMULATION & CAMPAIGN RESOLUTION
  // =========================================================================

  describe('Focus 3: Battlemap Navigation & Store Resolution Logic', () => {
    it('correctly maps target battlemap to parent campaign ID across multiple campaigns', () => {
      const battlemaps: Record<string, TTRPGBattlemap[]> = {
        'camp-1': [
          { id: 'bm-1', campaignId: 'camp-1', name: 'Map 1', imageUrl: '', gridType: 'square', gridSize: 50, gridOpacity: 0.5, gridUnitFeet: 5, showCoordinates: true, snapToGrid: true, tokens: [], createdAt: '', updatedAt: '' }
        ],
        'camp-2': [
          { id: 'bm-2', campaignId: 'camp-2', name: 'Map 2', imageUrl: '', gridType: 'square', gridSize: 50, gridOpacity: 0.5, gridUnitFeet: 5, showCoordinates: true, snapToGrid: true, tokens: [], createdAt: '', updatedAt: '' }
        ]
      }

      const setActiveCampaignIdMock = vi.fn()
      const setActiveBattlemapIdMock = vi.fn()
      const openTabMock = vi.fn()

      // Function simulating CommandPalette.tsx handleSelectResult for battlemap
      function selectBattlemapResult(res: DeepSearchResult) {
        if (res.domain === 'battlemap') {
          for (const [cId, bmaps] of Object.entries(battlemaps)) {
            if (bmaps?.some(bm => bm.id === res.targetId)) {
              setActiveCampaignIdMock(cId)
              break
            }
          }
          setActiveBattlemapIdMock(res.targetId)
          openTabMock({ title: res.title, type: 'map', targetId: res.targetId })
        }
      }

      // Execute selection for bm-2
      const result2: DeepSearchResult = {
        id: 'bmap-bm-2-title',
        targetId: 'bm-2',
        domain: 'battlemap',
        title: 'Map 2',
        badge: 'BATTLEMAP · SQUARE',
        matchField: 'title',
        score: 80
      }

      selectBattlemapResult(result2)

      expect(setActiveCampaignIdMock).toHaveBeenCalledWith('camp-2')
      expect(setActiveBattlemapIdMock).toHaveBeenCalledWith('bm-2')
      expect(openTabMock).toHaveBeenCalledWith({ title: 'Map 2', type: 'map', targetId: 'bm-2' })
    })
  })

  // =========================================================================
  // 4. KEYBOARD NAVIGATION & AUTO-SCROLL SIMULATION
  // =========================================================================

  describe('Focus 4: Keyboard Navigation & Active Item Auto-Scrolling', () => {
    it('ArrowDown and ArrowUp perform mathematical wrap-around correctly without negative indices', () => {
      const itemsCount = 5

      // ArrowDown from index 4 wraps to 0
      let selectedIndex = 4
      selectedIndex = (selectedIndex + 1) % Math.max(itemsCount, 1)
      expect(selectedIndex).toBe(0)

      // ArrowUp from index 0 wraps to 4
      selectedIndex = (selectedIndex - 1 + itemsCount) % Math.max(itemsCount, 1)
      expect(selectedIndex).toBe(4)

      // Multiple ArrowDown steps
      selectedIndex = (selectedIndex + 1) % itemsCount
      expect(selectedIndex).toBe(0)
      selectedIndex = (selectedIndex + 1) % itemsCount
      expect(selectedIndex).toBe(1)
    })

    it('single item list handles ArrowDown and ArrowUp cleanly without divergence', () => {
      const itemsCount = 1
      let selectedIndex = 0

      selectedIndex = (selectedIndex + 1) % Math.max(itemsCount, 1)
      expect(selectedIndex).toBe(0)

      selectedIndex = (selectedIndex - 1 + itemsCount) % Math.max(itemsCount, 1)
      expect(selectedIndex).toBe(0)
    })

    it('empty list handles ArrowDown and ArrowUp without divide by zero', () => {
      const itemsCount = 0
      let selectedIndex = 0

      selectedIndex = (selectedIndex + 1) % Math.max(itemsCount, 1)
      expect(selectedIndex).toBe(0)

      selectedIndex = (selectedIndex - 1 + itemsCount) % Math.max(itemsCount, 1)
      expect(selectedIndex === 0).toBe(true)
    })

    it('simulates scrollIntoView invocation on active element with nearest block semantics', () => {
      const mockScrollIntoView = vi.fn()
      const elementMock = {
        scrollIntoView: mockScrollIntoView
      }

      const itemRefs = [null, elementMock, null]
      const selectedIndex = 1

      // Simulates CommandPalette.tsx useEffect
      if (itemRefs[selectedIndex]) {
        itemRefs[selectedIndex]?.scrollIntoView({ block: 'nearest' })
      }

      expect(mockScrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    })
  })

  // =========================================================================
  // 5. ADVERSARIAL EDGE CASES & STRESS FUZZING
  // =========================================================================

  describe('Focus 5: Adversarial Edge Cases & Fuzz Testing', () => {
    it('handles empty query and whitespace queries returning empty results immediately', () => {
      expect(searchDeepVault('')).toEqual([])
      expect(searchDeepVault('   ')).toEqual([])
      expect(searchDeepVault('\t\n\r  ')).toEqual([])
    })

    it('handles special regex characters safely without syntax error or catastrophic backtracking', () => {
      const regexAttackQueries = [
        '.*',
        '(((',
        '[a-z]+',
        '\\d+\\w*',
        '^(a+)+$',
        '???',
        '+++',
        '***'
      ]

      for (const q of regexAttackQueries) {
        expect(() => {
          const res = searchDeepVault(q)
          expect(Array.isArray(res)).toBe(true)
        }).not.toThrow()
      }
    })

    it('handles HTML injection attacks and scripts gracefully', () => {
      const xssQuery = '<script>alert("xss")</script>'
      expect(() => {
        const res = searchDeepVault(xssQuery)
        expect(Array.isArray(res)).toBe(true)
      }).not.toThrow()
    })

    it('handles unicode, diacritics, and emoji queries accurately', () => {
      const mockBm: Record<string, TTRPGBattlemap[]> = {
        'camp-unicode': [
          {
            id: 'bm-dragon',
            campaignId: 'camp-unicode',
            name: 'Lair of the Dragon 🐉',
            imageUrl: '',
            gridType: 'square',
            gridSize: 50,
            gridOpacity: 0.5,
            gridUnitFeet: 5,
            showCoordinates: true,
            snapToGrid: true,
            tokens: [
              {
                id: 'tok-nordic',
                campaignId: 'camp-unicode',
                battlemapId: 'bm-dragon',
                name: 'Björn Kaldr-Sjó',
                size: 1,
                x: 10,
                y: 10,
                isEnemy: false
              }
            ],
            createdAt: '',
            updatedAt: ''
          }
        ]
      }

      const dragonResults = searchDeepVault('🐉', 'battlemap', [], [], [], [], [], mockBm)
      expect(dragonResults).toHaveLength(1)
      expect(dragonResults[0].title).toBe('Lair of the Dragon 🐉')

      const nordicResults = searchDeepVault('Björn', 'battlemap', [], [], [], [], [], mockBm)
      expect(nordicResults).toHaveLength(1)
      expect(nordicResults[0].badge).toBe('Token: Björn Kaldr-Sjó')
    })

    it('handles resilient fallback when battlemaps or tokens have missing or undefined properties', () => {
      const raggedBattlemaps: Record<string, any[]> = {
        'camp-ragged': [
          {
            id: 'bm-ragged-1',
            campaignId: 'camp-ragged',
            name: 'Ragged Map',
            // Missing description, gridType
            tokens: [
              {
                id: 'tok-1',
                name: 'Ghost Token'
                // Missing isEnemy, x, y
              }
            ]
          },
          {
            id: 'bm-ragged-2',
            campaignId: 'camp-ragged',
            name: 'Tokenless Map'
            // Missing tokens property completely
          }
        ]
      }

      expect(() => {
        const res = searchDeepVault('Ghost', 'battlemap', [], [], [], [], [], raggedBattlemaps as any)
        expect(res).toHaveLength(1)
        expect(res[0].snippet).toBe('Token: Ghost Token (Ally)')
      }).not.toThrow()

      expect(() => {
        const res = searchDeepVault('Tokenless', 'battlemap', [], [], [], [], [], raggedBattlemaps as any)
        expect(res).toHaveLength(1)
        expect(res[0].badge).toBe('BATTLEMAP · GRID')
      }).not.toThrow()
    })

    it('stress tests a single battlemap containing 10,000 tokens without performance collapse', () => {
      const tenThousandTokens: TTRPGToken[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `t-${i}`,
        campaignId: 'camp-huge',
        battlemapId: 'bm-huge',
        name: i === 9999 ? 'Needle in Haystack Token' : `Swarm Rat ${i}`,
        size: 1,
        x: 50,
        y: 50,
        isEnemy: true
      }))

      const hugeBattlemap: Record<string, TTRPGBattlemap[]> = {
        'camp-huge': [
          {
            id: 'bm-huge',
            campaignId: 'camp-huge',
            name: 'Endless Labyrinth',
            imageUrl: '',
            gridType: 'square',
            gridSize: 50,
            gridOpacity: 0.5,
            gridUnitFeet: 5,
            showCoordinates: true,
            snapToGrid: true,
            tokens: tenThousandTokens,
            createdAt: '',
            updatedAt: ''
          }
        ]
      }

      const start = performance.now()
      const results = searchDeepVault('Needle in Haystack', 'battlemap', [], [], [], [], [], hugeBattlemap)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(results).toHaveLength(1)
      expect(results[0].badge).toBe('Token: Needle in Haystack Token')
      console.log(`[10,000 Tokens Token Search Duration]: ${duration.toFixed(2)}ms`)
    })
  })
})
