import { describe, it, expect } from 'vitest'
import {
  TTRPGBattlemap,
  TTRPGWall,
  TTRPGToken,
  FoundrySceneData,
  FoundryWallData,
  FoundryTokenData
} from '@shared/types'
import {
  exportBattlemapToFoundryScene,
  importFoundrySceneToBattlemap,
  percentToScenePixel,
  scenePixelToPercent
} from './helpers/foundryBridgeHelper'

describe('Foundry VTT Scene Bridge Empirical Stress & Adversarial Suite', () => {
  // Helper to construct a standard baseline battlemap
  const createBaseBattlemap = (overrides: Partial<TTRPGBattlemap> = {}): TTRPGBattlemap => ({
    id: 'bm-stress-001',
    campaignId: 'camp-stress',
    name: 'Citadel of the Frost Wyrm',
    imageUrl: 'maps/citadel_highres.webp',
    gridType: 'square',
    gridSize: 64,
    gridOpacity: 0.35,
    gridUnitFeet: 5,
    showCoordinates: false,
    snapToGrid: true,
    tokens: [],
    walls: [],
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    ...overrides
  })

  // =========================================================================
  // FOCUS 1: BOUNDARY COORDINATE TRANSFORMATION & NON-STANDARD GEOMETRIES
  // =========================================================================

  describe('Focus 1: Boundary Coordinate Transformation & Non-Standard Geometries', () => {
    it('1.1: transforms sub-pixel float coordinates with high precision (<= 0.05% error)', () => {
      const width = 1920
      const height = 1080
      const padding = 0.25

      const subPixelPercents = [
        0.001,
        0.05,
        12.34567,
        33.33333,
        50.12345,
        66.66667,
        87.65432,
        99.999
      ]

      for (const pct of subPixelPercents) {
        const pixelX = percentToScenePixel(pct, width, padding)
        const roundtripX = scenePixelToPercent(pixelX, width, padding)

        // The maximum discretization error on a 1920px canvas with 2 decimal places rounding is <= 0.05%
        expect(Math.abs(roundtripX - pct)).toBeLessThanOrEqual(0.05)

        const pixelY = percentToScenePixel(pct, height, padding)
        const roundtripY = scenePixelToPercent(pixelY, height, padding)
        expect(Math.abs(roundtripY - pct)).toBeLessThanOrEqual(0.05)
      }
    })

    it('1.2: transforms coordinates on ultra-wide aspect ratios (4000x1000 and 8000x1000)', () => {
      const ultraWideDimensions = [
        { width: 4000, height: 1000 },
        { width: 8000, height: 1000 }
      ]

      for (const dims of ultraWideDimensions) {
        const p = 0.25
        // Test key points: left edge, quarter, center, three-quarters, right edge
        const testPoints = [0, 25, 50, 75, 100]

        for (const pt of testPoints) {
          const pixelX = percentToScenePixel(pt, dims.width, p)
          const pixelY = percentToScenePixel(pt, dims.height, p)

          // Offsets must match: baseOffset = p * dimension
          expect(pixelX).toBe(Math.round(dims.width * p + (pt / 100) * dims.width))
          expect(pixelY).toBe(Math.round(dims.height * p + (pt / 100) * dims.height))

          const restoredX = scenePixelToPercent(pixelX, dims.width, p)
          const restoredY = scenePixelToPercent(pixelY, dims.height, p)

          expect(restoredX).toBeCloseTo(pt, 1)
          expect(restoredY).toBeCloseTo(pt, 1)
        }
      }
    })

    it('1.3: transforms coordinates on vertical banner aspect ratios (1000x4000 and 600x4800)', () => {
      const bannerDimensions = [
        { width: 1000, height: 4000 },
        { width: 600, height: 4800 }
      ]

      for (const dims of bannerDimensions) {
        const p = 0.25
        const wall: TTRPGWall = {
          id: 'w-banner-spine',
          battlemapId: 'bm-banner',
          p1: { x: 50, y: 0 },
          p2: { x: 50, y: 100 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true
        }

        const scene = exportBattlemapToFoundryScene(
          createBaseBattlemap({ id: 'bm-banner' }),
          'Campaign',
          [wall],
          dims,
          p
        )

        expect(scene.width).toBe(dims.width)
        expect(scene.height).toBe(dims.height)
        expect(scene.walls).toHaveLength(1)

        const [x1, y1, x2, y2] = scene.walls[0].c
        expect(x1).toBe(percentToScenePixel(50, dims.width, p))
        expect(y1).toBe(percentToScenePixel(0, dims.height, p))
        expect(x2).toBe(percentToScenePixel(50, dims.width, p))
        expect(y2).toBe(percentToScenePixel(100, dims.height, p))

        const { walls: importedWalls } = importFoundrySceneToBattlemap(scene)
        expect(importedWalls[0].p1.x).toBeCloseTo(50, 1)
        expect(importedWalls[0].p1.y).toBeCloseTo(0, 1)
        expect(importedWalls[0].p2.x).toBeCloseTo(50, 1)
        expect(importedWalls[0].p2.y).toBeCloseTo(100, 1)
      }
    })

    it('1.4: maintains exact coordinate arithmetic across extreme padding factors (P = 0.0, 0.5, 1.0)', () => {
      const dim = 2000

      // Case A: P = 0.0 (zero padding, canvas fits image exactly)
      expect(percentToScenePixel(0, dim, 0.0)).toBe(0)
      expect(percentToScenePixel(50, dim, 0.0)).toBe(1000)
      expect(percentToScenePixel(100, dim, 0.0)).toBe(2000)

      expect(scenePixelToPercent(0, dim, 0.0)).toBe(0)
      expect(scenePixelToPercent(1000, dim, 0.0)).toBe(50)
      expect(scenePixelToPercent(2000, dim, 0.0)).toBe(100)

      // Case B: P = 0.5 (canvas padding is half image width on each side)
      // baseOffset = 0.5 * 2000 = 1000
      expect(percentToScenePixel(0, dim, 0.5)).toBe(1000)
      expect(percentToScenePixel(50, dim, 0.5)).toBe(2000)
      expect(percentToScenePixel(100, dim, 0.5)).toBe(3000)

      expect(scenePixelToPercent(1000, dim, 0.5)).toBe(0)
      expect(scenePixelToPercent(2000, dim, 0.5)).toBe(50)
      expect(scenePixelToPercent(3000, dim, 0.5)).toBe(100)

      // Case C: P = 1.0 (canvas padding is equal to full image width on each side)
      // baseOffset = 1.0 * 2000 = 2000
      expect(percentToScenePixel(0, dim, 1.0)).toBe(2000)
      expect(percentToScenePixel(50, dim, 1.0)).toBe(3000)
      expect(percentToScenePixel(100, dim, 1.0)).toBe(4000)

      expect(scenePixelToPercent(2000, dim, 1.0)).toBe(0)
      expect(scenePixelToPercent(3000, dim, 1.0)).toBe(50)
      expect(scenePixelToPercent(4000, dim, 1.0)).toBe(100)
    })

    it('1.5: handles out-of-bounds coordinates (<0%, >100%) during export and clamps safely on import', () => {
      const dim = 1000
      const p = 0.25 // baseOffset = 250px

      // Negative percent (-20%) sits inside canvas padding at 250 - 200 = 50px
      const negPixel = percentToScenePixel(-20, dim, p)
      expect(negPixel).toBe(50)

      // Greater than 100% (120%) sits inside right canvas padding at 250 + 1200 = 1450px
      const overPixel = percentToScenePixel(120, dim, p)
      expect(overPixel).toBe(1450)

      // When imported, scenePixelToPercent computes the raw percent:
      expect(scenePixelToPercent(negPixel, dim, p)).toBe(-20)
      expect(scenePixelToPercent(overPixel, dim, p)).toBe(120)

      // Full import of scene safely clamps walls and tokens to [0, 100]
      const sceneData: FoundrySceneData = {
        _id: 'sc-oob-clamp',
        name: 'OOB Scene',
        active: false,
        navigation: true,
        img: 'bg.png',
        width: dim,
        height: dim,
        padding: p,
        backgroundColor: '#000',
        grid: { type: 1, size: 50, distance: 5, units: 'ft' },
        walls: [
          {
            _id: 'w-oob',
            c: [negPixel, negPixel, overPixel, overPixel],
            move: 20,
            sense: 20,
            door: 0,
            ds: 0
          }
        ],
        tokens: [
          {
            _id: 't-oob-neg',
            name: 'Out of Bounds Negative',
            x: negPixel - 25,
            y: negPixel - 25,
            width: 1,
            height: 1,
            disposition: 0
          },
          {
            _id: 't-oob-pos',
            name: 'Out of Bounds Positive',
            x: overPixel - 25,
            y: overPixel - 25,
            width: 1,
            height: 1,
            disposition: 0
          }
        ]
      }

      const { battlemap, walls } = importFoundrySceneToBattlemap(sceneData)
      expect(walls[0].p1.x).toBe(0)
      expect(walls[0].p1.y).toBe(0)
      expect(walls[0].p2.x).toBe(100)
      expect(walls[0].p2.y).toBe(100)

      expect(battlemap.tokens[0].x).toBe(0)
      expect(battlemap.tokens[0].y).toBe(0)
      expect(battlemap.tokens[1].x).toBe(100)
      expect(battlemap.tokens[1].y).toBe(100)
    })
  })

  // =========================================================================
  // FOCUS 2: LARGE WALL COUNTS, PERFORMANCE BENCHMARK & VERTEX DRIFT INVARIANTS
  // =========================================================================

  describe('Focus 2: Large Wall Counts, Performance Benchmark & Vertex Drift Invariants', () => {
    it('2.1: benchmarks 1,200 walls export and import execution time (< 50ms)', () => {
      const WALL_COUNT = 1200
      const walls: TTRPGWall[] = []

      // Generate a grid of connected room walls
      const rows = 30
      const cols = 40
      let idCounter = 1

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x1 = (c / cols) * 90 + 5
          const y1 = (r / rows) * 90 + 5
          const x2 = ((c + 1) / cols) * 90 + 5
          const y2 = y1

          walls.push({
            id: `w-perf-${idCounter++}`,
            battlemapId: 'bm-perf',
            p1: { x: Math.round(x1 * 100) / 100, y: Math.round(y1 * 100) / 100 },
            p2: { x: Math.round(x2 * 100) / 100, y: Math.round(y2 * 100) / 100 },
            wallType: 'wall',
            blocksMovement: true,
            blocksVision: true,
            isDoor: r % 5 === 0 && c % 3 === 0,
            doorType: 'regular',
            doorState: 'closed'
          })
        }
      }

      expect(walls.length).toBe(WALL_COUNT)
      const battlemap = createBaseBattlemap({ id: 'bm-perf', walls })

      // Benchmark Export
      const t0 = performance.now()
      const scene = exportBattlemapToFoundryScene(battlemap, 'Perf Campaign', walls)
      const exportDuration = performance.now() - t0

      // Benchmark Import
      const t1 = performance.now()
      const imported = importFoundrySceneToBattlemap(scene, 'camp-perf')
      const importDuration = performance.now() - t1

      console.log(
        `[Foundry Bridge 1,200 Walls Benchmark] Export: ${exportDuration.toFixed(2)}ms | Import: ${importDuration.toFixed(2)}ms | Total: ${(exportDuration + importDuration).toFixed(2)}ms`
      )

      expect(exportDuration).toBeLessThan(50)
      expect(importDuration).toBeLessThan(50)
      expect(scene.walls.length).toBe(WALL_COUNT)
      expect(imported.walls.length).toBe(WALL_COUNT)
    })

    it('2.2: stresses 2,500 walls with zero memory degradation or stack overflow', () => {
      const LARGE_WALL_COUNT = 2500
      const walls: TTRPGWall[] = []

      for (let i = 0; i < LARGE_WALL_COUNT; i++) {
        const x1 = (i % 50) * 1.8 + 5
        const y1 = Math.floor(i / 50) * 1.8 + 5
        walls.push({
          id: `w-stress-${i}`,
          battlemapId: 'bm-stress-large',
          p1: { x: x1, y: y1 },
          p2: { x: x1 + 1.2, y: y1 + 1.2 },
          wallType: i % 4 === 0 ? 'window' : 'wall',
          blocksMovement: true,
          blocksVision: i % 4 !== 0
        })
      }

      const battlemap = createBaseBattlemap({ id: 'bm-stress-large', walls })
      const scene = exportBattlemapToFoundryScene(battlemap, 'Stress Campaign', walls)
      expect(scene.walls).toHaveLength(LARGE_WALL_COUNT)

      const { walls: importedWalls } = importFoundrySceneToBattlemap(scene)
      expect(importedWalls).toHaveLength(LARGE_WALL_COUNT)
    })

    it('2.3: verifies zero vertex drift on chained polyline walls (p2 strictly equals p1 of adjacent wall)', () => {
      const CHAIN_LENGTH = 1000
      const chainedWalls: TTRPGWall[] = []
      const dims = { width: 2000, height: 2000 }
      const padding = 0.25

      // Construct a continuous polyline: A -> B -> C -> D ...
      // With dimension 2000, delta = 0.08% corresponds to 1.6px > 1px, ensuring no segment collapses to zero length
      let currentX = 5.0
      let currentY = 5.0

      for (let i = 0; i < CHAIN_LENGTH; i++) {
        // Continuous walk: increment X and alternate Y slightly
        const nextX = Math.round((currentX + 0.08) * 100) / 100
        const nextY = Math.round((currentY + (i % 2 === 0 ? 0.08 : 0.06)) * 100) / 100

        chainedWalls.push({
          id: `chain-w-${i}`,
          battlemapId: 'bm-chain',
          p1: { x: currentX, y: currentY },
          p2: { x: nextX, y: nextY },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true
        })

        currentX = nextX
        currentY = nextY
      }

      const battlemap = createBaseBattlemap({ id: 'bm-chain', walls: chainedWalls })
      const scene = exportBattlemapToFoundryScene(battlemap, 'Campaign', chainedWalls, dims, padding)
      const { walls: importedWalls } = importFoundrySceneToBattlemap(scene)

      expect(importedWalls).toHaveLength(CHAIN_LENGTH)

      // Invariant: In the exported Foundry scene, wall[i].c[2,3] must match wall[i+1].c[0,1]
      for (let i = 0; i < CHAIN_LENGTH - 1; i++) {
        const currentEndSceneX = scene.walls[i].c[2]
        const currentEndSceneY = scene.walls[i].c[3]
        const nextStartSceneX = scene.walls[i + 1].c[0]
        const nextStartSceneY = scene.walls[i + 1].c[1]

        expect(nextStartSceneX).toBe(currentEndSceneX)
        expect(nextStartSceneY).toBe(currentEndSceneY)

        // In the re-imported walls, the vertices must also be strictly identical (zero vertex drift)
        const currentEndImported = importedWalls[i].p2
        const nextStartImported = importedWalls[i + 1].p1

        expect(nextStartImported.x).toBe(currentEndImported.x)
        expect(nextStartImported.y).toBe(currentEndImported.y)
      }
    })

    it('2.4: discards micro-segment zero-length walls after pixel snapping without dropping valid walls', () => {
      const width = 1000
      const height = 1000
      const padding = 0.25

      const walls: TTRPGWall[] = [
        // Sub-pixel difference that snaps to the exact same pixel (250 + 100.01 = 350.01 -> 350)
        {
          id: 'w-subpixel-degenerate',
          battlemapId: 'bm-micro',
          p1: { x: 10.001, y: 10.001 },
          p2: { x: 10.002, y: 10.002 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true
        },
        // Legitimate small wall (10% to 10.5% = 5 pixels long on 1000px image)
        {
          id: 'w-valid-small',
          battlemapId: 'bm-micro',
          p1: { x: 10.0, y: 10.0 },
          p2: { x: 10.5, y: 10.0 },
          wallType: 'wall',
          blocksMovement: true,
          blocksVision: true
        }
      ]

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-micro' }),
        'Campaign',
        walls,
        { width, height },
        padding
      )

      // The degenerate wall must be discarded to prevent Foundry raycasting crashes
      expect(scene.walls).toHaveLength(1)
      expect(scene.walls[0]._id).toBe('w-valid-small')
      // Valid small wall is exactly 5px long
      expect(scene.walls[0].c[2] - scene.walls[0].c[0]).toBe(5)
    })
  })

  // =========================================================================
  // FOCUS 3: COMPLEX WALL & DOOR CONFIGURATIONS
  // =========================================================================

  describe('Focus 3: Complex Wall & Door Configurations', () => {
    it('3.1: exports and imports secret locked doors (door: 2, ds: 2) with 100% state fidelity', () => {
      const secretLockedDoor: TTRPGWall = {
        id: 'w-secret-locked',
        battlemapId: 'bm-doors',
        p1: { x: 30, y: 40 },
        p2: { x: 35, y: 40 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: true,
        doorType: 'secret',
        doorState: 'locked'
      }

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-doors' }),
        'Doors',
        [secretLockedDoor]
      )

      expect(scene.walls[0].door).toBe(2) // 2 = secret
      expect(scene.walls[0].ds).toBe(2)   // 2 = locked
      expect(scene.walls[0].move).toBe(20)
      expect(scene.walls[0].sense).toBe(20)

      const { walls: imported } = importFoundrySceneToBattlemap(scene)
      expect(imported[0].isDoor).toBe(true)
      expect(imported[0].doorType).toBe('secret')
      expect(imported[0].doorState).toBe('locked')
    })

    it('3.2: exports and imports secret open doors (door: 2, ds: 1)', () => {
      const secretOpenDoor: TTRPGWall = {
        id: 'w-secret-open',
        battlemapId: 'bm-doors',
        p1: { x: 30, y: 40 },
        p2: { x: 35, y: 40 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: true,
        doorType: 'secret',
        doorState: 'open'
      }

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-doors' }),
        'Doors',
        [secretOpenDoor]
      )

      expect(scene.walls[0].door).toBe(2)
      expect(scene.walls[0].ds).toBe(1) // 1 = open

      const { walls: imported } = importFoundrySceneToBattlemap(scene)
      expect(imported[0].isDoor).toBe(true)
      expect(imported[0].doorType).toBe('secret')
      expect(imported[0].doorState).toBe('open')
    })

    it('3.3: handles ethereal walls (vision blocking, movement permeable: move: 0, sense: 20)', () => {
      const etherealWall: TTRPGWall = {
        id: 'w-ethereal',
        battlemapId: 'bm-doors',
        p1: { x: 15, y: 15 },
        p2: { x: 25, y: 15 },
        wallType: 'ethereal',
        blocksMovement: false,
        blocksVision: true,
        blocksSound: false
      }

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-doors' }),
        'Campaign',
        [etherealWall]
      )

      expect(scene.walls[0].move).toBe(0)   // allows movement
      expect(scene.walls[0].sense).toBe(20) // blocks sight
      expect(scene.walls[0].door).toBe(0)

      const { walls: imported } = importFoundrySceneToBattlemap(scene)
      expect(imported[0].blocksMovement).toBe(false)
      expect(imported[0].blocksVision).toBe(true)
    })

    it('3.4: handles windows (movement blocking, vision permeable: move: 20, sense: 0)', () => {
      const windowWall: TTRPGWall = {
        id: 'w-window',
        battlemapId: 'bm-doors',
        p1: { x: 50, y: 10 },
        p2: { x: 60, y: 10 },
        wallType: 'window',
        blocksMovement: true,
        blocksVision: false,
        blocksSound: true
      }

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-doors' }),
        'Campaign',
        [windowWall]
      )

      expect(scene.walls[0].move).toBe(20)
      expect(scene.walls[0].sense).toBe(0)
      expect(scene.walls[0].sound).toBe(20)

      const { walls: imported } = importFoundrySceneToBattlemap(scene)
      expect(imported[0].wallType).toBe('window')
      expect(imported[0].blocksMovement).toBe(true)
      expect(imported[0].blocksVision).toBe(false)
      expect(imported[0].blocksSound).toBe(true)
    })

    it('3.5: imports terrain / limited-vision walls (sense: 10) from raw Foundry scenes', () => {
      const rawFoundryScene: FoundrySceneData = {
        _id: 'sc-terrain',
        name: 'Mountain Pass',
        active: false,
        navigation: true,
        img: 'pass.png',
        width: 1000,
        height: 1000,
        padding: 0.25,
        backgroundColor: '#000',
        grid: { type: 1, size: 50, distance: 5, units: 'ft' },
        walls: [
          {
            _id: 'w-terrain-elevation',
            c: [300, 300, 600, 300],
            move: 20,
            sense: 10, // 10 = limited/terrain in Foundry VTT
            door: 0,
            ds: 0
          }
        ],
        tokens: []
      }

      const { walls: imported } = importFoundrySceneToBattlemap(rawFoundryScene)
      expect(imported).toHaveLength(1)
      expect(imported[0].blocksMovement).toBe(true)
      // sense: 10 > 0, so vision is obstructed
      expect(imported[0].blocksVision).toBe(true)
      expect(imported[0].isDoor).toBe(false)
      expect(imported[0].doorType).toBeUndefined()
    })

    it('3.6: ignores stale doorType/doorState if isDoor is false during export', () => {
      const nonDoorWithStaleProps: TTRPGWall = {
        id: 'w-stale-door',
        battlemapId: 'bm-doors',
        p1: { x: 10, y: 10 },
        p2: { x: 20, y: 10 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: false,
        doorType: 'secret',
        doorState: 'locked'
      }

      const scene = exportBattlemapToFoundryScene(
        createBaseBattlemap({ id: 'bm-doors' }),
        'Campaign',
        [nonDoorWithStaleProps]
      )

      expect(scene.walls[0].door).toBe(0)
      expect(scene.walls[0].ds).toBe(0)

      const { walls: imported } = importFoundrySceneToBattlemap(scene)
      expect(imported[0].isDoor).toBe(false)
      expect(imported[0].doorType).toBeUndefined()
      expect(imported[0].doorState).toBeUndefined()
    })
  })

  // =========================================================================
  // FOCUS 4: TOKEN SCALING, BOUNDARY POSITIONING & ATTRIBUTE ROBUSTNESS
  // =========================================================================

  describe('Focus 4: Token Scaling, Boundary Positioning & Attribute Robustness', () => {
    it('4.1: maps Tiny token (size: 0.5) top-left offset and reconstructs center losslessly', () => {
      const width = 1920
      const height = 1080
      const padding = 0.25
      const gridSize = 64

      // Center = (50%, 50%) -> Scene Pixel = (1440, 810)
      // Size = 0.5 -> tokenPixelWidth = 0.5 * 64 = 32px
      // Top-left = (1440 - 16, 810 - 16) = (1424, 794)
      const tinyToken: TTRPGToken = {
        id: 'tok-fairy',
        campaignId: 'camp-1',
        battlemapId: 'bm-tokens',
        name: 'Pixie Familiar',
        x: 50,
        y: 50,
        size: 0.5,
        hpCurrent: 1,
        hpMax: 1,
        isEnemy: false
      }

      const battlemap = createBaseBattlemap({ id: 'bm-tokens', tokens: [tinyToken], gridSize })
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', [], { width, height }, padding)

      expect(scene.tokens[0].width).toBe(0.5)
      expect(scene.tokens[0].height).toBe(0.5)
      expect(scene.tokens[0].x).toBe(1424)
      expect(scene.tokens[0].y).toBe(794)

      const { battlemap: importedMap } = importFoundrySceneToBattlemap(scene)
      const importedToken = importedMap.tokens[0]

      expect(importedToken.size).toBe(0.5)
      expect(importedToken.x).toBeCloseTo(50, 1)
      expect(importedToken.y).toBeCloseTo(50, 1)
      expect(importedToken.hpCurrent).toBe(1)
      expect(importedToken.hpMax).toBe(1)
    })

    it('4.2: scales tokens correctly across D&D size steps (1, 2, 3, 4)', () => {
      const sizes = [1, 2, 3, 4]
      const width = 2000
      const height = 2000
      const padding = 0.25
      const gridSize = 100

      // Center = (50%, 50%) -> baseOffset = 500, Center Scene = 500 + 1000 = 1500
      const tokens: TTRPGToken[] = sizes.map(sz => ({
        id: `tok-sz-${sz}`,
        campaignId: 'c1',
        battlemapId: 'bm-tokens',
        name: `Creature Size ${sz}`,
        x: 50,
        y: 50,
        size: sz
      }))

      const battlemap = createBaseBattlemap({ id: 'bm-tokens', tokens, gridSize })
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', [], { width, height }, padding)

      sizes.forEach((sz, idx) => {
        const ft = scene.tokens[idx]
        const pixelWidth = sz * gridSize
        const expectedTopLeft = 1500 - pixelWidth / 2

        expect(ft.width).toBe(sz)
        expect(ft.height).toBe(sz)
        expect(ft.x).toBe(expectedTopLeft)
        expect(ft.y).toBe(expectedTopLeft)
      })

      const { battlemap: importedMap } = importFoundrySceneToBattlemap(scene)
      sizes.forEach((sz, idx) => {
        const it = importedMap.tokens[idx]
        expect(it.size).toBe(sz)
        expect(it.x).toBeCloseTo(50, 1)
        expect(it.y).toBeCloseTo(50, 1)
      })
    })

    it('4.3: places tokens precisely on boundary edges and corners ((0,0), (100,0), (0,100), (100,100))', () => {
      const width = 1000
      const height = 1000
      const padding = 0.25
      const gridSize = 50

      const boundaryTokens: TTRPGToken[] = [
        { id: 't-tl', campaignId: 'c', battlemapId: 'bm', name: 'Top-Left', x: 0, y: 0, size: 1 },
        { id: 't-tr', campaignId: 'c', battlemapId: 'bm', name: 'Top-Right', x: 100, y: 0, size: 1 },
        { id: 't-bl', campaignId: 'c', battlemapId: 'bm', name: 'Bottom-Left', x: 0, y: 100, size: 1 },
        { id: 't-br', campaignId: 'c', battlemapId: 'bm', name: 'Bottom-Right', x: 100, y: 100, size: 1 }
      ]

      const battlemap = createBaseBattlemap({ id: 'bm', tokens: boundaryTokens, gridSize })
      const scene = exportBattlemapToFoundryScene(battlemap, 'Camp', [], { width, height }, padding)

      // Top-Left Center = (250, 250) -> Top-Left = (225, 225)
      expect(scene.tokens[0].x).toBe(225)
      expect(scene.tokens[0].y).toBe(225)

      // Bottom-Right Center = (1250, 1250) -> Top-Left = (1225, 1225)
      expect(scene.tokens[3].x).toBe(1225)
      expect(scene.tokens[3].y).toBe(1225)

      const { battlemap: importedMap } = importFoundrySceneToBattlemap(scene)
      expect(importedMap.tokens[0].x).toBe(0)
      expect(importedMap.tokens[0].y).toBe(0)
      expect(importedMap.tokens[1].x).toBe(100)
      expect(importedMap.tokens[1].y).toBe(0)
      expect(importedMap.tokens[2].x).toBe(0)
      expect(importedMap.tokens[2].y).toBe(100)
      expect(importedMap.tokens[3].x).toBe(100)
      expect(importedMap.tokens[3].y).toBe(100)
    })

    it('4.4: preserves negative, zero, and extreme HP values without defaulting to 10', () => {
      const tokens: TTRPGToken[] = [
        // Negative HP (e.g. massive damage / death save state)
        { id: 't-neg-hp', campaignId: 'c', battlemapId: 'bm', name: 'Dying Fighter', x: 20, y: 20, size: 1, hpCurrent: -14, hpMax: 50 },
        // Zero HP
        { id: 't-zero-hp', campaignId: 'c', battlemapId: 'bm', name: 'Unconscious Cleric', x: 25, y: 25, size: 1, hpCurrent: 0, hpMax: 30 },
        // High Boss HP
        { id: 't-boss-hp', campaignId: 'c', battlemapId: 'bm', name: 'Ancient Dragon', x: 50, y: 50, size: 4, hpCurrent: 546, hpMax: 546 }
      ]

      const scene = exportBattlemapToFoundryScene(createBaseBattlemap({ tokens }))

      expect(scene.tokens[0].bar1?.value).toBe(-14)
      expect(scene.tokens[0].bar1?.max).toBe(50)

      expect(scene.tokens[1].bar1?.value).toBe(0)
      expect(scene.tokens[1].bar1?.max).toBe(30)

      expect(scene.tokens[2].bar1?.value).toBe(546)
      expect(scene.tokens[2].bar1?.max).toBe(546)

      const { battlemap: importedMap } = importFoundrySceneToBattlemap(scene)
      expect(importedMap.tokens[0].hpCurrent).toBe(-14)
      expect(importedMap.tokens[1].hpCurrent).toBe(0)
      expect(importedMap.tokens[2].hpCurrent).toBe(546)
    })

    it('4.5: gracefully imports tokens with missing attributes, bar1, and textures', () => {
      const barebonesScene: FoundrySceneData = {
        _id: 'sc-barebones',
        name: 'Barebones Scene',
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
          {
            _id: 't-sparse-1',
            name: 'Mystery Entity',
            x: 250,
            y: 250,
            width: 1,
            height: 1,
            disposition: 0
            // No actorId, bar1, or texture
          }
        ]
      }

      const { battlemap } = importFoundrySceneToBattlemap(barebonesScene)
      expect(battlemap.tokens).toHaveLength(1)
      const t = battlemap.tokens[0]

      expect(t.name).toBe('Mystery Entity')
      expect(t.characterId).toBeUndefined()
      expect(t.avatarUrl).toBeUndefined()
      expect(t.hpCurrent).toBeUndefined()
      expect(t.hpMax).toBeUndefined()
      expect(t.isEnemy).toBeUndefined() // neutral disposition
    })

    it('4.6: maps three-state disposition (friendly 1, hostile -1, neutral 0)', () => {
      const tokens: TTRPGToken[] = [
        { id: 't-friendly', campaignId: 'c', battlemapId: 'bm', name: 'Paladin', x: 10, y: 10, size: 1, isEnemy: false },
        { id: 't-hostile', campaignId: 'c', battlemapId: 'bm', name: 'Orc Warlord', x: 20, y: 20, size: 1, isEnemy: true },
        { id: 't-neutral', campaignId: 'c', battlemapId: 'bm', name: 'Wandering Merchant', x: 30, y: 30, size: 1, isEnemy: undefined }
      ]

      const scene = exportBattlemapToFoundryScene(createBaseBattlemap({ tokens }))

      expect(scene.tokens[0].disposition).toBe(1)
      expect(scene.tokens[1].disposition).toBe(-1)
      expect(scene.tokens[2].disposition).toBe(0)

      const { battlemap } = importFoundrySceneToBattlemap(scene)
      expect(battlemap.tokens[0].isEnemy).toBe(false)
      expect(battlemap.tokens[1].isEnemy).toBe(true)
      expect(battlemap.tokens[2].isEnemy).toBeUndefined()
    })
  })

  // =========================================================================
  // FOCUS 5: HIGH-VOLUME FULL BATTLEMAP ROUNDTRIP INVARIANT
  // =========================================================================

  describe('Focus 5: High-Volume Full Battlemap Roundtrip Invariant', () => {
    it('5.1: executes high-volume square grid roundtrip (150 walls + 50 tokens) preserving all properties', () => {
      // 1. Generate 50 varied tokens
      const tokens: TTRPGToken[] = []
      const dispositions = [false, true, undefined]
      const sizes = [0.5, 1, 2, 3, 4]

      for (let i = 0; i < 50; i++) {
        const sz = sizes[i % sizes.length]
        const isEnemy = dispositions[i % dispositions.length]
        tokens.push({
          id: `token-hv-${i}`,
          campaignId: 'camp-hv',
          battlemapId: 'bm-hv-square',
          name: `Squad Unit #${i + 1}`,
          characterId: i % 2 === 0 ? `char-${i}` : undefined,
          avatarUrl: `assets/tokens/unit_${i}.png`,
          x: Math.round(((i % 10) * 9 + 5) * 100) / 100,
          y: Math.round((Math.floor(i / 10) * 18 + 5) * 100) / 100,
          size: sz,
          isEnemy,
          hpCurrent: (i * 7) % 60 - 5, // includes negative, zero, and positive HPs
          hpMax: ((i * 7) % 60) + 20
        })
      }

      // 2. Generate 150 varied walls
      const walls: TTRPGWall[] = []
      for (let i = 0; i < 150; i++) {
        const isDoor = i % 4 === 0
        const doorType = i % 8 === 0 ? 'secret' : 'regular'
        const doorStates: ('closed' | 'open' | 'locked')[] = ['closed', 'open', 'locked']
        const doorState = isDoor ? doorStates[i % 3] : undefined

        const isWindow = i % 5 === 0 && !isDoor
        const wallType = isWindow ? 'window' : 'wall'

        const x1 = Math.round(((i % 15) * 6 + 2) * 100) / 100
        const y1 = Math.round((Math.floor(i / 15) * 9 + 2) * 100) / 100

        walls.push({
          id: `wall-hv-${i}`,
          battlemapId: 'bm-hv-square',
          p1: { x: x1, y: y1 },
          p2: { x: x1 + 4.5, y: y1 + (i % 2 === 0 ? 0 : 3.5) },
          wallType,
          blocksMovement: !isWindow || true,
          blocksVision: !isWindow,
          blocksSound: i % 3 === 0,
          isDoor,
          doorType: isDoor ? doorType : undefined,
          doorState: isDoor ? doorState : undefined
        })
      }

      const originalBattlemap = createBaseBattlemap({
        id: 'bm-hv-square',
        campaignId: 'camp-hv',
        name: 'The Obsidian Stronghold',
        imageUrl: 'maps/stronghold.webp',
        gridType: 'square',
        gridSize: 70,
        gridOpacity: 0.4,
        gridUnitFeet: 5,
        tokens,
        walls
      })

      // Roundtrip
      const scene = exportBattlemapToFoundryScene(
        originalBattlemap,
        'Obsidian Campaign',
        walls,
        { width: 3840, height: 2160 },
        0.25
      )

      const { battlemap: restoredMap, walls: restoredWalls } = importFoundrySceneToBattlemap(
        scene,
        'camp-hv'
      )

      // Battlemap Core Metadata Invariants
      expect(restoredMap.id).toBe(originalBattlemap.id)
      expect(restoredMap.name).toBe(originalBattlemap.name)
      expect(restoredMap.imageUrl).toBe(originalBattlemap.imageUrl)
      expect(restoredMap.gridType).toBe('square')
      expect(restoredMap.gridSize).toBe(70)
      expect(restoredMap.gridOpacity).toBe(0.4)
      expect(restoredMap.gridUnitFeet).toBe(5)

      // Token Invariants
      expect(restoredMap.tokens).toHaveLength(50)
      for (let i = 0; i < 50; i++) {
        const orig = tokens[i]
        const rest = restoredMap.tokens[i]

        expect(rest.id).toBe(orig.id)
        expect(rest.name).toBe(orig.name)
        expect(rest.size).toBe(orig.size)
        expect(rest.isEnemy).toBe(orig.isEnemy)
        expect(rest.characterId).toBe(orig.characterId)
        expect(rest.avatarUrl).toBe(orig.avatarUrl)
        expect(rest.hpCurrent).toBe(orig.hpCurrent)
        expect(rest.hpMax).toBe(orig.hpMax)

        // Coordinates within discretization limit (<= 0.05%)
        expect(rest.x).toBeCloseTo(orig.x, 1)
        expect(rest.y).toBeCloseTo(orig.y, 1)
      }

      // Wall Invariants
      expect(restoredWalls).toHaveLength(150)
      for (let i = 0; i < 150; i++) {
        const orig = walls[i]
        const rest = restoredWalls[i]

        expect(rest.id).toBe(orig.id)
        expect(rest.isDoor).toBe(orig.isDoor)
        expect(rest.doorType).toBe(orig.doorType)
        expect(rest.doorState).toBe(orig.doorState)
        expect(rest.blocksMovement).toBe(orig.blocksMovement)
        expect(rest.blocksVision).toBe(orig.blocksVision)
        expect(rest.blocksSound).toBe(orig.blocksSound)

        expect(rest.p1.x).toBeCloseTo(orig.p1.x, 1)
        expect(rest.p1.y).toBeCloseTo(orig.p1.y, 1)
        expect(rest.p2.x).toBeCloseTo(orig.p2.x, 1)
        expect(rest.p2.y).toBeCloseTo(orig.p2.y, 1)
      }
    })

    it('5.2: preserves hexagonal grid configuration (type: hex -> grid.type: 2 -> type: hex)', () => {
      const hexBattlemap = createBaseBattlemap({
        id: 'bm-hex',
        gridType: 'hex',
        gridSize: 48,
        gridUnitFeet: 10
      })

      const scene = exportBattlemapToFoundryScene(hexBattlemap)
      expect(scene.grid.type).toBe(2) // 2 = hex in Foundry VTT
      expect(scene.grid.size).toBe(48)
      expect(scene.grid.distance).toBe(10)

      const { battlemap } = importFoundrySceneToBattlemap(scene)
      expect(battlemap.gridType).toBe('hex')
      expect(battlemap.gridSize).toBe(48)
      expect(battlemap.gridUnitFeet).toBe(10)
    })

    it('5.3: demonstrates export-import idempotence over successive cycles (f(f(x)) == f(x))', () => {
      const initialToken: TTRPGToken = {
        id: 'tok-idempotent',
        campaignId: 'c1',
        battlemapId: 'bm-idem',
        name: 'Idempotent Token',
        x: 42.5,
        y: 67.25,
        size: 2,
        hpCurrent: 88,
        hpMax: 100,
        isEnemy: true
      }

      const initialWall: TTRPGWall = {
        id: 'wall-idempotent',
        battlemapId: 'bm-idem',
        p1: { x: 12.5, y: 24.0 },
        p2: { x: 34.5, y: 78.0 },
        wallType: 'wall',
        blocksMovement: true,
        blocksVision: true,
        isDoor: true,
        doorType: 'secret',
        doorState: 'locked'
      }

      const battlemap = createBaseBattlemap({
        id: 'bm-idem',
        tokens: [initialToken],
        walls: [initialWall]
      })

      // Cycle 1: export -> import
      const scene1 = exportBattlemapToFoundryScene(battlemap, 'Camp', [initialWall])
      const { battlemap: map1, walls: walls1 } = importFoundrySceneToBattlemap(scene1, 'c1')

      // Cycle 2: export -> import
      const scene2 = exportBattlemapToFoundryScene(map1, 'Camp', walls1)
      const { battlemap: map2, walls: walls2 } = importFoundrySceneToBattlemap(scene2, 'c1')

      // Cycle 3: export -> import
      const scene3 = exportBattlemapToFoundryScene(map2, 'Camp', walls2)
      const { battlemap: map3, walls: walls3 } = importFoundrySceneToBattlemap(scene3, 'c1')

      // Strictly identical across Cycle 2 and Cycle 3
      expect(map3.tokens[0].x).toBe(map2.tokens[0].x)
      expect(map3.tokens[0].y).toBe(map2.tokens[0].y)
      expect(map3.tokens[0].hpCurrent).toBe(map2.tokens[0].hpCurrent)
      expect(map3.tokens[0].isEnemy).toBe(map2.tokens[0].isEnemy)

      expect(walls3[0].p1.x).toBe(walls2[0].p1.x)
      expect(walls3[0].p1.y).toBe(walls2[0].p1.y)
      expect(walls3[0].p2.x).toBe(walls2[0].p2.x)
      expect(walls3[0].p2.y).toBe(walls2[0].p2.y)
      expect(walls3[0].doorState).toBe(walls2[0].doorState)
      expect(walls3[0].doorType).toBe(walls2[0].doorType)
    })

    it('5.4: characterizes grid type mapping behavior across all Foundry grid types (0-5)', () => {
      // Foundry Grid Types: 0: Gridless, 1: Square, 2: Hex Rows Odd, 3: Hex Rows Even, 4: Hex Cols Odd, 5: Hex Cols Even
      const testTypes = [0, 1, 2, 3, 4, 5]
      const results: Record<number, string> = {}

      for (const t of testTypes) {
        const scene: FoundrySceneData = {
          _id: `scene-grid-${t}`,
          name: `Grid Type ${t}`,
          active: false,
          navigation: false,
          img: 'bg.png',
          width: 1000,
          height: 1000,
          padding: 0.25,
          backgroundColor: '#000',
          grid: { type: t, size: 50, distance: 5, units: 'ft' },
          walls: [],
          tokens: []
        }

        const { battlemap } = importFoundrySceneToBattlemap(scene)
        results[t] = battlemap.gridType
      }

      // Type 2 maps to 'hex'
      expect(results[2]).toBe('hex')
      // Type 1 maps to 'square'
      expect(results[1]).toBe('square')
      // Documenting current implementation behavior: types 0, 3, 4, 5 map to 'square'
      expect(results[0]).toBe('square')
      expect(results[3]).toBe('square')
      expect(results[4]).toBe('square')
      expect(results[5]).toBe('square')
    })
  })
})
