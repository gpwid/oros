import {
  Sparkles,
  Rocket,
  Cpu,
  Skull,
  Ghost,
  Search,
  Clock,
  Crown,
  Landmark,
  Radio,
  Flame,
  Compass,
  Sun,
  Flower2,
  Castle,
  VenetianMask,
  Orbit,
  Moon,
  Shield,
  Zap,
  Heart,
  Building2,
  Trees,
  Dna,
  Layers,
  Anchor,
  BookOpen,
  Eye,
  LucideIcon
} from 'lucide-react'

export interface GenrePreset {
  id: string
  name: string
  icon: LucideIcon
  desc: string
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

export function getGenreMeta(genreName?: string): GenrePreset {
  if (!genreName) return GENRE_PRESETS[0]
  const clean = genreName.trim().toLowerCase()
  const match = GENRE_PRESETS.find(
    (g) => g.id === clean || g.name.toLowerCase() === clean
  )
  if (match) return match

  // Partial match fallback (e.g. "Grounded Grimdark Fantasy" -> "Grimdark")
  const partial = GENRE_PRESETS.find((g) => clean.includes(g.name.toLowerCase()))
  if (partial) return partial

  return {
    id: clean,
    name: genreName.charAt(0).toUpperCase() + genreName.slice(1),
    icon: Sparkles,
    desc: 'Custom worldbuilding genre'
  }
}
