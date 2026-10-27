import {
  // Arcane & Magic
  Sparkles,
  Sparkle,
  Wand2,
  Gem,
  Flame,
  Zap,
  Moon,
  Sun,
  Star,
  Stars,
  Orbit,
  Eye,
  // Sci-Fi, Cyber & Tech
  Rocket,
  Cpu,
  Atom,
  Terminal,
  Binary,
  Radio,
  Dna,
  Layers,
  Activity,
  // Combat, Warfare & Grimdark
  Sword,
  Swords,
  Axe,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crosshair,
  Target,
  Bomb,
  Skull,
  Ghost,
  Flag,
  // Exploration, Nature & Geography
  Compass,
  MapPin,
  Map,
  Navigation,
  Mountain,
  MountainSnow,
  TreePine,
  Trees,
  Flower2,
  Globe,
  Tent,
  // Nautical & Seafaring
  Ship,
  Anchor,
  Fish,
  Wind,
  Droplet,
  // Civilization, Nobility & Architecture
  Crown,
  Castle,
  Landmark,
  Building,
  Building2,
  Home,
  DoorOpen,
  Milestone,
  Bell,
  // Lore, Relics & Knowledge
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
  // Society & Mystery
  VenetianMask,
  Search,
  Heart,
  HeartHandshake,
  User,
  Users,
  Briefcase,
  Trophy,
  Medal,
  Award,
  Bird,
  Cat,
  Dog,
  Bug,
  LucideIcon
} from 'lucide-react'
import { CustomGenre } from '@shared/types'

export interface GenrePreset {
  id: string
  name: string
  icon: LucideIcon
  desc: string
  isCustom?: boolean
}

export interface GenreIconOption {
  id: string
  label: string
  category: 'Arcane & Magic' | 'Sci-Fi & Cyber' | 'Combat & Warfare' | 'Exploration & Wilds' | 'Civilization & Lore' | 'Nautical & Sea' | 'Horror & Mystery'
  icon: LucideIcon
}

export const GENRE_PRESETS: GenrePreset[] = [
  { id: 'fantasy', name: 'Fantasy', icon: Sparkles, desc: 'High magic, mythical realms, legendary lore' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: Rocket, desc: 'Space exploration, future tech, planetary sagas' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: Cpu, desc: 'High-tech low-life, neon cities, megacorps' },
  { id: 'grimdark', name: 'Grimdark', icon: Skull, desc: 'Brutal realism, morally grey factions, bleak survival' },
  { id: 'horror', name: 'Horror', icon: Ghost, desc: 'Eldritch terror, haunting mysteries, dark suspense' },
  { id: 'mystery', name: 'Mystery', icon: Search, desc: 'Enigmas, occult investigations, hidden secrets' },
  { id: 'steampunk', name: 'Steampunk', icon: Clock, desc: 'Clockwork mechanisms, brass engines, Victorian alternate' },
  { id: 'mythology', name: 'Mythology', icon: Crown, desc: 'Pantheons, cosmic epics, divine intervention' },
  { id: 'historical', name: 'Historical', icon: Landmark, desc: 'Authentic epochs, ancient empires, feudal chronicles' },
  { id: 'dystopia', name: 'Dystopia', icon: Radio, desc: 'Totalitarian regimes, surveillance, post-collapse order' },
  { id: 'wasteland', name: 'Wasteland', icon: Flame, desc: 'Post-apocalyptic ruins, radioactive ash, scavengers' },
  { id: 'adventure', name: 'Adventure', icon: Compass, desc: 'Uncharted wilderness, treasure expeditions, quests' },
  { id: 'western', name: 'Western', icon: Sun, desc: 'Frontier outlaws, dusty deserts, lawless territories' },
  { id: 'solarpunk', name: 'Solarpunk', icon: Flower2, desc: 'Ecological harmony, green tech, renewable futures' },
  { id: 'gothic', name: 'Gothic', icon: Castle, desc: 'Brooding fortresses, curses, romantic melancholy' },
  { id: 'noir', name: 'Noir', icon: VenetianMask, desc: 'Hard-boiled detectives, cynical crime, urban shadows' },
  { id: 'cosmic', name: 'Cosmic', icon: Orbit, desc: 'Astral anomalies, deep void civilizations, alien mysteries' },
  { id: 'supernatural', name: 'Supernatural', icon: Moon, desc: 'Hidden masquerades, vampires, spirits, occult cabals' },
  { id: 'military', name: 'Military', icon: Shield, desc: 'Tactical doctrines, grand armadas, wartime sieges' },
  { id: 'thriller', name: 'Thriller', icon: Zap, desc: 'High stakes espionage, ticking clocks, conspiracies' },
  { id: 'romance', name: 'Romance', icon: Heart, desc: 'Courtly intrigue, passionate bonds, romantic sagas' },
  { id: 'urban', name: 'Urban', icon: Building2, desc: 'Modern occult, street magic, city underbellies' },
  { id: 'folklore', name: 'Folklore', icon: Trees, desc: 'Fables, forest spirits, local myths, superstitions' },
  { id: 'biopunk', name: 'Biopunk', icon: Dna, desc: 'Genetic manipulation, synthetic life, bio-augmentation' },
  { id: 'maritime', name: 'Maritime', icon: Anchor, desc: 'High seas expeditions, fleets, corsairs, leviathans' },
  { id: 'philosophy', name: 'Philosophy', icon: BookOpen, desc: 'Metaphysical treatises, moral systems, utopias' },
  { id: 'esoteric', name: 'Esoteric', icon: Eye, desc: 'Hermetic secrets, forbidden arcana, hidden knowledge' },
  { id: 'speculative', name: 'Speculative', icon: Layers, desc: 'Alternate timelines, conceptual worlds, what-ifs' }
]

export const GENRE_ICONS: GenreIconOption[] = [
  // Arcane & Magic
  { id: 'Sparkles', label: 'Magic / Arcana', category: 'Arcane & Magic', icon: Sparkles },
  { id: 'Sparkle', label: 'Glimmer / Starfire', category: 'Arcane & Magic', icon: Sparkle },
  { id: 'Wand2', label: 'Spellcraft / Wand', category: 'Arcane & Magic', icon: Wand2 },
  { id: 'Gem', label: 'Crystal / Gem / Relic', category: 'Arcane & Magic', icon: Gem },
  { id: 'Flame', label: 'Fire / Elemental', category: 'Arcane & Magic', icon: Flame },
  { id: 'Zap', label: 'Lightning / Surge', category: 'Arcane & Magic', icon: Zap },
  { id: 'Moon', label: 'Lunar / Night', category: 'Arcane & Magic', icon: Moon },
  { id: 'Sun', label: 'Solar / Daylight', category: 'Arcane & Magic', icon: Sun },
  { id: 'Star', label: 'Starlight / Celestial', category: 'Arcane & Magic', icon: Star },
  { id: 'Stars', label: 'Constellation / Astral', category: 'Arcane & Magic', icon: Stars },
  { id: 'Orbit', label: 'Orbital / Planetary', category: 'Arcane & Magic', icon: Orbit },
  { id: 'Eye', label: 'All-Seeing Eye / Divination', category: 'Arcane & Magic', icon: Eye },

  // Sci-Fi & Cyber
  { id: 'Rocket', label: 'Starship / Spacecraft', category: 'Sci-Fi & Cyber', icon: Rocket },
  { id: 'Cpu', label: 'AI Core / Cybernetic', category: 'Sci-Fi & Cyber', icon: Cpu },
  { id: 'Atom', label: 'Atomic / Quantum', category: 'Sci-Fi & Cyber', icon: Atom },
  { id: 'Terminal', label: 'Hacking / Terminal', category: 'Sci-Fi & Cyber', icon: Terminal },
  { id: 'Binary', label: 'Matrix / Binary Code', category: 'Sci-Fi & Cyber', icon: Binary },
  { id: 'Radio', label: 'Signal / Frequency', category: 'Sci-Fi & Cyber', icon: Radio },
  { id: 'Dna', label: 'Genetics / Mutation', category: 'Sci-Fi & Cyber', icon: Dna },
  { id: 'Layers', label: 'Holo-Layers / Grid', category: 'Sci-Fi & Cyber', icon: Layers },
  { id: 'Activity', label: 'Biometrics / Pulse', category: 'Sci-Fi & Cyber', icon: Activity },

  // Combat & Warfare
  { id: 'Sword', label: 'Sword / Blade', category: 'Combat & Warfare', icon: Sword },
  { id: 'Swords', label: 'Dual Swords / Clash', category: 'Combat & Warfare', icon: Swords },
  { id: 'Axe', label: 'Battleaxe / Barbarian', category: 'Combat & Warfare', icon: Axe },
  { id: 'Shield', label: 'Knight Shield / Defense', category: 'Combat & Warfare', icon: Shield },
  { id: 'ShieldAlert', label: 'Vanguard / Alert', category: 'Combat & Warfare', icon: ShieldAlert },
  { id: 'ShieldCheck', label: 'Bastion / Holy Guard', category: 'Combat & Warfare', icon: ShieldCheck },
  { id: 'Crosshair', label: 'Sniper / Targeting', category: 'Combat & Warfare', icon: Crosshair },
  { id: 'Target', label: 'Archery / Mark', category: 'Combat & Warfare', icon: Target },
  { id: 'Bomb', label: 'Demolition / Ordnance', category: 'Combat & Warfare', icon: Bomb },
  { id: 'Flag', label: 'Banner / Standard', category: 'Combat & Warfare', icon: Flag },

  // Horror & Mystery
  { id: 'Skull', label: 'Grim Skull / Death', category: 'Horror & Mystery', icon: Skull },
  { id: 'Ghost', label: 'Specter / Phantom', category: 'Horror & Mystery', icon: Ghost },
  { id: 'VenetianMask', label: 'Masquerade / Persona', category: 'Horror & Mystery', icon: VenetianMask },
  { id: 'Search', label: 'Detective / Inquiry', category: 'Horror & Mystery', icon: Search },
  { id: 'Lock', label: 'Sealed / Forbidden', category: 'Horror & Mystery', icon: Lock },
  { id: 'Unlock', label: 'Breached / Revealed', category: 'Horror & Mystery', icon: Unlock },

  // Exploration & Wilds
  { id: 'Compass', label: 'Compass / Wayfinder', category: 'Exploration & Wilds', icon: Compass },
  { id: 'MapPin', label: 'Landmark / Outpost', category: 'Exploration & Wilds', icon: MapPin },
  { id: 'Map', label: 'Expedition Map', category: 'Exploration & Wilds', icon: Map },
  { id: 'Navigation', label: 'Cartography / Vector', category: 'Exploration & Wilds', icon: Navigation },
  { id: 'Mountain', label: 'High Peaks / Alps', category: 'Exploration & Wilds', icon: Mountain },
  { id: 'MountainSnow', label: 'Glacier / Frozen North', category: 'Exploration & Wilds', icon: MountainSnow },
  { id: 'TreePine', label: 'Taiga / Conifer', category: 'Exploration & Wilds', icon: TreePine },
  { id: 'Trees', label: 'Deep Forest / Woodland', category: 'Exploration & Wilds', icon: Trees },
  { id: 'Flower2', label: 'Flora / Solarpunk', category: 'Exploration & Wilds', icon: Flower2 },
  { id: 'Globe', label: 'Planetary Realm', category: 'Exploration & Wilds', icon: Globe },
  { id: 'Tent', label: 'Expedition Camp', category: 'Exploration & Wilds', icon: Tent },

  // Nautical & Sea
  { id: 'Ship', label: 'Galleon / Flagship', category: 'Nautical & Sea', icon: Ship },
  { id: 'Anchor', label: 'Anchor / Harbor', category: 'Nautical & Sea', icon: Anchor },
  { id: 'Fish', label: 'Leviathan / Deep Sea', category: 'Nautical & Sea', icon: Fish },
  { id: 'Wind', label: 'Tempest / Trade Winds', category: 'Nautical & Sea', icon: Wind },
  { id: 'Droplet', label: 'Abyssal Deep / Elixir', category: 'Nautical & Sea', icon: Droplet },

  // Civilization & Lore
  { id: 'Crown', label: 'Monarchy / Royalty', category: 'Civilization & Lore', icon: Crown },
  { id: 'Castle', label: 'Fortress / Citadel', category: 'Civilization & Lore', icon: Castle },
  { id: 'Landmark', label: 'Sanctuary / Temple', category: 'Civilization & Lore', icon: Landmark },
  { id: 'Building', label: 'Architecture / Hall', category: 'Civilization & Lore', icon: Building },
  { id: 'Building2', label: 'Metropolis / City', category: 'Civilization & Lore', icon: Building2 },
  { id: 'Home', label: 'Hearth / Shire', category: 'Civilization & Lore', icon: Home },
  { id: 'Scroll', label: 'Chronicle / Parchment', category: 'Civilization & Lore', icon: Scroll },
  { id: 'BookOpen', label: 'Tome / Open Grimoire', category: 'Civilization & Lore', icon: BookOpen },
  { id: 'Book', label: 'Codex / Manuscript', category: 'Civilization & Lore', icon: Book },
  { id: 'Library', label: 'Grand Archives', category: 'Civilization & Lore', icon: Library },
  { id: 'Feather', label: 'Author Quill / Scribe', category: 'Civilization & Lore', icon: Feather },
  { id: 'Scale', label: 'Justice / Tribunal', category: 'Civilization & Lore', icon: Scale },
  { id: 'Coins', label: 'Economy / Guild Treasury', category: 'Civilization & Lore', icon: Coins },
  { id: 'Key', label: 'Relic Key / Gateway', category: 'Civilization & Lore', icon: Key },
  { id: 'Hourglass', label: 'Ages / Timeline', category: 'Civilization & Lore', icon: Hourglass },
  { id: 'Clock', label: 'Clockwork / Epoch', category: 'Civilization & Lore', icon: Clock },
  { id: 'Timer', label: 'Countdown / Crucible', category: 'Civilization & Lore', icon: Timer },
  { id: 'Milestone', label: 'Monument / Pillar', category: 'Civilization & Lore', icon: Milestone },
  { id: 'Bell', label: 'Watchtower Bell / Chime', category: 'Civilization & Lore', icon: Bell },
  { id: 'DoorOpen', label: 'Portal / Chamber Entrance', category: 'Civilization & Lore', icon: DoorOpen },
  { id: 'Briefcase', label: 'Syndicate / Merchant', category: 'Civilization & Lore', icon: Briefcase },
  { id: 'Heart', label: 'Heart / Passion', category: 'Civilization & Lore', icon: Heart },
  { id: 'HeartHandshake', label: 'Alliance / Treaty', category: 'Civilization & Lore', icon: HeartHandshake },
  { id: 'Trophy', label: 'Champion / Victory', category: 'Civilization & Lore', icon: Trophy },
  { id: 'Medal', label: 'Honor / Insignia', category: 'Civilization & Lore', icon: Medal },
  { id: 'Award', label: 'Emblem / Order', category: 'Civilization & Lore', icon: Award },
  { id: 'User', label: 'Hero / Protagonist', category: 'Civilization & Lore', icon: User },
  { id: 'Users', label: 'Order / Faction', category: 'Civilization & Lore', icon: Users },
  { id: 'Bird', label: 'Messenger / Falcon', category: 'Civilization & Lore', icon: Bird },
  { id: 'Cat', label: 'Familiar / Stealth', category: 'Civilization & Lore', icon: Cat },
  { id: 'Dog', label: 'Companion / Beast', category: 'Civilization & Lore', icon: Dog },
  { id: 'Bug', label: 'Chitin / Swarm', category: 'Civilization & Lore', icon: Bug }
]

export const GENRE_ICON_MAP: Record<string, LucideIcon> = GENRE_ICONS.reduce((acc, item) => {
  acc[item.id.toLowerCase()] = item.icon
  return acc
}, {} as Record<string, LucideIcon>)

export function getGenreIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Sparkles
  const clean = iconName.trim().toLowerCase()
  return GENRE_ICON_MAP[clean] || Sparkles
}

export function getGenreMeta(
  genreName?: string, 
  genreIconName?: string,
  customGenres?: CustomGenre[]
): GenrePreset {
  // If no genreName provided
  if (!genreName) {
    const defaultIcon = genreIconName ? getGenreIconComponent(genreIconName) : Sparkles
    return { ...GENRE_PRESETS[0], icon: defaultIcon }
  }

  const clean = genreName.trim().toLowerCase()

  // 1. Resolve custom genres first (passed or from global store)
  let customs = customGenres
  if (!customs || customs.length === 0) {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__getOrosCustomGenres === 'function') {
      try {
        customs = (globalThis as any).__getOrosCustomGenres() || []
      } catch {
        customs = []
      }
    }
  }

  if (customs && customs.length > 0) {
    const customMatch = customs.find(
      (c) => c.id.toLowerCase() === clean || c.name.toLowerCase() === clean
    )
    if (customMatch) {
      const resolvedIcon = genreIconName 
        ? getGenreIconComponent(genreIconName) 
        : getGenreIconComponent(customMatch.icon)
      return {
        id: customMatch.id,
        name: customMatch.name,
        icon: resolvedIcon,
        desc: customMatch.desc || 'Custom worldbuilding genre',
        isCustom: true
      }
    }
  }

  // 2. Check built-in preset genres
  const presetMatch = GENRE_PRESETS.find(
    (g) => g.id === clean || g.name.toLowerCase() === clean
  )
  if (presetMatch) {
    if (genreIconName) {
      return { ...presetMatch, icon: getGenreIconComponent(genreIconName) }
    }
    return presetMatch
  }

  // 3. Partial match fallback (e.g. "Grounded Grimdark Fantasy" -> "Grimdark")
  const partial = GENRE_PRESETS.find((g) => clean.includes(g.name.toLowerCase()))
  if (partial) {
    if (genreIconName) {
      return { ...partial, icon: getGenreIconComponent(genreIconName) }
    }
    return partial
  }

  // 4. Default fallback for arbitrary custom string
  const resolvedIcon = genreIconName ? getGenreIconComponent(genreIconName) : Sparkles
  return {
    id: clean,
    name: genreName.charAt(0).toUpperCase() + genreName.slice(1),
    icon: resolvedIcon,
    desc: 'Custom worldbuilding genre',
    isCustom: true
  }
}
