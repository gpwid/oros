import React from 'react'
import { EntityCategory } from '@shared/types'
import {
  // Characters & Roles
  User,
  Users,
  UserCheck,
  Crown,
  GraduationCap,
  Glasses,
  Footprints,
  HeartHandshake,
  VenetianMask,
  Ghost,
  // Creatures & Nature
  Cat,
  Dog,
  Bird,
  Fish,
  Bug,
  TreePine,
  Trees,
  Flower2,
  Dna,
  Heart,
  Droplet,
  Wind,
  CloudLightning,
  Sun,
  Moon,
  // Geography & Architecture
  MapPin,
  Compass,
  Map,
  Navigation,
  Castle,
  Landmark,
  Building,
  Building2,
  Home,
  Tent,
  Mountain,
  MountainSnow,
  Globe,
  Ship,
  Anchor,
  // Combat, Factions & Warfare
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sword,
  Swords,
  Axe,
  Crosshair,
  Target,
  Bomb,
  Skull,
  Flag,
  // Magic, Relics & Arcana
  Sparkles,
  Sparkle,
  Wand2,
  Gem,
  Flame,
  Zap,
  Star,
  Stars,
  Orbit,
  Atom,
  // Lore, Knowledge & Time
  Scroll,
  BookOpen,
  Book,
  Library,
  Feather,
  Scale,
  Coins,
  Key,
  Lock,
  Unlock,
  Hourglass,
  Clock,
  Timer,
  Milestone,
  Bell,
  DoorOpen,
  // Concepts, Inventory & Tech
  Layers,
  Box,
  Boxes,
  Package,
  Cpu,
  Terminal,
  Binary,
  Radio,
  Rocket,
  Activity,
  Eye,
  Briefcase,
  Trophy,
  Medal,
  Award,
  LucideIcon
} from 'lucide-react'

export const DEFAULT_PRESET_CATEGORIES: EntityCategory[] = [
  {
    id: 'character',
    name: 'Characters',
    icon: 'User',
    color: '#f5c542', // Mythic Gold
    isPreset: true,
    description: 'People, figures, NPCs, and personas'
  },
  {
    id: 'location',
    name: 'Locations',
    icon: 'MapPin',
    color: '#10b981', // Emerald
    isPreset: true,
    description: 'Settlements, regions, landmarks, and planets'
  },
  {
    id: 'faction',
    name: 'Factions',
    icon: 'Shield',
    color: '#3b82f6', // Cobalt
    isPreset: true,
    description: 'Organizations, corporations, factions, and groups'
  },
  {
    id: 'item',
    name: 'Items & Artifacts',
    icon: 'Sparkles',
    color: '#a855f7', // Amethyst
    isPreset: true,
    description: 'Equipment, technology, relics, and objects'
  },
  {
    id: 'event',
    name: 'Events',
    icon: 'Flame',
    color: '#f43f5e', // Crimson
    isPreset: true,
    description: 'Battles, discoveries, meetings, and key occurrences'
  },
  {
    id: 'magic_system',
    name: 'Systems & Rules',
    icon: 'Zap',
    color: '#06b6d4', // Cyber Cyan
    isPreset: true,
    description: 'Magic systems, technology, science, and world laws'
  },
  {
    id: 'species',
    name: 'Species & Organisms',
    icon: 'Dna',
    color: '#84cc16', // Lime
    isPreset: true,
    description: 'Species, creatures, populations, and biology'
  },
  {
    id: 'religion',
    name: 'Faiths & Beliefs',
    icon: 'Crown',
    color: '#f59e0b', // Amber
    isPreset: true,
    description: 'Religions, philosophies, and belief systems'
  },
  {
    id: 'document',
    name: 'Documents & Lore',
    icon: 'Scroll',
    color: '#94a3b8', // Slate
    isPreset: true,
    description: 'Manuscripts, treaties, letters, and archives'
  }
]

export const CATEGORY_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  // Characters & Roles
  { id: 'User', label: 'Person / Persona', icon: User },
  { id: 'Users', label: 'Group / Guild / Party', icon: Users },
  { id: 'UserCheck', label: 'Ally / Recognized', icon: UserCheck },
  { id: 'Crown', label: 'Ruler / Nobility / Monarchy', icon: Crown },
  { id: 'GraduationCap', label: 'Scholar / Academy', icon: GraduationCap },
  { id: 'Glasses', label: 'Investigator / Intellect', icon: Glasses },
  { id: 'Footprints', label: 'Traveler / Ranger / Scout', icon: Footprints },
  { id: 'HeartHandshake', label: 'Alliance / Treaty / Pact', icon: HeartHandshake },
  { id: 'VenetianMask', label: 'Spymaster / Secret / Masquerade', icon: VenetianMask },
  { id: 'Ghost', label: 'Spirit / Undead / Specter', icon: Ghost },

  // Creatures, Beasts & Nature
  { id: 'Cat', label: 'Feline / Beast', icon: Cat },
  { id: 'Dog', label: 'Hound / Companion', icon: Dog },
  { id: 'Bird', label: 'Avian / Messenger', icon: Bird },
  { id: 'Fish', label: 'Aquatic / Marine Life', icon: Fish },
  { id: 'Bug', label: 'Insectoid / Swarm', icon: Bug },
  { id: 'TreePine', label: 'Conifer / Taiga', icon: TreePine },
  { id: 'Trees', label: 'Forest / Wilderness', icon: Trees },
  { id: 'Flower2', label: 'Flora / Herbalism', icon: Flower2 },
  { id: 'Dna', label: 'Biology / Bloodline / Genetics', icon: Dna },
  { id: 'Heart', label: 'Vitality / Bond / Health', icon: Heart },

  // Geography & Architecture
  { id: 'MapPin', label: 'Map Pin / Landmark', icon: MapPin },
  { id: 'Compass', label: 'Compass / Exploration', icon: Compass },
  { id: 'Map', label: 'Cartography / Territory', icon: Map },
  { id: 'Navigation', label: 'Route / Wayfinding', icon: Navigation },
  { id: 'Castle', label: 'Castle / Citadel / Fortress', icon: Castle },
  { id: 'Landmark', label: 'Monument / Sanctuary / Temple', icon: Landmark },
  { id: 'Building', label: 'Structure / Settlement', icon: Building },
  { id: 'Building2', label: 'City / Metropolis', icon: Building2 },
  { id: 'Home', label: 'Dwelling / Haven', icon: Home },
  { id: 'Tent', label: 'Camp / Outpost / Expedition', icon: Tent },
  { id: 'Mountain', label: 'Mountain / Range / Peak', icon: Mountain },
  { id: 'MountainSnow', label: 'Glacier / Frozen Peak', icon: MountainSnow },
  { id: 'Globe', label: 'World / Cosmos / Planet', icon: Globe },
  { id: 'Ship', label: 'Ship / Fleet / Armada', icon: Ship },
  { id: 'Anchor', label: 'Harbor / Seafaring / Port', icon: Anchor },

  // Combat, Factions & Warfare
  { id: 'Shield', label: 'Shield / Defense / Faction', icon: Shield },
  { id: 'ShieldAlert', label: 'Garrison / High Threat', icon: ShieldAlert },
  { id: 'ShieldCheck', label: 'Protectorate / Bastion', icon: ShieldCheck },
  { id: 'Sword', label: 'Blade / Melee Weapon', icon: Sword },
  { id: 'Swords', label: 'Battle / Conflict / War', icon: Swords },
  { id: 'Axe', label: 'Axe / Barbarian / Cleaver', icon: Axe },
  { id: 'Crosshair', label: 'Target / Bounty / Mark', icon: Crosshair },
  { id: 'Target', label: 'Objective / Archery', icon: Target },
  { id: 'Bomb', label: 'Explosive / Siege Engine', icon: Bomb },
  { id: 'Skull', label: 'Danger / Mortality / Hazard', icon: Skull },
  { id: 'Flag', label: 'Banner / Realm / Standard', icon: Flag },

  // Magic, Arcana & Cosmology
  { id: 'Sparkles', label: 'Magic / Arcana / Enchantment', icon: Sparkles },
  { id: 'Sparkle', label: 'Glimmer / Miracle', icon: Sparkle },
  { id: 'Wand2', label: 'Spellcraft / Focus / Wand', icon: Wand2 },
  { id: 'Gem', label: 'Relic / Crystal / Jewel', icon: Gem },
  { id: 'Flame', label: 'Fire / Destruction / Event', icon: Flame },
  { id: 'Zap', label: 'Lightning / Raw Power / Electric', icon: Zap },
  { id: 'Droplet', label: 'Water / Alchemy / Elixir', icon: Droplet },
  { id: 'Wind', label: 'Air / Tempest / Zephyr', icon: Wind },
  { id: 'CloudLightning', label: 'Storm / Calamity', icon: CloudLightning },
  { id: 'Sun', label: 'Solar / Day / Light', icon: Sun },
  { id: 'Moon', label: 'Lunar / Night / Mysticism', icon: Moon },
  { id: 'Star', label: 'Star / Celestial / Destiny', icon: Star },
  { id: 'Stars', label: 'Constellation / Cosmos', icon: Stars },
  { id: 'Orbit', label: 'Orbit / Astral Sphere', icon: Orbit },
  { id: 'Atom', label: 'Essence / Particle / Science', icon: Atom },

  // Lore, Knowledge & Time
  { id: 'Scroll', label: 'Scroll / Manuscript / Chronicle', icon: Scroll },
  { id: 'BookOpen', label: 'Tome / Open Book / Knowledge', icon: BookOpen },
  { id: 'Book', label: 'Grimoire / Codex', icon: Book },
  { id: 'Library', label: 'Archive / Library / Vault', icon: Library },
  { id: 'Feather', label: 'Quill / Lore / Author', icon: Feather },
  { id: 'Scale', label: 'Justice / Balance / Law', icon: Scale },
  { id: 'Coins', label: 'Currency / Economy / Treasury', icon: Coins },
  { id: 'Key', label: 'Key / Secret / Access', icon: Key },
  { id: 'Lock', label: 'Warded / Sealed / Locked', icon: Lock },
  { id: 'Unlock', label: 'Breached / Open Gate', icon: Unlock },
  { id: 'Hourglass', label: 'Epoch / Era / Passage of Time', icon: Hourglass },
  { id: 'Clock', label: 'Time / Hour / Schedule', icon: Clock },
  { id: 'Timer', label: 'Countdown / Trial', icon: Timer },
  { id: 'Milestone', label: 'Milestone / Monument / Stage', icon: Milestone },
  { id: 'Bell', label: 'Chime / Watchbell / Alarm', icon: Bell },
  { id: 'DoorOpen', label: 'Portal / Gateway / Entrance', icon: DoorOpen },

  // Technology, Artifacts & Concepts
  { id: 'Layers', label: 'Layers / System / Concept', icon: Layers },
  { id: 'Box', label: 'Container / Chest', icon: Box },
  { id: 'Boxes', label: 'Inventory / Cargo / Logistics', icon: Boxes },
  { id: 'Package', label: 'Artifact / Bundle / Crate', icon: Package },
  { id: 'Cpu', label: 'Core / Mechanism / Automaton', icon: Cpu },
  { id: 'Terminal', label: 'Terminal / Interface / Tech', icon: Terminal },
  { id: 'Binary', label: 'Cipher / Code / Digital', icon: Binary },
  { id: 'Radio', label: 'Transmitter / Frequency', icon: Radio },
  { id: 'Rocket', label: 'Vessel / Starship / Propulsion', icon: Rocket },
  { id: 'Activity', label: 'Pulse / Vital Signs', icon: Activity },
  { id: 'Eye', label: 'Vision / Observation / All-Seeing', icon: Eye },
  { id: 'Briefcase', label: 'Guild / Corporate / Syndicate', icon: Briefcase },
  { id: 'Trophy', label: 'Trophy / Victory / Champion', icon: Trophy },
  { id: 'Medal', label: 'Honor / Insignia / Medal', icon: Medal },
  { id: 'Award', label: 'Distinction / Merit', icon: Award }
]

export const CATEGORY_COLOR_PALETTES = [
  { name: 'Platinum', hex: '#e2e8f0', bgClass: 'bg-slate-200/15', textClass: 'text-slate-200', borderClass: 'border-slate-300/30' },
  { name: 'Mythic Gold', hex: '#f5c542', bgClass: 'bg-yellow-500/15', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30' },
  { name: 'Cyber Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500/15', textClass: 'text-cyan-400', borderClass: 'border-cyan-500/30' },
  { name: 'Crimson', hex: '#f43f5e', bgClass: 'bg-rose-500/15', textClass: 'text-rose-400', borderClass: 'border-rose-500/30' },
  { name: 'Hazard', hex: '#f97316', bgClass: 'bg-orange-500/15', textClass: 'text-orange-400', borderClass: 'border-orange-500/30' },
  { name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
  { name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
  { name: 'Cobalt', hex: '#3b82f6', bgClass: 'bg-blue-500/15', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
  { name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500/15', textClass: 'text-indigo-400', borderClass: 'border-indigo-500/30' },
  { name: 'Amethyst', hex: '#a855f7', bgClass: 'bg-purple-500/15', textClass: 'text-purple-400', borderClass: 'border-purple-500/30' },
  { name: 'Pink Rose', hex: '#ec4899', bgClass: 'bg-pink-500/15', textClass: 'text-pink-400', borderClass: 'border-pink-500/30' },
  { name: 'Slate', hex: '#94a3b8', bgClass: 'bg-slate-500/15', textClass: 'text-slate-400', borderClass: 'border-slate-500/30' }
]

export function getCategoryIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Layers
  const match = CATEGORY_ICONS.find((item) => item.id.toLowerCase() === iconName.toLowerCase())
  return match ? match.icon : Layers
}

export function getCategoryMeta(
  typeOrId: string,
  customCategories: EntityCategory[] = []
): EntityCategory {
  let categoriesToUse = customCategories
  if (!categoriesToUse || categoriesToUse.length === 0) {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__getOrosCategories === 'function') {
      try {
        categoriesToUse = (globalThis as any).__getOrosCategories() || []
      } catch {
        categoriesToUse = []
      }
    }
  }

  const all = [...DEFAULT_PRESET_CATEGORIES, ...(categoriesToUse || [])]
  const exact = all.find((c) => c.id.toLowerCase() === typeOrId?.toLowerCase())
  if (exact) return exact

  // Match by name
  const nameMatch = all.find((c) => c.name.toLowerCase() === typeOrId?.toLowerCase())
  if (nameMatch) return nameMatch

  // Friendly name for custom or legacy ids (avoid raw CAT-123 IDs in UI)
  let friendlyName = typeOrId || 'General'
  if (friendlyName.toLowerCase().startsWith('cat-')) {
    friendlyName = 'Custom Label'
  } else {
    friendlyName = friendlyName.charAt(0).toUpperCase() + friendlyName.slice(1).replace(/_/g, ' ')
  }

  return {
    id: typeOrId,
    name: friendlyName,
    icon: 'Layers',
    color: '#f5c542',
    isPreset: false,
    description: 'Custom category'
  }
}
