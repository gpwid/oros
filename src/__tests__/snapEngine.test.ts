import { describe, it, expect } from 'vitest'
import { calculateSmartSnap, SnapNodeBox } from '@/utils/snapEngine'

describe('snapEngine - calculateSmartSnap', () => {
  const baseDragged: SnapNodeBox = {
    id: 'dragged',
    x: 100,
    y: 100,
    width: 50,
    height: 50
  }

  it('returns unsnapped coordinates and no guides when otherNodes is empty', () => {
    const result = calculateSmartSnap(baseDragged, [])
    expect(result.snappedX).toBe(100)
    expect(result.snappedY).toBe(100)
    expect(result.guides).toHaveLength(0)
  })

  it('does not snap when distance exceeds threshold', () => {
    const target: SnapNodeBox = {
      id: 'target',
      x: 200,
      y: 200,
      width: 50,
      height: 50
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(100)
    expect(result.snappedY).toBe(100)
    expect(result.guides).toHaveLength(0)
  })

  it('snaps Left-to-Left within threshold', () => {
    // dragged left is 100. Target left is 104 (diff = 4 <= 8).
    const target: SnapNodeBox = {
      id: 'target',
      x: 104,
      y: 300,
      width: 80,
      height: 60
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(104)
    expect(result.guides.some(g => g.type === 'vertical' && g.pos === 104)).toBe(true)
  })

  it('snaps Right-to-Right within threshold', () => {
    // dragged right is 100 + 50 = 150. Target right is 153 (diff = 3 <= 8).
    // Target x is 73, width is 80 (73 + 80 = 153).
    // Snapped X should be target right - dragged width = 153 - 50 = 103.
    const target: SnapNodeBox = {
      id: 'target',
      x: 73,
      y: 300,
      width: 80,
      height: 60
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(103)
    expect(result.guides.some(g => g.type === 'vertical' && g.pos === 153)).toBe(true)
  })

  it('snaps Center-to-Center X within threshold', () => {
    // dragged center X is 125. Target center X is 128 (diff = 3 <= 8).
    // Target x is 78, width is 100 (center = 128).
    // Snapped X should be target center - dragged width / 2 = 128 - 25 = 103.
    const target: SnapNodeBox = {
      id: 'target',
      x: 78,
      y: 300,
      width: 100,
      height: 60
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(103)
    expect(result.guides.some(g => g.type === 'vertical' && g.pos === 128)).toBe(true)
  })

  it('snaps Left-to-Right within threshold', () => {
    // dragged left is 100. Target right is 103 (diff = 3 <= 8).
    // Target x is 53, width is 50 (right = 103).
    // Snapped X should be target right = 103.
    const target: SnapNodeBox = {
      id: 'target',
      x: 53,
      y: 300,
      width: 50,
      height: 60
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(103)
    expect(result.guides.some(g => g.type === 'vertical' && g.pos === 103)).toBe(true)
  })

  it('snaps Right-to-Left within threshold', () => {
    // dragged right is 150. Target left is 152 (diff = 2 <= 8).
    // Target x is 152, width is 50.
    // Snapped X should be target left - dragged width = 152 - 50 = 102.
    const target: SnapNodeBox = {
      id: 'target',
      x: 152,
      y: 300,
      width: 50,
      height: 60
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(102)
    expect(result.guides.some(g => g.type === 'vertical' && g.pos === 152)).toBe(true)
  })

  it('snaps Top-to-Top in Y axis', () => {
    // dragged top is 100. Target top is 103 (diff = 3 <= 8).
    // Target height is 20 (so bottom is 123, diff from dragged bottom 150 is 27 > 8).
    // Target center is 113, dragged center is 125 (diff = 12 > 8).
    const target: SnapNodeBox = {
      id: 'target',
      x: 300,
      y: 103,
      width: 50,
      height: 20
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedY).toBe(103)
    expect(result.guides.some(g => g.type === 'horizontal' && g.pos === 103)).toBe(true)
  })

  it('snaps Bottom-to-Bottom in Y axis', () => {
    // dragged bottom is 150 (y: 100, h: 50).
    // Target y: 130, h: 23 -> target bottom is 153 (diff = 3 <= 8).
    // Target top is 130 (diff from 100 is 30 > 8).
    // Target center is 141.5, dragged center is 125 (diff = 16.5 > 8).
    const target: SnapNodeBox = {
      id: 'target',
      x: 300,
      y: 130,
      width: 50,
      height: 23
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    // Snapped Y should be target bottom - dragged height = 153 - 50 = 103
    expect(result.snappedY).toBe(103)
    expect(result.guides.some(g => g.type === 'horizontal' && g.pos === 153)).toBe(true)
  })

  it('snaps simultaneously on both X and Y axes', () => {
    const target: SnapNodeBox = {
      id: 'target',
      x: 102,
      y: 104,
      width: 50,
      height: 50
    }
    const result = calculateSmartSnap(baseDragged, [target], 8)
    expect(result.snappedX).toBe(102)
    expect(result.snappedY).toBe(104)
    expect(result.guides).toHaveLength(2)
  })
})
