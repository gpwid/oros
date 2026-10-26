import { create } from 'zustand'
import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter, 
  StorageData, MapPin, MapRegion,
  DirectoryFolder, DirectoryItem, DirectoryItemType, WorkspaceTab, 
  WhiteboardCanvasData, CanvasStroke, EntityCategory, WorldCalendarConfig, InfoboxSection,
  ConlangLanguage, ConlangWord
} from '@shared/types'
import { DEFAULT_PRESET_CATEGORIES, getCategoryMeta } from '../utils/categoryIcons'
import { 
  DEFAULT_FANTASY_CALENDAR_CONFIG,
  DEFAULT_TIMELINE_CATEGORIES,
  DEFAULT_PERIOD_CLASSIFICATIONS
} from '../utils/calendarDefaults'
import { 
  sampleWorld, sampleEntities, sampleMap, sampleRelations, 
  sampleTimelines, sampleManuscript,
  sampleFolders, sampleDirectoryItems, sampleCanvases, sampleWorkspaceTabs,
  sampleConlangs, sampleRelationNodePositions
} from '../sample/sampleWorld'
import { getTemplateById, getTemplateForType } from '../utils/entityTemplates'
import { useTtrpgStore } from './useTtrpgStore'

export type ActiveNavTab = 'wiki' | 'cards' | 'relations' | 'wiki-network' | 'maps' | 'timeline' | 'writer' | 'graph' | 'canvas' | 'dictionary';

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
  selectedLanguageId: string | null;
  searchQuery: string;
  isSaving: boolean;
  gmMode: boolean; // Toggle GM / Private notes and hidden layers
  sidebarCollapsed: boolean;
  appView: 'home' | 'workspace';
  
  // Codex Reader Mode State
  isReaderMode: boolean;
  readerTarget: { type: 'card' | 'entity' | 'chapter'; id: string } | null;
  openReaderMode: (target?: { type: 'card' | 'entity' | 'chapter'; id: string }) => void;
  closeReaderMode: () => void;

  // Polyhedral Dice Tray State
  isDiceTrayOpen: boolean;
  toggleDiceTray: () => void;
  setDiceTrayOpen: (open: boolean) => void;

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
  categories: Record<string, EntityCategory[]>;
  calendars: Record<string, WorldCalendarConfig>;
  relationNodePositions: Record<string, Record<string, { x: number; y: number }>>;
  conlangs: Record<string, ConlangLanguage[]>;

  // Actions
  initStore: () => Promise<void>;
  persistStore: () => Promise<void>;
  flushSave: () => Promise<void>;
  setActiveTab: (tab: ActiveNavTab) => void;
  setActiveWorldId: (id: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedMapId: (id: string | null) => void;
  setSelectedChapterId: (id: string | null) => void;
  setSelectedCanvasId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleGmMode: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAppView: (view: 'home' | 'workspace') => void;

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
  duplicateFolder: (folderId: string) => DirectoryFolder | null;
  toggleFolderOpen: (folderId: string) => void;
  moveFolderToFolder: (folderId: string, parentId: string | null) => void;

  // Directory Items CRUD
  createDirectoryItem: (name: string, type: DirectoryItemType, folderId?: string | null, targetId?: string) => DirectoryItem;
  renameDirectoryItem: (itemId: string, newName: string) => void;
  duplicateDirectoryItem: (itemId: string) => DirectoryItem | null;
  deleteDirectoryItem: (itemId: string) => void;
  moveItemToFolder: (itemId: string, folderId: string | null) => void;
  batchMoveItemsToFolder: (itemIds: string[], folderId: string | null) => void;
  batchDeleteDirectoryItems: (itemIds: string[]) => void;
  syncVaultDirectory: (targetWorldId?: string) => void;

  // Canvas Actions
  createCanvas: (name?: string, folderId?: string | null) => WhiteboardCanvasData;
  updateCanvas: (canvasId: string, updates: Partial<WhiteboardCanvasData>) => void;
  deleteCanvas: (canvasId: string) => void;
  saveCanvasNodesAndEdges: (canvasId: string, nodes: any[], edges: any[]) => void;
  addCanvasStroke: (canvasId: string, stroke: CanvasStroke) => void;
  clearCanvasStrokes: (canvasId: string) => void;

  // World CRUD
  createWorld: (
    name: string, 
    tagline: string, 
    genre: string, 
    theme?: World['theme'], 
    customAccentColor?: string,
    thumbnailUrl?: string,
    bannerUrl?: string
  ) => void;
  updateWorld: (worldId: string, updates: Partial<World>) => void;
  deleteWorld: (worldId: string) => void;
  setWorldTheme: (worldId: string, theme: World['theme'], customAccentColor?: string) => void;
  
  // Entity CRUD
  createEntity: (type: LoreEntity['type'], title: string, folderId?: string | null, templateId?: string) => LoreEntity;
  duplicateEntity: (entityId: string) => LoreEntity | null;
  updateEntity: (entityId: string, updates: Partial<LoreEntity>) => void;
  deleteEntity: (entityId: string) => void;

  // Category / Label CRUD
  getCategories: (worldId?: string) => EntityCategory[];
  createCategory: (name: string, icon?: string, color?: string, description?: string) => EntityCategory;
  updateCategory: (categoryId: string, updates: Partial<EntityCategory>) => void;
  deleteCategory: (categoryId: string, fallbackCategoryId?: string) => void;

  // Map CRUD
  createMap: (name: string, imageUrl: string, folderId?: string | null) => WorldMap;
  updateMap: (mapId: string, updates: Partial<WorldMap>) => void;
  deleteMap: (mapId: string) => void;
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
  saveRelationNodePosition: (entityId: string, position: { x: number; y: number }) => void;

  // Timeline & Chronology CRUD
  createTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'worldId'>) => void;
  updateTimelineEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (eventId: string) => void;
  getCalendarConfig: (worldId?: string) => WorldCalendarConfig;
  updateCalendarConfig: (worldId: string, updates: Partial<WorldCalendarConfig>) => void;

  // Manuscript CRUD
  createChapter: (title: string, folderId?: string | null) => void;
  updateChapter: (chapterId: string, content: string, title?: string) => void;
  deleteChapter: (chapterId: string) => void;
  moveChapter: (chapterId: string, direction: 'up' | 'down') => void;
  compileManuscript: () => Promise<boolean>;

  // Conlang & Linguistics CRUD
  createLanguage: (name: string, description?: string, family?: string, color?: string) => ConlangLanguage;
  updateLanguage: (languageId: string, updates: Partial<ConlangLanguage>) => void;
  deleteLanguage: (languageId: string) => void;
  setSelectedLanguageId: (id: string | null) => void;
  addWord: (languageId: string, word: Omit<ConlangWord, 'id' | 'languageId' | 'createdAt' | 'updatedAt'>) => ConlangWord;
  updateWord: (languageId: string, wordId: string, updates: Partial<ConlangWord>) => void;
  deleteWord: (languageId: string, wordId: string) => void;

  // Export & Import
  exportWorld: () => Promise<boolean>;
  importWorld: (rawJson?: string) => Promise<boolean>;
}

function getAutoSaveIntervalMs(): number {
  if (typeof window === 'undefined') return 1000
  try {
    const raw = localStorage.getItem('oros_app_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.general?.autoSaveIntervalMs === 'number') {
        return parsed.general.autoSaveIntervalMs
      }
    }
  } catch {}
  return 1000
}

function optimizeMuseumUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return url
  if (url.includes('images.metmuseum.org/CRDImages/') && url.includes('/original/')) {
    return url.replace('/original/', '/web-large/')
  }
  return url
}

function stripAttribution<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  const { attribution: _a, artAttribution: _b, ...rest } = obj as any
  return rest as T
}

function cleanCanvasAttribution(canvas: WhiteboardCanvasData): WhiteboardCanvasData {
  if (!canvas || typeof canvas !== 'object') return canvas
  return {
    ...stripAttribution(canvas),
    nodes: (canvas.nodes || []).map((node: any) => {
      if (node && typeof node === 'object') {
        const cleanedNode = stripAttribution(node)
        if (cleanedNode.data && typeof cleanedNode.data === 'object') {
          return {
            ...cleanedNode,
            data: stripAttribution(cleanedNode.data)
          }
        }
        return cleanedNode
      }
      return node
    })
  }
}

let persistDebounceTimer: any = null;

export const useWorldStore = create<WorldState>((set, get) => ({
  activeTab: 'canvas',
  openTabs: sampleWorkspaceTabs,
  activeTabId: 'tab-canvas',
  activeWorldId: sampleWorld.id,
  selectedEntityId: sampleEntities[0].id,
  selectedMapId: sampleMap.id,
  selectedChapterId: sampleManuscript[0].id,
  selectedCanvasId: sampleCanvases[0].id,
  selectedLanguageId: sampleConlangs[0]?.id || null,
  searchQuery: '',
  isSaving: false,
  gmMode: false,
  sidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('oros_sidebar_collapsed') === 'true' : false,
  appView: 'home',

  // Codex Reader Mode
  isReaderMode: false,
  readerTarget: null,
  openReaderMode: (target) => {
    set({ isReaderMode: true, readerTarget: target || null });
  },
  closeReaderMode: () => {
    set({ isReaderMode: false, readerTarget: null });
  },

  // Polyhedral Dice Tray HUD
  isDiceTrayOpen: false,
  toggleDiceTray: () => {
    set((state) => ({ isDiceTrayOpen: !state.isDiceTrayOpen }));
  },
  setDiceTrayOpen: (open) => {
    set({ isDiceTrayOpen: open });
  },

  worlds: [sampleWorld],
  entities: { [sampleWorld.id]: sampleEntities },
  maps: { [sampleWorld.id]: [sampleMap] },
  relations: { [sampleWorld.id]: sampleRelations },
  timelines: { [sampleWorld.id]: sampleTimelines },
  manuscripts: { [sampleWorld.id]: sampleManuscript },
  folders: { [sampleWorld.id]: sampleFolders },
  directoryItems: { [sampleWorld.id]: sampleDirectoryItems },
  canvases: { [sampleWorld.id]: sampleCanvases },
  categories: { [sampleWorld.id]: DEFAULT_PRESET_CATEGORIES },
  calendars: { [sampleWorld.id]: sampleWorld.calendarConfig || DEFAULT_FANTASY_CALENDAR_CONFIG },
  relationNodePositions: { [sampleWorld.id]: sampleRelationNodePositions },
  conlangs: { [sampleWorld.id]: sampleConlangs },

  initStore: async () => {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.oros) {
        raw = await window.oros.loadVault();
      }
      if (!raw && typeof window !== 'undefined') {
        raw = localStorage.getItem('oros_vault');
      }

      if (raw) {
        const parsed: StorageData & {
          ttrpgCampaigns?: any;
          ttrpgCharacters?: any;
          ttrpgBattlemaps?: any;
        } = JSON.parse(raw);

        useTtrpgStore.getState().hydrateFromVault(parsed);

        let needsPersist = false;
        if (parsed.worlds && (parsed.worlds.length === 0 || (parsed.worlds.length === 1 && parsed.worlds[0].id === 'world-aethelgard'))) {
          // Automatically upgrade legacy mock world to the newly remade Ostergard world
          parsed.worlds = [sampleWorld];
          parsed.activeWorldId = sampleWorld.id;
          parsed.entities = { [sampleWorld.id]: sampleEntities };
          parsed.maps = { [sampleWorld.id]: [sampleMap] };
          parsed.relations = { [sampleWorld.id]: sampleRelations };
          parsed.timelines = { [sampleWorld.id]: sampleTimelines };
          parsed.manuscripts = { [sampleWorld.id]: sampleManuscript };
          parsed.folders = { [sampleWorld.id]: sampleFolders };
          parsed.directoryItems = { [sampleWorld.id]: sampleDirectoryItems };
          parsed.canvases = { [sampleWorld.id]: sampleCanvases };
          parsed.categories = { [sampleWorld.id]: DEFAULT_PRESET_CATEGORIES };
          parsed.calendars = { [sampleWorld.id]: sampleWorld.calendarConfig || DEFAULT_FANTASY_CALENDAR_CONFIG };
          parsed.conlangs = { [sampleWorld.id]: sampleConlangs };
          needsPersist = true;
        }

        const sampleEntityMap = new Map(sampleEntities.map((e) => [e.id, e]));

        const healedWorlds = (parsed.worlds || [sampleWorld]).map((w: World) => {
          const cleanW = stripAttribution(w);
          let b = optimizeMuseumUrl(cleanW.bannerUrl);
          let t = optimizeMuseumUrl(cleanW.thumbnailUrl);
          if (b && b.toLowerCase().includes('artstation.com')) {
            b = sampleWorld.bannerUrl;
          }
          if (t && t.toLowerCase().includes('artstation.com')) {
            t = sampleWorld.thumbnailUrl;
          }
          if (cleanW.id === sampleWorld.id) {
            if (!b) b = sampleWorld.bannerUrl;
            if (!t) t = sampleWorld.thumbnailUrl;
          }
          return {
            ...cleanW,
            bannerUrl: b,
            thumbnailUrl: t || b
          };
        });

        const rawEntities = parsed.entities || { [sampleWorld.id]: sampleEntities };
        const healedEntities: Record<string, LoreEntity[]> = {};
        for (const [wId, list] of Object.entries(rawEntities)) {
          healedEntities[wId] = (list || []).map((ent: LoreEntity) => {
            const cleanEnt = stripAttribution(ent);
            const sampleMatch = sampleEntityMap.get(cleanEnt.id);
            const avatarHasArtstation = (cleanEnt.avatar && cleanEnt.avatar.toLowerCase().includes('artstation.com')) || 
                                       (cleanEnt.avatarUrl && cleanEnt.avatarUrl.toLowerCase().includes('artstation.com'));
            const bannerHasArtstation = (cleanEnt.banner && cleanEnt.banner.toLowerCase().includes('artstation.com')) ||
                                       (cleanEnt.bannerUrl && cleanEnt.bannerUrl.toLowerCase().includes('artstation.com'));

            let avatar = optimizeMuseumUrl(cleanEnt.avatar);
            let avatarUrl = optimizeMuseumUrl(cleanEnt.avatarUrl || cleanEnt.avatar);
            let banner = optimizeMuseumUrl(cleanEnt.banner);
            let bannerUrl = optimizeMuseumUrl(cleanEnt.bannerUrl || cleanEnt.banner);

            if (sampleMatch) {
              // Only heal if avatar is missing or broken artstation domain; DO NOT wipe user-uploaded custom images!
              if (!avatar || avatarHasArtstation) {
                avatar = sampleMatch.avatar;
                avatarUrl = sampleMatch.avatarUrl || sampleMatch.avatar;
              }
              if (bannerHasArtstation) {
                banner = sampleMatch.banner;
                bannerUrl = sampleMatch.bannerUrl || sampleMatch.banner;
              }
            } else {
              if (avatarHasArtstation) {
                avatar = undefined;
                avatarUrl = undefined;
              }
              if (bannerHasArtstation) {
                banner = undefined;
                bannerUrl = undefined;
              }
            }

            return {
              ...cleanEnt,
              avatar,
              avatarUrl,
              banner,
              bannerUrl
            };
          });
        }

        const rawMaps = parsed.maps || { [sampleWorld.id]: [sampleMap] };
        const healedMaps: Record<string, WorldMap[]> = {};
        for (const [wId, list] of Object.entries(rawMaps)) {
          healedMaps[wId] = (list || []).map((m: WorldMap) => {
            const cleanM = stripAttribution(m);
            const hasArtstation = cleanM.imageUrl && cleanM.imageUrl.toLowerCase().includes('artstation.com');
            const hasBrokenWikimedia = cleanM.imageUrl && cleanM.imageUrl.includes('upload.wikimedia.org') && cleanM.imageUrl.includes('Waghenaer');
            let imageUrl = optimizeMuseumUrl(cleanM.imageUrl) || '';

            if (cleanM.id === sampleMap.id) {
              // Only fallback to sampleMap if the image is missing, has an old broken artstation link, or has the legacy broken wikimedia URL
              if (!imageUrl || hasArtstation || hasBrokenWikimedia) {
                imageUrl = sampleMap.imageUrl;
              }
            } else if (hasArtstation) {
              imageUrl = sampleMap.imageUrl;
            }

            return {
              ...cleanM,
              imageUrl
            };
          });
        }

        const rawCanvases = parsed.canvases || { [sampleWorld.id]: sampleCanvases };
        const healedCanvases: Record<string, WhiteboardCanvasData[]> = {};
        for (const [wId, list] of Object.entries(rawCanvases)) {
          const worldEnts = healedEntities[wId] || [];
          const entityMap = new Map(worldEnts.map((e) => [e.id, e]));
          const titleMap = new Map(worldEnts.map((e) => [e.title.trim().toLowerCase(), e]));

          healedCanvases[wId] = (list || []).map((c: WhiteboardCanvasData) => ({
            ...stripAttribution(c),
            nodes: (c.nodes || []).map((node: any) => {
              const cleanNode = stripAttribution(node);
              if (cleanNode.type === 'canvasCard' && cleanNode.data) {
                const cleanData = stripAttribution(cleanNode.data);
                const entMatch = (cleanData.entityId && entityMap.get(cleanData.entityId)) ||
                                 (cleanData.title && titleMap.get(cleanData.title.trim().toLowerCase())) ||
                                 (cleanData.entityId ? sampleEntityMap.get(cleanData.entityId) : undefined);
                if (entMatch) {
                  return {
                    ...cleanNode,
                    data: {
                      ...cleanData,
                      entityId: entMatch.id,
                      title: entMatch.title || cleanData.title,
                      subtitle: entMatch.summary || cleanData.subtitle,
                      entityType: entMatch.type || cleanData.entityType,
                      avatar: optimizeMuseumUrl((entMatch.avatar !== undefined && entMatch.avatar !== '') ? entMatch.avatar : cleanData.avatar),
                      tags: (entMatch.tags && entMatch.tags.length > 0) ? entMatch.tags : cleanData.tags
                    }
                  };
                }
                if (cleanData.avatar) {
                  return {
                    ...cleanNode,
                    data: {
                      ...cleanData,
                      avatar: optimizeMuseumUrl(cleanData.avatar)
                    }
                  };
                }
                return {
                  ...cleanNode,
                  data: cleanData
                };
              }
              return cleanNode;
            })
          }));
        }

        set({
          worlds: healedWorlds,
          activeWorldId: parsed.activeWorldId || sampleWorld.id,
          entities: healedEntities,
          maps: healedMaps,
          relations: parsed.relations || { [sampleWorld.id]: sampleRelations },
          timelines: parsed.timelines || { [sampleWorld.id]: sampleTimelines },
          manuscripts: parsed.manuscripts || { [sampleWorld.id]: sampleManuscript },
          folders: parsed.folders || { [sampleWorld.id]: sampleFolders },
          directoryItems: parsed.directoryItems || { [sampleWorld.id]: sampleDirectoryItems },
          canvases: healedCanvases,
          categories: parsed.categories || { [sampleWorld.id]: DEFAULT_PRESET_CATEGORIES },
          calendars: parsed.calendars || { [sampleWorld.id]: sampleWorld.calendarConfig || DEFAULT_FANTASY_CALENDAR_CONFIG },
          relationNodePositions: parsed.relationNodePositions || {},
          conlangs: parsed.conlangs || { [sampleWorld.id]: sampleConlangs }
        });
        get().syncVaultDirectory();
        if (needsPersist) {
          get().persistStore();
        }
        return;
      }
      useTtrpgStore.getState().hydrateFromVault(null);
    } catch (err) {
      console.warn('Failed to load from desktop vault, falling back to default:', err);
      useTtrpgStore.getState().hydrateFromVault(null);
    }
    // Run sync for initial sample state
    get().syncVaultDirectory();
  },

  flushSave: async () => {
    if (persistDebounceTimer) {
      clearTimeout(persistDebounceTimer);
      persistDebounceTimer = null;
    }
    const s = get();
    const ttrpg = useTtrpgStore.getState();
    const cleanedEntities: Record<string, LoreEntity[]> = {};
    for (const [k, list] of Object.entries(s.entities)) {
      cleanedEntities[k] = (list || []).map(stripAttribution);
    }
    const cleanedMaps: Record<string, WorldMap[]> = {};
    for (const [k, list] of Object.entries(s.maps)) {
      cleanedMaps[k] = (list || []).map(stripAttribution);
    }
    const cleanedCanvases: Record<string, WhiteboardCanvasData[]> = {};
    for (const [k, list] of Object.entries(s.canvases)) {
      cleanedCanvases[k] = (list || []).map(cleanCanvasAttribution);
    }
    const payload: StorageData & {
      ttrpgCampaigns?: any;
      ttrpgCharacters?: any;
      ttrpgBattlemaps?: any;
    } = {
      version: '1.0.0',
      worlds: s.worlds.map(stripAttribution),
      activeWorldId: s.activeWorldId,
      entities: cleanedEntities,
      maps: cleanedMaps,
      relations: s.relations,
      timelines: s.timelines,
      manuscripts: s.manuscripts,
      folders: s.folders,
      directoryItems: s.directoryItems,
      canvases: cleanedCanvases,
      categories: s.categories,
      calendars: s.calendars,
      relationNodePositions: s.relationNodePositions,
      conlangs: s.conlangs,
      ttrpgCampaigns: ttrpg.campaigns,
      ttrpgCharacters: ttrpg.characters,
      ttrpgBattlemaps: ttrpg.battlemaps
    };
    try {
      const jsonStr = JSON.stringify(payload);
      if (typeof window !== 'undefined' && window.oros) {
        await window.oros.saveVault(jsonStr);
      } else if (typeof window !== 'undefined') {
        localStorage.setItem('oros_vault', jsonStr);
      }
    } catch (err) {
      console.error('Failed to flush vault save:', err);
    } finally {
      if (get().isSaving) {
        set({ isSaving: false });
      }
    }
  },

  persistStore: async () => {
    const interval = getAutoSaveIntervalMs();
    if (interval === 0) {
      // Manual Save Mode: skip automated background flush
      return;
    }

    if (persistDebounceTimer) {
      clearTimeout(persistDebounceTimer);
    }

    return new Promise<void>((resolve) => {
      persistDebounceTimer = setTimeout(async () => {
        await get().flushSave();
        resolve();
      }, Math.max(500, interval));
    });
  },

  setActiveTab: (tab) => {
    const s = get();
    // If setting to wiki and an entity is selected, open or focus that entity's wiki tab
    if (tab === 'wiki' && s.selectedEntityId) {
      const worldId = s.activeWorldId || '';
      const entity = (s.entities[worldId] || []).find((e) => e.id === s.selectedEntityId);
      if (entity) {
        get().openTab({
          title: entity.title,
          type: 'wiki',
          targetId: entity.id
        });
        return;
      }
    }
    
    // Check if an existing open tab matches
    const existing = s.openTabs.find((t) => t.type === tab && !t.targetId);
    if (existing) {
      get().setActiveTabId(existing.id);
      return;
    }

    set({ activeTab: tab });
  },

  setActiveWorldId: (id) => {
    const entities = get().entities[id] || [];
    const maps = get().maps[id] || [];
    const chapters = get().manuscripts[id] || [];
    const canvases = get().canvases[id] || [];
    const conlangs = get().conlangs[id] || [];

    // Filter openTabs so tabs pointing to deleted or foreign world items are removed
    const validTabs = get().openTabs.filter((tab) => {
      if (!tab.targetId) return true;
      if (tab.type === 'wiki' || tab.type === 'card') return entities.some((e) => e.id === tab.targetId);
      if (tab.type === 'map') return maps.some((m) => m.id === tab.targetId);
      if (tab.type === 'writer') return chapters.some((c) => c.id === tab.targetId);
      if (tab.type === 'canvas') return canvases.some((c) => c.id === tab.targetId);
      if (tab.type === 'dictionary') return conlangs.some((l) => l.id === tab.targetId);
      return false;
    });

    const nextActiveTabId = validTabs.some((t) => t.id === get().activeTabId)
      ? get().activeTabId
      : (validTabs[0]?.id || '');
    const nextActiveTab = validTabs.find((t) => t.id === nextActiveTabId)?.type as ActiveNavTab || 'wiki-network';

    const updatedWorlds = get().worlds.map((w) =>
      w.id === id ? { ...w, updatedAt: new Date().toISOString() } : w
    );

    set({ 
      activeWorldId: id,
      worlds: updatedWorlds,
      openTabs: validTabs,
      activeTabId: nextActiveTabId,
      activeTab: nextActiveTab,
      selectedEntityId: entities[0]?.id || null,
      selectedMapId: maps[0]?.id || null,
      selectedChapterId: chapters[0]?.id || null,
      selectedCanvasId: canvases[0]?.id || null,
      selectedLanguageId: conlangs[0]?.id || null
    });
    get().syncVaultDirectory(id);
    get().persistStore();
  },
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setSelectedMapId: (id) => set({ selectedMapId: id }),
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setSelectedCanvasId: (id) => set({ selectedCanvasId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleGmMode: () => set((state) => ({ gmMode: !state.gmMode })),
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('oros_sidebar_collapsed', String(next));
      } catch (e) {}
    }
    set({ sidebarCollapsed: next });
  },
  setSidebarCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('oros_sidebar_collapsed', String(collapsed));
      } catch (e) {}
    }
    set({ sidebarCollapsed: collapsed });
  },
  setAppView: (view: 'home' | 'workspace') => {
    set({ appView: view });
  },

  // Workspace Tabs Actions
  openTab: (tab) => {
    const s = get();
    // Check if an identical tab is already open (matching targetId if present)
    const existing = s.openTabs.find((t) => {
      if (tab.id) return t.id === tab.id;
      if (tab.targetId) return t.targetId === tab.targetId;
      return t.type === tab.type && !t.targetId;
    });

    if (existing) {
      // If existing tab was of type 'card' but now opened as 'wiki', upgrade tab to 'wiki'
      const updatedType: DirectoryItemType = (tab.type === 'wiki' || existing.type === 'wiki') ? 'wiki' : existing.type;
      const updatedTitle = tab.title || existing.title;
      const updatedTabs: WorkspaceTab[] = s.openTabs.map((t) => 
        t.id === existing.id ? { ...t, type: updatedType, title: updatedTitle } : t
      );

      set({ 
        openTabs: updatedTabs,
        activeTabId: existing.id, 
        activeTab: updatedType as ActiveNavTab 
      });

      if (existing.targetId) {
        if (existing.type === 'wiki' || existing.type === 'card' || tab.type === 'wiki' || tab.type === 'card') {
          set({ selectedEntityId: existing.targetId });
        }
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

  duplicateFolder: (folderId) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const currentFolders = get().folders[worldId] || [];
    const sourceFolder = currentFolders.find((f) => f.id === folderId);
    if (!sourceFolder) return null;

    const newFolder = get().createFolder(`${sourceFolder.name} (Copy)`, sourceFolder.parentId);

    // Duplicate items in this folder
    const dirList = get().directoryItems[worldId] || [];
    const itemsInFolder = dirList.filter((d) => d.folderId === folderId);
    itemsInFolder.forEach((item) => {
      const cloned = get().duplicateDirectoryItem(item.id);
      if (cloned) {
        get().moveItemToFolder(cloned.id, newFolder.id);
      }
    });

    // Recursively duplicate subfolders
    const subfolders = currentFolders.filter((f) => f.parentId === folderId);
    subfolders.forEach((sub) => {
      const clonedSub = get().duplicateFolder(sub.id);
      if (clonedSub) {
        get().moveFolderToFolder(clonedSub.id, newFolder.id);
      }
    });

    get().syncVaultDirectory(worldId);
    get().persistStore();
    return newFolder;
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

  moveFolderToFolder: (folderId, parentId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    if (folderId === parentId) return; // Prevent self-nesting
    set((state) => ({
      folders: {
        ...state.folders,
        [worldId]: (state.folders[worldId] || []).map((f) =>
          f.id === folderId ? { ...f, parentId } : f
        )
      }
    }));
    get().persistStore();
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

  renameDirectoryItem: (itemId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const dirList = get().directoryItems[worldId] || [];
    const item = dirList.find((d) => d.id === itemId);
    if (!item) return;

    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).map((d) =>
          d.id === itemId ? { ...d, name: trimmed, updatedAt: new Date().toISOString() } : d
        )
      },
      openTabs: state.openTabs.map((t) =>
        (t.targetId === item.targetId || t.id === itemId) ? { ...t, title: trimmed } : t
      )
    }));

    // Update target element
    if (item.targetId) {
      if (item.type === 'card' || item.type === 'wiki') {
        get().updateEntity(item.targetId, { title: trimmed });
      } else if (item.type === 'writer') {
        const chap = (get().manuscripts[worldId] || []).find((c) => c.id === item.targetId);
        if (chap) get().updateChapter(item.targetId, chap.content, trimmed);
      } else if (item.type === 'map') {
        get().updateMap(item.targetId, { name: trimmed });
      } else if (item.type === 'canvas') {
        get().updateCanvas(item.targetId, { name: trimmed });
      } else if (item.type === 'timeline') {
        set((state) => ({
          timelines: {
            ...state.timelines,
            [worldId]: (state.timelines[worldId] || []).map((t) =>
              t.id === item.targetId ? { ...t, title: trimmed } : t
            )
          }
        }));
      } else if (item.type === 'dictionary') {
        get().updateLanguage(item.targetId, { name: trimmed });
      }
    }
    get().persistStore();
  },

  duplicateDirectoryItem: (itemId) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const dirList = get().directoryItems[worldId] || [];
    const item = dirList.find((d) => d.id === itemId);
    if (!item) return null;

    if ((item.type === 'card' || item.type === 'wiki') && item.targetId) {
      const ent = get().duplicateEntity(item.targetId);
      if (!ent) return null;
      return (get().directoryItems[worldId] || []).find((d) => d.targetId === ent.id) || null;
    }

    if (item.type === 'writer' && item.targetId) {
      const chaps = get().manuscripts[worldId] || [];
      const src = chaps.find((c) => c.id === item.targetId);
      if (src) {
        const newId = `ch-${Date.now()}`;
        const newTitle = `${src.title} (Copy)`;
        const newChap = { ...src, id: newId, title: newTitle, order: chaps.length };
        const newDirItem: DirectoryItem = {
          id: `doc-chap-${newId}`,
          worldId,
          name: newTitle,
          type: 'writer',
          folderId: item.folderId,
          targetId: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set((state) => ({
          manuscripts: {
            ...state.manuscripts,
            [worldId]: [...(state.manuscripts[worldId] || []), newChap]
          },
          directoryItems: {
            ...state.directoryItems,
            [worldId]: [...(state.directoryItems[worldId] || []), newDirItem]
          }
        }));
        get().syncVaultDirectory(worldId);
        get().persistStore();
        return newDirItem;
      }
    }

    if (item.type === 'canvas' && item.targetId) {
      const canvases = get().canvases[worldId] || [];
      const src = canvases.find((c) => c.id === item.targetId);
      if (src) {
        const newCanvas = get().createCanvas(`${src.name} (Copy)`, item.folderId);
        get().saveCanvasNodesAndEdges(newCanvas.id, src.nodes || [], src.edges || []);
        return (get().directoryItems[worldId] || []).find((d) => d.targetId === newCanvas.id) || null;
      }
    }

    if (item.type === 'map' && item.targetId) {
      const maps = get().maps[worldId] || [];
      const src = maps.find((m) => m.id === item.targetId);
      if (src) {
        const newMap = get().createMap(`${src.name} (Copy)`, src.imageUrl, item.folderId);
        if (src.pins?.length) {
          src.pins.forEach((p) => {
            get().addPinToMap(newMap.id, {
              title: p.title,
              description: p.description,
              x: p.x,
              y: p.y,
              color: p.color,
              icon: p.icon,
              entityId: p.entityId,
              subMapId: p.subMapId
            });
          });
        }
        return (get().directoryItems[worldId] || []).find((d) => d.targetId === newMap.id) || null;
      }
    }

    return null;
  },

  deleteDirectoryItem: (itemId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    const item = (get().directoryItems[worldId] || []).find((i) => i.id === itemId);
    if (!item) return;

    // If item links to a primary vault element, cascade delete
    if (item.targetId) {
      if (item.type === 'card' || item.type === 'wiki') {
        get().deleteEntity(item.targetId);
        return;
      }
      if (item.type === 'canvas') {
        get().deleteCanvas(item.targetId);
        return;
      }
      if (item.type === 'map') {
        get().deleteMap(item.targetId);
        return;
      }
      if (item.type === 'writer') {
        get().deleteChapter(item.targetId);
        return;
      }
      if (item.type === 'dictionary') {
        get().deleteLanguage(item.targetId);
        return;
      }
    }

    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).filter((i) => i.id !== itemId)
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

  batchMoveItemsToFolder: (itemIds, folderId) => {
    const worldId = get().activeWorldId;
    if (!worldId || !itemIds || itemIds.length === 0) return;
    const targetSet = new Set(itemIds);
    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).map((item) =>
          targetSet.has(item.id) ? { ...item, folderId, updatedAt: new Date().toISOString() } : item
        )
      }
    }));
    get().persistStore();
  },

  batchDeleteDirectoryItems: (itemIds) => {
    const worldId = get().activeWorldId;
    if (!worldId || !itemIds || itemIds.length === 0) return;
    const targetSet = new Set(itemIds);
    const items = (get().directoryItems[worldId] || []).filter((i) => targetSet.has(i.id));

    // Cascade delete target elements
    for (const item of items) {
      if (item.targetId) {
        if (item.type === 'card' || item.type === 'wiki') {
          get().deleteEntity(item.targetId);
        } else if (item.type === 'canvas') {
          get().deleteCanvas(item.targetId);
        } else if (item.type === 'map') {
          get().deleteMap(item.targetId);
        } else if (item.type === 'writer') {
          get().deleteChapter(item.targetId);
        } else if (item.type === 'dictionary') {
          get().deleteLanguage(item.targetId);
        }
      }
    }

    set((state) => ({
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).filter((i) => !targetSet.has(i.id))
      }
    }));
    get().persistStore();
  },

  // Vault Auto-Detection & Reconciliation
  syncVaultDirectory: (targetWorldId) => {
    const worldId = targetWorldId || get().activeWorldId || sampleWorld.id;
    const s = get();
    const existingItems = s.directoryItems[worldId] || [];
    const entitiesList = s.entities[worldId] || [];
    const mapsList = s.maps[worldId] || [];
    const canvasesList = s.canvases[worldId] || [];
    const chaptersList = s.manuscripts[worldId] || [];
    const conlangsList = s.conlangs[worldId] || [];

    const updatedItems = [...existingItems];
    let changed = false;

    // 1. Auto-detect all Entities (Cards) in project vault
    for (const ent of entitiesList) {
      const idx = updatedItems.findIndex((i) => i.targetId === ent.id && (i.type === 'card' || i.type === 'wiki'));
      if (idx === -1) {
        updatedItems.push({
          id: `doc-card-${ent.id}`,
          worldId,
          name: ent.title,
          type: 'card',
          targetId: ent.id,
          folderId: null,
          createdAt: ent.createdAt || new Date().toISOString(),
          updatedAt: ent.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else if (updatedItems[idx].name !== ent.title) {
        updatedItems[idx] = { ...updatedItems[idx], name: ent.title, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    // 2. Auto-detect all Canvases in project vault
    for (const canvas of canvasesList) {
      const idx = updatedItems.findIndex((i) => i.targetId === canvas.id && i.type === 'canvas');
      if (idx === -1) {
        updatedItems.push({
          id: `doc-canvas-${canvas.id}`,
          worldId,
          name: canvas.name,
          type: 'canvas',
          targetId: canvas.id,
          folderId: null,
          createdAt: canvas.createdAt || new Date().toISOString(),
          updatedAt: canvas.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else if (updatedItems[idx].name !== canvas.name) {
        updatedItems[idx] = { ...updatedItems[idx], name: canvas.name, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    // 3. Auto-detect all Maps in project vault
    for (const m of mapsList) {
      const idx = updatedItems.findIndex((i) => i.targetId === m.id && i.type === 'map');
      if (idx === -1) {
        updatedItems.push({
          id: `doc-map-${m.id}`,
          worldId,
          name: m.name,
          type: 'map',
          targetId: m.id,
          folderId: null,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else if (updatedItems[idx].name !== m.name) {
        updatedItems[idx] = { ...updatedItems[idx], name: m.name, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    // 4. Auto-detect all Manuscript Chapters in project vault
    for (const ch of chaptersList) {
      const idx = updatedItems.findIndex((i) => i.targetId === ch.id && i.type === 'writer');
      if (idx === -1) {
        updatedItems.push({
          id: `doc-ch-${ch.id}`,
          worldId,
          name: ch.title,
          type: 'writer',
          targetId: ch.id,
          folderId: null,
          createdAt: ch.updatedAt || new Date().toISOString(),
          updatedAt: ch.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else if (updatedItems[idx].name !== ch.title) {
        updatedItems[idx] = { ...updatedItems[idx], name: ch.title, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    // 5. Auto-detect all Conlang Dictionaries in project vault
    for (const lang of conlangsList) {
      const idx = updatedItems.findIndex((i) => i.targetId === lang.id && i.type === 'dictionary');
      if (idx === -1) {
        updatedItems.push({
          id: `doc-dict-${lang.id}`,
          worldId,
          name: lang.name,
          type: 'dictionary',
          targetId: lang.id,
          folderId: null,
          createdAt: lang.createdAt || new Date().toISOString(),
          updatedAt: lang.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else if (updatedItems[idx].name !== lang.name) {
        updatedItems[idx] = { ...updatedItems[idx], name: lang.name, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    // 6. Ensure core feature shortcuts exist if not present
    if (!updatedItems.some((i) => i.type === 'timeline')) {
      updatedItems.push({
        id: `doc-timeline-${worldId}`,
        worldId,
        name: 'Timeline',
        type: 'timeline',
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      changed = true;
    }

    if (!updatedItems.some((i) => i.type === 'relations')) {
      updatedItems.push({
        id: `doc-relations-${worldId}`,
        worldId,
        name: 'Relations',
        type: 'relations',
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      changed = true;
    }

    // 8. Clean up orphaned directory items whose targetId was removed from vault
    const validItems = updatedItems.filter((i) => {
      if (i.targetId) {
        if (i.type === 'card' || i.type === 'wiki') return entitiesList.some((e) => e.id === i.targetId);
        if (i.type === 'canvas') return canvasesList.some((c) => c.id === i.targetId);
        if (i.type === 'map') return mapsList.some((m) => m.id === i.targetId);
        if (i.type === 'writer') return chaptersList.some((ch) => ch.id === i.targetId);
        if (i.type === 'dictionary') return conlangsList.some((l) => l.id === i.targetId);
        if ((i as any).type === 'table') return false;
      }
      return true;
    });

    if (validItems.length !== updatedItems.length) {
      changed = true;
    }

    if (changed) {
      set((state) => ({
        directoryItems: {
          ...state.directoryItems,
          [worldId]: validItems
        }
      }));
      get().persistStore();
    }
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
      },
      directoryItems: {
        ...state.directoryItems,
        [worldId]: (state.directoryItems[worldId] || []).map((item) =>
          item.targetId === canvasId && updates.name
            ? { ...item, name: updates.name, updatedAt: new Date().toISOString() }
            : item
        )
      },
      openTabs: state.openTabs.map((tab) =>
        tab.targetId === canvasId && updates.name ? { ...tab, title: updates.name } : tab
      )
    }));
    get().persistStore();
  },

  deleteCanvas: (canvasId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const openTabs = state.openTabs.filter((tab) => tab.targetId !== canvasId);
      const nextActiveTabId = openTabs.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : (openTabs[0]?.id || '');
      return {
        canvases: {
          ...state.canvases,
          [worldId]: (state.canvases[worldId] || []).filter((c) => c.id !== canvasId)
        },
        directoryItems: {
          ...state.directoryItems,
          [worldId]: (state.directoryItems[worldId] || []).filter((item) => item.targetId !== canvasId)
        },
        openTabs,
        activeTabId: nextActiveTabId,
        selectedCanvasId: state.selectedCanvasId === canvasId ? null : state.selectedCanvasId
      };
    });
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

  createWorld: (name, tagline, genre, theme = 'sovereign', customAccentColor, thumbnailUrl, bannerUrl) => {
    const newWorldId = `world-${Date.now()}`;
    const initialCalendar = { ...DEFAULT_FANTASY_CALENDAR_CONFIG, worldId: newWorldId };
    const newWorld: World = {
      id: newWorldId,
      name,
      tagline,
      description: '',
      genre,
      theme,
      customAccentColor,
      thumbnailUrl: thumbnailUrl || bannerUrl,
      bannerUrl: bannerUrl || thumbnailUrl,
      calendarConfig: initialCalendar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({
      worlds: [...state.worlds, newWorld],
      activeWorldId: newWorld.id,
      appView: 'workspace',
      openTabs: [],
      activeTabId: '',
      activeTab: 'wiki-network',
      selectedEntityId: null,
      selectedMapId: null,
      selectedChapterId: null,
      selectedCanvasId: null,
      selectedLanguageId: null,
      entities: { ...state.entities, [newWorld.id]: [] },
      maps: { ...state.maps, [newWorld.id]: [] },
      relations: { ...state.relations, [newWorld.id]: [] },
      timelines: { ...state.timelines, [newWorld.id]: [] },
      manuscripts: { ...state.manuscripts, [newWorld.id]: [] },
      calendars: { ...state.calendars, [newWorld.id]: initialCalendar },
      categories: { ...state.categories, [newWorld.id]: DEFAULT_PRESET_CATEGORIES }
    }));
    get().syncVaultDirectory(newWorld.id);
    get().persistStore();
  },

  updateWorld: (worldId, updates) => {
    set((state) => ({
      worlds: state.worlds.map((w) =>
        w.id === worldId ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      )
    }));
    get().persistStore();
  },

  deleteWorld: (worldId) => {
    const s = get();
    const remainingWorlds = s.worlds.filter((w) => w.id !== worldId);
    const nextActiveId = remainingWorlds.length > 0 ? remainingWorlds[0].id : null;

    set((state) => {
      const nextEntities = { ...state.entities };
      delete nextEntities[worldId];
      const nextMaps = { ...state.maps };
      delete nextMaps[worldId];
      const nextRelations = { ...state.relations };
      delete nextRelations[worldId];
      const nextTimelines = { ...state.timelines };
      delete nextTimelines[worldId];
      const nextManuscripts = { ...state.manuscripts };
      delete nextManuscripts[worldId];
      const nextFolders = { ...state.folders };
      delete nextFolders[worldId];
      const nextDirectoryItems = { ...state.directoryItems };
      delete nextDirectoryItems[worldId];
      const nextCanvases = { ...state.canvases };
      delete nextCanvases[worldId];
      const nextCategories = { ...state.categories };
      delete nextCategories[worldId];
      const nextCalendars = { ...state.calendars };
      delete nextCalendars[worldId];

      return {
        worlds: remainingWorlds,
        activeWorldId: state.activeWorldId === worldId ? nextActiveId : state.activeWorldId,
        entities: nextEntities,
        maps: nextMaps,
        relations: nextRelations,
        timelines: nextTimelines,
        manuscripts: nextManuscripts,
        folders: nextFolders,
        directoryItems: nextDirectoryItems,
        canvases: nextCanvases,
        categories: nextCategories,
        calendars: nextCalendars
      };
    });
    get().persistStore();
  },

  setWorldTheme: (worldId, theme, customAccentColor) => {
    set((state) => ({
      worlds: state.worlds.map((w) =>
        w.id === worldId
          ? {
              ...w,
              theme,
              ...(customAccentColor !== undefined ? { customAccentColor } : {})
            }
          : w
      )
    }));
    get().persistStore();
  },

  createEntity: (type, title, folderId = null, templateId) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const worldName = get().worlds.find(w => w.id === worldId)?.name;
    const finalType = type || templateId || 'character';
    const template = templateId ? getTemplateById(templateId) : getTemplateForType(finalType);
    const catMeta = getCategoryMeta(finalType, get().categories[worldId] || []);

    const generatedSections: InfoboxSection[] = template?.sections ? template.sections.map((sec, sIdx) => ({
      ...sec,
      fields: sec.fields.map((f, fIdx) => ({
        ...f,
        id: `f-${Date.now()}-${sIdx}-${fIdx}`
      }))
    })) : [
      {
        title: 'Overview',
        fields: [
          { id: `f-${Date.now()}-1`, label: 'Status', value: 'Active', type: 'text' as const },
          { id: `f-${Date.now()}-2`, label: 'Origin', value: 'Unknown', type: 'text' as const }
        ]
      }
    ];

    const newEntity: LoreEntity = {
      id: `entity-${Date.now()}`,
      worldId,
      title,
      type: finalType,
      summary: '',
      content: template?.content || `<p>Start writing about <strong>${title}</strong> here...</p>`,
      tags: [],
      aliases: [],
      infobox: {
        subtitle: `${catMeta.name.toUpperCase()}${worldName ? ` · ${worldName}` : ''}`,
        sections: generatedSections
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newDirItem: DirectoryItem = {
      id: `doc-card-${newEntity.id}`,
      worldId,
      name: newEntity.title,
      type: 'card',
      folderId,
      targetId: newEntity.id,
      createdAt: newEntity.createdAt,
      updatedAt: newEntity.updatedAt
    };

    set((state) => {
      const list = state.entities[worldId] || [];
      const dirList = state.directoryItems[worldId] || [];
      return {
        entities: {
          ...state.entities,
          [worldId]: [newEntity, ...list]
        },
        directoryItems: {
          ...state.directoryItems,
          [worldId]: [...dirList, newDirItem]
        },
        selectedEntityId: newEntity.id
      };
    });

    get().openTab({
      title: newEntity.title,
      type: 'card',
      targetId: newEntity.id
    });

    get().persistStore();
    return newEntity;
  },

  duplicateEntity: (entityId) => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const currentList = get().entities[worldId] || [];
    const source = currentList.find((e) => e.id === entityId);
    if (!source) return null;

    const newId = `entity-${Date.now()}`;
    const newTitle = `${source.title} (Copy)`;
    const newEntity: LoreEntity = {
      ...source,
      id: newId,
      title: newTitle,
      infobox: source.infobox ? {
        ...source.infobox,
        sections: source.infobox.sections ? source.infobox.sections.map((sec, sIdx) => ({
          ...sec,
          fields: sec.fields.map((f, fIdx) => ({
            ...f,
            id: `f-${Date.now()}-${sIdx}-${fIdx}`
          }))
        })) : []
      } : { sections: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const dirList = get().directoryItems[worldId] || [];
    const sourceDirItem = dirList.find((d) => d.targetId === entityId);
    const folderId = sourceDirItem?.folderId || null;

    const newDirItem: DirectoryItem = {
      id: `doc-card-${newEntity.id}`,
      worldId,
      name: newEntity.title,
      type: 'card',
      folderId,
      targetId: newEntity.id,
      createdAt: newEntity.createdAt,
      updatedAt: newEntity.updatedAt
    };

    set((state) => ({
      entities: {
        ...state.entities,
        [worldId]: [newEntity, ...(state.entities[worldId] || [])]
      },
      directoryItems: {
        ...state.directoryItems,
        [worldId]: [...(state.directoryItems[worldId] || []), newDirItem]
      },
      selectedEntityId: newEntity.id
    }));

    get().openTab({
      title: newEntity.title,
      type: 'card',
      targetId: newEntity.id
    });

    get().syncVaultDirectory(worldId);
    get().persistStore();
    return newEntity;
  },

  updateEntity: (entityId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const existingEntity = (state.entities[worldId] || []).find((e) => e.id === entityId);
      const oldTitle = existingEntity?.title?.trim().toLowerCase();

      const list = (state.entities[worldId] || []).map((ent) => 
        ent.id === entityId 
          ? { ...ent, ...updates, updatedAt: new Date().toISOString() } 
          : ent
      );

      // Also update cross-entity references (e.g. infobox entity-links) if title changed
      const listWithUpdatedLinks = updates.title !== undefined
        ? list.map((ent) => {
            if (!ent.infobox?.sections) return ent;
            let fieldChanged = false;
            const updatedSections = ent.infobox.sections.map((sec) => {
              const updatedFields = (sec.fields || []).map((field: any) => {
                if (field.targetEntityId === entityId) {
                  fieldChanged = true;
                  return { ...field, value: updates.title! };
                }
                return field;
              });
              return { ...sec, fields: updatedFields };
            });
            return fieldChanged ? { ...ent, infobox: { ...ent.infobox, sections: updatedSections } } : ent;
          })
        : list;

      const dirList = (state.directoryItems[worldId] || []).map((item) =>
        (item.targetId === entityId || item.id === entityId) && updates.title !== undefined
          ? { ...item, name: updates.title, updatedAt: new Date().toISOString() }
          : item
      );

      const openTabs = state.openTabs.map((tab) =>
        (tab.targetId === entityId || tab.id === entityId) && updates.title !== undefined
          ? { ...tab, title: updates.title }
          : tab
      );

      const mapList = (state.maps[worldId] || []).map((map) => ({
        ...map,
        pins: map.pins.map((pin) =>
          pin.entityId === entityId && updates.title !== undefined
            ? { ...pin, title: updates.title }
            : pin
        ),
        regions: (map.regions || []).map((region) =>
          region.entityId === entityId && updates.title !== undefined
            ? { ...region, name: updates.title }
            : region
        )
      }));

      // Synchronize all Whiteboard Canvas cards referencing this entity
      const canvasList = (state.canvases[worldId] || []).map((c) => ({
        ...c,
        nodes: (c.nodes || []).map((node) => {
          if (node.type === 'canvasCard' && node.data) {
            const isMatch = node.data.entityId === entityId || 
                            (!node.data.entityId && oldTitle && node.data.title?.trim().toLowerCase() === oldTitle);
            if (isMatch) {
              return {
                ...node,
                data: {
                  ...node.data,
                  entityId,
                  title: updates.title !== undefined ? updates.title : node.data.title,
                  avatar: updates.avatar !== undefined ? updates.avatar : node.data.avatar,
                  subtitle: updates.summary !== undefined ? updates.summary : node.data.subtitle,
                  summary: updates.summary !== undefined ? updates.summary : node.data.summary,
                  entityType: updates.type !== undefined ? updates.type : node.data.entityType,
                  tags: updates.tags !== undefined ? updates.tags : node.data.tags
                }
              };
            }
          }
          return node;
        })
      }));

      return {
        entities: { ...state.entities, [worldId]: listWithUpdatedLinks },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        maps: { ...state.maps, [worldId]: mapList },
        canvases: { ...state.canvases, [worldId]: canvasList },
        openTabs
      };
    });
    get().persistStore();
  },

  deleteEntity: (entityId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.entities[worldId] || []).filter((e) => e.id !== entityId);
      const dirList = (state.directoryItems[worldId] || []).filter((item) => item.targetId !== entityId);
      const openTabs = state.openTabs.filter((tab) => tab.targetId !== entityId);
      const nextActiveTabId = openTabs.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : (openTabs[0]?.id || '');

      const relList = (state.relations[worldId] || []).filter(
        (r) => r.sourceEntityId !== entityId && r.targetEntityId !== entityId
      );
      const nextPositions = { ...(state.relationNodePositions[worldId] || {}) };
      delete nextPositions[entityId];

      const canvasList = (state.canvases[worldId] || []).map((c) => ({
        ...c,
        nodes: (c.nodes || []).map((node) => {
          if (node.type === 'canvasCard' && node.data?.entityId === entityId) {
            return {
              ...node,
              data: {
                ...node.data,
                entityId: undefined
              }
            };
          }
          return node;
        })
      }));

      const mapList = (state.maps[worldId] || []).map((m) => ({
        ...m,
        pins: m.pins.map((p) => p.entityId === entityId ? { ...p, entityId: undefined } : p),
        regions: (m.regions || []).map((r) => r.entityId === entityId ? { ...r, entityId: undefined } : r)
      }));

      return {
        entities: { ...state.entities, [worldId]: list },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        relations: { ...state.relations, [worldId]: relList },
        relationNodePositions: { ...state.relationNodePositions, [worldId]: nextPositions },
        canvases: { ...state.canvases, [worldId]: canvasList },
        maps: { ...state.maps, [worldId]: mapList },
        openTabs,
        activeTabId: nextActiveTabId,
        selectedEntityId: state.selectedEntityId === entityId ? (list[0]?.id || null) : state.selectedEntityId
      };
    });
    get().persistStore();
  },

  createMap: (name, imageUrl, folderId = null) => {
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
    const newDirItem: DirectoryItem = {
      id: `doc-map-${newMap.id}`,
      worldId,
      name: newMap.name,
      type: 'map',
      folderId,
      targetId: newMap.id,
      createdAt: newMap.createdAt,
      updatedAt: newMap.updatedAt
    };
    set((state) => {
      const list = state.maps[worldId] || [];
      const dirList = state.directoryItems[worldId] || [];
      return {
        maps: { ...state.maps, [worldId]: [...list, newMap] },
        directoryItems: { ...state.directoryItems, [worldId]: [...dirList, newDirItem] },
        selectedMapId: newMap.id
      };
    });
    get().openTab({
      title: newMap.name,
      type: 'map',
      targetId: newMap.id
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
      const dirList = (state.directoryItems[worldId] || []).map((item) =>
        item.targetId === mapId && updates.name
          ? { ...item, name: updates.name, updatedAt: new Date().toISOString() }
          : item
      );
      const openTabs = state.openTabs.map((tab) =>
        tab.targetId === mapId && updates.name
          ? { ...tab, title: updates.name }
          : tab
      );
      return {
        maps: { ...state.maps, [worldId]: list },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        openTabs
      };
    });
    get().persistStore();
  },

  deleteMap: (mapId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.maps[worldId] || []).filter((m) => m.id !== mapId);
      const dirList = (state.directoryItems[worldId] || []).filter((item) => item.targetId !== mapId);
      const openTabs = state.openTabs.filter((tab) => tab.targetId !== mapId);
      const nextActiveTabId = openTabs.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : (openTabs[0]?.id || '');
      return {
        maps: { ...state.maps, [worldId]: list },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        openTabs,
        activeTabId: nextActiveTabId,
        selectedMapId: state.selectedMapId === mapId ? (list[0]?.id || null) : state.selectedMapId
      };
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

  updateTimelineEvent: (eventId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.timelines[worldId] || []).map((t) =>
        t.id === eventId ? { ...t, ...updates } : t
      ).sort((a, b) => a.year - b.year);
      return { timelines: { ...state.timelines, [worldId]: list } };
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

  getCalendarConfig: (worldId) => {
    const s = get();
    const id = worldId || s.activeWorldId || sampleWorld.id;
    const world = s.worlds.find((w) => w.id === id);
    const base = world?.calendarConfig || s.calendars?.[id] || DEFAULT_FANTASY_CALENDAR_CONFIG;
    return {
      ...DEFAULT_FANTASY_CALENDAR_CONFIG,
      ...base,
      eras: base.eras && base.eras.length > 0 ? base.eras : (DEFAULT_FANTASY_CALENDAR_CONFIG.eras || []),
      customCategories: base.customCategories && base.customCategories.length > 0 ? base.customCategories : DEFAULT_TIMELINE_CATEGORIES,
      customPeriodTypes: base.customPeriodTypes && base.customPeriodTypes.length > 0 ? base.customPeriodTypes : DEFAULT_PERIOD_CLASSIFICATIONS,
      worldId: id
    };
  },

  updateCalendarConfig: (worldId, updates) => {
    const current = get().getCalendarConfig(worldId);
    const updated = { ...current, ...updates, worldId };
    set((state) => ({
      calendars: {
        ...state.calendars,
        [worldId]: updated
      },
      worlds: state.worlds.map((w) => (w.id === worldId ? { ...w, calendarConfig: updated } : w))
    }));
    get().persistStore();
  },

  createChapter: (title, folderId = null) => {
    const worldId = get().activeWorldId || sampleWorld.id;
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
    const newDirItem: DirectoryItem = {
      id: `doc-ch-${newChapter.id}`,
      worldId,
      name: newChapter.title,
      type: 'writer',
      folderId,
      targetId: newChapter.id,
      createdAt: newChapter.updatedAt,
      updatedAt: newChapter.updatedAt
    };
    set((state) => ({
      manuscripts: { ...state.manuscripts, [worldId]: [...chapters, newChapter] },
      directoryItems: {
        ...state.directoryItems,
        [worldId]: [...(state.directoryItems[worldId] || []), newDirItem]
      },
      selectedChapterId: newChapter.id
    }));
    get().openTab({
      title: newChapter.title,
      type: 'writer',
      targetId: newChapter.id
    });
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
      const dirList = (state.directoryItems[worldId] || []).map((item) =>
        item.targetId === chapterId && title
          ? { ...item, name: title, updatedAt: new Date().toISOString() }
          : item
      );
      const openTabs = state.openTabs.map((tab) =>
        tab.targetId === chapterId && title ? { ...tab, title } : tab
      );
      return {
        manuscripts: { ...state.manuscripts, [worldId]: list },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        openTabs
      };
    });
    get().persistStore();
  },

  deleteChapter: (chapterId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;
    set((state) => {
      const list = (state.manuscripts[worldId] || []).filter((c) => c.id !== chapterId);
      const dirList = (state.directoryItems[worldId] || []).filter((item) => item.targetId !== chapterId);
      const openTabs = state.openTabs.filter((tab) => tab.targetId !== chapterId);
      const nextActiveTabId = openTabs.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : (openTabs[0]?.id || '');
      return { 
        manuscripts: { ...state.manuscripts, [worldId]: list },
        directoryItems: { ...state.directoryItems, [worldId]: dirList },
        openTabs,
        activeTabId: nextActiveTabId,
        selectedChapterId: state.selectedChapterId === chapterId ? (list[0]?.id || null) : state.selectedChapterId
      };
    });
    get().persistStore();
  },

  moveChapter: (chapterId, direction) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    const chapters = [...(get().manuscripts[worldId] || [])].sort((a, b) => a.order - b.order);
    const index = chapters.findIndex((c) => c.id === chapterId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = chapters[index - 1];
      chapters[index - 1] = chapters[index];
      chapters[index] = temp;
    } else if (direction === 'down' && index < chapters.length - 1) {
      const temp = chapters[index + 1];
      chapters[index + 1] = chapters[index];
      chapters[index] = temp;
    } else {
      return;
    }

    // Re-index order
    const updated = chapters.map((ch, idx) => ({ ...ch, order: idx + 1 }));

    set((state) => ({
      manuscripts: {
        ...state.manuscripts,
        [worldId]: updated
      }
    }));

    get().persistStore();
  },

  compileManuscript: async () => {
    const s = get();
    const activeWorld = s.worlds.find((w) => w.id === s.activeWorldId);
    if (!activeWorld || !s.activeWorldId) return false;

    const chapters = [...(s.manuscripts[s.activeWorldId] || [])].sort((a, b) => a.order - b.order);
    if (chapters.length === 0) return false;

    const lines: string[] = [];
    lines.push(`# ${activeWorld.name}`);
    if (activeWorld.tagline) lines.push(`*${activeWorld.tagline}*\n`);
    lines.push(`**Compiled from Project OROS Worldbuilding Suite**`);
    lines.push(`Total Chapters: ${chapters.length}`);
    const totalWords = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
    lines.push(`Total Word Count: ${totalWords.toLocaleString()} words\n`);
    lines.push(`---\n`);

    chapters.forEach((ch, idx) => {
      lines.push(`## Chapter ${idx + 1}: ${ch.title}\n`);
      const text = ch.content
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
        .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      lines.push(text);
      lines.push(`\n\n* * *\n`);
    });

    const fullManuscript = lines.join('\n');
    const safeTitle = `${activeWorld.name.replace(/[^a-z0-9_-]/gi, '_')}_Manuscript`;

    try {
      if (typeof window !== 'undefined' && window.oros) {
        const success = await window.oros.exportFile(safeTitle, fullManuscript, 'md', 'Markdown Document');
        return Boolean(success);
      } else if (typeof window !== 'undefined') {
        const blob = new Blob([fullManuscript], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.md`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to compile manuscript:', err);
      return false;
    }
  },

  // Category / Label Actions
  getCategories: (targetWorldId) => {
    const worldId = targetWorldId || get().activeWorldId || sampleWorld.id;
    return get().categories[worldId] || DEFAULT_PRESET_CATEGORIES;
  },

  createCategory: (name, icon = 'Layers', color = '#eab308', description = '') => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newCategory: EntityCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      icon,
      color,
      isPreset: false,
      description: description.trim()
    };

    set((state) => {
      const currentList = state.categories[worldId] || DEFAULT_PRESET_CATEGORIES;
      return {
        categories: {
          ...state.categories,
          [worldId]: [...currentList, newCategory]
        }
      };
    });

    get().persistStore();
    return newCategory;
  },

  updateCategory: (categoryId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => {
      const currentList = state.categories[worldId] || DEFAULT_PRESET_CATEGORIES;
      const updatedList = currentList.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      );

      return {
        categories: {
          ...state.categories,
          [worldId]: updatedList
        }
      };
    });

    get().persistStore();
  },

  deleteCategory: (categoryId, fallbackCategoryId = 'character') => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => {
      const currentList = state.categories[worldId] || DEFAULT_PRESET_CATEGORIES;
      const filteredList = currentList.filter((c) => c.id !== categoryId);

      // Reassign any entities that were using this category
      const currentEntities = state.entities[worldId] || [];
      const updatedEntities = currentEntities.map((ent) =>
        ent.type === categoryId 
          ? { ...ent, type: fallbackCategoryId, updatedAt: new Date().toISOString() } 
          : ent
      );

      return {
        categories: {
          ...state.categories,
          [worldId]: filteredList
        },
        entities: {
          ...state.entities,
          [worldId]: updatedEntities
        }
      };
    });

    get().persistStore();
  },

  saveRelationNodePosition: (entityId, position) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => ({
      relationNodePositions: {
        ...state.relationNodePositions,
        [worldId]: {
          ...(state.relationNodePositions[worldId] || {}),
          [entityId]: position
        }
      }
    }));

    get().persistStore();
  },

  exportWorld: async () => {
    const s = get();
    const activeWorld = s.worlds.find((w) => w.id === s.activeWorldId);
    if (!activeWorld || !s.activeWorldId) return false;

    const exportData = {
      version: '1.0.0',
      world: stripAttribution(activeWorld),
      entities: (s.entities[s.activeWorldId] || []).map(stripAttribution),
      maps: (s.maps[s.activeWorldId] || []).map(stripAttribution),
      relations: s.relations[s.activeWorldId] || [],
      timelines: s.timelines[s.activeWorldId] || [],
      manuscripts: s.manuscripts[s.activeWorldId] || [],
      folders: s.folders[s.activeWorldId] || [],
      directoryItems: s.directoryItems[s.activeWorldId] || [],
      canvases: (s.canvases[s.activeWorldId] || []).map(cleanCanvasAttribution),
      categories: s.categories[s.activeWorldId] || [],
      calendar: s.getCalendarConfig(s.activeWorldId),
      relationNodePositions: s.relationNodePositions[s.activeWorldId] || {},
      conlangs: s.conlangs[s.activeWorldId] || []
    };

    const json = JSON.stringify(exportData, null, 2);
    try {
      if (typeof window !== 'undefined' && window.oros) {
        const success = await window.oros.exportWorld(activeWorld.name.replace(/[^a-z0-9_-]/gi, '_'), json);
        return Boolean(success);
      } else if (typeof window !== 'undefined') {
        // Browser fallback download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeWorld.name}.oros.json`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to export world:', err);
      return false;
    }
  },

  importWorld: async (rawJson?: string) => {
    try {
      let content = rawJson;
      if (!content && typeof window !== 'undefined' && window.oros) {
        const loaded = await window.oros.importWorld();
        if (!loaded) return false;
        content = loaded;
      }

      if (!content) return false;

      const parsed = JSON.parse(content);
      const isSingleWorldBundle = Boolean(parsed.world);
      const isFullVault = Boolean(parsed.worlds && Array.isArray(parsed.worlds));

      if (!isSingleWorldBundle && !isFullVault) {
        console.error('Unrecognized Oros world file format');
        return false;
      }

      if (isSingleWorldBundle) {
        const w: World = stripAttribution(parsed.world);
        const targetWorldId = w.id || `world-${Date.now()}`;
        w.id = targetWorldId;

        set((state) => {
          const filteredWorlds = state.worlds.filter((existing) => existing.id !== targetWorldId);
          return {
            worlds: [...filteredWorlds, w],
            activeWorldId: targetWorldId,
            entities: {
              ...state.entities,
              [targetWorldId]: (parsed.entities || []).map(stripAttribution)
            },
            maps: {
              ...state.maps,
              [targetWorldId]: (parsed.maps || []).map(stripAttribution)
            },
            relations: {
              ...state.relations,
              [targetWorldId]: parsed.relations || []
            },
            timelines: {
              ...state.timelines,
              [targetWorldId]: (parsed.timelines || []).sort((a: any, b: any) => (a.year || 0) - (b.year || 0))
            },
            manuscripts: {
              ...state.manuscripts,
              [targetWorldId]: parsed.manuscripts || []
            },
            folders: {
              ...state.folders,
              [targetWorldId]: parsed.folders || []
            },
            directoryItems: {
              ...state.directoryItems,
              [targetWorldId]: parsed.directoryItems || []
            },
            canvases: {
              ...state.canvases,
              [targetWorldId]: (parsed.canvases || []).map(cleanCanvasAttribution)
            },
            categories: {
              ...state.categories,
              [targetWorldId]: parsed.categories || DEFAULT_PRESET_CATEGORIES
            },
            calendars: {
              ...state.calendars,
              [targetWorldId]: parsed.calendar || w.calendarConfig || { ...DEFAULT_FANTASY_CALENDAR_CONFIG, worldId: targetWorldId }
            },
            relationNodePositions: {
              ...state.relationNodePositions,
              [targetWorldId]: parsed.relationNodePositions || {}
            },
            conlangs: {
              ...state.conlangs,
              [targetWorldId]: parsed.conlangs || []
            }
          };
        });

        get().syncVaultDirectory(targetWorldId);
        await get().persistStore();
        return true;
      } else {
        // Full vault restore
        const cleanedEntities: Record<string, LoreEntity[]> = {};
        for (const [k, list] of Object.entries(parsed.entities || {})) {
          cleanedEntities[k] = ((list as LoreEntity[]) || []).map(stripAttribution);
        }
        const cleanedMaps: Record<string, WorldMap[]> = {};
        for (const [k, list] of Object.entries(parsed.maps || {})) {
          cleanedMaps[k] = ((list as WorldMap[]) || []).map(stripAttribution);
        }
        const cleanedCanvases: Record<string, WhiteboardCanvasData[]> = {};
        for (const [k, list] of Object.entries(parsed.canvases || {})) {
          cleanedCanvases[k] = ((list as WhiteboardCanvasData[]) || []).map(cleanCanvasAttribution);
        }

        set({
          worlds: (parsed.worlds || []).map(stripAttribution),
          activeWorldId: parsed.activeWorldId || parsed.worlds[0]?.id || sampleWorld.id,
          entities: cleanedEntities,
          maps: cleanedMaps,
          relations: parsed.relations || {},
          timelines: parsed.timelines || {},
          manuscripts: parsed.manuscripts || {},
          folders: parsed.folders || {},
          directoryItems: parsed.directoryItems || {},
          canvases: cleanedCanvases,
          categories: parsed.categories || {},
          calendars: parsed.calendars || {},
          relationNodePositions: parsed.relationNodePositions || {},
          conlangs: parsed.conlangs || {}
        });

        get().syncVaultDirectory();
        await get().persistStore();
        return true;
      }
    } catch (err) {
      console.error('Failed to import world:', err);
      return false;
    }
  },

  // ==========================================
  // CONLANG & LINGUISTICS CRUD
  // ==========================================
  setSelectedLanguageId: (id) => {
    set({ selectedLanguageId: id });
  },

  createLanguage: (name, description = '', family = '', color = '#38bdf8') => {
    const worldId = get().activeWorldId || sampleWorld.id;
    const newLang: ConlangLanguage = {
      id: `lang-${Date.now()}`,
      worldId,
      name,
      description,
      family,
      color,
      words: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      conlangs: {
        ...state.conlangs,
        [worldId]: [...(state.conlangs[worldId] || []), newLang]
      },
      selectedLanguageId: newLang.id
    }));

    get().createDirectoryItem(name, 'dictionary', null, newLang.id);
    get().persistStore();
    return newLang;
  },

  updateLanguage: (languageId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => ({
      conlangs: {
        ...state.conlangs,
        [worldId]: (state.conlangs[worldId] || []).map((l) =>
          l.id === languageId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        )
      }
    }));
    get().persistStore();
  },

  deleteLanguage: (languageId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => {
      const remaining = (state.conlangs[worldId] || []).filter((l) => l.id !== languageId);
      return {
        conlangs: {
          ...state.conlangs,
          [worldId]: remaining
        },
        selectedLanguageId: state.selectedLanguageId === languageId ? remaining[0]?.id || null : state.selectedLanguageId,
        directoryItems: {
          ...state.directoryItems,
          [worldId]: (state.directoryItems[worldId] || []).filter((i) => i.targetId !== languageId)
        }
      };
    });
    get().persistStore();
  },

  addWord: (languageId, wordData) => {
    const worldId = get().activeWorldId;
    if (!worldId) throw new Error('No active world');

    const newWord: ConlangWord = {
      ...wordData,
      id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      languageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      conlangs: {
        ...state.conlangs,
        [worldId]: (state.conlangs[worldId] || []).map((l) =>
          l.id === languageId ? { ...l, words: [...l.words, newWord], updatedAt: new Date().toISOString() } : l
        )
      }
    }));
    get().persistStore();
    return newWord;
  },

  updateWord: (languageId, wordId, updates) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => ({
      conlangs: {
        ...state.conlangs,
        [worldId]: (state.conlangs[worldId] || []).map((l) =>
          l.id === languageId
            ? {
                ...l,
                words: l.words.map((w) => (w.id === wordId ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w)),
                updatedAt: new Date().toISOString()
              }
            : l
        )
      }
    }));
    get().persistStore();
  },

  deleteWord: (languageId, wordId) => {
    const worldId = get().activeWorldId;
    if (!worldId) return;

    set((state) => ({
      conlangs: {
        ...state.conlangs,
        [worldId]: (state.conlangs[worldId] || []).map((l) =>
          l.id === languageId
            ? {
                ...l,
                words: l.words.filter((w) => w.id !== wordId),
                updatedAt: new Date().toISOString()
              }
            : l
        )
      }
    }));
    get().persistStore();
  }
}))

// Auto-flush pending debounced saves on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useWorldStore.getState().flushSave();
  });
}

if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).__getOrosCategories = () => {
    try {
      const s = useWorldStore.getState();
      return s.activeWorldId ? (s.categories[s.activeWorldId] || []) : [];
    } catch {
      return [];
    }
  };
  ;(globalThis as any).__orosPersistVault = () => {
    try {
      return useWorldStore.getState().persistStore();
    } catch {
      return Promise.resolve();
    }
  };
}

