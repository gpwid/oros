import { TTRPGBattlemap, TTRPGToken, TTRPGWall, FoundryWallData, FoundryTokenData, FoundrySceneData } from '@shared/types'

export type { TTRPGWall, FoundryWallData, FoundryTokenData, FoundrySceneData }

/**
 * Converts percentage coordinate (0-100%) to Foundry scene pixel coordinate accounting for padding
 */
export function percentToScenePixel(
  percent: number,
  dimension: number,
  padding: number
): number {
  const baseOffset = padding * dimension
  return Math.round(baseOffset + (percent / 100) * dimension)
}

/**
 * Converts Foundry scene pixel coordinate to Oros percentage coordinate (0-100%)
 */
export function scenePixelToPercent(
  pixel: number,
  dimension: number,
  padding: number
): number {
  const baseOffset = padding * dimension
  const rawPercent = ((pixel - baseOffset) / dimension) * 100
  return Math.round(rawPercent * 100) / 100 // 2 decimal places
}

/**
 * Exports Oros TTRPGBattlemap and walls to Foundry VTT Scene JSON
 */
export function exportBattlemapToFoundryScene(
  battlemap: TTRPGBattlemap,
  campaignName: string = 'Oros Campaign',
  walls: TTRPGWall[] = [],
  imageDimensions: { width: number; height: number } = { width: 1920, height: 1080 },
  padding: number = 0.25
): FoundrySceneData {
  const gridTypeMap: Record<string, number> = {
    square: 1,
    hex: 2
  }

  const effectiveWalls = (walls && walls.length > 0) ? walls : (battlemap.walls || [])
  const gridSize = battlemap.gridSize || 64
  const gridDistance = battlemap.gridUnitFeet || 5

  // 1. Convert walls
  const foundryWalls: FoundryWallData[] = []
  effectiveWalls.forEach((wall, idx) => {
    // Snap vertices within 1px
    const x1 = percentToScenePixel(wall.p1.x, imageDimensions.width, padding)
    const y1 = percentToScenePixel(wall.p1.y, imageDimensions.height, padding)
    const x2 = percentToScenePixel(wall.p2.x, imageDimensions.width, padding)
    const y2 = percentToScenePixel(wall.p2.y, imageDimensions.height, padding)

    // Discard zero-length walls
    if (x1 === x2 && y1 === y2) return

    let door = 0
    let ds = 0

    if (wall.isDoor) {
      door = wall.doorType === 'secret' ? 2 : 1
      if (wall.doorState === 'open') ds = 1
      else if (wall.doorState === 'locked') ds = 2
      else ds = 0 // closed
    }

    const move = wall.blocksMovement ? 20 : 0
    let sense = wall.blocksVision ? 20 : 0
    if (wall.wallType === 'terrain') {
      sense = 10
    }

    foundryWalls.push({
      _id: wall.id || `wall-${String(idx + 1).padStart(8, '0')}`,
      c: [x1, y1, x2, y2],
      move,
      sense,
      sound: wall.blocksSound ? 20 : 0,
      door,
      ds
    })
  })

  // 2. Convert tokens
  const foundryTokens: FoundryTokenData[] = []
  const tokens = battlemap.tokens || []

  tokens.forEach((token, idx) => {
    const size = token.size || 1
    const tokenPixelWidth = size * gridSize

    // Convert center coordinate to scene pixel coordinate
    const centerSceneX = percentToScenePixel(token.x, imageDimensions.width, padding)
    const centerSceneY = percentToScenePixel(token.y, imageDimensions.height, padding)

    // Offset to top-left for Foundry
    const topleftX = centerSceneX - tokenPixelWidth / 2
    const topleftY = centerSceneY - tokenPixelWidth / 2

    // Disposition: 1 friendly, 0 neutral, -1 hostile
    let disposition = 0
    if (token.isEnemy === true) disposition = -1
    else if (token.isEnemy === false) disposition = 1

    const foundryToken: FoundryTokenData = {
      _id: token.id || `token-${String(idx + 1).padStart(8, '0')}`,
      name: token.name,
      actorId: token.characterId || null,
      x: topleftX,
      y: topleftY,
      width: size,
      height: size,
      scale: 1.0,
      disposition,
      texture: { src: token.avatarUrl || 'assets/default-token.png' },
      bar1: {
        attribute: 'attributes.hp',
        value: token.hpCurrent ?? 10,
        max: token.hpMax ?? 10
      },
      hidden: false
    }

    if (token.armorClass !== undefined) {
      foundryToken.bar2 = {
        attribute: 'attributes.ac.value',
        value: token.armorClass
      }
    }

    foundryTokens.push(foundryToken)
  })

  return {
    _id: battlemap.id || 'scene-001',
    name: battlemap.name || 'Untitled Battlemap',
    active: false,
    navigation: true,
    img: battlemap.imageUrl || 'assets/default-battlemap.jpg',
    width: imageDimensions.width,
    height: imageDimensions.height,
    padding,
    backgroundColor: '#0c0f14',
    grid: {
      type: gridTypeMap[battlemap.gridType] || 1,
      size: gridSize,
      distance: gridDistance,
      units: 'ft',
      color: '#000000',
      alpha: battlemap.gridOpacity || 0.3
    },
    walls: foundryWalls,
    tokens: foundryTokens,
    lights: []
  }
}

/**
 * Imports Foundry VTT Scene JSON and translates into Oros TTRPGBattlemap and walls
 */
export function importFoundrySceneToBattlemap(
  sceneData: FoundrySceneData,
  campaignId: string = 'campaign-default'
): { battlemap: TTRPGBattlemap; walls: TTRPGWall[] } {
  const width = sceneData.width || 1920
  const height = sceneData.height || 1080
  const padding = sceneData.padding ?? 0.25
  const gridSize = sceneData.grid?.size || 64
  const gridDistance = sceneData.grid?.distance || 5
  const gridType = sceneData.grid?.type === 2 ? 'hex' : 'square'

  const battlemapId = sceneData._id || 'imported-battlemap'

  // 1. Reconstruct walls
  const walls: TTRPGWall[] = []
  const foundryWalls = sceneData.walls || []

  foundryWalls.forEach((fw, idx) => {
    const [x1, y1, x2, y2] = fw.c
    const p1x = Math.max(0, Math.min(100, scenePixelToPercent(x1, width, padding)))
    const p1y = Math.max(0, Math.min(100, scenePixelToPercent(y1, height, padding)))
    const p2x = Math.max(0, Math.min(100, scenePixelToPercent(x2, width, padding)))
    const p2y = Math.max(0, Math.min(100, scenePixelToPercent(y2, height, padding)))

    // Discard zero-length walls
    if (p1x === p2x && p1y === p2y) return

    const isDoor = fw.door > 0
    const doorType = fw.door === 2 ? 'secret' : 'regular'
    let doorState: 'closed' | 'open' | 'locked' = 'closed'
    if (fw.ds === 1) doorState = 'open'
    else if (fw.ds === 2) doorState = 'locked'

    const wallType = fw.sense === 10 ? 'terrain' : (fw.sense === 0 ? 'window' : 'wall')

    walls.push({
      id: fw._id || `wall-${idx + 1}`,
      battlemapId,
      p1: { x: p1x, y: p1y },
      p2: { x: p2x, y: p2y },
      wallType,
      blocksMovement: fw.move > 0,
      blocksVision: fw.sense > 0,
      blocksSound: (fw.sound ?? 0) > 0,
      isDoor,
      doorType: isDoor ? doorType : undefined,
      doorState: isDoor ? doorState : undefined
    })
  })

  // 2. Reconstruct tokens
  const tokens: TTRPGToken[] = []
  const foundryTokens = sceneData.tokens || []

  foundryTokens.forEach((ft, idx) => {
    const size = ft.width || 1
    const tokenPixelWidth = size * gridSize

    // Reconstruct center coordinate from top-left
    const centerSceneX = ft.x + tokenPixelWidth / 2
    const centerSceneY = ft.y + tokenPixelWidth / 2

    const pctX = Math.max(0, Math.min(100, scenePixelToPercent(centerSceneX, width, padding)))
    const pctY = Math.max(0, Math.min(100, scenePixelToPercent(centerSceneY, height, padding)))

    let isEnemy: boolean | undefined
    if (ft.disposition === 1) isEnemy = false
    else if (ft.disposition === -1) isEnemy = true

    tokens.push({
      id: ft._id || `token-${idx + 1}`,
      campaignId,
      battlemapId,
      name: ft.name,
      avatarUrl: ft.texture?.src,
      characterId: ft.actorId || undefined,
      x: pctX,
      y: pctY,
      size,
      isEnemy,
      hpCurrent: ft.bar1?.value,
      hpMax: ft.bar1?.max,
      armorClass: ft.bar2?.value !== undefined ? ft.bar2.value : undefined
    })
  })

  const battlemap: TTRPGBattlemap = {
    id: battlemapId,
    campaignId,
    name: sceneData.name || 'Imported Battlemap',
    imageUrl: sceneData.img || '',
    gridType,
    gridSize,
    gridOpacity: sceneData.grid?.alpha ?? 0.3,
    gridUnitFeet: gridDistance,
    showCoordinates: false,
    snapToGrid: true,
    tokens,
    walls,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { battlemap, walls }
}
