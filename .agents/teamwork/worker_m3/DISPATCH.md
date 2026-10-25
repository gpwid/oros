## 2026-10-24T21:00:42Z
You are Worker M3 (`worker_m3`). Your working directory is `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m3`.
Parent orchestrator conversation ID: `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`.

MANDATORY FIRST STEP: Read the authoritative user request at:
`c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md`
Also read:
`c:\Users\azisk\Documents\codes\orosapp\PROJECT.md`
`c:\Users\azisk\Documents\codes\orosapp\tests\e2e\canvas_layout.test.ts`
`c:\Users\azisk\Documents\codes\orosapp\tests\e2e\helpers\canvasLayoutHelper.ts`
`c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\explorer_survey_2\handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Mission for Milestone 3: Advanced Canvas & Whiteboard Engine (R3):
1. **Smart Orthogonal Connector Routing**:
   - Create `src/renderer/components/canvas/orthogonalRouting.ts` exporting:
     `calculateObstacleAvoidanceRoute(source, target, obstacles: Box[], padding?: number): Point[]`,
     `simplifyCollinearPoints(points: Point[]): Point[]`,
     `lineIntersectsBox(p1: Point, p2: Point, box: Box, margin?: number): boolean`,
     `getStubPoint(x: number, y: number, position: 'top' | 'bottom' | 'left' | 'right', stubLength?: number): Point`.
   - Ensure the implementation avoids intervening entity bounding boxes on the canvas with customizable corner radius and stub margins.
   - Register and integrate custom orthogonal connector edge renderer in `src/renderer/components/canvas/WhiteboardCanvas.tsx` for XYFlow / React Flow edges so orthogonal routing utilizes `calculateObstacleAvoidanceRoute`.

2. **Auto-Layout & Cluster Organization**:
   - Create `src/renderer/utils/canvasAutoLayout.ts` exporting:
     `autoLayoutWhiteboardNodes(nodes: CanvasNode[], edges: CanvasEdge[], iterations?: number): CanvasNode[]`,
     `checkNodeOverlaps(nodes: CanvasNode[], margin?: number): boolean`.
   - Implement physics-based force relaxation (repulsion between non-connected cards, spring attraction for connected cards, cluster group bounding) for a default 60 iterations so users can auto-arrange messy whiteboards with 1-click.
   - Add an Auto-Layout button with icon (e.g. Sparkles / Wand) in the WhiteboardCanvas top toolbar that triggers `autoLayoutWhiteboardNodes` and repositions nodes cleanly.

3. **Interactive Entity Cards on Canvas & Drag-and-Drop**:
   - Enhance `CanvasCardNode` in `WhiteboardCanvas.tsx` with:
     - Quick-status tags & entity type badges.
     - Inline summary toggle (expand/collapse entity summary excerpt directly on the card).
     - Direct button to open entity in Codex/Wiki tab.
   - Add HTML5 drag-and-drop support (`onDragOver`, `onDrop`) to `WhiteboardCanvas` so dragging an entity from Directory Sidebar or Card Gallery onto the whiteboard instantiates a canvas entity card at the drop position.

Verification Requirements:
- On Windows PowerShell, ALWAYS execute terminal commands using `pnpm.cmd`.
- Run: `pnpm.cmd exec tsc --noEmit` -> MUST pass with 0 errors.
- Run: `pnpm.cmd exec vitest run tests/e2e/canvas_layout.test.ts` -> All 22 tests MUST pass.
- Run: `pnpm.cmd test` -> Full test suite (247+ tests) MUST pass without regressions.
- Run: `pnpm.cmd run build` -> Production build MUST succeed.

When complete, write your full report in `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m3\handoff.md` and send a message back to orchestrator.
