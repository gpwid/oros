// ==========================================
// SMART SNAPPING & ALIGNMENT ENGINE
// ==========================================

export interface SnapGuideLine {
  type: 'horizontal' | 'vertical'
  pos: number
  from: number
  to: number
}

const DEFAULT_SNAP_THRESHOLD = 8 // In flow coordinates

export interface SnapNodeBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calculates smart snapping against neighboring node boundaries
 * (Left, Right, CenterX, Top, Bottom, CenterY).
 * Returns snapped coordinates and guidelines for active rendering.
 */
export function calculateSmartSnap(
  draggedNode: SnapNodeBox,
  otherNodes: SnapNodeBox[],
  threshold: number = DEFAULT_SNAP_THRESHOLD
): { snappedX: number; snappedY: number; guides: SnapGuideLine[] } {
  let snappedX = draggedNode.x
  let snappedY = draggedNode.y
  const guides: SnapGuideLine[] = []

  const dLeft = draggedNode.x
  const dRight = draggedNode.x + draggedNode.width
  const dCenterX = draggedNode.x + draggedNode.width / 2

  const dTop = draggedNode.y
  const dBottom = draggedNode.y + draggedNode.height
  const dCenterY = draggedNode.y + draggedNode.height / 2

  let minDiffX = threshold
  let snapXVal: number | null = null
  let guideLineX: { x: number; from: number; to: number } | null = null

  let minDiffY = threshold
  let snapYVal: number | null = null
  let guideLineY: { y: number; from: number; to: number } | null = null

  for (const other of otherNodes) {
    const oLeft = other.x
    const oRight = other.x + other.width
    const oCenterX = other.x + other.width / 2

    const oTop = other.y
    const oBottom = other.y + other.height
    const oCenterY = other.y + other.height / 2

    // 1. Left to Left
    const diffLL = Math.abs(dLeft - oLeft)
    if (diffLL < minDiffX) {
      minDiffX = diffLL
      snapXVal = oLeft
      guideLineX = { x: oLeft, from: Math.min(dTop, oTop) - 25, to: Math.max(dBottom, oBottom) + 25 }
    }
    // 2. Right to Right
    const diffRR = Math.abs(dRight - oRight)
    if (diffRR < minDiffX) {
      minDiffX = diffRR
      snapXVal = oRight - draggedNode.width
      guideLineX = { x: oRight, from: Math.min(dTop, oTop) - 25, to: Math.max(dBottom, oBottom) + 25 }
    }
    // 3. Center to Center
    const diffCCX = Math.abs(dCenterX - oCenterX)
    if (diffCCX < minDiffX) {
      minDiffX = diffCCX
      snapXVal = oCenterX - draggedNode.width / 2
      guideLineX = { x: oCenterX, from: Math.min(dTop, oTop) - 25, to: Math.max(dBottom, oBottom) + 25 }
    }
    // 4. Left to Right
    const diffLR = Math.abs(dLeft - oRight)
    if (diffLR < minDiffX) {
      minDiffX = diffLR
      snapXVal = oRight
      guideLineX = { x: oRight, from: Math.min(dTop, oTop) - 25, to: Math.max(dBottom, oBottom) + 25 }
    }
    // 5. Right to Left
    const diffRL = Math.abs(dRight - oLeft)
    if (diffRL < minDiffX) {
      minDiffX = diffRL
      snapXVal = oLeft - draggedNode.width
      guideLineX = { x: oLeft, from: Math.min(dTop, oTop) - 25, to: Math.max(dBottom, oBottom) + 25 }
    }

    // Check Y alignments
    // 1. Top to Top
    const diffTT = Math.abs(dTop - oTop)
    if (diffTT < minDiffY) {
      minDiffY = diffTT
      snapYVal = oTop
      guideLineY = { y: oTop, from: Math.min(dLeft, oLeft) - 25, to: Math.max(dRight, oRight) + 25 }
    }
    // 2. Bottom to Bottom
    const diffBB = Math.abs(dBottom - oBottom)
    if (diffBB < minDiffY) {
      minDiffY = diffBB
      snapYVal = oBottom - draggedNode.height
      guideLineY = { y: oBottom, from: Math.min(dLeft, oLeft) - 25, to: Math.max(dRight, oRight) + 25 }
    }
    // 3. Center to Center
    const diffCCY = Math.abs(dCenterY - oCenterY)
    if (diffCCY < minDiffY) {
      minDiffY = diffCCY
      snapYVal = oCenterY - draggedNode.height / 2
      guideLineY = { y: oCenterY, from: Math.min(dLeft, oLeft) - 25, to: Math.max(dRight, oRight) + 25 }
    }
    // 4. Top to Bottom
    const diffTB = Math.abs(dTop - oBottom)
    if (diffTB < minDiffY) {
      minDiffY = diffTB
      snapYVal = oBottom
      guideLineY = { y: oBottom, from: Math.min(dLeft, oLeft) - 25, to: Math.max(dRight, oRight) + 25 }
    }
    // 5. Bottom to Top
    const diffBT = Math.abs(dBottom - oTop)
    if (diffBT < minDiffY) {
      minDiffY = diffBT
      snapYVal = oTop - draggedNode.height
      guideLineY = { y: oTop, from: Math.min(dLeft, oLeft) - 25, to: Math.max(dRight, oRight) + 25 }
    }
  }

  if (snapXVal !== null && guideLineX) {
    snappedX = Math.round(snapXVal)
    guides.push({
      type: 'vertical',
      pos: guideLineX.x,
      from: guideLineX.from,
      to: guideLineX.to
    })
  }

  if (snapYVal !== null && guideLineY) {
    snappedY = Math.round(snapYVal)
    guides.push({
      type: 'horizontal',
      pos: guideLineY.y,
      from: guideLineY.from,
      to: guideLineY.to
    })
  }

  return { snappedX, snappedY, guides }
}
