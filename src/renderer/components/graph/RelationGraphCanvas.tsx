import React, { useMemo, useState, useCallback } from 'react'
import { 
  ReactFlow, Controls, Background, MiniMap, Node, Edge, 
  useNodesState, useEdgesState, addEdge, Connection 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { Network, Plus, ExternalLink, Trash2 } from 'lucide-react'
import { RelationEdge } from '@shared/types'

export const RelationGraphCanvas: React.FC = () => {
  const { 
    entities, relations, activeWorldId, setSelectedEntityId, setActiveTab,
    createRelation, deleteRelation 
  } = useWorldStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [relationLabel, setRelationLabel] = useState('')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('ally')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Generate XYFlow nodes from World Entities
  const initialNodes: Node[] = useMemo(() => {
    return worldEntities.map((ent, idx) => {
      // Circular layout arrangement
      const angle = (idx / Math.max(worldEntities.length, 1)) * 2 * Math.PI
      const radius = 280
      const x = 500 + radius * Math.cos(angle)
      const y = 300 + radius * Math.sin(angle)

      return {
        id: ent.id,
        position: { x, y },
        data: { 
          label: (
            <div className="p-2.5 bg-oros-900 border-2 border-oros-700 hover:border-gold-400 rounded-xl shadow-xl w-48 text-left transition-all">
              <div className="flex items-center gap-2 mb-1">
                {ent.avatar ? (
                  <img src={ent.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-oros-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-oros-800 text-[10px] flex items-center justify-center font-bold text-gold-400">
                    {ent.title[0]}
                  </div>
                )}
                <div className="truncate font-serif font-bold text-xs text-slate-100">{ent.title}</div>
              </div>
              <div className="text-[10px] text-gold-400 uppercase font-mono tracking-wider">
                {ent.type}
              </div>
            </div>
          )
        },
        style: { background: 'transparent', border: 'none' }
      }
    })
  }, [worldEntities])

  // Generate XYFlow edges from World Relations
  const initialEdges: Edge[] = useMemo(() => {
    return worldRelations.map((rel) => {
      let strokeColor = '#f5c542'
      if (rel.relationType === 'rival') strokeColor = '#f87171'
      if (rel.relationType === 'family') strokeColor = '#60a5fa'
      if (rel.relationType === 'vassal') strokeColor = '#34d399'

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        label: rel.label,
        type: 'smoothstep',
        animated: rel.relationType === 'ally',
        style: { stroke: strokeColor, strokeWidth: 2 },
        labelStyle: { fill: '#cbd4df', fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: '#0e141c', fillOpacity: 0.95, stroke: strokeColor, strokeWidth: 1 }
      }
    })
  }, [worldRelations])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync state if world data updates
  React.useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  React.useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedEntityId(node.id)
  }

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceId || !targetId || !relationLabel.trim()) return

    createRelation({
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationType,
      label: relationLabel.trim()
    })

    setShowAddModal(false)
    setRelationLabel('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Header & Action Controls */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-gold-400" />
          <h2 className="font-serif text-sm font-bold text-slate-100">
            Relational Knowledge Web
          </h2>
          <span className="text-xs text-oros-400 font-mono">
            ({worldEntities.length} Nodes, {worldRelations.length} Edges)
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Entities</span>
        </button>
      </div>

      {/* ReactFlow Canvas Viewport */}
      <div className="flex-1 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#1e2936" gap={20} size={1} />
          <Controls className="bg-oros-900 border border-oros-700 text-slate-200 fill-slate-200" />
          <MiniMap 
            nodeColor="#3e5b74" 
            maskColor="rgba(14, 20, 28, 0.85)"
            className="bg-oros-950 border border-oros-800 rounded-lg overflow-hidden" 
          />
        </ReactFlow>
      </div>

      {/* Add Relation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">
              Forge Relational Bond
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Link two entities together with an explicit relationship label (e.g. family, allegiance, feud).
            </p>
            <form onSubmit={handleCreateRelation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Source Entity</label>
                <select
                  required
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select origin...</option>
                  {worldEntities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Target Entity</label>
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select destination...</option>
                  {worldEntities.filter(e => e.id !== sourceId).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Type</label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="ally">Alliance / Friendly</option>
                  <option value="family">Family / Bloodline / Marriage</option>
                  <option value="rival">Enemy / Rivalry / Conflict</option>
                  <option value="vassal">Vassal / Fealty / Ruler</option>
                  <option value="creator">Creator / Wielder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="e.g. Secret Benefactor, Blood Oath, Liege Lord"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Create Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
