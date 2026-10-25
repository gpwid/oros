import { LoreEntity, DirectoryFolder, DirectoryItem, ObsidianExportResult, ObsidianImportResult } from '@shared/types'

export type { ObsidianExportResult, ObsidianImportResult }

/**
 * Replaces illegal filename characters on Windows and Unix: : / \ ? * " < > |
 */
export function sanitizeFilename(title: string): string {
  if (!title) return 'Untitled'
  let sanitized = title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.]+$/, '')

  if (!sanitized) {
    sanitized = 'Untitled'
  }

  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(sanitized)) {
    sanitized = `${sanitized}_`
  }

  return sanitized
}

/**
 * Serializes LoreEntity metadata and infobox schema to YAML frontmatter string
 */
export function serializeFrontmatter(entity: LoreEntity, originalTitle?: string): string {
  const lines: string[] = ['---']

  lines.push(`id: "${entity.id}"`)
  lines.push(`title: "${entity.title.replace(/"/g, '\\"')}"`)
  if (originalTitle) {
    lines.push(`originalTitle: "${originalTitle.replace(/"/g, '\\"')}"`)
  }
  lines.push(`type: "${entity.type}"`)
  lines.push(`isSecret: ${Boolean(entity.isSecret)}`)
  lines.push(`createdAt: "${entity.createdAt || new Date().toISOString()}"`)
  lines.push(`updatedAt: "${entity.updatedAt || new Date().toISOString()}"`)

  if (entity.summary) {
    lines.push(`summary: "${entity.summary.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`)
  }
  const avatar = entity.avatarUrl || entity.avatar
  if (avatar) {
    lines.push(`avatar: "${avatar}"`)
  }
  const banner = entity.bannerUrl || entity.banner
  if (banner) {
    lines.push(`banner: "${banner}"`)
  }

  // Tags
  if (entity.tags && entity.tags.length > 0) {
    lines.push('tags:')
    entity.tags.forEach(t => lines.push(`  - "${t.replace(/"/g, '\\"')}"`))
  } else {
    lines.push('tags: []')
  }

  // Aliases
  if (entity.aliases && entity.aliases.length > 0) {
    lines.push('aliases:')
    entity.aliases.forEach(a => lines.push(`  - "${a.replace(/"/g, '\\"')}"`))
  } else {
    lines.push('aliases: []')
  }

  // Structured Infobox
  if (entity.infobox) {
    lines.push('infobox:')
    if (entity.infobox.subtitle) {
      lines.push(`  subtitle: "${entity.infobox.subtitle.replace(/"/g, '\\"')}"`)
    }
    if (entity.infobox.sections && entity.infobox.sections.length > 0) {
      lines.push('  sections:')
      entity.infobox.sections.forEach(sec => {
        lines.push(`    - title: "${sec.title.replace(/"/g, '\\"')}"`)
        lines.push('      fields:')
        const fields = sec.fields || []
        fields.forEach(f => {
          lines.push(`        - id: "${f.id}"`)
          lines.push(`          label: "${f.label.replace(/"/g, '\\"')}"`)
          lines.push(`          value: "${String(f.value ?? '').replace(/"/g, '\\"')}"`)
          lines.push(`          type: "${f.type}"`)
          if (f.targetEntityId) {
            lines.push(`          targetEntityId: "${f.targetEntityId}"`)
          }
        })
      })
    }
  }

  // Custom frontmatter / catch-all
  const customProps = (entity as any).customProperties
  if (customProps && typeof customProps === 'object' && Object.keys(customProps).length > 0) {
    lines.push('customProperties:')
    for (const [k, v] of Object.entries(customProps)) {
      lines.push(`  ${k}: ${JSON.stringify(v)}`)
    }
  }

  lines.push('---')
  return lines.join('\n')
}

/**
 * Parses YAML frontmatter block from markdown document
 */
export function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: markdown }
  }

  const rawYaml = match[1]
  const body = match[2].replace(/^\r?\n+/, '')
  const frontmatter: Record<string, any> = {}

  // Lightweight resilient YAML parser for standard key-value, lists, and nested objects
  const lines = rawYaml.split(/\r?\n/)
  let currentListKey: string | null = null
  let currentObjectKey: string | null = null
  let currentInfobox: any = null
  let currentSection: any = null
  let currentField: any = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) continue

    // Top-level key
    const topKeyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (topKeyMatch && !line.startsWith(' ')) {
      const key = topKeyMatch[1]
      const val = topKeyMatch[2].trim()

      if (val === '[]') {
        frontmatter[key] = []
        currentListKey = null
        currentObjectKey = null
      } else if (val === '{}') {
        frontmatter[key] = {}
        currentListKey = null
        currentObjectKey = null
      } else if (val === '') {
        currentListKey = key
        currentObjectKey = key
        if (key === 'infobox') {
          currentInfobox = { sections: [] }
          frontmatter.infobox = currentInfobox
        } else if (key === 'customProperties') {
          frontmatter.customProperties = {}
        } else {
          frontmatter[key] = []
        }
      } else {
        currentListKey = null
        currentObjectKey = null
        let parsedVal: any = val.replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
        if (parsedVal === 'true') parsedVal = true
        else if (parsedVal === 'false') parsedVal = false
        else if (key !== 'id' && key !== 'title' && key !== 'originalTitle' && !isNaN(Number(parsedVal)) && parsedVal !== '') {
          parsedVal = Number(parsedVal)
        }
        frontmatter[key] = parsedVal
      }
      continue
    }

    // List item (e.g. "  - value")
    const listMatch = line.match(/^\s+-\s*(.*)$/)
    if (listMatch && currentListKey && Array.isArray(frontmatter[currentListKey])) {
      const rawItem = listMatch[1].trim()
      const itemVal = rawItem.replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
      frontmatter[currentListKey].push(itemVal)
      continue
    }

    // Object key-value under customProperties
    if (currentObjectKey === 'customProperties' && line.startsWith('  ') && !line.trim().startsWith('-')) {
      const propMatch = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
      if (propMatch) {
        const pKey = propMatch[1]
        let pVal: any = propMatch[2].trim()
        try {
          pVal = JSON.parse(pVal)
        } catch {
          pVal = pVal.replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
        }
        if (!frontmatter.customProperties) frontmatter.customProperties = {}
        frontmatter.customProperties[pKey] = pVal
        continue
      }
    }

    // Infobox parsing
    const subMatch = line.match(/^\s*subtitle:\s*(.*)$/)
    const secTitleMatch = line.match(/^\s*-\s*title:\s*(.*)$/)
    const fieldIdMatch = line.match(/^\s*-\s*id:\s*(.*)$/)
    const labelMatch = line.match(/^\s*label:\s*(.*)$/)
    const valueMatch = line.match(/^\s*value:\s*(.*)$/)
    const typeMatch = line.match(/^\s*type:\s*(.*)$/)
    const targetMatch = line.match(/^\s*targetEntityId:\s*(.*)$/)

    if (subMatch) {
      const sub = subMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
      if (currentInfobox) currentInfobox.subtitle = sub
    } else if (secTitleMatch) {
      const title = secTitleMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
      currentSection = { title, fields: [] }
      if (currentInfobox) currentInfobox.sections.push(currentSection)
    } else if (fieldIdMatch) {
      const id = fieldIdMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
      currentField = { id }
      if (currentSection) currentSection.fields.push(currentField)
    } else if (currentField && labelMatch) {
      currentField.label = labelMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
    } else if (currentField && valueMatch) {
      currentField.value = valueMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
    } else if (currentField && typeMatch) {
      currentField.type = typeMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
    } else if (currentField && targetMatch) {
      currentField.targetEntityId = targetMatch[1].trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
    }
  }

  return { frontmatter, body }
}

/**
 * Translates HTML mentions into Obsidian [[wiki-links]]
 */
export function htmlContentToObsidianMarkdown(html: string): string {
  if (!html) return ''

  return html
    // TipTap mentions: <span data-type="mention" data-id="xyz" data-label="Title">@Title</span> -> [[Title]]
    .replace(/<span[^>]*data-type="mention"[^>]*data-label="([^"]+)"[^>]*>.*?<\/span>/gi, '[[$1]]')
    // WikiLink span: <span class="oros-wiki-link" data-type="wiki-link" data-id="xyz" data-title="Title">[[Title]]</span> -> [[Title]]
    .replace(/<span[^>]*data-type="wiki-link"[^>]*data-title="([^"]+)"[^>]*>.*?<\/span>/gi, '[[$1]]')
    // Simple HTML paragraphs to markdown
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Translates Obsidian markdown body to TipTap-ready HTML content
 */
export function obsidianMarkdownToHtmlContent(
  markdown: string,
  entityTitleToIdMap: Map<string, string>
): string {
  if (!markdown) return ''

  // Protect code blocks and inline code from wiki-link and formatting transformation
  const codeBlocks: string[] = []
  let text = markdown
    // Fenced code blocks ```...```
    .replace(/```[\s\S]*?```/g, match => {
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`
      codeBlocks.push(match)
      return placeholder
    })
    // Inline code spans `...`
    .replace(/`[^`\r\n]+`/g, match => {
      const placeholder = `___INLINE_CODE_${codeBlocks.length}___`
      codeBlocks.push(match)
      return placeholder
    })

  let html = text
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Convert [[Target]] and [[Target|Label]] to TipTap mention spans
  html = html.replace(/\[\[([^#\|\]]+)(?:#([^\|\]]+))?(?:\|([^\]]+))?\]\]/g, (_match, target, _sec, label) => {
    const t = target.trim()
    if (!t) return _match
    const l = label ? label.trim() : t
    const foundId = entityTitleToIdMap.get(t.toLowerCase()) || `temp-${t.toLowerCase().replace(/\s+/g, '-')}`
    return `<span data-type="mention" data-id="${foundId}" data-label="${l}">@${l}</span>`
  })

  // Restore protected code blocks
  codeBlocks.forEach((code, index) => {
    html = html.replace(`___CODE_BLOCK_${index}___`, () => code)
    html = html.replace(`___INLINE_CODE_${index}___`, () => code)
  })

  // Wrap paragraphs
  const paragraphs = html.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  return paragraphs.map(p => {
    if (p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3')) return p
    return `<p>${p}</p>`
  }).join('')
}

/**
 * Exports complete Oros world vault to Obsidian directory file tree
 */
export function exportWorldToObsidianFiles(
  worldName: string,
  entities: LoreEntity[],
  folders: DirectoryFolder[] = [],
  directoryItems: DirectoryItem[] = []
): ObsidianExportResult {
  const files: Record<string, string> = {}
  const folderPathMap = new Map<string, string>()

  // Build folder hierarchy paths
  const folderMap = new Map(folders.map(f => [f.id, f]))

  function getFolderPath(folderId: string, visited: Set<string> = new Set()): string {
    if (folderPathMap.has(folderId)) return folderPathMap.get(folderId)!
    const folder = folderMap.get(folderId)
    if (!folder) return ''
    if (visited.has(folderId) || folder.parentId === folderId) {
      const selfPath = sanitizeFilename(folder.name)
      folderPathMap.set(folderId, selfPath)
      return selfPath
    }
    visited.add(folderId)
    const parentPath = folder.parentId ? getFolderPath(folder.parentId, visited) : ''
    const path = parentPath ? `${parentPath}/${sanitizeFilename(folder.name)}` : sanitizeFilename(folder.name)
    folderPathMap.set(folderId, path)
    return path
  }

  folders.forEach(f => getFolderPath(f.id))

  // Map directoryItems to find folder for each entity
  const entityFolderMap = new Map<string, string>()
  directoryItems.forEach(item => {
    const targetEntityId = item.entityId || item.targetId
    if (targetEntityId && item.folderId) {
      const path = getFolderPath(item.folderId)
      if (path) entityFolderMap.set(targetEntityId, path)
    }
  })

  // Default type-based directory names
  const typeFolderDefaults: Record<string, string> = {
    character: 'Characters',
    location: 'Locations',
    faction: 'Factions',
    item: 'Items',
    event: 'Events',
    lore: 'Lore',
    creature: 'Creatures',
    concept: 'Concepts',
    magic_system: 'Magic Systems',
    species: 'Species',
    religion: 'Religions',
    document: 'Documents'
  }

  const exportedEntityIds: string[] = []

  entities.forEach(entity => {
    const folderDir = entityFolderMap.get(entity.id) || typeFolderDefaults[entity.type] || 'Lore'
    const cleanFilename = sanitizeFilename(entity.title)
    let filePath = `${folderDir}/${cleanFilename}.md`

    if (files[filePath]) {
      let candidate = `${folderDir}/${cleanFilename}_${entity.id.slice(0, 6)}.md`
      let counter = 2
      while (files[candidate]) {
        candidate = `${folderDir}/${cleanFilename}_${entity.id.slice(0, 6)}_${counter}.md`
        counter++
      }
      filePath = candidate
    }

    const originalTitle = cleanFilename !== entity.title ? entity.title : (entity as any).originalTitle
    const frontmatter = serializeFrontmatter(entity, originalTitle)
    const markdownBody = htmlContentToObsidianMarkdown(entity.content || '')
    const fileContent = `${frontmatter}\n\n${markdownBody}`

    files[filePath] = fileContent
    exportedEntityIds.push(entity.id)
  })

  return {
    files,
    manifest: {
      totalFiles: Object.keys(files).length,
      folders: Array.from(new Set(Object.keys(files).map(k => k.split('/').slice(0, -1).join('/')))).filter(Boolean),
      exportedEntityIds
    }
  }
}

/**
 * Imports Obsidian markdown files and restores full world structure
 */
export function importObsidianFilesToWorld(
  files: Record<string, string>
): ObsidianImportResult {
  const entities: LoreEntity[] = []
  const folders: DirectoryFolder[] = []
  const directoryItems: DirectoryItem[] = []

  const createdFolderPaths = new Map<string, string>() // path -> folderId
  const entityTitleMap = new Map<string, string>() // lowercase title -> entityId
  const fileIdMap = new Map<string, string>() // filePath -> entityId
  let autoIdCounter = 1

  // First pass: extract entities and titles
  for (const [filePath, content] of Object.entries(files)) {
    if (!filePath.endsWith('.md')) continue
    const { frontmatter } = parseFrontmatter(content)
    const title = frontmatter.originalTitle || frontmatter.title || filePath.split('/').pop()?.replace('.md', '') || 'Untitled'
    const id = frontmatter.id || `entity-${autoIdCounter++}`
    fileIdMap.set(filePath, id)
    entityTitleMap.set(title.toLowerCase(), id)
    if (frontmatter.title && frontmatter.title !== title) {
      entityTitleMap.set(String(frontmatter.title).toLowerCase(), id)
    }
    if (Array.isArray(frontmatter.aliases)) {
      frontmatter.aliases.forEach((a: string) => entityTitleMap.set(a.toLowerCase(), id))
    }
  }

  // Helper to ensure folder path exists
  function ensureFolderPath(folderPath: string): string {
    if (!folderPath) return ''
    if (createdFolderPaths.has(folderPath)) return createdFolderPaths.get(folderPath)!

    const parts = folderPath.split('/')
    let currentPath = ''
    let parentId: string | null = null

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      if (createdFolderPaths.has(currentPath)) {
        parentId = createdFolderPaths.get(currentPath)!
      } else {
        const folderId = `folder-${folders.length + 1}`
        folders.push({
          id: folderId,
          worldId: 'imported-world',
          name: part,
          parentId,
          order: folders.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        createdFolderPaths.set(currentPath, folderId)
        parentId = folderId
      }
    }

    return parentId || ''
  }

  // Second pass: full entity reconstitution
  for (const [filePath, content] of Object.entries(files)) {
    if (!filePath.endsWith('.md')) continue

    const { frontmatter, body } = parseFrontmatter(content)
    const title = frontmatter.originalTitle || frontmatter.title || filePath.split('/').pop()?.replace('.md', '') || 'Untitled'
    const id = fileIdMap.get(filePath) || frontmatter.id || `entity-${entities.length + 1}`
    const type = frontmatter.type || 'lore'
    const htmlContent = obsidianMarkdownToHtmlContent(body, entityTitleMap)

    const avatar = frontmatter.avatar || frontmatter.avatarUrl
    const banner = frontmatter.banner || frontmatter.bannerUrl

    const entity: LoreEntity = {
      id,
      worldId: 'imported-world',
      title,
      type,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
      summary: frontmatter.summary || '',
      content: htmlContent,
      avatar,
      banner,
      avatarUrl: avatar,
      bannerUrl: banner,
      isSecret: Boolean(frontmatter.isSecret),
      infobox: frontmatter.infobox || undefined,
      createdAt: frontmatter.createdAt || new Date().toISOString(),
      updatedAt: frontmatter.updatedAt || new Date().toISOString()
    }

    if (frontmatter.customProperties) {
      entity.customProperties = frontmatter.customProperties
    }

    entities.push(entity)

    // Map folder
    const folderSegments = filePath.split('/')
    if (folderSegments.length > 1) {
      const folderPath = folderSegments.slice(0, -1).join('/')
      const folderId = ensureFolderPath(folderPath)
      if (folderId) {
        directoryItems.push({
          id: `item-${directoryItems.length + 1}`,
          worldId: 'imported-world',
          name: title,
          type: 'card',
          folderId,
          targetId: id,
          entityId: id,
          order: directoryItems.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }
  }

  return {
    entities,
    folders,
    directoryItems
  }
}
