import React, { useState, useEffect, useRef } from 'react'
import { 
  Dices, X, Sparkles, RotateCcw, Volume2, VolumeX, 
  ChevronUp, ChevronDown, Check, Trash2, Copy, Flame, Skull
} from 'lucide-react'
import { useTtrpgStore, DiceRollResult } from '../../store/useTtrpgStore'
import { useToastStore } from '../../store/useToastStore'

interface InteractiveDice3DProps {
  isOpen: boolean
  onClose: () => void
  onRollComplete?: (result: DiceRollResult) => void
}

type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100

// Procedural audio synthesizer for physical dice clattering using Web Audio API
const playDiceSound = (isCrit = false, isCritFail = false) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    // 3 rapid percussion clicks simulating dice tumbling on felt/wood
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const delay = i * 0.08

      osc.type = i === 3 && isCrit ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(isCrit ? 880 + i * 110 : isCritFail ? 140 - i * 20 : 320 + Math.random() * 220, ctx.currentTime + delay)

      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + (isCrit ? 0.35 : 0.09))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + (isCrit ? 0.4 : 0.1))
    }
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

export const InteractiveDice3D: React.FC<InteractiveDice3DProps> = ({
  isOpen,
  onClose,
  onRollComplete
}) => {
  const { executeRoll, diceHistory, clearRollHistory } = useTtrpgStore()
  const { addToast } = useToastStore()

  const [selectedDie, setSelectedDie] = useState<DieType>(20)
  const [diceCount, setDiceCount] = useState<number>(1)
  const [modifier, setModifier] = useState<number>(0)
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal')
  const [isRolling, setIsRolling] = useState(false)
  const [displayValue, setDisplayValue] = useState<number>(20)
  const [currentResult, setCurrentResult] = useState<DiceRollResult | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Dice geometric presets and labels
  const DIE_CONFIGS: { type: DieType; label: string; color: string; bg: string }[] = [
    { type: 4, label: 'd4', color: '#38bdf8', bg: 'bg-sky-950/60' },
    { type: 6, label: 'd6', color: '#10b981', bg: 'bg-emerald-950/60' },
    { type: 8, label: 'd8', color: '#a855f7', bg: 'bg-purple-950/60' },
    { type: 10, label: 'd10', color: '#06b6d4', bg: 'bg-cyan-950/60' },
    { type: 12, label: 'd12', color: '#f59e0b', bg: 'bg-amber-950/60' },
    { type: 20, label: 'd20', color: '#f5c542', bg: 'bg-yellow-950/60' },
    { type: 100, label: 'd100', color: '#f43f5e', bg: 'bg-rose-950/60' },
  ]

  // Roll execution with physical tumbling animation
  const handleRoll = (dieType: DieType = selectedDie) => {
    if (isRolling) return
    setIsRolling(true)
    setSelectedDie(dieType)

    let rolls: number[] = []
    let finalTotal = 0
    let isCritSuccess = false
    let isCritFail = false

    if (dieType === 20 && advantageMode !== 'normal') {
      const r1 = Math.floor(Math.random() * 20) + 1
      const r2 = Math.floor(Math.random() * 20) + 1
      const chosen = advantageMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2)
      rolls = [r1, r2]
      finalTotal = chosen + modifier
      isCritSuccess = chosen === 20
      isCritFail = chosen === 1
    } else {
      for (let i = 0; i < diceCount; i++) {
        const val = Math.floor(Math.random() * dieType) + 1
        rolls.push(val)
        finalTotal += val
      }
      finalTotal += modifier
      if (dieType === 20 && diceCount === 1) {
        isCritSuccess = rolls[0] === 20
        isCritFail = rolls[0] === 1
      }
    }

    if (soundEnabled) {
      playDiceSound(isCritSuccess, isCritFail)
    }

    // Scramble numbers rapidly during the tumble (40ms ticks)
    let ticks = 0
    const interval = setInterval(() => {
      ticks++
      setDisplayValue(Math.floor(Math.random() * dieType) + 1)
      if (ticks > 14) {
        clearInterval(interval)
        const primaryNumber = dieType === 20 && advantageMode !== 'normal'
          ? (advantageMode === 'advantage' ? Math.max(rolls[0], rolls[1]) : Math.min(rolls[0], rolls[1]))
          : rolls[0]

        setDisplayValue(primaryNumber)
        setIsRolling(false)

        const rollResult: DiceRollResult = {
          id: `roll-${Date.now()}`,
          label: `${diceCount}${DIE_CONFIGS.find(d => d.type === dieType)?.label || `d${dieType}`}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}${advantageMode !== 'normal' ? ` (${advantageMode === 'advantage' ? 'ADV' : 'DIS'})` : ''}`,
          diceNotation: `${diceCount}d${dieType}`,
          individualRolls: rolls,
          modifier,
          total: finalTotal,
          isCritSuccess,
          isCritFail,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }

        setCurrentResult(rollResult)
        executeRoll(rollResult.label, `${diceCount}d${dieType}`, modifier)
        if (onRollComplete) onRollComplete(rollResult)
      }
    }, 40)
  }

  // Render authentic geometric SVG polygon based on polyhedral die type
  const renderDieGeometry = (type: DieType, value: number, tumbling: boolean) => {
    const isCrit = type === 20 && value === 20
    const isFail = type === 20 && value === 1

    return (
      <div 
        className={`relative w-28 h-28 flex items-center justify-center transition-all select-none ${
          tumbling ? 'animate-bounce scale-105' : 'scale-100'
        }`}
        style={{
          transform: tumbling ? `rotate(${Math.sin(Date.now() / 50) * 25}deg)` : 'none'
        }}
      >
        {/* Glow backdrop for Crits */}
        {isCrit && !tumbling && (
          <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl animate-pulse" />
        )}
        {isFail && !tumbling && (
          <div className="absolute inset-0 rounded-full bg-rose-600/30 blur-xl animate-pulse" />
        )}

        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isCrit ? '#f59e0b' : isFail ? '#ef4444' : '#1e293b'} />
              <stop offset="100%" stopColor={isCrit ? '#b45309' : isFail ? '#991b1b' : '#0f172a'} />
            </linearGradient>
            <filter id="bevel">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* D4: Equilateral Triangle / Tetrahedron */}
          {type === 4 && (
            <g filter="url(#bevel)">
              <polygon points="50,10 90,85 10,85" fill={`url(#grad-${type})`} stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="50" y1="10" x2="50" y2="60" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="10" y1="85" x2="50" y2="60" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="90" y1="85" x2="50" y2="60" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
            </g>
          )}

          {/* D6: Isometric 3D Cube */}
          {type === 6 && (
            <g filter="url(#bevel)">
              {/* Top face */}
              <polygon points="50,15 85,32 50,50 15,32" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              {/* Left face */}
              <polygon points="15,32 50,50 50,85 15,68" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              {/* Right face */}
              <polygon points="85,32 50,50 50,85 85,68" fill="#132337" stroke="#10b981" strokeWidth="2" />
            </g>
          )}

          {/* D8: Octahedron (Diamond Facets) */}
          {type === 8 && (
            <g filter="url(#bevel)">
              <polygon points="50,8 88,50 50,92 12,50" fill={`url(#grad-${type})`} stroke="#a855f7" strokeWidth="2" />
              <polygon points="50,8 88,50 50,50" fill="#2e1065" fillOpacity="0.4" stroke="#a855f7" strokeWidth="1" />
              <polygon points="50,8 12,50 50,50" fill="#3b0764" fillOpacity="0.6" stroke="#a855f7" strokeWidth="1" />
              <polygon points="50,92 88,50 50,50" fill="#1e1b4b" fillOpacity="0.5" stroke="#a855f7" strokeWidth="1" />
              <polygon points="50,92 12,50 50,50" fill="#172554" fillOpacity="0.7" stroke="#a855f7" strokeWidth="1" />
            </g>
          )}

          {/* D10: Pentagonal Trapezohedron */}
          {type === 10 && (
            <g filter="url(#bevel)">
              <polygon points="50,8 88,42 50,92 12,42" fill={`url(#grad-${type})`} stroke="#06b6d4" strokeWidth="2" />
              <line x1="50" y1="8" x2="50" y2="92" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="12" y1="42" x2="88" y2="42" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" />
            </g>
          )}

          {/* D12: Dodecahedron (Pentagon Facet) */}
          {type === 12 && (
            <g filter="url(#bevel)">
              <polygon points="50,10 88,38 73,88 27,88 12,38" fill={`url(#grad-${type})`} stroke="#f59e0b" strokeWidth="2.5" />
              {/* Inner pentagon facet */}
              <polygon points="50,32 70,48 62,72 38,72 30,48" fill="#1c1917" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.6" />
            </g>
          )}

          {/* D20: 20-Sided Icosahedron */}
          {type === 20 && (
            <g filter="url(#bevel)">
              <polygon 
                points="50,8 88,30 88,70 50,92 12,70 12,30" 
                fill={`url(#grad-${type})`} 
                stroke={isCrit ? '#fbbf24' : isFail ? '#f87171' : '#f5c542'} 
                strokeWidth="2.5" 
              />
              {/* Facet lines */}
              <polygon points="50,8 88,30 50,38" fill="#fbbf24" fillOpacity="0.1" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="50,8 12,30 50,38" fill="#fbbf24" fillOpacity="0.2" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="50,38 88,30 88,70 50,68" fill="#000" fillOpacity="0.25" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="50,38 12,30 12,70 50,68" fill="#000" fillOpacity="0.35" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="50,68 88,70 50,92" fill="#fbbf24" fillOpacity="0.15" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="50,68 12,70 50,92" fill="#fbbf24" fillOpacity="0.25" stroke="#f5c542" strokeWidth="1" strokeOpacity="0.4" />
            </g>
          )}

          {/* D100: Percentile Dice */}
          {type === 100 && (
            <g filter="url(#bevel)">
              <circle cx="50" cy="50" r="42" fill={`url(#grad-${type})`} stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6" />
            </g>
          )}

          {/* Die Face Number Value */}
          <text
            x="50"
            y={type === 4 ? 62 : 55}
            textAnchor="middle"
            dominantBaseline="central"
            className={`font-mono font-bold select-none drop-shadow-md transition-all ${
              isCrit ? 'fill-amber-300 text-3xl' : isFail ? 'fill-rose-300 text-3xl' : 'fill-white text-2xl'
            }`}
          >
            {value}
          </text>
        </svg>

        {/* Critical Banner Indicators */}
        {isCrit && !tumbling && (
          <div className="absolute -top-3 px-2 py-0.5 rounded-[2px] bg-amber-500 text-black font-mono text-[9px] font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-1 animate-bounce">
            <Flame className="w-2.5 h-2.5" />
            <span>NAT 20!</span>
          </div>
        )}
        {isFail && !tumbling && (
          <div className="absolute -top-3 px-2 py-0.5 rounded-[2px] bg-rose-600 text-white font-mono text-[9px] font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
            <Skull className="w-2.5 h-2.5" />
            <span>NAT 1!</span>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-5 right-5 w-80 bg-[#0c1017] border border-oros-700 rounded-[6px] shadow-2xl p-4 z-50 text-xs font-sans text-oros-100 animate-fade-in space-y-3.5 select-none"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-oros-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-accent" />
          <span className="font-serif font-bold text-sm text-white">Tactical Dice Roller</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded text-oros-400 hover:text-oros-200 transition-colors"
            title={soundEnabled ? 'Mute Dice Clatter' : 'Enable Dice Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-accent" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-oros-400 hover:text-oros-200 transition-colors"
            title="Close Dice Roller"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Polyhedral Dice Selector Grid */}
      <div>
        <span className="block text-[10px] font-mono uppercase text-oros-400 mb-1.5">Select Polyhedral Die</span>
        <div className="grid grid-cols-7 gap-1">
          {DIE_CONFIGS.map((die) => (
            <button
              key={die.type}
              type="button"
              onClick={() => handleRoll(die.type)}
              className={`py-1.5 px-1 rounded-[3px] border font-mono font-bold text-xs flex flex-col items-center gap-0.5 transition-all ${
                selectedDie === die.type
                  ? 'border-accent text-accent bg-accent/20 shadow-sm scale-105'
                  : 'border-oros-800 text-oros-300 bg-oros-900/80 hover:bg-oros-850 hover:text-white'
              }`}
              title={`Roll ${die.label}`}
            >
              <span>{die.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 3D Dice Stage & Roll Animation */}
      <div className="py-2 flex flex-col items-center justify-center bg-[#06080d] border border-oros-850 rounded-[4px] relative overflow-hidden min-h-[140px]">
        {renderDieGeometry(selectedDie, displayValue, isRolling)}

        {/* Current Result Breakdown */}
        {currentResult && !isRolling && (
          <div className="mt-2 text-center animate-fade-in">
            <span className="text-[10px] font-mono text-oros-400">
              {currentResult.label} = [{currentResult.individualRolls.join(', ')}]
              {currentResult.modifier !== 0 && ` ${currentResult.modifier > 0 ? `+ ${currentResult.modifier}` : `- ${Math.abs(currentResult.modifier)}`}`}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 leading-tight">
              Total: {currentResult.total}
            </div>
          </div>
        )}
      </div>

      {/* Roll Controls: Count, Modifier, Advantage */}
      <div className="grid grid-cols-3 gap-2 bg-oros-950 p-2 rounded-[3px] border border-oros-800 text-center text-xs font-mono">
        {/* Dice Count */}
        <div>
          <span className="block text-[9px] uppercase text-oros-500">Count</span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
              className="w-4 h-4 rounded bg-oros-900 text-oros-300 hover:text-white flex items-center justify-center"
            >
              -
            </button>
            <span className="font-bold text-white min-w-[16px]">{diceCount}d</span>
            <button
              type="button"
              onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
              className="w-4 h-4 rounded bg-oros-900 text-oros-300 hover:text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Modifier */}
        <div>
          <span className="block text-[9px] uppercase text-oros-500">Modifier</span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setModifier(modifier - 1)}
              className="w-4 h-4 rounded bg-oros-900 text-oros-300 hover:text-white flex items-center justify-center"
            >
              -
            </button>
            <span className="font-bold text-sky-400 min-w-[20px]">{modifier >= 0 ? `+${modifier}` : modifier}</span>
            <button
              type="button"
              onClick={() => setModifier(modifier + 1)}
              className="w-4 h-4 rounded bg-oros-900 text-oros-300 hover:text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Advantage Mode (d20 only) */}
        <div>
          <span className="block text-[9px] uppercase text-oros-500">Check</span>
          <select
            value={advantageMode}
            onChange={(e) => setAdvantageMode(e.target.value as any)}
            className="w-full bg-oros-900 border border-oros-800 rounded px-1 py-0.5 text-[10px] text-oros-200 mt-0.5 focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="advantage">Advantage</option>
            <option value="disadvantage">Disadvantage</option>
          </select>
        </div>
      </div>

      {/* Main Roll Action Button */}
      <button
        type="button"
        disabled={isRolling}
        onClick={() => handleRoll()}
        className="w-full py-2 rounded-[3px] btn-accent text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Roll {diceCount}d{selectedDie}{modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}</span>
      </button>

      {/* Recent Rolls History Feed */}
      {diceHistory.length > 0 && (
        <div className="border-t border-oros-800 pt-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-oros-400">
            <span>Roll Log ({diceHistory.length})</span>
            <button
              type="button"
              onClick={clearRollHistory}
              className="hover:text-rose-400 transition-colors"
              title="Clear Log"
            >
              Clear
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px] pr-1">
            {diceHistory.slice(0, 5).map((roll) => (
              <div 
                key={roll.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-oros-950/70 border border-oros-850"
              >
                <div className="truncate mr-2">
                  <span className="text-oros-300 font-semibold">{roll.label}</span>
                  {roll.characterName && <span className="text-oros-500 ml-1">({roll.characterName})</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`font-bold ${
                    roll.isCritSuccess ? 'text-amber-400' : roll.isCritFail ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {roll.total}
                  </span>
                  <span className="text-[8px] text-oros-600">{roll.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
