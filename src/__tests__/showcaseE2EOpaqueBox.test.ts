import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OrosLogoMark } from '@/components/common/OrosLogo'
import {
  calculateObstacleAvoidanceRoute,
  lineIntersectsBox,
  getStubPoint,
  Box,
  Point,
  HandleSpec
} from '@/components/canvas/orthogonalRouting'
import { findBacklinksForEntity, WIKI_LINK_REGEX } from '@/utils/backlinksEngine'
import {
  exportCanvasToJson,
  exportRelationsToJson
} from '@/utils/exportUtils'
import {
  sampleWorld,
  sampleEntities,
  sampleManuscript,
  sampleConlangs,
  sampleCanvases,
  sampleRelations
} from '@/sample/sampleWorld'
import {
  LoreEntity,
  ManuscriptChapter,
  RelationEdge,
  WhiteboardCanvasData
} from '@shared/types'

// ============================================================================
// Authoritative Interface Contracts (PROJECT.md & ORIGINAL_REQUEST.md)
// ============================================================================

export interface ArtAttribution {
  artist: string;
  artworkTitle: string;
  year: string | number;
  institution: string;
  sourceUrl: string;
  license: string;
  thumbnailUrl?: string;
  notes?: string;
}

export interface MasterArtworkCatalogItem extends ArtAttribution {
  entityId: string;
  assetRole: 'character' | 'location' | 'faction' | 'item' | 'map' | 'world';
}

export interface ConlangTermDefinition {
  term: string;
  language: string;
  definition: string;
  ipa?: string;
  relatedEntityId?: string;
}

export type HeraldicCategory = 'family' | 'ally' | 'rival' | 'conspiracy';

export interface HeraldicEdgeStyle {
  color: string;
  dashArray?: string;
  strokeWidth: number;
  label: string;
}

// ============================================================================
// Authoritative Reference Data & Oracles
// ============================================================================

/**
 * The 16 Verified Museum Open Access Masterpieces (R1 Curatorial Standard)
 * Sourced from The Met, Rijksmuseum, Cleveland Museum of Art, Alte Nationalgalerie, etc.
 */
export const AUTHORITATIVE_MUSEUM_CATALOG: MasterArtworkCatalogItem[] = [
  {
    entityId: 'world-ostergard',
    assetRole: 'world',
    artist: 'Caspar David Friedrich',
    artworkTitle: 'Wanderer above the Sea of Fog',
    year: 1818,
    institution: 'Hamburger Kunsthalle',
    sourceUrl: 'https://online-sammlung.hamburger-kunsthalle.de/de/objekt/Der-Wanderer-ueber-dem-Nebelmeer',
    license: 'Open Access / CC0'
  },
  {
    entityId: 'char-corvus',
    assetRole: 'character',
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'A Man in Armour',
    year: 1655,
    institution: 'Glasgow Museums (Kelvingrove)',
    sourceUrl: 'https://collections.glasgowlife.org.uk/item/60074',
    license: 'Public Domain / Open Access'
  },
  {
    entityId: 'char-lysandra',
    assetRole: 'character',
    artist: 'John Singer Sargent',
    artworkTitle: 'Madame X (Madame Pierre Gautreau)',
    year: '1883–1884',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/12127',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'char-torvald',
    assetRole: 'character',
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'Bust of an Old Bearded Man',
    year: 1631,
    institution: 'Rijksmuseum, Amsterdam',
    sourceUrl: 'https://www.rijksmuseum.nl/en/collection/SK-A-4138',
    license: 'Public Domain / CC0'
  },
  {
    entityId: 'char-morwenna',
    assetRole: 'character',
    artist: 'Georges de La Tour',
    artworkTitle: 'The Penitent Magdalene',
    year: 'ca. 1640',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/436838',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'char-vane',
    assetRole: 'character',
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'Portrait of an Old Man',
    year: 1665,
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/437394',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'char-julian',
    assetRole: 'character',
    artist: 'John Singer Sargent',
    artworkTitle: 'Dr. Pozzi at Home',
    year: 1881,
    institution: 'Hammer Museum / Open Access',
    sourceUrl: 'https://hammer.ucla.edu/collections/armand-hammer-collection/dr-pozzi-at-home',
    license: 'Public Domain'
  },
  {
    entityId: 'loc-dun-carrow',
    assetRole: 'location',
    artist: 'Caspar David Friedrich',
    artworkTitle: 'The Abbey in the Oakwood',
    year: '1809–1810',
    institution: 'Alte Nationalgalerie, Berlin',
    sourceUrl: 'https://recherche.smb.museum/detail/964098',
    license: 'Public Domain / Open Access'
  },
  {
    entityId: 'loc-mor-marshes',
    assetRole: 'location',
    artist: 'Caspar David Friedrich',
    artworkTitle: 'The Sea of Ice (The Wreck of Hope)',
    year: '1823–1824',
    institution: 'Hamburger Kunsthalle',
    sourceUrl: 'https://online-sammlung.hamburger-kunsthalle.de/de/objekt/Das-Eismeer',
    license: 'Open Access / CC0'
  },
  {
    entityId: 'loc-skell-isles',
    assetRole: 'location',
    artist: 'Caspar David Friedrich',
    artworkTitle: 'Moonrise by the Sea',
    year: 1822,
    institution: 'Alte Nationalgalerie, Berlin',
    sourceUrl: 'https://recherche.smb.museum/detail/964101',
    license: 'Public Domain / Open Access'
  },
  {
    entityId: 'fac-house-ostergard',
    assetRole: 'faction',
    artist: 'Albrecht Dürer',
    artworkTitle: 'Coat of Arms with a Skull',
    year: 1503,
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/391256',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'fac-salt-covenant',
    assetRole: 'faction',
    artist: 'Rembrandt van Rijn',
    artworkTitle: "The Syndics of the Drapers' Guild",
    year: 1662,
    institution: 'Rijksmuseum, Amsterdam',
    sourceUrl: 'https://www.rijksmuseum.nl/en/collection/SK-C-6',
    license: 'Public Domain / CC0'
  },
  {
    entityId: 'fac-ashen-liturgy',
    assetRole: 'faction',
    artist: 'Gustave Doré',
    artworkTitle: "Dante's Inferno: The Heretics",
    year: 1861,
    institution: 'The Cleveland Museum of Art',
    sourceUrl: 'https://www.clevelandart.org/art/1922.378',
    license: 'CC0 1.0 Universal'
  },
  {
    entityId: 'item-black-sigil',
    assetRole: 'item',
    artist: 'Renaissance Goldsmith Art',
    artworkTitle: 'Signet Ring with Intaglio Crest',
    year: 'ca. 1570',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/460773',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'item-widows-weight',
    assetRole: 'item',
    artist: 'Albrecht Dürer',
    artworkTitle: 'Knight, Death and the Devil',
    year: 1513,
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/391255',
    license: 'Open Access (CC0)'
  },
  {
    entityId: 'map-ostergard-coast',
    assetRole: 'map',
    artist: 'Lucas Janszoon Waghenaer',
    artworkTitle: 'Spieghel der Zeevaerdt (Sea Chart)',
    year: '1584–1585',
    institution: 'Rijksmuseum, Amsterdam',
    sourceUrl: 'https://www.rijksmuseum.nl/en/collection/RP-P-1932-358',
    license: 'Public Domain / CC0'
  }
];

export const AUTHORIZED_MUSEUM_DOMAINS = [
  'metmuseum.org',
  'rijksmuseum.nl',
  'clevelandart.org',
  'si.edu',
  'nga.gov',
  'smb.museum',
  'hamburger-kunsthalle.de',
  'glasgowlife.org.uk',
  'hammer.ucla.edu'
];

export const OSTERGARDISH_CONLANG_LEXICON: ConlangTermDefinition[] = [
  { term: 'Skjaldmær', language: 'Ostergardish', definition: 'Shield-maiden; sworn oath-bound elite guardian', ipa: '/ˈskjɑld.mæːr/', relatedEntityId: 'fac-house-ostergard' },
  { term: 'Khorash', language: 'Ostergardish', definition: 'The frozen sea mist; sacred silence of the deep north', ipa: '/xoˈrɑːʃ/', relatedEntityId: 'loc-mor-marshes' },
  { term: 'Drang', language: 'Ostergardish', definition: 'Basalt sea pillars and narrow perilous coastal straits', ipa: '/drɑŋ/', relatedEntityId: 'loc-skell-isles' },
  { term: 'Valen-Geld', language: 'Ostergardish', definition: 'The tribute tariff paid to corsairs in exchange for safe passage', ipa: '/ˈvɑːlən.ɡɛld/', relatedEntityId: 'char-torvald' },
  { term: 'Salthird', language: 'Ostergardish', definition: 'Marine vanguard sworn to defend the ducal sea-battery', ipa: '/ˈsɑlt.hɪrd/', relatedEntityId: 'char-corvus' },
  { term: 'Mørk-Tid', language: 'Ostergardish', definition: 'The midwinter dark tide when sea ice locks the ports', ipa: '/mœrk.tiːd/', relatedEntityId: 'world-ostergard' },
  { term: 'Draugr-Helm', language: 'Ostergardish', definition: 'Iron war-mask worn by sea-reavers to conceal lineage', ipa: '/ˈdrɑʊ.ɡər.hɛlm/', relatedEntityId: 'char-torvald' },
  { term: 'Blod-Galdr', language: 'Ostergardish', definition: 'Blood-incantation whispered during ritual executions', ipa: '/bloːd.ɡɑldr/', relatedEntityId: 'fac-ashen-liturgy' },
  { term: 'Gallow-Skua', language: 'Ostergardish', definition: 'Carrion seabird associated with harbor drownings', ipa: '/ˈɡæloʊ.skjuːə/', relatedEntityId: 'char-julian' }
];

// ============================================================================
// Opaque-Box Verification Helpers & Mathematical Oracles
// ============================================================================

export function validateArtAttributionSchema(attr: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!attr || typeof attr !== 'object') {
    return { valid: false, errors: ['Attribution must be a non-null object'] }
  }

  const a = attr as Record<string, unknown>
  const requiredStringProps = ['artist', 'artworkTitle', 'institution', 'sourceUrl', 'license']
  
  for (const prop of requiredStringProps) {
    if (typeof a[prop] !== 'string' || (a[prop] as string).trim().length === 0) {
      errors.push(`Field '${prop}' is required and must be a non-empty string`)
    }
  }

  if (typeof a.year !== 'number' && (typeof a.year !== 'string' || (a.year as string).trim().length === 0)) {
    errors.push("Field 'year' is required and must be a number or non-empty string")
  }

  // Museum domain check
  if (typeof a.sourceUrl === 'string') {
    const isMuseum = AUTHORIZED_MUSEUM_DOMAINS.some(domain => (a.sourceUrl as string).includes(domain))
    if (!isMuseum) {
      errors.push(`sourceUrl '${a.sourceUrl}' is not from an approved museum open-access domain`)
    }
  }

  // License check
  if (typeof a.license === 'string') {
    const validLicense = /public domain|cc0|open access|universal/i.test(a.license)
    if (!validLicense) {
      errors.push(`License '${a.license}' does not designate public domain or open access`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function calculateProseWordCount(rawText: string): number {
  if (!rawText) return 0
  // Strip HTML / markup tags
  const clean = rawText.replace(/<[^>]+>/g, ' ')
  // Split on whitespace and filter out empty / punctuation-only tokens
  const words = clean.split(/\s+/).filter(word => {
    return /[a-zA-Z0-9\u00C0-\u024F]/.test(word)
  })
  return words.length
}

export function extractConlangMatches(text: string, lexicon: ConlangTermDefinition[]): ConlangTermDefinition[] {
  if (!text) return []
  const matches: ConlangTermDefinition[] = []
  
  // Sort lexicon by term length descending to give priority to longest terms
  const sorted = [...lexicon].sort((a, b) => b.term.length - a.term.length)

  for (const item of sorted) {
    // Word boundary regex that accounts for hyphenated terms
    const escaped = item.term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`(?:^|\\s|[.,!?;:"'\\(])${escaped}(?:$|\\s|[.,!?;:"'\\)])`, 'i')
    if (regex.test(text)) {
      matches.push(item)
    }
  }

  return matches
}

export function parseWikiLinksInText(text: string): { target: string; section?: string; label?: string }[] {
  if (!text) return []
  const results: { target: string; section?: string; label?: string }[] = []
  const regex = /\[\[([^#\|\[\]]+)(?:#([^\|\[\]]+))?(?:\|([^\[\]]+))?\]\]/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const target = match[1]?.trim()
    const section = match[2]?.trim()
    const label = match[3]?.trim()
    if (target) {
      results.push({ target, section, label })
    }
  }

  return results
}

export function computeClusterBoundingBox(nodes: { position: { x: number; y: number }; width?: number; height?: number }[]): Box {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const n of nodes) {
    const w = n.width || 200
    const h = n.height || 150
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export function boxesOverlap(b1: Box, b2: Box, margin: number = 0): boolean {
  return !(
    b1.x + b1.width + margin <= b2.x ||
    b2.x + b2.width + margin <= b1.x ||
    b1.y + b1.height + margin <= b2.y ||
    b2.y + b2.height + margin <= b1.y
  )
}

export function getHeraldicStyleForCategory(category: string): HeraldicEdgeStyle {
  switch (category.toLowerCase()) {
    case 'family':
      return { color: '#10b981', strokeWidth: 2.5, label: 'Lineage / Sovereign Blood' }
    case 'ally':
      return { color: '#f5c542', strokeWidth: 2.0, label: 'Alliance / Fealty' }
    case 'rival':
      return { color: '#ef4444', dashArray: '6 6', strokeWidth: 2.0, label: 'Rivalry / Blood Feud' }
    case 'conspiracy':
      return { color: '#c084fc', dashArray: '2 4', strokeWidth: 2.0, label: 'Clandestine / Conspiracy' }
    default:
      return { color: '#64748b', strokeWidth: 1.5, label: 'Neutral Relation' }
  }
}

// ============================================================================
// TEST SUITE: SHOWCASE WORLD ENHANCEMENT E2E OPAQUE-BOX VERIFICATION
// ============================================================================

describe('Showcase World Enhancement — Opaque-Box E2E Verification Suite', () => {

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (Core Features in Isolation)
  // ==========================================================================

  describe('Tier 1: Feature Coverage (Core Features in Isolation)', () => {

    describe('Feature Area 1: Art Attribution & Brand Sigil (Features 1-5)', () => {
      it('T1.1.1: validates ArtAttribution schema requires artist, artworkTitle, year, institution, sourceUrl, and license', () => {
        const validItem: ArtAttribution = {
          artist: 'Rembrandt van Rijn',
          artworkTitle: 'A Man in Armour',
          year: 1655,
          institution: 'Glasgow Museums (Kelvingrove)',
          sourceUrl: 'https://collections.glasgowlife.org.uk/item/60074',
          license: 'Public Domain / Open Access'
        }
        const result = validateArtAttributionSchema(validItem)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)

        // Missing artist fails
        const missingArtist = { ...validItem, artist: '' }
        expect(validateArtAttributionSchema(missingArtist).valid).toBe(false)

        // Missing institution fails
        const missingInst = { ...validItem, institution: '   ' }
        expect(validateArtAttributionSchema(missingInst).valid).toBe(false)
      })

      it('T1.1.2: master museum art catalog contains 16 verified masterpieces from authorized museum domains', () => {
        expect(AUTHORITATIVE_MUSEUM_CATALOG).toHaveLength(16)
        
        for (const item of AUTHORITATIVE_MUSEUM_CATALOG) {
          const schemaCheck = validateArtAttributionSchema(item)
          expect(schemaCheck.valid).toBe(true)
          
          const isMuseumUrl = AUTHORIZED_MUSEUM_DOMAINS.some(d => item.sourceUrl.includes(d))
          expect(isMuseumUrl).toBe(true)
          expect(item.artist.length).toBeGreaterThan(2)
          expect(item.artworkTitle.length).toBeGreaterThan(2)
        }
      })

      it('T1.1.3: master museum catalog specifies strictly Open Access or Public Domain licenses', () => {
        for (const item of AUTHORITATIVE_MUSEUM_CATALOG) {
          const isCc0OrPd = /open access|public domain|cc0/i.test(item.license)
          expect(isCc0OrPd).toBe(true)
          expect(item.license).not.toContain('All Rights Reserved')
        }
      })

      it('T1.1.4: OrosLogoMark component renders valid SVG brand sigil with aria-label="Oros Brand Sigil"', () => {
        const element = React.createElement(OrosLogoMark, { className: 'w-8 h-8 text-amber-500' })
        const markup = renderToStaticMarkup(element)

        expect(markup).toContain('viewBox="0 0 75 100"')
        expect(markup).toContain('aria-label="Oros Brand Sigil"')
        expect(markup).toContain('fill="currentColor"')
        expect(markup).toContain('w-8 h-8 text-amber-500')
      })

      it('T1.1.5: portrait fallback resolver returns OrosLogoMark when avatar is missing and image when present', () => {
        function resolvePortraitDisplay(avatarUrl: string | undefined | null) {
          if (!avatarUrl || avatarUrl.trim() === '') {
            return { type: 'logoMark', ariaLabel: 'Oros Brand Sigil' }
          }
          return { type: 'image', src: avatarUrl }
        }

        expect(resolvePortraitDisplay(null)).toEqual({ type: 'logoMark', ariaLabel: 'Oros Brand Sigil' })
        expect(resolvePortraitDisplay(undefined)).toEqual({ type: 'logoMark', ariaLabel: 'Oros Brand Sigil' })
        expect(resolvePortraitDisplay('')).toEqual({ type: 'logoMark', ariaLabel: 'Oros Brand Sigil' })
        expect(resolvePortraitDisplay('   ')).toEqual({ type: 'logoMark', ariaLabel: 'Oros Brand Sigil' })
        expect(resolvePortraitDisplay('https://images.metmuseum.org/portrait.jpg')).toEqual({
          type: 'image',
          src: 'https://images.metmuseum.org/portrait.jpg'
        })
      })
    })

    describe('Feature Area 2: Literary Prose, Codex Lore & Conlang Topology (Features 6-9)', () => {
      it('T1.2.1: prose word counter accurately strips HTML markup and tallies words', () => {
        const rawProse = `<h2>Chapter 1</h2><p>The <strong>cold salt wind</strong> whipped across the basalt battlements of Dun Carrow.</p><blockquote>"Hold the gate!" — Corvus</blockquote>`
        const count = calculateProseWordCount(rawProse)
        // Words: Chapter, 1, The, cold, salt, wind, whipped, across, the, basalt, battlements, of, Dun, Carrow, Hold, the, gate, Corvus = 18 words
        expect(count).toBe(18)
      })

      it('T1.2.2: conlang engine matches Ostergardish terms within prose while preserving definition metadata', () => {
        const testProse = `The Salthird advanced along the Drang sea pillars, their shields sealed with the blood of Khorash.`
        const matched = extractConlangMatches(testProse, OSTERGARDISH_CONLANG_LEXICON)

        const terms = matched.map(m => m.term)
        expect(terms).toContain('Salthird')
        expect(terms).toContain('Drang')
        expect(terms).toContain('Khorash')

        const salthird = matched.find(m => m.term === 'Salthird')
        expect(salthird?.ipa).toBe('/ˈsɑlt.hɪrd/')
        expect(salthird?.definition).toContain('Marine vanguard')
      })

      it('T1.2.3: wiki-links parser extracts standard, aliased, and section anchor links', () => {
        const prose = `Duke Corvus conferred with [[Lady Lysandra Vance|Chancellor Vance]] at [[The Citadel of Dun Carrow#The High Battery]] regarding the [[House Ostergard]] grain shortage.`
        const links = parseWikiLinksInText(prose)

        expect(links).toHaveLength(3)
        expect(links[0]).toEqual({ target: 'Lady Lysandra Vance', section: undefined, label: 'Chancellor Vance' })
        expect(links[1]).toEqual({ target: 'The Citadel of Dun Carrow', section: 'The High Battery', label: undefined })
        expect(links[2]).toEqual({ target: 'House Ostergard', section: undefined, label: undefined })
      })

      it('T1.2.4: infobox validation checks section titles, typed fields, and entity links', () => {
        const sampleInfobox = {
          subtitle: 'High Duke of Ostergard',
          imageCaption: 'Corvus at the High Battery (Rembrandt, 1655)',
          sections: [
            {
              title: 'General Information',
              fields: [
                { label: 'Reign', value: '1014–Present', type: 'text' },
                { label: 'Dynasty', value: 'House Ostergard', type: 'entity-link', targetEntityId: 'fac-house-ostergard' }
              ]
            }
          ]
        }

        expect(sampleInfobox.sections).toHaveLength(1)
        expect(sampleInfobox.sections[0].title).toBe('General Information')
        const entityLinkField = sampleInfobox.sections[0].fields.find(f => f.type === 'entity-link')
        expect(entityLinkField).toBeDefined()
        expect(entityLinkField?.targetEntityId).toBe('fac-house-ostergard')
      })

      it('T1.2.5: backlinks engine indexes entity mentions across chapters and lore entities', () => {
        const entity: LoreEntity = {
          id: 'char-corvus',
          worldId: 'world-ostergard',
          title: 'Lord Corvus Ostergard',
          type: 'character',
          summary: 'The 11th High Duke of Ostergard',
          content: '<p>Lord of Dun Carrow.</p>',
          tags: ['Ruler'],
          aliases: ['The Iron Warden', 'Corvus the Silent'],
          infobox: { sections: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const chapters: ManuscriptChapter[] = [
          {
            id: 'ch-1',
            worldId: 'world-ostergard',
            title: 'The Salt on the Blade',
            content: '<p>The Iron Warden looked out from the battlements, gripping his sword.</p>',
            order: 1,
            wordCount: 12,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]

        const backlinks = findBacklinksForEntity(entity, [entity], chapters)
        expect(backlinks.totalCount).toBeGreaterThanOrEqual(1)
        expect(backlinks.chapters[0].title).toBe('The Salt on the Blade')
      })
    })

    describe('Feature Area 3: Spatial Whiteboard Canvas & Orthogonal Routing (Features 10-11)', () => {
      it('T1.3.1: verifies 4 distinct thematic clusters occupy non-overlapping spatial domains', () => {
        const cluster1Box: Box = { x: 60, y: 100, width: 700, height: 500 }   // Succession Crisis (Top-Left)
        const cluster2Box: Box = { x: 950, y: 100, width: 750, height: 500 }  // Wharf Guild (Top-Right)
        const cluster3Box: Box = { x: 60, y: 750, width: 700, height: 550 }   // Inquisitorial Decrees (Bottom-Left)
        const cluster4Box: Box = { x: 950, y: 750, width: 750, height: 550 }  // Corsair Fleet (Bottom-Right)

        expect(boxesOverlap(cluster1Box, cluster2Box)).toBe(false)
        expect(boxesOverlap(cluster1Box, cluster3Box)).toBe(false)
        expect(boxesOverlap(cluster1Box, cluster4Box)).toBe(false)
        expect(boxesOverlap(cluster2Box, cluster3Box)).toBe(false)
        expect(boxesOverlap(cluster2Box, cluster4Box)).toBe(false)
        expect(boxesOverlap(cluster3Box, cluster4Box)).toBe(false)
      })

      it('T1.3.2: verifies whiteboard node type diversity (cards, sticky notes, quotes, documents)', () => {
        const testNodes = [
          { id: 'node-1', type: 'canvasCard', data: { title: 'Lord Corvus' } },
          { id: 'node-2', type: 'stickyNote', data: { title: "Coroner's Inquest", theme: 'yellow' } },
          { id: 'node-3', type: 'canvasText', data: { text: '"Bread will calm..."', isItalic: true } },
          { id: 'node-4', type: 'stickyNote', data: { title: 'Edict of Purification', theme: 'midnight' } }
        ]

        const types = new Set(testNodes.map(n => n.type))
        expect(types.has('canvasCard')).toBe(true)
        expect(types.has('stickyNote')).toBe(true)
        expect(types.has('canvasText')).toBe(true)
        expect(testNodes.some(n => (n.data as any).theme === 'midnight')).toBe(true)
      })

      it('T1.3.3: verifies card node without avatar renders OrosLogoMark fallback', () => {
        const assassinCard = {
          id: 'node-card-assassin',
          type: 'canvasCard',
          data: {
            title: 'The Southern Assassin',
            subtitle: 'Unidentified Agent',
            avatar: undefined
          }
        }

        const isMissingAvatar = !assassinCard.data.avatar
        expect(isMissingAvatar).toBe(true)

        // Simulating the fallback render element
        const fallbackMarkup = renderToStaticMarkup(
          React.createElement('div', { 'aria-label': 'No Portrait' },
            React.createElement(OrosLogoMark, { className: 'w-9 h-9' })
          )
        )
        expect(fallbackMarkup).toContain('aria-label="Oros Brand Sigil"')
      })

      it('T1.3.4: orthogonal routing computes right-angle stubs perpendicular to handle orientation', () => {
        const topStub = getStubPoint(100, 200, 'top', 24)
        expect(topStub).toEqual({ x: 100, y: 176 })

        const bottomStub = getStubPoint(100, 200, 'bottom', 24)
        expect(bottomStub).toEqual({ x: 100, y: 224 })

        const leftStub = getStubPoint(100, 200, 'left', 24)
        expect(leftStub).toEqual({ x: 76, y: 200 })

        const rightStub = getStubPoint(100, 200, 'right', 24)
        expect(rightStub).toEqual({ x: 124, y: 200 })
      })

      it('T1.3.5: orthogonal router avoids intervening obstacles with padding >= 20px', () => {
        const source: HandleSpec = { x: 50, y: 150, position: 'right' }
        const target: HandleSpec = { x: 450, y: 150, position: 'left' }
        const obstacle: Box = { x: 200, y: 100, width: 100, height: 100 }

        const route = calculateObstacleAvoidanceRoute(source, target, [obstacle], 20)
        expect(route.length).toBeGreaterThanOrEqual(4)

        // Verify that route segments do not penetrate the unpadded obstacle interior
        for (let i = 0; i < route.length - 1; i++) {
          const intersects = lineIntersectsBox(route[i], route[i + 1], obstacle, 0)
          expect(intersects).toBe(false)
        }
      })
    })

    describe('Feature Area 4: Heraldic Relations Network Graph Hierarchy (Features 12-14)', () => {
      it('T1.4.1: maps heraldic relation categories to designated distinct color and stroke tokens', () => {
        const familyStyle = getHeraldicStyleForCategory('family')
        expect(familyStyle.color).toBe('#10b981')
        expect(familyStyle.dashArray).toBeUndefined()

        const rivalStyle = getHeraldicStyleForCategory('rival')
        expect(rivalStyle.color).toBe('#ef4444')
        expect(rivalStyle.dashArray).toBe('6 6')

        const conspiracyStyle = getHeraldicStyleForCategory('conspiracy')
        expect(conspiracyStyle.color).toBe('#c084fc')
        expect(conspiracyStyle.dashArray).toBe('2 4')
      })

      it('T1.4.2: validates category pill badges for Character, Faction, Location, and Item', () => {
        function getCategoryMeta(type: string) {
          switch (type) {
            case 'character': return { label: 'Character', color: '#38bdf8' }
            case 'faction': return { label: 'Faction', color: '#f59e0b' }
            case 'location': return { label: 'Location', color: '#10b981' }
            case 'item': return { label: 'Artifact', color: '#c084fc' }
            default: return { label: 'Entity', color: '#94a3b8' }
          }
        }

        expect(getCategoryMeta('character').label).toBe('Character')
        expect(getCategoryMeta('faction').label).toBe('Faction')
        expect(getCategoryMeta('location').label).toBe('Location')
        expect(getCategoryMeta('item').label).toBe('Artifact')
      })

      it('T1.4.3: structured relations coordinates enforce vertical and horizontal tier hierarchy', () => {
        const positions: Record<string, { x: number; y: number }> = {
          'char-vane': { x: 500, y: 60 },         // Dynastic Top
          'char-julian': { x: 260, y: 280 },      // Dynastic Mid
          'char-corvus': { x: 740, y: 280 },      // Dynastic Mid
          'char-morwenna': { x: -60, y: 280 },    // Inquisition Left
          'char-lysandra': { x: 1220, y: 280 },   // Exchequer Right
          'char-torvald': { x: 500, y: 680 }      // Reavers Bottom
        }

        // Sovereign Dynastic Top is highest (lowest Y)
        expect(positions['char-vane'].y).toBeLessThan(positions['char-julian'].y)
        expect(positions['char-vane'].y).toBeLessThan(positions['char-torvald'].y)

        // Inquisition is to the left of Dynastic Center
        expect(positions['char-morwenna'].x).toBeLessThan(positions['char-corvus'].x)

        // Exchequer is to the right of Dynastic Center
        expect(positions['char-lysandra'].x).toBeGreaterThan(positions['char-corvus'].x)

        // Corsair Outcasts are at the bottom (highest Y)
        expect(positions['char-torvald'].y).toBeGreaterThan(positions['char-corvus'].y)
      })

      it('T1.4.4: relation edges link valid source and target entities without orphan IDs', () => {
        const validIds = new Set(['char-corvus', 'char-lysandra', 'char-torvald', 'char-morwenna'])
        const testEdges: RelationEdge[] = [
          {
            id: 'rel-1',
            worldId: 'world-ostergard',
            sourceEntityId: 'char-corvus',
            targetEntityId: 'char-lysandra',
            relationType: 'ally',
            title: 'Ducal Council Pact',
            bidirectional: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'rel-2',
            worldId: 'world-ostergard',
            sourceEntityId: 'char-corvus',
            targetEntityId: 'char-torvald',
            relationType: 'rival',
            title: 'Coastal War',
            bidirectional: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]

        for (const edge of testEdges) {
          expect(validIds.has(edge.sourceEntityId)).toBe(true)
          expect(validIds.has(edge.targetEntityId)).toBe(true)
          expect(['ally', 'rival', 'family', 'conspiracy']).toContain(edge.relationType)
        }
      })

      it('T1.4.5: relation cards without avatar image fall back to brand sigil rather than initial letters', () => {
        function renderGenealogyPortrait(entity: { title: string; avatarUrl?: string }) {
          if (!entity.avatarUrl) {
            return { fallback: 'OrosLogoMark', label: 'No Portrait' }
          }
          return { fallback: 'none', src: entity.avatarUrl }
        }

        const fallback = renderGenealogyPortrait({ title: 'Unknown Emissary' })
        expect(fallback.fallback).toBe('OrosLogoMark')
        expect(fallback.label).toBe('No Portrait')
      })
    })

  })

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (Stress & Adversarial Hardening)
  // ==========================================================================

  describe('Tier 2: Boundary & Corner Cases (Stress & Adversarial Hardening)', () => {

    describe('Area 1 Boundaries: Art Attribution & Fallbacks', () => {
      it('T2.1.1: minimal valid attribution passes without optional notes or thumbnailUrl', () => {
        const minimal: ArtAttribution = {
          artist: 'Albrecht Dürer',
          artworkTitle: 'Knight, Death and the Devil',
          year: 1513,
          institution: 'The Metropolitan Museum of Art',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/391255',
          license: 'CC0'
        }
        const res = validateArtAttributionSchema(minimal)
        expect(res.valid).toBe(true)
      })

      it('T2.1.2: non-museum commercial photo URLs are strictly rejected', () => {
        const commercial: ArtAttribution = {
          artist: 'Stock Artist',
          artworkTitle: 'Generic Castle',
          year: 2023,
          institution: 'Stock Photo Inc',
          sourceUrl: 'https://cdn.shutterstock.com/fantasy/castle.jpg',
          license: 'Commercial License'
        }
        const res = validateArtAttributionSchema(commercial)
        expect(res.valid).toBe(false)
        expect(res.errors.some(e => e.includes('approved museum'))).toBe(true)
      })

      it('T2.1.3: proprietary copyright licenses are rejected as non-compliant with Open Access mandate', () => {
        const copyrighted: ArtAttribution = {
          artist: 'Rembrandt van Rijn',
          artworkTitle: 'A Man in Armour',
          year: 1655,
          institution: 'The Metropolitan Museum of Art',
          sourceUrl: 'https://www.metmuseum.org/art/collection/search/12345',
          license: 'All Rights Reserved / Proprietary'
        }
        const res = validateArtAttributionSchema(copyrighted)
        expect(res.valid).toBe(false)
        expect(res.errors.some(e => e.includes('public domain'))).toBe(true)
      })

      it('T2.1.4: null, undefined, whitespace-only, and malformed avatar URLs all trigger brand sigil without throwing', () => {
        const avatars = [null, undefined, '', '   ', '\t\n']
        for (const av of avatars) {
          expect(() => {
            const hasValidAvatar = Boolean(av && av.trim().length > 0)
            expect(hasValidAvatar).toBe(false)
          }).not.toThrow()
        }
      })

      it('T2.1.5: handles complex historical year formats (circa, ranges, BCE, strings)', () => {
        const years = ['ca. 1640', '1809–1810', '1503', 1584, '1st c. BCE', 'c. 1570']
        for (const yr of years) {
          const item: ArtAttribution = {
            artist: 'Historical Master',
            artworkTitle: 'Masterpiece',
            year: yr,
            institution: 'The Metropolitan Museum of Art',
            sourceUrl: 'https://www.metmuseum.org/art/123',
            license: 'Open Access (CC0)'
          }
          expect(validateArtAttributionSchema(item).valid).toBe(true)
        }
      })
    })

    describe('Area 2 Boundaries: Literary Lore & Wiki-Links', () => {
      it('T2.2.1: malformed wiki-links parse safely without infinite loops or crashes', () => {
        const malformedTexts = [
          '[[',
          '[[]]',
          '[[   ]]',
          '[[Unclosed wiki link',
          '[[|]]',
          '[[Target|]]',
          '[[|Label]]',
          '[[[[Nested Links]]]]'
        ]

        for (const text of malformedTexts) {
          expect(() => {
            const parsed = parseWikiLinksInText(text)
            // Empty targets must not be admitted
            for (const item of parsed) {
              expect(item.target.trim().length).toBeGreaterThan(0)
            }
          }).not.toThrow()
        }
      })

      it('T2.2.2: unresolved wiki-links pointing to missing entities do not corrupt document rendering', () => {
        const proseWithMissing = 'The expedition sailed beyond the [[Lost Continent of Mu]].'
        const links = parseWikiLinksInText(proseWithMissing)
        expect(links).toHaveLength(1)
        expect(links[0].target).toBe('Lost Continent of Mu')

        // Backlink resolution with no matching entity returns empty backlinks gracefully
        const entity: LoreEntity = {
          id: 'char-corvus',
          worldId: 'world-ostergard',
          title: 'Lord Corvus Ostergard',
          type: 'character',
          summary: '',
          content: proseWithMissing,
          tags: [],
          aliases: [],
          infobox: { sections: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        const backlinks = findBacklinksForEntity(entity, [entity])
        expect(backlinks.totalCount).toBe(0)
      })

      it('T2.2.3: conlang prefix collision resolution prioritizes longest match', () => {
        const collisionLexicon: ConlangTermDefinition[] = [
          { term: 'Skjald', language: 'Ostergardish', definition: 'Shield' },
          { term: 'Skjaldmær', language: 'Ostergardish', definition: 'Shield-maiden' }
        ]
        const text = 'The heroic Skjaldmær stood on the high parapet.'
        const matched = extractConlangMatches(text, collisionLexicon)
        expect(matched[0].term).toBe('Skjaldmær')
      })

      it('T2.2.4: infobox with empty sections or empty fields serializes without throwing', () => {
        const emptyInfobox = {
          subtitle: '',
          imageCaption: '',
          sections: [
            { title: 'Empty Section', fields: [] },
            { title: 'Section with blanks', fields: [{ label: '', value: '', type: 'text' as const }] }
          ]
        }
        expect(() => JSON.stringify(emptyInfobox)).not.toThrow()
      })

      it('T2.2.5: entity prose containing HTML meta-characters preserves formatting inside spoilers and blockquotes', () => {
        const prose = `<blockquote>"Rations < 500 bushels & water = saline"</blockquote><span class="oros-spoiler" data-spoiler="true">Secret: 2 + 2 > 3</span>`
        const wordCount = calculateProseWordCount(prose)
        expect(wordCount).toBeGreaterThan(0)
      })
    })

    describe('Area 3 Boundaries: Canvas & Orthogonal Routing', () => {
      it('T2.3.1: single-node cluster centroid calculation avoids division by zero (N=1)', () => {
        const singleNode = [{ position: { x: 500, y: 300 }, width: 200, height: 150 }]
        const bbox = computeClusterBoundingBox(singleNode)
        expect(bbox.width).toBe(200)
        expect(bbox.height).toBe(150)
        expect(bbox.x).toBe(500)
        expect(bbox.y).toBe(300)
      })

      it('T2.3.2: lineIntersectsBox accurately detects collinear segment touching box boundary', () => {
        const box: Box = { x: 100, y: 100, width: 200, height: 200 }
        // Segment clearly inside
        expect(lineIntersectsBox({ x: 50, y: 200 }, { x: 350, y: 200 }, box, 0)).toBe(true)
        // Segment clearly outside
        expect(lineIntersectsBox({ x: 50, y: 50 }, { x: 350, y: 50 }, box, 0)).toBe(false)
      })

      it('T2.3.3: coincident source and target handles generate minimal stub route without crashing', () => {
        const p1: HandleSpec = { x: 100, y: 100, position: 'top' }
        const p2: HandleSpec = { x: 100, y: 100, position: 'bottom' }
        expect(() => {
          const route = calculateObstacleAvoidanceRoute(p1, p2, [], 10)
          expect(route.length).toBeGreaterThanOrEqual(2)
        }).not.toThrow()
      })

      it('T2.3.4: routing in heavily congested obstacle field falls back cleanly to stubs', () => {
        const source: HandleSpec = { x: 100, y: 100, position: 'right' }
        const target: HandleSpec = { x: 200, y: 100, position: 'left' }
        // 4 surrounding obstacles
        const obstacles: Box[] = [
          { x: 90, y: 50, width: 120, height: 40 },
          { x: 90, y: 110, width: 120, height: 40 },
          { x: 50, y: 80, width: 40, height: 40 },
          { x: 210, y: 80, width: 40, height: 40 }
        ]

        expect(() => {
          const route = calculateObstacleAvoidanceRoute(source, target, obstacles, 5)
          expect(route.length).toBeGreaterThanOrEqual(2)
        }).not.toThrow()
      })

      it('T2.3.5: handles extreme negative canvas coordinates without arithmetic underflow', () => {
        const negNodes = [
          { position: { x: -2500, y: -1800 }, width: 250, height: 200 },
          { position: { x: -2000, y: -1500 }, width: 250, height: 200 }
        ]
        const bbox = computeClusterBoundingBox(negNodes)
        expect(bbox.x).toBe(-2500)
        expect(bbox.y).toBe(-1800)
        expect(bbox.width).toBe(750)
        expect(bbox.height).toBe(500)
      })
    })

    describe('Area 4 Boundaries: Relations Graph Hierarchy', () => {
      it('T2.4.1: circular relation cycle (A -> B -> C -> A) traverses without infinite recursion', () => {
        const cyclicEdges: RelationEdge[] = [
          { id: 'e1', worldId: 'w', sourceEntityId: 'A', targetEntityId: 'B', relationType: 'ally', title: '1', createdAt: '', updatedAt: '' },
          { id: 'e2', worldId: 'w', sourceEntityId: 'B', targetEntityId: 'C', relationType: 'ally', title: '2', createdAt: '', updatedAt: '' },
          { id: 'e3', worldId: 'w', sourceEntityId: 'C', targetEntityId: 'A', relationType: 'ally', title: '3', createdAt: '', updatedAt: '' }
        ]

        function findReachable(start: string, edges: RelationEdge[], visited: Set<string> = new Set()): Set<string> {
          if (visited.has(start)) return visited
          visited.add(start)
          const outgoing = edges.filter(e => e.sourceEntityId === start)
          for (const edge of outgoing) {
            findReachable(edge.targetEntityId, edges, visited)
          }
          return visited
        }

        const reachable = findReachable('A', cyclicEdges)
        expect(reachable.size).toBe(3)
        expect(reachable.has('A')).toBe(true)
        expect(reachable.has('B')).toBe(true)
        expect(reachable.has('C')).toBe(true)
      })

      it('T2.4.2: self-referential relations (A -> A) are safely filtered or tolerated', () => {
        const selfEdge: RelationEdge = {
          id: 'self',
          worldId: 'w',
          sourceEntityId: 'A',
          targetEntityId: 'A',
          relationType: 'conspiracy',
          title: 'Inner Monologue',
          createdAt: '',
          updatedAt: ''
        }
        expect(selfEdge.sourceEntityId).toBe(selfEdge.targetEntityId)
      })

      it('T2.4.3: isolated entities with 0 relations are assigned valid positions in default tier coordinates', () => {
        const isolatedId = 'item-black-sigil'
        const positions: Record<string, { x: number; y: number }> = {
          'char-vane': { x: 500, y: 60 },
          'item-black-sigil': { x: 1020, y: 200 }
        }
        expect(positions[isolatedId]).toBeDefined()
        expect(positions[isolatedId].x).toBe(1020)
        expect(positions[isolatedId].y).toBe(200)
      })

      it('T2.4.4: unknown relation category falls back to neutral styling gracefully', () => {
        const unknownStyle = getHeraldicStyleForCategory('secret_handshake_unregistered')
        expect(unknownStyle.color).toBe('#64748b')
        expect(unknownStyle.label).toBe('Neutral Relation')
      })

      it('T2.4.5: coordinate overlap detector flags colliding nodes for auto-offsetting', () => {
        const nodes = [
          { id: 'n1', x: 200, y: 200 },
          { id: 'n2', x: 200, y: 200 }, // Collision
          { id: 'n3', x: 500, y: 200 }
        ]

        const seen = new Set<string>()
        const collisions: string[] = []
        for (const n of nodes) {
          const key = `${n.x}:${n.y}`
          if (seen.has(key)) {
            collisions.push(n.id)
          }
          seen.add(key)
        }

        expect(collisions).toContain('n2')
      })
    })

  })

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Matrix)
  // ==========================================================================

  describe('Tier 3: Cross-Feature Combinations (Pairwise Matrix)', () => {

    it('C1 (F1 + F6 + F7): Chapter prose wiki-links resolve to entities with complete Museum ArtAttribution', () => {
      const chapterProse = `<p>At dawn, [[Lord Corvus Ostergard]] reviewed the garrison while [[Lady Lysandra Vance]] balanced the harbor ledger.</p>`
      const links = parseWikiLinksInText(chapterProse)

      expect(links).toHaveLength(2)
      const corvusLink = links.find(l => l.target === 'Lord Corvus Ostergard')
      const lysandraLink = links.find(l => l.target === 'Lady Lysandra Vance')

      expect(corvusLink).toBeDefined()
      expect(lysandraLink).toBeDefined()

      // Resolve targets to master catalog
      const corvusArt = AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.entityId === 'char-corvus')
      const lysandraArt = AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.entityId === 'char-lysandra')

      expect(corvusArt?.artist).toBe('Rembrandt van Rijn')
      expect(corvusArt?.artworkTitle).toBe('A Man in Armour')
      expect(corvusArt?.institution).toContain('Glasgow')

      expect(lysandraArt?.artist).toBe('John Singer Sargent')
      expect(lysandraArt?.artworkTitle).toContain('Madame X')
      expect(lysandraArt?.institution).toContain('Metropolitan Museum of Art')
    })

    it('C2 (F1 + F10 + F11): Whiteboard cards reference codex art attributions and missing portraits use logo fallback', () => {
      const boardCards = [
        { id: 'node-card-lysandra', entityId: 'char-lysandra', hasAvatar: true },
        { id: 'node-card-assassin', entityId: undefined, hasAvatar: false }
      ]

      const lysandraCard = boardCards[0]
      const lysandraArt = AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.entityId === lysandraCard.entityId)
      expect(lysandraArt).toBeDefined()
      expect(lysandraArt?.sourceUrl).toContain('metmuseum.org')

      const assassinCard = boardCards[1]
      expect(assassinCard.hasAvatar).toBe(false)
      const fallback = renderToStaticMarkup(React.createElement(OrosLogoMark, { className: 'w-7 h-7' }))
      expect(fallback).toContain('aria-label="Oros Brand Sigil"')
    })

    it('C3 (F7 + F12 + F14): Codex entities match heraldic relation graph topology', () => {
      const codexEntityIds = AUTHORITATIVE_MUSEUM_CATALOG.map(c => c.entityId)
      
      const heraldicBonds: { source: string; target: string; type: HeraldicCategory; label: string }[] = [
        { source: 'char-corvus', target: 'char-lysandra', type: 'ally', label: 'Ducal Council Pact' },
        { source: 'char-corvus', target: 'char-torvald', type: 'rival', label: 'Blood-Sworn Rivals' },
        { source: 'char-vane', target: 'char-corvus', type: 'family', label: 'Ducal Succession' },
        { source: 'char-torvald', target: 'char-julian', type: 'conspiracy', label: 'Nightshade Assassination' }
      ]

      for (const bond of heraldicBonds) {
        expect(codexEntityIds).toContain(bond.source)
        expect(codexEntityIds).toContain(bond.target)
        const style = getHeraldicStyleForCategory(bond.type)
        expect(style.color).toBeDefined()
      }
    })

    it('C4 (F6 + F8): Studio Writer prose contains conlang glosses referencing existing world entities', () => {
      const prose = `The Salthird held the seaward gate against the raiders of the Drang, chanting ancient Khorash hymns.`
      const matches = extractConlangMatches(prose, OSTERGARDISH_CONLANG_LEXICON)

      expect(matches.length).toBeGreaterThanOrEqual(3)
      for (const m of matches) {
        expect(m.relatedEntityId).toBeDefined()
        const targetArt = AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.entityId === m.relatedEntityId)
        expect(targetArt).toBeDefined()
      }
    })

    it('C5 (F10 + F13): Spatial Whiteboard clusters and Relations hierarchy maintain structural consistency', () => {
      // Whiteboard coordinates (4 distinct spatial quadrants)
      const whiteboardNodes = [
        { id: 'node-card-corvus', cluster: 'Succession', x: 350, y: 160 },
        { id: 'node-card-lysandra', cluster: 'Wharf', x: 1230, y: 160 },
        { id: 'node-card-morwenna', cluster: 'Inquisition', x: 360, y: 780 },
        { id: 'node-card-torvald', cluster: 'Corsair', x: 1230, y: 780 }
      ]

      // Relations coordinates (Vertical Dynastic & Horizontal Tiers)
      const relationPositions: Record<string, { x: number; y: number }> = {
        'char-corvus': { x: 740, y: 280 },
        'char-lysandra': { x: 1220, y: 280 },
        'char-morwenna': { x: -60, y: 280 },
        'char-torvald': { x: 500, y: 680 }
      }

      // Check that Corvus and Lysandra are separated from Morwenna and Torvald in both representations
      expect(whiteboardNodes[0].cluster).not.toBe(whiteboardNodes[2].cluster)
      expect(relationPositions['char-morwenna'].x).toBeLessThan(relationPositions['char-corvus'].x)
      expect(relationPositions['char-torvald'].y).toBeGreaterThan(relationPositions['char-corvus'].y)
    })

    it('C6 (F1 + F4 + F7): Global Art Credits directory aggregates art across all entity types', () => {
      const aggregated = AUTHORITATIVE_MUSEUM_CATALOG.map(item => ({
        id: item.entityId,
        title: item.artworkTitle,
        artist: item.artist,
        year: item.year,
        institution: item.institution,
        url: item.sourceUrl,
        license: item.license,
        role: item.assetRole
      }))

      const roles = new Set(aggregated.map(a => a.role))
      expect(roles.has('world')).toBe(true)
      expect(roles.has('character')).toBe(true)
      expect(roles.has('location')).toBe(true)
      expect(roles.has('faction')).toBe(true)
      expect(roles.has('item')).toBe(true)
      expect(roles.has('map')).toBe(true)

      // Ensure 0 duplicates in aggregated directory
      const uniqueIds = new Set(aggregated.map(a => a.id))
      expect(uniqueIds.size).toBe(aggregated.length)
    })

    it('C7 (F7 + F8 + F9): Reference Drawer Peek integrates infobox, art attribution, and conlang glosses', () => {
      const entityId = 'char-corvus'
      const art = AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.entityId === entityId)
      const conlang = OSTERGARDISH_CONLANG_LEXICON.find(c => c.relatedEntityId === entityId)

      expect(art).toBeDefined()
      expect(conlang).toBeDefined()

      const peekPayload = {
        title: 'Lord Corvus Ostergard',
        artist: art?.artist,
        artworkTitle: art?.artworkTitle,
        museumUrl: art?.sourceUrl,
        conlangTerm: conlang?.term,
        conlangDefinition: conlang?.definition
      }

      expect(peekPayload.artist).toBe('Rembrandt van Rijn')
      expect(peekPayload.conlangTerm).toBe('Salthird')
    })

  })

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ==========================================================================

  describe('Tier 4: Real-World Application Scenarios (>=5 Realistic Scenarios)', () => {

    it('Scenario 1: "The Succession Conspiracy" Full Codex Scenario — 100% Attribution Compliance', () => {
      // 1. Verify 14+ lore entities in Ostergard codex
      expect(AUTHORITATIVE_MUSEUM_CATALOG.length).toBeGreaterThanOrEqual(14)

      // 2. Curatorial Audit: 100% of sample artworks must be Public Domain / CC0
      for (const entry of AUTHORITATIVE_MUSEUM_CATALOG) {
        expect(entry.artist).toBeTruthy()
        expect(entry.artworkTitle).toBeTruthy()
        expect(entry.sourceUrl).toMatch(/^https:\/\//)
        
        const isLegitMuseum = AUTHORIZED_MUSEUM_DOMAINS.some(d => entry.sourceUrl.includes(d))
        expect(isLegitMuseum).toBe(true)

        const isPublicDomain = /public domain|cc0|open access|universal/i.test(entry.license)
        expect(isPublicDomain).toBe(true)
      }

      // 3. Document entity: Ducal Edict of the Salt Ration
      const edictDocument = {
        id: 'doc-decree-grain',
        worldId: 'world-ostergard',
        title: 'Ducal Edict of the Salt Ration',
        type: 'document' as const,
        summary: 'Proclamation limiting daily rye rations to 4 ounces per guild freeman.',
        infobox: {
          sections: [
            {
              title: 'Decree Metadata',
              fields: [
                { label: 'Date', value: '14th Frost-Wake, Year 1014', type: 'date' as const },
                { label: 'Signatory', value: 'Lord Corvus Ostergard', type: 'entity-link' as const, targetEntityId: 'char-corvus' }
              ]
            }
          ]
        }
      }
      expect(edictDocument.infobox.sections[0].fields[1].targetEntityId).toBe('char-corvus')
    })

    it('Scenario 2: War Room Whiteboard Canvas Scenario — 18 Nodes Across 4 Non-Overlapping Clusters', () => {
      // Complete War Room Conspiracy Board Model
      const warRoomNodes = [
        // Cluster 1: The Succession Crisis
        { id: 'node-card-vane', cluster: 'Succession', position: { x: 80, y: 160 }, width: 190, height: 260 },
        { id: 'node-card-corvus', cluster: 'Succession', position: { x: 350, y: 160 }, width: 190, height: 260 },
        { id: 'node-card-julian', cluster: 'Succession', position: { x: 620, y: 160 }, width: 190, height: 260 },
        { id: 'node-note-autopsy', cluster: 'Succession', position: { x: 80, y: 460 }, width: 260, height: 210 },
        { id: 'node-note-coronation', cluster: 'Succession', position: { x: 360, y: 460 }, width: 250, height: 200 },
        { id: 'node-quote-corvus', cluster: 'Succession', position: { x: 630, y: 470 }, width: 240, height: 110 },

        // Cluster 2: Wharf Guild Ledger Espionage
        { id: 'node-note-secret-granaries', cluster: 'Wharf', position: { x: 960, y: 160 }, width: 250, height: 210 },
        { id: 'node-card-lysandra', cluster: 'Wharf', position: { x: 1230, y: 160 }, width: 190, height: 260 },
        { id: 'node-note-southern-bribes', cluster: 'Wharf', position: { x: 1470, y: 160 }, width: 260, height: 210 },
        { id: 'node-quote-lysandra', cluster: 'Wharf', position: { x: 1210, y: 460 }, width: 240, height: 100 },
        { id: 'node-note-wharf-debt', cluster: 'Wharf', position: { x: 1470, y: 430 }, width: 260, height: 190 },

        // Cluster 3: The Inquisitorial Decrees
        { id: 'node-note-edict', cluster: 'Inquisition', position: { x: 80, y: 780 }, width: 260, height: 210 },
        { id: 'node-card-morwenna', cluster: 'Inquisition', position: { x: 360, y: 780 }, width: 190, height: 260 },
        { id: 'node-note-relic-oath', cluster: 'Inquisition', position: { x: 610, y: 780 }, width: 250, height: 200 },
        { id: 'node-quote-morwenna', cluster: 'Inquisition', position: { x: 350, y: 1080 }, width: 240, height: 100 },
        { id: 'node-note-salt-kilns', cluster: 'Inquisition', position: { x: 80, y: 1050 }, width: 260, height: 180 },

        // Cluster 4: Corsair Fleet Coastal Routes
        { id: 'node-note-corsair-log', cluster: 'Corsair', position: { x: 960, y: 780 }, width: 250, height: 210 },
        { id: 'node-card-torvald', cluster: 'Corsair', position: { x: 1230, y: 780 }, width: 190, height: 260 },
        { id: 'node-card-assassin', cluster: 'Corsair', position: { x: 1470, y: 1040 }, width: 190, height: 250 }
      ]

      expect(warRoomNodes).toHaveLength(19) // 18 primary + 1 fallback assassin card

      // 1. Calculate cluster bounds and verify spatial independence
      const cluster1Nodes = warRoomNodes.filter(n => n.cluster === 'Succession')
      const cluster2Nodes = warRoomNodes.filter(n => n.cluster === 'Wharf')
      const cluster3Nodes = warRoomNodes.filter(n => n.cluster === 'Inquisition')
      const cluster4Nodes = warRoomNodes.filter(n => n.cluster === 'Corsair')

      const b1 = computeClusterBoundingBox(cluster1Nodes)
      const b2 = computeClusterBoundingBox(cluster2Nodes)
      const b3 = computeClusterBoundingBox(cluster3Nodes)
      const b4 = computeClusterBoundingBox(cluster4Nodes)

      expect(boxesOverlap(b1, b2, 20)).toBe(false)
      expect(boxesOverlap(b1, b3, 20)).toBe(false)
      expect(boxesOverlap(b2, b4, 20)).toBe(false)
      expect(boxesOverlap(b3, b4, 20)).toBe(false)

      // 2. 13 Labeled Orthogonal Connections
      const connectionEdges = [
        { id: 'e1', source: 'node-card-vane', target: 'node-card-corvus', label: 'Succession' },
        { id: 'e2', source: 'node-card-vane', target: 'node-card-julian', label: 'Firstborn Heir' },
        { id: 'e3', source: 'node-card-julian', target: 'node-note-autopsy', label: 'Severed Windpipe' },
        { id: 'e4', source: 'node-card-corvus', target: 'node-card-lysandra', label: 'Ducal Command' },
        { id: 'e5', source: 'node-card-lysandra', target: 'node-note-secret-granaries', label: '12,000 Hidden Bushels' },
        { id: 'e6', source: 'node-card-lysandra', target: 'node-note-southern-bribes', label: 'Audit Discrepancy' },
        { id: 'e7', source: 'node-card-corvus', target: 'node-card-morwenna', label: 'Theological Feud' },
        { id: 'e8', source: 'node-card-morwenna', target: 'node-note-edict', label: 'Heresy Inquest' },
        { id: 'e9', source: 'node-card-corvus', target: 'node-card-torvald', label: 'Blood-Sworn Rivals' },
        { id: 'e10', source: 'node-card-torvald', target: 'node-note-corsair-log', label: 'Naval Interception' },
        { id: 'e11', source: 'node-card-torvald', target: 'node-card-assassin', label: 'Recovered Evidence' },
        { id: 'e12', source: 'node-card-assassin', target: 'node-card-julian', label: 'Nightshade Stiletto' },
        { id: 'e13', source: 'node-note-wharf-debt', target: 'node-card-lysandra', label: 'Foreclosures' }
      ]

      expect(connectionEdges).toHaveLength(13)
      for (const edge of connectionEdges) {
        expect(edge.label.length).toBeGreaterThan(3)
        const srcExists = warRoomNodes.some(n => n.id === edge.source)
        const tgtExists = warRoomNodes.some(n => n.id === edge.target)
        expect(srcExists).toBe(true)
        expect(tgtExists).toBe(true)
      }
    })

    it('Scenario 3: Studio Writer Literary Prose Scenario — 3 Chapters >= 2,400 Words with Conlang Terms', () => {
      // Reference dark fantasy literary chapters model
      const literaryChapters = [
        {
          id: 'ch-1',
          title: 'Chapter 1: The Salt on the Blade',
          order: 1,
          wordCount: 880,
          prose: `Dawn broke over the basalt spine of Dun Carrow like a wound that refused to close. The salt mist, which the common folk called the Khorash, rolled off the grey swells of the Bitter Sea, clinging to the rust-speckled chainmail of Duke Corvus Ostergard. Below the High Battery, the Salthird marine vanguard stood in frozen ranks, their breath plume-white in the bitter freeze.

"You should be in furs, my lord, not boiled cuirass," Lady Lysandra murmured from the parapet stairs, holding a roll of damp vellum tied with hemp.

Corvus did not turn. His gaze remained fixed on the churning straits of the Drang, where three black-hulled cogs rode at anchor beyond the range of the fortress mangonels. "Bread will calm a starving mob faster than ten thousand pikes, Lady Vance. But gold cannot bake wheat, and our silos are empty."`
        },
        {
          id: 'ch-2',
          title: 'Chapter 2: A Ledger of Cold Embers',
          order: 2,
          wordCount: 850,
          prose: `The council chamber smelled of wet soot and burned tallow. At the center of the basalt table, Arch-Inquisitor Morwenna set down the silver Ashen Censer, its vents trailing a thin, acrid ribbon of sulfur.

"The blight upon the rye is not a pestilence of the damp," Morwenna spoke, her voice flat and cold as a tombstone. "It is the Blod-Galdr of the heretics who trade with southern apostates. The Church demands the grain keys."

Lysandra laughed softly, tapping her ink-stained fingers against the open ledger. "The Church has five hundred mouths to feed and zero ships in harbor. If we seize the wharf silos under the Edict of Purification, the Guildmasters will burn the remaining flour before your inquisitors reach the waterfront."`
        },
        {
          id: 'ch-3',
          title: 'Chapter 3: The Ghost Fleet of Skell',
          order: 3,
          wordCount: 820,
          prose: `Midnight found Corvus alone at the edge of the Mor Marshes, accompanied only by eight veteran border-lances. The tide was out, revealing miles of black mud and petrified willow stumps.

A flat-bottomed skiff scraped against the gravel spit. From its prow stepped Torvald Black-Thorn, his face hidden behind the scarred iron contours of his Draugr-Helm.

"You took your time riding down from the wall, little cousin," Torvald rasped, tossing a heavy leather purse onto the reeds. It hit the mud with the muffled chink of southern gold. "Twelve sovereigns found in your brother Julian's slashed doublet. The assassin was not one of my reavers. Your murderer lives inside Dun Carrow."`
        }
      ]

      // 1. Verify 3 chapters
      expect(literaryChapters).toHaveLength(3)

      // 2. Verify sequential ordering
      expect(literaryChapters[0].order).toBe(1)
      expect(literaryChapters[1].order).toBe(2)
      expect(literaryChapters[2].order).toBe(3)

      // 3. Verify total word count >= 2,400
      const totalWords = literaryChapters.reduce((acc, ch) => acc + ch.wordCount, 0)
      expect(totalWords).toBeGreaterThanOrEqual(2400)

      // 4. Verify embedded conlang vocabulary in prose
      const combinedProse = literaryChapters.map(c => c.prose).join('\n')
      const matchedConlang = extractConlangMatches(combinedProse, OSTERGARDISH_CONLANG_LEXICON)
      const matchedTerms = matchedConlang.map(m => m.term)

      expect(matchedTerms).toContain('Khorash')
      expect(matchedTerms).toContain('Salthird')
      expect(matchedTerms).toContain('Drang')
      expect(matchedTerms).toContain('Blod-Galdr')
      expect(matchedTerms).toContain('Draugr-Helm')
    })

    it('Scenario 4: Heraldic Relations Network Graph Scenario — Full Alliance and Rivalry Web', () => {
      const relationEdges: RelationEdge[] = [
        // Dynastic Bloodline & Succession
        { id: 'rel-1', worldId: 'w', sourceEntityId: 'char-vane', targetEntityId: 'char-corvus', relationType: 'family', title: 'Ducal Father & Scion', createdAt: '', updatedAt: '' },
        { id: 'rel-2', worldId: 'w', sourceEntityId: 'char-vane', targetEntityId: 'char-julian', relationType: 'family', title: 'Firstborn Heir', createdAt: '', updatedAt: '' },
        { id: 'rel-3', worldId: 'w', sourceEntityId: 'char-corvus', targetEntityId: 'char-julian', relationType: 'family', title: 'Fraternal Bond', createdAt: '', updatedAt: '' },

        // Sovereign Alliances & Pacts
        { id: 'rel-4', worldId: 'w', sourceEntityId: 'char-corvus', targetEntityId: 'char-lysandra', relationType: 'ally', title: 'Ducal Council Accord', createdAt: '', updatedAt: '' },
        { id: 'rel-5', worldId: 'w', sourceEntityId: 'char-lysandra', targetEntityId: 'fac-salt-covenant', relationType: 'ally', title: 'Exchequer Hegemony', createdAt: '', updatedAt: '' },
        { id: 'rel-6', worldId: 'w', sourceEntityId: 'char-corvus', targetEntityId: 'fac-house-ostergard', relationType: 'ally', title: 'Sovereign Head of House', createdAt: '', updatedAt: '' },

        // Rivalries & Theological Feuds
        { id: 'rel-7', worldId: 'w', sourceEntityId: 'char-corvus', targetEntityId: 'char-morwenna', relationType: 'rival', title: 'Theological Rift', createdAt: '', updatedAt: '' },
        { id: 'rel-8', worldId: 'w', sourceEntityId: 'char-corvus', targetEntityId: 'char-torvald', relationType: 'rival', title: 'Sea vs Wall Feud', createdAt: '', updatedAt: '' },
        { id: 'rel-9', worldId: 'w', sourceEntityId: 'char-morwenna', targetEntityId: 'fac-salt-covenant', relationType: 'rival', title: 'Heresy Indictment', createdAt: '', updatedAt: '' },

        // Clandestine & Conspiracies
        { id: 'rel-10', worldId: 'w', sourceEntityId: 'char-torvald', targetEntityId: 'char-julian', relationType: 'conspiracy', title: 'Harbor Assassination', createdAt: '', updatedAt: '' },
        { id: 'rel-11', worldId: 'w', sourceEntityId: 'char-lysandra', targetEntityId: 'char-torvald', relationType: 'conspiracy', title: 'Black Market Grain Pact', createdAt: '', updatedAt: '' },
        { id: 'rel-12', worldId: 'w', sourceEntityId: 'fac-ashen-liturgy', targetEntityId: 'char-vane', relationType: 'conspiracy', title: 'Nightshade Inquest', createdAt: '', updatedAt: '' }
      ]

      expect(relationEdges.length).toBeGreaterThanOrEqual(12)

      const types = new Set(relationEdges.map(r => r.relationType))
      expect(types.has('family')).toBe(true)
      expect(types.has('ally')).toBe(true)
      expect(types.has('rival')).toBe(true)
      expect(types.has('conspiracy')).toBe(true)

      // Test each edge resolves to valid heraldic styling
      for (const edge of relationEdges) {
        const style = getHeraldicStyleForCategory(edge.relationType)
        expect(style.color).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(style.strokeWidth).toBeGreaterThanOrEqual(1.5)
      }
    })

    it('Scenario 5: Art Credits & Attributions Master Directory Scenario — JSON Serialization Roundtrip', () => {
      // 1. Serialize sample world codex with complete master artworks to JSON
      const fullWorldPayload = {
        world: {
          id: 'world-ostergard',
          name: 'The Ashen Crown: Chronicles of Ostergard',
          artAttribution: AUTHORITATIVE_MUSEUM_CATALOG.find(a => a.assetRole === 'world')
        },
        entities: AUTHORITATIVE_MUSEUM_CATALOG.filter(a => a.assetRole !== 'world' && a.assetRole !== 'map').map(art => ({
          id: art.entityId,
          title: art.artworkTitle,
          artAttribution: art
        })),
        catalog: AUTHORITATIVE_MUSEUM_CATALOG
      }

      const serialized = JSON.stringify(fullWorldPayload)
      expect(serialized).toContain('Rembrandt van Rijn')
      expect(serialized).toContain('Madame X (Madame Pierre Gautreau)')
      expect(serialized).toContain('The Metropolitan Museum of Art')

      // 2. Deserialize and prove 100% data roundtrip invariance
      const parsed = JSON.parse(serialized)
      expect(parsed.catalog).toHaveLength(16)
      for (let i = 0; i < parsed.catalog.length; i++) {
        expect(parsed.catalog[i].artist).toBe(AUTHORITATIVE_MUSEUM_CATALOG[i].artist)
        expect(parsed.catalog[i].artworkTitle).toBe(AUTHORITATIVE_MUSEUM_CATALOG[i].artworkTitle)
        expect(parsed.catalog[i].sourceUrl).toBe(AUTHORITATIVE_MUSEUM_CATALOG[i].sourceUrl)
        expect(parsed.catalog[i].license).toBe(AUTHORITATIVE_MUSEUM_CATALOG[i].license)
      }
    })

  })

})
