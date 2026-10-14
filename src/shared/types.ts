export type EntityType = 
  | 'character' 
  | 'location' 
  | 'faction' 
  | 'item' 
  | 'event' 
  | 'magic_system' 
  | 'species' 
  | 'religion' 
  | 'document';

export interface InfoboxField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'date' | 'entity-link' | 'number' | 'tag-list';
  targetEntityId?: string;
}

export interface InfoboxSection {
  title: string;
  fields: InfoboxField[];
}

export interface LoreEntity {
  id: string;
  worldId: string;
  title: string;
  type: EntityType;
  summary: string;
  content: string; // TipTap JSON or HTML
  tags: string[];
  avatar?: string;
  banner?: string;
  aliases: string[];
  infobox: {
    subtitle?: string;
    sections: InfoboxSection[];
  };
  isSecret?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MapPin {
  id: string;
  mapId: string;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  title: string;
  description?: string;
  entityId?: string; // Linked Lore Card
  icon?: string;
  color?: string;
  subMapId?: string; // Drill down into nested map
}

export interface MapRegion {
  id: string;
  mapId: string;
  name: string;
  points: [number, number][]; // Array of [x, y] in percentage (0-100)
  color: string;
  fillOpacity: number;
  entityId?: string;
}

export interface WorldMap {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  imageUrl: string;
  parentId?: string; // Nested parent map ID
  scaleUnit?: string;
  pins: MapPin[];
  regions: MapRegion[];
  createdAt: string;
  updatedAt: string;
}

export interface RelationEdge {
  id: string;
  worldId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: 'family' | 'ally' | 'rival' | 'vassal' | 'member' | 'creator' | 'ruler' | 'custom';
  label: string;
  notes?: string;
  icon?: string;
  color?: string;
  isDashed?: boolean;
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  era: string;
  year: number;
  month?: number;
  day?: number;
  title: string;
  description: string;
  importance: 'mythic' | 'major' | 'minor';
  entityIds: string[];
}

export interface ManuscriptChapter {
  id: string;
  worldId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  updatedAt: string;
}

export interface World {
  id: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  bannerUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageData {
  version: string;
  worlds: World[];
  activeWorldId: string | null;
  entities: Record<string, LoreEntity[]>; // key: worldId
  maps: Record<string, WorldMap[]>; // key: worldId
  relations: Record<string, RelationEdge[]>; // key: worldId
  timelines: Record<string, TimelineEvent[]>; // key: worldId
  manuscripts: Record<string, ManuscriptChapter[]>; // key: worldId
  folders?: Record<string, DirectoryFolder[]>; // key: worldId
  directoryItems?: Record<string, DirectoryItem[]>; // key: worldId
  canvases?: Record<string, WhiteboardCanvasData[]>; // key: worldId
}

export type DirectoryItemType = 
  | 'canvas' 
  | 'wiki' 
  | 'card' 
  | 'relations' 
  | 'timeline' 
  | 'map' 
  | 'writer';

export interface DirectoryItem {
  id: string;
  worldId: string;
  name: string;
  type: DirectoryItemType;
  folderId?: string | null;
  targetId?: string; // id of specific entity, map, chapter, or canvas
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryFolder {
  id: string;
  worldId: string;
  name: string;
  parentId?: string | null; // For nested subfolders
  isOpen?: boolean;
  createdAt: string;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  type: DirectoryItemType;
  targetId?: string;
  isClosable?: boolean;
}

export interface CanvasStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface WhiteboardCanvasData {
  id: string;
  worldId: string;
  name: string;
  nodes: any[];
  edges: any[];
  strokes: CanvasStroke[];
  createdAt: string;
  updatedAt: string;
}
