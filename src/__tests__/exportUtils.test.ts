import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

describe('exportUtils', () => {
  let mockExportFile: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockExportFile = vi.fn().mockResolvedValue(true)
    // Setup window.oros mock for Electron save flow
    ;(globalThis as any).window = {
      oros: {
        exportFile: mockExportFile
      }
    }
  })

  afterEach(() => {
    delete (globalThis as any).window
  })

  describe('exportConnectionsToCsv', () => {
    it('serializes connection links with escaped titles into CSV format', async () => {
      const entities: LoreEntity[] = [
        {
          id: 'e1',
          worldId: 'w1',
          title: 'King "Aethelred"',
          type: 'character',
          tags: ['royalty'],
          folderId: 'f1',
          content: '',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        },
        {
          id: 'e2',
          worldId: 'w1',
          title: 'Capital City',
          type: 'location',
          tags: ['settlement'],
          folderId: 'f1',
          content: '',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        }
      ]
      const links = [{ source: 'e1', target: 'e2' }]

      const success = await exportConnectionsToCsv(entities, links, 'Aethelgard')
      expect(success).toBe(true)
      expect(mockExportFile).toHaveBeenCalledTimes(1)

      const [filename, content, ext, filterName] = mockExportFile.mock.calls[0]
      expect(filename).toBe('aethelgard_connections_edgelist.csv')
      expect(ext).toBe('csv')
      expect(filterName).toBe('CSV File')

      const expectedHeader = 'Source ID,Source Title,Target ID,Target Title\n'
      expect(content.startsWith(expectedHeader)).toBe(true)
      expect(content).toContain('e1,"King ""Aethelred""",e2,"Capital City"')
    })
  })

  describe('exportConnectionsToJson', () => {
    it('computes node degrees and outputs structured network payload', async () => {
      const entities: LoreEntity[] = [
        {
          id: 'e1',
          worldId: 'w1',
          title: 'Alice',
          type: 'character',
          tags: ['hero'],
          folderId: 'f1',
          content: '',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        },
        {
          id: 'e2',
          worldId: 'w1',
          title: 'Bob',
          type: 'character',
          tags: ['companion'],
          folderId: 'f1',
          content: '',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        }
      ]
      const links = [
        { source: 'e1', target: 'e2' },
        { source: 'e2', target: 'e1' }
      ]

      const success = await exportConnectionsToJson(entities, links, 'Fantasy World')
      expect(success).toBe(true)

      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('fantasy_world_connections.json')

      const parsed = JSON.parse(content)
      expect(parsed.type).toBe('wiki-knowledge-network')
      expect(parsed.totalNodes).toBe(2)
      expect(parsed.totalConnections).toBe(2)
      expect(parsed.nodes[0].stats).toEqual({ inDegree: 1, outDegree: 1, total: 2 })
    })
  })

  describe('exportTimelineToCsv', () => {
    it('generates standard CSV columns and escapes double quotes in description', async () => {
      const events: TimelineEvent[] = [
        {
          id: 'evt-1',
          worldId: 'w1',
          title: 'The Great "Cataclysm"',
          description: 'A major disaster that shook the "entire" continent.',
          year: 1042,
          era: 'Second Age',
          isPeriod: false,
          importance: 'major',
          category: 'disaster',
          entityIds: ['e1', 'e2']
        }
      ]

      const success = await exportTimelineToCsv(events, 'Chronicles')
      expect(success).toBe(true)

      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('chronicles_chronology.csv')
      expect(content).toContain('evt-1,"Second Age",1042,,,,false,major,"disaster","The Great ""Cataclysm""","A major disaster that shook the ""entire"" continent.","e1;e2"')
    })
  })

  describe('exportTimelineToJson', () => {
    it('structures timeline export with calendar config and event count', async () => {
      const events: TimelineEvent[] = [
        {
          id: 'evt-1',
          worldId: 'w1',
          title: 'Coronation',
          year: 500,
          isPeriod: false
        }
      ]
      const config = { daysInWeek: 7, monthsCount: 12 }

      await exportTimelineToJson(events, config, 'My Realm')
      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('my_realm_chronology.json')

      const parsed = JSON.parse(content)
      expect(parsed.type).toBe('chronology-timeline')
      expect(parsed.totalRecords).toBe(1)
      expect(parsed.calendarConfig).toEqual(config)
    })
  })

  describe('exportCanvasToJson', () => {
    it('exports whiteboard canvas payload with nodes, edges, strokes', async () => {
      const canvas: WhiteboardCanvasData = {
        id: 'canvas-1',
        worldId: 'w1',
        name: 'Battle Plan',
        nodes: [{ id: 'n1', type: 'custom', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        strokes: []
      }

      await exportCanvasToJson(canvas, 'Tactics')
      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('battle_plan_canvas.json')

      const parsed = JSON.parse(content)
      expect(parsed.type).toBe('whiteboard-canvas')
      expect(parsed.canvas.id).toBe('canvas-1')
      expect(parsed.canvas.nodes).toHaveLength(1)
    })
  })

  describe('exportMapToJson', () => {
    it('exports cartography map to JSON with sanitized filename', async () => {
      const map: WorldMap = {
        id: 'map-1',
        worldId: 'w1',
        name: 'The Whispering Forest / Coast!',
        imageUrl: 'data:image/png;base64,...',
        scaleDistance: 100,
        scaleUnit: 'km',
        scaleBarPixels: 50,
        gridConfig: { enabled: true, size: 32, opacity: 0.5, color: '#ffffff' },
        regions: [],
        pins: []
      }

      await exportMapToJson(map, 'ForestRealm')
      const [filename, content] = mockExportFile.mock.calls[0]
      expect(filename).toBe('the_whispering_forest___coast__cartography.json')

      const parsed = JSON.parse(content)
      expect(parsed.type).toBe('cartography-map')
      expect(parsed.map.name).toBe('The Whispering Forest / Coast!')
    })
  })
})
