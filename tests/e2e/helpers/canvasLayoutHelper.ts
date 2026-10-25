export type { Point, Box, HandleSpec } from '../../../src/renderer/components/canvas/orthogonalRouting'
export {
  lineIntersectsBox,
  getStubPoint,
  simplifyCollinearPoints,
  calculateObstacleAvoidanceRoute,
  pointsToSmoothPath
} from '../../../src/renderer/components/canvas/orthogonalRouting'

export type { CanvasNode, CanvasEdge } from '../../../src/renderer/utils/canvasAutoLayout'
export {
  autoLayoutWhiteboardNodes,
  checkNodeOverlaps
} from '../../../src/renderer/utils/canvasAutoLayout'
