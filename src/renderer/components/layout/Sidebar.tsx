import React, { useState, useRef, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, 
  Search, LayoutGrid, BookOpen, Layers, Users, Clock, 
  Map as MapIcon, Feather, Trash2, Edit2, MoreVertical,
  FolderPlus, FilePlus, User, Compass, Shield, Gem,
  Flame, Sparkles, Move, Check, X, FolderTree, PanelLeftClose
} from 'lucide-react'
import { DirectoryItem, DirectoryFolder, DirectoryItemType, LoreEntity } from '@shared/types'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'

export const Sidebar: React.FC = () => {
  const { 
    activeWorldId, folders, directoryItems, openTab, setSelectedEntityId,
    openTabs, activeTabId, sidebarCollapsed, toggleSidebar,
    createFolder, renameFolder, deleteFolder, toggleFolderOpen, moveFolderToFolder,
    createDirectoryItem, deleteDirectoryItem, moveItemToFolder,
    createCanvas, createEntity, createMap, createChapter,
    entities, maps, timelines, relations, manuscripts, categories
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [searchFilter, setSearchFilter] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)

  // New Element Modal state
  const [showNewElementModal, setShowNewElementModal] = useState(false)
  const [newElementType, setNewElementType] = useState<DirectoryItemType>('card')
  const [newCardSubtype, setNewCardSubtype] = useState<LoreEntity['type']>('character')
  const [newElementName, setNewElementName] = useState('')
  const [newElementFolderId, setNewElementFolderId] = useState<string | null>(null)

  // Move Item Modal state
  const [movingItemId, setMovingItemId] = useState<string | null>(null)
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null)

  // Editing folder name inline
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')

  // Drag-and-drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [isDragOverRoot, setIsDragOverRoot] = useState(false)

  // Item Context menu state
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null)

  const worldId = activeWorldId || 'world-aethelgard'
  const currentFolders = folders[worldId] || []
  const currentItems = directoryItems[worldId] || []
  const worldEntities = entities[worldId] || []
  const worldCategories = categories[worldId] || DEFAULT_PRESET_CATEGORIES

  // Filter items based on search with memoization
  const filteredItems = useMemo(() => {
    const q = searchFilter.toLowerCase().trim()
    if (!q) return currentItems
    return currentItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    )
  }, [currentItems, searchFilter])

  // Quick lookup map for entities to avoid O(N) array search per directory item
  const entityMap = useMemo(() => {
    return new Map(worldEntities.map((e) => [e.id, e]))
  }, [worldEntities])

  const activeTabObj = useMemo(() => {
    return openTabs.find((t) => t.id === activeTabId)
  }, [openTabs, activeTabId])

  const isItemActive = (item: DirectoryItem) => {
    if (!activeTabObj) return false
    if (item.targetId) {
      return activeTabObj.targetId === item.targetId
    }
    return activeTabObj.type === item.type
  }

  // Resolve icon for item based on type and entity subtype
  const getItemIcon = (item: DirectoryItem) => {
    if (item.type === 'card' || item.type === 'wiki') {
      const entity = item.targetId ? entityMap.get(item.targetId) : undefined
      const subtype = entity?.type || 'character'
      const meta = getCategoryMeta(subtype, worldCategories)
      const IconComp = getCategoryIconComponent(meta.icon)
      return (
        <IconComp 
          className="w-3.5 h-3.5 shrink-0" 
          style={{ color: meta.color || '#94a3b8' }} 
        />
      )
    }

    switch (item.type) {
      case 'canvas':
        return <LayoutGrid className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
      case 'map':
        return <MapIcon className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
      case 'relations':
        return <Users className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
      case 'timeline':
        return <Clock className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
      case 'writer':
        return <Feather className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
      default:
        return <Layers className="w-3.5 h-3.5 text-oros-400 group-hover:text-oros-200 shrink-0 transition-colors" />
    }
  }

  const handleItemClick = (item: DirectoryItem) => {
    // If it's a card or wiki article in the directory, open it in wiki view
    if (item.type === 'card' || item.type === 'wiki') {
      if (item.targetId) {
        setSelectedEntityId(item.targetId)
      }
      openTab({
        title: item.name,
        type: 'wiki',
        targetId: item.targetId
      })
      return
    }

    openTab({
      title: item.name,
      type: item.type,
      targetId: item.targetId
    })
  }

  // Folder creation
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim(), newFolderParentId)
    setShowNewFolderModal(false)
    setNewFolderName('')
    setNewFolderParentId(null)
    addToast(`Created folder "${newFolderName.trim()}"`, 'success')
  }

  // Folder rename
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

  // Quick or Modal Element Creation
  const handleCreateElementSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newElementName.trim() || `New ${newElementType}`
    const targetFolder = newElementFolderId

    switch (newElementType) {
      case 'card': {
        const ent = createEntity(newCardSubtype, name, targetFolder)
        openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
        addToast(`Created Card: ${ent.title}`, 'success')
        break
      }
      case 'canvas': {
        const c = createCanvas(name, targetFolder)
        addToast(`Created Canvas: ${c.name}`, 'success')
        break
      }
      case 'map': {
        const m = createMap(name, 'https://images.unsplash.com/photo-1524654458049-e36be0721fa2?auto=format&fit=crop&w=1920&q=80', targetFolder)
        addToast(`Created Map: ${m.name}`, 'success')
        break
      }
      case 'relations': {
        const item = createDirectoryItem(name || 'Lineage Tree', 'relations', targetFolder)
        openTab({ title: item.name, type: 'relations' })
        addToast('Created Lineage Tree view', 'success')
        break
      }
      case 'timeline': {
        const item = createDirectoryItem(name || 'Timeline', 'timeline', targetFolder)
        openTab({ title: item.name, type: 'timeline' })
        addToast('Created Timeline view', 'success')
        break
      }
      case 'writer': {
        createChapter(name || 'New Chapter', targetFolder)
        addToast('Created Manuscript chapter', 'success')
        break
      }
      case 'wiki': {
        const ent = createEntity('document', name || 'New Encyclopedia Article', targetFolder)
        openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
        addToast(`Created Wiki Entry: ${ent.title}`, 'success')
        break
      }
    }

    setShowNewElementModal(false)
    setNewElementName('')
    setNewElementFolderId(null)
  }

  // Open Element Creation prefilled with a folder
  const openNewElementForFolder = (folderId: string | null = null, defaultType: DirectoryItemType = 'card') => {
    setNewElementFolderId(folderId)
    setNewElementType(defaultType)
    setNewElementName('')
    setShowNewElementModal(true)
  }

  // Move Item modal submit
  const handleMoveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!movingItemId) return
    moveItemToFolder(movingItemId, targetMoveFolderId)
    setMovingItemId(null)
    setTargetMoveFolderId(null)
    addToast('Moved item to folder', 'info')
  }

  // Build flattened folder hierarchy list for selectors
  const getFolderHierarchy = (parentId: string | null = null, depth = 0): { folder: DirectoryFolder; depth: number }[] => {
    const subs = currentFolders.filter((f) => f.parentId === parentId)
    let res: { folder: DirectoryFolder; depth: number }[] = []
    for (const sub of subs) {
      res.push({ folder: sub, depth })
      res = res.concat(getFolderHierarchy(sub.id, depth + 1))
    }
    return res
  }

  // Recursive folder renderer
  const renderFolder = (folder: DirectoryFolder, depth = 0) => {
    const isEditing = editingFolderId === folder.id
    const itemsInFolder = filteredItems.filter((i) => i.folderId === folder.id)
    const subfolders = currentFolders.filter((f) => f.parentId === folder.id)
    const isDragTarget = dragOverFolderId === folder.id

    return (
      <div 
        key={folder.id}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOverFolderId(folder.id)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (dragOverFolderId === folder.id) setDragOverFolderId(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOverFolderId(null)
          const itemId = e.dataTransfer.getData('text/plain')
          const fId = e.dataTransfer.getData('oros/folder-id')
          if (itemId) {
            moveItemToFolder(itemId, folder.id)
            addToast(`Moved item to "${folder.name}"`, 'info')
          } else if (fId && fId !== folder.id) {
            moveFolderToFolder(fId, folder.id)
            addToast(`Moved folder into "${folder.name}"`, 'info')
          }
        }}
        className={`select-none text-xs rounded-[3px] transition-colors ${
          isDragTarget ? 'bg-oros-850 ring-1 ring-oros-600' : ''
        }`}
      >
        {/* Folder Header Row */}
        <div 
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData('oros/folder-id', folder.id)
            setDraggedFolderId(folder.id)
          }}
          onDragEnd={() => setDraggedFolderId(null)}
          className="group flex items-center justify-between px-2 py-1 rounded-[3px] hover:bg-oros-900 text-oros-300 hover:text-oros-100 transition-colors cursor-pointer"
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          onClick={() => toggleFolderOpen(folder.id)}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolderOpen(folder.id)
              }}
              className="text-oros-400 hover:text-oros-100 p-0.5 rounded transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ease-snappy ${folder.isOpen ? 'rotate-90 text-oros-200' : 'text-oros-400'}`} />
            </button>
            {folder.isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-oros-300 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-oros-400 shrink-0" />
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
                className="bg-oros-950 border border-accent rounded-[3px] px-1.5 py-0.5 text-xs text-white outline-none w-32 focus:ring-1 focus:ring-accent/40"
              />
            ) : (
              <span className="truncate font-medium text-slate-200">{folder.name}</span>
            )}

            {/* Item count badge */}
            <span className="text-[10px] text-oros-500 font-mono ml-0.5">
              ({itemsInFolder.length + subfolders.length})
            </span>
          </div>

          {/* Folder Hover Actions */}
          <div 
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Element in this Folder */}
            <button
              onClick={() => openNewElementForFolder(folder.id, 'card')}
              className="p-1 rounded hover:bg-oros-800 text-oros-400 hover:text-accent"
              title="Add element in folder"
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
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: 'Delete Folder',
                  message: `Delete folder "${folder.name}"? Items inside will be moved to root.`,
                  confirmText: 'Delete Folder',
                  variant: 'danger'
                })
                if (confirmed) {
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
            {itemsInFolder.map((item) => {
              const active = isItemActive(item)
              return (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    setDraggedItemId(item.id)
                  }}
                  onDragEnd={() => setDraggedItemId(null)}
                  onClick={() => handleItemClick(item)}
                  style={{ paddingLeft: `${Math.max(16, (depth + 1) * 14 + 10)}px` }}
                  className={`group flex items-center justify-between py-1 pr-2 rounded-[3px] transition-colors cursor-pointer text-xs ${
                    draggedItemId === item.id ? 'opacity-40' : ''
                  } ${
                    active
                      ? 'bg-accent-subtle text-oros-100 font-medium border-l-2 border-accent'
                      : 'hover:bg-oros-900 text-oros-300 hover:text-oros-100 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getItemIcon(item)}
                    <span className="truncate">{item.name}</span>
                  </div>

                <div 
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Move to folder */}
                  <button
                    onClick={() => {
                      setMovingItemId(item.id)
                      setTargetMoveFolderId(item.folderId || null)
                    }}
                    className="p-1 rounded-[2px] hover:bg-oros-800 text-oros-400 hover:text-oros-200"
                    title="Move to another folder"
                  >
                    <FolderTree className="w-3 h-3" />
                  </button>

                  {/* Delete from vault */}
                  <button
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Remove Item',
                        message: `Remove "${item.name}" from vault?`,
                        confirmText: 'Remove',
                        variant: 'danger'
                      })
                      if (confirmed) {
                        deleteDirectoryItem(item.id)
                        addToast(`Removed "${item.name}" from vault`, 'info')
                      }
                    }}
                    className="p-1 rounded hover:bg-rose-950 text-oros-400 hover:text-rose-400 transition-colors"
                    title="Delete element"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}

            {itemsInFolder.length === 0 && subfolders.length === 0 && (
              <div 
                style={{ paddingLeft: `${Math.max(16, (depth + 1) * 14 + 10)}px` }}
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

  // Root level items (folderId is null or not found in folders)
  const rootItems = filteredItems.filter((i) => !i.folderId || !currentFolders.some((f) => f.id === i.folderId))
  const rootFolders = currentFolders.filter((f) => !f.parentId)
  const allFolderHierarchy = getFolderHierarchy(null)

  return (
    <>
      <aside 
        className={`h-full bg-oros-950/95 border-r border-oros-800/40 select-none transition-all duration-250 ease-snappy overflow-hidden shrink-0 min-w-0 ${
          sidebarCollapsed ? 'w-0 opacity-0 border-r-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        <div className="w-64 h-full flex flex-col justify-between shrink-0">
          {/* TOP SEARCH & ACTION HEADER */}
          <div className="p-2 border-b border-oros-800/60">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter vault..."
                  className="w-full bg-oros-900 border border-oros-800 rounded-[3px] pl-8 pr-2 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-600 transition-colors font-sans"
                />
              </div>

              {/* New Folder Button */}
              <button
                onClick={() => {
                  setNewFolderParentId(null)
                  setShowNewFolderModal(true)
                }}
                className="p-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-400 hover:text-oros-100 transition-colors btn-interactive"
                title="Create New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>

              {/* New Element Button */}
              <button
                onClick={() => openNewElementForFolder(null, 'card')}
                className="p-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-400 hover:text-oros-100 transition-colors btn-interactive"
                title="Create New Element in Vault"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>

              {/* Collapse Sidebar Button */}
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-400 hover:text-oros-100 transition-colors btn-interactive"
                title="Collapse Vault (Ctrl+B)"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

      {/* DIRECTORY TREE BODY */}
      <div 
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOverRoot(true)
        }}
        onDragLeave={() => setIsDragOverRoot(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOverRoot(false)
          const itemId = e.dataTransfer.getData('text/plain')
          const fId = e.dataTransfer.getData('oros/folder-id')
          if (itemId) {
            moveItemToFolder(itemId, null)
            addToast('Moved item to root', 'info')
          } else if (fId) {
            moveFolderToFolder(fId, null)
            addToast('Moved folder to root', 'info')
          }
        }}
        className={`flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 transition-colors ${
          isDragOverRoot ? 'bg-oros-800/30' : ''
        }`}
      >
        {/* Root Level Folders */}
        {rootFolders.map((folder) => renderFolder(folder))}

        {/* Root Level Items */}
        {rootItems.map((item) => {
          const active = isItemActive(item)
          return (
            <div
              key={item.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id)
                setDraggedItemId(item.id)
              }}
              onDragEnd={() => setDraggedItemId(null)}
              onClick={() => handleItemClick(item)}
              className={`group flex items-center justify-between px-2 py-1 rounded-[3px] transition-colors cursor-pointer text-xs ${
                draggedItemId === item.id ? 'opacity-40' : ''
              } ${
                active
                  ? 'bg-accent-subtle text-oros-100 font-medium border-l-2 border-accent'
                  : 'hover:bg-oros-900 text-oros-300 hover:text-oros-100 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getItemIcon(item)}
                <span className="truncate font-medium">{item.name}</span>
              </div>

            <div 
              className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Move to folder */}
              <button
                onClick={() => {
                  setMovingItemId(item.id)
                  setTargetMoveFolderId(null)
                }}
                className="p-1 rounded-[2px] hover:bg-oros-800 text-oros-400 hover:text-oros-200"
                title="Move to folder"
              >
                <FolderTree className="w-3 h-3" />
              </button>

              {/* Delete from vault */}
              <button
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: 'Remove Item',
                    message: `Remove "${item.name}" from vault?`,
                    confirmText: 'Remove',
                    variant: 'danger'
                  })
                  if (confirmed) {
                    deleteDirectoryItem(item.id)
                    addToast(`Removed "${item.name}" from vault`, 'info')
                  }
                }}
                className="p-1 rounded-[2px] hover:bg-rose-950 text-oros-400 hover:text-rose-400 transition-colors"
                title="Delete element"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )
      })}

        {rootItems.length === 0 && rootFolders.length === 0 && (
          <div className="text-center py-8 text-oros-500 text-xs px-4">
            <LayoutGrid className="w-5 h-5 mx-auto mb-2 opacity-30 text-oros-500" />
            No records in vault ledger. Use the actions above or below to create cards, maps, or canvases.
          </div>
        )}
      </div>

      {/* BOTTOM FEATURE DOCK */}
      <div className="p-1.5 border-t border-oros-800/60 bg-oros-950">
        <div className="flex items-center justify-around bg-oros-900 border border-oros-800/80 rounded-[3px] px-1 py-0.5 shadow-sm">
          {/* Card / Wiki */}
          <button
            onClick={() => openNewElementForFolder(null, 'card')}
            title="Create Lore Card"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Canvas */}
          <button
            onClick={() => openNewElementForFolder(null, 'canvas')}
            title="Create Whiteboard Canvas"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* Cartography Map */}
          <button
            onClick={() => openNewElementForFolder(null, 'map')}
            title="Create Cartography Map"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5" />
          </button>

          {/* Lineage Relations */}
          <button
            onClick={() => openNewElementForFolder(null, 'relations')}
            title="Create Lineage Tree"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          {/* Timeline */}
          <button
            onClick={() => openNewElementForFolder(null, 'timeline')}
            title="Create Timeline"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          {/* Studio Writer */}
          <button
            onClick={() => openNewElementForFolder(null, 'writer')}
            title="Create Manuscript Chapter"
            className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <Feather className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </aside>

      {/* NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-xs rounded-md shadow-2xl p-4 animate-modal-in">
            <h4 className="text-xs font-sans font-semibold text-oros-100 mb-2 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-oros-300" />
              <span>New Directory Folder</span>
            </h4>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-medium text-oros-400 mb-1">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Royal Lineage, Factions"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-medium text-oros-400 mb-1">Parent Folder (Optional)</label>
                <select
                  value={newFolderParentId || ''}
                  onChange={(e) => setNewFolderParentId(e.target.value || null)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                >
                  <option value="">Root (No parent)</option>
                  {allFolderHierarchy.map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {'\u00A0'.repeat(depth * 3)}📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-2.5 py-1 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent px-3 py-1 rounded-[3px] text-xs font-semibold transition-colors shadow-sm"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ELEMENT MODAL */}
      {showNewElementModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-sm rounded-md shadow-2xl p-4 animate-modal-in">
            <h4 className="text-sm font-sans font-semibold text-oros-100 mb-3 flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-oros-300" />
              <span>New Item</span>
            </h4>

            <form onSubmit={handleCreateElementSubmit} className="space-y-3">
              {/* Element Type Picker */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'card', label: 'Card', icon: Layers },
                    { id: 'canvas', label: 'Canvas', icon: LayoutGrid },
                    { id: 'map', label: 'Map', icon: MapIcon },
                    { id: 'relations', label: 'Relations', icon: Users },
                    { id: 'timeline', label: 'Timeline', icon: Clock },
                    { id: 'writer', label: 'Chapter', icon: Feather }
                  ].map((t) => {
                    const IconComp = t.icon
                    const isSelected = newElementType === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewElementType(t.id as DirectoryItemType)}
                        className={`p-1.5 rounded-[3px] text-xs font-medium flex flex-col items-center gap-1 border transition-colors ${
                          isSelected
                            ? 'bg-accent-muted text-accent border-accent/40 shadow-sm'
                            : 'bg-oros-950/70 border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Subtype for Cards */}
              {newElementType === 'card' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">Category Label</label>
                  <select
                    value={newCardSubtype}
                    onChange={(e) => setNewCardSubtype(e.target.value)}
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  >
                    {worldCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isPreset ? '' : '(Custom)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Element Name */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">Title</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  placeholder="Item title..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              {/* Target Folder */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">Place Inside Folder</label>
                <select
                  value={newElementFolderId || ''}
                  onChange={(e) => setNewElementFolderId(e.target.value || null)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                >
                  <option value="">Root (No folder)</option>
                  {allFolderHierarchy.map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {'\u00A0'.repeat(depth * 3)}📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setShowNewElementModal(false)}
                  className="px-2.5 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent px-3.5 py-1.5 rounded-[3px] text-xs font-semibold transition-colors shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE ITEM MODAL */}
      {movingItemId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-xs rounded-md shadow-2xl p-4 animate-modal-in">
            <h4 className="text-xs font-sans font-semibold text-oros-100 mb-2 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-oros-300" />
              <span>Move Record to Folder</span>
            </h4>
            <form onSubmit={handleMoveItemSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-medium text-oros-400 mb-1">Destination</label>
                <select
                  value={targetMoveFolderId || ''}
                  onChange={(e) => setTargetMoveFolderId(e.target.value || null)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                >
                  <option value="">Root Directory</option>
                  {allFolderHierarchy.map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {'\u00A0'.repeat(depth * 3)}📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMovingItemId(null)}
                  className="px-2.5 py-1 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent px-3 py-1 rounded-[3px] text-xs font-semibold transition-colors shadow-sm"
                >
                  Move Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
