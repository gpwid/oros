import { create } from 'zustand'
import { TTRPGCampaign, Dnd5eCharacter, Dnd5eAbilityScores, TTRPGSystem, TTRPGBattlemap, TTRPGToken, TTRPGBattlemapEffect } from '@shared/types'

export interface DiceRollResult {
  id: string
  label: string
  characterName?: string
  diceNotation: string
  individualRolls: number[]
  modifier: number
  total: number
  isCritSuccess?: boolean
  isCritFail?: boolean
  timestamp: string
}

export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2)
}

export const formatModifier = (mod: number): string => {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export const getProficiencyBonus = (level: number): number => {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2
}

export const DND_STANDARD_SKILLS: { name: string; ability: keyof Dnd5eAbilityScores }[] = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' }
]

const SAMPLE_CAMPAIGN_ID = 'campaign-ostergard-tide'

export const sampleCampaigns: TTRPGCampaign[] = [
  {
    id: SAMPLE_CAMPAIGN_ID,
    title: 'Shadows Over Ostergard: The Bitter Tide',
    system: 'dnd5e',
    tagline: 'A grim 5e gothic coastal campaign of succession, blood tithes, and drowned gods.',
    description: 'Set along the treacherous fjord cliffs and frozen marshes of Ostergard. The Duke of Ostergard has been murdered under a blood moon, and ancient Skaelish raiders stir from the mist with iron and bone.',
    linkedWorldId: 'world-aethelgard',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    sessionNotes: 'Session 0 completed. The party has convened at the Salt-Cairn Tavern in the lower haven of Valen-Geld. Suspicion falls upon the High Justiciar and the drowned cult of the Sunken Spire.',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T18:00:00.000Z'
  }
]

export const sampleCharacters: Record<string, Dnd5eCharacter[]> = {
  [SAMPLE_CAMPAIGN_ID]: [
    {
      id: 'char-vaelen',
      campaignId: SAMPLE_CAMPAIGN_ID,
      name: 'Vaelen the Northguard',
      playerName: 'Player 1',
      avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      race: 'Human (Variant)',
      characterClass: 'Fighter',
      subclass: 'Battle Master',
      background: 'Soldier (Ostergard Hearth-Guard)',
      alignment: 'Lawful Neutral',
      level: 5,
      experiencePoints: 6500,
      inspiration: true,
      armorClass: 18,
      initiativeBonus: 2,
      speed: 30,
      hpMax: 44,
      hpCurrent: 44,
      hpTemp: 0,
      hitDice: '5d10',
      hitDiceRemaining: 5,
      deathSaves: { successes: 0, failures: 0 },
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      savingThrowProficiencies: ['strength', 'constitution'],
      skills: {
        'Athletics': 'proficient',
        'Intimidation': 'proficient',
        'Perception': 'proficient',
        'Survival': 'proficient',
        'History': 'none'
      },
      attacks: [
        {
          id: 'atk-1',
          name: 'Greatsword of the Boreal Warden',
          bonus: 7,
          damage: '2d6 + 4',
          damageType: 'Slashing',
          range: '5 ft',
          notes: 'Great Weapon Fighting. On hit, can expend Superiority Die for Trip Attack (+1d8 dmg, STR DC 15 or prone).'
        },
        {
          id: 'atk-2',
          name: 'Heavy Ironwood Crossbow',
          bonus: 5,
          damage: '1d10 + 2',
          damageType: 'Piercing',
          range: '100/400 ft',
          notes: 'Heavy, two-handed, loading. 20 steel bolts in quiver.'
        }
      ],
      currency: { cp: 45, sp: 80, ep: 0, gp: 125, pp: 2 },
      equipment: [
        'Plate Armor (AC 18)',
        'Greatsword of the Boreal Warden',
        'Heavy Ironwood Crossbow & Quiver (20 bolts)',
        'Dungeoneer Pack',
        'Ostergard Ducal Insignia Ring',
        'Whetstone & Flask of Sea-Spirits'
      ],
      personalityTraits: 'Disciplined, quiet in council, observant of honor and oath-stones.',
      ideals: 'Responsibility. I protect those sworn to my shield wall at any price.',
      bonds: 'The Ostergard ducal family saved my clan from the salt-starvation; I owe them my life.',
      flaws: 'I hold deep suspicion toward magic practitioners and arcane tricksters.',
      featuresAndTraits: 'Action Surge (1/short rest), Second Wind (1d10+5, 1/short rest), Combat Superiority (4d8 superiority dice: Menacing Attack, Precision Attack, Trip Attack), Great Weapon Master feat.',
      backstory: 'A veteran of the Bitter Coast skirmishes, Vaelen survived the siege of Horn-Keep when the ice cracked beneath the enemy barges.',
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T18:00:00.000Z'
    },
    {
      id: 'char-lyra',
      campaignId: SAMPLE_CAMPAIGN_ID,
      name: 'Lyra Thorne',
      playerName: 'Player 2',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      race: 'Half-Elf',
      characterClass: 'Rogue',
      subclass: 'Arcane Trickster',
      background: 'Charlatan / Harbor Smuggler',
      alignment: 'Chaotic Good',
      level: 5,
      experiencePoints: 6500,
      inspiration: false,
      armorClass: 16,
      initiativeBonus: 4,
      speed: 30,
      hpMax: 33,
      hpCurrent: 31,
      hpTemp: 0,
      hitDice: '5d8',
      hitDiceRemaining: 4,
      deathSaves: { successes: 0, failures: 0 },
      abilities: {
        strength: 10,
        dexterity: 18,
        constitution: 14,
        intelligence: 16,
        wisdom: 12,
        charisma: 14
      },
      savingThrowProficiencies: ['dexterity', 'intelligence'],
      skills: {
        'Stealth': 'expertise',
        'Sleight of Hand': 'expertise',
        'Deception': 'proficient',
        'Acrobatics': 'proficient',
        'Perception': 'proficient',
        'Investigation': 'proficient'
      },
      attacks: [
        {
          id: 'atk-3',
          name: 'Mist-Piercer Rapier',
          bonus: 7,
          damage: '1d8 + 4',
          damageType: 'Piercing',
          range: '5 ft',
          notes: 'Finesse. Sneak Attack: +3d6 damage once per turn if advantage or ally within 5ft.'
        },
        {
          id: 'atk-4',
          name: 'Black Ice Dagger',
          bonus: 7,
          damage: '1d4 + 4',
          damageType: 'Piercing',
          range: '20/60 ft',
          notes: 'Finesse, light, thrown.'
        }
      ],
      spellcasting: {
        ability: 'intelligence',
        slots: {
          1: { max: 3, used: 1 },
          2: { max: 0, used: 0 }
        },
        spells: [
          {
            id: 'sp-1',
            name: 'Mage Hand Legerdemain',
            level: 0,
            school: 'Conjuration',
            castingTime: '1 Action',
            range: '30 ft',
            components: 'V, S',
            duration: '1 minute',
            concentration: false,
            description: 'Invisible spectral hand. Can stow or retrieve items from containers worn by others or pick locks at distance.'
          },
          {
            id: 'sp-2',
            name: 'Booming Blade',
            level: 0,
            school: 'Evocation',
            castingTime: '1 Action',
            range: 'Self (5-ft radius)',
            components: 'S, M (melee weapon)',
            duration: '1 round',
            concentration: false,
            description: 'Make melee attack. Deals normal damage + 1d8 thunder. If target willingly moves before start of next turn, takes 2d8 thunder.'
          },
          {
            id: 'sp-3',
            name: 'Disguise Self',
            level: 1,
            school: 'Illusion',
            castingTime: '1 Action',
            range: 'Self',
            components: 'V, S',
            duration: '1 hour',
            concentration: false,
            prepared: true,
            description: 'Make yourself look different: change clothing, armor, height by 1 foot, facial features.'
          },
          {
            id: 'sp-4',
            name: 'Shield',
            level: 1,
            school: 'Abjuration',
            castingTime: '1 Reaction',
            range: 'Self',
            components: 'V, S',
            duration: '1 round',
            concentration: false,
            prepared: true,
            description: '+5 bonus to AC until start of next turn, including against triggering attack. Immune to magic missile.'
          }
        ]
      },
      currency: { cp: 12, sp: 34, ep: 0, gp: 240, pp: 5 },
      equipment: [
        'Studded Leather Armor',
        'Mist-Piercer Rapier',
        '2x Throwing Daggers',
        'Thieves Tools (Masterwork set)',
        'Burglar Pack',
        'Set of False Identification Papers'
      ],
      personalityTraits: 'Incurably curious, never leaves a room without noting all exits and loose coin purses.',
      ideals: 'Freedom. Chains of feudal duty were forged to be picked.',
      bonds: 'Owes a blood-debt to the guildmaster of the Black Gull in Valen-Geld.',
      flaws: 'Cannot resist an ornate locked chest even when common sense screams trap.',
      featuresAndTraits: 'Sneak Attack (3d6), Cunning Action (Dash, Disengage, Hide as bonus action), Uncanny Dodge (halve damage on reaction), Mage Hand Legerdemain.',
      backstory: 'Raised in the bilge-gut alleyways of the Bitter Coast port, Lyra learned early that magic and lockpicks make fine bedfellows.',
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T18:00:00.000Z'
    }
  ]
}

export const sampleBattlemaps: Record<string, TTRPGBattlemap[]> = {
  [SAMPLE_CAMPAIGN_ID]: [
    {
      id: 'bmap-salt-quay',
      campaignId: SAMPLE_CAMPAIGN_ID,
      name: 'The Sunken Quay & Salt-Cairn Tavern',
      description: 'Frost-locked maritime wharf with stone warehouses, narrow wooden walkways, and icy seawater.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      gridType: 'square',
      gridSize: 64,
      gridOpacity: 0.35,
      gridUnitFeet: 5,
      showCoordinates: true,
      snapToGrid: true,
      tokens: [
        {
          id: 'token-vaelen',
          campaignId: SAMPLE_CAMPAIGN_ID,
          battlemapId: 'bmap-salt-quay',
          name: 'Vaelen the Northguard',
          avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
          x: 28,
          y: 44,
          size: 1,
          color: '#38bdf8',
          hpCurrent: 44,
          hpMax: 44,
          armorClass: 18,
          speed: 30,
          characterId: 'char-vaelen',
          conditions: [],
          isEnemy: false
        },
        {
          id: 'token-lyra',
          campaignId: SAMPLE_CAMPAIGN_ID,
          battlemapId: 'bmap-salt-quay',
          name: 'Lyra Thorne',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          x: 35,
          y: 48,
          size: 1,
          color: '#06b6d4',
          hpCurrent: 33,
          hpMax: 33,
          armorClass: 16,
          speed: 30,
          characterId: 'char-lyra',
          conditions: [],
          isEnemy: false
        },
        {
          id: 'token-reaver',
          campaignId: SAMPLE_CAMPAIGN_ID,
          battlemapId: 'bmap-salt-quay',
          name: 'Skaelish Reaver',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          x: 56,
          y: 38,
          size: 1,
          color: '#ef4444',
          hpCurrent: 22,
          hpMax: 22,
          armorClass: 13,
          speed: 30,
          conditions: [],
          isEnemy: true
        },
        {
          id: 'token-direhound',
          campaignId: SAMPLE_CAMPAIGN_ID,
          battlemapId: 'bmap-salt-quay',
          name: 'Boreal Direhound',
          avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
          x: 62,
          y: 46,
          size: 1,
          color: '#f97316',
          hpCurrent: 16,
          hpMax: 16,
          armorClass: 12,
          speed: 40,
          conditions: ['Prone'],
          isEnemy: true
        }
      ],
      effects: [],
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T18:00:00.000Z'
    }
  ]
}

interface TtrpgState {
  campaigns: TTRPGCampaign[]
  characters: Record<string, Dnd5eCharacter[]>
  battlemaps: Record<string, TTRPGBattlemap[]>
  activeCampaignId: string | null
  activeCharacterId: string | null
  activeBattlemapId: string | null
  diceHistory: DiceRollResult[]
  isDiceTrayOpen: boolean

  // Actions
  hasHydrated: boolean
  hydrateFromVault: (parsed: any) => void
  initTtrpg: () => Promise<void>
  persistTtrpg: () => Promise<void>
  setActiveCampaignId: (campaignId: string | null) => void
  setActiveCharacterId: (characterId: string | null) => void
  setActiveBattlemapId: (battlemapId: string | null) => void
  toggleDiceTray: () => void
  setDiceTrayOpen: (open: boolean) => void

  // Campaign CRUD
  createCampaign: (title: string, system?: TTRPGSystem, tagline?: string, description?: string, linkedWorldId?: string) => TTRPGCampaign
  updateCampaign: (campaignId: string, updates: Partial<TTRPGCampaign>) => void
  deleteCampaign: (campaignId: string) => void

  // Character CRUD
  createCharacter: (campaignId: string, charData: Partial<Dnd5eCharacter>) => Dnd5eCharacter
  updateCharacter: (campaignId: string, characterId: string, updates: Partial<Dnd5eCharacter>) => void
  deleteCharacter: (campaignId: string, characterId: string) => void

  // Battlemap CRUD & Grid
  createBattlemap: (campaignId: string, name: string, imageUrl: string, options?: Partial<TTRPGBattlemap>) => TTRPGBattlemap
  updateBattlemap: (campaignId: string, battlemapId: string, updates: Partial<TTRPGBattlemap>) => void
  deleteBattlemap: (campaignId: string, battlemapId: string) => void

  // Token CRUD
  addTokenToBattlemap: (campaignId: string, battlemapId: string, token: Omit<TTRPGToken, 'id'>) => TTRPGToken
  updateTokenOnBattlemap: (campaignId: string, battlemapId: string, tokenId: string, updates: Partial<TTRPGToken>) => void
  removeTokenFromBattlemap: (campaignId: string, battlemapId: string, tokenId: string) => void

  // Battlemap Effects CRUD
  addEffectToBattlemap: (campaignId: string, battlemapId: string, effect: Omit<TTRPGBattlemapEffect, 'id'>) => TTRPGBattlemapEffect
  updateEffectOnBattlemap: (campaignId: string, battlemapId: string, effectId: string, updates: Partial<TTRPGBattlemapEffect>) => void
  removeEffectFromBattlemap: (campaignId: string, battlemapId: string, effectId: string) => void
  clearAllEffectsOnBattlemap: (campaignId: string, battlemapId: string) => void

  // Rolls
  executeRoll: (label: string, diceNotation: string, modifier?: number, characterName?: string) => DiceRollResult
  clearRollHistory: () => void
}

let saveDebounceTimer: any = null

export const useTtrpgStore = create<TtrpgState>((set, get) => ({
  campaigns: [],
  characters: {},
  battlemaps: {},
  activeCampaignId: null,
  activeCharacterId: null,
  activeBattlemapId: null,
  diceHistory: [],
  isDiceTrayOpen: false,
  hasHydrated: false,

  hydrateFromVault: (parsed: any) => {
    if (!parsed) {
      set({ hasHydrated: true })
      return
    }
    const userCampaigns = Array.isArray(parsed.ttrpgCampaigns)
      ? parsed.ttrpgCampaigns.filter((c: TTRPGCampaign) => c.id !== SAMPLE_CAMPAIGN_ID)
      : []

    if (userCampaigns.length > 0) {
      const rawBattlemaps = parsed.ttrpgBattlemaps || {}
      const sanitizedBattlemaps: Record<string, TTRPGBattlemap[]> = {}
      for (const [cId, bmaps] of Object.entries(rawBattlemaps as Record<string, TTRPGBattlemap[]>)) {
        if (cId === SAMPLE_CAMPAIGN_ID) continue
        sanitizedBattlemaps[cId] = (bmaps || []).map((bm) => ({
          ...bm,
          effects: (bm.effects || []).filter((eff) => !eff.id?.startsWith('fx-sample-'))
        }))
      }

      const rawCharacters = { ...(parsed.ttrpgCharacters || {}) }
      delete rawCharacters[SAMPLE_CAMPAIGN_ID]

      set({
        campaigns: userCampaigns,
        characters: rawCharacters,
        battlemaps: sanitizedBattlemaps,
        activeCampaignId: null,
        activeBattlemapId: sanitizedBattlemaps[userCampaigns[0]?.id]?.[0]?.id || null,
        hasHydrated: true
      })
    } else {
      set({
        campaigns: [],
        characters: {},
        battlemaps: {},
        activeCampaignId: null,
        activeBattlemapId: null,
        hasHydrated: true
      })
    }
  },

  initTtrpg: async () => {
    if (get().hasHydrated) return
    try {
      let raw: string | null = null
      if (typeof window !== 'undefined' && window.oros) {
        raw = await window.oros.loadVault()
      }
      if (!raw && typeof window !== 'undefined') {
        raw = localStorage.getItem('oros_vault')
      }

      if (raw) {
        const parsed = JSON.parse(raw)
        get().hydrateFromVault(parsed)
        return
      }
      set({ hasHydrated: true })
    } catch (e) {
      console.warn('Could not load saved TTRPG data, using defaults', e)
      set({ hasHydrated: true })
    }
  },

  persistTtrpg: async () => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__orosPersistVault === 'function') {
      await (globalThis as any).__orosPersistVault()
      return
    }
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
    saveDebounceTimer = setTimeout(async () => {
      try {
        if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__orosPersistVault === 'function') {
          await (globalThis as any).__orosPersistVault()
        }
      } catch (err) {
        console.error('Failed to persist TTRPG data', err)
      }
    }, 400)
  },

  setActiveCampaignId: (campaignId) => {
    set({ activeCampaignId: campaignId, activeCharacterId: null })
  },

  setActiveCharacterId: (characterId) => {
    set({ activeCharacterId: characterId })
  },

  setActiveBattlemapId: (battlemapId) => {
    set({ activeBattlemapId: battlemapId })
  },

  toggleDiceTray: () => {
    set((state) => ({ isDiceTrayOpen: !state.isDiceTrayOpen }))
  },

  setDiceTrayOpen: (open) => {
    set({ isDiceTrayOpen: open })
  },

  createCampaign: (title, system = 'dnd5e', tagline = '', description = '', linkedWorldId) => {
    const newCamp: TTRPGCampaign = {
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      system,
      tagline,
      description,
      linkedWorldId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    set((state) => ({
      campaigns: [newCamp, ...state.campaigns],
      activeCampaignId: newCamp.id,
      characters: {
        ...state.characters,
        [newCamp.id]: []
      }
    }))

    get().persistTtrpg()
    return newCamp
  },

  updateCampaign: (campaignId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    }))
    get().persistTtrpg()
  },

  deleteCampaign: (campaignId) => {
    set((state) => {
      const remaining = state.campaigns.filter((c) => c.id !== campaignId)
      const newChars = { ...state.characters }
      delete newChars[campaignId]
      return {
        campaigns: remaining,
        characters: newChars,
        activeCampaignId: remaining[0]?.id || null,
        activeCharacterId: null
      }
    })
    get().persistTtrpg()
  },

  createCharacter: (campaignId, charData) => {
    const level = charData.level || 1
    const newChar: Dnd5eCharacter = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      campaignId,
      name: charData.name || 'New Adventurer',
      playerName: charData.playerName || '',
      race: charData.race || 'Human',
      characterClass: charData.characterClass || 'Fighter',
      subclass: charData.subclass || '',
      background: charData.background || '',
      alignment: charData.alignment || 'True Neutral',
      level,
      experiencePoints: charData.experiencePoints || 0,
      inspiration: false,
      armorClass: charData.armorClass || 10,
      speed: charData.speed || 30,
      hpMax: charData.hpMax || 10,
      hpCurrent: charData.hpCurrent || (charData.hpMax || 10),
      hpTemp: 0,
      hitDice: charData.hitDice || `${level}d8`,
      hitDiceRemaining: level,
      deathSaves: { successes: 0, failures: 0 },
      abilities: charData.abilities || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      savingThrowProficiencies: charData.savingThrowProficiencies || [],
      skills: charData.skills || {},
      attacks: charData.attacks || [
        {
          id: 'atk-def-1',
          name: 'Standard Melee',
          bonus: 2,
          damage: '1d6',
          damageType: 'Bludgeoning',
          range: '5 ft'
        }
      ],
      currency: charData.currency || { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
      equipment: charData.equipment || ['Standard Explorer Pack'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    set((state) => ({
      characters: {
        ...state.characters,
        [campaignId]: [...(state.characters[campaignId] || []), newChar]
      },
      activeCharacterId: newChar.id
    }))

    get().persistTtrpg()
    return newChar
  },

  updateCharacter: (campaignId, characterId, updates) => {
    set((state) => {
      const campChars = state.characters[campaignId] || []
      return {
        characters: {
          ...state.characters,
          [campaignId]: campChars.map((ch) =>
            ch.id === characterId ? { ...ch, ...updates, updatedAt: new Date().toISOString() } : ch
          )
        }
      }
    })
    get().persistTtrpg()
  },

  deleteCharacter: (campaignId, characterId) => {
    set((state) => {
      const campChars = state.characters[campaignId] || []
      return {
        characters: {
          ...state.characters,
          [campaignId]: campChars.filter((ch) => ch.id !== characterId)
        },
        activeCharacterId: state.activeCharacterId === characterId ? null : state.activeCharacterId
      }
    })
    get().persistTtrpg()
  },

  createBattlemap: (campaignId, name, imageUrl, options = {}) => {
    const newMap: TTRPGBattlemap = {
      id: `bmap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      campaignId,
      name,
      imageUrl,
      description: options.description || '',
      gridType: options.gridType || 'square',
      gridSize: options.gridSize ?? 64,
      gridOpacity: options.gridOpacity ?? 0.35,
      gridUnitFeet: options.gridUnitFeet ?? 5,
      showCoordinates: options.showCoordinates ?? true,
      snapToGrid: options.snapToGrid ?? true,
      tokens: options.tokens || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    set((state) => ({
      battlemaps: {
        ...state.battlemaps,
        [campaignId]: [...(state.battlemaps[campaignId] || []), newMap]
      },
      activeBattlemapId: newMap.id
    }))

    get().persistTtrpg()
    return newMap
  },

  updateBattlemap: (campaignId, battlemapId, updates) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId ? { ...bm, ...updates, updatedAt: new Date().toISOString() } : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  deleteBattlemap: (campaignId, battlemapId) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      const remaining = campMaps.filter((bm) => bm.id !== battlemapId)
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: remaining
        },
        activeBattlemapId: state.activeBattlemapId === battlemapId ? remaining[0]?.id || null : state.activeBattlemapId
      }
    })
    get().persistTtrpg()
  },

  addTokenToBattlemap: (campaignId, battlemapId, tokenData) => {
    const newToken: TTRPGToken = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...tokenData
    }

    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? { ...bm, tokens: [...bm.tokens, newToken], updatedAt: new Date().toISOString() }
              : bm
          )
        }
      }
    })

    get().persistTtrpg()
    return newToken
  },

  updateTokenOnBattlemap: (campaignId, battlemapId, tokenId, updates) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  tokens: bm.tokens.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)),
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  removeTokenFromBattlemap: (campaignId, battlemapId, tokenId) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  tokens: bm.tokens.filter((t) => t.id !== tokenId),
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  addEffectToBattlemap: (campaignId, battlemapId, effectData) => {
    const newEffect: TTRPGBattlemapEffect = {
      ...effectData,
      id: `fx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      battlemapId
    }

    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  effects: [...(bm.effects || []), newEffect],
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
    return newEffect
  },

  updateEffectOnBattlemap: (campaignId, battlemapId, effectId, updates) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  effects: (bm.effects || []).map((fx) => (fx.id === effectId ? { ...fx, ...updates } : fx)),
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  removeEffectFromBattlemap: (campaignId, battlemapId, effectId) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  effects: (bm.effects || []).filter((fx) => fx.id !== effectId),
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  clearAllEffectsOnBattlemap: (campaignId, battlemapId) => {
    set((state) => {
      const campMaps = state.battlemaps[campaignId] || []
      return {
        battlemaps: {
          ...state.battlemaps,
          [campaignId]: campMaps.map((bm) =>
            bm.id === battlemapId
              ? {
                  ...bm,
                  effects: [],
                  updatedAt: new Date().toISOString()
                }
              : bm
          )
        }
      }
    })
    get().persistTtrpg()
  },

  executeRoll: (label, diceNotation, modifier = 0, characterName) => {
    // Parse dice notation like "1d20", "2d6", "1d8+4"
    const match = diceNotation.match(/(\d+)?d(\d+)([\+\-]\d+)?/i)
    const count = match && match[1] ? parseInt(match[1], 10) : 1
    const sides = match && match[2] ? parseInt(match[2], 10) : 20
    const inlineMod = match && match[3] ? parseInt(match[3], 10) : 0
    const totalMod = modifier + inlineMod

    const individualRolls: number[] = []
    let diceSum = 0
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1
      individualRolls.push(roll)
      diceSum += roll
    }

    const total = diceSum + totalMod
    const isCritSuccess = sides === 20 && count === 1 && individualRolls[0] === 20
    const isCritFail = sides === 20 && count === 1 && individualRolls[0] === 1

    const result: DiceRollResult = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      characterName,
      diceNotation,
      individualRolls,
      modifier: totalMod,
      total,
      isCritSuccess,
      isCritFail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    set((state) => ({
      diceHistory: [result, ...state.diceHistory.slice(0, 49)]
    }))

    return result
  },

  clearRollHistory: () => {
    set({ diceHistory: [] })
  }
}))
