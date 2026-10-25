import { describe, it, expect } from 'vitest'
import { LoreEntity, DirectoryFolder, DirectoryItem, TTRPGBattlemap, TTRPGToken } from '@shared/types'
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
  TTRPGWall,
  FoundrySceneData,
  exportBattlemapToFoundryScene,
  importFoundrySceneToBattlemap,
  percentToScenePixel,
  scenePixelToPercent
} from './helpers/foundryBridgeHelper'

describe('Obsidian & Foundry VTT Serialization Suite (E2E)', () => {
  // Test Fixtures
  const createTestEntity = (id: string, title: string, options: Partial<LoreEntity> = {}): LoreEntity => ({
    id,
    worldId: 'world-campaign',
    title,
    type: 'character',
    tags: ['commander', 'northguard'],
    aliases: ['The Boreal Warden', 'Vaelen of Horn-Keep'],
    summary: 'A battle-hardened veteran of the northern skirmishes.',
    content: '<p>Vaelen commands the garrison at [[Horn-Keep]].</p>',
    avatarUrl: 'assets/vaelen.png',
    bannerUrl: 'assets/vaelen-banner.png',
    isSecret: false,
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-24T18:00:00.000Z',
    infobox: {
      subtitle: 'Hearth-Guard of Ostergard',
      sections: [
        {
          title: 'Biographical Data',
          fields: [
            { id: 'f-1', label: 'Faction', value: 'Ostergard Hearth-Guard', type: 'entity-link', targetEntityId: 'faction-ostergard' },
            { id: 'f-2', label: 'Age', value: '34', type: 'number' }
          ]
        }
      ]
    },
    ...options
  })

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 per feature)
  // =========================================================================

  describe('Tier 1: Feature 20 - Obsidian Vault Hierarchy Export/Import', () => {
    it('T1.20.1: maps DirectoryFolder hierarchy into nested filesystem directory paths', () => {
      const folders: DirectoryFolder[] = [
        { id: 'f-root', worldId: 'w1', name: 'Codex', parentId: null, order: 0, createdAt: '', updatedAt: '' },
        { id: 'f-sub', worldId: 'w1', name: 'Characters', parentId: 'f-root', order: 0, createdAt: '', updatedAt: '' },
        { id: 'f-inner', worldId: 'w1', name: 'Commanders', parentId: 'f-sub', order: 0, createdAt: '', updatedAt: '' }
      ]
      const entity = createTestEntity('e-1', 'Vaelen')
      const items: DirectoryItem[] = [
        { id: 'item-1', worldId: 'w1', folderId: 'f-inner', entityId: 'e-1', order: 0 }
      ]

      const exported = exportWorldToObsidianFiles('Oros World', [entity], folders, items)
      expect(exported.files['Codex/Characters/Commanders/Vaelen.md']).toBeDefined()
    })

    it('T1.20.2: categorizes unfiled entities into standard default type directories', () => {
      const character = createTestEntity('e-c', 'Lyra', { type: 'character' })
      const location = createTestEntity('e-l', 'Horn-Keep', { type: 'location' })
      const faction = createTestEntity('e-f', 'Ostergard', { type: 'faction' })

      const exported = exportWorldToObsidianFiles('Oros World', [character, location, faction])

      expect(exported.files['Characters/Lyra.md']).toBeDefined()
      expect(exported.files['Locations/Horn-Keep.md']).toBeDefined()
      expect(exported.files['Factions/Ostergard.md']).toBeDefined()
    })

    it('T1.20.3: sanitizes illegal filename characters while preserving original title', () => {
      const entity = createTestEntity('e-bad', 'Lord Vaelen: The Wolf / Crow?')
      const exported = exportWorldToObsidianFiles('Oros World', [entity])

      // Illegal characters : / ? replaced with _
      expect(exported.files['Characters/Lord Vaelen_ The Wolf _ Crow_.md']).toBeDefined()

      // YAML frontmatter must preserve original title
      const content = exported.files['Characters/Lord Vaelen_ The Wolf _ Crow_.md']
      const { frontmatter } = parseFrontmatter(content)
      expect(frontmatter.originalTitle).toBe('Lord Vaelen: The Wolf / Crow?')
    })

    it('T1.20.4: reconstructs DirectoryFolder tree upon re-importing directory structure', () => {
      const files: Record<string, string> = {
        'Lore/History/Ancient_Eras.md': '---\nid: "e-hist"\ntitle: "Ancient Eras"\ntype: "lore"\n---\n<p>History notes.</p>',
        'Characters/Heroes/Vaelen.md': '---\nid: "e-vae"\ntitle: "Vaelen"\ntype: "character"\n---\n<p>Hero notes.</p>'
      }

      const imported = importObsidianFilesToWorld(files)
      expect(imported.entities).toHaveLength(2)
      expect(imported.folders.map(f => f.name)).toContain('Lore')
      expect(imported.folders.map(f => f.name)).toContain('History')
      expect(imported.folders.map(f => f.name)).toContain('Characters')
      expect(imported.folders.map(f => f.name)).toContain('Heroes')
    })

    it('T1.20.5: generates manifest with accurate folder count and exported entity IDs', () => {
      const e1 = createTestEntity('e-1', 'Entity 1')
      const e2 = createTestEntity('e-2', 'Entity 2')
      const exported = exportWorldToObsidianFiles('World', [e1, e2])

      expect(exported.manifest.totalFiles).toBe(2)
      expect(exported.manifest.exportedEntityIds).toEqual(['e-1', 'e-2'])
    })
  })

  describe('Tier 1: Feature 21 - Obsidian YAML Frontmatter Mapping & Lossless Roundtrip', () => {
    it('T1.21.1: serializes complete entity metadata into clean YAML frontmatter', () => {
      const entity = createTestEntity('e-vaelen', 'Vaelen the Northguard')
      const yaml = serializeFrontmatter(entity)

      expect(yaml.startsWith('---')).toBe(true)
      expect(yaml.endsWith('---')).toBe(true)
      expect(yaml).toContain('id: "e-vaelen"')
      expect(yaml).toContain('title: "Vaelen the Northguard"')
      expect(yaml).toContain('type: "character"')
      expect(yaml).toContain('isSecret: false')
      expect(yaml).toContain('tags:')
      expect(yaml).toContain('aliases:')
      expect(yaml).toContain('infobox:')
    })

    it('T1.21.2: parses frontmatter back into structured metadata object', () => {
      const entity = createTestEntity('e-vaelen', 'Vaelen the Northguard')
      const yaml = serializeFrontmatter(entity)
      const doc = `${yaml}\n\n# Body content goes here.`

      const { frontmatter, body } = parseFrontmatter(doc)
      expect(frontmatter.id).toBe('e-vaelen')
      expect(frontmatter.title).toBe('Vaelen the Northguard')
      expect(frontmatter.tags).toContain('commander')
      expect(frontmatter.aliases).toContain('The Boreal Warden')
      expect(body).toBe('# Body content goes here.')
    })

    it('T1.21.3: preserves structured infobox sections, labels, and targetEntityIds', () => {
      const entity = createTestEntity('e-vaelen', 'Vaelen the Northguard')
      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\n`)

      expect(frontmatter.infobox).toBeDefined()
      expect(frontmatter.infobox.subtitle).toBe('Hearth-Guard of Ostergard')
      expect(frontmatter.infobox.sections).toHaveLength(1)
      expect(frontmatter.infobox.sections[0].title).toBe('Biographical Data')
      expect(frontmatter.infobox.sections[0].fields).toHaveLength(2)
      expect(frontmatter.infobox.sections[0].fields[0].targetEntityId).toBe('faction-ostergard')
    })

    it('T1.21.4: captures third-party frontmatter in customProperties catch-all', () => {
      const doc = `---
id: "e-ext"
title: "Dataview Entity"
type: "character"
customProperties:
  dataviewField: "special-query"
  publish: true
---

Article text.`

      const { frontmatter } = parseFrontmatter(doc)
      expect(frontmatter.id).toBe('e-ext')
      expect(frontmatter.customProperties).toBeDefined()
    })

    it('T1.21.5: Invariant: import(export(entity)) == entity (100% roundtrip fidelity)', () => {
      const original = createTestEntity('e-invar', 'Archmage Corvus', {
        summary: 'Master of the Arcane Spire.',
        tags: ['archmage', 'high-council', 'canonical'],
        aliases: ['The Raven', 'Lord of the Azure Spire'],
        isSecret: true,
        content: '<p>The archmage resides in the tower.</p>'
      })

      const exported = exportWorldToObsidianFiles('RoundtripWorld', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      expect(imported.entities).toHaveLength(1)
      const reconstituted = imported.entities[0]

      expect(reconstituted.id).toBe(original.id)
      expect(reconstituted.title).toBe(original.title)
      expect(reconstituted.type).toBe(original.type)
      expect(reconstituted.summary).toBe(original.summary)
      expect(reconstituted.isSecret).toBe(original.isSecret)
      expect(reconstituted.tags).toEqual(original.tags)
      expect(reconstituted.aliases).toEqual(original.aliases)
      expect(reconstituted.infobox).toBeDefined()
    })
  })

  describe('Tier 1: Feature 22 - Obsidian [[wiki-links]] Translation', () => {
    it('T1.22.1: converts HTML mention tags into Obsidian [[wiki-links]] on export', () => {
      const html = '<p>He swore fealty to <span data-type="mention" data-id="e-vaelen" data-label="Vaelen">@Vaelen</span>.</p>'
      const markdown = htmlContentToObsidianMarkdown(html)
      expect(markdown).toBe('He swore fealty to [[Vaelen]].')
    })

    it('T1.22.2: converts WikiLink spans into Obsidian [[wiki-links]] on export', () => {
      const html = '<p>Travel to <span class="oros-wiki-link" data-type="wiki-link" data-id="e-citadel" data-title="The High Citadel">[[The High Citadel]]</span>.</p>'
      const markdown = htmlContentToObsidianMarkdown(html)
      expect(markdown).toBe('Travel to [[The High Citadel]].')
    })

    it('T1.22.3: translates Obsidian [[wiki-links]] back to TipTap HTML mentions on import', () => {
      const markdown = 'The armies marched from [[Horn-Keep]] towards [[Ostergard]].'
      const titleMap = new Map([
        ['horn-keep', 'e-horn'],
        ['ostergard', 'e-ost']
      ])

      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)
      expect(html).toContain('data-type="mention"')
      expect(html).toContain('data-id="e-horn"')
      expect(html).toContain('data-id="e-ost"')
    })

    it('T1.22.4: translates Obsidian alias links [[Target|Display]] to custom label mentions', () => {
      const markdown = 'Led by [[Lord Vaelen|The High Commander]].'
      const titleMap = new Map([['lord vaelen', 'e-vae']])

      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)
      expect(html).toContain('data-id="e-vae"')
      expect(html).toContain('data-label="The High Commander"')
    })

    it('T1.22.5: handles unresolved wiki-links cleanly without crashing during import', () => {
      const markdown = 'Lost artifact: [[The Forgotten Crown of Shadows]].'
      const titleMap = new Map<string, string>() // empty map

      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)
      expect(html).toContain('data-type="mention"')
      expect(html).toContain('The Forgotten Crown of Shadows')
    })
  })

  describe('Tier 1: Feature 23 - Foundry VTT Scene Geometry Translation', () => {
    const battlemap: TTRPGBattlemap = {
      id: 'bm-citadel',
      campaignId: 'camp-1',
      name: 'Sunken Quay & Tavern',
      imageUrl: 'scenes/salt-quay.webp',
      gridType: 'square',
      gridSize: 64,
      gridOpacity: 0.35,
      gridUnitFeet: 5,
      showCoordinates: true,
      snapToGrid: true,
      tokens: [],
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    }

    it('T1.23.1: exports battlemap image, dimensions, and grid settings to Foundry Scene JSON', () => {
      const scene = exportBattlemapToFoundryScene(battlemap, 'Campaign', [], { width: 1920, height: 1080 }, 0.25)

      expect(scene.name).toBe('Sunken Quay & Tavern')
      expect(scene.img).toBe('scenes/salt-quay.webp')
      expect(scene.width).toBe(1920)
      expect(scene.height).toBe(1080)
      expect(scene.padding).toBe(0.25)
      expect(scene.grid.size).toBe(64)
      expect(scene.grid.distance).toBe(5)
      expect(scene.grid.type).toBe(1) // square
    })

    it('T1.23.2: converts hex grid type to Foundry grid code (2)', () => {
      const hexMap: TTRPGBattlemap = { ...battlemap, gridType: 'hex' }
      const scene = exportBattlemapToFoundryScene(hexMap)
      expect(scene.grid.type).toBe(2)
    })

    it('T1.23.3: applies padding factor coordinate transformation to scene pixel space', () => {
      // Dimension: 1920, Padding: 0.25 (padding offset = 480px)
      // Percentage: 0% -> 480px, 50% -> 480 + 960 = 1440px, 100% -> 480 + 1920 = 2400px
      expect(percentToScenePixel(0, 1920, 0.25)).toBe(480)
      expect(percentToScenePixel(50, 1920, 0.25)).toBe(1440)
      expect(percentToScenePixel(100, 1920, 0.25)).toBe(2400)
    })

    it('T1.23.4: inverts padding transformation accurately back to original percentage coordinates', () => {
      expect(scenePixelToPercent(480, 1920, 0.25)).toBe(0)
      expect(scenePixelToPercent(1440, 1920, 0.25)).toBe(50)
      expect(scenePixelToPercent(2400, 1920, 0.25)).toBe(100)
    })

    it('T1.23.5: imports Foundry Scene JSON document back into Oros TTRPGBattlemap', () => {
      const scene = exportBattlemapToFoundryScene(battlemap)
      const { battlemap: imported } = importFoundrySceneToBattlemap(scene, 'camp-1')

      expect(imported.name).toBe(battlemap.name)
      expect(imported.imageUrl).toBe(battlemap.imageUrl)
      expect(imported.gridType).toBe('square')
      expect(imported.gridSize).toBe(64)
    })
  })

  describe('Tier 1: Feature 24 - Foundry VTT Walls & Doors Adapter', () => {
    it('T1.24.1: exports regular walls with movement and vision blocking', () => {
      const wall: TTRPGWall = {
        id: 'w-1',
        battlemapId: 'bm-1',
        p1: { x: 10, y: 10 },
        p2: { x: 50, y: 10 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', [wall])
      expect(scene.walls).toHaveLength(1)
      expect(scene.walls[0].move).toBe(20)
      expect(scene.walls[0].sense).toBe(20)
      expect(scene.walls[0].door).toBe(0)
    })

    it('T1.24.2: exports windows allowing vision while blocking movement', () => {
      const window: TTRPGWall = {
        id: 'w-win',
        battlemapId: 'bm-1',
        p1: { x: 20, y: 20 },
        p2: { x: 30, y: 20 },
        wallType: 'window',
        blocksMovement: true,
        blocksVision: false
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', [window])
      expect(scene.walls[0].move).toBe(20)
      expect(scene.walls[0].sense).toBe(0)
    })

    it('T1.24.3: exports regular doors with open, closed, and locked states', () => {
      const closedDoor: TTRPGWall = {
        id: 'd-1',
        battlemapId: 'bm-1',
        p1: { x: 10, y: 10 },
        p2: { x: 15, y: 10 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: true,
        doorType: 'regular',
        doorState: 'closed'
      }
      const lockedDoor: TTRPGWall = { ...closedDoor, id: 'd-2', doorState: 'locked' }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', [closedDoor, lockedDoor])
      expect(scene.walls[0].door).toBe(1)
      expect(scene.walls[0].ds).toBe(0) // closed
      expect(scene.walls[1].door).toBe(1)
      expect(scene.walls[1].ds).toBe(2) // locked
    })

    it('T1.24.4: exports secret doors with door: 2 flag', () => {
      const secretDoor: TTRPGWall = {
        id: 'd-secret',
        battlemapId: 'bm-1',
        p1: { x: 40, y: 10 },
        p2: { x: 45, y: 10 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: true,
        doorType: 'secret',
        doorState: 'closed'
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', [secretDoor])
      expect(scene.walls[0].door).toBe(2)
    })

    it('T1.24.5: roundtrips walls and door states losslessly', () => {
      const originalWalls: TTRPGWall[] = [
        {
          id: 'w-orig',
          battlemapId: 'bm-1',
          p1: { x: 10, y: 10 },
          p2: { x: 50, y: 10 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true,
          isDoor: true,
          doorType: 'secret',
          doorState: 'locked'
        }
      ]

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', originalWalls)
      const { walls: imported } = importFoundrySceneToBattlemap(scene)

      expect(imported).toHaveLength(1)
      expect(imported[0].isDoor).toBe(true)
      expect(imported[0].doorType).toBe('secret')
      expect(imported[0].doorState).toBe('locked')
      expect(imported[0].p1.x).toBeCloseTo(10, 1)
      expect(imported[0].p2.x).toBeCloseTo(50, 1)
    })
  })

  describe('Tier 1: Feature 25 - Foundry VTT Token Metadata Mapping', () => {
    it('T1.25.1: maps token center percentage coordinates to Foundry top-left scene pixel coordinates', () => {
      const token: TTRPGToken = {
        id: 'tok-1',
        campaignId: 'c1',
        battlemapId: 'bm-1',
        name: 'Vaelen',
        x: 50, // center of image
        y: 50,
        size: 1
      }

      // W=1920, H=1080, P=0.25 (pad=480, 270), Grid=64px
      // Center Scene = (1440, 810)
      // Top-Left Token (1x1 = 64px) = (1440 - 32, 810 - 32) = (1408, 778)
      const scene = exportBattlemapToFoundryScene({ id: 'bm-1', tokens: [token], gridSize: 64 } as any)
      expect(scene.tokens[0].x).toBe(1408)
      expect(scene.tokens[0].y).toBe(778)
    })

    it('T1.25.2: scales top-left offset according to token grid size (2x2, 3x3)', () => {
      const largeToken: TTRPGToken = {
        id: 'tok-dragon',
        campaignId: 'c1',
        battlemapId: 'bm-1',
        name: 'Frost Dragon',
        x: 50,
        y: 50,
        size: 3 // 3x3 cells = 192px width
      }

      // Center Scene = (1440, 810)
      // Top-Left Token = (1440 - 96, 810 - 96) = (1344, 714)
      const scene = exportBattlemapToFoundryScene({ id: 'bm-1', tokens: [largeToken], gridSize: 64 } as any)
      expect(scene.tokens[0].x).toBe(1344)
      expect(scene.tokens[0].y).toBe(714)
    })

    it('T1.25.3: maps token HP current and max into Foundry bar1 attribute', () => {
      const token: TTRPGToken = {
        id: 'tok-hp',
        campaignId: 'c1',
        battlemapId: 'bm-1',
        name: 'Soldier',
        x: 20,
        y: 20,
        size: 1,
        hpCurrent: 44,
        hpMax: 50
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1', tokens: [token] } as any)
      expect(scene.tokens[0].bar1?.value).toBe(44)
      expect(scene.tokens[0].bar1?.max).toBe(50)
    })

    it('T1.25.4: maps isEnemy flag to Foundry disposition (friendly 1 vs hostile -1)', () => {
      const ally: TTRPGToken = { id: 't-ally', campaignId: 'c1', battlemapId: 'bm-1', name: 'Ally', x: 10, y: 10, size: 1, isEnemy: false }
      const foe: TTRPGToken = { id: 't-foe', campaignId: 'c1', battlemapId: 'bm-1', name: 'Foe', x: 20, y: 20, size: 1, isEnemy: true }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1', tokens: [ally, foe] } as any)
      expect(scene.tokens[0].disposition).toBe(1)
      expect(scene.tokens[1].disposition).toBe(-1)
    })

    it('T1.25.5: roundtrips tokens between Oros percentage coordinates and Foundry pixel space', () => {
      const original: TTRPGToken = {
        id: 'tok-rt',
        campaignId: 'camp-1',
        battlemapId: 'bm-1',
        name: 'Ranger',
        x: 25.5,
        y: 75.25,
        size: 1,
        hpCurrent: 32,
        hpMax: 32,
        isEnemy: false
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1', tokens: [original], gridSize: 64 } as any)
      const { battlemap } = importFoundrySceneToBattlemap(scene, 'camp-1')

      expect(battlemap.tokens).toHaveLength(1)
      const restored = battlemap.tokens[0]
      expect(restored.name).toBe('Ranger')
      expect(restored.x).toBeCloseTo(25.5, 1)
      expect(restored.y).toBeCloseTo(75.25, 1)
      expect(restored.hpCurrent).toBe(32)
      expect(restored.isEnemy).toBe(false)
    })
  })

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 per feature)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: filename sanitizer removes forbidden characters across Windows and UNIX', () => {
      expect(sanitizeFilename('World/Sub:Folder*Name?')).toBe('World_Sub_Folder_Name_')
      expect(sanitizeFilename('He said "Hello" <World> | File')).toBe('He said _Hello_ _World_ _ File')
      expect(sanitizeFilename('')).toBe('Untitled')
    })

    it('T2.2: discards zero-length wall segments during Foundry export', () => {
      const zeroWall: TTRPGWall = {
        id: 'w-zero',
        battlemapId: 'bm-1',
        p1: { x: 50, y: 50 },
        p2: { x: 50, y: 50 }, // Same point
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true
      }

      const scene = exportBattlemapToFoundryScene({ id: 'bm-1' } as any, 'Camp', [zeroWall])
      expect(scene.walls).toHaveLength(0)
    })

    it('T2.3: extreme padding factor values (P = 0 tight vs P = 0.5 double canvas)', () => {
      // P = 0: 50% maps to exactly 960px
      expect(percentToScenePixel(50, 1920, 0)).toBe(960)
      // P = 0.5: padding offset is 960px; 50% maps to 960 + 960 = 1920px
      expect(percentToScenePixel(50, 1920, 0.5)).toBe(1920)
    })

    it('T2.4: clamps out-of-bounds imported token coordinates to [0, 100%]', () => {
      const sceneData: FoundrySceneData = {
        _id: 'sc-oob',
        name: 'OOB Scene',
        active: false,
        navigation: true,
        img: 'bg.png',
        width: 1000,
        height: 1000,
        padding: 0.25,
        backgroundColor: '#000',
        grid: { type: 1, size: 50, distance: 5, units: 'ft' },
        walls: [],
        tokens: [
          { _id: 't-neg', name: 'Negative', x: -500, y: -500, width: 1, height: 1, disposition: 0 },
          { _id: 't-huge', name: 'Huge', x: 5000, y: 5000, width: 1, height: 1, disposition: 0 }
        ]
      }

      const { battlemap } = importFoundrySceneToBattlemap(sceneData)
      expect(battlemap.tokens[0].x).toBe(0)
      expect(battlemap.tokens[0].y).toBe(0)
      expect(battlemap.tokens[1].x).toBe(100)
      expect(battlemap.tokens[1].y).toBe(100)
    })

    it('T2.5: handles complex multi-section infobox with empty values and missing fields gracefully', () => {
      const entity = createTestEntity('e-sparse', 'Sparse Entity', {
        infobox: {
          sections: [
            { title: 'Empty Section', fields: [] },
            {
              title: 'Partial Section',
              fields: [
                { id: 'f-null', label: 'Missing Val', value: '', type: 'text' }
              ]
            }
          ]
        }
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\n`)
      expect(frontmatter.title).toBe('Sparse Entity')
    })
  })

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Complete Campaign Ecosystem Export (Obsidian Lore Vault + Foundry Battlemap Scene)', () => {
      const entity = createTestEntity('char-1', 'Vaelen', {
        content: '<p>See battle records on the [[Sunken Quay & Tavern]].</p>'
      })
      const mapEntity = createTestEntity('map-1', 'Sunken Quay & Tavern', {
        type: 'location'
      })

      const battlemap: TTRPGBattlemap = {
        id: 'bm-quay',
        campaignId: 'camp-main',
        name: 'Sunken Quay & Tavern',
        imageUrl: 'quay.png',
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.3,
        gridUnitFeet: 5,
        showCoordinates: false,
        snapToGrid: true,
        tokens: [
          { id: 'tok-vaelen', campaignId: 'camp-main', battlemapId: 'bm-quay', name: 'Vaelen', x: 50, y: 50, size: 1, characterId: 'char-1' }
        ],
        createdAt: '',
        updatedAt: ''
      }

      // 1. Export Obsidian
      const obsidianVault = exportWorldToObsidianFiles('Campaign World', [entity, mapEntity])
      expect(obsidianVault.files['Characters/Vaelen.md']).toBeDefined()
      expect(obsidianVault.files['Locations/Sunken Quay & Tavern.md']).toBeDefined()

      // 2. Export Foundry
      const foundryScene = exportBattlemapToFoundryScene(battlemap)
      expect(foundryScene.tokens[0].name).toBe('Vaelen')
      expect(foundryScene.tokens[0].actorId).toBe('char-1')
    })
  })

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  describe('Tier 4: Real-World Scenarios', () => {
    it('T4.1: "Sunken Citadel Tactical Battlemap Foundry Integration" (15 walls, 3 secret doors, 8 tokens)', () => {
      // 15 perimeter and room walls
      const walls: TTRPGWall[] = []
      for (let i = 0; i < 12; i++) {
        walls.push({
          id: `wall-room-${i}`,
          battlemapId: 'citadel-map',
          p1: { x: i * 8, y: 20 },
          p2: { x: (i + 1) * 8, y: 20 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true
        })
      }
      // 3 secret doors
      for (let s = 0; s < 3; s++) {
        walls.push({
          id: `secret-door-${s}`,
          battlemapId: 'citadel-map',
          p1: { x: 30 + s * 10, y: 50 },
          p2: { x: 35 + s * 10, y: 50 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true,
          isDoor: true,
          doorType: 'secret',
          doorState: 'locked'
        })
      }

      // 8 Character & Monster tokens
      const tokens: TTRPGToken[] = []
      const names = ['Vaelen', 'Corvus', 'Lyra', 'Gorgon', 'Goblin 1', 'Goblin 2', 'Skeleton', 'Necromancer']
      names.forEach((name, idx) => {
        tokens.push({
          id: `tok-${idx}`,
          campaignId: 'citadel-camp',
          battlemapId: 'citadel-map',
          name,
          x: 10 + (idx % 4) * 20,
          y: 20 + Math.floor(idx / 4) * 30,
          size: idx === 3 ? 2 : 1, // Gorgon is 2x2
          isEnemy: idx >= 3,
          hpCurrent: idx === 3 ? 120 : 25,
          hpMax: idx === 3 ? 120 : 25
        })
      })

      const battlemap: TTRPGBattlemap = {
        id: 'citadel-map',
        campaignId: 'citadel-camp',
        name: 'The Sunken Citadel - Level 1',
        imageUrl: 'citadel.jpg',
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.4,
        gridUnitFeet: 5,
        showCoordinates: true,
        snapToGrid: true,
        tokens,
        createdAt: '',
        updatedAt: ''
      }

      // Export to Foundry VTT Scene Document
      const sceneData = exportBattlemapToFoundryScene(battlemap, 'Citadel Campaign', walls, { width: 1920, height: 1080 }, 0.25)

      expect(sceneData.walls).toHaveLength(15)
      expect(sceneData.walls.filter(w => w.door === 2)).toHaveLength(3) // 3 secret doors
      expect(sceneData.tokens).toHaveLength(8)

      // Re-import to Oros
      const { battlemap: importedMap, walls: importedWalls } = importFoundrySceneToBattlemap(sceneData, 'citadel-camp')

      expect(importedWalls).toHaveLength(15)
      expect(importedWalls.filter(w => w.doorType === 'secret')).toHaveLength(3)
      expect(importedMap.tokens).toHaveLength(8)
      expect(importedMap.tokens.find(t => t.name === 'Gorgon')?.size).toBe(2)
      expect(importedMap.tokens.find(t => t.name === 'Gorgon')?.isEnemy).toBe(true)
    })
  })
})
