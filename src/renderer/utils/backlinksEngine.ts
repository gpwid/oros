import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, RelationEdge } from '@shared/types'

export interface ChapterBacklink {
  type: 'chapter';
  id: string;
  title: string;
  order: number;
  wordCount: number;
  snippet?: string;
}

export interface LoreBacklink {
  type: 'lore';
  id: string;
  title: string;
  entityType: string;
  reason: 'infobox' | 'mention' | 'content';
  snippet?: string;
}

export interface MapBacklink {
  type: 'map';
  mapId: string;
  mapName: string;
  targetType: 'pin' | 'region';
  targetId: string;
  name: string;
}

export interface TimelineBacklink {
  type: 'timeline';
  id: string;
  title: string;
  year: number;
  era: string;
  importance: string;
  descriptionSnippet?: string;
}

export interface RelationBacklink {
  type: 'relation';
  id: string;
  relationType: string;
  label: string;
  relatedEntityId: string;
  relatedEntityTitle: string;
  isIncoming: boolean;
}

export interface EntityBacklinksResult {
  totalCount: number;
  chapters: ChapterBacklink[];
  lore: LoreBacklink[];
  maps: MapBacklink[];
  timelines: TimelineBacklink[];
  relations: RelationBacklink[];
}

export interface ForwardLinkItem {
  targetId?: string;
  targetTitle: string;
  section?: string;
  label?: string;
  sourceField: 'content' | 'infobox';
  rawLink: string;
}

export interface ParsedWikiLink {
  raw: string;
  target: string;
  section?: string;
  label?: string;
  startIndex: number;
  endIndex: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSnippet(html: string, keyword: string, entityId: string, radius: number = 80): string {
  if (!html) return '';
  const clean = stripHtml(html);
  if (!clean) return '';

  const lowerText = clean.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  
  let matchIndex = lowerText.indexOf(lowerKeyword);
  if (matchIndex === -1 && entityId) {
    // If the keyword wasn't found in plain text (could happen with mentions), find mention or return start
    matchIndex = 0;
  }
  
  if (matchIndex === -1) {
    return clean.slice(0, radius * 2) + (clean.length > radius * 2 ? '...' : '');
  }

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(clean.length, matchIndex + keyword.length + radius);
  
  const prefix = start > 0 ? '...' : '';
  const suffix = end < clean.length ? '...' : '';
  
  return prefix + clean.slice(start, end).trim() + suffix;
}

export function findBacklinksForEntity(
  entity: LoreEntity,
  allEntities: LoreEntity[] = [],
  chapters: ManuscriptChapter[] = [],
  maps: WorldMap[] = [],
  timelines: TimelineEvent[] = [],
  relations: RelationEdge[] = []
): EntityBacklinksResult {
  const entityId = entity.id;
  const entityTitle = entity.title;
  const aliases = entity.aliases || [];
  const searchTerms = [entityTitle, ...aliases].filter(t => t && t.trim().length > 1);

  // 1. Scan Manuscript Chapters
  const chapterResults: ChapterBacklink[] = [];
  chapters.forEach((ch) => {
    const raw = ch.content || '';
    const hasDataId = raw.includes(`data-id="${entityId}"`);
    const lowerContent = raw.toLowerCase();
    const hasTerm = searchTerms.some(term => lowerContent.includes(term.toLowerCase()));

    if (hasDataId || hasTerm) {
      const matchedTerm = searchTerms.find(term => lowerContent.includes(term.toLowerCase())) || entityTitle;
      chapterResults.push({
        type: 'chapter',
        id: ch.id,
        title: ch.title,
        order: ch.order,
        wordCount: ch.wordCount || 0,
        snippet: extractSnippet(raw, matchedTerm, entityId, 90)
      });
    }
  });

  // 2. Scan Other Lore Entities
  const loreResults: LoreBacklink[] = [];
  allEntities.forEach((other) => {
    if (other.id === entityId) return;

    // Check infobox references
    const mentionsInInfobox = other.infobox?.sections?.some(s => 
      s.fields?.some(f => f.targetEntityId === entityId)
    );

    const raw = other.content || '';
    const hasDataId = raw.includes(`data-id="${entityId}"`);
    const lowerContent = raw.toLowerCase();
    const hasTerm = searchTerms.some(term => lowerContent.includes(term.toLowerCase()));

    if (mentionsInInfobox || hasDataId || hasTerm) {
      let reason: 'infobox' | 'mention' | 'content' = 'content';
      if (mentionsInInfobox) reason = 'infobox';
      else if (hasDataId) reason = 'mention';

      const matchedTerm = searchTerms.find(term => lowerContent.includes(term.toLowerCase())) || entityTitle;
      loreResults.push({
        type: 'lore',
        id: other.id,
        title: other.title,
        entityType: other.type,
        reason,
        snippet: extractSnippet(raw, matchedTerm, entityId, 80)
      });
    }
  });

  // 3. Scan Maps (pins and polygon regions)
  const mapResults: MapBacklink[] = [];
  maps.forEach((map) => {
    (map.pins || []).forEach((pin) => {
      if (pin.entityId === entityId) {
        mapResults.push({
          type: 'map',
          mapId: map.id,
          mapName: map.name,
          targetType: 'pin',
          targetId: pin.id,
          name: pin.title || 'Location Pin'
        });
      }
    });

    (map.regions || []).forEach((region) => {
      if (region.entityId === entityId) {
        mapResults.push({
          type: 'map',
          mapId: map.id,
          mapName: map.name,
          targetType: 'region',
          targetId: region.id,
          name: region.name || 'Territory Region'
        });
      }
    });
  });

  // 4. Scan Timelines (events)
  const timelineResults: TimelineBacklink[] = [];
  timelines.forEach((event) => {
    const hasExplicitId = event.entityIds?.includes(entityId);
    const descLower = (event.description || '').toLowerCase();
    const titleLower = (event.title || '').toLowerCase();
    const mentionsTitle = searchTerms.some(term => 
      titleLower.includes(term.toLowerCase()) || descLower.includes(term.toLowerCase())
    );

    if (hasExplicitId || mentionsTitle) {
      timelineResults.push({
        type: 'timeline',
        id: event.id,
        title: event.title,
        year: event.year,
        era: event.era,
        importance: event.importance,
        descriptionSnippet: event.description ? event.description.slice(0, 120) + (event.description.length > 120 ? '...' : '') : undefined
      });
    }
  });

  // 5. Scan Relations (edges)
  const relationResults: RelationBacklink[] = [];
  const entityMap = new Map(allEntities.map(e => [e.id, e.title]));
  
  relations.forEach((rel) => {
    if (rel.sourceEntityId === entityId) {
      relationResults.push({
        type: 'relation',
        id: rel.id,
        relationType: rel.relationType,
        label: rel.label,
        relatedEntityId: rel.targetEntityId,
        relatedEntityTitle: entityMap.get(rel.targetEntityId) || 'Unknown Entity',
        isIncoming: false
      });
    } else if (rel.targetEntityId === entityId) {
      relationResults.push({
        type: 'relation',
        id: rel.id,
        relationType: rel.relationType,
        label: rel.label,
        relatedEntityId: rel.sourceEntityId,
        relatedEntityTitle: entityMap.get(rel.sourceEntityId) || 'Unknown Entity',
        isIncoming: true
      });
    }
  });

  const totalCount = chapterResults.length + loreResults.length + mapResults.length + timelineResults.length + relationResults.length;

  return {
    totalCount,
    chapters: chapterResults,
    lore: loreResults,
    maps: mapResults,
    timelines: timelineResults,
    relations: relationResults
  };
}

const WIKI_LINK_REGEX = /\[\[([^#\|\[\]]+)(?:#([^\|\[\]]+))?(?:\|([^\[\]]+))?\]\]/g

export function parseWikiLinks(text: string): ParsedWikiLink[] {
  if (!text) return []
  const matches: ParsedWikiLink[] = []
  let match: RegExpExecArray | null

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

export function findForwardLinksForEntity(
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

export const extractForwardLinks = findForwardLinksForEntity

