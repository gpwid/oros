import { LoreEntity, ManuscriptChapter, WorldMap, WhiteboardCanvasData, TimelineEvent } from '@shared/types'

/**
 * Strips HTML tags, entities, and whitespace to compute exact word counts
 */
export function countWords(content?: string): number {
  if (!content) return 0
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, ' ')
  // Decode common HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Match word boundaries
  const words = decoded.trim().match(/[\w\d'-]+/g)
  return words ? words.length : 0
}

export interface ProjectStats {
  totalWords: number
  totalDocuments: number
  entityCount: number
  chapterCount: number
  canvasCount: number
  mapCount: number
  timelineCount: number
}

/**
 * Calculates aggregated project stats for a given world
 */
export function calculateProjectStats(
  worldId: string,
  entities: Record<string, LoreEntity[]>,
  manuscripts: Record<string, ManuscriptChapter[]>,
  maps: Record<string, WorldMap[]>,
  canvases: Record<string, WhiteboardCanvasData[]>,
  timelines: Record<string, TimelineEvent[]>
): ProjectStats {
  const worldEntities = entities[worldId] || []
  const worldChapters = manuscripts[worldId] || []
  const worldMaps = maps[worldId] || []
  const worldCanvases = canvases[worldId] || []
  const worldTimelines = timelines[worldId] || []

  // Calculate words in chapters
  const chapterWords = worldChapters.reduce((acc, ch) => {
    return acc + (ch.wordCount || countWords(ch.content))
  }, 0)

  // Calculate words in lore entities
  const entityWords = worldEntities.reduce((acc, ent) => {
    const summaryWords = countWords(ent.summary)
    const contentWords = countWords(ent.content)
    return acc + summaryWords + contentWords
  }, 0)

  const totalWords = chapterWords + entityWords
  const totalDocuments = worldEntities.length + worldChapters.length + worldCanvases.length + worldMaps.length

  return {
    totalWords,
    totalDocuments,
    entityCount: worldEntities.length,
    chapterCount: worldChapters.length,
    canvasCount: worldCanvases.length,
    mapCount: worldMaps.length,
    timelineCount: worldTimelines.length
  }
}

/**
 * Formats a number with commas (e.g. 14,250)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}
