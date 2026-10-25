import { toPng, toSvg } from 'html-to-image'
import { getNodesBounds, getViewportForBounds, Node } from '@xyflow/react'
import { WorldMap, RelationEdge, LoreEntity, WhiteboardCanvasData, TimelineEvent, TTRPGBattlemap, TTRPGWall, DirectoryFolder, DirectoryItem } from '@shared/types'
import { exportBattlemapToFoundryScene } from './foundryBridge'
import { exportWorldToObsidianFiles } from './obsidianBridge'

/**
 * Converts a Blob to a Base64 data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Universal browser & Electron file download trigger
 * Supports native save dialog in Electron and <a> download in browser
 */
export async function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType?: string
): Promise<boolean> {
  const ext = filename.includes('.') ? filename.split('.').pop()! : 'bin'
  const filterName = `${ext.toUpperCase()} File`

  // 1. If in Electron via window.oros, save directly with native dialog
  if (typeof window !== 'undefined' && (window as any).oros?.exportFile) {
    try {
      let payload: string
      if (content instanceof Blob) {
        payload = await blobToDataUrl(content)
      } else {
        payload = content
      }
      const success = await (window as any).oros.exportFile(filename, payload, ext, filterName)
      return Boolean(success)
    } catch (err) {
      console.warn('Native oros.exportFile failed, falling back to browser download:', err)
    }
  }

  // 2. Browser fallback via standard anchor click
  let url: string
  let isCreatedUrl = false

  if (content instanceof Blob) {
    url = URL.createObjectURL(content)
    isCreatedUrl = true
  } else if (content.startsWith('data:')) {
    url = content
  } else {
    const blob = new Blob([content], { type: mimeType || 'application/octet-stream' })
    url = URL.createObjectURL(blob)
    isCreatedUrl = true
  }

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  if (isCreatedUrl) {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return true
}

/**
 * Download a structured JS object as a formatted .json file
 */
export async function downloadJsonFile(data: unknown, filename: string): Promise<boolean> {
  const jsonStr = JSON.stringify(data, null, 2)
  return downloadFile(jsonStr, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json')
}

/**
 * Pre-processes images in a DOM container to data URLs.
 * Bypasses CORS and network errors in html-to-image.
 */
export async function inlineExternalImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return

      // 1. Try Electron native fetch via main process (bypasses CORS entirely)
      if (typeof window !== 'undefined' && (window as any).oros?.fetchImageDataUrl) {
        try {
          const dataUrl = await (window as any).oros.fetchImageDataUrl(src)
          if (dataUrl) {
            img.src = dataUrl
            return
          }
        } catch {}
      }

      // 2. Try drawing to an off-screen canvas if image is already loaded in DOM
      if (img.complete && img.naturalWidth > 0) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            img.src = dataUrl
            return
          }
        } catch {}
      }

      // 3. Fallback standard fetch with blob conversion
      try {
        const res = await fetch(src, { mode: 'cors' })
        if (res.ok) {
          const blob = await res.blob()
          const dataUrl = await blobToDataUrl(blob)
          img.src = dataUrl
        }
      } catch {}
    })
  )
}

const DEFAULT_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22100%22 height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%231a1c23%22%2F%3E%3C%2Fsvg%3E'

/**
 * Generic DOM rasterizer to PNG or SVG using html-to-image
 */
export async function exportDomToImage(
  element: HTMLElement,
  format: 'png' | 'svg' = 'png',
  options: {
    filename?: string
    pixelRatio?: number
    backgroundColor?: string
    width?: number
    height?: number
    style?: Record<string, string | number>
    filter?: (domNode: HTMLElement) => boolean
  } = {}
): Promise<string> {
  const {
    filename = `export-${Date.now()}.${format}`,
    pixelRatio = 2,
    backgroundColor = '#090a0d',
    width,
    height,
    style,
    filter
  } = options

  // Pre-inline any external images to avoid CORS failures during html-to-image clone
  await inlineExternalImages(element)

  const config: Record<string, any> = {
    skipFonts: true,
    fontEmbedCSS: '',
    cacheBust: false,
    pixelRatio,
    backgroundColor,
    imagePlaceholder: DEFAULT_IMAGE_PLACEHOLDER,
    filter: (domNode: HTMLElement) => {
      // Exclude floating toolbars, minimaps, and zoom controls during snapshot
      if (domNode.classList) {
        if (domNode.classList.contains('react-flow__controls')) return false
        if (domNode.classList.contains('react-flow__attribution')) return false
        if (domNode.classList.contains('no-export')) return false
      }
      return filter ? filter(domNode) : true
    }
  }

  if (width !== undefined) config.width = width
  if (height !== undefined) config.height = height
  if (style !== undefined) config.style = style

  let dataUrl: string
  try {
    if (format === 'svg') {
      dataUrl = await toSvg(element, config)
    } else {
      dataUrl = await toPng(element, config)
    }
  } catch (err) {
    console.warn(`Primary ${format} export failed, retrying with simplified config:`, err)
    // Retry without custom dimensions/styles
    delete config.width
    delete config.height
    delete config.style
    if (format === 'svg') {
      dataUrl = await toSvg(element, config)
    } else {
      dataUrl = await toPng(element, config)
    }
  }

  await downloadFile(dataUrl, filename)
  return dataUrl
}

/**
 * Capture full React Flow diagram without clipping off-screen nodes
 */
export async function exportReactFlowToImage(
  container: HTMLElement,
  nodes: Node[],
  format: 'png' | 'svg' = 'png',
  options: {
    filename?: string
    backgroundColor?: string
    pixelRatio?: number
    padding?: number
  } = {}
): Promise<string> {
  const {
    filename = `flow-${Date.now()}.${format}`,
    backgroundColor = '#090a0d',
    pixelRatio = 2,
    padding = 64
  } = options

  // Pre-inline external images across all nodes in the container
  await inlineExternalImages(container)

  // If there are no nodes, just capture the container directly
  if (!nodes || nodes.length === 0) {
    return exportDomToImage(container, format, { filename, backgroundColor, pixelRatio })
  }

  const viewportElement = container.querySelector('.react-flow__viewport') as HTMLElement
  if (!viewportElement) {
    return exportDomToImage(container, format, { filename, backgroundColor, pixelRatio })
  }

  // Calculate bounding box encompassing all nodes
  const bounds = getNodesBounds(nodes)
  const imageWidth = Math.max(800, bounds.width + padding * 2)
  const imageHeight = Math.max(600, bounds.height + padding * 2)

  const viewport = getViewportForBounds(
    bounds,
    imageWidth,
    imageHeight,
    0.2,
    2,
    padding / Math.max(imageWidth, imageHeight)
  )

  const config = {
    skipFonts: true,
    fontEmbedCSS: '',
    cacheBust: false,
    pixelRatio,
    backgroundColor,
    imagePlaceholder: DEFAULT_IMAGE_PLACEHOLDER,
    width: imageWidth,
    height: imageHeight,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
    },
    filter: (domNode: HTMLElement) => {
      if (domNode.classList) {
        if (domNode.classList.contains('react-flow__controls')) return false
        if (domNode.classList.contains('react-flow__attribution')) return false
        if (domNode.classList.contains('no-export')) return false
      }
      return true
    }
  }

  let dataUrl: string
  try {
    if (format === 'svg') {
      dataUrl = await toSvg(viewportElement, config)
    } else {
      dataUrl = await toPng(viewportElement, config)
    }
  } catch (err) {
    console.warn(`React Flow viewport ${format} capture failed, falling back to container snapshot:`, err)
    return exportDomToImage(container, format, { filename, backgroundColor, pixelRatio })
  }

  await downloadFile(dataUrl, filename)
  return dataUrl
}

// ==========================================
// DATA EXPORT HELPERS (JSON & CSV)
// ==========================================

export async function exportMapToJson(map: WorldMap, worldName: string = 'Oros Project'): Promise<boolean> {
  const payload = {
    orosVersion: '0.1.0',
    type: 'cartography-map',
    world: worldName,
    exportedAt: new Date().toISOString(),
    map: {
      id: map.id,
      name: map.name,
      imageUrl: map.imageUrl,
      scaleDistance: map.scaleDistance,
      scaleUnit: map.scaleUnit,
      scaleBarPixels: map.scaleBarPixels,
      gridConfig: map.gridConfig,
      regions: map.regions || [],
      pins: map.pins || []
    }
  }
  const safeName = (map.name || 'map').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(payload, `${safeName}_cartography.json`)
}

export async function exportRelationsToJson(
  relations: RelationEdge[],
  entities: LoreEntity[],
  worldName: string = 'Oros Project'
): Promise<boolean> {
  const entityLookup = new Map(entities.map(e => [e.id, { id: e.id, title: e.title, type: e.type }]))
  const payload = {
    orosVersion: '0.1.0',
    type: 'relations-web',
    world: worldName,
    exportedAt: new Date().toISOString(),
    relationsCount: relations.length,
    relations: relations.map(r => ({
      ...r,
      sourceEntity: entityLookup.get(r.sourceEntityId),
      targetEntity: entityLookup.get(r.targetEntityId)
    }))
  }
  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(payload, `${safeName}_relations.json`)
}

export async function exportConnectionsToJson(
  entities: LoreEntity[],
  links: { source: string; target: string }[],
  worldName: string = 'Oros Project'
): Promise<boolean> {
  const entityMap = new Map(entities.map(e => [e.id, e]))
  
  // Compute in/out degree
  const degrees: Record<string, { inDegree: number; outDegree: number; total: number }> = {}
  entities.forEach(e => {
    degrees[e.id] = { inDegree: 0, outDegree: 0, total: 0 }
  })
  links.forEach(l => {
    if (degrees[l.source]) {
      degrees[l.source].outDegree++
      degrees[l.source].total++
    }
    if (degrees[l.target]) {
      degrees[l.target].inDegree++
      degrees[l.target].total++
    }
  })

  const payload = {
    orosVersion: '0.1.0',
    type: 'wiki-knowledge-network',
    world: worldName,
    exportedAt: new Date().toISOString(),
    totalNodes: entities.length,
    totalConnections: links.length,
    nodes: entities.map(e => ({
      id: e.id,
      title: e.title,
      category: e.type,
      tags: e.tags || [],
      stats: degrees[e.id] || { inDegree: 0, outDegree: 0, total: 0 }
    })),
    connections: links.map(l => ({
      sourceId: l.source,
      sourceTitle: entityMap.get(l.source)?.title || l.source,
      targetId: l.target,
      targetTitle: entityMap.get(l.target)?.title || l.target
    }))
  }

  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(payload, `${safeName}_connections.json`)
}

export async function exportConnectionsToCsv(
  entities: LoreEntity[],
  links: { source: string; target: string }[],
  worldName: string = 'Oros Project'
): Promise<boolean> {
  const entityMap = new Map(entities.map(e => [e.id, e.title]))
  const header = 'Source ID,Source Title,Target ID,Target Title\n'
  const rows = links.map(l => {
    const sTitle = `"${(entityMap.get(l.source) || l.source).replace(/"/g, '""')}"`
    const tTitle = `"${(entityMap.get(l.target) || l.target).replace(/"/g, '""')}"`
    return `${l.source},${sTitle},${l.target},${tTitle}`
  }).join('\n')

  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadFile(header + rows, `${safeName}_connections_edgelist.csv`, 'text/csv')
}

export async function exportCanvasToJson(canvas: WhiteboardCanvasData, worldName: string = 'Oros Project'): Promise<boolean> {
  const payload = {
    orosVersion: '0.1.0',
    type: 'whiteboard-canvas',
    world: worldName,
    exportedAt: new Date().toISOString(),
    canvas: {
      id: canvas.id,
      name: canvas.name,
      nodes: canvas.nodes || [],
      edges: canvas.edges || [],
      strokes: canvas.strokes || []
    }
  }
  const safeName = (canvas.name || 'canvas').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(payload, `${safeName}_canvas.json`)
}

export async function exportTimelineToJson(
  events: TimelineEvent[],
  calendarConfig: any,
  worldName: string = 'Oros Project'
): Promise<boolean> {
  const payload = {
    orosVersion: '0.1.0',
    type: 'chronology-timeline',
    world: worldName,
    exportedAt: new Date().toISOString(),
    totalRecords: events.length,
    calendarConfig,
    events
  }
  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(payload, `${safeName}_chronology.json`)
}

export async function exportTimelineToCsv(
  events: TimelineEvent[],
  worldName: string = 'Oros Project'
): Promise<boolean> {
  const header = 'ID,Era,Year,Month,Day,EndYear,IsPeriod,Importance,Category,Title,Description,EntityIds\n'
  const rows = events.map(e => {
    const esc = (val: string = '') => `"${val.replace(/"/g, '""')}"`
    return [
      e.id,
      esc(e.era || ''),
      e.year,
      e.month ?? '',
      e.day ?? '',
      e.endYear ?? '',
      e.isPeriod ? 'true' : 'false',
      e.importance || 'minor',
      esc(e.category || ''),
      esc(e.title || ''),
      esc(e.description || ''),
      esc((e.entityIds || []).join(';'))
    ].join(',')
  }).join('\n')

  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadFile(header + rows, `${safeName}_chronology.csv`, 'text/csv')
}

// ==========================================
// ECOSYSTEM BRIDGES (Obsidian & Foundry VTT)
// ==========================================

export async function exportBattlemapToFoundry(
  battlemap: TTRPGBattlemap,
  campaignName: string = 'Oros Campaign',
  walls?: TTRPGWall[]
): Promise<boolean> {
  const sceneData = exportBattlemapToFoundryScene(battlemap, campaignName, walls)
  const safeName = (battlemap.name || 'battlemap').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(sceneData, `${safeName}_foundry_scene.json`)
}

export async function exportWorldToObsidianJson(
  worldName: string,
  entities: LoreEntity[],
  folders: DirectoryFolder[] = [],
  directoryItems: DirectoryItem[] = []
): Promise<boolean> {
  const vaultResult = exportWorldToObsidianFiles(worldName, entities, folders, directoryItems)
  const safeName = worldName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return downloadJsonFile(vaultResult, `${safeName}_obsidian_vault.json`)
}

