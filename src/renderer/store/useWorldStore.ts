import { create } from 'zustand'
import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter, 
  StorageData, MapPin, MapRegion,
  DirectoryFolder, DirectoryItem, DirectoryItemType, WorkspaceTab, 
  WhiteboardCanvasData, CanvasStroke
} from '@shared/types'
import { 
  sampleWorld, sampleEntities, sampleMap, sampleRelations, 
  sampleTimelines, sampleManuscript,
  sampleFolders, sampleDirectoryItems, sampleCanvases, sampleWorkspaceTabs
} from '../sample/sampleWorld'

export type ActiveNavTab = 'wiki' | 'cards' | 'relations' | 'wiki-network' | 'maps' | 'timeline' | 'writer' | 'graph' | 'canvas';

interface WorldState {
  // Navigation & UI state
  activeTab: ActiveNavTab;
  openTabs: WorkspaceTab[];
  activeTabId: string;
  activeWorldId: string | null;
  selectedEntityId: string | null;
  selectedMapId: string | null;
  selectedChapterId: string | null;
  selectedCanvasId: string | null;
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
  folders: Record<string, DirectoryFolder[]>;
  directoryItems: Record<string, DirectoryItem[]>;
  canvases: Record<string, WhiteboardCanvasData[]>;

  // Actions
  initStore: () => Promise<void>;
  persistStore: () => Promise<void>;
  setActiveTab: (tab: ActiveNavTab) => void;
  setActiveWorldId: (id: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedMapId: (id: string | null) => void;
  setSelectedChapterId: (id: string | null) => void;
  setSelectedCanvasId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleGmMode: () => void;

  // Workspace Tabs Actions
  openTab: (tab: { title: string; type: DirectoryItemType; targetId?: string; id?: string }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToTheRight: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTabId: (tabId: string) => void;

  // Directory Folders CRUD
  createFolder: (name: string, parentId?: string | null) => DirectoryFolder;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderOpen: (folderId: string) => void;

  // Directory Items CRUD
  createDirectoryItem: (name: string, type: DirectoryItemType, folderId?: string | null, targetId?: string) => DirectoryItem;
  deleteDirectoryItem: (itemId: string) => void;
  moveItemToFolder: (itemId: string, folderId: string | null) => void;

  // Canvas Actions
  createCanvas: (name?: string, folderId?: string | null) => WhiteboardCanvasData;
  updateCanvas: (canvasId: string, updates: Partial<WhiteboardCanvasData>) => void;
  deleteCanvas: (canvasId: string) => void;
  saveCanvasNodesAndEdges: (canvasId: string, nodes: any[], edges: any[]) => void;
  addCanvasStroke: (canvasId: string, stroke: CanvasStroke) => void;
  clearCanvasStrokes: (canvasId: string) => void;

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
  updatePinOnMap: (mapId: string, pinId: string, updates: Partial<MapPin>) => void;
  removePinFromMap: (mapId: string, pinId: string) => void;
  addRegionToMap: (mapId: string, region: Omit<MapRegion, 'id' | 'mapId'>) => void;
  updateRegionOnMap: (mapId: string, regionId: string, updates: Partial<MapRegion>) => void;
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
  activeTab: 'canvas',
  openTabs: sampleWorkspaceTabs,
  activeTabId: 'tab-canvas',
  activeWorldId: sampleWorld.id,
  selectedEntityId: sampleEntities[0].id,
  selectedMapId: sampleMap.id,
  selectedChapterId: sampleManuscript[0].id,
  selectedCanvasId: sampleCanvases[0].id,
  searchQuery: '',
  isSaving: false,
  gmMode: false,

  worlds: [sampleWorld],
  entities: { [sampleWorld.id]: sampleEntities },
  maps: { [sampleWorld.id]: [sampleMap] },
  relations: { [sampleWorld.id]: sampleRelations },
  timelines: { [sampleWorld.id]: sampleTimelines },
  manuscripts: { [sampleWorld.id]: sampleManuscript },
  folders: { [sampleWorld.id]: sampleFolders },
  directoryItems: { [sampleWorld.id]: sampleDirectoryItems },
  canvases: { [sampleWorld.id]: sampleCanvases },

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
            manuscripts: parsed.manuscripts || { [sampleWorld.id]: sampleManuscript },
            folders: parsed.folders || { [sampleWorld.id]: sampleFolders },
            directoryItems: parsed.directoryItems || { [sampleWorld.id]: sampleDirectoryItems },
            canvases: parsed.canvases || { [sampleWorld.id]: sampleCanvases }
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
      manuscripts: s.manuscripts,
      folders: s.folders,
      directoryItems: s.directoryItems,
      canvases: s.canvases
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
    const canvases = get().canvases[id] || [];
    set({ 
      activeWorldId: id,
      selectedEntityId: entities[0]?.id || null,
      selectedMapId: maps[0]?.id || null,
      selectedChapterId: chapters[0]?.id || null,
      selectedCanvasId: canvases[0]?.id || null
    });
    get().persistStore();
  },
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setSelectedMapId: (id) => set({ selectedMapId: id }),
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setSelectedCanvasId: (id) => set({ selectedCanvasId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleGmMode: () => set((state) => ({ gmMode: !state.gmMode })),

  // Workspace Tabs Actions
  openTab: (tab) => {
    const s = get();
    // Check if an identical tab is already open
    const existing = s.openTabs.find((t) => 
      tab.id ? t.id === tab.id : (t.type === tab.type && (tab.targetId ? t.targetId === tab.targetId : true))
    );
    if (existing) {
      set({ 
        activeTabId: existing.id, 
        activeTab: existing.type as ActiveNavTab 
      });
      if (existing.targetId) {
        if (existing.type === 'wiki' || existing.type === 'card') set({ selectedEntityId: existing.targetId });
        if (existing.type === 'map') set({ selectedMapId: existing.targetId });
        if (existing.type === 'writer') set({ selectedChapterId: existing.targetId });
        if (existing.type === 'canvas') set({ selectedCanvasId: existing.targetId });
      }
      return;
    }

    const newTab: WorkspaceTab = {
      id: tab.id || `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: tab.title,
      type: tab.type,
      targetId: tab.targetId,
      isClosable: true
    };

    set({
      openTabs: [...s.openTabs, newTab],
      activeTabId: newTab.id,
      activeTab: newTab.type as ActiveNavTab
    });

    if (newTab.targetId) {
      if (newTab.type === 'wiki' || newTab.type === 'card') set({ selectedEntityId: newTab.targetId });
      if (newTab.type === 'map') set({ selectedMapId: newTab.targetId });
      if (newTab.type === 'writer') set({ selectedChapterId: newTab.targetId });
      if (newTab.type === 'canvas') set({ selectedCanvasId: newTab.targetId });
    }
  },

  closeTab: (tabId) => {
    const s = get();
    const index = s.openTabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;
    const newTabs = s.openTabs.filter((t) => t.id !== tabId);

    if (newTabs.length === 0) {
      // When there are no tabs, display card relation nodes (wiki-network)
      set({
        openTabs: [],
        activeTabId: '',
        activeTab: 'wiki-network'
      });
      return;
    }

    let nextActiveId = s.activeTabId;
    if (s.activeTabId === tabId) {
      const nextTab = newTabs[Math.max(0, index - 1)];
      nextActiveId = nextTab.id;
      set({ activeTab: nextTab.type as ActiveNavTab });
      if (nextTab.targetId) {
        if (nextTab.type === 'wiki' || nextTab.type === 'card') set({ selectedEntityId: nextTab.targetId });
        if (nextTab.type === 'map') set({ selectedMapId: nextTab.targetId });
        if (nextTab.type === 'writer') set({ selectedChapterId: nextTab.targetId });
        if (nextTab.type === 'canvas') set({ selectedCanvasId: nextTab.targetId });
      }
    }
    set({ openTabs: newTabs, activeTabId: nextActiveId });
  },

  closeOtherTabs: (tabId) => {
    const s = get();
    const keptTab = s.openTabs.find((t) => t.id === tabId);
    if (!keptTab) return;
    set({
      openTabs: [keptTab],
      activeTabId: keptTab.id,
      activeTab: keptTab.type as ActiveNavTab
    });
    if (keptTab.targetId) {
      if (keptTab.type === 'wiki' || keptTab.type === 'card') set({ selectedEntityId: keptTab.targetId });
      if (keptTab.type === 'map') set({ selectedMapId: keptTab.targetId });
      if (keptTab.type === 'writer') set({ selectedChapterId: keptTab.targetId });
      if (keptTab.type === 'canvas') set({ selectedCanvasId: keptTab.targetId });
    }
  },

  closeTabsToTheRight: (tabId) => {
    const s = get();
    const index = s.openTabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;
    const newTabs = s.openTabs.slice(0, index + 1);
    const stillHasActive = newTabs.some((t) => t.id === s.activeTabId);
    const nextActiveId = stillHasActive ? s.activeTabId : tabId;
    const activeTabObj = newTabs.find((t) => t.id === nextActiveId) || newTabs[0];
    set({
      openTabs: newTabs,
      activeTabId: nextActiveId,
      activeTab: activeTabObj.type as ActiveNavTab
    });
    if (activeTabObj.targetId) {
      if (activeTabObj.type === 'wiki' || activeTabObj.type === 'card') set({ selectedEntityId: activeTabObj.targetId });
      if (activeTabObj.type === 'map') set({ selectedMapId: activeTabObj.targetId });
      if (activeTabObj.type === 'writer') set({ selectedChapterId: activeTabObj.targetId });
      if (activeTabObj.type === 'canvas') set({ selectedCanvasId: activeTabObj.targetId });
    }
  },

  closeAllTabs: () => {
    // When there are no tabs, display card relation nodes (wiki-network)
    set({
      openTabs: [],
      activeTabId: '',
      activeTab: 'wiki-network'
    });
  },

  setActiveTabId: (tabId) => {
    const s = get();
    const tab = s.openTabs.find((t) => t.id === tabId);
    if (tab) {
      set({ activeTabId: tabId, activeTab: tab.type as ActiveNavTab });
      if (tab.targetId) {
        if (tab.type === 'wiki' || tab.type === 'card') set({ selectedEntityId: tab.targetId });
        if (tab.type === 'map') set({ selectedMapId: tab.targetId });
        if (tab.type === 'writer') set({ selectedChapterId: tab.targetId });
        if (tab.type === 'canvas') set({ selectedCanvasId: tab.targetId });
      }
    }
  },

  // Directory Folders CRUD
  createFolder: (name, parentId = null) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newFolder: DirectoryFolder = {
      id: `folder-${Date.now()}`,
      worldId,
      name,
      parentId,
      isOpen: true,
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      folders: {
        ...state.folders,
        [worldId]: [...(state.folders[worldId] || []), newFolder]
      }
    }));
    get().persistStore();
    return newFolder;
  },

  renameFolder: (folderId, name) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      folders: {
        ...state.folders,
        [worldId]: (state.folders[worldId] || []).map((f) =>
          f.id === folderId ? { ...f, name } : f
        )
      }
    }));
    get().persistStore();
  },

  deleteFolder: (folderId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      folders: {
        ...state.folders,
        [worldId]: (state.folders[worldId] || []).filter((f) => f.id !== folderId)
      },
      // Move items in deleted folder to root
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).map((item) =>
          item.folderId === folderId ? { ...item, folderId: null } : item
        )
      }
    }));
    get().persistStore();
  },

  toggleFolderOpen: (folderId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      folders: {
        ...state.folders,
        [worldId]: (state.folders[worldId] || []).map((f) =>
          f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
        )
      }
    }));
  },

  // Directory Items CRUD
  createDirectoryItem: (name, type, folderId = null, targetId) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newItem: DirectoryItem = {
      id: `item-${Date.now()}`,
      worldId,
      name,
      type,
      folderId,
      targetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: [...(state.directoryItems[worldId] || []), newItem]
      }
    }));
    get().persistStore();
    return newItem;
  },

  deleteDirectoryItem: (itemId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).filter((item) => item.id !== itemId)
      }
    }));
    get().persistStore();
  },

  moveItemToFolder: (itemId, folderId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).map((item) =>
          item.id === itemId ? { ...item, folderId, updatedAt: new Date().toISOString() } : item
        )
      }
    }));
    get().persistStore();
  },

  // Canvas Actions
  createCanvas: (name = 'New Canvas', folderId = null) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newCanvas: WhiteboardCanvasData = {
      id: `canvas-${Date.now()}`,
      worldId,
      name,
      nodes: [],
      edges: [],
      strokes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const newItem: DirectoryItem = {
      id: `item-${Date.now()}`,
      worldId,
      name,
      type: 'canvas',
      folderId,
      targetId: newCanvas.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: [...(state.canvases[worldId] || []), newCanvas]
      },
      directoryItems: {
        ...state.directoryItems,
        [worldId]: [...(state.directoryItems[worldId] || []), newItem]
      },
      selectedCanvasId: newCanvas.id
    }));
    get().openTab({
      title: name,
      type: 'canvas',
      targetId: newCanvas.id
    });
    get().persistStore();
    return newCanvas;
  },

  updateCanvas: (canvasId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: (state.canvases[worldId] || []).map((c) =>
          c.id === canvasId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      }
    }));
    get().persistStore();
  },

  deleteCanvas: (canvasId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: (state.canvases[worldId] || []).filter((c) => c.id !== canvasId)
      },
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).filter((item) => item.targetId !== canvasId)
      }
    }));
    get().persistStore();
  },

  saveCanvasNodesAndEdges: (canvasId, nodes, edges) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: (state.canvases[worldId] || []).map((c) =>
          c.id === canvasId ? { ...c, nodes, edges, updatedAt: new Date().toISOString() } : c
        )
      }
    }));
    get().persistStore();
  },

  addCanvasStroke: (canvasId, stroke) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: (state.canvases[worldId] || []).map((c) =>
          c.id === canvasId 
            ? { ...c, strokes: [...(c.strokes || []), stroke], updatedAt: new Date().toISOString() } 
            : c
        )
      }
    }));
    get().persistStore();
  },

  clearCanvasStrokes: (canvasId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => ({
      canvases: {
        ...state.canvases,
        [worldId]: (state.canvases[worldId] || []).map((c) =>
          c.id === canvasId ? { ...c, strokes: [], updatedAt: new Date().toISOString() } : c
        )
      }
    }));
    get().persistStore();
  },

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

  updatePinOnMap: (mapId, pinId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId
          ? {
              ...m,
              pins: m.pins.map((p) => (p.id === pinId ? { ...p, ...updates } : p))
            }
          : m
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

  updateRegionOnMap: (mapId, regionId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).map((m) =>
        m.id === mapId
          ? {
              ...m,
              regions: m.regions.map((r) => (r.id === regionId ? { ...r, ...updates } : r))
            }
          : m
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
