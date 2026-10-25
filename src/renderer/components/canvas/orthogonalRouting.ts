export interface Point {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface HandleSpec {
  x: number
  y: number
  position: 'top' | 'bottom' | 'left' | 'right' | string
}

/**
 * Checks if a line segment between p1 and p2 intersects the interior of a bounding box
 */
export function lineIntersectsBox(p1: Point, p2: Point, box: Box, margin: number = 0): boolean {
  const minX = box.x - margin
  const maxX = box.x + box.width + margin
  const minY = box.y - margin
  const maxY = box.y + box.height + margin

  // Check if both points are strictly on one side
  if (Math.max(p1.x, p2.x) <= minX || Math.min(p1.x, p2.x) >= maxX) return false
  if (Math.max(p1.y, p2.y) <= minY || Math.min(p1.y, p2.y) >= maxY) return false

  // Vertical segment
  if (Math.abs(p1.x - p2.x) < 0.001) {
    const segMinY = Math.min(p1.y, p2.y)
    const segMaxY = Math.max(p1.y, p2.y)
    return p1.x > minX && p1.x < maxX && segMaxY > minY && segMinY < maxY
  }

  // Horizontal segment
  if (Math.abs(p1.y - p2.y) < 0.001) {
    const segMinX = Math.min(p1.x, p2.x)
    const segMaxX = Math.max(p1.x, p2.x)
    return p1.y > minY && p1.y < maxY && segMaxX > minX && segMinX < maxX
  }

  // General 2D line segment intersection with box boundary
  return true
}

/**
 * Computes handle stub extending outward from node boundary
 */
export function getStubPoint(
  x: number,
  y: number,
  position: 'top' | 'bottom' | 'left' | 'right' | string,
  stubLength: number = 24
): Point {
  switch (position?.toLowerCase()) {
    case 'top':
      return { x, y: y - stubLength }
    case 'bottom':
      return { x, y: y + stubLength }
    case 'left':
      return { x: x - stubLength, y }
    case 'right':
      return { x: x + stubLength, y }
    default:
      return { x, y }
  }
}

/**
 * Simplifies consecutive collinear points along orthogonal axes
 */
export function simplifyCollinearPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points

  const simplified: Point[] = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1]
    const curr = points[i]
    const next = points[i + 1]

    const isCollinearX = Math.abs(prev.x - curr.x) < 0.001 && Math.abs(curr.x - next.x) < 0.001
    const isCollinearY = Math.abs(prev.y - curr.y) < 0.001 && Math.abs(curr.y - next.y) < 0.001

    if (!isCollinearX && !isCollinearY) {
      simplified.push(curr)
    }
  }

  simplified.push(points[points.length - 1])
  return simplified
}

/**
 * Converts a sequence of points to an SVG path with smoothed rounded corners
 */
export function pointsToSmoothPath(points: Point[], cornerRadius: number = 8): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const next = points[i + 1]

    const len1 = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const len2 = Math.hypot(next.x - cur.x, next.y - cur.y)
    const r = Math.min(cornerRadius, len1 / 2, len2 / 2)

    if (r <= 1) {
      d += ` L ${cur.x} ${cur.y}`
    } else {
      const u1x = (cur.x - prev.x) / len1
      const u1y = (cur.y - prev.y) / len1
      const startX = cur.x - u1x * r
      const startY = cur.y - u1y * r

      const u2x = (next.x - cur.x) / len2
      const u2y = (next.y - cur.y) / len2
      const endX = cur.x + u2x * r
      const endY = cur.y + u2y * r

      d += ` L ${startX} ${startY} Q ${cur.x} ${cur.y} ${endX} ${endY}`
    }
  }

  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

/**
 * Calculates obstacle-avoiding orthogonal route between source and target handles
 */
export function calculateObstacleAvoidanceRoute(
  source: HandleSpec,
  target: HandleSpec,
  obstacles: Box[],
  padding: number = 20
): Point[] {
  const stubLength = 24
  const startStub = getStubPoint(source.x, source.y, source.position, stubLength)
  const endStub = getStubPoint(target.x, target.y, target.position, stubLength)

  // Inflate obstacles with margin
  const paddedObstacles = obstacles.map((b) => ({
    minX: b.x - padding,
    maxX: b.x + b.width + padding,
    minY: b.y - padding,
    maxY: b.y + b.height + padding,
    box: b
  }))

  // Form coordinate grid lines
  const xCoords = Array.from(
    new Set([
      source.x,
      startStub.x,
      target.x,
      endStub.x,
      ...paddedObstacles.flatMap((o) => [o.minX, o.maxX])
    ])
  ).sort((a, b) => a - b)

  const yCoords = Array.from(
    new Set([
      source.y,
      startStub.y,
      target.y,
      endStub.y,
      ...paddedObstacles.flatMap((o) => [o.minY, o.maxY])
    ])
  ).sort((a, b) => a - b)

  // A* Search on Orthogonal Grid
  interface GridNode {
    x: number
    y: number
    g: number
    h: number
    f: number
    parent?: GridNode
    dir?: 'h' | 'v'
  }

  const openSet: GridNode[] = []
  const closedSet = new Set<string>()
  const key = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`

  const startNode: GridNode = {
    x: startStub.x,
    y: startStub.y,
    g: 0,
    h: Math.abs(startStub.x - endStub.x) + Math.abs(startStub.y - endStub.y),
    f: 0
  }
  startNode.f = startNode.h
  openSet.push(startNode)

  let finalNode: GridNode | null = null
  let iterations = 0
  const maxIterations = 800

  while (openSet.length > 0 && iterations++ < maxIterations) {
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    if (Math.abs(current.x - endStub.x) < 1 && Math.abs(current.y - endStub.y) < 1) {
      finalNode = current
      break
    }

    closedSet.add(key(current.x, current.y))

    // Expand neighbors along orthogonal grid lines
    const neighbors: { x: number; y: number; dir: 'h' | 'v'; dist: number }[] = []

    // Horizontal moves
    for (const nx of xCoords) {
      if (nx !== current.x) {
        neighbors.push({ x: nx, y: current.y, dir: 'h', dist: Math.abs(nx - current.x) })
      }
    }
    // Vertical moves
    for (const ny of yCoords) {
      if (ny !== current.y) {
        neighbors.push({ x: current.x, y: ny, dir: 'v', dist: Math.abs(ny - current.y) })
      }
    }

    for (const n of neighbors) {
      if (closedSet.has(key(n.x, n.y))) continue

      // Verify no collision with obstacles
      let collides = false
      for (const obs of paddedObstacles) {
        if (
          lineIntersectsBox(
            { x: current.x, y: current.y },
            { x: n.x, y: n.y },
            obs.box,
            padding - 2
          )
        ) {
          collides = true
          break
        }
      }
      if (collides) continue

      // Turn penalty (+60 per bend) to favor minimal turn orthogonal paths
      const isTurn = current.dir && current.dir !== n.dir
      const turnCost = isTurn ? 60 : 0
      const tentativeG = current.g + n.dist + turnCost

      let existing = openSet.find((node) => Math.abs(node.x - n.x) < 1 && Math.abs(node.y - n.y) < 1)
      if (!existing) {
        const h = Math.abs(n.x - endStub.x) + Math.abs(n.y - endStub.y)
        existing = {
          x: n.x,
          y: n.y,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
          dir: n.dir
        }
        openSet.push(existing)
      } else if (tentativeG < existing.g) {
        existing.g = tentativeG
        existing.f = tentativeG + existing.h
        existing.parent = current
        existing.dir = n.dir
      }
    }
  }

  // Reconstruct path
  const path: Point[] = []
  if (finalNode) {
    let curr: GridNode | undefined = finalNode
    while (curr) {
      path.unshift({ x: curr.x, y: curr.y })
      curr = curr.parent
    }
  } else {
    // Graceful fallback to direct stubs with midpoint bend
    const midX = (startStub.x + endStub.x) / 2
    path.push(startStub, { x: midX, y: startStub.y }, { x: midX, y: endStub.y }, endStub)
  }

  return simplifyCollinearPoints([
    { x: source.x, y: source.y },
    ...path,
    { x: target.x, y: target.y }
  ])
}
