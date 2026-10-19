import React, { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, Image as ImageIcon, FileCode, FileText, Database, Loader2 } from 'lucide-react'

export interface ExportOption {
  id: string
  label: string
  badge: 'PNG' | 'SVG' | 'JSON' | 'CSV'
  icon?: React.FC<{ className?: string }>
  onClick: () => Promise<void> | void
}

interface ExportDropdownProps {
  options: ExportOption[]
  align?: 'left' | 'right'
  className?: string
  buttonClassName?: string
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  options,
  align = 'right',
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = async (opt: ExportOption) => {
    setIsOpen(false)
    setIsExporting(true)
    try {
      await opt.onClick()
    } finally {
      setIsExporting(false)
    }
  }

  const getDefaultIcon = (badge: ExportOption['badge']) => {
    switch (badge) {
      case 'PNG': return ImageIcon
      case 'SVG': return FileCode
      case 'JSON': return Database
      case 'CSV': return FileText
    }
  }

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || `px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer`}
        title="Export options (Image, Vector, Data)"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0" />
        )}
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown className="w-3 h-3 text-oros-500 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 w-52 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 z-50 animate-dropdown-in select-none`}
        >
          <div className="px-2.5 py-1 text-[9.5px] font-mono text-oros-500 uppercase tracking-wider font-semibold border-b border-oros-800/80 mb-0.5">
            Export Options
          </div>
          {options.map((opt) => {
            const Icon = opt.icon || getDefaultIcon(opt.badge)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between text-oros-300 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-oros-400 group-hover:text-accent transition-colors shrink-0" />
                  <span className="font-medium text-xs">{opt.label}</span>
                </div>
                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-oros-950 border border-oros-800 text-oros-400 group-hover:text-accent group-hover:border-accent/40 font-bold shrink-0">
                  {opt.badge}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
