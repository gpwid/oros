import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, ConlangLanguage, ConlangWord, TTRPGBattlemap } from '@shared/types'

export type SearchDomain = 'all' | 'lore' | 'manuscript' | 'timeline' | 'map' | 'conlang' | 'battlemap'

export interface DeepSearchResult {
  id: string;
  targetId: string;
  domain: 'lore' | 'manuscript' | 'timeline' | 'map' | 'conlang' | 'battlemap';
  title: string;
  badge: string;
  matchField: 'title' | 'content' | 'infobox' | 'tags' | 'aliases' | 'description';
  snippet?: string;
  score: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  if (!html.includes('<') && !html.includes('&')) return html;
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSnippet(text: string, q: string, radius: number = 60): string | undefined {
  if (!text || !q) return undefined;
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(q);
  if (index === -1) return undefined;

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + q.length + radius);

  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return prefix + text.slice(start, end).trim() + suffix;
}

function extractSnippetAt(text: string, index: number, queryLen: number, radius: number = 60): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + queryLen + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return prefix + text.slice(start, end).trim() + suffix;
}

const upperTypeCache: Record<string, string> = {
  character: 'CHARACTER',
  location: 'LOCATION',
  event: 'EVENT',
  item: 'ITEM',
  concept: 'CONCEPT',
  faction: 'FACTION'
};
function getUpperType(type: string): string {
  if (!type) return 'LORE';
  return upperTypeCache[type] || (upperTypeCache[type] = type.toUpperCase());
}

export function searchDeepVault(
  query: string,
  domain: SearchDomain = 'all',
  entities: LoreEntity[] = [],
  chapters: ManuscriptChapter[] = [],
  timelines: TimelineEvent[] = [],
  maps: WorldMap[] = [],
  conlangs: ConlangLanguage[] = [],
  battlemaps: Record<string, TTRPGBattlemap[]> = {}
): DeepSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const buckets: DeepSearchResult[][] = [];
  for (let i = 0; i <= 100; i++) buckets.push([]);
  const addResult = (res: DeepSearchResult) => {
    buckets[res.score].push(res);
  };

  let contentSnippetCount = 0;

  // 1. Search Lore Articles
  if (domain === 'all' || domain === 'lore') {
    const entLen = entities.length;
    for (let i = 0; i < entLen; i++) {
      const ent = entities[i];
      const titleLower = (ent as any)._lowerTitle ?? ((ent as any)._lowerTitle = ent.title.toLowerCase());

      // Title exact or partial match
      if (titleLower === q) {
        addResult({
          id: `lore-${ent.id}-title-exact`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: getUpperType(ent.type),
          matchField: 'title',
          score: 100
        });
        continue;
      }

      if (titleLower.includes(q)) {
        addResult({
          id: `lore-${ent.id}-title`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: getUpperType(ent.type),
          matchField: 'title',
          score: 80
        });
        continue;
      }

      // Aliases match
      const aliases = ent.aliases;
      let matchedAlias: string | undefined;
      if (aliases && aliases.length > 0) {
        for (let j = 0; j < aliases.length; j++) {
          if (aliases[j].toLowerCase().includes(q)) {
            matchedAlias = aliases[j];
            break;
          }
        }
      }
      if (matchedAlias) {
        addResult({
          id: `lore-${ent.id}-alias`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: `Alias: ${matchedAlias}`,
          matchField: 'aliases',
          score: 70
        });
        continue;
      }

      // Tags match
      const tags = ent.tags;
      let matchedTag: string | undefined;
      if (tags && tags.length > 0) {
        for (let j = 0; j < tags.length; j++) {
          if (tags[j].toLowerCase().includes(q)) {
            matchedTag = tags[j];
            break;
          }
        }
      }
      if (matchedTag) {
        addResult({
          id: `lore-${ent.id}-tag`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: `#${matchedTag}`,
          matchField: 'tags',
          score: 65
        });
        continue;
      }

      // Infobox fields match
      let infoboxMatch: string | undefined;
      const sections = ent.infobox?.sections;
      if (sections && sections.length > 0) {
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const fields = sections[sIdx].fields;
          if (fields) {
            for (let fIdx = 0; fIdx < fields.length; fIdx++) {
              const f = fields[fIdx];
              if (f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)) {
                infoboxMatch = `${f.label}: ${f.value}`;
                break;
              }
            }
          }
          if (infoboxMatch) break;
        }
      }
      if (infoboxMatch) {
        addResult({
          id: `lore-${ent.id}-infobox`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: getUpperType(ent.type),
          matchField: 'infobox',
          snippet: infoboxMatch,
          score: 60
        });
        continue;
      }

      // Deep Prose Content match (only if raw content matches query)
      if (ent.content) {
        const rawLower = (ent as any)._lowerContent ?? ((ent as any)._lowerContent = ent.content.toLowerCase());
        const idx = rawLower.indexOf(q);
        if (idx !== -1) {
          let snippet: string | undefined = undefined;
          if (contentSnippetCount < 60) {
            const plainContent = stripHtml(ent.content);
            snippet = extractSnippetAt(plainContent, idx, q.length, 65);
            contentSnippetCount++;
          }
          addResult({
            id: `lore-${ent.id}-content`,
            targetId: ent.id,
            domain: 'lore',
            title: ent.title,
            badge: `${getUpperType(ent.type)} · In Text`,
            matchField: 'content',
            snippet,
            score: 50
          });
        }
      }
    }
  }

  let chapterSnippetCount = 0;

  // 2. Search Manuscript Chapters
  if (domain === 'all' || domain === 'manuscript') {
    const chLen = chapters.length;
    for (let i = 0; i < chLen; i++) {
      const ch = chapters[i];
      const titleLower = (ch as any)._lowerTitle ?? ((ch as any)._lowerTitle = ch.title.toLowerCase());

      if (titleLower.includes(q)) {
        addResult({
          id: `ch-${ch.id}-title`,
          targetId: ch.id,
          domain: 'manuscript',
          title: ch.title,
          badge: `Chapter ${ch.order} · ${ch.wordCount || 0}w`,
          matchField: 'title',
          score: 85
        });
        continue;
      }

      // Search inside Chapter Prose (only if raw content matches query)
      if (ch.content) {
        const rawLower = (ch as any)._lowerContent ?? ((ch as any)._lowerContent = ch.content.toLowerCase());
        const idx = rawLower.indexOf(q);
        if (idx !== -1) {
          let snippet: string | undefined = undefined;
          if (chapterSnippetCount < 60) {
            const plainContent = stripHtml(ch.content);
            snippet = extractSnippetAt(plainContent, idx, q.length, 70);
            chapterSnippetCount++;
          }
          addResult({
            id: `ch-${ch.id}-content`,
            targetId: ch.id,
            domain: 'manuscript',
            title: ch.title,
            badge: `Chapter ${ch.order} · Prose Excerpt`,
            matchField: 'content',
            snippet,
            score: 55
          });
        }
      }
    }
  }

  // 3. Search Timeline Events
  if (domain === 'all' || domain === 'timeline') {
    timelines.forEach((ev) => {
      const titleLower = (ev as any)._lowerTitle ?? ((ev as any)._lowerTitle = ev.title.toLowerCase());

      if (titleLower.includes(q)) {
        addResult({
          id: `tl-${ev.id}-title`,
          targetId: ev.id,
          domain: 'timeline',
          title: ev.title,
          badge: `Year ${ev.year} · ${ev.era}`,
          matchField: 'title',
          score: 80
        });
        return;
      }

      if (ev.description) {
        const descLower = (ev as any)._lowerDesc ?? ((ev as any)._lowerDesc = ev.description.toLowerCase());
        if (descLower.includes(q)) {
          const snippet = extractSnippet(ev.description, q, 60);
          addResult({
            id: `tl-${ev.id}-desc`,
            targetId: ev.id,
            domain: 'timeline',
            title: ev.title,
            badge: `Timeline · Year ${ev.year}`,
            matchField: 'description',
            snippet,
            score: 45
          });
        }
      }
    });
  }

  // 4. Search Maps
  if (domain === 'all' || domain === 'map') {
    maps.forEach((m) => {
      const nameLower = (m as any)._lowerName ?? ((m as any)._lowerName = m.name.toLowerCase());
      if (nameLower.includes(q)) {
        addResult({
          id: `map-${m.id}-title`,
          targetId: m.id,
          domain: 'map',
          title: m.name,
          badge: `Map · ${m.pins?.length || 0} Pins`,
          matchField: 'title',
          score: 75
        });
        return;
      }

      const pins = m.pins;
      if (pins && pins.length > 0) {
        for (let i = 0; i < pins.length; i++) {
          const p = pins[i];
          if (p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) {
            addResult({
              id: `map-${m.id}-pin-${p.id}`,
              targetId: m.id,
              domain: 'map',
              title: m.name,
              badge: `Pin: ${p.title}`,
              matchField: 'content',
              snippet: p.description,
              score: 50
            });
            break;
          }
        }
      }
    });
  }

  let conlangSnippetCount = 0;

  // 5. Search Conlang Lexicons & Words
  if (domain === 'all' || domain === 'conlang') {
    conlangs.forEach((lang) => {
      // Language name or description match
      const langLower = (lang as any)._lowerName ?? ((lang as any)._lowerName = lang.name.toLowerCase());
      if (langLower.includes(q)) {
        addResult({
          id: `conlang-${lang.id}-name`,
          targetId: lang.id,
          domain: 'conlang',
          title: lang.name,
          badge: `Conlang · ${lang.family || 'Tongue'}`,
          matchField: 'title',
          snippet: lang.description || `${lang.words.length} vocabulary terms registered`,
          score: 85
        });
      }

      // Individual words match
      const words = lang.words;
      if (words && words.length > 0) {
        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          const termLower = (w as any)._lowerTerm ?? ((w as any)._lowerTerm = w.term.toLowerCase());

          if (termLower === q) {
            addResult({
              id: `conlang-word-${w.id}-exact`,
              targetId: lang.id,
              domain: 'conlang',
              title: `${w.term} — "${w.definition}"`,
              badge: `${lang.name.toUpperCase()} · [${w.partOfSpeech || 'term'}]`,
              matchField: 'title',
              snippet: `${w.phonetic ? `${w.phonetic} ` : ''}${w.etymology ? `• Root: ${w.etymology}` : ''}`,
              score: 95
            });
            continue;
          }

          if (termLower.includes(q)) {
            addResult({
              id: `conlang-word-${w.id}-term`,
              targetId: lang.id,
              domain: 'conlang',
              title: `${w.term} — "${w.definition}"`,
              badge: `${lang.name} · ${w.partOfSpeech || 'term'}`,
              matchField: 'title',
              snippet: `${w.phonetic ? `${w.phonetic} ` : ''}${w.etymology ? `Etymology: ${w.etymology}` : ''}`,
              score: 75
            });
            continue;
          }

          const defLower = w.definition ? ((w as any)._lowerDef ?? ((w as any)._lowerDef = w.definition.toLowerCase())) : '';
          const etymLower = w.etymology ? ((w as any)._lowerEtym ?? ((w as any)._lowerEtym = w.etymology.toLowerCase())) : '';
          const phoneticLower = w.phonetic ? ((w as any)._lowerPhonetic ?? ((w as any)._lowerPhonetic = w.phonetic.toLowerCase())) : '';

          if (defLower.includes(q) || etymLower.includes(q) || phoneticLower.includes(q)) {
            let snippet: string | undefined = undefined;
            if (conlangSnippetCount < 60) {
              snippet = `${w.phonetic ? `${w.phonetic} • ` : ''}${w.definition}${w.etymology ? ` • Root: ${w.etymology}` : ''}`;
              conlangSnippetCount++;
            }
            addResult({
              id: `conlang-word-${w.id}-meaning`,
              targetId: lang.id,
              domain: 'conlang',
              title: `${w.term} — "${w.definition}"`,
              badge: `${lang.name} · [${w.partOfSpeech || 'term'}]`,
              matchField: 'content',
              snippet,
              score: 65
            });
          }
        }
      }
    });
  }

  // 6. Search TTRPG Battlemaps
  if (domain === 'all' || domain === 'battlemap') {
    Object.entries(battlemaps).forEach(([campaignId, bmaps]) => {
      (bmaps || []).forEach((bm) => {
        const nameLower = (bm as any)._lowerName ?? ((bm as any)._lowerName = bm.name.toLowerCase());

        // Exact name match
        if (nameLower === q) {
          addResult({
            id: `bmap-${bm.id}-exact`,
            targetId: bm.id,
            domain: 'battlemap',
            title: bm.name,
            badge: `BATTLEMAP · ${bm.gridType ? bm.gridType.toUpperCase() : 'GRID'}`,
            matchField: 'title',
            score: 100
          });
          return;
        }

        // Partial name match
        if (nameLower.includes(q)) {
          addResult({
            id: `bmap-${bm.id}-title`,
            targetId: bm.id,
            domain: 'battlemap',
            title: bm.name,
            badge: `BATTLEMAP · ${bm.gridType ? bm.gridType.toUpperCase() : 'GRID'}`,
            matchField: 'title',
            score: 80
          });
          return;
        }

        // Description match
        if (bm.description) {
          const descLower = (bm as any)._lowerDesc ?? ((bm as any)._lowerDesc = bm.description.toLowerCase());
          if (descLower.includes(q)) {
            const snippet = extractSnippet(bm.description, q, 60);
            addResult({
              id: `bmap-${bm.id}-desc`,
              targetId: bm.id,
              domain: 'battlemap',
              title: bm.name,
              badge: 'BATTLEMAP',
              matchField: 'description',
              snippet,
              score: 50
            });
            return;
          }
        }

        // Tokens on the battlemap
        const tokens = bm.tokens;
        if (tokens && tokens.length > 0) {
          for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.name) {
              const tokLower = (t as any)._lowerName ?? ((t as any)._lowerName = t.name.toLowerCase());
              if (tokLower.includes(q)) {
                addResult({
                  id: `bmap-${bm.id}-token-${t.id}`,
                  targetId: bm.id,
                  domain: 'battlemap',
                  title: bm.name,
                  badge: `Token: ${t.name}`,
                  matchField: 'content',
                  snippet: `Token: ${t.name} (${t.isEnemy ? 'Enemy' : 'Ally'})`,
                  score: 45
                });
                break;
              }
            }
          }
        }
      });
    });
  }

  // Concatenate buckets from score 100 down to 0
  const results: DeepSearchResult[] = [];
  for (let s = 100; s >= 0; s--) {
    const b = buckets[s];
    if (b && b.length > 0) {
      for (let i = 0; i < b.length; i++) {
        results.push(b[i]);
      }
    }
  }
  return results;
}
