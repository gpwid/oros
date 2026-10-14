import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, 
  Search, LayoutGrid, BookOpen, Layers, Users, Clock, 
  Map as MapIcon, Feather, Trash2, Edit2, MoreVertical,
  FolderPlus, FilePlus
} from 'lucide-react'
import { DirectoryItem, DirectoryFolder, DirectoryItemType } from '@shared/types'

export const Sidebar: React.FC = () => {
  const { 
    activeWorldId, folders, directoryItems, openTab,
    createFolder, renameFolder, deleteFolder, toggleFolderOpen,
    createDirectoryItem, deleteDirectoryItem,
    createCanvas, createEntity, createMap,
    entities, maps, timelines, relations, manuscripts
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [searchFilter, setSearchFilter] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)
  const [folderContextMenu, setFolderContextMenu] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')

  const worldId = activeWorldId || 'world-aethelgard'
  const currentFolders = folders[worldId] || []
  const currentItems = directoryItems[worldId] || []

  // Filter items based on search
  const filteredItems = currentItems.filter((item) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const getItemIcon = (type: DirectoryItemType) => {
    switch (type) {
      case 'canvas':
        return <LayoutGrid className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'wiki':
        return <BookOpen className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'card':
        return <Layers className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'relations':
        return <Users className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'timeline':
        return <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'map':
        return <MapIcon className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'writer':
        return <Feather className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      default:
        return <LayoutGrid className="w-3.5 h-3.5 text-gold-400 shrink-0" />
    }
  }

  const handleItemClick = (item: DirectoryItem) => {
    openTab({
      title: item.name,
      type: item.type,
      targetId: item.targetId
    })
  }

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim(), newFolderParentId)
    setShowNewFolderModal(false)
    setNewFolderName('')
    setNewFolderParentId(null)
    addToast(`Created folder "${newFolderName.trim()}"`, 'success')
  }

  const handleRenameFolderSubmit = (folderId: string) => {
    if (!editingFolderName.trim()) {
      setEditingFolderId(null)
      return
    }
    renameFolder(folderId, editingFolderName.trim())
    setEditingFolderId(null)
    setEditingFolderName('')
    addToast('Folder renamed', 'info')
  }

  const handleQuickCreateDoc = (type: DirectoryItemType, folderId: string | null = null) => {
    switch (type) {
      case 'canvas': {
        const c = createCanvas(`Canvas ${Date.now().toString().slice(-4)}`, folderId)
        addToast(`Created Whiteboard: ${c.name}`, 'success')
        break
      }
      case 'wiki': {
        const ent = createEntity('character', 'New Wiki Entry')
        createDirectoryItem(ent.title, 'wiki', folderId, ent.id)
        openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
        addToast('Created new Wiki entry', 'success')
        break
      }
      case 'relations': {
        const item = createDirectoryItem('Lineage Tree', 'relations', folderId)
        openTab({ title: item.name, type: 'relations' })
        addToast('Created Relation Tree view', 'success')
        break
      }
      case 'timeline': {
        const item = createDirectoryItem('Timeline', 'timeline', folderId)
        openTab({ title: item.name, type: 'timeline' })
        addToast('Created Chronology Timeline', 'success')
        break
      }
      case 'card': {
        const item = createDirectoryItem('Lore Cards', 'card', folderId)
        openTab({ title: item.name, type: 'card' })
        break
      }
      case 'map': {
        const item = createDirectoryItem('Cartography', 'map', folderId)
        openTab({ title: item.name, type: 'map' })
        break
      }
      case 'writer': {
        const item = createDirectoryItem('Studio Manuscript', 'writer', folderId)
        openTab({ title: item.name, type: 'writer' })
        break
      }
    }
  }

  // Recursive folder renderer
  const renderFolder = (folder: DirectoryFolder, depth = 0) => {
    const isEditing = editingFolderId === folder.id
    const itemsInFolder = filteredItems.filter((i) => i.folderId === folder.id)
    const subfolders = currentFolders.filter((f) => f.parentId === folder.id)

    return (
      <div key={folder.id} className="select-none text-xs">
        {/* Folder Header Row */}
        <div 
          className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-oros-900/70 text-slate-300 hover:text-white transition-colors cursor-pointer"
          style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
          onClick={() => toggleFolderOpen(folder.id)}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolderOpen(folder.id)
              }}
              className="text-oros-400 hover:text-slate-100 p-0.5"
            >
              {folder.isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {folder.isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-gold-400/80 shrink-0" />
            )}

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onBlur={() => handleRenameFolderSubmit(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFolderSubmit(folder.id)
                  if (e.key === 'Escape') setEditingFolderId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-oros-950 border border-gold-400/80 rounded px-1.5 py-0.5 text-xs text-white outline-none w-32"
              />
            ) : (
              <span className="truncate font-medium text-slate-200">{folder.name}</span>
            )}
          </div>

          {/* Folder Hover Actions */}
          <div 
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Doc in Folder */}
            <button
              onClick={() => handleQuickCreateDoc('canvas', folder.id)}
              className="p-1 rounded hover:bg-oros-800 text-oros-400 hover:text-gold-400"
              title="Add Canvas in folder"
            >
              <Plus className="w-3 h-3" />
            </button>
            {/* Rename */}
            <button
              onClick={() => {
                setEditingFolderId(folder.id)
                setEditingFolderName(folder.name)
              }}
              className="p-1 rounded hover:bg-oros-800 text-oros-400 hover:text-slate-200"
              title="Rename folder"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {/* Delete */}
            <button
              onClick={() => {
                if (confirm(`Delete folder "${folder.name}"? Items inside will be moved to root.`)) {
                  deleteFolder(folder.id)
                  addToast('Folder deleted', 'info')
                }
              }}
              className="p-1 rounded hover:bg-rose-950/80 text-oros-400 hover:text-rose-400"
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Folder Contents */}
        {folder.isOpen && (
          <div className="space-y-0.5 mt-0.5">
            {/* Subfolders */}
            {subfolders.map((sub) => renderFolder(sub, depth + 1))}

            {/* Folder Items */}
            {itemsInFolder.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{ paddingLeft: `${Math.max(16, (depth + 1) * 16 + 10)}px` }}
                className="group flex items-center justify-between py-1.5 pr-2 rounded-lg hover:bg-oros-900/60 text-oros-300 hover:text-slate-100 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getItemIcon(item.type)}
                  <span className="truncate">{item.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDirectoryItem(item.id)
                    addToast(`Deleted ${item.name}`, 'info')
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950 text-oros-400 hover:text-rose-400 transition-opacity"
                  title="Remove from directory"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {itemsInFolder.length === 0 && subfolders.length === 0 && (
              <div 
                style={{ paddingLeft: `${Math.max(16, (depth + 1) * 16 + 10)}px` }}
                className="text-[11px] text-oros-500/80 italic py-1"
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Root level items (folderId is null or not found)
  const rootItems = filteredItems.filter((i) => !i.folderId || !currentFolders.some(f => f.id === i.folderId))
  const rootFolders = currentFolders.filter((f) => !f.parentId)

  return (
    <aside className="w-64 bg-oros-950/95 border-r border-oros-800/40 flex flex-col justify-between select-none h-full">
      {/* Top Search & Actions Header */}
      <div className="p-2.5 border-b border-oros-800/40">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-oros-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari dokumen..."
              className="w-full bg-oros-900/80 border border-oros-800/80 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-oros-500 focus:outline-none focus:border-gold-400/80 transition-colors"
            />
          </div>

          {/* New Folder Button */}
          <button
            onClick={() => {
              setNewFolderParentId(null)
              setShowNewFolderModal(true)
            }}
            className="p-1.5 rounded-lg bg-oros-900/60 hover:bg-oros-800 border border-oros-800/60 text-oros-300 hover:text-gold-400 transition-colors"
            title="Create New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {/* New Doc Button */}
          <button
            onClick={() => handleQuickCreateDoc('canvas')}
            className="p-1.5 rounded-lg bg-oros-900/60 hover:bg-oros-800 border border-oros-800/60 text-oros-300 hover:text-amber-400 transition-colors"
            title="Create New Canvas"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Directory Tree Body */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* Root Level Items */}
        {rootItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-oros-900/70 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {getItemIcon(item.type)}
              <span className="truncate font-medium">{item.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteDirectoryItem(item.id)
                addToast(`Removed ${item.name}`, 'info')
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950 text-oros-400 hover:text-rose-400 transition-opacity"
              title="Remove from directory"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Folders */}
        {rootFolders.map((folder) => renderFolder(folder))}

        {rootItems.length === 0 && rootFolders.length === 0 && (
          <div className="text-center py-8 text-oros-500 text-xs px-4">
            <LayoutGrid className="w-6 h-6 mx-auto mb-2 opacity-40 text-gold-400" />
            No documents yet. Click below or above to create one.
          </div>
        )}
      </div>

      {/* Bottom Feature Dock (Inspired by VVD) */}
      <div className="p-2 border-t border-oros-800/40 bg-oros-950/90 backdrop-blur-sm">
        <div className="flex items-center justify-around bg-oros-900/80 border border-oros-800/80 rounded-xl px-1.5 py-1 shadow-inner">
          {/* Wiki */}
          <button
            onClick={() => handleQuickCreateDoc('wiki')}
            title="Wiki / Encyclopedia"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Cards */}
          <button
            onClick={() => handleQuickCreateDoc('card')}
            title="Lore Cards Gallery"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Canvas */}
          <button
            onClick={() => handleQuickCreateDoc('canvas')}
            title="Whiteboard Canvas"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Timeline */}
          <button
            onClick={() => handleQuickCreateDoc('timeline')}
            title="Chronology / Timeline"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Relations */}
          <button
            onClick={() => handleQuickCreateDoc('relations')}
            title="Relations Tree"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Cartography */}
          <button
            onClick={() => handleQuickCreateDoc('map')}
            title="Cartography Maps"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          {/* Writer */}
          <button
            onClick={() => handleQuickCreateDoc('writer')}
            title="Studio Writer"
            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-400 hover:bg-oros-800/80 transition-all"
          >
            <Feather className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-xs rounded-xl shadow-2xl p-4">
            <h4 className="text-xs font-semibold text-slate-100 mb-2 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-gold-400" />
              New Directory Folder
            </h4>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Royal Lineage)"
                className="w-full bg-oros-950 border border-oros-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-2.5 py-1 rounded text-xs text-oros-400 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded text-xs font-medium bg-gold-500 hover:bg-gold-400 text-oros-950 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
