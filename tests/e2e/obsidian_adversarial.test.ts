import { describe, it, expect } from 'vitest'
import { LoreEntity, DirectoryFolder, DirectoryItem } from '@shared/types'
import {
  exportWorldToObsidianFiles,
  importObsidianFilesToWorld,
  serializeFrontmatter,
  parseFrontmatter,
  sanitizeFilename,
  htmlContentToObsidianMarkdown,
  obsidianMarkdownToHtmlContent
} from './helpers/obsidianBridgeHelper'

describe('Obsidian Bridge Adversarial Stress Suite', () => {
  const createEntity = (id: string, title: string, options: Partial<LoreEntity> = {}): LoreEntity => ({
    id,
    worldId: 'world-adv-m5',
    title,
    type: 'character',
    tags: ['adversarial'],
    aliases: ['adv-alias'],
    summary: 'Adversarial entity summary.',
    content: '<p>Content with mentions.</p>',
    isSecret: false,
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    ...options
  })

  // =========================================================================
  // 1. EXTREME FILENAME SANITIZATION & WINDOWS FILESYSTEM SAFETY
  // =========================================================================

  describe('1. Extreme Filename Sanitization & Windows Filesystem Safety', () => {
    it('ADV.1.1: sanitizes strings containing only illegal punctuation', () => {
      const result = sanitizeFilename('<>:"/\\|?*')
      expect(result).toBe('_________')
      expect(/[<>:"/\\|?*]/.test(result)).toBe(false)
    })

    it('ADV.1.2: handles emojis and unicode symbols in filenames', () => {
      const emojiTitle = '🐉 Dragon Realm 🛡️ & ✨ Magic'
      const sanitized = sanitizeFilename(emojiTitle)
      expect(sanitized).toBe('🐉 Dragon Realm 🛡️ & ✨ Magic')

      const pureEmoji = '👑🗡️'
      expect(sanitizeFilename(pureEmoji)).toBe('👑🗡️')
    })

    it('ADV.1.3: handles whitespace-only strings without producing empty filename', () => {
      // VULNERABILITY: sanitizeFilename('   ') returns "" which leads to ".md" filename
      const result = sanitizeFilename('   \t\n  ')
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toBe('')
    })

    it('ADV.1.4: tests trailing dots and spaces in filenames (Windows forbidden)', () => {
      // VULNERABILITY: Windows prohibits filenames ending in '.' or ' '
      const titleWithTrailingDot = 'My Document.'
      const sanitized = sanitizeFilename(titleWithTrailingDot)
      expect(sanitized.endsWith('.')).toBe(false)
    })

    it('ADV.1.5: tests Windows reserved device names (CON, PRN, AUX, NUL, COM1, LPT1)', () => {
      // VULNERABILITY: Windows reserved names crash filesystem operations on Windows NTFS
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1', 'aux', 'nul']
      for (const name of reservedNames) {
        const sanitized = sanitizeFilename(name)
        expect(sanitized.toUpperCase()).not.toBe(name.toUpperCase())
      }
    })

    it('ADV.1.6: handles path with multiple consecutive slashes on export', () => {
      const entity = createEntity('e-slashes', 'Slash Entity')
      const folders: DirectoryFolder[] = [
        { id: 'f-root', worldId: 'w', name: 'Root//Dir///Sub', parentId: null, order: 0 }
      ]
      const items: DirectoryItem[] = [
        { id: 'it-1', worldId: 'w', folderId: 'f-root', entityId: 'e-slashes', order: 0 }
      ]

      const exported = exportWorldToObsidianFiles('World', [entity], folders, items)
      const filePaths = Object.keys(exported.files)
      expect(filePaths).toHaveLength(1)
      expect(filePaths[0]).not.toContain('//')
    })
  })

  // =========================================================================
  // 2. HIGHLY NESTED DIRECTORY TREES & CIRCULAR PARENT FOLDERS
  // =========================================================================

  describe('2. Directory Trees: Deep Hierarchies & Circular References', () => {
    it('ADV.2.1: handles deep directory hierarchies (depth >= 15) without truncation or error', () => {
      const depth = 15
      const folders: DirectoryFolder[] = []
      for (let i = 0; i < depth; i++) {
        folders.push({
          id: `f-${i}`,
          worldId: 'w',
          name: `Level_${i}`,
          parentId: i === 0 ? null : `f-${i - 1}`,
          order: i
        })
      }
      const entity = createEntity('e-deep', 'Deep Lore Entity')
      const items: DirectoryItem[] = [
        { id: 'it-deep', worldId: 'w', folderId: `f-${depth - 1}`, entityId: 'e-deep', order: 0 }
      ]

      const exported = exportWorldToObsidianFiles('World', [entity], folders, items)
      const expectedPath = folders.map(f => f.name).join('/') + '/Deep Lore Entity.md'
      expect(exported.files[expectedPath]).toBeDefined()

      const imported = importObsidianFilesToWorld(exported.files)
      expect(imported.entities).toHaveLength(1)
      expect(imported.folders.length).toBeGreaterThanOrEqual(depth)
      expect(imported.directoryItems).toHaveLength(1)
    })

    it('ADV.2.2: circular parent folder references must not cause RangeError / stack overflow', () => {
      // CRITICAL CRASH: getFolderPath infinitely recurses on circular parent references
      const circularFolders: DirectoryFolder[] = [
        { id: 'f-a', worldId: 'w', name: 'Folder_A', parentId: 'f-b', order: 0 },
        { id: 'f-b', worldId: 'w', name: 'Folder_B', parentId: 'f-a', order: 0 }
      ]
      const entity = createEntity('e-circ', 'Circular Entity')
      const items: DirectoryItem[] = [
        { id: 'it-circ', worldId: 'w', folderId: 'f-a', entityId: 'e-circ', order: 0 }
      ]

      expect(() => {
        exportWorldToObsidianFiles('World', [entity], circularFolders, items)
      }).not.toThrow()
    })

    it('ADV.2.3: self-referencing folder (parentId == id) must not cause stack overflow', () => {
      // CRITICAL CRASH: getFolderPath infinitely recurses on self-referencing folder
      const selfFolder: DirectoryFolder[] = [
        { id: 'f-self', worldId: 'w', name: 'Self_Folder', parentId: 'f-self', order: 0 }
      ]
      const entity = createEntity('e-self', 'Self Ref Entity')
      const items: DirectoryItem[] = [
        { id: 'it-self', worldId: 'w', folderId: 'f-self', entityId: 'e-self', order: 0 }
      ]

      expect(() => {
        exportWorldToObsidianFiles('World', [entity], selfFolder, items)
      }).not.toThrow()
    })
  })

  // =========================================================================
  // 3. COMPLEX FRONTMATTER & YAML EDGE CASES
  // =========================================================================

  describe('3. Complex YAML Frontmatter Serialization & Parsing', () => {
    it('ADV.3.1: parses tags and aliases containing quotes without losing them', () => {
      // VULNERABILITY: parseFrontmatter list regex drops items with internal quotes
      const entity = createEntity('e-quotes', 'Quote Master', {
        tags: ['warrior', 'order of "the dawn"', 'hero'],
        aliases: ['"The Shadow" Walker', 'Night\'s King']
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(frontmatter.tags).toContain('order of "the dawn"')
      expect(frontmatter.aliases).toContain('"The Shadow" Walker')
    })

    it('ADV.3.2: unescapes quotes in title and summary during parseFrontmatter', () => {
      // VULNERABILITY: parseFrontmatter retains raw backslashes \"
      const entity = createEntity('e-title-quote', 'Lord "Raven" of Ostergard', {
        summary: 'He said "Victory is ours" with certainty.'
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(frontmatter.title).toBe('Lord "Raven" of Ostergard')
      expect(frontmatter.summary).toBe('He said "Victory is ours" with certainty.')
    })

    it('ADV.3.3: preserves string types for numeric-like titles and IDs', () => {
      // VULNERABILITY: parseFrontmatter casts numeric strings to JavaScript numbers
      const entity = createEntity('007', '1984', {
        summary: 'Year 2049 event.'
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(typeof frontmatter.id).toBe('string')
      expect(typeof frontmatter.title).toBe('string')
      expect(frontmatter.id).toBe('007')
      expect(frontmatter.title).toBe('1984')
    })

    it('ADV.3.4: handles infobox field values containing "value:" or colons without truncation', () => {
      // VULNERABILITY: line.split('value:')[1] truncates strings that contain "value:"
      const entity = createEntity('e-infobox-colon', 'Merchant Guild', {
        infobox: {
          subtitle: 'Commerce Hub: North',
          sections: [
            {
              title: 'Appraisal Data',
              fields: [
                { id: 'f-1', label: 'Item: Appraisal', value: 'Estimated value: 500 gold coins', type: 'text' },
                { id: 'f-2', label: 'Operating Hours', value: '08:00 - 18:00', type: 'text' }
              ]
            }
          ]
        }
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      const section = frontmatter.infobox?.sections?.[0]
      const field1 = section?.fields?.find((f: any) => f.id === 'f-1')
      const field2 = section?.fields?.find((f: any) => f.id === 'f-2')

      expect(field1?.value).toBe('Estimated value: 500 gold coins')
      expect(field2?.value).toBe('08:00 - 18:00')
    })

    it('ADV.3.5: handles null, undefined, and empty string field values in infobox', () => {
      const entity = createEntity('e-sparse-info', 'Sparse Entity', {
        infobox: {
          subtitle: '',
          sections: [
            {
              title: 'Empty & Null Fields',
              fields: [
                { id: 'f-empty', label: 'Empty Field', value: '', type: 'text' },
                { id: 'f-null', label: 'Null Field', value: null as any, type: 'text' },
                { id: 'f-undef', label: 'Undefined Field', value: undefined as any, type: 'text' }
              ]
            }
          ]
        }
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(frontmatter.infobox).toBeDefined()
      expect(frontmatter.infobox.sections[0].fields).toHaveLength(3)
      expect(frontmatter.infobox.sections[0].fields[0].value).toBe('')
      expect(frontmatter.infobox.sections[0].fields[1].value).toBe('')
      expect(frontmatter.infobox.sections[0].fields[2].value).toBe('')
    })

    it('ADV.3.6: parses customProperties containing nested objects, booleans, and arrays', () => {
      const doc = `---
id: "e-custom"
title: "Custom Properties Entity"
type: "lore"
customProperties:
  nestedObj: {"key": "val", "count": 42}
  flag: true
  score: 98.6
---

Body content.`

      const { frontmatter } = parseFrontmatter(doc)
      expect(frontmatter.customProperties).toBeDefined()
      expect(frontmatter.customProperties.nestedObj).toEqual({ key: 'val', count: 42 })
      expect(frontmatter.customProperties.flag).toBe(true)
      expect(frontmatter.customProperties.score).toBe(98.6)
    })
  })

  // =========================================================================
  // 4. COMPLEX WIKI-LINKS TRANSLATION
  // =========================================================================

  describe('4. Complex Wiki-Links Translation & Code Block Protection', () => {
    const titleMap = new Map([
      ['vaelen', 'e-vae'],
      ['horn-keep', 'e-horn'],
      ['ostergard', 'e-ost']
    ])

    it('ADV.4.1: parses section anchors with aliases [[Target#Section|Alias]]', () => {
      const markdown = 'Consult [[Horn-Keep#Armory|The Keep Arsenal]] before battle.'
      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)

      expect(html).toContain('data-id="e-horn"')
      expect(html).toContain('data-label="The Keep Arsenal"')
    })

    it('ADV.4.2: handles multiple pipes in alias [[Target|Alias|Extra]]', () => {
      const markdown = 'See [[Vaelen|Commander|Lord of Horn-Keep]].'
      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)

      expect(html).toContain('data-id="e-vae"')
      expect(html).toContain('Commander|Lord of Horn-Keep')
    })

    it('ADV.4.3: does NOT transform wiki-links inside inline code or code blocks', () => {
      // VULNERABILITY: obsidianMarkdownToHtmlContent modifies links inside code blocks
      const markdown = 'Code example: `[[Horn-Keep]]` and regular link [[Horn-Keep]].'
      const html = obsidianMarkdownToHtmlContent(markdown, titleMap)

      expect(html).toContain('`[[Horn-Keep]]`')
    })

    it('ADV.4.4: handles empty wiki-link targets [[]] and [[   ]] without crashing', () => {
      const markdown = 'Empty links [[]] and [[   ]] should not crash.'
      expect(() => {
        const html = obsidianMarkdownToHtmlContent(markdown, titleMap)
        expect(html).toBeDefined()
      }).not.toThrow()
    })

    it('ADV.4.5: handles nested wiki-links [[Outer [[Inner]]]] without throwing', () => {
      const markdown = 'Nested: [[Outer [[Vaelen]] Target]].'
      expect(() => {
        const html = obsidianMarkdownToHtmlContent(markdown, titleMap)
        expect(html).toBeDefined()
      }).not.toThrow()
    })
  })

  // =========================================================================
  // 5. ROUNDTRIP LOSSLESS INVARIANT ON EXTREME ENTITIES
  // =========================================================================

  describe('5. Roundtrip Lossless Invariant on Extreme Entities', () => {
    it('ADV.5.1: Invariant: title with illegal filename chars roundtrips losslessly via originalTitle', () => {
      const original = createEntity('e-title-chars', 'Lord Vaelen: The Wolf / Crow? <Hero> *Star*', {
        summary: 'Hero of the northern realm.'
      })

      const exported = exportWorldToObsidianFiles('World', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      expect(imported.entities).toHaveLength(1)
      const reconstituted = imported.entities[0]
      expect(reconstituted.title).toBe(original.title)
    })

    it('ADV.5.2: Invariant: entity with quotes in title roundtrips losslessly', () => {
      // VULNERABILITY: Quotes in title gain backslashes (\" instead of ")
      const original = createEntity('e-title-quote-rt', 'Vaelen "The Boreal Warden"', {
        summary: 'Commander of the north.'
      })

      const exported = exportWorldToObsidianFiles('World', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      expect(imported.entities).toHaveLength(1)
      const reconstituted = imported.entities[0]
      expect(reconstituted.title).toBe(original.title)
    })

    it('ADV.5.3: Invariant: entity with complex infobox colons and quotes roundtrips losslessly', () => {
      // VULNERABILITY: Infobox field values with quotes retain backslashes, "value:" gets truncated
      const original = createEntity('e-complex-info-rt', 'Citadel Armory', {
        infobox: {
          subtitle: 'Main: High Vault',
          sections: [
            {
              title: 'Weapon Registry: Tier 1',
              fields: [
                { id: 'f-w1', label: 'Weapon: Blade', value: 'Sun-Sword: "Dawnbringer"', type: 'text' },
                { id: 'f-w2', label: 'Value: Gold', value: 'Estimated value: 1,500gp', type: 'text' }
              ]
            }
          ]
        }
      })

      const exported = exportWorldToObsidianFiles('World', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      const reconstituted = imported.entities[0]
      const f1 = reconstituted.infobox?.sections?.[0]?.fields?.find(f => f.id === 'f-w1')
      const f2 = reconstituted.infobox?.sections?.[0]?.fields?.find(f => f.id === 'f-w2')

      expect(f1?.value).toBe('Sun-Sword: "Dawnbringer"')
      expect(f2?.value).toBe('Estimated value: 1,500gp')
    })

    it('ADV.5.4: Invariant: large vault (50 entities across 10 folders) maintains 100% entity and folder count', () => {
      const folderCount = 10
      const entityCount = 50

      const folders: DirectoryFolder[] = []
      for (let i = 0; i < folderCount; i++) {
        folders.push({
          id: `f-vault-${i}`,
          worldId: 'w',
          name: `Folder_${i}`,
          parentId: i > 0 ? `f-vault-${Math.floor((i - 1) / 2)}` : null,
          order: i
        })
      }

      const entities: LoreEntity[] = []
      const items: DirectoryItem[] = []
      for (let e = 0; e < entityCount; e++) {
        const folderIndex = e % folderCount
        const entity = createEntity(`e-${e}`, `Entity_${e}`, {
          summary: `Summary of entity ${e}`
        })
        entities.push(entity)
        items.push({
          id: `item-${e}`,
          worldId: 'w',
          folderId: `f-vault-${folderIndex}`,
          entityId: `e-${e}`,
          order: e
        })
      }

      const exported = exportWorldToObsidianFiles('Large World', entities, folders, items)
      expect(Object.keys(exported.files)).toHaveLength(entityCount)
      expect(exported.manifest.totalFiles).toBe(entityCount)

      const imported = importObsidianFilesToWorld(exported.files)
      expect(imported.entities).toHaveLength(entityCount)
      expect(imported.directoryItems).toHaveLength(entityCount)
    })
  })
})
