export type EntityPresetType = 
  | 'character' 
  | 'location' 
  | 'faction' 
  | 'item' 
  | 'event' 
  | 'magic_system' 
  | 'species' 
  | 'religion' 
  | 'document';

export type EntityType = EntityPresetType | (string & {});

export interface EntityCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isPreset?: boolean;
  description?: string;
}

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

export interface ArtAttribution {
  artist: string;
  artworkTitle: string;
  year: string | number;
  institution: string;
  sourceUrl: string;
  license: string;
  thumbnailUrl?: string;
  medium?: string;
  dimensions?: string;
  notes?: string;
}

export interface CanvasCardData {
  entityId?: string;
  title?: string;
  subtitle?: string;
  avatar?: string;
  avatarUrl?: string;
  entityType?: string;
  summary?: string;
  isSecret?: boolean;
  expanded?: boolean;
  prevHeight?: number;
  tags?: string[];
  width?: number;
  height?: number;
  attribution?: ArtAttribution;
  artAttribution?: ArtAttribution;
  [key: string]: any;
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
  avatarUrl?: string;
  bannerUrl?: string;
  aliases: string[];
  infobox: {
    subtitle?: string;
    imageCaption?: string;
    sections: InfoboxSection[];
  };
  customProperties?: Record<string, any>;
  isSecret?: boolean;
  attribution?: ArtAttribution;
  artAttribution?: ArtAttribution;
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

export interface MapGridConfig {
  enabled?: boolean;
  type?: 'square' | 'hex';
  size?: number; // Cell size in pixels (e.g. 24 - 250)
  opacity?: number;
  showCoordinates?: boolean;
  unitFeet?: number; // e.g. 5 ft per cell
}

export interface WorldMap {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  imageUrl: string;
  parentId?: string; // Nested parent map ID
  scaleUnit?: string;
  scaleDistance?: number;
  scaleBarPixels?: number;
  gridConfig?: MapGridConfig;
  pins: MapPin[];
  regions: MapRegion[];
  attribution?: ArtAttribution;
  artAttribution?: ArtAttribution;
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
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  strokeWidth?: number;
  edgeType?: 'smoothstep' | 'bezier' | 'straight';
  arrowDirection?: 'end' | 'both' | 'none' | 'start';
  waypoints?: { x: number; y: number }[];
}

export type TimelinePeriodType = 'war' | 'reign' | 'epoch' | 'crisis' | 'dynasty' | 'cultural' | 'custom' | (string & {});
export type TimelineCategory = 'political' | 'war' | 'astronomical' | 'birth-death' | 'discovery' | 'arcane' | 'cultural' | (string & {});

export interface WorldEraDefinition {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color?: string;
  description?: string;
}

export interface TimelineCategoryDefinition {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TimelinePeriodClassification {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface CalendarPreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  config: Omit<WorldCalendarConfig, 'worldId'>;
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  era: string;
  isPeriod?: boolean;
  periodType?: TimelinePeriodType;
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  endHour?: number;
  category?: TimelineCategory;
  importance: 'mythic' | 'major' | 'minor';
  title: string;
  description: string;
  entityIds: string[];
  color?: string;
}

export interface WorldCalendarMonth {
  id: string;
  name: string;
  days: number;
  season?: string;
}

export interface CalendarLeapRule {
  id: string;
  name: string;
  interval: number;          // e.g. every 4 years
  offsetYear: number;        // e.g. 0
  extraDays: number;         // e.g. 1
  targetMonthId: string;     // Month that receives the extra days
  excludeInterval?: number;  // e.g. skip every 100 years
  reinstateInterval?: number;// e.g. reinstate every 400 years
}

export interface IntercalaryDay {
  id: string;
  name: string;
  occursAfterMonthId: string;
  isLeapOnly?: boolean;
  leapRuleId?: string;
  advancesWeekday: boolean;  // If false, outside standard weekly progression
  description?: string;
}

export interface CelestialMoonConfig {
  id: string;
  name: string;
  synodicPeriodDays: number; // Duration of lunar cycle in solar days
  epochPhase: number;        // Phase fraction at Day 0 [0.0 - 1.0], 0.0 = New, 0.5 = Full
  color: string;
  radiusPixels?: number;
  description?: string;
}

export interface CelestialPhaseResult {
  moonId: string;
  moonName: string;
  color: string;
  phaseFraction: number;     // 0.0 to 1.0
  phaseAngleRad: number;     // 0 to 2pi
  illuminationPercent: number; // 0% to 100%
  phaseName: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  isMajorPhase: boolean;     // New, First Quarter, Full, Last Quarter
}

export interface ConjunctionResult {
  type: 'grand_full_conjunction' | 'dark_solar_conjunction' | 'partial_alignment';
  alignedMoonIds: string[];
  severity: number;          // 0.0 - 1.0
  description: string;
}

export interface WorldCalendarConfig {
  worldId?: string;
  firstYear: number;
  lastYear: number;
  yearPrefix?: string;
  yearSuffix?: string;
  hoursInDay: number;
  daysOfWeek: string[];
  months: WorldCalendarMonth[];
  eras?: WorldEraDefinition[];
  customCategories?: TimelineCategoryDefinition[];
  customPeriodTypes?: TimelinePeriodClassification[];
  hasYearZero?: boolean;
  weekdayEpochOffset?: number;
  leapRules?: CalendarLeapRule[];
  intercalaryDays?: IntercalaryDay[];
  moons?: CelestialMoonConfig[];
}

export type WorldCalendarConfigExtended = WorldCalendarConfig;

export interface ManuscriptChapter {
  id: string;
  worldId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  updatedAt: string;
}

export type ThemePresetId = 'sovereign' | 'obsidian' | 'mythic' | 'cyber' | 'crimson' | 'hazard' | 'emerald' | 'nord' | 'parchment' | 'custom' | string;

export interface World {
  id: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  theme?: ThemePresetId;
  customAccentColor?: string;
  calendarConfig?: WorldCalendarConfig;
  bannerUrl?: string;
  thumbnailUrl?: string;
  attribution?: ArtAttribution;
  artAttribution?: ArtAttribution;
  themeConfig?: ThemeConfig;
  snippets?: CssSnippet[];
  useWorkspaceStyling?: boolean;
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
  calendars?: Record<string, WorldCalendarConfig>; // key: worldId
  folders?: Record<string, DirectoryFolder[]>; // key: worldId
  directoryItems?: Record<string, DirectoryItem[]>; // key: worldId
  canvases?: Record<string, WhiteboardCanvasData[]>; // key: worldId
  categories?: Record<string, EntityCategory[]>; // key: worldId
  relationNodePositions?: Record<string, Record<string, { x: number; y: number }>>; // key: worldId -> entityId -> { x, y }
  conlangs?: Record<string, ConlangLanguage[]>; // key: worldId
  ttrpgCampaigns?: TTRPGCampaign[];
  ttrpgCharacters?: Record<string, Dnd5eCharacter[]>; // key: campaignId
  ttrpgBattlemaps?: Record<string, TTRPGBattlemap[]>; // key: campaignId
  settings?: AppSettings;
}

// ==========================================
// CONSTRUCTED LANGUAGES (CONLANG) & GLOSSARY
// ==========================================
export type ConlangPartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'pronoun' 
  | 'preposition' 
  | 'honorific' 
  | 'idiom' 
  | 'phrase' 
  | 'particle';

export interface ConlangWord {
  id: string;
  languageId: string;
  term: string;                // e.g. "Skjaldmær", "Khorash"
  phonetic?: string;            // e.g. "/ˈskjɑld.mæːr/", "[kho-RASH]"
  partOfSpeech: ConlangPartOfSpeech;
  definition: string;          // e.g. "Shield-maiden of the northern sea fjords"
  etymology?: string;           // Root words, historical origin
  aliases?: string[];           // Inflected forms, plurals
  examples?: { original: string; translation: string }[];
  relatedEntityId?: string;    // Link to associated faction/culture/character
  createdAt: string;
  updatedAt: string;
}

export interface ConlangLanguage {
  id: string;
  worldId: string;
  name: string;                // e.g. "High Ostergardic"
  family?: string;             // e.g. "Archaic Boreal"
  description: string;
  writingSystem?: string;      // e.g. "Angular Runic"
  phonologyNotes?: string;
  color?: string;              // Accent badge color
  words: ConlangWord[];
  createdAt: string;
  updatedAt: string;
}

export type DirectoryItemType = 
  | 'canvas' 
  | 'wiki' 
  | 'card' 
  | 'relations' 
  | 'timeline' 
  | 'map' 
  | 'writer'
  | 'dictionary'
  | 'reader';

export interface DirectoryItem {
  id: string;
  worldId: string;
  name: string;
  type: DirectoryItemType;
  folderId?: string | null;
  targetId?: string; // id of specific entity, map, chapter, or canvas
  entityId?: string; // alias for targetId for entity items
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryFolder {
  id: string;
  worldId: string;
  name: string;
  parentId?: string | null; // For nested subfolders
  isOpen?: boolean;
  order?: number;
  createdAt: string;
  updatedAt?: string;
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

// ==========================================
// TTRPG CAMPAIGNS & D&D 5E CHARACTER SHEETS
// ==========================================
export type TTRPGSystem = 'dnd5e' | 'pathfinder2e' | 'generic';

export interface TTRPGToken {
  id: string;
  campaignId: string;
  battlemapId: string;
  name: string;
  avatarUrl?: string;
  x: number; // percentage 0 - 100 on map
  y: number; // percentage 0 - 100 on map
  size: number; // 1 = 1x1 (Medium/Small), 2 = 2x2 (Large), 3 = 3x3 (Huge)
  color?: string;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
  speed?: number;
  characterId?: string; // Linked Dnd5eCharacter id if player character
  conditions?: string[]; // e.g. ['Poisoned', 'Prone', 'Concentrating']
  isEnemy?: boolean;
}

export type BattlemapEffectType = 
  | 'fire' 
  | 'smoke' 
  | 'poison' 
  | 'ice' 
  | 'lightning' 
  | 'darkness' 
  | 'radiance' 
  | 'web'
  | 'arcane';

export type BattlemapEffectShape = 'circle' | 'cone' | 'line' | 'square' | 'projectile';

export interface TTRPGBattlemapEffect {
  id: string;
  battlemapId: string;
  name: string; // e.g. "Fireball (20ft)", "Fog Cloud (20ft)"
  type: BattlemapEffectType;
  shape: BattlemapEffectShape;
  x: number; // percentage 0 - 100 on map canvas (origin)
  y: number; // percentage 0 - 100 on map canvas (origin)
  targetX?: number; // percentage 0 - 100 for projectile target
  targetY?: number; // percentage 0 - 100 for projectile target
  radiusFeet?: number; // for circle or projectile explosion radius (e.g. 20, 40)
  lengthFeet?: number; // for line or cone (e.g. 60, 30)
  widthFeet?: number;  // for line or square (e.g. 5, 20)
  rotationDeg?: number; // for cone, line, or projectile heading (0 - 360 degrees)
  opacity?: number;     // 0.2 - 1.0 (default 0.75)
  color?: string;       // Custom hex override
  isTemporary?: boolean; // If true, auto-deletes after explosion / dissipation animation
  durationMs?: number;  // Lifespan in ms before auto-delete (default 3000)
  createdAt?: number;   // Timestamp
}

export interface TTRPGBattlemap {
  id: string;
  campaignId: string;
  name: string;
  imageUrl: string;
  description?: string;
  gridType: 'square' | 'hex';
  gridSize: number; // Cell size in pixels (e.g. 64)
  gridOpacity: number; // 0.1 - 0.9
  gridUnitFeet: number; // default 5 ft per cell
  showCoordinates: boolean;
  snapToGrid: boolean;
  tokens: TTRPGToken[];
  effects?: TTRPGBattlemapEffect[];
  walls?: TTRPGWall[];
  createdAt: string;
  updatedAt: string;
}

export interface TTRPGCampaign {
  id: string;
  title: string;
  system: TTRPGSystem;
  tagline: string;
  description: string;
  linkedWorldId?: string; // Optional link to a worldbuilding vault
  bannerUrl?: string;
  sessionNotes?: string;
  activeBattlemapId?: string;
  battlemaps?: TTRPGBattlemap[];
  createdAt: string;
  updatedAt: string;
}

export interface Dnd5eAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type Dnd5eSkillProficiency = 'none' | 'proficient' | 'expertise' | 'half';

export interface Dnd5eAttack {
  id: string;
  name: string;
  bonus: number; // e.g. +6
  damage: string; // e.g. "1d8 + 4"
  damageType: string; // e.g. "Slashing", "Piercing", "Fire"
  range?: string; // e.g. "5 ft", "150/600 ft"
  notes?: string;
}

export interface Dnd5eSpell {
  id: string;
  name: string;
  level: number; // 0 for cantrip, 1-9
  school: string; // e.g. "Evocation", "Abjuration"
  castingTime: string; // e.g. "1 Action", "1 Bonus Action"
  range: string; // e.g. "60 ft", "Touch"
  components: string; // e.g. "V, S, M"
  duration: string; // e.g. "Instantaneous", "1 hour"
  concentration: boolean;
  description: string;
  prepared?: boolean;
}

export interface Dnd5eCharacter {
  id: string;
  campaignId: string;
  name: string;
  playerName?: string;
  avatarUrl?: string;
  race: string;
  characterClass: string; // e.g. "Fighter"
  subclass?: string; // e.g. "Battle Master"
  background?: string;
  alignment?: string;
  level: number;
  experiencePoints?: number;
  inspiration: boolean;
  
  // Combat Vitals
  armorClass: number;
  initiativeBonus?: number;
  speed: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDice: string; // e.g. "5d10"
  hitDiceRemaining: number;
  deathSaves: {
    successes: number; // 0-3
    failures: number;  // 0-3
  };

  // Abilities & Saves
  abilities: Dnd5eAbilityScores;
  savingThrowProficiencies: (keyof Dnd5eAbilityScores)[];

  // Skills
  skills: Record<string, Dnd5eSkillProficiency>;

  // Combat & Spells
  attacks: Dnd5eAttack[];
  spellcasting?: {
    ability: keyof Dnd5eAbilityScores;
    spellSaveDcOverride?: number;
    spellAttackBonusOverride?: number;
    slots: Record<number, { max: number; used: number }>; // levels 1-9
    spells: Dnd5eSpell[];
  };

  // Currency & Equipment
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  equipment: string[];

  // Lore & Roleplay
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  featuresAndTraits?: string;
  backstory?: string;

  createdAt: string;
  updatedAt: string;
}

// ==========================================
// APP SETTINGS, THEMES & CSS SNIPPETS
// ==========================================
export type SettingsTab = 'general' | 'interface' | 'editor' | 'files' | 'hotkeys' | 'about';
export type ColorMode = 'system' | 'light' | 'dark';
export type ThemeScope = 'global' | 'workspace';

export interface ThemeTokens {
  accent: string;
  muted: string;
  subtle: string;
  border: string;
  hover: string;
  ring: string;
  glow: string;
  contrast: string;
  dots: string;
  bgApp?: string;
  bgSurface?: string;
  bgElevated?: string;
  bgInput?: string;
  borderSubtle?: string;
  borderStrong?: string;
  textPrimary?: string;
  textSecondary?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  author?: string;
  version?: string;
  description?: string;
  colorMode?: ColorMode;
  tokens: Partial<ThemeTokens>;
  customCss?: string;
}

export interface CssSnippet {
  id: string;
  name: string;
  enabled: boolean;
  css: string;
  description?: string;
  updatedAt?: string;
}

export interface AppSettings {
  general: {
    startupView: 'home' | 'last-workspace';
    autoSaveIntervalMs: number;
    confirmEntityDeletion: boolean;
    confirmWorldDeletion: boolean;
    toastDurationMs: number;
  };
  interface: {
    colorMode: ColorMode;
    themePreset: ThemePresetId;
    customAccentColor?: string;
    forceGlobalTheme: boolean;
    themeScope?: ThemeScope;
    customThemes?: ThemeConfig[];
    snippets?: CssSnippet[];
    uiDensity: 'compact' | 'standard' | 'comfortable';
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    enableBackdropBlur: boolean;
    enableAnimations: boolean;
  };
  editor: {
    fontSize: number;
    lineHeight: number;
    maxWidth: 'readable' | 'wide' | 'full';
    typewriterMode: boolean;
    autoPairBrackets: boolean;
    spellcheck: boolean;
    showWordCount: boolean;
  };
  files: {
    customVaultPath?: string;
    autoBackup: boolean;
    maxBackups: number;
  };
}

export interface AppUpdateReleaseAsset {
  id: number;
  name: string;
  size: number;
  downloadUrl: string;
  type: 'installer' | 'portable' | 'other';
}

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  releaseUrl: string;
  installerAsset?: AppUpdateReleaseAsset;
  portableAsset?: AppUpdateReleaseAsset;
  allAssets: AppUpdateReleaseAsset[];
  checkedAt: string;
  error?: string;
}

export interface UpdateDownloadProgress {
  percent: number;
  transferredBytes: number;
  totalBytes: number;
}

// ==========================================
// ECOSYSTEM BRIDGES (Obsidian & Foundry VTT)
// ==========================================

export interface TTRPGWall {
  id: string;
  battlemapId: string;
  p1: { x: number; y: number }; // percentage 0-100
  p2: { x: number; y: number }; // percentage 0-100
  wallType: 'wall' | 'window' | 'terrain' | 'ethereal';
  blocksMovement: boolean;
  blocksVision: boolean;
  blocksSound?: boolean;
  isDoor?: boolean;
  doorType?: 'regular' | 'secret';
  doorState?: 'closed' | 'open' | 'locked';
}

export interface FoundryWallData {
  _id: string;
  c: [number, number, number, number]; // [x1, y1, x2, y2] in scene pixels
  move: number;  // 20 = blocks, 0 = passes
  sense: number; // 20 = blocks, 10 = limited, 0 = passes
  sound?: number;
  dir?: number;
  door: number;  // 0 = none, 1 = door, 2 = secret
  ds: number;    // 0 = closed, 1 = open, 2 = locked
}

export interface FoundryTokenData {
  _id: string;
  name: string;
  actorId?: string | null;
  x: number;     // scene pixel coordinate (top-left)
  y: number;     // scene pixel coordinate (top-left)
  width: number; // grid cell units
  height: number;
  scale?: number;
  disposition: number; // 1 = friendly, 0 = neutral, -1 = hostile
  texture?: { src: string };
  bar1?: { attribute?: string; value?: number; max?: number };
  bar2?: { attribute?: string; value?: number; max?: number };
  hidden?: boolean;
}

export interface FoundrySceneData {
  _id: string;
  name: string;
  active: boolean;
  navigation: boolean;
  img: string;
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
  grid: {
    type: number; // 1 = square, 2 = hex odd, 3 = hex even
    size: number;
    distance: number;
    units: string;
    color?: string;
    alpha?: number;
  };
  walls: FoundryWallData[];
  tokens: FoundryTokenData[];
  lights?: any[];
}

export interface ObsidianExportResult {
  files: Record<string, string>; // filepath -> markdown content
  manifest: {
    totalFiles: number;
    folders: string[];
    exportedEntityIds: string[];
  };
}

export interface ObsidianImportResult {
  entities: LoreEntity[];
  folders: DirectoryFolder[];
  directoryItems: DirectoryItem[];
}


