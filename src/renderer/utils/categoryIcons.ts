import React from 'react'
import { EntityCategory } from '@shared/types'
import {
  User,
  MapPin,
  Shield,
  Sparkles,
  Sword,
  Flame,
  Zap,
  Crown,
  Scroll,
  Dna,
  Compass,
  Gem,
  BookOpen,
  Heart,
  Skull,
  Globe,
  Layers,
  Star,
  Feather,
  Flag,
  Key,
  Eye,
  Hourglass,
  Crosshair,
  Activity,
  LucideIcon
} from 'lucide-react'

export const DEFAULT_PRESET_CATEGORIES: EntityCategory[] = [
  {
    id: 'character',
    name: 'Characters',
    icon: 'User',
    color: '#eab308', // Gold
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
    color: '#3b82f6', // Blue
    isPreset: true,
    description: 'Organizations, corporations, factions, and groups'
  },
  {
    id: 'item',
    name: 'Items & Artifacts',
    icon: 'Sparkles',
    color: '#a855f7', // Purple
    isPreset: true,
    description: 'Equipment, technology, relics, and objects'
  },
  {
    id: 'event',
    name: 'Events',
    icon: 'Flame',
    color: '#f43f5e', // Rose
    isPreset: true,
    description: 'Battles, discoveries, meetings, and key occurrences'
  },
  {
    id: 'magic_system',
    name: 'Systems & Rules',
    icon: 'Zap',
    color: '#06b6d4', // Cyan
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
  { id: 'User', label: 'Person / Persona', icon: User },
  { id: 'MapPin', label: 'Map Pin / Landmark', icon: MapPin },
  { id: 'Compass', label: 'Compass / Realm', icon: Compass },
  { id: 'Shield', label: 'Shield / Faction', icon: Shield },
  { id: 'Sword', label: 'Sword / Weapon', icon: Sword },
  { id: 'Sparkles', label: 'Sparkles / Magic', icon: Sparkles },
  { id: 'Gem', label: 'Gem / Relic', icon: Gem },
  { id: 'Crown', label: 'Crown / Royalty', icon: Crown },
  { id: 'Flame', label: 'Flame / Event', icon: Flame },
  { id: 'Zap', label: 'Lightning / Arcana', icon: Zap },
  { id: 'Scroll', label: 'Scroll / Chronicle', icon: Scroll },
  { id: 'BookOpen', label: 'Book / Tome', icon: BookOpen },
  { id: 'Dna', label: 'DNA / Bloodline', icon: Dna },
  { id: 'Heart', label: 'Heart / Bond', icon: Heart },
  { id: 'Skull', label: 'Skull / Undead', icon: Skull },
  { id: 'Globe', label: 'Globe / Cosmos', icon: Globe },
  { id: 'Layers', label: 'Layers / Concept', icon: Layers },
  { id: 'Star', label: 'Star / Celestial', icon: Star },
  { id: 'Feather', label: 'Feather / Quill', icon: Feather },
  { id: 'Flag', label: 'Flag / Banner', icon: Flag },
  { id: 'Key', label: 'Key / Secret', icon: Key },
  { id: 'Eye', label: 'Eye / Mystery', icon: Eye },
  { id: 'Hourglass', label: 'Hourglass / Era', icon: Hourglass },
  { id: 'Crosshair', label: 'Crosshair / Objective', icon: Crosshair },
  { id: 'Activity', label: 'Activity / Status', icon: Activity }
]

export const CATEGORY_COLOR_PALETTES = [
  { name: 'Gold', hex: '#eab308', bgClass: 'bg-yellow-500/15', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30' },
  { name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
  { name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
  { name: 'Teal', hex: '#14b8a6', bgClass: 'bg-teal-500/15', textClass: 'text-teal-400', borderClass: 'border-teal-500/30' },
  { name: 'Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500/15', textClass: 'text-cyan-400', borderClass: 'border-cyan-500/30' },
  { name: 'Blue', hex: '#3b82f6', bgClass: 'bg-blue-500/15', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
  { name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500/15', textClass: 'text-indigo-400', borderClass: 'border-indigo-500/30' },
  { name: 'Purple', hex: '#a855f7', bgClass: 'bg-purple-500/15', textClass: 'text-purple-400', borderClass: 'border-purple-500/30' },
  { name: 'Pink', hex: '#ec4899', bgClass: 'bg-pink-500/15', textClass: 'text-pink-400', borderClass: 'border-pink-500/30' },
  { name: 'Rose', hex: '#f43f5e', bgClass: 'bg-rose-500/15', textClass: 'text-rose-400', borderClass: 'border-rose-500/30' },
  { name: 'Lime', hex: '#84cc16', bgClass: 'bg-lime-500/15', textClass: 'text-lime-400', borderClass: 'border-lime-500/30' },
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
  const all = [...DEFAULT_PRESET_CATEGORIES, ...customCategories]
  const exact = all.find((c) => c.id.toLowerCase() === typeOrId.toLowerCase())
  if (exact) return exact

  // Match by name
  const nameMatch = all.find((c) => c.name.toLowerCase() === typeOrId.toLowerCase())
  if (nameMatch) return nameMatch

  // Fallback for custom or legacy ids
  return {
    id: typeOrId,
    name: typeOrId.charAt(0).toUpperCase() + typeOrId.slice(1).replace(/_/g, ' '),
    icon: 'Layers',
    color: '#eab308',
    isPreset: false,
    description: 'Custom category'
  }
}
