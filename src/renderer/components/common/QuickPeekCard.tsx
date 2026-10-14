import React from 'react'
import { LoreEntity } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { ExternalLink, Tag, Shield, Sparkles } from 'lucide-react'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'

interface QuickPeekCardProps {
  entity: LoreEntity;
  onClose?: () => void;
  onOpenWiki?: () => void;
}

export const QuickPeekCard: React.FC<QuickPeekCardProps> = ({ entity, onClose, onOpenWiki }) => {
  const { setSelectedEntityId, openTab, categories, activeWorldId } = useWorldStore()

  const worldCategories = (activeWorldId && categories[activeWorldId]) ? categories[activeWorldId] : DEFAULT_PRESET_CATEGORIES
  const catMeta = getCategoryMeta(entity.type, worldCategories)
  const CatIcon = getCategoryIconComponent(catMeta.icon)

  const handleOpen = () => {
    setSelectedEntityId(entity.id)
    openTab({
      title: entity.title,
      type: 'wiki',
      targetId: entity.id
    })
    if (onOpenWiki) onOpenWiki()
    if (onClose) onClose()
  }

  // Extract up to 3 key fields from infobox
  const keyFields = entity.infobox.sections[0]?.fields.slice(0, 3) || []

  return (
    <div className="w-80 bg-oros-900 border border-oros-700/80 rounded-2xl shadow-2xl overflow-hidden select-text animate-in fade-in zoom-in-95 duration-150 z-50 text-xs">
      {/* Top Banner / Avatar */}
      <div className="relative h-28 bg-oros-950 overflow-hidden">
        {entity.avatar ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-oros-900 to-oros-800 flex items-center justify-center text-oros-600">
            <Sparkles className="w-8 h-8 opacity-40 text-gold-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-oros-900 via-transparent to-transparent"></div>
        <span 
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider backdrop-blur-sm border font-semibold flex items-center gap-1 shadow-sm"
          style={{
            backgroundColor: 'rgba(2, 6, 23, 0.90)',
            borderColor: `${catMeta.color || '#eab308'}60`,
            color: catMeta.color || '#eab308'
          }}
        >
          <CatIcon className="w-3 h-3" />
          <span>{catMeta.name}</span>
        </span>
      </div>

      {/* Card Content */}
      <div className="p-4 pt-1">
        <h4 className="font-serif font-bold text-base text-slate-100 leading-snug">
          {entity.title}
        </h4>
        {entity.infobox.subtitle && (
          <p className="text-[11px] text-gold-400/90 font-medium mt-0.5 mb-2">
            {entity.infobox.subtitle}
          </p>
        )}

        <p className="text-xs text-oros-300 line-clamp-3 leading-relaxed mb-3">
          {entity.summary || 'No summary recorded in codex.'}
        </p>

        {/* Key Attributes */}
        {keyFields.length > 0 && (
          <div className="space-y-1 mb-3 pt-2 border-t border-oros-800/60 text-[11px]">
            {keyFields.map((f) => (
              <div key={f.id} className="flex justify-between text-oros-400">
                <span>{f.label}:</span>
                <span className="text-slate-200 font-medium truncate max-w-[140px]">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entity.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-oros-800/80 text-oros-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleOpen}
          className="w-full py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
        >
          <span>Open Full Article in Wiki</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
