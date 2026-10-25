import React, { useState, useEffect } from 'react'
import { X, Dices, Layers, Sparkles, Edit3 } from 'lucide-react'
import { TTRPGSystem, TTRPGCampaign } from '@shared/types'
import { useTtrpgStore } from '../../store/useTtrpgStore'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'

interface NewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (campaignId: string) => void
  campaignToEdit?: TTRPGCampaign | null
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  campaignToEdit
}) => {
  const { createCampaign, updateCampaign } = useTtrpgStore()
  const { worlds } = useWorldStore()
  const { addToast } = useToastStore()

  const [title, setTitle] = useState('')
  const [system, setSystem] = useState<TTRPGSystem>('dnd5e')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [linkedWorldId, setLinkedWorldId] = useState<string>(worlds[0]?.id || '')

  useEffect(() => {
    if (campaignToEdit) {
      setTitle(campaignToEdit.title || '')
      setSystem(campaignToEdit.system || 'dnd5e')
      setTagline(campaignToEdit.tagline || '')
      setDescription(campaignToEdit.description || '')
      setLinkedWorldId(campaignToEdit.linkedWorldId || '')
    } else {
      setTitle('')
      setSystem('dnd5e')
      setTagline('')
      setDescription('')
      setLinkedWorldId(worlds[0]?.id || '')
    }
  }, [campaignToEdit, isOpen, worlds])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      addToast('Campaign title is required', 'error')
      return
    }

    if (campaignToEdit) {
      updateCampaign(campaignToEdit.id, {
        title: title.trim(),
        system,
        tagline: tagline.trim(),
        description: description.trim(),
        linkedWorldId: linkedWorldId || undefined
      })
      addToast(`Updated campaign: ${title.trim()}`, 'success')
      onClose()
      return
    }

    const camp = createCampaign(
      title.trim(),
      system,
      tagline.trim(),
      description.trim(),
      linkedWorldId || undefined
    )

    addToast(`Created campaign: ${camp.title}`, 'success')
    onCreated?.(camp.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-oros-900 border border-oros-750 rounded-[4px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Pinned Header */}
        <div className="shrink-0 border-b border-oros-750 bg-oros-950/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {campaignToEdit ? (
              <Edit3 className="w-4 h-4 text-accent" />
            ) : (
              <Dices className="w-4 h-4 text-accent" />
            )}
            <h2 className="font-serif font-bold text-base text-white">
              {campaignToEdit ? 'Edit TTRPG Campaign' : 'Create New TTRPG Campaign'}
            </h2>
          </div>
          <button onClick={onClose} className="text-oros-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body & Pinned Footer within Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 text-xs font-sans">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-oros-400 mb-1">Campaign Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shadows of Ostergard, Tomb of the Bitter Sands"
                className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Ruleset / Game System</label>
                <select
                  value={system}
                  onChange={(e) => setSystem(e.target.value as TTRPGSystem)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                >
                  <option value="dnd5e">D&D 5th Edition (D&D 5e)</option>
                  <option value="pathfinder2e">Pathfinder 2e</option>
                  <option value="generic">Generic / System Agnostic</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-oros-400 mb-1">Link to World Vault</label>
                <select
                  value={linkedWorldId}
                  onChange={(e) => setLinkedWorldId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                >
                  <option value="">None (Independent Game)</option>
                  {worlds.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-oros-400 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. A grim low-magic mystery of succession and drowned kings"
                className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-oros-400 mb-1">Campaign Premise / Synopsis</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the campaign world, stakes, and opening situation..."
                className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-600 focus:outline-none focus:border-accent"
              />
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
              {campaignToEdit ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
