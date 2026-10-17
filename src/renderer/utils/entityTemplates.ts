import { EntityType, InfoboxSection } from '@shared/types'

export interface EntityArchetypeTemplate {
  id: string;
  name: string;
  entityType: EntityType;
  icon: string;
  description: string;
  defaultSubtitle: string;
  sections: InfoboxSection[];
  content: string;
}

export const ENTITY_TEMPLATES: EntityArchetypeTemplate[] = [
  {
    id: 'character',
    name: 'Character / Figure',
    entityType: 'character',
    icon: 'User',
    description: 'Protagonists, rulers, villains, mentors, and historical deities.',
    defaultSubtitle: 'CHARACTER · DRAMATIS PERSONAE',
    sections: [
      {
        title: 'Identity',
        fields: [
          { id: 'f-char-1', label: 'Status', value: 'Living / Active', type: 'text' },
          { id: 'f-char-2', label: 'Aliases', value: 'The Whispering Blade', type: 'text' },
          { id: 'f-char-3', label: 'Species / Lineage', value: 'Human', type: 'text' },
          { id: 'f-char-4', label: 'Age', value: '32', type: 'text' },
          { id: 'f-char-5', label: 'Moral Alignment', value: 'Neutral Pragmatic', type: 'text' }
        ]
      },
      {
        title: 'Affiliations',
        fields: [
          { id: 'f-char-6', label: 'Primary Allegiance', value: 'Order of the Veiled Sun', type: 'text' },
          { id: 'f-char-7', label: 'Rank / Title', value: 'Knight-Commander', type: 'text' },
          { id: 'f-char-8', label: 'Homeland', value: 'Aethelgard', type: 'text' }
        ]
      },
      {
        title: 'Combat & Capabilities',
        fields: [
          { id: 'f-char-9', label: 'Archetype / Class', value: 'Duelist / Spellsword', type: 'text' },
          { id: 'f-char-10', label: 'Signature Relic', value: 'Moonlit Rapier', type: 'text' }
        ]
      }
    ],
    content: `<h2>Overview</h2><p>Brief narrative summary capturing the character's presence, role in the story, and why they matter to the world.</p><h2>Appearance & Demeanor</h2><p>Physical stature, facial features, attire, visible scars, tone of voice, and body language.</p><h2>Personality & Flaws</h2><p>Guiding philosophy, moral code, deep-seated flaws, and secret ambitions.</p><h2>History & Background</h2><p>Formative childhood events, turning points, oaths sworn, and deeds that cemented their renown.</p><h2>Inventory & Relics</h2><p>Notable armaments, enchanted jewelry, scrolls, or steeds in their possession.</p>`
  },
  {
    id: 'location',
    name: 'Settlement / Realm',
    entityType: 'location',
    icon: 'MapPin',
    description: 'Cities, fortresses, provinces, natural landmarks, and ancient ruins.',
    defaultSubtitle: 'LOCATION · REALM',
    sections: [
      {
        title: 'Demographics',
        fields: [
          { id: 'f-loc-1', label: 'Settlement Type', value: 'Walled Metropolis', type: 'text' },
          { id: 'f-loc-2', label: 'Population', value: '~140,000 souls', type: 'text' },
          { id: 'f-loc-3', label: 'Demographics', value: '60% Human, 30% Elven, 10% Other', type: 'text' },
          { id: 'f-loc-4', label: 'Ruler / Governor', value: 'Grand Duke Vane', type: 'text' },
          { id: 'f-loc-5', label: 'Government', value: 'Feudal Oligarchy', type: 'text' }
        ]
      },
      {
        title: 'Geography & Economy',
        fields: [
          { id: 'f-loc-6', label: 'Biome / Climate', value: 'Temperate Coastal', type: 'text' },
          { id: 'f-loc-7', label: 'Major Exports', value: 'Black Glass, Spices, Shipbuilding', type: 'text' },
          { id: 'f-loc-8', label: 'Strategic Importance', value: 'Controls the Western Strait', type: 'text' }
        ]
      }
    ],
    content: `<h2>Overview</h2><p>Atmospheric introduction to the settlement or realm, its reputation, and first impressions upon approaching.</p><h2>Geography & Layout</h2><p>Architecture, notable districts, natural fortifications, and street life.</p><h2>Culture & Society</h2><p>Daily customs, religious holidays, cuisine, and social stratification.</p><h2>Defenses & Military</h2><p>City guard strength, ramparts, naval dockyards, and historical sieges withstood.</p><h2>Notable Districts & Landmarks</h2><p>Famous taverns, grand plazas, undercrofts, and royal palaces.</p>`
  },
  {
    id: 'faction',
    name: 'Faction / Guild',
    entityType: 'faction',
    icon: 'Shield',
    description: 'Military orders, criminal syndicates, merchant cartels, and noble houses.',
    defaultSubtitle: 'FACTION · ORDER',
    sections: [
      {
        title: 'Organization',
        fields: [
          { id: 'f-fac-1', label: 'Headquarters', value: 'The Sunken Spire', type: 'text' },
          { id: 'f-fac-2', label: 'High Leader', value: 'Archon Malakor', type: 'text' },
          { id: 'f-fac-3', label: 'Motto / Creed', value: 'In Shadows, Truth', type: 'text' },
          { id: 'f-fac-4', label: 'Sphere of Influence', value: 'High Seas & Port Cities', type: 'text' }
        ]
      },
      {
        title: 'Diplomacy & Stance',
        fields: [
          { id: 'f-fac-5', label: 'Primary Rivals', value: 'The Iron Accord', type: 'text' },
          { id: 'f-fac-6', label: 'Key Allies', value: 'Crown of Aethelgard', type: 'text' },
          { id: 'f-fac-7', label: 'Public Standing', value: 'Feared & Respected', type: 'text' }
        ]
      }
    ],
    content: `<h2>Overview & Doctrine</h2><p>The driving objective, ethos, and public facade of the faction.</p><h2>Hierarchy & Ranks</h2><p>Command structure, titles from novice to grandmaster, and rites of passage.</p><h2>Assets & Sphere of Power</h2><p>Treasury, private militias, trade monopolies, or information networks.</p><h2>Oaths & Punishments</h2><p>Inviolable laws, blood oaths, and consequences for treason or failure.</p>`
  },
  {
    id: 'magic_system',
    name: 'Magic System / Spell',
    entityType: 'magic_system',
    icon: 'Sparkles',
    description: 'Arcane principles, casting arts, mystic schools, and supernatural rules.',
    defaultSubtitle: 'ARCANA · DISCIPLINE',
    sections: [
      {
        title: 'The Arcane',
        fields: [
          { id: 'f-mag-1', label: 'Source of Power', value: 'Celestial Leylines', type: 'text' },
          { id: 'f-mag-2', label: 'Casting Medium', value: 'Runic Silver & Chant', type: 'text' },
          { id: 'f-mag-3', label: 'Casting Cost / Toll', value: 'Physical Exhaustion & Blood Heat', type: 'text' },
          { id: 'f-mag-4', label: 'Practitioner Rarity', value: '1 in 5,000 Born Attuned', type: 'text' }
        ]
      },
      {
        title: 'Regulations & Taboos',
        fields: [
          { id: 'f-mag-5', label: 'Governing Body', value: 'The High Magisterium', type: 'text' },
          { id: 'f-mag-6', label: 'Forbidden Schools', value: 'Bloodweaving, Soul Tethering', type: 'text' }
        ]
      }
    ],
    content: `<h2>Core Fundamentals</h2><p>The natural or metaphysical rules that govern this arcane practice.</p><h2>Tiers & Manifestations</h2><p>Levels of mastery, typical cantrips, and catastrophic apex workings.</p><h2>Limitations & The Cost</h2><p>Hard limits of the system (what magic can never do) and the bodily or spiritual toll on the caster.</p><h2>Historical Cataclysms</h2><p>Mishaps or wars that shaped modern perception and regulation of the art.</p>`
  },
  {
    id: 'item',
    name: 'Item / Relic',
    entityType: 'item',
    icon: 'Gem',
    description: 'Enchanted blades, lost artifacts, alchemical elixirs, and ancient machinery.',
    defaultSubtitle: 'RELIC · ARTIFACT',
    sections: [
      {
        title: 'Artifact Specs',
        fields: [
          { id: 'f-itm-1', label: 'Item Rarity', value: 'Legendary Relic', type: 'text' },
          { id: 'f-itm-2', label: 'Crafting Material', value: 'Star-forged Adamantine', type: 'text' },
          { id: 'f-itm-3', label: 'Attunement', value: 'Requires Royal Bloodline', type: 'text' },
          { id: 'f-itm-4', label: 'Creator', value: 'Forged in the First Age', type: 'text' }
        ]
      },
      {
        title: 'Status & Custody',
        fields: [
          { id: 'f-itm-5', label: 'Current Bearer', value: 'Lord Commander Alden', type: 'text' },
          { id: 'f-itm-6', label: 'Last Known Location', value: 'High Citadel Vault', type: 'text' },
          { id: 'f-itm-7', label: 'Danger Level', value: 'Severe (Corrosive Will)', type: 'text' }
        ]
      }
    ],
    content: `<h2>Description & Craftsmanship</h2><p>Physical appearance, weight, markings, magical luminescence, and tactile sensations.</p><h2>Properties & Abilities</h2><p>Passive boons granted to the wielder and active powers invoked under stress.</p><h2>Origin & Legend</h2><p>Why it was crafted, who held it in battles of old, and how it came to the current era.</p><h2>The Curse or Drawback</h2><p>The price extracted by the artifact: madness, shortened lifespan, or attracting foes.</p>`
  },
  {
    id: 'document',
    name: 'Blank Article',
    entityType: 'document',
    icon: 'FileText',
    description: 'Clean unstructured lore sheet for custom writing and notes.',
    defaultSubtitle: 'LORE DOCUMENT',
    sections: [
      {
        title: 'Overview',
        fields: [
          { id: 'f-doc-1', label: 'Status', value: 'Active', type: 'text' },
          { id: 'f-doc-2', label: 'Origin', value: 'World Records', type: 'text' }
        ]
      }
    ],
    content: `<p>Start chronicling world lore here...</p>`
  }
];

export function getTemplateById(templateId: string): EntityArchetypeTemplate {
  return ENTITY_TEMPLATES.find(t => t.id === templateId) || ENTITY_TEMPLATES[0];
}

export function getTemplateForType(type: string): EntityArchetypeTemplate {
  return ENTITY_TEMPLATES.find(t => t.entityType === type) || ENTITY_TEMPLATES[ENTITY_TEMPLATES.length - 1];
}
