import React, { useMemo, useState, useCallback } from 'react'
import { 
  ReactFlow, Controls, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  BaseEdge, EdgeProps, getStraightPath, useInternalNode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Network, Search, Filter, BookOpen, ExternalLink, ArrowRight, 
  Sparkles, Link2, GitFork, User, MapPin, Shield, Gem, Scroll, 
  Radio, X, Info, CheckCircle2, AlertCircle
} from 'lucide-react'
import { LoreEntity, EntityType } from '@shared/types'

// Dynamic boundary intersection for straight network links
function getWikiIntersection(sourceNode: any, targetNode: any) {
  const w1 = sourceNode.measured?.width || 190
  const h1 = sourceNode.measured?.height || 72
  const pos1 = sourceNode.internals?.positionAbsolute || sourceNode.position || { x: 0, y: 0 }
  const cx1 = pos1.x + w1 / 2
  const cy1 = pos1.y + h1 / 2

  const w2 = targetNode.measured?.width || 190
  const h2 = targetNode.measured?.height || 72
  const pos2 = targetNode.internals?.positionAbsolute || targetNode.position || { x: 0, y: 0 }
  const cx2 = pos2.x + w2 / 2
  const cy2 = pos2.y + h2 / 2

  const dx = cx2 - cx1
  const dy = cy2 - cy1
  if (dx === 0 && dy === 0) return { sourceX: cx1, sourceY: cy1, targetX: cx2, targetY: cy2 }

  const scaleX1 = (w1 / 2) / (Math.abs(dx) || 1e-9)
  const scaleY1 = (h1 / 2) / (Math.abs(dy) || 1e-9)
  const scale1 = Math.min(scaleX1, scaleY1)
  const sourceX = cx1 + dx * scale1
  const sourceY = cy1 + dy * scale1

  const scaleX2 = (w2 / 2) / (Math.abs(dx) || 1e-9)
  const scaleY2 = (h2 / 2) / (Math.abs(dy) || 1e-9)
  const scale2 = Math.min(scaleX2, scaleY2)
  const targetX = cx2 - dx * scale2
  const targetY = cy2 - dy * scale2

  return { sourceX, sourceY, targetX, targetY }
}

const WikiNetworkEdge = ({ id, source, target, markerEnd, style }: EdgeProps) => {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { sourceX, sourceY, targetX, targetY } = getWikiIntersection(sourceNode, targetNode)
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
}

// Icon helper by entity type
const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'character': return User
    case 'location': return MapPin
    case 'faction': return Shield
    case 'item': return Gem
    default: return Scroll
  }
}

// Color theme by entity type
const getTypeColor = (type: EntityType) => {
  switch (type) {
    case 'character': return { border: 'border-amber-500/70', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' }
    case 'location': return { border: 'border-emerald-500/70', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' }
    case 'faction': return { border: 'border-blue-500/70', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' }
    case 'item': return { border: 'border-purple-500/70', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' }
    default: return { border: 'border-rose-500/70', bg: 'bg-rose-500/10', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' }
  }
}

// Compact, high-density Wiki Node for the Knowledge Network
const WikiArticleNode = ({ data }: { data: { 
  entity: LoreEntity; 
  degree: number; 
  inDegree: number;
  outDegree: number;
  isHub: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
} }) => {
  const { entity, degree, inDegree, outDegree, isHub, isSelected } = data
  const theme = getTypeColor(entity.type)
  const Icon = getEntityIcon(entity.type)

  return (
    <div className={`w-52 rounded-xl bg-oros-900/95 border-2 shadow-xl transition-all cursor-pointer select-none text-left ${
      isSelected 
        ? 'border-gold-400 ring-2 ring-gold-400/40 scale-105 z-20' 
        : isHub
          ? `${theme.border} ring-1 ring-gold-400/30 hover:border-gold-400`
          : 'border-oros-700/80 hover:border-slate-300'
    }`}>
      {/* Invisible Handles */}
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1 pointer-events-none" />

      <div className="p-2.5 flex items-center gap-2.5">
        {/* Entity Portrait or Icon */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-oros-950 flex-shrink-0 border border-oros-700/60 flex items-center justify-center">
          {entity.avatar ? (
            <img src={entity.avatar} alt={entity.title} className="w-full h-full object-cover" />
          ) : (
            <Icon className={`w-5 h-5 ${theme.text}`} />
          )}
        </div>

        {/* Title and stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${theme.badge}`}>
              {entity.type}
            </span>
            <span className="text-[9px] font-mono font-semibold text-oros-400" title={`${inDegree} backlinks, ${outDegree} outbound`}>
              {degree} links
            </span>
          </div>
          <h4 className="font-serif font-bold text-xs text-slate-100 truncate">
            {entity.title}
          </h4>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = {
  wikiArticle: WikiArticleNode
}

const edgeTypes = {
  wikiNetwork: WikiNetworkEdge
}

export const WikiNetworkGraph: React.FC = () => {
  const { 
    entities, relations, activeWorldId, setSelectedEntityId, setActiveTab 
  } = useWorldStore()
  const { addToast } = useToastStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedWikiId, setSelectedWikiId] = useState<string | null>(null)
  const [showOnlyHubs, setShowOnlyHubs] = useState(false)

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Extract all cross-wiki connections (mentions, infobox links, relations)
  const { linkMap, inDegreeMap, outDegreeMap, allLinks } = useMemo(() => {
    const linkMap: Record<string, Set<string>> = {}
    const inDegreeMap: Record<string, number> = {}
    const outDegreeMap: Record<string, number> = {}
    const allLinks: { source: string; target: string; reason: string }[] = []

    worldEntities.forEach(e => {
      linkMap[e.id] = new Set()
      inDegreeMap[e.id] = 0
      outDegreeMap[e.id] = 0
    })

    // 1. Scan explicit relations
    worldRelations.forEach(r => {
      if (linkMap[r.sourceEntityId] && linkMap[r.targetEntityId]) {
        if (!linkMap[r.sourceEntityId].has(r.targetEntityId)) {
          linkMap[r.sourceEntityId].add(r.targetEntityId)
          allLinks.push({ source: r.sourceEntityId, target: r.targetEntityId, reason: r.label || 'Relation' })
          outDegreeMap[r.sourceEntityId] = (outDegreeMap[r.sourceEntityId] || 0) + 1
          inDegreeMap[r.targetEntityId] = (inDegreeMap[r.targetEntityId] || 0) + 1
        }
      }
    })

    // 2. Scan infobox entity-links
    worldEntities.forEach(e => {
      e.infobox?.sections?.forEach(sec => {
        sec.fields?.forEach(field => {
          if (field.type === 'entity-link' && field.targetEntityId && linkMap[field.targetEntityId]) {
            if (!linkMap[e.id].has(field.targetEntityId)) {
              linkMap[e.id].add(field.targetEntityId)
              allLinks.push({ source: e.id, target: field.targetEntityId, reason: `Infobox (${field.label})` })
              outDegreeMap[e.id] = (outDegreeMap[e.id] || 0) + 1
              inDegreeMap[field.targetEntityId] = (inDegreeMap[field.targetEntityId] || 0) + 1
            }
          }
        })
      })
    })

    // 3. Scan HTML content mentions (TipTap data-id or text mention of other entity title)
    worldEntities.forEach(source => {
      const content = source.content || ''
      worldEntities.forEach(target => {
        if (source.id !== target.id) {
          // Check mention tag or title text match
          const hasMentionTag = content.includes(`data-id="${target.id}"`) || content.includes(`data-label="${target.title}"`)
          const hasTitleMention = target.title.length > 3 && content.includes(target.title)
          
          if (hasMentionTag || hasTitleMention) {
            if (!linkMap[source.id].has(target.id)) {
              linkMap[source.id].add(target.id)
              allLinks.push({ source: source.id, target: target.id, reason: 'Mention in article text' })
              outDegreeMap[source.id] = (outDegreeMap[source.id] || 0) + 1
              inDegreeMap[target.id] = (inDegreeMap[target.id] || 0) + 1
            }
          }
        }
      })
    })

    return { linkMap, inDegreeMap, outDegreeMap, allLinks }
  }, [worldEntities, worldRelations])

  // Filtered entities for nodes
  const filteredEntities = useMemo(() => {
    return worldEntities.filter(e => {
      if (selectedType !== 'all' && e.type !== selectedType) return false
      const degree = (inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)
      if (showOnlyHubs && degree < 2) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.summary.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [worldEntities, selectedType, showOnlyHubs, searchQuery, inDegreeMap, outDegreeMap])

  // Generate Nodes in an organic spiral/circular layout
  const initialNodes: Node[] = useMemo(() => {
    const total = Math.max(filteredEntities.length, 1)
    const radius = 340
    const centerX = 550
    const centerY = 350

    return filteredEntities.map((ent, idx) => {
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
      const inDeg = inDegreeMap[ent.id] || 0
      const outDeg = outDegreeMap[ent.id] || 0
      const totalDeg = inDeg + outDeg
      const isHub = totalDeg >= 2

      // Hubs positioned slightly closer to center
      const r = isHub ? radius * 0.75 : radius

      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)

      return {
        id: ent.id,
        type: 'wikiArticle',
        position: { x, y },
        data: {
          entity: ent,
          degree: totalDeg,
          inDegree: inDeg,
          outDegree: outDeg,
          isHub,
          isSelected: selectedWikiId === ent.id,
          onSelect: (id: string) => setSelectedWikiId(id)
        }
      }
    })
  }, [filteredEntities, inDegreeMap, outDegreeMap, selectedWikiId])

  // Generate Edges between visible nodes
  const initialEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(filteredEntities.map(e => e.id))

    return allLinks
      .filter(l => visibleIds.has(l.source) && visibleIds.has(l.target))
      .map((link, idx) => {
        const isHighlighted = selectedWikiId 
          ? link.source === selectedWikiId || link.target === selectedWikiId
          : false

        const strokeColor = isHighlighted ? '#f5c542' : '#475569'
        const strokeWidth = isHighlighted ? 2.5 : 1.5

        return {
          id: `wlink-${idx}-${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          type: 'wikiNetwork',
          animated: isHighlighted,
          style: { 
            stroke: strokeColor, 
            strokeWidth,
            opacity: selectedWikiId ? (isHighlighted ? 1 : 0.25) : 0.7
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 10,
            height: 10
          }
        }
      })
  }, [allLinks, filteredEntities, selectedWikiId])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  React.useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  React.useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedWikiId(node.id)
  }

  // Selected article details
  const activeArticle = useMemo(() => {
    return worldEntities.find(e => e.id === selectedWikiId) || null
  }, [selectedWikiId, worldEntities])

  // Outbound linked articles
  const outboundArticles = useMemo(() => {
    if (!selectedWikiId) return []
    const targets = allLinks.filter(l => l.source === selectedWikiId).map(l => ({
      entity: worldEntities.find(e => e.id === l.target),
      reason: l.reason
    })).filter(item => item.entity !== undefined)
    return targets as { entity: LoreEntity; reason: string }[]
  }, [selectedWikiId, allLinks, worldEntities])

  // Inbound backlinks (articles mentioning this article)
  const inboundArticles = useMemo(() => {
    if (!selectedWikiId) return []
    const sources = allLinks.filter(l => l.target === selectedWikiId).map(l => ({
      entity: worldEntities.find(e => e.id === l.source),
      reason: l.reason
    })).filter(item => item.entity !== undefined)
    return sources as { entity: LoreEntity; reason: string }[]
  }, [selectedWikiId, allLinks, worldEntities])

  const handleOpenInWiki = (entityId: string) => {
    setSelectedEntityId(entityId)
    setActiveTab('wiki')
    addToast('Opened article in Encyclopedia', 'info')
  }

  // Knowledge graph health metrics
  const totalArticles = worldEntities.length
  const totalLinks = allLinks.length
  const orphanCount = worldEntities.filter(e => ((inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)) === 0).length
  const hubCount = worldEntities.filter(e => ((inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)) >= 2).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Header & Metrics Bar */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-slate-100 flex items-center gap-2">
              Wiki Cross-Link Network
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-oros-800 text-blue-400 font-normal">
                Knowledge Graph
              </span>
            </h2>
          </div>
        </div>

        {/* Global Network Health Stats */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-oros-300">
            <BookOpen className="w-3.5 h-3.5 text-gold-400" />
            <span>{totalArticles} Articles</span>
          </div>
          <div className="flex items-center gap-1.5 text-oros-300">
            <Link2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{totalLinks} Cross-Links</span>
          </div>
          <div className="flex items-center gap-1.5 text-oros-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{hubCount} Hubs</span>
          </div>
          {orphanCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400" title="Articles with 0 connections">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{orphanCount} Unlinked</span>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3 h-3 text-oros-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wiki articles..."
              className="bg-oros-950 border border-oros-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-oros-500 focus:outline-none focus:border-blue-400/80 w-36 lg:w-48 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-oros-950 border border-oros-800 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3 h-3 text-oros-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="character">Characters</option>
              <option value="location">Locations</option>
              <option value="faction">Factions</option>
              <option value="item">Items</option>
            </select>
          </div>

          {/* Toggle Hubs */}
          <button
            onClick={() => setShowOnlyHubs(!showOnlyHubs)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              showOnlyHubs
                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                : 'bg-oros-900 border-oros-800 text-oros-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Hubs Only</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#16202c" gap={24} size={1} />
          <Controls className="bg-oros-900 border border-oros-700 text-slate-200 fill-slate-200" />
          <MiniMap 
            nodeColor="#2b3b4f" 
            maskColor="rgba(11, 17, 24, 0.88)"
            className="bg-oros-950 border border-oros-800 rounded-xl overflow-hidden" 
          />
        </ReactFlow>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-full bg-oros-900/90 border border-oros-700/80 text-[11px] text-oros-300 shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-2">
          <Link2 className="w-3 h-3 text-blue-400" />
          <span>Click any article node to inspect its <strong>cross-references</strong>, <strong>backlinks</strong>, and jump to the Encyclopedia</span>
        </div>
      </div>

      {/* Side Inspector Drawer for Selected Wiki Article */}
      {activeArticle && (
        <aside className="absolute top-12 right-0 bottom-0 w-84 bg-oros-900/95 border-l border-oros-800/80 shadow-2xl z-30 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-oros-800/80 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-oros-950 border border-oros-700/80 overflow-hidden flex-shrink-0">
                {activeArticle.avatar ? (
                  <img src={activeArticle.avatar} alt={activeArticle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif text-lg font-bold text-gold-400/60">
                    {activeArticle.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-oros-950 text-gold-400 border border-oros-700/60">
                  {activeArticle.type}
                </span>
                <h3 className="font-serif font-bold text-sm text-slate-100 truncate mt-1">
                  {activeArticle.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedWikiId(null)}
              className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to Encyclopedia Button */}
          <div className="p-3 border-b border-oros-800/60 bg-oros-950/40">
            <button
              onClick={() => handleOpenInWiki(activeArticle.id)}
              className="w-full py-2 px-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Full Article in Encyclopedia</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Summary */}
          {activeArticle.summary && (
            <div className="p-4 border-b border-oros-800/40">
              <h5 className="text-[10px] font-mono uppercase font-bold text-oros-400 mb-1">Codex Summary</h5>
              <p className="text-xs text-oros-300 leading-relaxed">
                {activeArticle.summary}
              </p>
            </div>
          )}

          {/* Cross References Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Outbound References */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-mono uppercase font-bold text-slate-200 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-gold-400" />
                  <span>Outbound Links ({outboundArticles.length})</span>
                </h5>
                <span className="text-[10px] text-oros-500">Mentions in this wiki</span>
              </div>

              {outboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-lg bg-oros-950/40">
                  No outbound wiki mentions found in article.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {outboundArticles.map(({ entity: tgt, reason }) => (
                    <div
                      key={tgt.id}
                      onClick={() => setSelectedWikiId(tgt.id)}
                      className="p-2 rounded-lg bg-oros-950/70 border border-oros-800/70 hover:border-gold-400/60 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-oros-900 overflow-hidden flex-shrink-0">
                          {tgt.avatar ? (
                            <img src={tgt.avatar} alt={tgt.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-oros-400 font-bold">
                              {tgt.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-slate-200 group-hover:text-gold-300 truncate">
                            {tgt.title}
                          </div>
                          <div className="text-[10px] text-oros-400 truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbound Backlinks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-mono uppercase font-bold text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-blue-400" />
                  <span>Inbound Backlinks ({inboundArticles.length})</span>
                </h5>
                <span className="text-[10px] text-oros-500">Articles linking here</span>
              </div>

              {inboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-lg bg-oros-950/40">
                  No other articles reference this page yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {inboundArticles.map(({ entity: src, reason }) => (
                    <div
                      key={src.id}
                      onClick={() => setSelectedWikiId(src.id)}
                      className="p-2 rounded-lg bg-oros-950/70 border border-oros-800/70 hover:border-blue-400/60 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-oros-900 overflow-hidden flex-shrink-0">
                          {src.avatar ? (
                            <img src={src.avatar} alt={src.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-oros-400 font-bold">
                              {src.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-slate-200 group-hover:text-blue-300 truncate">
                            {src.title}
                          </div>
                          <div className="text-[10px] text-oros-400 truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
