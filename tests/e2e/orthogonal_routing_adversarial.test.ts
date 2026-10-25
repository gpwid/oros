import { describe, it, expect } from 'vitest'
import {
  calculateObstacleAvoidanceRoute,
  simplifyCollinearPoints,
  lineIntersectsBox,
  getStubPoint,
  pointsToSmoothPath,
  Point,
  Box,
  HandleSpec
} from '../../src/renderer/components/canvas/orthogonalRouting'

/**
 * Validates that every segment in a route is strictly orthogonal (horizontal or vertical)
 */
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
        `Non-orthogonal segment found at index ${i}: (${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y}) [dx=${dx}, dy=${dy}]. ${contextMsg}`
      )
    }
  }
}

/**
 * Validates that no segment pierces through any obstacle in obstacles list
 */
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

/**
 * Validates no consecutive segments are collinear (simplification invariant)
 */
function assertNoRedundantCollinear(route: Point[]): void {
  for (let i = 1; i < route.length - 1; i++) {
    const prev = route[i - 1]
    const curr = route[i]
    const next = route[i + 1]
    const collinearX = Math.abs(prev.x - curr.x) < 0.001 && Math.abs(curr.x - next.x) < 0.001
    const collinearY = Math.abs(prev.y - curr.y) < 0.001 && Math.abs(curr.y - next.y) < 0.001
    expect(collinearX).toBe(false)
    expect(collinearY).toBe(false)
  }
}

describe('Smart Orthogonal Connector Routing — Empirical Adversarial Stress Suite', () => {
  // =========================================================================
  // FOCUS 1: ZERO OBSTACLES & DIRECT ORTHOGONAL ROUTES
  // =========================================================================
  describe('Focus 1: Zero Obstacles (Direct Orthogonal Routes)', () => {
    it('1.1: direct horizontal alignment with opposite handles (right -> left)', () => {
      const source: HandleSpec = { x: 100, y: 200, position: 'right' }
      const target: HandleSpec = { x: 400, y: 200, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '1.1')
      expect(route[0]).toEqual({ x: 100, y: 200 })
      expect(route[route.length - 1]).toEqual({ x: 400, y: 200 })
      // Straight collinear line simplifies to 2 points
      expect(route).toEqual([
        { x: 100, y: 200 },
        { x: 400, y: 200 }
      ])
    })

    it('1.2: direct vertical alignment with opposite handles (bottom -> top)', () => {
      const source: HandleSpec = { x: 250, y: 100, position: 'bottom' }
      const target: HandleSpec = { x: 250, y: 500, position: 'top' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '1.2')
      expect(route).toEqual([
        { x: 250, y: 100 },
        { x: 250, y: 500 }
      ])
    })

    it('1.3: diagonal displacement with orthogonal handles (right -> top)', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 300, y: 300, position: 'top' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '1.3')
      assertNoRedundantCollinear(route)
      expect(route.length).toBeLessThanOrEqual(4)
    })

    it('1.4: identical handle orientations (right -> right)', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 200, y: 250, position: 'right' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '1.4')
      assertNoRedundantCollinear(route)
    })

    it('1.5: coincident source and target coordinates (0-distance)', () => {
      const source: HandleSpec = { x: 300, y: 300, position: 'right' }
      const target: HandleSpec = { x: 300, y: 300, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '1.5')
      expect(route.length).toBeGreaterThanOrEqual(2)
      expect(route[0]).toEqual({ x: 300, y: 300 })
      expect(route[route.length - 1]).toEqual({ x: 300, y: 300 })
    })
  })

  // =========================================================================
  // FOCUS 2: 180-DEGREE LOOP AROUND (TARGET BEHIND SOURCE HANDLE)
  // =========================================================================
  describe('Focus 2: 180-Degree Loop Around (Target Behind Source Handle)', () => {
    it('2.1: 180-degree loop around obstacle: source node at (200, 150, 100, 100) with handle at (300, 200, right), target at (100, 200, left)', () => {
      const sourceNode: Box = { x: 200, y: 150, width: 100, height: 100 }
      const source: HandleSpec = { x: 300, y: 200, position: 'right' }
      const target: HandleSpec = { x: 100, y: 200, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [sourceNode], 15)
      assertStrictlyOrthogonal(route, '2.1')
      assertNoObstaclePierced(route, [sourceNode], 0)
      // Must loop around obstacle perimeter: starts at 300, extends to stub 324, routes up to 135, over to 76, down to 200, ends at 100
      expect(route).toEqual([
        { x: 300, y: 200 },
        { x: 324, y: 200 },
        { x: 324, y: 135 },
        { x: 76, y: 135 },
        { x: 76, y: 200 },
        { x: 100, y: 200 }
      ])
    })

    it('2.2: 180-degree vertical loop around obstacle: source node at (150, 200, 100, 100) with handle at (200, 300, bottom), target at (200, 100, top)', () => {
      const sourceNode: Box = { x: 150, y: 200, width: 100, height: 100 }
      const source: HandleSpec = { x: 200, y: 300, position: 'bottom' }
      const target: HandleSpec = { x: 200, y: 100, position: 'top' }

      const route = calculateObstacleAvoidanceRoute(source, target, [sourceNode], 15)
      assertStrictlyOrthogonal(route, '2.2')
      assertNoObstaclePierced(route, [sourceNode], 0)
      expect(route[0]).toEqual({ x: 200, y: 300 })
      expect(route[route.length - 1]).toEqual({ x: 200, y: 100 })
      // Verify path loops around in x
      const xs = route.map(p => p.x)
      const loopsAroundX = Math.min(...xs) < 150 || Math.max(...xs) > 250
      expect(loopsAroundX).toBe(true)
    })

    it('2.3: target behind handle with zero obstacles: empirical behavior produces direct line without loop', () => {
      const source: HandleSpec = { x: 300, y: 200, position: 'right' }
      const target: HandleSpec = { x: 100, y: 200, position: 'left' }

      // When zero obstacles are passed, yCoords contains only [200], so path collapses to direct segment
      const route = calculateObstacleAvoidanceRoute(source, target, [])
      assertStrictlyOrthogonal(route, '2.3')
      expect(route).toEqual([
        { x: 300, y: 200 },
        { x: 100, y: 200 }
      ])
    })

    it('2.4: 180-degree loop with obstacle perimeter between staggered nodes', () => {
      const intermediateNode: Box = { x: 200, y: 180, width: 80, height: 140 }
      const source: HandleSpec = { x: 300, y: 200, position: 'right' }
      const target: HandleSpec = { x: 100, y: 300, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [intermediateNode], 20)
      assertStrictlyOrthogonal(route, '2.4')
      assertNoObstaclePierced(route, [intermediateNode], 0)
    })
  })

  // =========================================================================
  // FOCUS 3: DENSE OBSTACLES & NARROW CORRIDORS
  // =========================================================================
  describe('Focus 3: Dense Obstacles and Narrow Corridors', () => {
    it('3.1: routes through a narrow 40px corridor between two wide obstacles', () => {
      const source: HandleSpec = { x: 50, y: 300, position: 'right' }
      const target: HandleSpec = { x: 650, y: 300, position: 'left' }

      // Top obstacle leaves gap from y=280 to y=320 (height of 40px)
      const obsTop: Box = { x: 250, y: 50, width: 200, height: 230 }      // y ends at 280
      const obsBottom: Box = { x: 250, y: 320, width: 200, height: 230 }  // y starts at 320

      const route = calculateObstacleAvoidanceRoute(source, target, [obsTop, obsBottom], 15)
      assertStrictlyOrthogonal(route, '3.1')
      assertNoObstaclePierced(route, [obsTop, obsBottom], 0)
    })

    it('3.2: routes through a dense 3x3 grid of obstacles (9 obstacles)', () => {
      const obstacles: Box[] = []
      // 3x3 grid of 80x80 obstacles separated by 60px corridors
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          obstacles.push({
            x: 150 + c * 140, // 80px box + 60px gap
            y: 150 + r * 140,
            width: 80,
            height: 80
          })
        }
      }
      expect(obstacles).toHaveLength(9)

      // Route diagonally across the grid
      const source: HandleSpec = { x: 50, y: 190, position: 'right' }
      const target: HandleSpec = { x: 650, y: 470, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 10)
      assertStrictlyOrthogonal(route, '3.2')
      assertNoObstaclePierced(route, obstacles, 0)
    })

    it('3.3: serpentine maze / labyrinth: forces multiple alternating turns around barriers', () => {
      const barriers: Box[] = [
        // Barrier 1 hanging down from top
        { x: 200, y: 0, width: 40, height: 350 },
        // Barrier 2 jutting up from bottom
        { x: 350, y: 150, width: 40, height: 350 },
        // Barrier 3 hanging down from top
        { x: 500, y: 0, width: 40, height: 350 }
      ]

      const source: HandleSpec = { x: 50, y: 250, position: 'right' }
      const target: HandleSpec = { x: 650, y: 250, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, barriers, 15)
      assertStrictlyOrthogonal(route, '3.3')
      assertNoObstaclePierced(route, barriers, 0)
    })
  })

  // =========================================================================
  // FOCUS 4: OBSTACLES OVERLAPPING WITH SOURCE OR TARGET HANDLES
  // =========================================================================
  describe('Focus 4: Obstacles Overlapping Source or Target Handles', () => {
    it('4.1: obstacle completely covers the source node handle', () => {
      const source: HandleSpec = { x: 200, y: 200, position: 'right' }
      const target: HandleSpec = { x: 600, y: 200, position: 'left' }

      // Obstacle directly covering source (150 to 250, 150 to 250)
      const engulfingSource: Box = { x: 150, y: 150, width: 100, height: 100 }

      const route = calculateObstacleAvoidanceRoute(source, target, [engulfingSource])
      // Router must not crash or return empty or non-orthogonal lines
      assertStrictlyOrthogonal(route, '4.1')
      expect(route[0]).toEqual({ x: 200, y: 200 })
      expect(route[route.length - 1]).toEqual({ x: 600, y: 200 })
      // No NaNs
      route.forEach(p => {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      })
    })

    it('4.2: obstacle completely covers the target handle', () => {
      const source: HandleSpec = { x: 100, y: 200, position: 'right' }
      const target: HandleSpec = { x: 500, y: 200, position: 'left' }

      const engulfingTarget: Box = { x: 450, y: 150, width: 100, height: 100 }

      const route = calculateObstacleAvoidanceRoute(source, target, [engulfingTarget])
      assertStrictlyOrthogonal(route, '4.2')
      expect(route[0]).toEqual({ x: 100, y: 200 })
      expect(route[route.length - 1]).toEqual({ x: 500, y: 200 })
    })

    it('4.3: massive obstacle engulfing both source and target (full blockage fallback)', () => {
      const source: HandleSpec = { x: 200, y: 200, position: 'right' }
      const target: HandleSpec = { x: 400, y: 200, position: 'left' }

      const giantWall: Box = { x: 100, y: 100, width: 500, height: 500 }

      const route = calculateObstacleAvoidanceRoute(source, target, [giantWall])
      // Fallback kicks in: must still be strictly orthogonal without NaN
      assertStrictlyOrthogonal(route, '4.3')
      expect(route[0]).toEqual({ x: 200, y: 200 })
      expect(route[route.length - 1]).toEqual({ x: 400, y: 200 })
      route.forEach(p => {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      })
    })
  })

  // =========================================================================
  // FOCUS 5: COLLINEAR POINT REDUCTION & EDGE CASES
  // =========================================================================
  describe('Focus 5: Collinear Point Reduction (simplifyCollinearPoints)', () => {
    it('5.1: reduces multi-point horizontal lines to endpoints', () => {
      const points: Point[] = [
        { x: 0, y: 50 },
        { x: 10, y: 50 },
        { x: 25, y: 50 },
        { x: 100, y: 50 }
      ]
      expect(simplifyCollinearPoints(points)).toEqual([
        { x: 0, y: 50 },
        { x: 100, y: 50 }
      ])
    })

    it('5.2: reduces multi-point vertical lines to endpoints', () => {
      const points: Point[] = [
        { x: 75, y: 0 },
        { x: 75, y: 20 },
        { x: 75, y: 80 },
        { x: 75, y: 200 }
      ]
      expect(simplifyCollinearPoints(points)).toEqual([
        { x: 75, y: 0 },
        { x: 75, y: 200 }
      ])
    })

    it('5.3: preserves orthogonal corners while removing redundant intermediate points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },   // corner 1
        { x: 100, y: 50 },
        { x: 100, y: 100 }, // corner 2
        { x: 150, y: 100 },
        { x: 200, y: 100 }
      ]
      expect(simplifyCollinearPoints(points)).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 }
      ])
    })

    it('5.4: handles trivial point arrays (length 0, 1, 2)', () => {
      expect(simplifyCollinearPoints([])).toEqual([])
      expect(simplifyCollinearPoints([{ x: 10, y: 10 }])).toEqual([{ x: 10, y: 10 }])
      expect(simplifyCollinearPoints([{ x: 10, y: 10 }, { x: 20, y: 20 }])).toEqual([
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ])
    })

    it('5.5: removes duplicate identical points along an orthogonal path', () => {
      const points: Point[] = [
        { x: 10, y: 10 },
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 50, y: 10 },
        { x: 50, y: 100 }
      ]
      const simplified = simplifyCollinearPoints(points)
      expect(simplified).toEqual([
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 50, y: 100 }
      ])
    })
  })

  // =========================================================================
  // FOCUS 6: FUZZING & NON-ORTHOGONALITY INVARIANT TEST (200 RANDOM CASES)
  // =========================================================================
  describe('Focus 6: Fuzzing & Universal Orthogonality Invariant', () => {
    it('6.1: 200 randomized routes with varying obstacle configurations all maintain 100% orthogonality', () => {
      const positions: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right']

      let totalSegmentsChecked = 0

      for (let seed = 0; seed < 200; seed++) {
        // Deterministic pseudo-random generation with salt
        const rnd = (mod: number, salt: number = 0) =>
          Math.abs(Math.sin(seed * 997 + salt * 31 + mod) * 10000) % mod

        const srcX = -500 + rnd(1500, 1)
        const srcY = -500 + rnd(1500, 2)
        const tgtX = -500 + rnd(1500, 3)
        const tgtY = -500 + rnd(1500, 4)

        const srcPos = positions[Math.floor(rnd(4, 5))]
        const tgtPos = positions[Math.floor(rnd(4, 6))]

        const numObs = Math.floor(rnd(6))
        const obstacles: Box[] = []
        for (let o = 0; o < numObs; o++) {
          obstacles.push({
            x: Math.min(srcX, tgtX) + rnd(Math.abs(srcX - tgtX) + 200),
            y: Math.min(srcY, tgtY) + rnd(Math.abs(srcY - tgtY) + 200),
            width: 50 + rnd(150),
            height: 50 + rnd(150)
          })
        }

        const route = calculateObstacleAvoidanceRoute(
          { x: srcX, y: srcY, position: srcPos },
          { x: tgtX, y: tgtY, position: tgtPos },
          obstacles,
          10 + rnd(20)
        )

        assertStrictlyOrthogonal(route, `Seed ${seed}: (${srcX}, ${srcY}) -> (${tgtX}, ${tgtY})`)

        // Start and end must match exactly
        expect(route[0]).toEqual({ x: srcX, y: srcY })
        expect(route[route.length - 1]).toEqual({ x: tgtX, y: tgtY })

        totalSegmentsChecked += route.length - 1
      }

      expect(totalSegmentsChecked).toBeGreaterThan(600)
    })

    it('6.2: handles floating-point coordinates and extreme bounds (-10,000 to +100,000)', () => {
      const source: HandleSpec = { x: -9999.5, y: -4999.25, position: 'right' }
      const target: HandleSpec = { x: 50000.75, y: 75000.5, position: 'top' }
      const obs: Box = { x: 10000, y: 20000, width: 5000, height: 5000 }

      const route = calculateObstacleAvoidanceRoute(source, target, [obs])
      assertStrictlyOrthogonal(route, '6.2')
      expect(route[0]).toEqual({ x: -9999.5, y: -4999.25 })
      expect(route[route.length - 1]).toEqual({ x: 50000.75, y: 75000.5 })
    })

    it('6.3: pointsToSmoothPath generates valid SVG path data from orthogonal route', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 400, y: 300, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      const pathD = pointsToSmoothPath(route, 8)

      expect(pathD.startsWith('M 100 100')).toBe(true)
      expect(pathD.endsWith('400 300')).toBe(true)
      // Contains Q curves for rounded corners
      expect(pathD).toMatch(/Q\s+[\d.-]+\s+[\d.-]+/)
    })
  })
})
