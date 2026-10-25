# Investigation & Architectural Survey Report: Rich-Text Editor, Wiki Bi-directional Linking (R2), & Advanced Canvas Engine (R3)

**Author:** Explorer Survey Agent (`explorer_survey_2`)  
**Date:** 2026-10-24T18:16:00Z  
**Target Project:** Oros Worldbuilding Studio (`orosapp`)  
**Scope:** 
1. Rich-Text Editor & Article View Architecture
2. R2: Wiki Bi-directional Linking & Global Spotlight Search (Ctrl+K)
3. R3: Advanced Whiteboard Canvas Engine (Orthogonal Routing, Auto-Layout, Interactive Entity Cards)

---

## 1. Observations

### 1.1 Tech Stack & Dependency Baseline
*Source: `package.json:57-74`*
- Rich-Text Editor:
  - `@tiptap/react`: `^2.11.5`
  - `@tiptap/starter-kit`: `^2.11.5`
  - `@tiptap/extension-character-count`: `^2.11.5`
  - `@tiptap/extension-placeholder`: `^2.11.5`
  - `@tiptap/extension-mention`: `^2.27.3`
  - `@tiptap/suggestion`: `^2.11.5`
  - `tippy.js`: `^6.3.7`
- Canvas / Graph:
  - `@xyflow/react`: `^12.4.4` (XYFlow / React Flow 12)
- State & Utilities:
  - `zustand`: `^5.0.3`
  - `lucide-react`: `^0.475.0`
  - `clsx`: `^2.1.1`, `tailwind-merge`: `^3.0.1`
- TypeScript Baseline Check:
  - Command: `cmd /c pnpm exec tsc --noEmit` exited code `0` (clean compile, 0 errors).

---

### 1.2 Rich-Text Editor & Article View
*Source: `src/renderer/components/wiki/WikiEditor.tsx:1-95`, `WikiArticleView.tsx:85-145, 644-710`, `spoilerExtension.ts:1-95`*

- **Framework**: Built on **TipTap 2** (`@tiptap/react`, which wraps ProseMirror).
- **Editor Instantiation (`WikiEditor.tsx:35-48`)**:
  ```tsx
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: { class: 'oros-mention' },
        suggestion: createMentionSuggestion()
      }),
      Spoiler
    ],
    content,
    ...
  ```
- **Content Serialization & Storage (`WikiEditor.tsx:78-87`)**:
  - `onUpdate: ({ editor }) => onChange(editor.getHTML())`.
  - Content is stored and serialized as raw **HTML strings** in `LoreEntity.content` (and `ManuscriptChapter.content`).
  - Synced externally via `useEffect` with `editor.commands.setContent(content)` (`WikiEditor.tsx:91-95`).
- **Article Display Mode (`WikiArticleView.tsx:644-710`)**:
  - When editing: `<WikiEditor content={currentEntity.content} onChange={(newHtml) => updateEntity(currentEntity.id, { content: newHtml })} />`.
  - When viewing: Rendered via `<div className="oros-wiki-prose" dangerouslySetInnerHTML={{ __html: processedHtml }} />`.
  - `processedHtml` is prepared using `DOMParser`:
    - Auto-generates Table of Contents (TOC) with slugs `sec-${idx}-${slug}` for `h1..h4`.
    - Auto-glosses conlang words via regex word boundaries: `<span class="oros-conlang-term ...">`.
- **Extension Pattern (`spoilerExtension.ts`)**:
  - Uses TipTap's `Mark.create` (or `Node.create`).
  - Supports `addOptions`, `parseHTML`, `renderHTML`, `addCommands`, `addKeyboardShortcuts`, `addInputRules` (e.g. `/(?:\|\|)([^|]+)(?:\|\|)$/`), and `addPasteRules`.

---

### 1.3 Survey R2: Wiki Bi-directional Linking & Global Spotlight Search

#### A. Wiki-Link Autocomplete (`[[query]]`)
*Source: `src/renderer/components/wiki/mentionSuggestion.ts:92-151`, `WikiEditor.tsx:41-46`*
- Currently, **only the `@` character** triggers auto-completion via `Mention.configure({ suggestion: createMentionSuggestion() })`.
- Typing `[[` is not handled. While bracket pairing exists for selected text (`WikiEditor.tsx:58-75`), typing `[[` does not trigger an entity picker or insert a wiki-link.
- `mentionSuggestion.ts` builds a Tippy.js popover (`MentionList`) attaching to `document.body` with keyboard up/down/enter handlers (`MentionList.onKeyDown`), querying `useWorldStore.getState().entities[activeWorldId]`.

#### B. Entity Index, Backlinks, Forward Links, & Hover Popovers
*Source: `src/renderer/utils/backlinksEngine.ts:96-253`, `WikiArticleView.tsx:54, 204-216, 770-1051, 1081-1086`*
- **Current Incoming Backlinks**:
  - `findBacklinksForEntity` scans chapters, other lore entities, maps (pins/regions), timelines, and relation edges.
  - Detects mentions through `raw.includes('data-id="${entityId}"')` or substring matches for entity title and aliases.
- **Missing Forward Links (Outgoing Links)**:
  - `backlinksEngine.ts` has **zero logic for extracting forward links** (entities referenced by the current entity).
  - Outgoing links exist as `<span class="oros-mention" data-id="...">`, `<span class="oros-wiki-link" data-id="...">`, or `[[EntityTitle]]` in `currentEntity.content`, as well as `infobox.sections[].fields[].targetEntityId`. None of these are currently cataloged or displayed in the article UI.
- **Hover Preview Popover State**:
  - `WikiArticleView.tsx:54`: `const [hoveredEntity, setHoveredEntity] = useState<LoreEntity | null>(null)`.
  - `WikiArticleView.tsx:1082-1086`:
    ```tsx
    {hoveredEntity && (
      <div className="absolute bottom-12 left-80 z-50 pointer-events-none animate-dropdown-in">
        <QuickPeekCard entity={hoveredEntity} />
      </div>
    )}
    ```
  - **Critical Bug / Dead Code**: `setHoveredEntity` is **never called anywhere in `WikiArticleView.tsx`**!
  - No `mouseenter`/`mouseover` listeners exist on `.oros-mention` or links in `oros-wiki-prose`.
  - Furthermore, clicking on `.oros-mention` in `WikiArticleView.tsx` does nothing (unlike in `StudioWriter.tsx:375-386` where it opens the reference drawer).

#### C. Global Spotlight Search (`Ctrl+K`)
*Source: `src/renderer/components/common/CommandPalette.tsx:43-55, 189-226, 283-298`, `src/renderer/utils/deepSearchEngine.ts:48-342`*
- Triggered globally via `Ctrl+K` / `Cmd+K` listener mounted in `App.tsx:188`.
- Queries `searchDeepVault` in `deepSearchEngine.ts`, currently scanning:
  - `entities` (Lore articles / cards)
  - `chapters` (Manuscript chapters)
  - `timelines` (Timeline events)
  - `maps` (Atlas maps & pins)
  - `conlangs` (Languages & lexicon terms)
- **Missing Requirement**: R2 specifically mandates searching across **articles, cards, timeline events, and battlemaps**.
  - `battlemaps` are stored in `useTtrpgStore.ts:382` (`battlemaps: Record<string, TTRPGBattlemap[]>`).
  - `deepSearchEngine.ts` currently does **not accept or index `battlemaps`** from `useTtrpgStore`.
  - In `CommandPalette.tsx`, navigating with Up/Down arrows does not auto-scroll the selection into view when results exceed the modal window height.

---

### 1.4 Survey R3: Advanced Canvas & Whiteboard Engine
*Source: `src/renderer/components/canvas/WhiteboardCanvas.tsx:1-200, 300-479, 2600-2800, 3300-3330, 4523-4551, 5134-5179`*

- **Current Engine Architecture**:
  - Library: `@xyflow/react` v12.4.4 (React Flow).
  - Canvas data persisted in `useWorldStore.canvases` as `WhiteboardCanvasData`: `{ id, worldId, name, nodes, edges, strokes, createdAt, updatedAt }`.
  - Custom Nodes (`WhiteboardCanvas.tsx:3302-3309`):
    - `canvasCard`: Entity lore card (portrait banner, category icon, title, resize handles).
    - `stickyNote`: Themed lined note.
    - `shape`: 10 vector SVG shapes.
    - `canvasText`: Rich text block.
    - `canvasDrawing`: Freehand pen stroke group.
    - `canvasImage`: Resizable image.
  - Custom Edges (`WhiteboardCanvas.tsx:3311-3316`):
    - `WhiteboardCustomEdge` registered for `whiteboardEdge`, `smoothstep`, `bezier`, `straight`.
- **Connector Routing Deficiencies (`WhiteboardCanvas.tsx:2600-2650`)**:
  - `computeOrthogonalWaypoints` calculates naive direct stubs from source and target handles and connects them with 1 or 2 right-angle bends based strictly on handle directions.
  - **No obstacle avoidance**: It completely ignores other nodes on the canvas. When any card, sticky note, or shape sits in between, the line passes straight through the obstacle.
- **Auto-Layout / Clustering Deficiencies**:
  - `WhiteboardCanvas.tsx` has **no auto-layout or clustering function whatsoever**. Users must manually drag every node.
  - In contrast, `WikiNetworkGraph.tsx:622-680` contains a 60-iteration physics relaxation force layout with pairwise repulsion, card bounding box collision avoidance (`236px x 80px`), and edge attraction.
- **Interactive Entity Card Embedding**:
  - `handleDropCard` (`WhiteboardCanvas.tsx:4524-4551`) creates a `canvasCard` node from a picker dropdown.
  - Current `CanvasCardNode` (`WhiteboardCanvas.tsx:300-479`) is largely static: it renders only portrait image and title. To view any summary, tags, or infobox attributes, users must open a slide-out drawer (`openPeek`). It does not allow inline expansion, direct card-based relationship creation, or direct field interactions on the canvas surface.

---

## 2. Logic Chain

### 2.1 Rich-Text Editor & `[[query]]` Autocomplete
1. *Observation*: The editor uses TipTap 2. TipTap's architecture enables ProseMirror plugins via `Extension.create` and `@tiptap/suggestion`.
2. *Observation*: The existing `@mention` system in `mentionSuggestion.ts` is implemented using `@tiptap/extension-mention`, which hardcodes `char: '@'`.
3. *Deduction*: We can implement a native `WikiLink` TipTap extension utilizing `@tiptap/suggestion` configured with `char: '[['` and custom regex matcher `/(?:^|\s)\[\[([^\]]*)$/`.
4. *Deduction*: When the user types `[[`, the suggestion utility mounts a floating dropdown (similar to `MentionList`) filtering world entities by title and aliases.
5. *Deduction*: Upon selecting an entity, the extension replaces the trigger text with a dedicated WikiLink node or HTML markup: `<span class="oros-wiki-link" data-type="wiki-link" data-id="${entity.id}" data-title="${entity.title}">[[${entity.title}]]</span>`.
6. *Deduction*: For Obsidian compatibility (R5), the markdown serializer will translate this directly to `[[Entity Title]]`.

### 2.2 Bi-directional Linking Engine & Hover Previews
1. *Observation*: `backlinksEngine.ts` currently scans only incoming mentions.
2. *Observation*: An entity's content contains outgoing references (wiki links, mentions, infobox entity links).
3. *Deduction*: We must extend `backlinksEngine.ts` with `findForwardLinksForEntity(entity, allEntities)` to extract:
   - Regex matches for `data-id="([a-zA-Z0-9_-]+)"` where `data-type="wiki-link"` or `data-type="mention"`.
   - Markdown wiki-links `\[\[([^\]|]+)(?:\|([^\]]+))?\]\]`.
   - Infobox fields with `type === 'entity-link'` and `targetEntityId`.
4. *Deduction*: In `WikiArticleView.tsx`, display an Outgoing / Forward Links panel alongside the Backlinks panel.
5. *Observation*: `setHoveredEntity` in `WikiArticleView.tsx` is completely uncalled, leaving the hover card non-functional.
6. *Deduction*: Attach delegated `onMouseOver` and `onMouseLeave` handlers to `oros-wiki-prose`. When hovering an element with `.oros-wiki-link` or `.oros-mention`:
   - Read `data-id` (or match `data-title` against `worldEntities`).
   - Find the entity from `worldEntities`.
   - Set `hoveredEntity` with debounced coordinates (using link's `getBoundingClientRect()`).
   - Render the existing `<QuickPeekCard entity={hoveredEntity} />` at the exact cursor anchor.
   - On link click, call `setSelectedEntityId(targetId)` and `openTab({ title, type: 'wiki', targetId })`.

### 2.3 Global Spotlight Search (Ctrl+K)
1. *Observation*: `CommandPalette.tsx` is mounted globally in `App.tsx` and triggered with `Ctrl+K`.
2. *Observation*: `searchDeepVault` in `deepSearchEngine.ts` omits battlemaps from `useTtrpgStore`.
3. *Deduction*: Inject `battlemaps` from `useTtrpgStore` into `searchDeepVault` and add a `'battlemap'` domain badge.
4. *Deduction*: Clicking or pressing Enter on a battlemap result calls `openTab({ title: bm.name, type: 'map', targetId: bm.id })` (or campaign battlemap view).
5. *Deduction*: Ensure keyboard navigation uses `scrollIntoView({ block: 'nearest' })` on the active item index so long result lists remain fully visible.

### 2.4 Smart Orthogonal Connector Routing (Obstacle Avoidance)
1. *Observation*: `WhiteboardCustomEdge` in `WhiteboardCanvas.tsx:2763` calls `computeOrthogonalWaypoints(source, target)` which uses simple midpoints and ignores node rects.
2. *Observation*: `reactFlow.getNodes()` provides the exact positions and dimensions of all nodes on canvas: `{ position: { x, y }, style: { width, height }, data: { width, height } }`.
3. *Deduction*: We can implement an obstacle-avoiding orthogonal router:
   - Extract bounding boxes of all nodes (excluding source and target), inflated by a collision margin `pad = 20px`.
   - Generate an orthogonal grid of horizontal and vertical routing channels from the bounding box edges and handle coordinates.
   - Execute an A* pathfinding search over the grid lines from source stub to target stub.
   - Cost function: Segment length + bend penalty (`+60` per right-angle turn to prioritize clean, minimal-turn routes).
   - Feed the resulting waypoints into the existing `pointsToSmoothPath(waypoints, cornerRadius = 10)`.
   - If no route exists without obstacle collision, fallback to the direct midpoint route.

### 2.5 Auto-Layout Clustering Engine
1. *Observation*: `WhiteboardCanvas.tsx` has no layout action, but `WikiNetworkGraph.tsx` already has a tested physics relaxation algorithm.
2. *Deduction*: We can create a dedicated `canvasAutoLayout.ts` utility:
   - Takes current `nodes: Node[]` and `edges: Edge[]`.
   - Identifies connected components and clusters (e.g. by category or edge connectivity).
   - Runs a 60-iteration force simulation with node bounding box overlap repulsion (`overlapX = (w1/2 + w2/2 + 30) - |dx|`).
   - Repositions nodes cleanly and updates canvas state via `setNodes(updatedNodes)` with smooth transition.
   - Add an Auto-Layout button with `<Sparkles />` to the Whiteboard top toolbar.

### 2.6 Interactive Entity Cards on Canvas
1. *Observation*: `CanvasCardNode` currently only renders an avatar and title.
2. *Observation*: Users need quick access to summary, status, and related links without having to open the separate slide-out drawer every time.
3. *Deduction*: Enhance `CanvasCardNode` with:
   - An inline toggle to expand summary and tags directly on the card.
   - Direct status badge (e.g., entity type, secret status).
   - An interactive "Open Codex" button and "Quick Peek" toggle.
   - Native HTML5 Drag-and-Drop handler (`onDragOver`, `onDrop`) on `WhiteboardCanvasContent` so dragging any entity card from the Directory Sidebar or Card Gallery directly onto the canvas automatically instantiates an interactive `canvasCard`.

---

## 3. Concrete Implementation Designs

### 3.1 WikiLink TipTap Extension Specification (`wikiLinkExtension.ts`)
```ts
// src/renderer/components/wiki/wikiLinkExtension.ts
import { Node, mergeAttributes } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
  suggestion: Omit<SuggestionOptions, 'editor'>
}

export const WikiLinkPluginKey = new PluginKey('wikiLinkSuggestion')

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'oros-wiki-link',
        'data-type': 'wiki-link'
      },
      suggestion: {
        char: '[[',
        pluginKey: WikiLinkPluginKey,
        command: ({ editor, range, props }) => {
          // Replace [[query with wiki link node
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props
              },
              {
                type: 'text',
                text: ' '
              }
            ])
            .run()
        }
      }
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({ 'data-id': attributes.id })
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label') || element.textContent,
        renderHTML: attributes => ({ 'data-label': attributes.label })
      }
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="wiki-link"]' },
      { tag: 'a.oros-wiki-link' }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      `[[${node.attrs.label || 'Entity'}]]`
    ]
  },

  renderText({ node }) {
    return `[[${node.attrs.label || ''}]]`
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ]
  }
})
```

### 3.2 Smart Orthogonal Routing Algorithm Specification (`orthogonalRouting.ts`)
```ts
// src/renderer/components/canvas/orthogonalRouting.ts
export interface Point { x: number; y: number }
export interface Box { x: number; y: number; width: number; height: number }

export function calculateObstacleAvoidanceRoute(
  source: { x: number; y: number; position: string },
  target: { x: number; y: number; position: string },
  obstacles: Box[],
  padding: number = 20
): Point[] {
  // 1. Expand obstacle boundaries with collision padding
  const paddedObstacles = obstacles.map(b => ({
    minX: b.x - padding,
    maxX: b.x + b.width + padding,
    minY: b.y - padding,
    maxY: b.y + b.height + padding
  }))

  // 2. Compute handle stubs
  const stubLength = 24
  const startStub = getStubPoint(source.x, source.y, source.position, stubLength)
  const endStub = getStubPoint(target.x, target.y, target.position, stubLength)

  // 3. Form coordinate grid from source, target, and obstacle boundaries
  const xCoords = Array.from(new Set([
    source.x, startStub.x, target.x, endStub.x,
    ...paddedObstacles.flatMap(o => [o.minX, o.maxX])
  ])).sort((a, b) => a - b)

  const yCoords = Array.from(new Set([
    source.y, startStub.y, target.y, endStub.y,
    ...paddedObstacles.flatMap(o => [o.minY, o.maxY])
  ])).sort((a, b) => a - b)

  // 4. A* Search over the grid points
  const path = findAStarOrthogonalPath(startStub, endStub, xCoords, yCoords, paddedObstacles)
  
  return simplifyCollinearPoints([
    { x: source.x, y: source.y },
    ...path,
    { x: target.x, y: target.y }
  ])
}
```

### 3.3 Canvas Auto-Layout Engine Specification (`canvasAutoLayout.ts`)
```ts
// src/renderer/utils/canvasAutoLayout.ts
import { Node, Edge } from '@xyflow/react'

export function autoLayoutWhiteboardNodes(
  nodes: Node[],
  edges: Edge[],
  iterations: number = 60
): Node[] {
  if (nodes.length <= 1) return nodes

  const simNodes = nodes.map(n => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    vx: 0,
    vy: 0,
    width: Number(n.data?.width || n.style?.width || 200),
    height: Number(n.data?.height || n.style?.height || 150)
  }))

  const nodeMap = new Map(simNodes.map(n => [n.id, n]))

  // Center of mass
  const avgX = simNodes.reduce((acc, n) => acc + n.x, 0) / simNodes.length
  const avgY = simNodes.reduce((acc, n) => acc + n.y, 0) / simNodes.length

  for (let step = 0; step < iterations; step++) {
    // 1. Center gravity
    simNodes.forEach(n => {
      n.vx += (avgX - n.x) * 0.004
      n.vy += (avgY - n.y) * 0.004
    })

    // 2. Anti-overlap bounding box repulsion
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i]
        const b = simNodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 1

        const requiredDistX = (a.width + b.width) / 2 + 30
        const requiredDistY = (a.height + b.height) / 2 + 30
        const overlapX = requiredDistX - Math.abs(dx)
        const overlapY = requiredDistY - Math.abs(dy)

        if (overlapX > 0 && overlapY > 0) {
          const push = Math.min(overlapX, overlapY) * 0.2
          a.vx -= Math.sign(dx || 1) * push
          a.vy -= Math.sign(dy || 1) * push
          b.vx += Math.sign(dx || 1) * push
          b.vy += Math.sign(dy || 1) * push
        }
      }
    }

    // 3. Edge spring attraction
    edges.forEach(e => {
      const src = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (src && tgt) {
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const force = 0.03
        src.vx += dx * force
        src.vy += dy * force
        tgt.vx -= dx * force
        tgt.vy -= dy * force
      }
    })

    // 4. Position update & damping
    simNodes.forEach(n => {
      n.x += n.vx
      n.y += n.vy
      n.vx *= 0.85
      n.vy *= 0.85
    })
  }

  return nodes.map(n => {
    const s = nodeMap.get(n.id)
    return s ? { ...n, position: { x: Math.round(s.x), y: Math.round(s.y) } } : n
  })
}
```

---

## 4. Caveats
1. **Drag-and-Drop Desktop vs Web**: HTML5 drag-and-drop in Electron requires setting `e.dataTransfer.setData` in the sidebar drag handles and preventing default on `dragOver` in the canvas container.
2. **Obstacle Density**: In very densely packed whiteboard canvases with hundreds of overlapping cards, fine-grained A* grid search could encounter performance drop if unconstrained. The grid should be limited to the bounding box of source + target plus a 200px halo, with a maximum node exploration limit (e.g., 500 iterations before fallback).
3. **No Caveats on Core Architecture**: The existing Zustand store, React Flow 12, and TipTap 2 setup provide complete foundation to implement all requested R2 and R3 capabilities without breaking backwards compatibility.

---

## 5. Conclusion
1. **Editor & Articles**: TipTap 2 is cleanly modular and extensible. The addition of a `WikiLink` suggestion extension will seamlessly support typing `[[` to insert links, pairing with existing `@mention` capabilities.
2. **R2 Linking & Search**: 
   - Linking index needs both incoming backlinks and outgoing forward links in `backlinksEngine.ts`.
   - Hover popovers (`QuickPeekCard`) only need event delegation on `oros-wiki-prose` to activate.
   - Global spotlight search modal (`CommandPalette.tsx`) works well, but needs `battlemaps` integrated from `useTtrpgStore` and keyboard scroll-into-view.
3. **R3 Canvas & Whiteboard**:
   - Connector routes currently cut through intervening nodes; replacing `computeOrthogonalWaypoints` with an A* obstacle-avoiding routing algorithm will satisfy R3 obstacle avoidance.
   - An Auto-Layout clustering button utilizing physics relaxation will organize complex node graphs without overlap.
   - Interactive entity cards on the canvas can be achieved by expanding `CanvasCardNode` with summary toggles and adding canvas drag-and-drop support.

---

## 6. Verification Method

To independently verify these findings:

1. **Verify Tech Stack & Existing Files**:
   - Inspect `package.json:57-74` to confirm TipTap 2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mention`) and XYFlow (`@xyflow/react`).
   - Inspect `src/renderer/components/wiki/WikiEditor.tsx:41-48` to verify Mention `@` trigger.
   - Inspect `src/renderer/components/wiki/WikiArticleView.tsx:54, 1082-1086` to confirm `hoveredEntity` is uncalled.
   - Inspect `src/renderer/utils/deepSearchEngine.ts:48-56` to confirm lack of battlemaps indexing.
   - Inspect `src/renderer/components/canvas/WhiteboardCanvas.tsx:2600-2650` to confirm naive orthogonal waypoints without obstacle awareness.
2. **Verify TypeScript Compilation**:
   - Run: `cmd /c pnpm exec tsc --noEmit`
   - Expected result: Exits with code `0`.
3. **Verify Build**:
   - Run: `cmd /c pnpm run build`
   - Expected result: Vite successfully packages renderer and electron bundles.
