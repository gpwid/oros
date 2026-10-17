import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { X, Plus, Compass } from 'lucide-react'
import { World } from '@shared/types'
import { THEME_PRESETS } from '../../utils/themeEngine'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const GENRE_PRESETS = [
  'Epic High Fantasy',
  'Sci-Fi / Space Opera',
  'Grimdark & Eldritch',
  'Cyberpunk & Tech-Noir',
  'Historical Mythos',
  'Solarpunk & Post-Apocalyptic',
  'Mystery & Urban Fantasy',
  'Speculative Fiction'
]

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { createWorld } = useWorldStore()
  const { addToast } = useToastStore()

  const [name, setName] = useState('')
  const [genre, setGenre] = useState('Epic High Fantasy')
  const [tagline, setTagline] = useState('')
  const [theme, setTheme] = useState<World['theme']>('sovereign')
  const [customAccent, setCustomAccent] = useState('#6366f1')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createWorld(
      name.trim(),
      tagline.trim(),
      genre.trim(),
      theme,
      theme === 'custom' ? customAccent : undefined
    )

    addToast(`Created project vault: ${name.trim()}`, 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-md shadow-2xl p-5 select-text text-oros-100 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-oros-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-accent" />
            <h3 className="font-sans font-semibold text-sm text-oros-100">
              Create New Worldbuilding Project
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Project Title */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">
              Project / World Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chronicles of Elyria, Neo-Vostok 2184"
              className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent transition-colors font-sans"
            />
          </div>

          {/* Setting / Genre */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">
              Setting & Genre
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {GENRE_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono transition-colors ${
                    genre === g 
                      ? 'bg-accent-muted border border-accent/40 text-accent font-semibold shadow-sm'
                      : 'bg-oros-950/80 border border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Custom Genre..."
              className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent transition-colors font-sans"
            />
          </div>

          {/* Atmospheric Accent Palette */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Atmospheric Accent Tint</span>
              <span className="text-[10px] text-oros-500 normal-case font-sans">Sets the UI aura for this project</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  className={`p-1.5 rounded-[3px] border flex items-center gap-1.5 transition-colors text-left ${
                    theme === t.id
                      ? 'bg-accent-muted border-accent text-accent font-semibold shadow-sm'
                      : 'bg-oros-950/80 border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: t.hex }} />
                  <span className="text-[10px] font-mono truncate">{t.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Custom Hex Option */}
            <div className="mt-2 pt-1.5 border-t border-oros-800/60 flex items-center gap-2">
              <span className="text-[10px] font-mono text-oros-400">Custom Accent:</span>
              <label 
                className={`w-5 h-5 rounded-[3px] border cursor-pointer overflow-hidden flex items-center justify-center shrink-0 shadow-sm ${
                  theme === 'custom' ? 'border-accent ring-1 ring-accent/40' : 'border-oros-700'
                }`}
                style={{ backgroundColor: customAccent }}
                title="Pick custom accent color"
              >
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => {
                    setCustomAccent(e.target.value)
                    setTheme('custom')
                  }}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
              <input
                type="text"
                maxLength={7}
                value={customAccent}
                onChange={(e) => {
                  setCustomAccent(e.target.value)
                  setTheme('custom')
                }}
                className="w-24 bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-0.5 text-[10px] font-mono text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Premise / Tagline */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">
              Premise & Synopsis (Optional)
            </label>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A brief summary or guiding theme of this universe..."
              className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent resize-none font-sans"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-oros-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[3px] text-xs font-medium text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors btn-interactive"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[3px] bg-white hover:bg-slate-200 text-oros-950 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-oros-950" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
