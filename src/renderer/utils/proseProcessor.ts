import { LoreEntity, ConlangLanguage, ConlangWord } from '@shared/types'

export interface ResolvedConlangTerm {
  word: ConlangWord
  langName: string
  langColor?: string
  langFamily?: string
}

/**
 * Resolves an entity from a world's entity list by ID, title, or alias.
 */
export function resolveEntityFromLink(
  entities: LoreEntity[],
  id?: string | null,
  titleOrAlias?: string | null
): LoreEntity | undefined {
  if (!entities || entities.length === 0) return undefined

  if (id) {
    const byId = entities.find((e) => e.id === id)
    if (byId) return byId
  }

  if (titleOrAlias) {
    const clean = titleOrAlias
      .replace(/^\[\[/, '')
      .replace(/\]\]$/, '')
      .split('|')[0]
      .split('#')[0]
      .trim()
      .toLowerCase()

    if (!clean) return undefined

    return entities.find(
      (e) =>
        e.title.trim().toLowerCase() === clean ||
        e.aliases?.some((a) => a.trim().toLowerCase() === clean)
    )
  }

  return undefined
}

/**
 * Resolves a Conlang vocabulary word across all languages in the active world.
 */
export function resolveConlangTerm(
  conlangs: ConlangLanguage[],
  termText?: string | null,
  langHint?: string | null
): ResolvedConlangTerm | undefined {
  if (!conlangs || conlangs.length === 0 || !termText) return undefined
  const cleanTerm = termText.trim().toLowerCase()
  if (!cleanTerm) return undefined

  for (const lang of conlangs) {
    if (langHint && lang.name.toLowerCase() !== langHint.toLowerCase() && lang.id !== langHint) {
      continue
    }
    const found = (lang.words || []).find((w) => w.term.trim().toLowerCase() === cleanTerm)
    if (found) {
      return {
        word: found,
        langName: lang.name,
        langColor: lang.color,
        langFamily: lang.family
      }
    }
  }

  // Fallback without langHint if not found
  if (langHint) {
    for (const lang of conlangs) {
      const found = (lang.words || []).find((w) => w.term.trim().toLowerCase() === cleanTerm)
      if (found) {
        return {
          word: found,
          langName: lang.name,
          langColor: lang.color,
          langFamily: lang.family
        }
      }
    }
  }

  return undefined
}

const RAW_WIKI_LINK_REGEX = /\[\[([^\]|#\n]+)(?:#([^\]|\n]+))?(?:\|([^\]\n]+))?\]\]/g

/**
 * Converts raw `[[Target]]`, `[[Target#Section]]`, `[[Target|Label]]` into
 * `<span class="oros-wiki-link" data-type="wiki-link" ...>Display</span>`
 * and strips `[[` / `]]` brackets from any existing `.oros-wiki-link` elements.
 */
export function normalizeWikiLinksInHtml(html: string, entities: LoreEntity[] = []): string {
  if (!html) return ''

  // First replace raw [[...]] outside of HTML tag attributes
  const withSpans = html.replace(
    RAW_WIKI_LINK_REGEX,
    (_full, rawTarget: string, rawSection?: string, rawLabel?: string) => {
      const target = (rawTarget || '').trim()
      if (!target) return _full
      const section = rawSection ? rawSection.trim() : ''
      const label = rawLabel ? rawLabel.trim() : ''
      const resolved = resolveEntityFromLink(entities, null, target)
      const display = label || (section ? `${target} § ${section}` : target)

      const attrs: string[] = [
        'class="oros-wiki-link"',
        'data-type="wiki-link"',
        `data-title="${escapeAttr(target)}"`
      ]
      if (resolved?.id) {
        attrs.push(`data-id="${escapeAttr(resolved.id)}"`)
      }
      if (section) {
        attrs.push(`data-section="${escapeAttr(section)}"`)
      }
      if (label) {
        attrs.push(`data-label="${escapeAttr(label)}"`)
      }
      return `<span ${attrs.join(' ')}>${escapeHtml(display)}</span>`
    }
  )

  if (typeof DOMParser === 'undefined') {
    return withSpans
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(withSpans, 'text/html')

  // Clean existing .oros-wiki-link spans so they never show raw [[ ]] brackets
  const wikiLinks = doc.querySelectorAll('.oros-wiki-link, span[data-type="wiki-link"]')
  wikiLinks.forEach((el) => {
    el.classList.add('oros-wiki-link')
    el.setAttribute('data-type', 'wiki-link')
    el.removeAttribute('title')

    const rawText = (el.textContent || '').replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
    let targetTitle = el.getAttribute('data-title') || ''
    let section = el.getAttribute('data-section') || ''
    let label = el.getAttribute('data-label') || ''

    // If rawText had | or # inside
    if (!targetTitle && rawText) {
      const pipeParts = rawText.split('|')
      const leftPart = pipeParts[0].trim()
      if (pipeParts[1] && !label) {
        label = pipeParts[1].trim()
      }
      const hashParts = leftPart.split('#')
      targetTitle = hashParts[0].trim()
      if (hashParts[1] && !section) {
        section = hashParts[1].trim()
      }
    }

    if (targetTitle) {
      el.setAttribute('data-title', targetTitle)
    }
    if (section) {
      el.setAttribute('data-section', section)
    }
    if (label) {
      el.setAttribute('data-label', label)
    }

    const resolved = resolveEntityFromLink(entities, el.getAttribute('data-id'), targetTitle || rawText)
    if (resolved) {
      el.setAttribute('data-id', resolved.id)
      el.removeAttribute('data-broken')
    }

    const cleanDisplay = label || (section ? `${targetTitle || rawText} § ${section}` : (targetTitle || rawText || 'Entity'))
    el.textContent = cleanDisplay
  })

  return doc.body.innerHTML
}

/**
 * Full prose processor for reading views (WikiArticleView, CodexReaderView, StudioWriter Reference Drawer).
 * Normalizes wiki links, strips brackets, injects heading IDs if requested, and highlights Conlang terms.
 */
export function enrichProseHtml(
  html: string,
  entities: LoreEntity[] = [],
  conlangs: ConlangLanguage[] = [],
  options?: { injectHeadingIds?: boolean }
): { processedHtml: string; tocItems: { id: string; text: string; level: number }[] } {
  if (!html) return { processedHtml: '', tocItems: [] }

  const normalizedHtml = normalizeWikiLinksInHtml(html, entities)
  if (typeof DOMParser === 'undefined') {
    return { processedHtml: normalizedHtml, tocItems: [] }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(normalizedHtml, 'text/html')
  const tocItems: { id: string; text: string; level: number }[] = []

  if (options?.injectHeadingIds) {
    const headings = doc.querySelectorAll('h1, h2, h3, h4')
    headings.forEach((heading, idx) => {
      const text = heading.textContent?.trim() || ''
      if (!text) return
      const slug = `sec-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      heading.setAttribute('id', slug)
      heading.classList.add('scroll-mt-6')
      tocItems.push({
        id: slug,
        text,
        level: parseInt(heading.tagName.substring(1), 10)
      })
    })
  }

  // Ensure any existing .oros-conlang-term elements have data-conlang-term and no raw title attribute
  doc.querySelectorAll('.oros-conlang-term').forEach((el) => {
    el.removeAttribute('title')
    el.removeAttribute('data-tooltip')
    const termText = el.getAttribute('data-conlang-term') || el.textContent?.trim() || ''
    if (termText) {
      el.setAttribute('data-conlang-term', termText)
    }
  })

  // Collect all registered Conlang terms (sorted longest first so multi-word or longer roots match first)
  const conlangTerms: { term: string; langName: string; langId: string }[] = []
  conlangs.forEach((lang) => {
    ;(lang.words || []).forEach((w) => {
      const t = w.term?.trim()
      if (t && t.length >= 2) {
        conlangTerms.push({ term: t, langName: lang.name, langId: lang.id })
      }
    })
  })

  conlangTerms.sort((a, b) => b.term.length - a.term.length)

  if (conlangTerms.length > 0) {
    highlightConlangTermsInDom(doc.body, conlangTerms)
  }

  return {
    processedHtml: doc.body.innerHTML,
    tocItems
  }
}

function highlightConlangTermsInDom(
  root: HTMLElement,
  terms: { term: string; langName: string; langId: string }[]
) {
  const escapedAlternation = terms
    .map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  if (!escapedAlternation) return

  // Match whole word / phrase boundaries (handling apostrophes or hyphens inside conlang words)
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapedAlternation})(?=$|[^\\p{L}\\p{N}_])`, 'giu')
  const termLookup = new Map<string, { term: string; langName: string; langId: string }>()
  terms.forEach((t) => {
    const key = t.term.toLowerCase()
    if (!termLookup.has(key)) {
      termLookup.set(key, t)
    }
  })

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (
        parent.closest(
          '.oros-wiki-link, .oros-mention, .oros-conlang-term, code, pre, script, style, h1, h2, h3, h4, h5, h6'
        )
      ) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const textNodes: Text[] = []
  let currentNode = walker.nextNode()
  while (currentNode) {
    textNodes.push(currentNode as Text)
    currentNode = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue
    if (!text) continue
    regex.lastIndex = 0
    if (!regex.test(text)) continue

    regex.lastIndex = 0
    const fragment = document.createDocumentFragment()
    let lastIdx = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const prefix = match[1] || ''
      const matchedWord = match[2]
      const matchStart = match.index + prefix.length

      if (matchStart > lastIdx) {
        fragment.appendChild(document.createTextNode(text.slice(lastIdx, matchStart)))
      }

      const info = termLookup.get(matchedWord.toLowerCase())
      const span = document.createElement('span')
      span.className = 'oros-conlang-term'
      span.setAttribute('data-conlang-term', info?.term || matchedWord)
      if (info?.langName) {
        span.setAttribute('data-conlang-lang', info.langName)
      }
      span.textContent = matchedWord
      fragment.appendChild(span)

      lastIdx = matchStart + matchedWord.length
    }

    if (lastIdx < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIdx)))
    }

    textNode.parentNode?.replaceChild(fragment, textNode)
  }
}

function escapeAttr(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
