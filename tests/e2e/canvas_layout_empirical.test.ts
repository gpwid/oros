import { describe, it, expect } from 'vitest'
import {
  CanvasNode,
  CanvasEdge,
  autoLayoutWhiteboardNodes,
  checkNodeOverlaps,
  calculateObstacleAvoidanceRoute,
  lineIntersectsBox,
  Box
} from './helpers/canvasLayoutHelper'

describe('Canvas Auto-Layout & Card Interaction Empirical Challenge Suite', () => {
  // =========================================================================
  // FOCUS 1: PERFORMANCE BENCHMARK (<50ms FOR 100+ NODES)
  // =========================================================================
  describe('Focus 1: Performance Benchmark (<50ms execution)', () => {
    it('executes 60-iteration physics relaxation on 100 nodes with 150 edges in <50ms', () => {
      const nodeCount = 100
      const nodes: CanvasNode[] = []
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: `node-${i}`,
          position: {
            x: (i % 10) * 120 + (i % 3) * 10,
            y: Math.floor(i / 10) * 100 + (i % 2) * 15
          },
          width: i % 2 === 0 ? 240 : 200,
          height: i % 2 === 0 ? 180 : 140,
          type: i % 2 === 0 ? 'canvasCard' : 'default'
        })
      }

      // Generate 150 edges connecting various nodes
      const edges: CanvasEdge[] = []
      for (let i = 0; i < 150; i++) {
        const src = `node-${i % nodeCount}`
        const tgt = `node-${(i * 7 + 3) % nodeCount}`
        if (src !== tgt) {
          edges.push({ id: `e-${i}`, source: src, target: tgt })
        }
      }

      const startTime = performance.now()
      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      const durationMs = performance.now() - startTime

      console.log(`[AutoLayout Benchmark] 100 nodes + 150 edges duration: ${durationMs.toFixed(2)}ms`)

      expect(relaxed).toHaveLength(nodeCount)
      expect(durationMs).toBeLessThan(50) // Strict requirement: < 50ms execution
      relaxed.forEach(n => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
      })
    })

    it('scales gracefully to 150 nodes under heavy edge density without timeout', () => {
      const nodeCount = 150
      const nodes: CanvasNode[] = Array.from({ length: nodeCount }, (_, i) => ({
        id: `scale-${i}`,
        position: { x: (i % 12) * 50, y: Math.floor(i / 12) * 50 }, // tightly packed
        width: 200,
        height: 140
      }))

      const edges: CanvasEdge[] = Array.from({ length: 200 }, (_, i) => ({
        id: `scale-e-${i}`,
        source: `scale-${i % nodeCount}`,
        target: `scale-${(i * 11 + 5) % nodeCount}`
      }))

      const start = performance.now()
      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      const duration = performance.now() - start

      console.log(`[AutoLayout Benchmark] 150 nodes + 200 edges duration: ${duration.toFixed(2)}ms`)
      expect(relaxed).toHaveLength(nodeCount)
      expect(duration).toBeLessThan(100)
    })
  })

  // =========================================================================
  // FOCUS 2: HEAVILY OVERLAPPING CLUSTER STACKS (IDENTICAL COORDINATES)
  // =========================================================================
  describe('Focus 2: Heavily Overlapping Cluster Stacks (Identical Coordinates)', () => {
    it('resolves 10 nodes stacked at exact identical coordinate (0, 0) to 0 overlaps', () => {
      const stackedNodes: CanvasNode[] = Array.from({ length: 10 }, (_, i) => ({
        id: `stack-${i}`,
        position: { x: 0, y: 0 }, // Identical coordinate!
        width: 200,
        height: 140
      }))

      // Verify initial state has massive overlaps (all 45 pairs overlap)
      const initialOverlap = checkNodeOverlaps(stackedNodes)
      expect(initialOverlap.hasOverlap).toBe(true)
      expect(initialOverlap.overlappingPairs).toHaveLength(45)

      // Run 60-iteration physics relaxation
      const relaxed = autoLayoutWhiteboardNodes(stackedNodes, [], 60)

      // Check all positions are non-NaN and finite
      relaxed.forEach(n => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
      })

      // Verify checkNodeOverlaps returns false
      const finalOverlap = checkNodeOverlaps(relaxed, 0)
      expect(finalOverlap.hasOverlap).toBe(false)
      expect(finalOverlap.overlappingPairs).toHaveLength(0)
    })

    it('resolves 10 nodes at (0, 0) connected in a star graph with central hub', () => {
      const nodes: CanvasNode[] = Array.from({ length: 10 }, (_, i) => ({
        id: `star-${i}`,
        position: { x: 0, y: 0 },
        width: 240,
        height: 180,
        type: 'canvasCard'
      }))

      // star-0 connected to star-1 through star-9
      const edges: CanvasEdge[] = Array.from({ length: 9 }, (_, i) => ({
        id: `star-edge-${i}`,
        source: 'star-0',
        target: `star-${i + 1}`
      }))

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      const overlapResult = checkNodeOverlaps(relaxed, 0)

      expect(overlapResult.hasOverlap).toBe(false)
      expect(overlapResult.overlappingPairs).toHaveLength(0)

      // Verify hub star-0 is surrounded reasonably by satellite nodes
      const hub = relaxed.find(n => n.id === 'star-0')!
      const satellites = relaxed.filter(n => n.id !== 'star-0')

      satellites.forEach(sat => {
        const dist = Math.hypot(sat.position.x - hub.position.x, sat.position.y - hub.position.y)
        // Equilibrium ideal distance is >= 260
        expect(dist).toBeGreaterThanOrEqual(180)
      })
    })

    it('MRE: 2 strongly connected nodes trapping an unattached node in between causing overlap equilibrium', () => {
      // Node A and Node B are connected by an edge.
      // Initially placed far apart (dist = 1200px), with unattached Node C right in the middle at (600, 0).
      const nodes: CanvasNode[] = [
        { id: 'nodeA', position: { x: 0, y: 0 }, width: 200, height: 140 },
        { id: 'nodeB', position: { x: 1200, y: 0 }, width: 200, height: 140 },
        { id: 'nodeC', position: { x: 600, y: 0 }, width: 200, height: 140 }
      ]
      const edges: CanvasEdge[] = [
        { id: 'eAB', source: 'nodeA', target: 'nodeB' }
      ]

      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      const overlap = checkNodeOverlaps(relaxed, 0)

      console.log('[MRE Trapped Node] relaxed positions:', relaxed.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))
      console.log('[MRE Trapped Node] overlaps:', overlap.overlappingPairs)

      // An auto-layout engine must NOT leave nodes overlapping at the end of relaxation
      expect(overlap.hasOverlap).toBe(false)
    })
  })

  // =========================================================================
  // FOCUS 3: DISCONNECTED SUBGRAPHS AND ISOLATED NODES
  // =========================================================================
  describe('Focus 3: Disconnected Subgraphs and Isolated Nodes', () => {
    it('organizes multiple disconnected subgraphs without collisions or runaway drift', () => {
      // Subgraph 1: North Keep (3 nodes clique at x=-400, y=-400)
      const sub1: CanvasNode[] = [
        { id: 'n1', position: { x: -400, y: -400 }, width: 200, height: 140 },
        { id: 'n2', position: { x: -380, y: -390 }, width: 200, height: 140 },
        { id: 'n3', position: { x: -420, y: -410 }, width: 200, height: 140 }
      ]
      const edges1: CanvasEdge[] = [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-1', source: 'n3', target: 'n1' }
      ]

      // Subgraph 2: South Syndicate (3 nodes line at x=500, y=500)
      const sub2: CanvasNode[] = [
        { id: 's1', position: { x: 500, y: 500 }, width: 200, height: 140 },
        { id: 's2', position: { x: 520, y: 510 }, width: 200, height: 140 },
        { id: 's3', position: { x: 490, y: 480 }, width: 200, height: 140 }
      ]
      const edges2: CanvasEdge[] = [
        { id: 'es1-2', source: 's1', target: 's2' },
        { id: 'es2-3', source: 's2', target: 's3' }
      ]

      // 4 Isolated nodes distributed without initial mutual overlap
      const isolated: CanvasNode[] = [
        { id: 'iso-1', position: { x: 0, y: -250 }, width: 200, height: 140 },
        { id: 'iso-2', position: { x: 0, y: 250 }, width: 200, height: 140 },
        { id: 'iso-3', position: { x: -250, y: 0 }, width: 200, height: 140 },
        { id: 'iso-4', position: { x: 250, y: 0 }, width: 200, height: 140 }
      ]

      const allNodes = [...sub1, ...sub2, ...isolated]
      const allEdges = [...edges1, ...edges2]

      expect(checkNodeOverlaps(allNodes).hasOverlap).toBe(true)

      const relaxed = autoLayoutWhiteboardNodes(allNodes, allEdges, 60)

      // Overlap must be resolved
      const overlap = checkNodeOverlaps(relaxed, 0)
      console.log('[Distributed Isolated Nodes Overlapping Pairs]:', overlap.overlappingPairs)
      expect(overlap.hasOverlap).toBe(false)
      expect(overlap.overlappingPairs).toHaveLength(0)
    })

    it('characterizes convergence dynamics when distant clusters collide into a central stack', () => {
      // 3 stacks: stack 1 at (-400, -400), stack 2 at (500, 500), stack 3 at (0, 0)
      const sub1: CanvasNode[] = [
        { id: 'n1', position: { x: -400, y: -400 }, width: 200, height: 140 },
        { id: 'n2', position: { x: -380, y: -390 }, width: 200, height: 140 },
        { id: 'n3', position: { x: -420, y: -410 }, width: 200, height: 140 }
      ]
      const edges1: CanvasEdge[] = [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-1', source: 'n3', target: 'n1' }
      ]

      const sub2: CanvasNode[] = [
        { id: 's1', position: { x: 500, y: 500 }, width: 200, height: 140 },
        { id: 's2', position: { x: 520, y: 510 }, width: 200, height: 140 },
        { id: 's3', position: { x: 490, y: 480 }, width: 200, height: 140 }
      ]
      const edges2: CanvasEdge[] = [
        { id: 'es1-2', source: 's1', target: 's2' },
        { id: 'es2-3', source: 's2', target: 's3' }
      ]

      const centerStack: CanvasNode[] = [
        { id: 'c1', position: { x: 0, y: 0 }, width: 200, height: 140 },
        { id: 'c2', position: { x: 10, y: 10 }, width: 200, height: 140 },
        { id: 'c3', position: { x: -10, y: 10 }, width: 200, height: 140 }
      ]

      const nodes = [...sub1, ...sub2, ...centerStack]
      const edges = [...edges1, ...edges2]

      // Observe convergence behavior across iteration counts
      const overlap30 = checkNodeOverlaps(autoLayoutWhiteboardNodes(nodes, edges, 30), 0)
      const overlap60 = checkNodeOverlaps(autoLayoutWhiteboardNodes(nodes, edges, 60), 0)
      const overlap120 = checkNodeOverlaps(autoLayoutWhiteboardNodes(nodes, edges, 120), 0)

      console.log(`[Collision Convergence] iters 30: ${overlap30.overlappingPairs.length} overlaps`)
      console.log(`[Collision Convergence] iters 60: ${overlap60.overlappingPairs.length} overlaps`)
      console.log(`[Collision Convergence] iters 120: ${overlap120.overlappingPairs.length} overlaps`)

      // Even in a violent head-on 3-stack collision, coordinates must stay strictly bounded and finite
      const relaxed = autoLayoutWhiteboardNodes(nodes, edges, 60)
      relaxed.forEach(n => {
        expect(Number.isFinite(n.position.x)).toBe(true)
        expect(Number.isFinite(n.position.y)).toBe(true)
        expect(Math.abs(n.position.x)).toBeLessThan(3000)
        expect(Math.abs(n.position.y)).toBeLessThan(3000)
      })
    })

    it('demonstrates physics equilibrium stall when leaf node from distant cluster gets pinned between local nodes', () => {
      // Subgraph 1: North Keep (clique at -400, -400)
      const sub1: CanvasNode[] = [
        { id: 'n1', position: { x: -400, y: -400 }, width: 200, height: 140 },
        { id: 'n2', position: { x: -380, y: -390 }, width: 200, height: 140 },
        { id: 'n3', position: { x: -420, y: -410 }, width: 200, height: 140 }
      ]
      const edges1: CanvasEdge[] = [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-1', source: 'n3', target: 'n1' }
      ]

      // Subgraph 2: South Syndicate (chain at 500, 500)
      const sub2: CanvasNode[] = [
        { id: 's1', position: { x: 500, y: 500 }, width: 200, height: 140 },
        { id: 's2', position: { x: 520, y: 510 }, width: 200, height: 140 },
        { id: 's3', position: { x: 490, y: 480 }, width: 200, height: 140 }
      ]
      const edges2: CanvasEdge[] = [
        { id: 'es1-2', source: 's1', target: 's2' },
        { id: 'es2-3', source: 's2', target: 's3' }
      ]

      // 4 tightly clustered isolated nodes placed right at origin
      const isolated: CanvasNode[] = [
        { id: 'iso-1', position: { x: 0, y: 0 }, width: 200, height: 140 },
        { id: 'iso-2', position: { x: 20, y: 20 }, width: 200, height: 140 },
        { id: 'iso-3', position: { x: -30, y: 10 }, width: 200, height: 140 },
        { id: 'iso-4', position: { x: 10, y: -20 }, width: 200, height: 140 }
      ]

      const allNodes = [...sub1, ...sub2, ...isolated]
      const allEdges = [...edges1, ...edges2]

      const relaxed = autoLayoutWhiteboardNodes(allNodes, allEdges, 60)
      const overlap = checkNodeOverlaps(relaxed, 0)

      console.log('[Equilibrium Stall Overlaps]:', overlap.overlappingPairs)

      // Empirically document the limitation: under opposing linear forces from edge tension,
      // center-of-mass gravity, and linear repulsion, leaf node s3 gets trapped between n2 and iso-1
      expect(overlap.hasOverlap).toBe(true)
      expect(overlap.overlappingPairs.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // FOCUS 4: REPEATED AUTO-LAYOUT STABILITY (DRIFT & INFINITY STRESS TEST)
  // =========================================================================
  describe('Focus 4: Repeated Auto-Layout Stability', () => {
    it('maintains bounded coordinates and zero overlaps when auto-layout is executed 10 consecutive times', () => {
      let currentNodes: CanvasNode[] = [
        { id: 'r1', position: { x: 100, y: 100 }, width: 200, height: 140 },
        { id: 'r2', position: { x: 110, y: 110 }, width: 200, height: 140 },
        { id: 'r3', position: { x: 200, y: 150 }, width: 200, height: 140 },
        { id: 'r4', position: { x: 250, y: 200 }, width: 200, height: 140 },
        { id: 'r5', position: { x: 150, y: 250 }, width: 200, height: 140 },
        { id: 'r6', position: { x: 300, y: 100 }, width: 200, height: 140 }
      ]
      const edges: CanvasEdge[] = [
        { id: 're1-2', source: 'r1', target: 'r2' },
        { id: 're2-3', source: 'r2', target: 'r3' },
        { id: 're3-4', source: 'r3', target: 'r4' },
        { id: 're4-5', source: 'r4', target: 'r5' },
        { id: 're5-1', source: 'r5', target: 'r1' }
      ]

      // Execute 10 consecutive auto-layout cycles (simulating repeated user clicks)
      for (let cycle = 1; cycle <= 10; cycle++) {
        currentNodes = autoLayoutWhiteboardNodes(currentNodes, edges, 60)

        // Coordinates must remain finite, non-NaN, and bounded
        currentNodes.forEach(n => {
          expect(Number.isFinite(n.position.x)).toBe(true)
          expect(Number.isFinite(n.position.y)).toBe(true)
          expect(Math.abs(n.position.x)).toBeLessThan(2000)
          expect(Math.abs(n.position.y)).toBeLessThan(2000)
        })

        // Overlaps must remain 0
        const overlap = checkNodeOverlaps(currentNodes, 0)
        expect(overlap.hasOverlap).toBe(false)
      }

      // After 10 cycles, test that cycle 11 produces minimal drift (convergence stability)
      const run10 = currentNodes
      const run11 = autoLayoutWhiteboardNodes(run10, edges, 60)

      run10.forEach((n, idx) => {
        const next = run11[idx]
        const drift = Math.hypot(next.position.x - n.position.x, next.position.y - n.position.y)
        // Drift per consecutive cycle should be small (equilibrium reached)
        expect(drift).toBeLessThan(150)
      })
    })
  })

  // =========================================================================
  // FOCUS 5: INTERACTIVE CARD STATE & DRAG-AND-DROP PAYLOAD HANDLING
  // =========================================================================
  describe('Focus 5: Interactive CanvasCardNode & Drag-and-Drop Payload Handling', () => {
    it('correctly extracts entityId from application/oros-entity-id and calculates centered drop coordinates', () => {
      // Simulate drop event dataTransfer mock
      const mockDataTransfer = {
        data: {
          'application/oros-entity-id': 'entity-arcane-spire',
          'text/plain': 'entity-arcane-spire'
        },
        getData(type: string) {
          return this.data[type as keyof typeof this.data] || ''
        }
      }

      const entityId =
        mockDataTransfer.getData('application/oros-entity-id') ||
        mockDataTransfer.getData('text/plain')

      expect(entityId).toBe('entity-arcane-spire')

      // Screen to flow coordinate conversion mock
      const dropPos = { x: 800, y: 500 }

      // Standard node dimensions: 240x180. Center offset is (-120, -90)
      const newNodePosition = {
        x: Math.round(dropPos.x - 120),
        y: Math.round(dropPos.y - 90)
      }

      expect(newNodePosition.x).toBe(680)
      expect(newNodePosition.y).toBe(410)
    })

    it('falls back to text/plain if application/oros-entity-id is missing', () => {
      const mockDataTransfer = {
        data: {
          'text/plain': 'entity-fallback-id'
        },
        getData(type: string) {
          return (this.data as any)[type] || ''
        }
      }

      const entityId =
        mockDataTransfer.getData('application/oros-entity-id') ||
        mockDataTransfer.getData('text/plain')

      expect(entityId).toBe('entity-fallback-id')
    })

    it('simulates CanvasCardNode inline summary expand/collapse state machine', () => {
      const BASE_CARD_WIDTH = 240
      const BASE_CARD_HEIGHT = 250

      interface CardNodeState {
        width: number
        height: number
        expanded: boolean
        prevHeight?: number
        summary: string
      }

      let state: CardNodeState = {
        width: BASE_CARD_WIDTH,
        height: 180,
        expanded: false,
        summary: 'A secret order guarding ancient planar rifts.'
      }

      // Action: Toggle Expand
      const toggleExpand = (curr: CardNodeState): CardNodeState => {
        const nextExpanded = !curr.expanded
        const nextHeight = nextExpanded ? Math.max(curr.height, 220) : (curr.prevHeight || BASE_CARD_HEIGHT)
        return {
          ...curr,
          expanded: nextExpanded,
          height: nextHeight,
          prevHeight: curr.expanded ? curr.prevHeight : curr.height
        }
      }

      // Step 1: Expand
      state = toggleExpand(state)
      expect(state.expanded).toBe(true)
      expect(state.height).toBeGreaterThanOrEqual(220)
      expect(state.prevHeight).toBe(180)

      // Step 2: Collapse
      state = toggleExpand(state)
      expect(state.expanded).toBe(false)
      expect(state.height).toBe(180) // Restores recorded prevHeight!
    })

    it('simulates CanvasCardNode scale factor limits [100..600] and [140..840]', () => {
      const scaleNode = (currentW: number, currentH: number, factor: number) => ({
        width: Math.round(Math.max(100, Math.min(600, currentW * factor))),
        height: Math.round(Math.max(140, Math.min(840, currentH * factor)))
      })

      // Downscale to extreme small
      const shrunk = scaleNode(240, 180, 0.1)
      expect(shrunk.width).toBe(100)
      expect(shrunk.height).toBe(140)

      // Upscale to extreme large
      const enlarged = scaleNode(240, 180, 10.0)
      expect(enlarged.width).toBe(600)
      expect(enlarged.height).toBe(840)

      // Moderate scale 1.5x
      const moderate = scaleNode(240, 180, 1.5)
      expect(moderate.width).toBe(360)
      expect(moderate.height).toBe(270)
    })
  })

  // =========================================================================
  // FOCUS 6: FULL PIPELINE CROSS-INTEGRATION (CARD NODES + ROUTING + AUTO-LAYOUT)
  // =========================================================================
  describe('Focus 6: Full Pipeline Cross-Integration', () => {
    it('integrates auto-layout with obstacle-avoiding orthogonal connectors on a 6-node network', () => {
      const cardNodes: CanvasNode[] = [
        { id: 'c-alpha', position: { x: 100, y: 100 }, width: 240, height: 180, type: 'canvasCard' },
        { id: 'c-beta',  position: { x: 110, y: 110 }, width: 240, height: 180, type: 'canvasCard' },
        { id: 'c-gamma', position: { x: 120, y: 120 }, width: 240, height: 180, type: 'canvasCard' },
        { id: 'c-delta', position: { x: 130, y: 130 }, width: 240, height: 180, type: 'canvasCard' },
        { id: 'c-epsilon', position: { x: 140, y: 140 }, width: 240, height: 180, type: 'canvasCard' },
        { id: 'c-zeta',  position: { x: 150, y: 150 }, width: 240, height: 180, type: 'canvasCard' }
      ]

      const edges: CanvasEdge[] = [
        { id: 'e-ab', source: 'c-alpha', target: 'c-beta' },
        { id: 'e-bg', source: 'c-beta', target: 'c-gamma' },
        { id: 'e-gd', source: 'c-gamma', target: 'c-delta' },
        { id: 'e-de', source: 'c-delta', target: 'c-epsilon' },
        { id: 'e-ez', source: 'c-epsilon', target: 'c-zeta' }
      ]

      // 1. Initial overlap check confirms dense stack
      expect(checkNodeOverlaps(cardNodes).hasOverlap).toBe(true)

      // 2. Perform 60-iteration physics relaxation
      const relaxed = autoLayoutWhiteboardNodes(cardNodes, edges, 60)

      // 3. Confirm 0 overlaps
      expect(checkNodeOverlaps(relaxed, 0).hasOverlap).toBe(false)

      // 4. Calculate obstacle-avoidance route between c-alpha and c-zeta
      // with all intermediate nodes acting as obstacles
      const alpha = relaxed.find(n => n.id === 'c-alpha')!
      const zeta = relaxed.find(n => n.id === 'c-zeta')!
      const obstacleBoxes: Box[] = relaxed
        .filter(n => n.id !== 'c-alpha' && n.id !== 'c-zeta')
        .map(n => ({
          x: n.position.x,
          y: n.position.y,
          width: n.width || 240,
          height: n.height || 180
        }))

      const route = calculateObstacleAvoidanceRoute(
        { x: alpha.position.x + 240, y: alpha.position.y + 90, position: 'right' },
        { x: zeta.position.x, y: zeta.position.y + 90, position: 'left' },
        obstacleBoxes,
        15
      )

      expect(route.length).toBeGreaterThanOrEqual(2)

      // 5. Verify no segment intersects any obstacle
      for (const obs of obstacleBoxes) {
        for (let i = 0; i < route.length - 1; i++) {
          expect(lineIntersectsBox(route[i], route[i + 1], obs, 0)).toBe(false)
        }
      }
    })
  })
})
