import React, { useState } from 'react'
import { 
  ArrowLeft, Plus, Shield, Heart, Eye, 
  Trash2, BookOpen, Layers, Sparkles, User, FileText, 
  ChevronRight, Calendar, Edit3, Map as MapIcon,
  Swords, Flame, Moon, Sun, Search, Zap, Crosshair, Settings
} from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { TTRPGCampaign, Dnd5eCharacter, Dnd5eAttack } from '@shared/types'
import { useTtrpgStore } from '../../store/useTtrpgStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { Dnd5eCharacterSheet } from './Dnd5eCharacterSheet'
import { NewCharacterModal } from './NewCharacterModal'
import { TTRPGBattlemapViewer } from './TTRPGBattlemapViewer'

interface TTRPGCampaignDashboardProps {
  campaignId: string
  onBackToHub: () => void
}

const SafeAvatar: React.FC<{ src?: string; name: string; className?: string }> = ({ 
  src, 
  name, 
  className = "w-12 h-12 rounded-[3px] object-cover border border-oros-750 shrink-0" 
}) => {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="w-12 h-12 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-center text-oros-400 shrink-0 shadow-inner">
        <User className="w-6 h-6" />
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

export const TTRPGCampaignDashboard: React.FC<TTRPGCampaignDashboardProps> = ({
  campaignId,
  onBackToHub
}) => {
  const { 
    campaigns, characters, activeCharacterId, 
    setActiveCharacterId, updateCampaign, updateCharacter, deleteCharacter,
    battlemaps, activeBattlemapId, addTokenToBattlemap
  } = useTtrpgStore()

  const { addToast } = useToastStore()
  const { openSettings } = useSettingsStore()
  
  // Tactical Battlemap is the primary view by default
  const [activeView, setActiveView] = useState<'battlemap' | 'roster' | 'notes'>('battlemap')
  const [showNewCharModal, setShowNewCharModal] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [sessionNotesInput, setSessionNotesInput] = useState('')

  const campaign = campaigns.find(c => c.id === campaignId) || campaigns[0]
  const campaignCharacters = characters[campaign?.id || ''] || []
  const campaignMaps = battlemaps[campaign?.id || ''] || []

  // If a specific character sheet is currently open, display it
  const activeCharacter = campaignCharacters.find(ch => ch.id === activeCharacterId)
  if (activeCharacter) {
    return (
      <Dnd5eCharacterSheet
        character={activeCharacter}
        onBack={() => setActiveCharacterId(null)}
      />
    )
  }

  const handleDeleteChar = async (char: Dnd5eCharacter, e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await confirmDialog({
      title: 'Delete Character',
      message: `Delete ${char.name}? This will permanently remove their character sheet and stats.`,
      confirmText: 'Delete Character',
      variant: 'danger'
    })
    if (ok) {
      deleteCharacter(campaign.id, char.id)
      addToast(`Deleted ${char.name}`, 'info')
    }
  }

  const handleSaveNotes = () => {
    updateCampaign(campaign.id, { sessionNotes: sessionNotesInput })
    setIsEditingNotes(false)
    addToast('Updated session journal', 'success')
  }

  // Helper: Skill Bonus Calculation
  const getSkillBonus = (char: Dnd5eCharacter, skillName: string, abilityKey: keyof Dnd5eCharacter['abilities']) => {
    const profBonus = Math.floor(((char.level || 1) - 1) / 4) + 2
    const abilityScore = char.abilities?.[abilityKey] ?? 10
    const abilityMod = Math.floor((abilityScore - 10) / 2)
    const prof = char.skills?.[skillName] || 'none'
    if (prof === 'expertise') return abilityMod + profBonus * 2
    if (prof === 'proficient') return abilityMod + profBonus
    if (prof === 'half') return abilityMod + Math.floor(profBonus / 2)
    return abilityMod
  }

  // Quick Attack Roller from Roster
  const handleRollAttack = (char: Dnd5eCharacter, atk: Dnd5eAttack) => {
    const d20 = Math.floor(Math.random() * 20) + 1
    const total = d20 + (atk.bonus || 0)
    const isCrit = d20 === 20
    const isCritFail = d20 === 1

    addToast(
      `🎲 ${char.name} [${atk.name}]: d20(${d20}) + ${atk.bonus} = ${total} to hit! ${
        isCrit ? '💥 CRITICAL HIT!' : isCritFail ? '💀 CRITICAL MISS!' : ''
      }`,
      isCrit ? 'success' : isCritFail ? 'error' : 'info'
    )
  }

  // Deploy adventurer directly to active battlemap
  const handleDeployToMap = (char: Dnd5eCharacter) => {
    const targetMap = campaignMaps.find(m => m.id === activeBattlemapId) || campaignMaps[0]
    if (!targetMap) {
      addToast('No battlemap created yet to deploy to', 'warning')
      return
    }

    addTokenToBattlemap(campaign.id, targetMap.id, {
      campaignId: campaign.id,
      battlemapId: targetMap.id,
      name: char.name,
      avatarUrl: char.avatarUrl,
      x: 45 + Math.round((Math.random() - 0.5) * 16),
      y: 45 + Math.round((Math.random() - 0.5) * 16),
      size: 1,
      color: '#38bdf8',
      hpCurrent: char.hpCurrent,
      hpMax: char.hpMax,
      armorClass: char.armorClass,
      speed: char.speed,
      characterId: char.id,
      conditions: [],
      isEnemy: false
    })

    setActiveView('battlemap')
    addToast(`Deployed ${char.name} onto "${targetMap.name}"`, 'success')
  }

  // Short Rest for a character
  const handleShortRest = (char: Dnd5eCharacter, e: React.MouseEvent) => {
    e.stopPropagation()
    const conMod = Math.max(0, Math.floor(((char.abilities?.constitution ?? 10) - 10) / 2))
    const dieSize = parseInt(char.hitDice?.split('d')[1] || '8', 10)
    const roll = Math.floor(Math.random() * dieSize) + 1
    const healed = roll + conMod
    const newHp = Math.min(char.hpMax, char.hpCurrent + healed)
    const remainingDice = Math.max(0, char.hitDiceRemaining - 1)

    updateCharacter(campaign.id, char.id, {
      hpCurrent: newHp,
      hitDiceRemaining: remainingDice
    })

    addToast(`Short Rest: ${char.name} spent 1 Hit Die, healed +${healed} HP (${char.hpCurrent} -> ${newHp}/${char.hpMax})`, 'success')
  }

  // Long Rest for a character
  const handleLongRest = (char: Dnd5eCharacter, e: React.MouseEvent) => {
    e.stopPropagation()
    // Reset spell slots used to 0
    let updatedSpellcasting = char.spellcasting
    if (char.spellcasting?.slots) {
      const resetSlots: Record<number, { max: number; used: number }> = {}
      for (const [lvl, s] of Object.entries(char.spellcasting.slots)) {
        resetSlots[Number(lvl)] = { max: s.max, used: 0 }
      }
      updatedSpellcasting = { ...char.spellcasting, slots: resetSlots }
    }

    const recoveredDice = Math.max(1, Math.floor(char.level / 2))
    const newRemainingDice = Math.min(char.level, char.hitDiceRemaining + recoveredDice)

    updateCharacter(campaign.id, char.id, {
      hpCurrent: char.hpMax,
      hpTemp: 0,
      hitDiceRemaining: newRemainingDice,
      deathSaves: { successes: 0, failures: 0 },
      spellcasting: updatedSpellcasting
    })

    addToast(`Long Rest: ${char.name} fully restored HP (${char.hpMax}), Hit Dice & Spell Slots!`, 'success')
  }

  // Toggle Spell Slot Pip
  const handleToggleSpellSlot = (char: Dnd5eCharacter, lvl: number, slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!char.spellcasting?.slots?.[lvl]) return
    const current = char.spellcasting.slots[lvl]
    const available = current.max - current.used

    // If clicking an available slot pip, expend it (+1 used); if clicking an expended one, restore it (-1 used)
    const newUsed = slotIndex < available ? current.used + 1 : Math.max(0, current.used - 1)
    const updatedSlots = {
      ...char.spellcasting.slots,
      [lvl]: { ...current, used: newUsed }
    }

    updateCharacter(campaign.id, char.id, {
      spellcasting: { ...char.spellcasting, slots: updatedSlots }
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-oros-950 text-oros-100 overflow-hidden select-text font-sans">
      {/* Top Campaign Bar - pr-[152px] ensures native window controls do not overlap */}
      <header className="shrink-0 bg-oros-900 border-b border-oros-800 px-6 py-2.5 pr-[152px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="px-2.5 py-1.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-white border border-oros-750 text-xs flex items-center gap-1.5 transition-colors font-medium shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-oros-400" />
            <span>TTRPG Hub</span>
            <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-[2px] leading-tight">
              BETA
            </span>
          </button>
          <div className="h-4 w-px bg-oros-800" />
          <h1 className="font-serif font-bold text-base text-oros-100 flex items-center gap-2">
            <span>{campaign?.title}</span>
            <span className="px-1.5 py-0.2 rounded bg-accent-muted text-accent border border-accent/40 font-mono text-[10px] uppercase font-bold tracking-wider">
              {campaign?.system.toUpperCase()}
            </span>
          </h1>
        </div>

        {/* View Switcher Tabs: Battlemap as Primary View */}
        <div className="flex items-center gap-1 bg-oros-950 p-1 rounded-[4px] border border-oros-800">
          <button
            onClick={() => setActiveView('battlemap')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'battlemap'
                ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
                : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-accent" />
            <span>Tactical Battlemap</span>
          </button>

          <button
            onClick={() => setActiveView('roster')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'roster'
                ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
                : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Party Roster ({campaignCharacters.length})</span>
          </button>

          <button
            onClick={() => setActiveView('notes')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeView === 'notes'
                ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
                : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Session Journal</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSettings()}
            title="Application Settings & Preferences (Ctrl+,)"
            className="p-1 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-white border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => setShowNewCharModal(true)}
            className="px-3 py-1.5 rounded-[3px] btn-accent text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Character</span>
          </button>
        </div>
      </header>

      {/* Main Campaign Content Switcher */}
      {activeView === 'battlemap' ? (
        <TTRPGBattlemapViewer
          campaign={campaign}
          onOpenCharacterSheet={(id) => setActiveCharacterId(id)}
        />
      ) : activeView === 'roster' ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Strip with Quick Stats */}
          <div className="flex items-center justify-between border-b border-oros-800 pb-3">
            <div>
              <h2 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span>Adventurer & Party Roster</span>
              </h2>
              <p className="text-xs text-oros-400 mt-0.5">
                {campaignCharacters.length} active player character sheets with live combat stats, passive senses & rest trackers
              </p>
            </div>

            <button
              onClick={() => setShowNewCharModal(true)}
              className="px-3 py-1.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span>Add Adventurer</span>
            </button>
          </div>

          {/* Revamped Adventurer Roster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaignCharacters.map((char) => {
              const hpPercent = char.hpMax ? Math.round((char.hpCurrent / char.hpMax) * 100) : 100
              const passivePerception = 10 + getSkillBonus(char, 'Perception', 'wisdom')
              const passiveInvestigation = 10 + getSkillBonus(char, 'Investigation', 'intelligence')
              const passiveInsight = 10 + getSkillBonus(char, 'Insight', 'wisdom')
              const spellSlots = char.spellcasting?.slots ? Object.entries(char.spellcasting.slots).filter(([_, s]) => s.max > 0) : []

              return (
                <div
                  key={char.id}
                  onClick={() => setActiveCharacterId(char.id)}
                  className="group bg-[#0e131d] hover:bg-[#121824] border border-oros-800 hover:border-accent/50 rounded-[5px] p-5 cursor-pointer transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  {/* Top Character Profile */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <SafeAvatar
                          src={char.avatarUrl}
                          name={char.name}
                        />
                        <div>
                          <h3 className="font-serif font-bold text-base text-white group-hover:text-accent transition-colors leading-tight">
                            {char.name}
                          </h3>
                          <span className="text-xs text-oros-400 font-sans block">
                            Level {char.level} {char.race} {char.characterClass}
                          </span>
                          {char.subclass && (
                            <span className="text-[10px] text-accent font-mono block">
                              {char.subclass}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Inspiration Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateCharacter(campaign.id, char.id, { inspiration: !char.inspiration })
                            addToast(`${char.name} ${!char.inspiration ? 'received Inspiration!' : 'used Inspiration'}`, 'info')
                          }}
                          className={`p-1.5 rounded-[3px] border transition-all ${
                            char.inspiration
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm animate-pulse'
                              : 'bg-oros-950 border-oros-800 text-oros-600 hover:text-amber-400'
                          }`}
                          title={char.inspiration ? 'Inspiration Active (Click to spend)' : 'Grant Inspiration'}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteChar(char, e)}
                          className="text-oros-600 hover:text-rose-400 p-1.5 rounded transition-colors"
                          title="Delete character sheet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Vitals Summary Pill Strip with Interactive HP Steppers */}
                    <div className="bg-oros-950/90 border border-oros-850 rounded-[4px] p-2.5 space-y-2 mb-3">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        {/* AC */}
                        <div className="bg-oros-900/60 p-1.5 rounded border border-oros-800">
                          <span className="block text-[9px] uppercase text-oros-500">Armor Class</span>
                          <span className="font-bold text-sky-400 text-sm flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3 text-sky-400" />
                            {char.armorClass}
                          </span>
                        </div>

                        {/* Interactive HP Stepper */}
                        <div className="bg-oros-900/60 p-1.5 rounded border border-oros-800 col-span-2">
                          <div className="flex items-center justify-between text-[9px] uppercase text-oros-500 px-1">
                            <span>Hit Points</span>
                            <span className="text-oros-400 font-bold">{char.hpCurrent} / {char.hpMax}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateCharacter(campaign.id, char.id, { hpCurrent: Math.max(0, char.hpCurrent - 1) })
                              }}
                              className="w-5 h-5 rounded bg-oros-950 hover:bg-rose-950 text-rose-400 border border-oros-750 flex items-center justify-center font-bold text-xs"
                              title="Take 1 Damage"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateCharacter(campaign.id, char.id, { hpCurrent: Math.max(0, char.hpCurrent - 5) })
                              }}
                              className="px-1.5 h-5 rounded bg-oros-950 hover:bg-rose-950 text-rose-400 border border-oros-750 flex items-center justify-center font-bold text-[10px]"
                              title="Take 5 Damage"
                            >
                              -5
                            </button>

                            {/* Mini HP Bar */}
                            <div className="flex-1 h-2 bg-black/70 rounded-full overflow-hidden mx-1">
                              <div
                                className={`h-full transition-all ${
                                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateCharacter(campaign.id, char.id, { hpCurrent: Math.min(char.hpMax, char.hpCurrent + 1) })
                              }}
                              className="w-5 h-5 rounded bg-oros-950 hover:bg-emerald-950 text-emerald-400 border border-oros-750 flex items-center justify-center font-bold text-xs"
                              title="Heal 1 HP"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateCharacter(campaign.id, char.id, { hpCurrent: Math.min(char.hpMax, char.hpCurrent + 5) })
                              }}
                              className="px-1.5 h-5 rounded bg-oros-950 hover:bg-emerald-950 text-emerald-400 border border-oros-750 flex items-center justify-center font-bold text-[10px]"
                              title="Heal 5 HP"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Passive Senses Matrix */}
                      <div className="flex items-center justify-around bg-black/40 rounded px-2 py-1 text-[10px] font-mono border border-oros-850 text-oros-300">
                        <span title="Passive Perception (10 + Perception Mod)">
                          👁 <strong className="text-white">{passivePerception}</strong> Perc
                        </span>
                        <span className="text-oros-700">•</span>
                        <span title="Passive Investigation (10 + Investigation Mod)">
                          🔍 <strong className="text-white">{passiveInvestigation}</strong> Inv
                        </span>
                        <span className="text-oros-700">•</span>
                        <span title="Passive Insight (10 + Insight Mod)">
                          🧠 <strong className="text-white">{passiveInsight}</strong> Ins
                        </span>
                      </div>
                    </div>

                    {/* Spell Slots Matrix Pips (For Casters) */}
                    {spellSlots.length > 0 && (
                      <div className="space-y-1 mb-3 bg-oros-950/60 p-2 rounded border border-oros-850">
                        <span className="block text-[9px] font-mono uppercase text-oros-400 font-bold">
                          Spell Slots
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs font-mono">
                          {spellSlots.map(([lvl, s]) => {
                            const levelNum = Number(lvl)
                            const available = s.max - s.used
                            return (
                              <div key={lvl} className="flex items-center gap-1 bg-oros-900/80 px-1.5 py-0.5 rounded border border-oros-800">
                                <span className="text-[10px] text-accent font-bold">L{lvl}:</span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: s.max }).map((_, idx) => {
                                    const isAvailable = idx < available
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => handleToggleSpellSlot(char, levelNum, idx, e)}
                                        className={`w-2.5 h-2.5 rounded-full border transition-all ${
                                          isAvailable
                                            ? 'bg-cyan-400 border-cyan-200 shadow-sm shadow-cyan-500/50 hover:scale-125'
                                            : 'bg-black/60 border-oros-750 opacity-40 hover:opacity-80'
                                        }`}
                                        title={`Level ${lvl} Slot ${idx + 1}: ${isAvailable ? 'Available (Click to cast)' : 'Expended (Click to restore)'}`}
                                      />
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Weapon Attack Actions */}
                    {char.attacks && char.attacks.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <span className="block text-[9px] font-mono uppercase text-oros-500 font-bold">
                          Quick Attack Checks
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          {char.attacks.slice(0, 2).map((atk) => (
                            <button
                              key={atk.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRollAttack(char, atk)
                              }}
                              className="px-2.5 py-1 rounded-[3px] bg-oros-950 hover:bg-oros-900 border border-oros-800 hover:border-accent text-[11px] text-oros-200 flex items-center justify-between transition-colors font-mono group/atk"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Swords className="w-3 h-3 text-rose-400 group-hover/atk:text-accent" />
                                <span className="truncate">{atk.name}</span>
                              </span>
                              <span className="text-accent font-bold ml-1.5 shrink-0">
                                +{atk.bonus} ({atk.damage})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Short Rest & Long Rest Recovery */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleShortRest(char, e)}
                        className="px-2 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-[10px] text-oros-300 hover:text-white flex items-center justify-center gap-1 transition-colors font-mono"
                        title={`Spend 1 Hit Die to recover HP (${char.hitDiceRemaining}/${char.level} remaining)`}
                      >
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>Short Rest ({char.hitDiceRemaining}d)</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleLongRest(char, e)}
                        className="px-2 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-[10px] text-oros-300 hover:text-white flex items-center justify-center gap-1 transition-colors font-mono"
                        title="Full HP, Hit Dice, and Spell Slot recovery"
                      >
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Long Rest</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Action Bar: Deploy to Map & Open Sheet */}
                  <div className="pt-2.5 border-t border-oros-850 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeployToMap(char)
                      }}
                      className="px-2 py-1 rounded-[3px] bg-accent-muted text-accent border border-accent/40 hover:bg-accent hover:text-accent-contrast font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                      title="Place this adventurer token onto the tactical battlemap"
                    >
                      <MapIcon className="w-3 h-3" />
                      <span>Deploy on Map</span>
                    </button>

                    <div className="flex items-center gap-1 text-oros-400 group-hover:text-white font-medium text-[11px] transition-colors">
                      <span>Full 5e Sheet</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Quick Add Card */}
            <div
              onClick={() => setShowNewCharModal(true)}
              className="border border-dashed border-oros-800 hover:border-accent/60 bg-[#0e131d]/40 hover:bg-[#0e131d] rounded-[5px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all text-oros-400 hover:text-oros-200 group min-h-[260px]"
            >
              <div className="w-11 h-11 rounded-full bg-oros-900 border border-oros-750 flex items-center justify-center text-accent mb-2.5 group-hover:scale-110 transition-transform shadow-md">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-sm text-oros-200 group-hover:text-white">
                Create Adventurer Sheet
              </span>
              <span className="text-xs text-oros-500 mt-1 max-w-[200px]">
                New D&D 5e sheet with abilities, attacks, spells & inventory
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CAMPAIGN SESSION JOURNAL & DM NOTES */
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="relative rounded-[4px] border border-oros-800 bg-[#0e131d] overflow-hidden shadow-xl">
            {campaign?.bannerUrl && (
              <div className="h-44 w-full relative">
                <img
                  src={campaign.bannerUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/60 to-transparent" />
              </div>
            )}

            <div className="p-6 relative -mt-16 sm:-mt-20">
              <span className="inline-block px-2 py-0.5 rounded-[2px] bg-accent-muted text-accent border border-accent/40 font-mono text-[10px] uppercase font-bold tracking-widest mb-2">
                Campaign Codex
              </span>
              <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
                {campaign?.title}
              </h2>
              {campaign?.tagline && (
                <p className="text-sm text-oros-300 mt-1 font-sans italic">
                  "{campaign.tagline}"
                </p>
              )}
              {campaign?.description && (
                <p className="text-xs text-oros-400 mt-3 max-w-3xl leading-relaxed">
                  {campaign.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#0e131d] border border-oros-800 rounded-[4px] p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-oros-800 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="font-serif font-bold text-base text-white">
                  Session Log & Campaign Notes
                </h3>
              </div>

              {!isEditingNotes ? (
                <button
                  onClick={() => {
                    setSessionNotesInput(campaign?.sessionNotes || '')
                    setIsEditingNotes(true)
                  }}
                  className="px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-white border border-oros-750 text-xs flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Edit3 className="w-3 h-3 text-accent" />
                  <span>Edit Notes</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-2.5 py-1 rounded-[3px] bg-oros-950 text-oros-400 hover:text-oros-200 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1 rounded-[3px] btn-accent text-xs font-semibold"
                  >
                    Save Notes
                  </button>
                </div>
              )}
            </div>

            {!isEditingNotes ? (
              <p className="text-xs text-oros-300 leading-relaxed font-sans whitespace-pre-wrap min-h-[60px]">
                {campaign?.sessionNotes || 'No session notes recorded yet. Click "Edit Notes" to track party quest objectives, rumors, and campaign logs.'}
              </p>
            ) : (
              <textarea
                rows={8}
                value={sessionNotesInput}
                onChange={(e) => setSessionNotesInput(e.target.value)}
                placeholder="Record campaign recap, clues, loot distribution, and quest hooks..."
                className="w-full bg-oros-950 border border-oros-800 rounded-[3px] p-3 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent font-sans leading-relaxed"
              />
            )}
          </div>
        </div>
      )}

      {/* New Character Modal */}
      <NewCharacterModal
        campaignId={campaign.id}
        isOpen={showNewCharModal}
        onClose={() => setShowNewCharModal(false)}
        onCreated={(newChar) => {
          setActiveCharacterId(newChar.id)
        }}
      />
    </div>
  )
}
