import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateSmartSnap, SnapNodeBox } from '@/utils/snapEngine'
import {
  exportConnectionsToCsv,
  exportConnectionsToJson,
  exportTimelineToCsv,
  exportTimelineToJson,
  exportCanvasToJson,
  exportRelationsToJson,
  exportMapToJson
} from '@/utils/exportUtils'
import { LoreEntity, RelationEdge, TimelineEvent, WhiteboardCanvasData, WorldMap } from '@shared/types'

describe('Adversarial Stress Suite — snapEngine', () => {
  describe('Extreme & Large Coordinates', () => {
    it('handles astronomical positive coordinates without loss of precision', () => {
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: 100_000_000,
        y: 200_000_000,
        width: 100,
        height: 100
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: 100_000_004, // Diff of 4 <= 8
        y: 200_000_500,
        width: 100,
        height: 100
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedX).toBe(100_000_004)
      expect(result.guides).toHaveLength(1)
      expect(result.guides[0].type).toBe('vertical')
      expect(result.guides[0].pos).toBe(100_000_004)
    })

    it('handles astronomical negative coordinates correctly', () => {
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: -50_000_000,
        y: -80_000_000,
        width: 120,
        height: 80
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: -50_000_006, // Diff of 6 <= 8
        y: -80_000_003, // Diff of 3 <= 8
        width: 120,
        height: 80
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedX).toBe(-50_000_006)
      expect(result.snappedY).toBe(-80_000_003)
      expect(result.guides).toHaveLength(2)
    })

    it('handles coordinates near Number.MAX_SAFE_INTEGER', () => {
      const huge = Number.MAX_SAFE_INTEGER - 1000
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: huge,
        y: 0,
        width: 50,
        height: 50
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: huge + 2,
        y: 500,
        width: 50,
        height: 50
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedX).toBe(huge + 2)
    })
  })

  describe('Negative Coordinate Alignments', () => {
    it('snaps Right-to-Left across the zero boundary', () => {
      // Dragged right edge is -2 (x: -52, w: 50 -> right = -2)
      // Target left edge is 0 (x: 0, w: 50)
      // Distance is |-2 - 0| = 2 <= 8
      // Snapped X should be target left - dragged width = 0 - 50 = -50
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: -52,
        y: 100,
        width: 50,
        height: 50
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: 0,
        y: 100,
        width: 50,
        height: 50
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedX).toBe(-50)
      expect(result.guides.some(g => g.type === 'vertical' && g.pos === 0)).toBe(true)
    })

    it('snaps Center-to-Center in negative quad with odd dimensions', () => {
      // Dragged center X: -100 + 51/2 = -74.5
      // Target center X: -72
      // Diff: |-74.5 - (-72)| = 2.5 <= 8
      // Snapped X: -72 - 25.5 = -97.5 -> Math.round(-97.5) = -97 (in standard JS Math.round)
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: -100,
        y: -100,
        width: 51,
        height: 51
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: -97.5,
        y: 500,
        width: 51,
        height: 51
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      // JS Math.round(-97.5) rounds half towards +infinity, yielding -97
      expect(result.snappedX).toBe(-97)
    })

    it('correctly calculates guide line spans for negative coordinates', () => {
      const dragged: SnapNodeBox = {
        id: 'dragged',
        x: -100,
        y: -200,
        width: 50,
        height: 50
      }
      const target: SnapNodeBox = {
        id: 'target',
        x: -100,
        y: -50,
        width: 50,
        height: 50
      }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.guides).toHaveLength(1)
      const g = result.guides[0]
      // min(dTop, oTop) - 25 = min(-200, -50) - 25 = -225
      // max(dBottom, oBottom) + 25 = max(-150, 0) + 25 = 25
      expect(g.from).toBe(-225)
      expect(g.to).toBe(25)
    })
  })

  describe('Float Precision & Boundary Conditions', () => {
    it('respects exact threshold boundary: diff < threshold snaps, diff == threshold does not', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 100, y: 100, width: 50, height: 50 }
      
      // Target at 107.99 (diff = 7.99 < 8) -> snaps
      const targetSnap: SnapNodeBox = { id: 't1', x: 107.99, y: 300, width: 50, height: 50 }
      const resSnap = calculateSmartSnap(dragged, [targetSnap], 8)
      expect(resSnap.snappedX).toBe(108) // Math.round(107.99)

      // Target at 108.00 (diff = 8.00 not < 8) -> does NOT snap
      const targetNoSnap: SnapNodeBox = { id: 't2', x: 108, y: 300, width: 50, height: 50 }
      const resNoSnap = calculateSmartSnap(dragged, [targetNoSnap], 8)
      expect(resNoSnap.snappedX).toBe(100)
    })

    it('handles sub-pixel thresholds e.g. 0.5', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 10.0, y: 10.0, width: 20, height: 20 }
      const target: SnapNodeBox = { id: 't', x: 10.3, y: 200, width: 20, height: 20 }

      const snapRes = calculateSmartSnap(dragged, [target], 0.5)
      expect(snapRes.snappedX).toBe(10) // 10.3 rounded
      expect(snapRes.guides).toHaveLength(1)

      const noSnapRes = calculateSmartSnap(dragged, [target], 0.2)
      expect(noSnapRes.snappedX).toBe(10)
      expect(noSnapRes.guides).toHaveLength(0)
    })

    it('handles floating-point accumulation (0.1 + 0.2)', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 0.1 + 0.2, y: 0, width: 10, height: 10 }
      const target: SnapNodeBox = { id: 't', x: 0.3, y: 100, width: 10, height: 10 }

      const result = calculateSmartSnap(dragged, [target], 1)
      expect(result.snappedX).toBe(0) // Math.round(0.3)
      expect(result.guides).toHaveLength(1)
    })
  })

  describe('Zero & Negative Thresholds', () => {
    it('returns unsnapped coordinates when threshold is 0', () => {
      // With threshold 0, diff < 0 is never true even for exact match
      const dragged: SnapNodeBox = { id: 'd', x: 100, y: 100, width: 50, height: 50 }
      const target: SnapNodeBox = { id: 't', x: 100, y: 200, width: 50, height: 50 }

      const result = calculateSmartSnap(dragged, [target], 0)
      expect(result.snappedX).toBe(100)
      expect(result.snappedY).toBe(100)
      expect(result.guides).toHaveLength(0)
    })

    it('returns unsnapped coordinates safely when threshold is negative', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 100, y: 100, width: 50, height: 50 }
      const target: SnapNodeBox = { id: 't', x: 100, y: 100, width: 50, height: 50 }

      const result = calculateSmartSnap(dragged, [target], -5)
      expect(result.snappedX).toBe(100)
      expect(result.snappedY).toBe(100)
      expect(result.guides).toHaveLength(0)
    })
  })

  describe('Zero Dimensions & Degenerate Boxes', () => {
    it('handles zero width and zero height nodes safely without NaN or crash', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 50, y: 50, width: 0, height: 0 }
      const target: SnapNodeBox = { id: 't', x: 53, y: 52, width: 0, height: 0 }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedX).toBe(53)
      expect(result.snappedY).toBe(52)
      expect(Number.isNaN(result.snappedX)).toBe(false)
      expect(Number.isNaN(result.snappedY)).toBe(false)
    })
  })

  describe('Y-Axis Alignment Stress (Top-to-Bottom, Bottom-to-Top, Center-to-Center Y)', () => {
    it('snaps Top-to-Bottom within threshold', () => {
      // dragged top: 100, height: 50.
      // target y: 40, height: 57 -> target bottom = 97 (diff = 3 <= 8).
      const dragged: SnapNodeBox = { id: 'd', x: 200, y: 100, width: 50, height: 50 }
      const target: SnapNodeBox = { id: 't', x: 400, y: 40, width: 50, height: 57 }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedY).toBe(97)
      expect(result.guides.some(g => g.type === 'horizontal' && g.pos === 97)).toBe(true)
    })

    it('snaps Bottom-to-Top within threshold', () => {
      // dragged y: 100, height: 50 -> bottom = 150.
      // target y: 153, height: 50 -> top = 153 (diff = 3 <= 8).
      // snapped Y should be target top - dragged height = 153 - 50 = 103.
      const dragged: SnapNodeBox = { id: 'd', x: 200, y: 100, width: 50, height: 50 }
      const target: SnapNodeBox = { id: 't', x: 400, y: 153, width: 50, height: 50 }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedY).toBe(103)
      expect(result.guides.some(g => g.type === 'horizontal' && g.pos === 153)).toBe(true)
    })

    it('snaps Center-to-Center in Y within threshold', () => {
      // dragged y: 100, height: 60 -> center = 130.
      // target y: 110, height: 44 -> center = 132 (diff = 2 <= 8).
      // snapped Y should be target center - dragged height / 2 = 132 - 30 = 102.
      const dragged: SnapNodeBox = { id: 'd', x: 200, y: 100, width: 50, height: 60 }
      const target: SnapNodeBox = { id: 't', x: 400, y: 110, width: 50, height: 44 }

      const result = calculateSmartSnap(dragged, [target], 8)
      expect(result.snappedY).toBe(102)
      expect(result.guides.some(g => g.type === 'horizontal' && g.pos === 132)).toBe(true)
    })
  })

  describe('Multi-Candidate Nearest Neighbor Selection', () => {
    it('selects the closest candidate among multiple candidates within threshold', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 100, y: 100, width: 50, height: 50 }
      const otherA: SnapNodeBox = { id: 'a', x: 106, y: 300, width: 50, height: 50 } // diff 6
      const otherB: SnapNodeBox = { id: 'b', x: 102, y: 400, width: 50, height: 50 } // diff 2
      const otherC: SnapNodeBox = { id: 'c', x: 105, y: 500, width: 50, height: 50 } // diff 5

      const result = calculateSmartSnap(dragged, [otherA, otherB, otherC], 8)
      expect(result.snappedX).toBe(102) // Snapped to otherB
    })

    it('executes efficiently with 1,000 candidate nodes', () => {
      const dragged: SnapNodeBox = { id: 'd', x: 500, y: 500, width: 100, height: 100 }
      const others: SnapNodeBox[] = []
      for (let i = 0; i < 1000; i++) {
        others.push({
          id: `node-${i}`,
          x: i * 20,
          y: i * 20,
          width: 80,
          height: 80
        })
      }

      const t0 = performance.now()
      const result = calculateSmartSnap(dragged, others, 8)
      const t1 = performance.now()

      expect(t1 - t0).toBeLessThan(100) // Must complete under 100ms
      expect(result.guides.length).toBeGreaterThan(0)
    })
  })
})

describe('Adversarial Stress Suite — exportUtils', () => {
  let mockExportFile: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockExportFile = vi.fn().mockResolvedValue(true)
    ;(globalThis as any).window = {
      oros: {
        exportFile: mockExportFile
      }
    }
  })

  afterEach(() => {
    delete (globalThis as any).window
  })

  describe('Empty Collections & Null Values', () => {
    it('exports empty connections CSV with valid header only', async () => {
      const success = await exportConnectionsToCsv([], [], 'Empty')
      expect(success).toBe(true)
      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('empty_connections_edgelist.csv')
      expect(content).toBe('Source ID,Source Title,Target ID,Target Title\n')
    })

    it('exports empty connections JSON with zero counts and empty arrays', async () => {
      const success = await exportConnectionsToJson([], [], 'Empty')
      expect(success).toBe(true)
      const [, content] = mockExportFile.mock.calls[0]
      const parsed = JSON.parse(content)
      expect(parsed.totalNodes).toBe(0)
      expect(parsed.totalConnections).toBe(0)
      expect(parsed.nodes).toEqual([])
      expect(parsed.connections).toEqual([])
    })

    it('exports empty timeline CSV with valid header only', async () => {
      const success = await exportTimelineToCsv([], 'EmptyTimeline')
      expect(success).toBe(true)
      const [, content] = mockExportFile.mock.calls[0]
      expect(content).toBe('ID,Era,Year,Month,Day,EndYear,IsPeriod,Importance,Category,Title,Description,EntityIds\n')
    })

    it('exports empty timeline JSON with null calendarConfig cleanly', async () => {
      const success = await exportTimelineToJson([], null, 'EmptyTimeline')
      expect(success).toBe(true)
      const [, content] = mockExportFile.mock.calls[0]
      const parsed = JSON.parse(content)
      expect(parsed.totalRecords).toBe(0)
      expect(parsed.calendarConfig).toBeNull()
      expect(parsed.events).toEqual([])
    })
  })

  describe('Special Characters & Multi-line Escaping in CSV', () => {
    it('handles embedded newlines (CRLF & LF) inside timeline event description', async () => {
      const multilineDesc = 'Line 1: The inception.\nLine 2: The war begins.\r\nLine 3: The treaty.'
      const events: TimelineEvent[] = [
        {
          id: 'evt-multi',
          worldId: 'w1',
          title: 'The "Three-Day" Council, Part 1',
          description: multilineDesc,
          year: 100,
          era: 'Age of Peace\n(Extended)',
          category: 'politics,diplomacy',
          entityIds: ['e1', 'e2']
        }
      ]

      await exportTimelineToCsv(events, 'MultilineWorld')
      const [, content] = mockExportFile.mock.calls[0]

      // Confirm RFC 4180 multi-line quoting
      expect(content).toContain('"Line 1: The inception.\nLine 2: The war begins.\r\nLine 3: The treaty."')
      expect(content).toContain('"The ""Three-Day"" Council, Part 1"')
      expect(content).toContain('"Age of Peace\n(Extended)"')
      expect(content).toContain('"politics,diplomacy"')
    })

    it('handles commas, quotes, semicolons, and slashes in connection titles', async () => {
      const entities: LoreEntity[] = [
        {
          id: 'e-complex-1',
          worldId: 'w1',
          title: 'Lord "Baelor", Hand of the King / Regent; 1st of his Name',
          type: 'character',
          tags: ['ruler'],
          folderId: 'f1',
          content: '',
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'e-complex-2',
          worldId: 'w1',
          title: 'Citadel of "Oldtown", Grand Library',
          type: 'location',
          tags: ['library'],
          folderId: 'f1',
          content: '',
          createdAt: '',
          updatedAt: ''
        }
      ]
      const links = [{ source: 'e-complex-1', target: 'e-complex-2' }]

      await exportConnectionsToCsv(entities, links, 'Kingdom of the Reach')
      const [, content] = mockExportFile.mock.calls[0]

      expect(content).toContain('e-complex-1,"Lord ""Baelor"", Hand of the King / Regent; 1st of his Name"')
      expect(content).toContain('e-complex-2,"Citadel of ""Oldtown"", Grand Library"')
    })

    it('handles Unicode, emojis, and HTML tags in CSV fields', async () => {
      const events: TimelineEvent[] = [
        {
          id: 'evt-unicode',
          worldId: 'w1',
          title: '🏰 Rise of Valyria 🐉 (Köln & Tokyo 東京) <script>alert("xss")</script>',
          description: 'Special runes: ᚠᚢᚦᚨᚱᚲ and emojis: ⚔️🛡️🔥',
          year: -500,
          isPeriod: true
        }
      ]

      await exportTimelineToCsv(events, 'UnicodeWorld')
      const [, content] = mockExportFile.mock.calls[0]

      expect(content).toContain('"🏰 Rise of Valyria 🐉 (Köln & Tokyo 東京) <script>alert(""xss"")</script>"')
      expect(content).toContain('"Special runes: ᚠᚢᚦᚨᚱᚲ and emojis: ⚔️🛡️🔥"')
      expect(content).toContain('-500')
      expect(content).toContain('true')
    })

    it('roundtrips through an RFC-4180 compliant CSV parser with exact field fidelity', async () => {
      function parseCSV(text: string): string[][] {
        const rows: string[][] = []
        let row: string[] = []
        let field = ''
        let inQuotes = false
        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          if (inQuotes) {
            if (char === '"') {
              if (i + 1 < text.length && text[i + 1] === '"') {
                field += '"'
                i++
              } else {
                inQuotes = false
              }
            } else {
              field += char
            }
          } else {
            if (char === '"') {
              inQuotes = true
            } else if (char === ',') {
              row.push(field)
              field = ''
            } else if (char === '\n') {
              row.push(field)
              rows.push(row)
              row = []
              field = ''
            } else if (char === '\r') {
              if (i + 1 < text.length && text[i + 1] === '\n') {
                i++
              }
              row.push(field)
              rows.push(row)
              row = []
              field = ''
            } else {
              field += char
            }
          }
        }
        if (field || row.length > 0) {
          row.push(field)
          rows.push(row)
        }
        return rows
      }

      const events: TimelineEvent[] = [
        {
          id: 'e-1',
          worldId: 'w1',
          title: 'Title with "quotes" and , commas',
          description: 'Description with\nmultiline\r\nand "double quotes", and commas, plus ; semicolons.',
          year: -42,
          month: 0,
          day: 15,
          endYear: 10,
          era: 'Ancient Era',
          isPeriod: true,
          importance: 'critical',
          category: 'war',
          entityIds: ['ent-a', 'ent-b', 'ent-c']
        }
      ]

      await exportTimelineToCsv(events, 'Roundtrip')
      const [, content] = mockExportFile.mock.calls[0]
      const rows = parseCSV(content)

      expect(rows).toHaveLength(2) // Header + 1 record
      const [header, record] = rows
      expect(header).toEqual([
        'ID', 'Era', 'Year', 'Month', 'Day', 'EndYear', 'IsPeriod', 'Importance', 'Category', 'Title', 'Description', 'EntityIds'
      ])
      expect(record[0]).toBe('e-1')
      expect(record[1]).toBe('Ancient Era')
      expect(record[2]).toBe('-42')
      expect(record[3]).toBe('0')
      expect(record[4]).toBe('15')
      expect(record[5]).toBe('10')
      expect(record[6]).toBe('true')
      expect(record[7]).toBe('critical')
      expect(record[8]).toBe('war')
      expect(record[9]).toBe('Title with "quotes" and , commas')
      expect(record[10]).toBe('Description with\nmultiline\r\nand "double quotes", and commas, plus ; semicolons.')
      expect(record[11]).toBe('ent-a;ent-b;ent-c')
    })
  })

  describe('Dangling References & Missing Optional Fields', () => {
    it('handles links referencing missing entities in CSV without crashing', async () => {
      // entities list is empty, but link references e1 -> e2
      const links = [{ source: 'missing-src', target: 'missing-tgt' }]
      const success = await exportConnectionsToCsv([], links, 'Dangling')
      expect(success).toBe(true)

      const [, content] = mockExportFile.mock.calls[0]
      // Falls back gracefully to the source/target IDs in quotes
      expect(content).toContain('missing-src,"missing-src",missing-tgt,"missing-tgt"')
    })

    it('handles links referencing missing entities in JSON without undefined degree crash', async () => {
      const entities: LoreEntity[] = [
        {
          id: 'valid-e1',
          worldId: 'w1',
          title: 'Valid Entity',
          type: 'general',
          tags: [],
          folderId: 'f1',
          content: '',
          createdAt: '',
          updatedAt: ''
        }
      ]
      const links = [
        { source: 'valid-e1', target: 'ghost-entity' },
        { source: 'phantom-entity', target: 'valid-e1' }
      ]

      const success = await exportConnectionsToJson(entities, links, 'GhostWorld')
      expect(success).toBe(true)

      const [, content] = mockExportFile.mock.calls[0]
      const parsed = JSON.parse(content)
      expect(parsed.totalNodes).toBe(1)
      expect(parsed.totalConnections).toBe(2)
      // Node stats should only track valid-e1 without crashing on ghost entities
      expect(parsed.nodes[0].stats).toEqual({ inDegree: 1, outDegree: 1, total: 2 })
    })

    it('handles timeline events with missing/undefined optional fields', async () => {
      const bareEvent: TimelineEvent = {
        id: 'bare-1',
        worldId: 'w1',
        title: 'Event without optionals',
        year: 2026,
        isPeriod: false
      }

      await exportTimelineToCsv([bareEvent], 'Bare')
      const [, content] = mockExportFile.mock.calls[0]
      // Check commas alignment: id, era, year, month, day, endYear, isPeriod, importance, category, title, description, entityIds
      expect(content).toContain('bare-1,"",2026,,,,false,minor,"","Event without optionals","",""')
    })
  })

  describe('Deeply Nested Structures & Roundtrip Fidelity', () => {
    it('preserves deeply nested canvas nodes, properties, and custom data in JSON export', async () => {
      const deeplyNestedNode = {
        id: 'node-nested',
        type: 'customEntity',
        position: { x: 100.5, y: 250.25 },
        data: {
          entityId: 'ent-1',
          nestedMeta: {
            deep: {
              levels: [
                { id: 1, labels: ['primary', 'verified'] },
                { id: 2, labels: ['secondary', 'draft'] }
              ],
              config: {
                active: true,
                ratio: 1.618,
                formula: 'x^2 + y^2 = r^2'
              }
            }
          }
        }
      }

      const canvas: WhiteboardCanvasData = {
        id: 'canvas-nested',
        worldId: 'w1',
        name: 'Deep Architecture Plan',
        nodes: [deeplyNestedNode],
        edges: [
          {
            id: 'e1',
            source: 'node-nested',
            target: 'node-other',
            data: { complexRule: { weight: 42, condition: 'always' } }
          }
        ],
        strokes: []
      }

      const success = await exportCanvasToJson(canvas, 'DeepWorld')
      expect(success).toBe(true)

      const [, content] = mockExportFile.mock.calls[0]
      const parsed = JSON.parse(content)

      // Verify complete deep structure preserved
      expect(parsed.canvas.nodes[0].data.nestedMeta.deep.levels[0].labels).toEqual(['primary', 'verified'])
      expect(parsed.canvas.nodes[0].data.nestedMeta.deep.config.ratio).toBe(1.618)
      expect(parsed.canvas.edges[0].data.complexRule.weight).toBe(42)
    })

    it('preserves complex fantasy calendar configurations in timeline JSON export', async () => {
      const complexCalendarConfig = {
        name: 'Solar-Lunar Imperial Calendar',
        epochYear: 0,
        daysInWeek: 8,
        weekdays: ['Sol', 'Luna', 'Ares', 'Hermes', 'Zeus', 'Aphrodite', 'Kronos', 'Aether'],
        months: [
          { name: 'Primus', days: 30, isIntercalary: false },
          { name: 'Midyear Festival', days: 5, isIntercalary: true },
          { name: 'Ultimus', days: 31, isIntercalary: false }
        ],
        leapRules: [
          { interval: 4, extraDays: 1, targetMonthIndex: 2 },
          { interval: 100, extraDays: -1, targetMonthIndex: 2 },
          { interval: 400, extraDays: 1, targetMonthIndex: 2 }
        ],
        moons: [
          { name: 'Selene', synodicPeriod: 29.53, color: '#e0e0e0' },
          { name: 'Hecate', synodicPeriod: 14.2, color: '#8b0000' }
        ]
      }

      const events: TimelineEvent[] = [
        {
          id: 'imperial-founding',
          worldId: 'w1',
          title: 'Empire Foundation',
          year: 1,
          month: 1,
          day: 1,
          isPeriod: false
        }
      ]

      await exportTimelineToJson(events, complexCalendarConfig, 'Empire')
      const [, content] = mockExportFile.mock.calls[0]
      const parsed = JSON.parse(content)

      expect(parsed.calendarConfig.moons).toHaveLength(2)
      expect(parsed.calendarConfig.leapRules).toHaveLength(3)
      expect(parsed.calendarConfig.months[1].isIntercalary).toBe(true)
    })
  })

  describe('Filename Sanitization Edge Cases', () => {
    it('sanitizes illegal Windows and UNIX characters in worldName and canvas name', async () => {
      const canvas: WhiteboardCanvasData = {
        id: 'c1',
        worldId: 'w1',
        name: 'Secret / Plans : * ? < > | \\ & "!@#$',
        nodes: [],
        edges: [],
        strokes: []
      }

      await exportCanvasToJson(canvas, 'Dangerous: /\\*?<>| World')
      const [filename] = mockExportFile.mock.calls[0]

      // Canvas export uses canvas.name
      // safeName = (canvas.name || 'canvas').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      expect(filename).toBe('secret___plans_______________________canvas.json')
      expect(filename).not.toMatch(/[:*?<>"|\\]/)
    })
  })
})
