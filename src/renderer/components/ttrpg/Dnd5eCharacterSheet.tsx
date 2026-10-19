import React, { useState, useMemo } from 'react'
import { 
  Shield, Heart, Swords, Sparkles, BookOpen, Backpack, 
  User, Plus, Trash2, Edit2, Check, Dices, ChevronRight, 
  ChevronDown, Flame, Zap, Crosshair, ArrowLeft, RefreshCw,
  Award, Star, AlertCircle
} from 'lucide-react'
import { Dnd5eCharacter, Dnd5eAttack, Dnd5eSpell, Dnd5eAbilityScores } from '@shared/types'
import { 
  useTtrpgStore, getAbilityModifier, formatModifier, 
  getProficiencyBonus, DND_STANDARD_SKILLS 
} from '../../store/useTtrpgStore'
import { useToastStore } from '../../store/useToastStore'

interface Dnd5eCharacterSheetProps {
  character: Dnd5eCharacter
  onBack: () => void
}

const SafeAvatar: React.FC<{ src?: string; name: string; className?: string }> = ({ 
  src, 
  name, 
  className = "w-16 h-16 rounded-[4px] object-cover border border-oros-700 shrink-0 shadow-md" 
}) => {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="w-16 h-16 rounded-[4px] bg-oros-900 border border-oros-750 flex items-center justify-center text-oros-400 shrink-0 shadow-inner">
        <User className="w-8 h-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={className}
    />
  )
}

export const Dnd5eCharacterSheet: React.FC<Dnd5eCharacterSheetProps> = ({ character, onBack }) => {
  const { updateCharacter, executeRoll, toggleDiceTray } = useTtrpgStore()
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'equipment' | 'features'>('combat')
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal')

  // Edit attack modal state
  const [showAddAttack, setShowAddAttack] = useState(false)
  const [newAtkName, setNewAtkName] = useState('')
  const [newAtkBonus, setNewAtkBonus] = useState(5)
  const [newAtkDamage, setNewAtkDamage] = useState('1d8 + 3')
  const [newAtkType, setNewAtkType] = useState('Slashing')
  const [newAtkRange, setNewAtkRange] = useState('5 ft')
  const [newAtkNotes, setNewAtkNotes] = useState('')

  // Edit spell modal state
  const [showAddSpell, setShowAddSpell] = useState(false)
  const [newSpellName, setNewSpellName] = useState('')
  const [newSpellLevel, setNewSpellLevel] = useState(1)
  const [newSpellSchool, setNewSpellSchool] = useState('Evocation')
  const [newSpellCastTime, setNewSpellCastTime] = useState('1 Action')
  const [newSpellRange, setNewSpellRange] = useState('60 ft')
  const [newSpellConc, setNewSpellConc] = useState(false)
  const [newSpellDesc, setNewSpellDesc] = useState('')

  // Inventory input
  const [newEquipItem, setNewEquipItem] = useState('')

  const profBonus = useMemo(() => getProficiencyBonus(character.level), [character.level])

  // Modifiers
  const strMod = getAbilityModifier(character.abilities.strength)
  const dexMod = getAbilityModifier(character.abilities.dexterity)
  const conMod = getAbilityModifier(character.abilities.constitution)
  const intMod = getAbilityModifier(character.abilities.intelligence)
  const wisMod = getAbilityModifier(character.abilities.wisdom)
  const chaMod = getAbilityModifier(character.abilities.charisma)

  const abilityMods: Record<keyof Dnd5eAbilityScores, number> = {
    strength: strMod,
    dexterity: dexMod,
    constitution: conMod,
    intelligence: intMod,
    wisdom: wisMod,
    charisma: chaMod
  }

  // Passive Perception
  const isPerceptionProf = character.skills['Perception'] === 'proficient'
  const isPerceptionExp = character.skills['Perception'] === 'expertise'
  const perceptionBonus = wisMod + (isPerceptionExp ? profBonus * 2 : isPerceptionProf ? profBonus : 0)
  const passivePerception = 10 + perceptionBonus

  // Roll Handler with Advantage / Disadvantage
  const handleRoll = (label: string, diceNotation: string, mod: number) => {
    let finalFormula = diceNotation
    if (advantageMode === 'advantage') {
      const match = diceNotation.match(/1d20/i)
      if (match) {
        finalFormula = '2d20kh1' // keep highest
      }
    } else if (advantageMode === 'disadvantage') {
      const match = diceNotation.match(/1d20/i)
      if (match) {
        finalFormula = '2d20kl1' // keep lowest
      }
    }

    const res = executeRoll(
      `${character.name}: ${label}${advantageMode !== 'normal' ? ` (${advantageMode})` : ''}`,
      finalFormula,
      mod,
      character.name
    )
    addToast(`Rolled ${label}: ${res.total}`, 'info')
  }

  // HP Adjustments
  const handleHpChange = (delta: number) => {
    const updated = Math.max(0, Math.min(character.hpMax, character.hpCurrent + delta))
    updateCharacter(character.campaignId, character.id, { hpCurrent: updated })
  }

  // Inspiration Toggle
  const toggleInspiration = () => {
    updateCharacter(character.campaignId, character.id, { inspiration: !character.inspiration })
    addToast(character.inspiration ? 'Inspiration spent' : 'Inspiration granted!', 'info')
  }

  // Death Save Toggle
  const toggleDeathSave = (type: 'successes' | 'failures', index: number) => {
    const current = character.deathSaves[type]
    const nextVal = current === index + 1 ? index : index + 1
    updateCharacter(character.campaignId, character.id, {
      deathSaves: {
        ...character.deathSaves,
        [type]: nextVal
      }
    })
  }

  // Reset Death Saves
  const resetDeathSaves = () => {
    updateCharacter(character.campaignId, character.id, {
      deathSaves: { successes: 0, failures: 0 }
    })
    addToast('Reset death saves', 'info')
  }

  // Add Attack Action
  const handleCreateAttack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAtkName.trim()) return

    const newAtk: Dnd5eAttack = {
      id: `atk-${Date.now()}`,
      name: newAtkName.trim(),
      bonus: Number(newAtkBonus),
      damage: newAtkDamage.trim(),
      damageType: newAtkType.trim(),
      range: newAtkRange.trim() || '5 ft',
      notes: newAtkNotes.trim() || undefined
    }

    updateCharacter(character.campaignId, character.id, {
      attacks: [...character.attacks, newAtk]
    })

    setShowAddAttack(false)
    setNewAtkName('')
    setNewAtkNotes('')
    addToast(`Added attack: ${newAtk.name}`, 'success')
  }

  const handleDeleteAttack = (atkId: string) => {
    updateCharacter(character.campaignId, character.id, {
      attacks: character.attacks.filter(a => a.id !== atkId)
    })
  }

  // Add Spell Action
  const handleCreateSpell = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSpellName.trim()) return

    const newSp: Dnd5eSpell = {
      id: `sp-${Date.now()}`,
      name: newSpellName.trim(),
      level: Number(newSpellLevel),
      school: newSpellSchool,
      castingTime: newSpellCastTime,
      range: newSpellRange,
      components: 'V, S',
      duration: 'Instantaneous',
      concentration: newSpellConc,
      description: newSpellDesc.trim() || 'No description provided.',
      prepared: true
    }

    const currentSpells = character.spellcasting?.spells || []
    updateCharacter(character.campaignId, character.id, {
      spellcasting: {
        ability: character.spellcasting?.ability || 'intelligence',
        slots: character.spellcasting?.slots || { 1: { max: 2, used: 0 } },
        spells: [...currentSpells, newSp]
      }
    })

    setShowAddSpell(false)
    setNewSpellName('')
    setNewSpellDesc('')
    addToast(`Added spell: ${newSp.name}`, 'success')
  }

  // Spell Slot Toggle
  const toggleSpellSlot = (level: number, slotIdx: number) => {
    const slots = { ...(character.spellcasting?.slots || {}) }
    const current = slots[level] || { max: 0, used: 0 }
    const isUsed = slotIdx < current.used
    const newUsed = isUsed ? slotIdx : slotIdx + 1

    slots[level] = { ...current, used: newUsed }
    updateCharacter(character.campaignId, character.id, {
      spellcasting: {
        ability: character.spellcasting?.ability || 'intelligence',
        spells: character.spellcasting?.spells || [],
        slots
      }
    })
  }

  // Add Equipment Item
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEquipItem.trim()) return
    updateCharacter(character.campaignId, character.id, {
      equipment: [...character.equipment, newEquipItem.trim()]
    })
    setNewEquipItem('')
  }

  const handleDeleteEquipment = (idx: number) => {
    const next = [...character.equipment]
    next.splice(idx, 1)
    updateCharacter(character.campaignId, character.id, { equipment: next })
  }

  return (
    <div className="flex-1 flex flex-col bg-oros-950 text-oros-100 overflow-y-auto select-text font-sans">
      {/* Top Breadcrumb & Advantage Strip - pr-[152px] protects against titlebar window controls collision */}
      <div className="shrink-0 bg-oros-900 border-b border-oros-800 px-6 py-2.5 pr-[152px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-white border border-oros-750 text-xs flex items-center gap-1.5 transition-colors font-medium shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-oros-400" />
            <span>Campaign Roster</span>
          </button>
          <div className="h-4 w-px bg-oros-800" />
          <span className="font-serif font-bold text-sm text-oros-200">
            {character.name}
          </span>
          <span className="text-xs text-oros-400 font-mono">
            Level {character.level} {character.race} {character.characterClass}
          </span>
        </div>

        {/* Advantage / Normal / Disadvantage Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-oros-800 bg-oros-950 p-0.5 text-xs font-mono">
            <button
              onClick={() => setAdvantageMode('disadvantage')}
              className={`px-2 py-0.5 rounded-[2px] transition-colors ${
                advantageMode === 'disadvantage'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 font-semibold'
                  : 'text-oros-500 hover:text-oros-300'
              }`}
              title="Disadvantage (Roll 2d20, keep lowest)"
            >
              DIS
            </button>
            <button
              onClick={() => setAdvantageMode('normal')}
              className={`px-2.5 py-0.5 rounded-[2px] transition-colors ${
                advantageMode === 'normal'
                  ? 'bg-oros-800 text-oros-100 font-semibold'
                  : 'text-oros-500 hover:text-oros-300'
              }`}
            >
              NORM
            </button>
            <button
              onClick={() => setAdvantageMode('advantage')}
              className={`px-2 py-0.5 rounded-[2px] transition-colors ${
                advantageMode === 'advantage'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold'
                  : 'text-oros-500 hover:text-oros-300'
              }`}
              title="Advantage (Roll 2d20, keep highest)"
            >
              ADV
            </button>
          </div>

          <button
            onClick={toggleDiceTray}
            className="px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-accent border border-oros-750 text-xs flex items-center gap-1.5 transition-colors font-medium shadow-sm"
          >
            <Dices className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono">Dice Tray</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* CHARACTER HEADER BANNER */}
        <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SafeAvatar
                src={character.avatarUrl}
                name={character.name}
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
                    {character.name}
                  </h1>
                  {character.inspiration && (
                    <span 
                      onClick={toggleInspiration}
                      className="px-2 py-0.5 rounded-[2px] bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-wider font-bold cursor-pointer hover:bg-amber-500/25 transition-colors flex items-center gap-1"
                      title="Inspiration active! Click to spend."
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Inspiration
                    </span>
                  )}
                  {!character.inspiration && (
                    <button
                      onClick={toggleInspiration}
                      className="text-[10px] text-oros-500 hover:text-amber-400 transition-colors font-mono"
                      title="Grant Inspiration"
                    >
                      + Gain Inspiration
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-oros-300 mt-1">
                  <span><strong className="text-oros-400">Class:</strong> {character.characterClass} {character.subclass ? `(${character.subclass})` : ''}</span>
                  <span><strong className="text-oros-400">Level:</strong> {character.level}</span>
                  <span><strong className="text-oros-400">Race:</strong> {character.race}</span>
                  {character.background && <span><strong className="text-oros-400">Background:</strong> {character.background}</span>}
                  {character.alignment && <span><strong className="text-oros-400">Alignment:</strong> {character.alignment}</span>}
                  {character.playerName && <span><strong className="text-oros-400">Player:</strong> {character.playerName}</span>}
                </div>
              </div>
            </div>

            {/* Proficiency Bonus & Level Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-oros-950/80 border border-oros-800 rounded-[3px] px-3 py-1.5 text-center">
                <span className="block text-[9px] uppercase font-mono tracking-wider text-oros-500">Proficiency</span>
                <span className="font-mono text-lg font-bold text-accent">+{profBonus}</span>
              </div>
              <div className="bg-oros-950/80 border border-oros-800 rounded-[3px] px-3 py-1.5 text-center">
                <span className="block text-[9px] uppercase font-mono tracking-wider text-oros-500">Speed</span>
                <span className="font-mono text-lg font-bold text-oros-200">{character.speed} ft</span>
              </div>
            </div>
          </div>
        </div>

        {/* COMBAT VITALS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {/* Armor Class */}
          <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-oros-400 mb-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-accent" />
              Armor Class
            </span>
            <span className="font-mono text-2xl font-bold text-white tracking-tight">
              {character.armorClass}
            </span>
          </div>

          {/* Initiative */}
          <div 
            onClick={() => handleRoll('Initiative', '1d20', character.initiativeBonus ?? dexMod)}
            className="bg-[#0e131d] border border-oros-800 hover:border-accent/50 rounded-[4px] p-3 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer group transition-all"
            title="Click to roll Initiative!"
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-oros-400 mb-0.5 group-hover:text-accent flex items-center gap-1 transition-colors">
              <Flame className="w-3 h-3 text-amber-500" />
              Initiative
            </span>
            <span className="font-mono text-2xl font-bold text-white group-hover:text-accent transition-colors">
              {formatModifier(character.initiativeBonus ?? dexMod)}
            </span>
          </div>

          {/* Hit Points */}
          <div className="col-span-2 bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-oros-400 mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" />
                Hit Points
              </span>
              <span className="text-oros-500">Max: {character.hpMax}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleHpChange(-5)}
                  className="w-5 h-5 rounded bg-oros-900 hover:bg-rose-950 text-oros-300 hover:text-rose-400 font-mono text-xs flex items-center justify-center border border-oros-800"
                >
                  -5
                </button>
                <button
                  onClick={() => handleHpChange(-1)}
                  className="w-5 h-5 rounded bg-oros-900 hover:bg-rose-950 text-oros-300 hover:text-rose-400 font-mono text-xs flex items-center justify-center border border-oros-800"
                >
                  -1
                </button>
              </div>

              <span className="font-mono text-2xl font-bold text-emerald-400">
                {character.hpCurrent} <span className="text-xs text-oros-500 font-normal">/ {character.hpMax}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleHpChange(1)}
                  className="w-5 h-5 rounded bg-oros-900 hover:bg-emerald-950 text-oros-300 hover:text-emerald-400 font-mono text-xs flex items-center justify-center border border-oros-800"
                >
                  +1
                </button>
                <button
                  onClick={() => handleHpChange(5)}
                  className="w-5 h-5 rounded bg-oros-900 hover:bg-emerald-950 text-oros-300 hover:text-emerald-400 font-mono text-xs flex items-center justify-center border border-oros-800"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Hit Dice */}
          <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-oros-400 mb-0.5">
              Hit Dice
            </span>
            <span className="font-mono text-base font-bold text-oros-200">
              {character.hitDiceRemaining} / {character.hitDice}
            </span>
          </div>

          {/* Death Saves */}
          <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-2.5 flex flex-col justify-between text-xs shadow-sm">
            <div className="flex items-center justify-between text-[9px] uppercase font-mono text-oros-500">
              <span>Death Saves</span>
              <button 
                onClick={resetDeathSaves}
                className="text-[9px] hover:text-oros-300 text-oros-600"
                title="Reset Death Saves"
              >
                Reset
              </button>
            </div>
            
            {/* Successes */}
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
              <span>SUCC</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDeathSave('successes', idx)}
                    className={`w-3 h-3 rounded-full border transition-colors ${
                      character.deathSaves.successes > idx
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'border-oros-700 bg-oros-950'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Failures */}
            <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono">
              <span>FAIL</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDeathSave('failures', idx)}
                    className={`w-3 h-3 rounded-full border transition-colors ${
                      character.deathSaves.failures > idx
                        ? 'bg-rose-500 border-rose-400'
                        : 'border-oros-700 bg-oros-950'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY: Ability Scores Column (Left) + Skills/Saves (Center) + Tabbed Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ABILITIES & SAVES (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-oros-500 font-bold px-1">
              Ability Scores & Saves
            </span>

            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as (keyof Dnd5eAbilityScores)[]).map((ability) => {
              const score = character.abilities[ability]
              const mod = getAbilityModifier(score)
              const isSaveProf = character.savingThrowProficiencies.includes(ability)
              const saveTotal = mod + (isSaveProf ? profBonus : 0)

              return (
                <div 
                  key={ability}
                  className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-2.5 flex items-center justify-between shadow-sm"
                >
                  {/* Ability Block */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRoll(`${ability.toUpperCase()} Check`, '1d20', mod)}
                      className="w-11 h-11 rounded-[3px] bg-oros-950 border border-oros-750 hover:border-accent flex flex-col items-center justify-center transition-all group"
                      title={`Roll ${ability.toUpperCase()} Check (1d20 ${formatModifier(mod)})`}
                    >
                      <span className="font-mono text-sm font-bold text-white group-hover:text-accent leading-none">
                        {formatModifier(mod)}
                      </span>
                      <span className="font-mono text-[9px] text-oros-500 leading-none mt-0.5">
                        {score}
                      </span>
                    </button>
                    <div>
                      <span className="block font-serif text-xs font-bold text-oros-200 uppercase tracking-wide">
                        {ability.slice(0, 3)}
                      </span>
                      <span className="text-[10px] text-oros-500 capitalize">
                        {ability}
                      </span>
                    </div>
                  </div>

                  {/* Saving Throw Button */}
                  <button
                    onClick={() => handleRoll(`${ability.toUpperCase()} Save`, '1d20', saveTotal)}
                    className={`px-2 py-1 rounded-[3px] border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
                      isSaveProf
                        ? 'bg-accent-muted text-accent border-accent/40 font-bold'
                        : 'bg-oros-950 text-oros-400 border-oros-800 hover:text-oros-200'
                    }`}
                    title={`Roll ${ability} saving throw (${formatModifier(saveTotal)})`}
                  >
                    <span>Save</span>
                    <span className="text-xs">{formatModifier(saveTotal)}</span>
                  </button>
                </div>
              )
            })}

            {/* Passive Perception Block */}
            <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 flex items-center justify-between text-xs">
              <span className="text-oros-400 font-mono text-[11px]">Passive Perception</span>
              <span className="font-mono text-sm font-bold text-accent">{passivePerception}</span>
            </div>
          </div>

          {/* SKILLS COLUMN (3 Cols) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-oros-500 font-bold">
                Proficiencies & Skills
              </span>
              <span className="text-[10px] font-mono text-oros-500">Prof: +{profBonus}</span>
            </div>

            <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-2 space-y-0.5 shadow-sm max-h-[580px] overflow-y-auto scrollbar-thin">
              {DND_STANDARD_SKILLS.map((skill) => {
                const profLevel = character.skills[skill.name] || 'none'
                const statMod = abilityMods[skill.ability]
                let skillMod = statMod
                if (profLevel === 'proficient') skillMod += profBonus
                if (profLevel === 'expertise') skillMod += profBonus * 2
                if (profLevel === 'half') skillMod += Math.floor(profBonus / 2)

                return (
                  <div
                    key={skill.name}
                    onClick={() => handleRoll(`${skill.name} (${skill.ability.slice(0, 3).toUpperCase()})`, '1d20', skillMod)}
                    className="group px-2 py-1.5 rounded-[2px] hover:bg-oros-850 flex items-center justify-between cursor-pointer transition-colors text-xs"
                    title={`Click to roll ${skill.name} (${formatModifier(skillMod)})`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Proficiency Icon */}
                      <span className="w-3.5 h-3.5 flex items-center justify-center">
                        {profLevel === 'expertise' && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        {profLevel === 'proficient' && <span className="w-2 h-2 rounded-full bg-accent" />}
                        {profLevel === 'half' && <span className="w-1.5 h-1.5 rounded-full border border-accent" />}
                        {profLevel === 'none' && <span className="w-1.5 h-1.5 rounded-full bg-oros-800" />}
                      </span>
                      <span className="text-oros-300 group-hover:text-white font-medium">
                        {skill.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-oros-500 uppercase">
                        {skill.ability.slice(0, 3)}
                      </span>
                      <span className={`font-mono text-xs font-semibold ${profLevel !== 'none' ? 'text-accent' : 'text-oros-400'}`}>
                        {formatModifier(skillMod)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* MAIN TABBED WORKSPACE (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-oros-800 pb-1">
              <div className="flex items-center gap-1">
                {[
                  { id: 'combat', label: 'Attacks & Actions', icon: Swords },
                  { id: 'spells', label: 'Spells & Magic', icon: Sparkles },
                  { id: 'equipment', label: 'Inventory & Wealth', icon: Backpack },
                  { id: 'features', label: 'Features & Bio', icon: BookOpen }
                ].map((t) => {
                  const Icon = t.icon
                  const isActive = activeTab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-3 py-1.5 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm font-semibold'
                          : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>

              {activeTab === 'combat' && (
                <button
                  onClick={() => setShowAddAttack(true)}
                  className="px-2 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-accent border border-oros-800 text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Attack</span>
                </button>
              )}

              {activeTab === 'spells' && (
                <button
                  onClick={() => setShowAddSpell(true)}
                  className="px-2 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-accent border border-oros-800 text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Spell</span>
                </button>
              )}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'combat' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {character.attacks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-oros-500 bg-[#0e131d] border border-oros-800 rounded-[4px]">
                    No attacks configured. Click "+ Attack" to add a weapon or combat action.
                  </div>
                ) : (
                  character.attacks.map((atk) => (
                    <div
                      key={atk.id}
                      className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 shadow-sm hover:border-oros-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                            <span>{atk.name}</span>
                            {atk.range && (
                              <span className="text-[10px] font-mono font-normal text-oros-500 px-1.5 py-0.2 rounded bg-oros-950 border border-oros-850">
                                {atk.range}
                              </span>
                            )}
                          </h4>
                          {atk.notes && (
                            <p className="text-xs text-oros-400 mt-1 font-sans leading-relaxed">
                              {atk.notes}
                            </p>
                          )}
                        </div>

                        {/* Interactive Roll Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* To Hit Roll */}
                          <button
                            onClick={() => handleRoll(`${atk.name} [Attack]`, '1d20', atk.bonus)}
                            className="px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-accent border border-accent/40 font-mono text-xs font-bold transition-all shadow-sm"
                            title={`Roll Attack (${formatModifier(atk.bonus)})`}
                          >
                            To-Hit {formatModifier(atk.bonus)}
                          </button>

                          {/* Damage Roll */}
                          <button
                            onClick={() => handleRoll(`${atk.name} [Damage]`, atk.damage, 0)}
                            className="px-2.5 py-1 rounded-[3px] bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono text-xs font-bold transition-all shadow-sm"
                            title={`Roll Damage (${atk.damage} ${atk.damageType})`}
                          >
                            {atk.damage} <span className="text-[10px] text-rose-400 font-normal">{atk.damageType}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteAttack(atk.id)}
                            className="p-1 text-oros-600 hover:text-rose-400 transition-colors"
                            title="Remove Attack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SPELLS TAB */}
            {activeTab === 'spells' && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Spellcasting Header Stats */}
                <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="block text-[9px] uppercase font-mono text-oros-500">Spell Ability</span>
                    <span className="font-mono text-sm font-bold text-accent uppercase">
                      {character.spellcasting?.ability || 'INT'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-mono text-oros-500">Spell Save DC</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {character.spellcasting?.spellSaveDcOverride || (8 + profBonus + (character.spellcasting?.ability ? abilityMods[character.spellcasting.ability] : intMod))}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-mono text-oros-500">Spell Attack</span>
                    <span className="font-mono text-sm font-bold text-white">
                      +{character.spellcasting?.spellAttackBonusOverride || (profBonus + (character.spellcasting?.ability ? abilityMods[character.spellcasting.ability] : intMod))}
                    </span>
                  </div>
                </div>

                {/* Spell Slots Trackers (Level 1 to 5) */}
                <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-2">
                  <span className="block font-mono text-[10px] uppercase font-bold text-oros-400 tracking-wider">
                    Spell Slots
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((lvl) => {
                      const slotData = character.spellcasting?.slots?.[lvl] || { max: 0, used: 0 }
                      if (slotData.max === 0) return null

                      return (
                        <div key={lvl} className="bg-oros-950/80 border border-oros-850 p-2 rounded-[3px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-oros-400 mb-1">
                            <span>Level {lvl}</span>
                            <span>{slotData.max - slotData.used} / {slotData.max}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: slotData.max }).map((_, slotIdx) => (
                              <button
                                key={slotIdx}
                                onClick={() => toggleSpellSlot(lvl, slotIdx)}
                                className={`w-3.5 h-3.5 rounded-[2px] border transition-colors ${
                                  slotIdx < slotData.used
                                    ? 'bg-oros-900 border-oros-700'
                                    : 'bg-accent border-accent/80'
                                }`}
                                title={`Toggle Slot ${slotIdx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Spells List */}
                <div className="space-y-2">
                  {(character.spellcasting?.spells || []).map((sp) => (
                    <div
                      key={sp.id}
                      className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 shadow-sm hover:border-oros-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif font-bold text-sm text-white">
                              {sp.name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-oros-950 text-oros-400 border border-oros-850">
                              {sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`}
                            </span>
                            {sp.concentration && (
                              <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                Conc
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-oros-400 mt-1 font-sans leading-relaxed">
                            {sp.description}
                          </p>
                          <div className="text-[10px] font-mono text-oros-500 mt-1.5 flex gap-3">
                            <span>Cast: {sp.castingTime}</span>
                            <span>Range: {sp.range}</span>
                            <span>Duration: {sp.duration}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRoll(`Cast ${sp.name}`, '1d20', profBonus + intMod)}
                          className="px-2.5 py-1 rounded-[3px] bg-accent-muted text-accent border border-accent/40 font-mono text-xs font-bold transition-all shadow-sm shrink-0"
                        >
                          Cast
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EQUIPMENT TAB */}
            {activeTab === 'equipment' && (
              <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Coins Banner */}
                <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 grid grid-cols-5 gap-2 text-center">
                  {[
                    { key: 'cp', label: 'CP', color: 'text-amber-600' },
                    { key: 'sp', label: 'SP', color: 'text-slate-300' },
                    { key: 'ep', label: 'EP', color: 'text-cyan-400' },
                    { key: 'gp', label: 'GP', color: 'text-amber-300 font-bold' },
                    { key: 'pp', label: 'PP', color: 'text-sky-300 font-bold' }
                  ].map((c) => (
                    <div key={c.key} className="bg-oros-950/80 border border-oros-850 p-1.5 rounded-[3px]">
                      <span className={`block font-mono text-sm ${c.color}`}>
                        {character.currency[c.key as keyof typeof character.currency] || 0}
                      </span>
                      <span className="text-[9px] font-mono text-oros-500 uppercase">{c.label}</span>
                    </div>
                  ))}
                </div>

                {/* Equipment List */}
                <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-3">
                  <form onSubmit={handleAddEquipment} className="flex gap-2">
                    <input
                      type="text"
                      value={newEquipItem}
                      onChange={(e) => setNewEquipItem(e.target.value)}
                      placeholder="Add item, armor, or possession..."
                      className="flex-1 bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750 text-xs font-semibold"
                    >
                      Add
                    </button>
                  </form>

                  <div className="space-y-1">
                    {character.equipment.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-oros-950/60 border border-oros-850 rounded-[3px] text-xs text-oros-300"
                      >
                        <span>{item}</span>
                        <button
                          onClick={() => handleDeleteEquipment(idx)}
                          className="text-oros-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES & BIO TAB */}
            {activeTab === 'features' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Features & Traits */}
                <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1.5">
                  <h4 className="font-mono text-[11px] uppercase font-bold text-accent tracking-wider">
                    Features & Feats
                  </h4>
                  <p className="text-xs text-oros-300 leading-relaxed whitespace-pre-wrap">
                    {character.featuresAndTraits || 'No features configured.'}
                  </p>
                </div>

                {/* Personality & RP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1">
                    <span className="block font-mono text-[10px] uppercase text-oros-500 font-bold">Personality Traits</span>
                    <p className="text-xs text-oros-300">{character.personalityTraits || 'None specified.'}</p>
                  </div>
                  <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1">
                    <span className="block font-mono text-[10px] uppercase text-oros-500 font-bold">Ideals</span>
                    <p className="text-xs text-oros-300">{character.ideals || 'None specified.'}</p>
                  </div>
                  <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1">
                    <span className="block font-mono text-[10px] uppercase text-oros-500 font-bold">Bonds</span>
                    <p className="text-xs text-oros-300">{character.bonds || 'None specified.'}</p>
                  </div>
                  <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1">
                    <span className="block font-mono text-[10px] uppercase text-oros-500 font-bold">Flaws</span>
                    <p className="text-xs text-oros-300">{character.flaws || 'None specified.'}</p>
                  </div>
                </div>

                {/* Backstory */}
                {character.backstory && (
                  <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-3 space-y-1.5">
                    <h4 className="font-mono text-[11px] uppercase font-bold text-oros-400 tracking-wider">
                      Backstory & History
                    </h4>
                    <p className="text-xs text-oros-300 leading-relaxed font-serif">
                      {character.backstory}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD ATTACK MODAL */}
      {showAddAttack && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 rounded-[4px] w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-base text-white">Add Weapon or Attack Action</h3>
            <form onSubmit={handleCreateAttack} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-oros-400 mb-1">Weapon / Action Name</label>
                <input
                  type="text"
                  required
                  value={newAtkName}
                  onChange={(e) => setNewAtkName(e.target.value)}
                  placeholder="e.g. Longsword +1, Fire Bolt"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">To-Hit Bonus</label>
                  <input
                    type="number"
                    value={newAtkBonus}
                    onChange={(e) => setNewAtkBonus(Number(e.target.value))}
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Damage Formula</label>
                  <input
                    type="text"
                    required
                    value={newAtkDamage}
                    onChange={(e) => setNewAtkDamage(e.target.value)}
                    placeholder="e.g. 1d8 + 3"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Damage Type</label>
                  <input
                    type="text"
                    value={newAtkType}
                    onChange={(e) => setNewAtkType(e.target.value)}
                    placeholder="e.g. Slashing, Fire"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Range</label>
                  <input
                    type="text"
                    value={newAtkRange}
                    onChange={(e) => setNewAtkRange(e.target.value)}
                    placeholder="e.g. 5 ft, 120 ft"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-oros-400 mb-1">Notes / Effects</label>
                <textarea
                  value={newAtkNotes}
                  onChange={(e) => setNewAtkNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Versatile (1d10), Sneak attack eligible"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAttack(false)}
                  className="px-3 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 text-oros-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-[3px] btn-accent text-xs font-semibold"
                >
                  Add Attack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SPELL MODAL */}
      {showAddSpell && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 rounded-[4px] w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-base text-white">Add Spell</h3>
            <form onSubmit={handleCreateSpell} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-oros-400 mb-1">Spell Name</label>
                <input
                  type="text"
                  required
                  value={newSpellName}
                  onChange={(e) => setNewSpellName(e.target.value)}
                  placeholder="e.g. Magic Missile, Healing Word"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Spell Level (0 for Cantrip)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={newSpellLevel}
                    onChange={(e) => setNewSpellLevel(Number(e.target.value))}
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">School</label>
                  <input
                    type="text"
                    value={newSpellSchool}
                    onChange={(e) => setNewSpellSchool(e.target.value)}
                    placeholder="e.g. Evocation"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Casting Time</label>
                  <input
                    type="text"
                    value={newSpellCastTime}
                    onChange={(e) => setNewSpellCastTime(e.target.value)}
                    placeholder="e.g. 1 Action"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-oros-400 mb-1">Range</label>
                  <input
                    type="text"
                    value={newSpellRange}
                    onChange={(e) => setNewSpellRange(e.target.value)}
                    placeholder="e.g. 60 ft, Touch"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="concCheck"
                  checked={newSpellConc}
                  onChange={(e) => setNewSpellConc(e.target.checked)}
                  className="rounded bg-oros-950 border-oros-800 text-accent"
                />
                <label htmlFor="concCheck" className="text-xs text-oros-300 font-mono">Requires Concentration</label>
              </div>

              <div>
                <label className="block text-xs font-mono text-oros-400 mb-1">Spell Description</label>
                <textarea
                  value={newSpellDesc}
                  onChange={(e) => setNewSpellDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe spell effects, damage, saves..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSpell(false)}
                  className="px-3 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 text-oros-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-[3px] btn-accent text-xs font-semibold"
                >
                  Add Spell
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
