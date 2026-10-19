import React, { useState, useEffect } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Dices, X, Minimize2, Maximize2, Trash2, Copy, 
  Check, Plus, Minus, Sparkles, Feather, RotateCcw
} from 'lucide-react'

interface DiceRollResult {
  id: string;
  formula: string;
  dice: { sides: number; value: number }[];
  modifier: number;
  total: number;
  isCritSuccess?: boolean;
  isCritFail?: boolean;
  timestamp: string;
  note?: string;
}

const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100]

export const DiceTrayHUD: React.FC = () => {
  const { 
    isDiceTrayOpen: isWorldDiceOpen, setDiceTrayOpen: setWorldDiceOpen,
    selectedChapterId, manuscripts, activeWorldId, updateChapter
  } = useWorldStore()

  const { addToast } = useToastStore()

  // Only open in world/writer mode; TTRPG uses its dedicated InteractiveDice3D
  const isDiceTrayOpen = isWorldDiceOpen

  const [isMinimized, setIsMinimized] = useState(false)
  const [modifier, setModifier] = useState<number>(0)
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal')
  const [customFormula, setCustomFormula] = useState('')
  const [isRolling, setIsRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null)
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([])

  const handleClose = () => {
    setWorldDiceOpen(false)
  }

  if (!isDiceTrayOpen) return null

  // Execute a die roll
  const rollDie = (sides: number, count = 1) => {
    setIsRolling(true)
    setTimeout(() => {
      let diceValues: { sides: number; value: number }[] = []
      let total = 0

      if (sides === 20 && count === 1 && advantageMode !== 'normal') {
        const roll1 = Math.floor(Math.random() * 20) + 1
        const roll2 = Math.floor(Math.random() * 20) + 1
        const chosen = advantageMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2)
        diceValues = [
          { sides: 20, value: roll1 },
          { sides: 20, value: roll2 }
        ]
        total = chosen + modifier
      } else {
        for (let i = 0; i < count; i++) {
          const val = Math.floor(Math.random() * sides) + 1
          diceValues.push({ sides, value: val })
          total += val
        }
        total += modifier
      }

      const isCritSuccess = sides === 20 && diceValues.some(d => d.value === 20)
      const isCritFail = sides === 20 && diceValues.some(d => d.value === 1)

      const modStr = modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` - ${Math.abs(modifier)}` : ''
      const advStr = advantageMode === 'advantage' ? ' (Advantage)' : advantageMode === 'disadvantage' ? ' (Disadvantage)' : ''
      const formula = `${count > 1 ? count : ''}d${sides}${modStr}${advStr}`

      const result: DiceRollResult = {
        id: `roll-${Date.now()}`,
        formula,
        dice: diceValues,
        modifier,
        total,
        isCritSuccess,
        isCritFail,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }

      setLastRoll(result)
      setRollHistory(prev => [result, ...prev.slice(0, 19)])
      setIsRolling(false)
    }, 200)
  }

  // Roll custom formula like "2d6 + 4"
  const rollCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customFormula.trim()) return

    const match = customFormula.trim().match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i)
    if (!match) {
      addToast('Invalid formula. Try "2d6", "1d20+5", "3d8-2"', 'error')
      return
    }

    const count = parseInt(match[1] || '1', 10)
    const sides = parseInt(match[2], 10)
    const sign = match[3] || '+'
    const mod = match[4] ? parseInt(match[4], 10) * (sign === '-' ? -1 : 1) : 0

    setIsRolling(true)
    setTimeout(() => {
      const diceValues: { sides: number; value: number }[] = []
      let sum = 0
      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1
        diceValues.push({ sides, value: val })
        sum += val
      }
      const total = sum + mod

      const result: DiceRollResult = {
        id: `roll-${Date.now()}`,
        formula: customFormula.trim(),
        dice: diceValues,
        modifier: mod,
        total,
        isCritSuccess: sides === 20 && diceValues.some(d => d.value === 20),
        isCritFail: sides === 20 && diceValues.some(d => d.value === 1),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }

      setLastRoll(result)
      setRollHistory(prev => [result, ...prev.slice(0, 19)])
      setIsRolling(false)
      setCustomFormula('')
    }, 200)
  }

  // Paste roll result to active Manuscript Prose
  const handlePasteToChapter = (result: DiceRollResult) => {
    const textSnippet = `\n<blockquote>🎲 <strong>${result.formula}</strong>: [${result.dice.map(d => d.value).join(', ')}] = <strong>${result.total}</strong>${result.isCritSuccess ? ' (Critical Success!)' : result.isCritFail ? ' (Critical Failure!)' : ''}</blockquote>\n`

    if (activeWorldId && selectedChapterId) {
      const chapters = manuscripts[activeWorldId] || []
      const ch = chapters.find(c => c.id === selectedChapterId)
      if (ch) {
        updateChapter(ch.id, `${ch.content || ''}${textSnippet}`)
        addToast(`Inserted roll into "${ch.title}"`, 'success')
        return
      }
    }

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(textSnippet)
    addToast('Copied roll result to clipboard', 'info')
  }

  return (
    <div className="fixed bottom-4 right-5 z-50 flex flex-col items-end select-none font-sans">
      <div className={`bg-[#0d121c]/95 backdrop-blur-md border border-oros-750/90 rounded-[5px] shadow-2xl overflow-hidden transition-all duration-200 flex flex-col ${
        isMinimized ? 'w-64 h-11' : 'w-80 max-h-[520px]'
      }`}>
        {/* Title Bar */}
        <div className="px-3.5 py-2.5 bg-oros-900 border-b border-oros-800 flex items-center justify-between cursor-move">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-accent" />
            <span className="font-serif font-bold text-xs text-oros-100 tracking-wide">
              Tabletop Dice HUD
            </span>
            {lastRoll && (
              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ${
                lastRoll.isCritSuccess 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : lastRoll.isCritFail
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-accent-muted text-accent'
              }`}>
                {lastRoll.total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-oros-400 hover:text-oros-200 p-1 rounded"
              title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={handleClose}
              className="text-oros-400 hover:text-rose-400 p-1 rounded"
              title="Close Dice HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content if not minimized */}
        {!isMinimized && (
          <div className="p-3.5 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin">
            {/* Last Roll Hero Banner */}
            {lastRoll && (
              <div className={`p-3 rounded-[4px] border flex items-center justify-between transition-all ${
                lastRoll.isCritSuccess
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : lastRoll.isCritFail
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-oros-950/80 border-oros-800 text-oros-100'
              }`}>
                <div>
                  <span className="font-mono text-[10px] text-oros-400 block">
                    {lastRoll.formula}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-2xl font-black tracking-tight">
                      {lastRoll.total}
                    </span>
                    <span className="font-mono text-[11px] text-oros-400">
                      [{lastRoll.dice.map(d => d.value).join(', ')}]
                    </span>
                  </div>
                  {lastRoll.isCritSuccess && (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      ★ Critical Hit!
                    </span>
                  )}
                  {lastRoll.isCritFail && (
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      ☠ Critical Failure
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handlePasteToChapter(lastRoll)}
                  title="Paste into active chapter prose"
                  className="px-2 py-1.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 text-oros-300 hover:text-accent border border-oros-750 flex items-center gap-1 text-[11px] font-medium transition-colors"
                >
                  <Feather className="w-3 h-3 text-accent" />
                  <span>Insert</span>
                </button>
              </div>
            )}

            {/* Polyhedral Dice Buttons */}
            <div>
              <span className="block font-mono text-[10px] uppercase font-bold text-oros-400 mb-1.5 tracking-wider">
                Polyhedral Dice Set
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {DIE_SIDES.map(sides => (
                  <button
                    key={sides}
                    disabled={isRolling}
                    onClick={() => rollDie(sides)}
                    className="p-2 rounded-[3px] font-mono text-xs font-bold bg-oros-900 hover:bg-accent hover:text-accent-contrast border border-oros-800 hover:border-accent text-oros-200 shadow-sm transition-all duration-150 flex flex-col items-center justify-center group active:scale-95"
                  >
                    <span className="group-hover:text-accent-contrast">d{sides}</span>
                  </button>
                ))}
                <button
                  disabled={isRolling}
                  onClick={() => rollDie(6, 2)}
                  className="p-2 rounded-[3px] font-mono text-xs font-bold bg-oros-900 hover:bg-accent hover:text-accent-contrast border border-oros-800 hover:border-accent text-oros-200 shadow-sm transition-all duration-150 flex flex-col items-center justify-center group active:scale-95"
                >
                  <span className="group-hover:text-accent-contrast">2d6</span>
                </button>
              </div>
            </div>

            {/* Modifiers & Advantage Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-oros-800/80">
              {/* Advantage Toggle for d20 */}
              <div className="flex rounded border border-oros-800 bg-oros-950 p-0.5 text-[10px] font-mono">
                <button
                  onClick={() => setAdvantageMode('normal')}
                  className={`px-1.5 py-0.5 rounded-[2px] ${advantageMode === 'normal' ? 'bg-oros-800 text-oros-100 font-bold' : 'text-oros-500'}`}
                >
                  Norm
                </button>
                <button
                  onClick={() => setAdvantageMode('advantage')}
                  className={`px-1.5 py-0.5 rounded-[2px] ${advantageMode === 'advantage' ? 'bg-emerald-900/60 text-emerald-300 font-bold' : 'text-oros-500'}`}
                  title="Advantage (roll 2d20, keep highest)"
                >
                  Adv
                </button>
                <button
                  onClick={() => setAdvantageMode('disadvantage')}
                  className={`px-1.5 py-0.5 rounded-[2px] ${advantageMode === 'disadvantage' ? 'bg-rose-950/60 text-rose-300 font-bold' : 'text-oros-500'}`}
                  title="Disadvantage (roll 2d20, keep lowest)"
                >
                  Dis
                </button>
              </div>

              {/* Modifier Stepper */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-[10px] text-oros-500 uppercase mr-1">Mod:</span>
                <button
                  onClick={() => setModifier(prev => prev - 1)}
                  className="w-5 h-5 rounded bg-oros-900 border border-oros-800 text-oros-300 hover:text-oros-100 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-6 text-center text-oros-200 font-bold text-[11px]">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>
                <button
                  onClick={() => setModifier(prev => prev + 1)}
                  className="w-5 h-5 rounded bg-oros-900 border border-oros-800 text-oros-300 hover:text-oros-100 flex items-center justify-center"
                >
                  +
                </button>
                {modifier !== 0 && (
                  <button
                    onClick={() => setModifier(0)}
                    title="Reset modifier"
                    className="text-oros-500 hover:text-oros-300 p-0.5 ml-0.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Formula Input */}
            <form onSubmit={rollCustom} className="flex gap-1.5">
              <input
                type="text"
                value={customFormula}
                onChange={(e) => setCustomFormula(e.target.value)}
                placeholder="Formula (e.g. 2d6+4, 1d20+7)..."
                className="flex-1 bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-oros-800 hover:bg-oros-700 text-oros-100 border border-oros-700 transition-colors"
              >
                Roll
              </button>
            </form>

            {/* Recent History Feed */}
            {rollHistory.length > 0 && (
              <div className="pt-2 border-t border-oros-800/80">
                <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-oros-500 uppercase">
                  <span>Recent Rolls</span>
                  <button
                    onClick={() => setRollHistory([])}
                    className="hover:text-rose-400"
                    title="Clear history"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                  {rollHistory.map(roll => (
                    <div
                      key={roll.id}
                      className="px-2 py-1 rounded bg-oros-950/70 border border-oros-850 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-oros-400">{roll.formula}:</span>
                        <span className="font-bold text-oros-100">{roll.total}</span>
                        <span className="text-[10px] text-oros-600">[{roll.dice.map(d => d.value).join(',')}]</span>
                      </div>
                      <button
                        onClick={() => handlePasteToChapter(roll)}
                        title="Insert into prose"
                        className="text-oros-500 hover:text-accent p-0.5 shrink-0"
                      >
                        <Feather className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
