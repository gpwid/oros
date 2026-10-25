export interface CanvasNode {
  id: string
  position: { x: number; y: number }
  width?: number
  height?: number
  data?: Record<string, any>
  style?: Record<string, any>
  [key: string]: any
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  [key: string]: any
}

/**
 * Runs physics relaxation force layout preventing node overlaps and clustering connected nodes
 */
export function autoLayoutWhiteboardNodes(
  nodes: CanvasNode[],
  edges: CanvasEdge[] = [],
  iterations: number = 60
): CanvasNode[] {
  if (nodes.length <= 1) return nodes

  const simNodes = nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    vx: 0,
    vy: 0,
    width: Number(n.width || n.data?.width || n.style?.width || (n.type === 'canvasCard' ? 240 : 200)),
    height: Number(n.height || n.data?.height || n.style?.height || (n.type === 'canvasCard' ? 180 : 140))
  }))

  const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

  // Center of mass
  const avgX = simNodes.reduce((acc, n) => acc + n.x, 0) / simNodes.length
  const avgY = simNodes.reduce((acc, n) => acc + n.y, 0) / simNodes.length

  for (let step = 0; step < iterations; step++) {
    // 1. Center of mass gentle gravity
    simNodes.forEach((n) => {
      n.vx += (avgX - n.x) * 0.004
      n.vy += (avgY - n.y) * 0.004
    })

    // 2. Anti-overlap bounding box repulsion
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i]
        const b = simNodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y

        // Deterministic perturbation if placed at identical coordinates
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          dx = (i % 2 === 0 ? 1 : -1) * (i + 1) * 10
          dy = (j % 2 === 0 ? 1 : -1) * (j + 1) * 10
        }

        const requiredDistX = (a.width + b.width) / 2 + 30
        const requiredDistY = (a.height + b.height) / 2 + 30
        const overlapX = requiredDistX - Math.abs(dx)
        const overlapY = requiredDistY - Math.abs(dy)

        if (overlapX > 0 && overlapY > 0) {
          const push = Math.min(overlapX, overlapY) * 0.5
          const sx = Math.sign(dx) || 1
          const sy = Math.sign(dy) || 1
          a.vx -= sx * push
          a.vy -= sy * push
          b.vx += sx * push
          b.vy += sy * push
        }
      }
    }

    // 3. Edge spring attraction toward equilibrium distance
    edges.forEach((e) => {
      const src = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (src && tgt) {
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const dist = Math.hypot(dx, dy) || 1
        const idealDist = Math.max(260, (src.width + tgt.width) / 2 + 50)
        if (dist > idealDist) {
          const force = 0.02 * ((dist - idealDist) / dist)
          src.vx += dx * force
          src.vy += dy * force
          tgt.vx -= dx * force
          tgt.vy -= dy * force
        }
      }
    })

    // 4. Update coordinates with damping
    simNodes.forEach((n) => {
      n.x += n.vx
      n.y += n.vy
      n.vx *= 0.85
      n.vy *= 0.85
    })
  }

  return nodes.map((n) => {
    const s = nodeMap.get(n.id)
    return s
      ? { ...n, position: { x: Math.round(s.x), y: Math.round(s.y) } }
      : n
  })
}

/**
 * Checks if any nodes in a set overlap each other's bounding boxes
 */
export function checkNodeOverlaps(
  nodes: CanvasNode[],
  margin: number = 0
): { hasOverlap: boolean; overlappingPairs: [string, string][] } {
  const overlappingPairs: [string, string][] = []

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]

      const aW = Number(a.width || a.data?.width || a.style?.width || (a.type === 'canvasCard' ? 240 : 200))
      const aH = Number(a.height || a.data?.height || a.style?.height || (a.type === 'canvasCard' ? 180 : 140))
      const bW = Number(b.width || b.data?.width || b.style?.width || (b.type === 'canvasCard' ? 240 : 200))
      const bH = Number(b.height || b.data?.height || b.style?.height || (b.type === 'canvasCard' ? 180 : 140))

      const aLeft = a.position.x
      const aRight = a.position.x + aW
      const aTop = a.position.y
      const aBottom = a.position.y + aH

      const bLeft = b.position.x
      const bRight = b.position.x + bW
      const bTop = b.position.y
      const bBottom = b.position.y + bH

      const overlapsX = aLeft < bRight - margin && aRight > bLeft + margin
      const overlapsY = aTop < bBottom - margin && aBottom > bTop + margin

      if (overlapsX && overlapsY) {
        overlappingPairs.push([a.id, b.id])
      }
    }
  }

  return {
    hasOverlap: overlappingPairs.length > 0,
    overlappingPairs
  }
}
