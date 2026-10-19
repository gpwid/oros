import { LoreEntity, ManuscriptChapter, WorldMap, TimelineEvent, ConlangLanguage, ConlangWord } from '@shared/types'

export type SearchDomain = 'all' | 'lore' | 'manuscript' | 'timeline' | 'map' | 'conlang'

export interface DeepSearchResult {
  id: string;
  targetId: string;
  domain: 'lore' | 'manuscript' | 'timeline' | 'map' | 'conlang';
  title: string;
  badge: string;
  matchField: 'title' | 'content' | 'infobox' | 'tags' | 'aliases' | 'description';
  snippet?: string;
  score: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
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

function extractSnippet(text: string, query: string, radius: number = 60): string | undefined {
  if (!text || !query) return undefined;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return undefined;

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);

  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return prefix + text.slice(start, end).trim() + suffix;
}

export function searchDeepVault(
  query: string,
  domain: SearchDomain = 'all',
  entities: LoreEntity[] = [],
  chapters: ManuscriptChapter[] = [],
  timelines: TimelineEvent[] = [],
  maps: WorldMap[] = [],
  conlangs: ConlangLanguage[] = []
): DeepSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DeepSearchResult[] = [];

  // 1. Search Lore Articles
  if (domain === 'all' || domain === 'lore') {
    entities.forEach((ent) => {
      const titleLower = ent.title.toLowerCase();
      const plainContent = stripHtml(ent.content || '');
      const contentLower = plainContent.toLowerCase();

      // Title exact or partial match
      if (titleLower === q) {
        results.push({
          id: `lore-${ent.id}-title-exact`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: ent.type.toUpperCase(),
          matchField: 'title',
          score: 100
        });
        return;
      }

      if (titleLower.includes(q)) {
        results.push({
          id: `lore-${ent.id}-title`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: ent.type.toUpperCase(),
          matchField: 'title',
          score: 80
        });
        return;
      }

      // Aliases match
      const matchedAlias = (ent.aliases || []).find(a => a.toLowerCase().includes(q));
      if (matchedAlias) {
        results.push({
          id: `lore-${ent.id}-alias`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: `Alias: ${matchedAlias}`,
          matchField: 'aliases',
          score: 70
        });
        return;
      }

      // Tags match
      const matchedTag = (ent.tags || []).find(t => t.toLowerCase().includes(q));
      if (matchedTag) {
        results.push({
          id: `lore-${ent.id}-tag`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: `#${matchedTag}`,
          matchField: 'tags',
          score: 65
        });
        return;
      }

      // Infobox fields match
      let infoboxMatch: string | undefined;
      ent.infobox?.sections?.forEach(sec => {
        sec.fields?.forEach(f => {
          if (f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)) {
            infoboxMatch = `${f.label}: ${f.value}`;
          }
        });
      });
      if (infoboxMatch) {
        results.push({
          id: `lore-${ent.id}-infobox`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: ent.type.toUpperCase(),
          matchField: 'infobox',
          snippet: infoboxMatch,
          score: 60
        });
        return;
      }

      // Deep Prose Content match
      if (contentLower.includes(q)) {
        const snippet = extractSnippet(plainContent, q, 65);
        results.push({
          id: `lore-${ent.id}-content`,
          targetId: ent.id,
          domain: 'lore',
          title: ent.title,
          badge: `${ent.type.toUpperCase()} · In Text`,
          matchField: 'content',
          snippet,
          score: 50
        });
      }
    });
  }

  // 2. Search Manuscript Chapters
  if (domain === 'all' || domain === 'manuscript') {
    chapters.forEach((ch) => {
      const titleLower = ch.title.toLowerCase();
      const plainContent = stripHtml(ch.content || '');
      const contentLower = plainContent.toLowerCase();

      if (titleLower.includes(q)) {
        results.push({
          id: `ch-${ch.id}-title`,
          targetId: ch.id,
          domain: 'manuscript',
          title: ch.title,
          badge: `Chapter ${ch.order} · ${ch.wordCount || 0}w`,
          matchField: 'title',
          score: 85
        });
        return;
      }

      // Search inside Chapter Prose
      if (contentLower.includes(q)) {
        const snippet = extractSnippet(plainContent, q, 70);
        results.push({
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
    });
  }

  // 3. Search Timeline Events
  if (domain === 'all' || domain === 'timeline') {
    timelines.forEach((ev) => {
      const titleLower = ev.title.toLowerCase();
      const descLower = (ev.description || '').toLowerCase();

      if (titleLower.includes(q)) {
        results.push({
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

      if (descLower.includes(q)) {
        const snippet = extractSnippet(ev.description, q, 60);
        results.push({
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
    });
  }

  // 4. Search Maps
  if (domain === 'all' || domain === 'map') {
    maps.forEach((m) => {
      if (m.name.toLowerCase().includes(q)) {
        results.push({
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

      const matchedPin = (m.pins || []).find(p => 
        p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
      if (matchedPin) {
        results.push({
          id: `map-${m.id}-pin-${matchedPin.id}`,
          targetId: m.id,
          domain: 'map',
          title: m.name,
          badge: `Pin: ${matchedPin.title}`,
          matchField: 'content',
          snippet: matchedPin.description,
          score: 50
        });
      }
    });
  }

  // 5. Search Conlang Lexicons & Words
  if (domain === 'all' || domain === 'conlang') {
    conlangs.forEach((lang) => {
      // Language name or description match
      if (lang.name.toLowerCase().includes(q)) {
        results.push({
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
      (lang.words || []).forEach((w: ConlangWord) => {
        const termLower = w.term.toLowerCase();
        const defLower = (w.definition || '').toLowerCase();
        const phoneticLower = (w.phonetic || '').toLowerCase();
        const etymLower = (w.etymology || '').toLowerCase();

        if (termLower === q) {
          results.push({
            id: `conlang-word-${w.id}-exact`,
            targetId: lang.id,
            domain: 'conlang',
            title: `${w.term} — "${w.definition}"`,
            badge: `${lang.name.toUpperCase()} · [${w.partOfSpeech || 'term'}]`,
            matchField: 'title',
            snippet: `${w.phonetic ? `${w.phonetic} ` : ''}${w.etymology ? `• Root: ${w.etymology}` : ''}`,
            score: 95
          });
          return;
        }

        if (termLower.includes(q)) {
          results.push({
            id: `conlang-word-${w.id}-term`,
            targetId: lang.id,
            domain: 'conlang',
            title: `${w.term} — "${w.definition}"`,
            badge: `${lang.name} · ${w.partOfSpeech || 'term'}`,
            matchField: 'title',
            snippet: `${w.phonetic ? `${w.phonetic} ` : ''}${w.etymology ? `Etymology: ${w.etymology}` : ''}`,
            score: 75
          });
          return;
        }

        if (defLower.includes(q) || etymLower.includes(q) || phoneticLower.includes(q)) {
          results.push({
            id: `conlang-word-${w.id}-meaning`,
            targetId: lang.id,
            domain: 'conlang',
            title: `${w.term} — "${w.definition}"`,
            badge: `${lang.name} · [${w.partOfSpeech || 'term'}]`,
            matchField: 'content',
            snippet: `${w.phonetic ? `${w.phonetic} • ` : ''}${w.definition}${w.etymology ? ` • Root: ${w.etymology}` : ''}`,
            score: 65
          });
        }
      });
    });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
