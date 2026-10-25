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

describe('Obsidian Bridge Challenger M5 Iteration 2 Empirical Suite', () => {
  const createEntity = (id: string, title: string, options: Partial<LoreEntity> = {}): LoreEntity => ({
    id,
    worldId: 'world-chal-m5-it2',
    title,
    type: 'character',
    tags: ['challenger', 'm5-it2'],
    aliases: ['chal-alias'],
    summary: 'Challenger verification entity.',
    content: '<p>Content with mentions <span data-type="mention" data-id="e-target" data-label="Target">@Target</span>.</p>',
    isSecret: false,
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    ...options
  })

  // =========================================================================
  // 1. VERIFICATION OF 12 REMEDIATED VULNERABILITIES
  // =========================================================================
  describe('1. Direct Verification of 12 Remediated Test Cases', () => {
    it('Fix 1 (ADV.1.3): whitespace-only strings fallback to Untitled', () => {
      const whitespaceInputs = ['   ', '\t\n\r', '  \t  \n  ']
      for (const input of whitespaceInputs) {
        const result = sanitizeFilename(input)
        expect(result).toBe('Untitled')
      }
    })

    it('Fix 2 (ADV.1.4): trailing dots and spaces stripped', () => {
      expect(sanitizeFilename('Doc.')).toBe('Doc')
      expect(sanitizeFilename('Doc...')).toBe('Doc')
      expect(sanitizeFilename('Doc. . ')).toBe('Doc')
      expect(sanitizeFilename('Trailing Space   ')).toBe('Trailing Space')
      expect(sanitizeFilename('...')).toBe('Untitled')
    })

    it('Fix 3 (ADV.1.5): Windows reserved device names sanitized with trailing underscore', () => {
      const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM9', 'LPT1', 'LPT9', 'con', 'prn', 'aux', 'nul']
      for (const name of reserved) {
        const result = sanitizeFilename(name)
        expect(result.toLowerCase()).toBe(`${name.toLowerCase()}_`)
      }
    })

    it('Fix 4 (ADV.2.2): multi-folder cycle (A -> B -> A) terminates without stack overflow', () => {
      const folders: DirectoryFolder[] = [
        { id: 'f-1', worldId: 'w', name: 'Folder_1', parentId: 'f-2', order: 0 },
        { id: 'f-2', worldId: 'w', name: 'Folder_2', parentId: 'f-1', order: 0 }
      ]
      const entity = createEntity('e-1', 'Cycle Entity')
      const items: DirectoryItem[] = [
        { id: 'it-1', worldId: 'w', folderId: 'f-1', entityId: 'e-1', order: 0 }
      ]
      expect(() => {
        const res = exportWorldToObsidianFiles('World', [entity], folders, items)
        expect(Object.keys(res.files)).toHaveLength(1)
      }).not.toThrow()
    })

    it('Fix 5 (ADV.2.3): self-referencing folder (parentId === id) terminates immediately', () => {
      const folders: DirectoryFolder[] = [
        { id: 'f-self', worldId: 'w', name: 'Selfie', parentId: 'f-self', order: 0 }
      ]
      const entity = createEntity('e-self', 'Self Ref')
      const items: DirectoryItem[] = [
        { id: 'it-self', worldId: 'w', folderId: 'f-self', entityId: 'e-self', order: 0 }
      ]
      expect(() => {
        const res = exportWorldToObsidianFiles('World', [entity], folders, items)
        expect(Object.keys(res.files)).toHaveLength(1)
      }).not.toThrow()
    })

    it('Fix 6 (ADV.3.1): parses tags and aliases with quotes without dropping them', () => {
      const entity = createEntity('e-quotes', 'Quotes Entity', {
        tags: ['knight', 'order of "the dawn"', 'valiant "hero"'],
        aliases: ['"The Shadow" Walker', 'Night\'s King']
      })
      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(frontmatter.tags).toEqual(['knight', 'order of "the dawn"', 'valiant "hero"'])
      expect(frontmatter.aliases).toEqual(['"The Shadow" Walker', 'Night\'s King'])
    })

    it('Fix 7 (ADV.3.2): unescapes quotes in title and summary', () => {
      const entity = createEntity('e-qtitle', 'Lord "Raven" of Ostergard', {
        summary: 'He stated "We shall endure" with conviction.'
      })
      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(frontmatter.title).toBe('Lord "Raven" of Ostergard')
      expect(frontmatter.summary).toBe('He stated "We shall endure" with conviction.')
    })

    it('Fix 8 (ADV.3.3): preserves string types for numeric IDs and titles', () => {
      const entity = createEntity('007', '1984', {
        summary: 'Numeric summary'
      })
      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      expect(typeof frontmatter.id).toBe('string')
      expect(frontmatter.id).toBe('007')
      expect(typeof frontmatter.title).toBe('string')
      expect(frontmatter.title).toBe('1984')
    })

    it('Fix 9 (ADV.3.4): infobox values with "value:" substring and colons parsed without truncation', () => {
      const entity = createEntity('e-valcol', 'Armory', {
        infobox: {
          subtitle: 'Main: Quartermaster',
          sections: [
            {
              title: 'Inventory',
              fields: [
                { id: 'f-1', label: 'Item: Appraisal', value: 'Estimated value: 500 gold coins', type: 'text' },
                { id: 'f-2', label: 'Hours', value: '09:00 - 17:00:00', type: 'text' }
              ]
            }
          ]
        }
      })
      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nBody`)

      const fields = frontmatter.infobox?.sections?.[0]?.fields
      expect(fields?.[0]?.value).toBe('Estimated value: 500 gold coins')
      expect(fields?.[1]?.value).toBe('09:00 - 17:00:00')
    })

    it('Fix 10 (ADV.4.3): code spans and blocks with [[wiki-links]] are protected from transformation', () => {
      const titleMap = new Map([['horn-keep', 'e-horn']])
      const md = 'Here is `[[Horn-Keep]]` and real [[Horn-Keep]] in action.'
      const html = obsidianMarkdownToHtmlContent(md, titleMap)

      expect(html).toContain('`[[Horn-Keep]]`')
      expect(html).toContain('<span data-type="mention" data-id="e-horn" data-label="Horn-Keep">@Horn-Keep</span>')
    })

    it('Fix 11 (ADV.5.2): Invariant: entity with quotes in title roundtrips losslessly', () => {
      const original = createEntity('e-inv-quote', 'Vaelen "The Boreal Warden"', {
        summary: 'Northern warrior.'
      })
      const exported = exportWorldToObsidianFiles('World', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      expect(imported.entities[0].title).toBe('Vaelen "The Boreal Warden"')
    })

    it('Fix 12 (ADV.5.3): Invariant: entity with complex infobox colons and quotes roundtrips losslessly', () => {
      const original = createEntity('e-inv-info', 'Citadel Armory', {
        infobox: {
          subtitle: 'Main: High Vault',
          sections: [
            {
              title: 'Weapon Registry',
              fields: [
                { id: 'f-1', label: 'Blade', value: 'Sun-Sword: "Dawnbringer"', type: 'text' },
                { id: 'f-2', label: 'Appraisal', value: 'Estimated value: 1,500gp', type: 'text' }
              ]
            }
          ]
        }
      })
      const exported = exportWorldToObsidianFiles('World', [original])
      const imported = importObsidianFilesToWorld(exported.files)

      const f1 = imported.entities[0].infobox?.sections?.[0]?.fields?.[0]
      const f2 = imported.entities[0].infobox?.sections?.[0]?.fields?.[1]
      expect(f1?.value).toBe('Sun-Sword: "Dawnbringer"')
      expect(f2?.value).toBe('Estimated value: 1,500gp')
    })
  })

  // =========================================================================
  // 2. ADVERSARIAL STRESS CHALLENGES & EDGE CASES
  // =========================================================================
  describe('2. Adversarial Stress Probing & Invariants', () => {
    it('CHAL.1: 5-node circular folder chain (A -> B -> C -> D -> E -> A)', () => {
      const folders: DirectoryFolder[] = [
        { id: 'f-a', worldId: 'w', name: 'A', parentId: 'f-e', order: 0 },
        { id: 'f-b', worldId: 'w', name: 'B', parentId: 'f-a', order: 1 },
        { id: 'f-c', worldId: 'w', name: 'C', parentId: 'f-b', order: 2 },
        { id: 'f-d', worldId: 'w', name: 'D', parentId: 'f-c', order: 3 },
        { id: 'f-e', worldId: 'w', name: 'E', parentId: 'f-d', order: 4 }
      ]
      const entity = createEntity('e-loop', 'Loop Entity')
      const items: DirectoryItem[] = [
        { id: 'it-loop', worldId: 'w', folderId: 'f-a', entityId: 'e-loop', order: 0 }
      ]

      const start = performance.now()
      const exported = exportWorldToObsidianFiles('World', [entity], folders, items)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(Object.keys(exported.files)).toHaveLength(1)
    })

    it('CHAL.2: Dangling folder parent references resolve cleanly', () => {
      const folders: DirectoryFolder[] = [
        { id: 'f-orphan', worldId: 'w', name: 'Orphan Folder', parentId: 'nonexistent-parent-999', order: 0 }
      ]
      const entity = createEntity('e-orphan', 'Orphan Entity')
      const items: DirectoryItem[] = [
        { id: 'it-orphan', worldId: 'w', folderId: 'f-orphan', entityId: 'e-orphan', order: 0 }
      ]

      const exported = exportWorldToObsidianFiles('World', [entity], folders, items)
      expect(exported.files['Orphan Folder/Orphan Entity.md']).toBeDefined()
    })

    it('CHAL.3: Multiple entities with identical titles in the same directory are disambiguated without collisions', () => {
      const entities: LoreEntity[] = [
        createEntity('e-dup-1', 'Common Guard', { summary: 'Guard 1' }),
        createEntity('e-dup-2', 'Common Guard', { summary: 'Guard 2' }),
        createEntity('e-dup-3', 'Common Guard', { summary: 'Guard 3' }),
        createEntity('e-dup-4', 'Common Guard', { summary: 'Guard 4' })
      ]

      const exported = exportWorldToObsidianFiles('World', entities)
      const paths = Object.keys(exported.files)

      // All 4 files must be uniquely written
      expect(paths).toHaveLength(4)
      expect(new Set(paths).size).toBe(4)

      // Re-importing must reconstitute all 4 entities with their original titles
      const imported = importObsidianFilesToWorld(exported.files)
      expect(imported.entities).toHaveLength(4)
      for (const ent of imported.entities) {
        expect(ent.title).toBe('Common Guard')
      }
    })

    it('CHAL.4: Multiple inline code spans and fenced blocks on the same line or document', () => {
      const titleMap = new Map([
        ['alpha', 'e-alpha'],
        ['beta', 'e-beta'],
        ['gamma', 'e-gamma']
      ])
      const md = [
        'Intro line with `[[Alpha]]` and `[[Beta]]` inline code.',
        '',
        '```markdown',
        'Fenced block: [[Gamma]] should not change.',
        '```',
        '',
        'Real links: [[Alpha]] and [[Gamma|Custom Gamma]].'
      ].join('\n')

      const html = obsidianMarkdownToHtmlContent(md, titleMap)

      // Inline code preserved
      expect(html).toContain('`[[Alpha]]`')
      expect(html).toContain('`[[Beta]]`')

      // Fenced block preserved
      expect(html).toContain('```markdown\nFenced block: [[Gamma]] should not change.\n```')

      // Real links transformed
      expect(html).toContain('<span data-type="mention" data-id="e-alpha" data-label="Alpha">@Alpha</span>')
      expect(html).toContain('<span data-type="mention" data-id="e-gamma" data-label="Custom Gamma">@Custom Gamma</span>')
    })

    it('CHAL.5: Frontmatter preserves various string representations and escape sequences', () => {
      const entity = createEntity('e-escape', 'Escape Entity', {
        summary: 'Backslash: C:\\path\\to\\file and "quotes" and \'single\'.',
        tags: ['tag:colon', 'quote"inside', 'dash-tag'],
        customProperties: {
          strNum: '12345',
          realNum: 12345,
          boolVal: false,
          nested: { deep: ['a', 'b'] }
        }
      })

      const yaml = serializeFrontmatter(entity)
      const { frontmatter } = parseFrontmatter(`${yaml}\n\nContent`)

      expect(frontmatter.summary).toBe('Backslash: C:\\path\\to\\file and "quotes" and \'single\'.')
      expect(frontmatter.tags).toContain('tag:colon')
      expect(frontmatter.tags).toContain('quote"inside')
      expect(frontmatter.customProperties.strNum).toBe('12345')
      expect(frontmatter.customProperties.realNum).toBe(12345)
      expect(frontmatter.customProperties.boolVal).toBe(false)
      expect(frontmatter.customProperties.nested).toEqual({ deep: ['a', 'b'] })
    })

    it('CHAL.6: Roundtrip idempotency invariant: E(I(E(W))) == E(W)', () => {
      const entities: LoreEntity[] = [
        createEntity('e-idem-1', 'Lord "Commander" of Winter', {
          summary: 'Guards the frontier: 100 leagues north.',
          tags: ['commander', 'frost:guard', '"the wall"'],
          infobox: {
            subtitle: 'Fortress: North',
            sections: [
              {
                title: 'Garrison',
                fields: [
                  { id: 'f-men', label: 'Troops: Count', value: '500 seasoned soldiers', type: 'text' }
                ]
              }
            ]
          }
        }),
        createEntity('e-idem-2', '009', {
          title: '009',
          summary: 'Agent with numeric-like title and id'
        })
      ]

      // Pass 1: Export original world
      const exp1 = exportWorldToObsidianFiles('World', entities)

      // Pass 2: Import back to world
      const imp1 = importObsidianFilesToWorld(exp1.files)
      expect(imp1.entities).toHaveLength(2)

      // Pass 3: Export imported world
      const exp2 = exportWorldToObsidianFiles('World', imp1.entities)

      // File paths and contents must match
      expect(Object.keys(exp2.files).sort()).toEqual(Object.keys(exp1.files).sort())
      for (const path of Object.keys(exp1.files)) {
        expect(exp2.files[path]).toBe(exp1.files[path])
      }
    })
  })
})
