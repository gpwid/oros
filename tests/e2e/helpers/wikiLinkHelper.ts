import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, RelationEdge } from '@shared/types'
import { findBacklinksForEntity, EntityBacklinksResult } from '@/utils/backlinksEngine'

export interface ParsedWikiLink {
  raw: string;
  target: string;
  section?: string;
  label?: string;
  startIndex: number;
  endIndex: number;
}

export interface ForwardLinkItem {
  targetId?: string;
  targetTitle: string;
  section?: string;
  label?: string;
  sourceField: 'content' | 'infobox';
  rawLink: string;
}

export interface HoverPreviewData {
  id: string;
  title: string;
  type: string;
  summary: string;
  status: 'draft' | 'canonical' | 'secret';
  tags: string[];
  avatarUrl?: string;
  bannerUrl?: string;
  quickFacts: { label: string; value: string }[];
}

/**
 * Regex for standard Obsidian / TipTap wiki-links:
 * [[Target]]
 * [[Target|Label]]
 * [[Target#Section]]
 * [[Target#Section|Label]]
 */
const WIKI_LINK_REGEX = /\[\[([^#\|\[\]]+)(?:#([^\|\[\]]+))?(?:\|([^\[\]]+))?\]\]/g

export function parseWikiLinks(text: string): ParsedWikiLink[] {
  if (!text) return []
  const matches: ParsedWikiLink[] = []
  let match: RegExpExecArray | null

  // Reset regex state
  WIKI_LINK_REGEX.lastIndex = 0

  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    const raw = match[0]
    const target = match[1]?.trim() || ''
    const section = match[2]?.trim() || undefined
    const label = match[3]?.trim() || undefined

    if (target.length > 0) {
      matches.push({
        raw,
        target,
        section,
        label,
        startIndex: match.index,
        endIndex: match.index + raw.length
      })
    }
  }

  return matches
}

export function formatWikiLink(
  target: string,
  options?: { label?: string; section?: string }
): string {
  const t = target.trim()
  const sec = options?.section ? `#${options.section.trim()}` : ''
  const lbl = options?.label ? `|${options.label.trim()}` : ''
  return `[[${t}${sec}${lbl}]]`
}

export function extractForwardLinks(
  sourceEntity: LoreEntity,
  allEntities: LoreEntity[] = []
): ForwardLinkItem[] {
  const results: ForwardLinkItem[] = []
  const entityTitleMap = new Map<string, LoreEntity>()
  const entityIdMap = new Map<string, LoreEntity>()

  allEntities.forEach(e => {
    entityTitleMap.set(e.title.toLowerCase(), e)
    entityIdMap.set(e.id, e)
    e.aliases?.forEach(alias => {
      if (alias.trim()) {
        entityTitleMap.set(alias.toLowerCase().trim(), e)
      }
    })
  })

  // 1. Extract from content (HTML / Markdown wiki links)
  const content = sourceEntity.content || ''
  
  // A. Wiki-links [[Target]]
  const parsed = parseWikiLinks(content)
  parsed.forEach(link => {
    const resolved = entityTitleMap.get(link.target.toLowerCase())
    results.push({
      targetId: resolved?.id,
      targetTitle: link.target,
      section: link.section,
      label: link.label,
      sourceField: 'content',
      rawLink: link.raw
    })
  })

  // B. TipTap Mention tags: <span data-type="mention" data-id="xyz" data-label="Title">
  const mentionRegex = /<span[^>]*data-type="mention"[^>]*data-id="([^"]+)"[^>]*data-label="([^"]+)"[^>]*>/g
  let mentionMatch: RegExpExecArray | null
  while ((mentionMatch = mentionRegex.exec(content)) !== null) {
    const targetId = mentionMatch[1]
    const targetTitle = mentionMatch[2]
    results.push({
      targetId,
      targetTitle,
      sourceField: 'content',
      rawLink: mentionMatch[0]
    })
  }

  // 2. Extract from infobox entity links
  if (sourceEntity.infobox?.sections) {
    sourceEntity.infobox.sections.forEach(section => {
      section.fields?.forEach(field => {
        if (field.type === 'entity-link' && field.targetEntityId) {
          const target = entityIdMap.get(field.targetEntityId)
          results.push({
            targetId: field.targetEntityId,
            targetTitle: target?.title || field.value || 'Unknown Entity',
            label: field.label,
            sourceField: 'infobox',
            rawLink: field.value || `id:${field.targetEntityId}`
          })
        }
      })
    })
  }

  return results
}

export interface BiDirectionalGraph {
  incomingBacklinks: Map<string, EntityBacklinksResult>;
  outgoingForwardLinks: Map<string, ForwardLinkItem[]>;
  allEntityIds: string[];
}

export function buildBiDirectionalLinkGraph(
  entities: LoreEntity[],
  chapters: ManuscriptChapter[] = [],
  maps: WorldMap[] = [],
  timelines: TimelineEvent[] = [],
  relations: RelationEdge[] = []
): BiDirectionalGraph {
  const incomingBacklinks = new Map<string, EntityBacklinksResult>()
  const outgoingForwardLinks = new Map<string, ForwardLinkItem[]>()
  const allEntityIds = entities.map(e => e.id)

  entities.forEach(entity => {
    // Incoming backlinks via backlinksEngine
    const backlinks = findBacklinksForEntity(
      entity,
      entities,
      chapters,
      maps,
      timelines,
      relations
    )
    incomingBacklinks.set(entity.id, backlinks)

    // Outgoing forward links
    const forwardLinks = extractForwardLinks(entity, entities)
    outgoingForwardLinks.set(entity.id, forwardLinks)
  })

  return {
    incomingBacklinks,
    outgoingForwardLinks,
    allEntityIds
  }
}

export function formatHoverPreview(
  entity: LoreEntity,
  maxSummaryLength: number = 140
): HoverPreviewData {
  let cleanSummary = (entity.summary || '').trim()

  if (!cleanSummary && entity.content) {
    // Strip HTML and get first paragraph
    const text = entity.content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    cleanSummary = text.slice(0, maxSummaryLength)
    if (text.length > maxSummaryLength) {
      cleanSummary += '...'
    }
  } else if (cleanSummary.length > maxSummaryLength) {
    cleanSummary = cleanSummary.slice(0, maxSummaryLength).trim() + '...'
  }

  const quickFacts: { label: string; value: string }[] = []
  if (entity.infobox?.sections) {
    for (const section of entity.infobox.sections) {
      for (const field of section.fields || []) {
        if (field.label && field.value) {
          quickFacts.push({
            label: field.label,
            value: String(field.value)
          })
          if (quickFacts.length >= 4) break
        }
      }
      if (quickFacts.length >= 4) break
    }
  }

  const status: 'draft' | 'canonical' | 'secret' = entity.isSecret
    ? 'secret'
    : (entity.tags?.includes('canonical') ? 'canonical' : 'draft')

  return {
    id: entity.id,
    title: entity.title,
    type: entity.type,
    summary: cleanSummary || 'No summary available.',
    status,
    tags: entity.tags || [],
    avatarUrl: entity.avatarUrl,
    bannerUrl: entity.bannerUrl,
    quickFacts
  }
}
