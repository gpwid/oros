import React, { useState } from 'react'
import { X, Shield, Swords, Sparkles, User } from 'lucide-react'
import { Dnd5eCharacter } from '@shared/types'
import { useTtrpgStore } from '../../store/useTtrpgStore'
import { useToastStore } from '../../store/useToastStore'

interface NewCharacterModalProps {
  campaignId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (character: Dnd5eCharacter) => void
}

const DND_CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 
  'Warlock', 'Wizard'
]

const DND_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Half-Elf', 
  'Half-Orc', 'Tiefling', 'Dragonborn', 'Gnome'
]

export const NewCharacterModal: React.FC<NewCharacterModalProps> = ({
  campaignId,
  isOpen,
  onClose,
  onCreated
}) => {
  const { createCharacter } = useTtrpgStore()
  const { addToast } = useToastStore()

  const [name, setName] = useState('')
  const [characterClass, setCharacterClass] = useState('Fighter')
  const [subclass, setSubclass] = useState('')
  const [race, setRace] = useState('Human')
  const [level, setLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [background, setBackground] = useState('Folk Hero')
  const [alignment, setAlignment] = useState('Neutral Good')

  // Ability scores (Standard Array: 15, 14, 13, 12, 10, 8)
  const [str, setStr] = useState(15)
  const [dex, setDex] = useState(14)
  const [con, setCon] = useState(13)
  const [int, setInt] = useState(12)
  const [wis, setWis] = useState(10)
  const [cha, setCha] = useState(8)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      addToast('Character name is required', 'error')
      return
    }

    // Base HP based on class hit die + CON mod
    const hitDieMap: Record<string, number> = {
      Barbarian: 12,
      Fighter: 10, Paladin: 10, Ranger: 10,
      Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
      Sorcerer: 6, Wizard: 6
    }
    const die = hitDieMap[characterClass] || 8
    const conMod = Math.floor((con - 10) / 2)
    const dexMod = Math.floor((dex - 10) / 2)
    const baseHp = die + conMod + Math.max(0, (level - 1) * (Math.floor(die / 2) + 1 + conMod))
    const baseAc = 10 + dexMod

    const char = createCharacter(campaignId, {
      name: name.trim(),
      playerName: playerName.trim() || undefined,
      characterClass,
      subclass: subclass.trim() || undefined,
      race,
      level,
      background,
      alignment,
      armorClass: baseAc,
      speed: 30,
      hpMax: Math.max(1, baseHp),
      hpCurrent: Math.max(1, baseHp),
      hitDice: `${level}d${die}`,
      hitDiceRemaining: level,
      abilities: {
        strength: str,
        dexterity: dex,
        constitution: con,
        intelligence: int,
        wisdom: wis,
        charisma: cha
      },
      savingThrowProficiencies: characterClass === 'Fighter' ? ['strength', 'constitution'] : ['dexterity', 'intelligence'],
      currency: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 }
    })

    addToast(`Created character: ${char.name}`, 'success')
    onCreated(char)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-oros-900 border border-oros-750 rounded-[4px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Pinned Header */}
        <div className="shrink-0 border-b border-oros-750 bg-oros-950/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-serif font-bold text-base text-white">
              Create D&D 5e Character Sheet
            </h2>
          </div>
          <button onClick={onClose} className="text-oros-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body & Pinned Footer within Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 text-xs font-sans">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Character Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Thorin Oakshield, Sylvanas"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Player Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Class, Subclass, Race & Level */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Class</label>
                <select
                  value={characterClass}
                  onChange={(e) => setCharacterClass(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                >
                  {DND_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Subclass</label>
                <input
                  type="text"
                  value={subclass}
                  onChange={(e) => setSubclass(e.target.value)}
                  placeholder="e.g. Champion, Thief"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Race</label>
                <select
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                >
                  {DND_RACES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Level (1-20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Ability Scores */}
            <div className="bg-oros-950/70 border border-oros-800 rounded-[3px] p-3 space-y-2">
              <span className="block font-mono text-[10px] uppercase font-bold text-oros-400 tracking-wider">
                Ability Scores (Standard Array)
              </span>
              <div className="grid grid-cols-6 gap-2 text-center font-mono">
                {[
                  { label: 'STR', val: str, set: setStr },
                  { label: 'DEX', val: dex, set: setDex },
                  { label: 'CON', val: con, set: setCon },
                  { label: 'INT', val: int, set: setInt },
                  { label: 'WIS', val: wis, set: setWis },
                  { label: 'CHA', val: cha, set: setCha }
                ].map((ab) => (
                  <div key={ab.label} className="bg-oros-900 border border-oros-800 rounded-[2px] p-1.5">
                    <span className="block text-[10px] text-oros-500 font-bold mb-1">{ab.label}</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={ab.val}
                      onChange={(e) => ab.set(Number(e.target.value))}
                      className="w-full bg-oros-950 border border-oros-750 text-center rounded-[2px] py-1 text-xs text-oros-100 font-bold focus:outline-none focus:border-accent"
                    />
                    <span className="block text-[10px] text-accent mt-0.5 font-bold">
                      {Math.floor((ab.val - 10) / 2) >= 0 ? `+${Math.floor((ab.val - 10) / 2)}` : Math.floor((ab.val - 10) / 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="shrink-0 border-t border-oros-750 bg-oros-950/60 p-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 text-oros-400 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold shadow-sm"
            >
              Generate Character Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
