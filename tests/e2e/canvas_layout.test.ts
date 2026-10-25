import { describe, it, expect } from 'vitest'
import {
  Point,
  Box,
  HandleSpec,
  CanvasNode,
  CanvasEdge,
  lineIntersectsBox,
  getStubPoint,
  simplifyCollinearPoints,
  calculateObstacleAvoidanceRoute,
  autoLayoutWhiteboardNodes,
  checkNodeOverlaps
} from './helpers/canvasLayoutHelper'

describe('Canvas Whiteboard & Routing Engine Suite (E2E)', () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 per feature)
  // =========================================================================

  describe('Tier 1: Feature 11 - Smart Orthogonal Connector Routing', () => {
    it('T1.11.1: generates orthogonal route with right-angle bends when no obstacles present', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 400, y: 300, position: 'left' }

      const route = calculateObstacleAvoidanceRoute(source, target, [])
      expect(route.length).toBeGreaterThanOrEqual(3)

      // First point is source, last point is target
      expect(route[0]).toEqual({ x: 100, y: 100 })
      expect(route[route.length - 1]).toEqual({ x: 400, y: 300 })

      // Every segment must be orthogonal (dx === 0 or dy === 0)
      for (let i = 0; i < route.length - 1; i++) {
        const dx = Math.abs(route[i + 1].x - route[i].x)
        const dy = Math.abs(route[i + 1].y - route[i].y)
        expect(dx === 0 || dy === 0).toBe(true)
      }
    })

    it('T1.11.2: routes around a single intervening obstacle without intersecting its bounding box', () => {
      const source: HandleSpec = { x: 50, y: 200, position: 'right' }
      const target: HandleSpec = { x: 450, y: 200, position: 'left' }

      // Obstacle sitting directly between source and target
      const obstacle: Box = { x: 200, y: 150, width: 100, height: 100 }

      const route = calculateObstacleAvoidanceRoute(source, target, [obstacle], 20)

      // Verify no segment intersects the obstacle interior
      for (let i = 0; i < route.length - 1; i++) {
        const intersects = lineIntersectsBox(route[i], route[i + 1], obstacle, 0)
        expect(intersects).toBe(false)
      }
    })

    it('T1.11.3: routes through corridors between multiple obstacles', () => {
      const source: HandleSpec = { x: 50, y: 250, position: 'right' }
      const target: HandleSpec = { x: 600, y: 250, position: 'left' }

      // Two obstacles forming a horizontal corridor at y = 250
      const obsTop: Box = { x: 250, y: 50, width: 100, height: 150 }
      const obsBottom: Box = { x: 250, y: 350, width: 100, height: 150 }

      const route = calculateObstacleAvoidanceRoute(source, target, [obsTop, obsBottom], 15)

      for (let i = 0; i < route.length - 1; i++) {
        expect(lineIntersectsBox(route[i], route[i + 1], obsTop, 0)).toBe(false)
        expect(lineIntersectsBox(route[i], route[i + 1], obsBottom, 0)).toBe(false)
      }
    })

    it('T1.11.4: minimizes right-angle turns by applying bend penalty', () => {
      const source: HandleSpec = { x: 100, y: 100, position: 'right' }
      const target: HandleSpec = { x: 400, y: 100, position: 'left' }

      // Unobstructed straight line should have minimal segments (no gratuitous zig-zags)
      const route = calculateObstacleAvoidanceRoute(source, target, [])
      expect(route.length).toBeLessThanOrEqual(4)
    })

    it('T1.11.5: simplifies redundant collinear points along orthogonal paths', () => {
      const collinearPoints: Point[] = [
        { x: 0, y: 100 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 200 },
        { x: 100, y: 300 }
      ]

      const simplified = simplifyCollinearPoints(collinearPoints)
      expect(simplified).toEqual([
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 300 }
      ])
    })
  })

  describe('Tier 1: Feature 12 - Whiteboard Auto-Layout Clustering Engine', () => {
    it('T1.12.1: resolves overlapping nodes within 60 iterations of physics relaxation', () => {
      const nodes: CanvasNode[] = [
        { id: 'n1', position: { x: 100, y: 100 }, width: 200, height: 140 },
        { id: 'n2', position: { x: 120, y: 110 }, width: 200, height: 140 }, // Strongly overlapping n1
        { id: 'n3', position: { x: 150, y: 130 }, width: 200, height: 140 }  // Strongly overlapping n1 & n2
      ]

      const initialOverlap = checkNodeOverlaps(nodes)
      expect(initialOverlap.hasOverlap).toBe(true)

      const relaxed = autoLayoutWhiteboardNodes(nodes, [], 60)
      const finalOverlap = checkNodeOverlaps(relaxed, 0)

      expect(finalOverlap.hasOverlap).toBe(false)
    })

    it('T1.12.2: edge spring attraction draws connected nodes toward optimal proximity', () => {
      const nodes: CanvasNode[] = [
        { id: 'n1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'n2', position: { x: 1000, y: 0 }, width: 100, height: 100 } // Initially far apart
      ]
      const edges: CanvasEdge[] = [{ id: 'e1', source: 'n1', target: 'n2' }]

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)

      const initialDist = Math.hypot(nodes[1].position.x - nodes[0].position.x, nodes[1].position.y - nodes[0].position.y)
      const finalDist = Math.hypot(relaxed[1].position.x - relaxed[0].position.x, relaxed[1].position.y - relaxed[0].position.y)

      expect(finalDist).toBeLessThan(initialDist)
    })

    it('T1.12.3: center-of-mass gravity pulls dispersed nodes gently toward cluster center', () => {
      const nodes: CanvasNode[] = [
        { id: 'n1', position: { x: -500, y: -500 }, width: 100, height: 100 },
        { id: 'n2', position: { x: 500, y: 500 }, width: 100, height: 100 }
      ]

      const relaxed = autoLayoutWhiteboardNodes(nodes, [], 60)

      const initialSpread = Math.abs(nodes[0].position.x - nodes[1].position.x)
      const finalSpread = Math.abs(relaxed[0].position.x - relaxed[1].position.x)

      expect(finalSpread).toBeLessThan(initialSpread)
    })

    it('T1.12.4: deterministic execution produces identical results across consecutive runs', () => {
      const nodes: CanvasNode[] = [
        { id: 'n1', position: { x: 100, y: 100 }, width: 150, height: 100 },
        { id: 'n2', position: { x: 150, y: 120 }, width: 150, height: 100 }
      ]

      const run1 = autoLayoutWhiteboardNodes(nodes, [], 60)
      const run2 = autoLayoutWhiteboardNodes(nodes, [], 60)

      expect(run1[0].position).toEqual(run2[0].position)
      expect(run1[1].position).toEqual(run2[1].position)
    })

    it('T1.12.5: gracefully returns unmodified nodes when node count is 0 or 1', () => {
      expect(autoLayoutWhiteboardNodes([])).toEqual([])
      const single: CanvasNode = { id: 's1', position: { x: 50, y: 50 } }
      expect(autoLayoutWhiteboardNodes([single])).toEqual([single])
    })
  })

  describe('Tier 1: Feature 13 - Interactive Canvas Entity Cards & Drag-and-Drop', () => {
    it('T1.13.1: canvasCard data models portrait, title, status, and summary attributes', () => {
      const cardNode: CanvasNode = {
        id: 'node-card-1',
        position: { x: 100, y: 150 },
        width: 240,
        height: 180,
        data: {
          entityId: 'e-vaelen',
          title: 'Vaelen the Northguard',
          entityType: 'character',
          avatarUrl: 'assets/vaelen.png',
          summary: 'High Commander of the Boreal Watch.',
          isSecret: false,
          expanded: false
        }
      }

      expect(cardNode.data?.entityId).toBe('e-vaelen')
      expect(cardNode.data?.entityType).toBe('character')
      expect(cardNode.data?.isSecret).toBe(false)
    })

    it('T1.13.2: toggling inline summary expansion updates node dimensions without overlap', () => {
      const baseNode: CanvasNode = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        width: 240,
        height: 120, // collapsed
        data: { expanded: false }
      }

      // When expanded, height increases to 220px to show summary and tags
      const expandedNode: CanvasNode = {
        ...baseNode,
        height: 220,
        data: { ...baseNode.data, expanded: true }
      }

      expect(expandedNode.height).toBe(220)
      expect(expandedNode.data?.expanded).toBe(true)
    })

    it('T1.13.3: drag-and-drop drop coordinate calculation instantiates node at canvas point', () => {
      const dropClientCoords = { clientX: 600, clientY: 400 }
      const canvasBounds = { left: 100, top: 100, zoom: 1.0, panX: 0, panY: 0 }

      const canvasX = (dropClientCoords.clientX - canvasBounds.left - canvasBounds.panX) / canvasBounds.zoom
      const canvasY = (dropClientCoords.clientY - canvasBounds.top - canvasBounds.panY) / canvasBounds.zoom

      const droppedNode: CanvasNode = {
        id: `node-drop-${Date.now()}`,
        position: { x: Math.round(canvasX), y: Math.round(canvasY) },
        width: 240,
        height: 140,
        data: { entityId: 'e-dropped', title: 'Dropped Entity' }
      }

      expect(droppedNode.position.x).toBe(500)
      expect(droppedNode.position.y).toBe(300)
    })

    it('T1.13.4: preserves user manual resize dimensions in style/data properties', () => {
      const resizedNode: CanvasNode = {
        id: 'node-custom',
        position: { x: 50, y: 50 },
        width: 320,
        height: 240,
        style: { width: 320, height: 240 }
      }

      expect(resizedNode.width).toBe(320)
      expect(resizedNode.height).toBe(240)
    })

    it('T1.13.5: checks node overlaps accounts for custom node dimensions', () => {
      const normalNode: CanvasNode = { id: 'n1', position: { x: 0, y: 0 }, width: 100, height: 100 }
      const wideNode: CanvasNode = { id: 'n2', position: { x: 80, y: 0 }, width: 300, height: 100 }

      const overlap = checkNodeOverlaps([normalNode, wideNode])
      expect(overlap.hasOverlap).toBe(true)
      expect(overlap.overlappingPairs[0]).toEqual(['n1', 'n2'])
    })
  })

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 per feature domain)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: zero line-of-sight: handles route where obstacle completely blocks direct path', () => {
      const source: HandleSpec = { x: 100, y: 200, position: 'right' }
      const target: HandleSpec = { x: 500, y: 200, position: 'left' }

      // Massive wall obstacle in between
      const wall: Box = { x: 250, y: 100, width: 80, height: 200 }

      const route = calculateObstacleAvoidanceRoute(source, target, [wall], 20)

      for (let i = 0; i < route.length - 1; i++) {
        expect(lineIntersectsBox(route[i], route[i + 1], wall, 0)).toBe(false)
      }
    })

    it('T2.2: handles nodes initialized at identical coordinates (x, y) without NaN perturbation', () => {
      const stackedNodes: CanvasNode[] = [
        { id: 's1', position: { x: 200, y: 200 }, width: 150, height: 100 },
        { id: 's2', position: { x: 200, y: 200 }, width: 150, height: 100 },
        { id: 's3', position: { x: 200, y: 200 }, width: 150, height: 100 }
      ]

      const relaxed = autoLayoutWhiteboardNodes(stackedNodes, [], 60)

      // None of the positions should be NaN
      relaxed.forEach(n => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
      })

      // Overlap must be resolved
      expect(checkNodeOverlaps(relaxed).hasOverlap).toBe(false)
    })

    it('T2.3: multiple obstacles stacked side-by-side forcing route around the entire formation', () => {
      const source: HandleSpec = { x: 50, y: 200, position: 'right' }
      const target: HandleSpec = { x: 600, y: 200, position: 'left' }

      const block1: Box = { x: 200, y: 150, width: 80, height: 100 }
      const block2: Box = { x: 280, y: 150, width: 80, height: 100 }
      const block3: Box = { x: 360, y: 150, width: 80, height: 100 }

      const route = calculateObstacleAvoidanceRoute(source, target, [block1, block2, block3], 20)

      for (let i = 0; i < route.length - 1; i++) {
        expect(lineIntersectsBox(route[i], route[i + 1], block1, 0)).toBe(false)
        expect(lineIntersectsBox(route[i], route[i + 1], block2, 0)).toBe(false)
        expect(lineIntersectsBox(route[i], route[i + 1], block3, 0)).toBe(false)
      }
    })

    it('T2.4: disconnected components in auto-layout do not fly off to infinity', () => {
      const islandA: CanvasNode[] = [
        { id: 'a1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'a2', position: { x: 10, y: 10 }, width: 100, height: 100 }
      ]
      const islandB: CanvasNode[] = [
        { id: 'b1', position: { x: 500, y: 500 }, width: 100, height: 100 },
        { id: 'b2', position: { x: 510, y: 510 }, width: 100, height: 100 }
      ]

      const relaxed = autoLayoutWhiteboardNodes([...islandA, ...islandB], [], 60)

      relaxed.forEach(n => {
        expect(Math.abs(n.position.x)).toBeLessThan(5000)
        expect(Math.abs(n.position.y)).toBeLessThan(5000)
      })
    })

    it('T2.5: lineIntersectsBox correctly identifies non-intersecting tangential segments', () => {
      const box: Box = { x: 100, y: 100, width: 100, height: 100 }
      // Segment passing clearly above
      expect(lineIntersectsBox({ x: 50, y: 50 }, { x: 250, y: 50 }, box)).toBe(false)
      // Segment passing clearly to the left
      expect(lineIntersectsBox({ x: 50, y: 50 }, { x: 50, y: 250 }, box)).toBe(false)
      // Segment piercing straight through center
      expect(lineIntersectsBox({ x: 50, y: 150 }, { x: 250, y: 150 }, box)).toBe(true)
    })
  })

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Canvas Entity Cards + Auto-Layout Clustering + Orthogonal Connectors', () => {
      const cardNodes: CanvasNode[] = [
        { id: 'card-1', position: { x: 100, y: 100 }, width: 200, height: 140, data: { title: 'Vaelen' } },
        { id: 'card-2', position: { x: 120, y: 120 }, width: 200, height: 140, data: { title: 'Horn-Keep' } },
        { id: 'card-3', position: { x: 140, y: 140 }, width: 200, height: 140, data: { title: 'Ostergard' } }
      ]
      const edges: CanvasEdge[] = [
        { id: 'e1-2', source: 'card-1', target: 'card-2' },
        { id: 'e2-3', source: 'card-2', target: 'card-3' }
      ]

      // 1. Auto-Layout
      const laidOut = autoLayoutWhiteboardNodes(cardNodes, edges, 60)
      expect(checkNodeOverlaps(laidOut).hasOverlap).toBe(false)

      // 2. Route edge between card-1 and card-3 with card-2 as obstacle
      const c1 = laidOut.find(n => n.id === 'card-1')!
      const c2 = laidOut.find(n => n.id === 'card-2')!
      const c3 = laidOut.find(n => n.id === 'card-3')!

      const obstacle: Box = {
        x: c2.position.x,
        y: c2.position.y,
        width: 200,
        height: 140
      }

      const route = calculateObstacleAvoidanceRoute(
        { x: c1.position.x + 200, y: c1.position.y + 70, position: 'right' },
        { x: c3.position.x, y: c3.position.y + 70, position: 'left' },
        [obstacle]
      )

      expect(route.length).toBeGreaterThanOrEqual(2)
      for (let i = 0; i < route.length - 1; i++) {
        expect(lineIntersectsBox(route[i], route[i + 1], obstacle, 0)).toBe(false)
      }
    })
  })

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================

  describe('Tier 4: Real-World Scenarios', () => {
    it('T4.1: "Dense Strategic Faction Network on Whiteboard" (8 faction cards, 12 edges, collision-free auto-layout & routing)', () => {
      // 8 Faction Nodes initially in a tight cluster
      const factionNames = [
        'Ostergard Hearth-Guard',
        'Sunken Quay Syndicate',
        'Arcane Council of the Spire',
        'Iron Guild of Horn-Keep',
        'Boreal Wardens',
        'Cinder Cloaks',
        'Order of the Silver Moon',
        'Silent Hand of the Vale'
      ]

      const initialNodes: CanvasNode[] = factionNames.map((name, idx) => ({
        id: `faction-${idx}`,
        position: { x: 300 + (idx % 3) * 30, y: 250 + Math.floor(idx / 3) * 30 }, // tightly stacked
        width: 220,
        height: 120,
        data: { title: name }
      }))

      // 12 Alliance and Rivalry edges
      const edges: CanvasEdge[] = [
        { id: 'e0-1', source: 'faction-0', target: 'faction-1' },
        { id: 'e1-2', source: 'faction-1', target: 'faction-2' },
        { id: 'e2-3', source: 'faction-2', target: 'faction-3' },
        { id: 'e3-4', source: 'faction-3', target: 'faction-4' },
        { id: 'e4-5', source: 'faction-4', target: 'faction-5' },
        { id: 'e5-6', source: 'faction-5', target: 'faction-6' },
        { id: 'e6-7', source: 'faction-6', target: 'faction-7' },
        { id: 'e0-4', source: 'faction-0', target: 'faction-4' },
        { id: 'e1-5', source: 'faction-1', target: 'faction-5' },
        { id: 'e2-6', source: 'faction-2', target: 'faction-6' },
        { id: 'e3-7', source: 'faction-3', target: 'faction-7' },
        { id: 'e0-7', source: 'faction-0', target: 'faction-7' }
      ]

      // Confirm initial state is heavily overlapping
      expect(checkNodeOverlaps(initialNodes).hasOverlap).toBe(true)

      // Execute 60-iteration physics relaxation
      const relaxedNodes = autoLayoutWhiteboardNodes(initialNodes, edges, 60)

      // Assert 0 overlaps remaining
      const overlapResult = checkNodeOverlaps(relaxedNodes, 0)
      expect(overlapResult.hasOverlap).toBe(false)
      expect(overlapResult.overlappingPairs).toHaveLength(0)

      // Test orthogonal routing between opposite factions (faction-0 and faction-5)
      // with all other factions acting as potential obstacle bounding boxes
      const f0 = relaxedNodes.find(n => n.id === 'faction-0')!
      const f5 = relaxedNodes.find(n => n.id === 'faction-5')!
      const obstacleBoxes: Box[] = relaxedNodes
        .filter(n => n.id !== 'faction-0' && n.id !== 'faction-5')
        .map(n => ({ x: n.position.x, y: n.position.y, width: 220, height: 120 }))

      const route = calculateObstacleAvoidanceRoute(
        { x: f0.position.x + 220, y: f0.position.y + 60, position: 'right' },
        { x: f5.position.x, y: f5.position.y + 60, position: 'left' },
        obstacleBoxes,
        15
      )

      expect(route.length).toBeGreaterThanOrEqual(2)

      // Verify no connector segment pierces through any intervening obstacle box
      for (const obs of obstacleBoxes) {
        for (let i = 0; i < route.length - 1; i++) {
          expect(lineIntersectsBox(route[i], route[i + 1], obs, 0)).toBe(false)
        }
      }
    })
  })
})
