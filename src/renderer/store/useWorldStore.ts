import { create } from 'zustand'
import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter, 
  StorageData, MapPin, MapRegion 
} from '@shared/types'
import { 
  sampleWorld, sampleEntities, sampleMap, sampleRelations, 
  sampleTimelines, sampleManuscript 
} from '../sample/sampleWorld'

export type ActiveNavTab = 'wiki' | 'cards' | 'relations' | 'wiki-network' | 'maps' | 'timeline' | 'writer' | 'graph';

interface WorldState {
  // Navigation & UI state
  activeTab: ActiveNavTab;
  activeWorldId: string | null;
  selectedEntityId: string | null;
  selectedMapId: string | null;
  selectedChapterId: string | null;
  searchQuery: string;
  isSaving: boolean;
  gmMode: boolean; // Toggle GM / Private notes and hidden layers

  // Data Store
  worlds: World[];
  entities: Record<string, LoreEntity[]>;
  maps: Record<string, WorldMap[]>;
  relations: Record<string, RelationEdge[]>;
  timelines: Record<string, TimelineEvent[]>;
  manuscripts: Record<string, ManuscriptChapter[]>;

  // Actions
  initStore: () => Promise<void>;
  persistStore: () => Promise<void>;
  setActiveTab: (tab: ActiveNavTab) => void;
  setActiveWorldId: (id: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedMapId: (id: string | null) => void;
  setSelectedChapterId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleGmMode: () => void;

  // World CRUD
  createWorld: (name: string, tagline: string, genre: string) => void;
  
  // Entity CRUD
  createEntity: (type: LoreEntity['type'], title: string) => LoreEntity;
  updateEntity: (entityId: string, updates: Partial<LoreEntity>) => void;
  deleteEntity: (entityId: string) => void;

  // Map CRUD
  createMap: (name: string, imageUrl: string) => WorldMap;
  updateMap: (mapId: string, updates: Partial<WorldMap>) => void;
  addPinToMap: (mapId: string, pin: Omit<MapPin, 'id' | 'mapId'>) => void;
  removePinFromMap: (mapId: string, pinId: string) => void;
  addRegionToMap: (mapId: string, region: Omit<MapRegion, 'id' | 'mapId'>) => void;
  removeRegionFromMap: (mapId: string, regionId: string) => void;

  // Relations CRUD
  createRelation: (relation: Omit<RelationEdge, 'id' | 'worldId'>) => void;
  updateRelation: (relationId: string, updates: Partial<RelationEdge>) => void;
  deleteRelation: (relationId: string) => void;

  // Timeline CRUD
  createTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'worldId'>) => void;
  deleteTimelineEvent: (eventId: string) => void;

  // Manuscript CRUD
  createChapter: (title: string) => void;
  updateChapter: (chapterId: string, content: string, title?: string) => void;
  deleteChapter: (chapterId: string) => void;

  // Export
  exportWorld: () => Promise<void>;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  activeTab: 'wiki',
  activeWorldId: sampleWorld.id,
  selectedEntityId: sampleEntities[0].id,
  selectedMapId: sampleMap.id,
  selectedChapterId: sampleManuscript[0].id,
  searchQuery: '',
  isSaving: false,
  gmMode: false,

  worlds: [sampleWorld],
  entities: { [sampleWorld.id]: sampleEntities },
  maps: { [sampleWorld.id]: [sampleMap] },
  relations: { [sampleWorld.id]: sampleRelations },
  timelines: { [sampleWorld.id]: sampleTimelines },
  manuscripts: { [sampleWorld.id]: sampleManuscript },

  initStore: async () => {
    try {
      if (window.oros) {
        const raw = await window.oros.loadVault();
        if (raw) {
          const parsed: StorageData = JSON.parse(raw);
          set({
            worlds: parsed.worlds || [sampleWorld],
            activeWorldId: parsed.activeWorldId || sampleWorld.id,
            entities: parsed.entities || { [sampleWorld.id]: sampleEntities },
            maps: parsed.maps || { [sampleWorld.id]: [sampleMap] },
            relations: parsed.relations || { [sampleWorld.id]: sampleRelations },
            timelines: parsed.timelines || { [sampleWorld.id]: sampleTimelines },
            manuscripts: parsed.manuscripts || { [sampleWorld.id]: sampleManuscript }
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load from desktop vault, falling back to default:', err);
    }
  },

  persistStore: async () => {
    const s = get();
    set({ isSaving: true });
    const payload: StorageData = {
      version: '1.0.0',
      worlds: s.worlds,
      activeWorldId: s.activeWorldId,
      entities: s.entities,
      maps: s.maps,
      relations: s.relations,
      timelines: s.timelines,
      manuscripts: s.manuscripts
    };
    try {
      if (window.oros) {
        await window.oros.saveVault(JSON.stringify(payload, null, 2));
      } else {
        localStorage.setItem('oros_vault', JSON.stringify(payload));
      }
    } finally {
      setTimeout(() => set({ isSaving: false }), 400);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveWorldId: (id) => {
    const entities = get().entities[id] || [];
    const maps = get().maps[id] || [];
    const chapters = get().manuscripts[id] || [];
    set({ 
      activeWorldId: id,
      selectedEntityId: entities[0]?.id || null,
      selectedMapId: maps[0]?.id || null,
      selectedChapterId: chapters[0]?.id || null
    });
    get().persistStore();
  },
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setSelectedMapId: (id) => set({ selectedMapId: id }),
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleGmMode: () => set((state) => ({ gmMode: !state.gmMode })),

  createWorld: (name, tagline, genre) => {
    const newWorld: World = {
      id: `world-${Date.now()}`,
      name,
      tagline,
      description: '',
      genre,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      worlds: [...state.worlds, newWorld],
      activeWorldId: newWorld.id,
      entities: { ...state.entities, [newWorld.id]: [] },
      maps: { ...state.maps, [newWorld.id]: [] },
      relations: { ...state.relations, [newWorld.id]: [] },
      timelines: { ...state.timelines, [newWorld.id]: [] },
      manuscripts: { ...state.manuscripts, [newWorld.id]: [] }
    }));
    get().persistStore();
  },

  createEntity: (type, title) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newEntity: LoreEntity = {
      id: `entity-${Date.now()}`,
      worldId,
      title,
      type,
      summary: '',
      content: `<p>Start chronicling <strong>${title}</strong> here...</p>`,
      tags: [],
      aliases: [],
      infobox: {
        subtitle: `${type.toUpperCase()} of ${get().worlds.find(w => w.id === worldId)?.name || 'the Realm'}`,
        sections: [
          {
            title: 'Overview',
            fields: [
              { id: `f-${Date.now()}-1`, label: 'Status', value: 'Active', type: 'text' },
              { id: `f-${Date.now()}-2`, label: 'Origin', value: 'Unknown', type: 'text' }
            ]
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => {
      const list = state.entities[worldId] || [];
      return {
        entities: {
          ...state.entities,
          [worldId]: [newEntity, ...list]
        },
        selectedEntityId: newEntity.id
      };
    });

    get().persistStore();
    return newEntity;
  },

  updateEntity: (entityId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.entities[worldId] || []).map((ent) => 
        ent.id === entityId 
          ? { ...ent, ...updates, updatedAt: new Date().toISOString() } 
          : ent
      );
      return {
        entities: { ...state.entities, [worldId]: list }
      };
    });
    get().persistStore();
  },

  deleteEntity: (entityId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.entities[worldId] || []).filter((e) => e.id !== entityId);
      return {
        entities: { ...state.entities, [worldId]: list },
        selectedEntityId: state.selectedEntityId === entityId ? (list[0]?.id || null) : state.selectedEntityId
      };
    });
    get().persistStore();
  },

  createMap: (name, imageUrl) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newMap: WorldMap = {
      id: `map-${Date.now()}`,
      worldId,
      name,
      imageUrl,
      pins: [],
      regions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => {
      const list = state.maps[worldId] || [];
      return {
        maps: { ...state.maps, [worldId]: [...list, newMap] },
        selectedMapId: newMap.id
      };
    });
    get().persistStore();
    return newMap;
  },

  updateMap: (mapId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      );
      return { maps: { ...state.maps, [worldId]: list } };
    });
    get().persistStore();
  },

  addPinToMap: (mapId, pin) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const newPin: MapPin = { ...pin, id: `pin-${Date.now()}`, mapId };
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId ? { ...m, pins: [...m.pins, newPin] } : m
      );
      return { maps: { ...state.maps, [worldId]: list } };
    });
    get().persistStore();
  },

  removePinFromMap: (mapId, pinId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId ? { ...m, pins: m.pins.filter((p) => p.id !== pinId) } : m
      );
      return { maps: { ...state.maps, [worldId]: list } };
    });
    get().persistStore();
  },

  addRegionToMap: (mapId, region) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const newRegion: MapRegion = { ...region, id: `reg-${Date.now()}`, mapId };
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId ? { ...m, regions: [...m.regions, newRegion] } : m
      );
      return { maps: { ...state.maps, [worldId]: list } };
    });
    get().persistStore();
  },

  removeRegionFromMap: (mapId, regionId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId ? { ...m, regions: m.regions.filter((r) => r.id !== regionId) } : m
      );
      return { maps: { ...state.maps, [worldId]: list } };
    });
    get().persistStore();
  },

  createRelation: (relation) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const newRelation: RelationEdge = { ...relation, id: `rel-${Date.now()}`, worldId };
    set((state) => {
      const list = state.relations[worldId] || [];
      return { relations: { ...state.relations, [worldId]: [...list, newRelation] } };
    });
    get().persistStore();
  },

  updateRelation: (relationId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.relations[worldId] || []).map((r) =>
        r.id === relationId ? { ...r, ...updates } : r
      );
      return { relations: { ...state.relations, [worldId]: list } };
    });
    get().persistStore();
  },

  deleteRelation: (relationId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.relations[worldId] || []).filter((r) => r.id !== relationId);
      return { relations: { ...state.relations, [worldId]: list } };
    });
    get().persistStore();
  },

  createTimelineEvent: (event) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const newEvent: TimelineEvent = { ...event, id: `t-${Date.now()}`, worldId };
    set((state) => {
      const list = state.timelines[worldId] || [];
      const updated = [...list, newEvent].sort((a, b) => a.year - b.year);
      return { timelines: { ...state.timelines, [worldId]: updated } };
    });
    get().persistStore();
  },

  deleteTimelineEvent: (eventId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.timelines[worldId] || []).filter((t) => t.id !== eventId);
      return { timelines: { ...state.timelines, [worldId]: list } };
    });
    get().persistStore();
  },

  createChapter: (title) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const chapters = get().manuscripts[worldId] || [];
    const newChapter: ManuscriptChapter = {
      id: `ch-${Date.now()}`,
      worldId,
      title,
      content: `<p>Start writing chapter...</p>`,
      order: chapters.length + 1,
      wordCount: 0,
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      manuscripts: { ...state.manuscripts, [worldId]: [...chapters, newChapter] },
      selectedChapterId: newChapter.id
    }));
    get().persistStore();
  },

  updateChapter: (chapterId, content, title) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    set((state) => {
      const list = (state.manuscripts[worldId] || []).map((ch) =>
        ch.id === chapterId 
          ? { 
              ...ch, 
              content, 
              title: title !== undefined ? title : ch.title,
              wordCount: words, 
              updatedAt: new Date().toISOString() 
            } 
          : ch
      );
      return { manuscripts: { ...state.manuscripts, [worldId]: list } };
    });
    get().persistStore();
  },

  deleteChapter: (chapterId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.manuscripts[worldId] || []).filter((c) => c.id !== chapterId);
      return { 
        manuscripts: { ...state.manuscripts, [worldId]: list },
        selectedChapterId: state.selectedChapterId === chapterId ? (list[0]?.id || null) : state.selectedChapterId
      };
    });
    get().persistStore();
  },

  exportWorld: async () => {
    const s = get();
    const activeWorld = s.worlds.find((w) => w.id === s.activeWorldId);
    if (!activeWorld || !s.activeWorldId) return;

    const exportData = {
      world: activeWorld,
      entities: s.entities[s.activeWorldId] || [],
      maps: s.maps[s.activeWorldId] || [],
      relations: s.relations[s.activeWorldId] || [],
      timelines: s.timelines[s.activeWorldId] || [],
      manuscripts: s.manuscripts[s.activeWorldId] || []
    };

    const json = JSON.stringify(exportData, null, 2);
    if (window.oros) {
      await window.oros.exportWorld(activeWorld.name.replace(/[^a-z0-9_-]/gi, '_'), json);
    } else {
      // Browser fallback download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeWorld.name}.oros.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}))
