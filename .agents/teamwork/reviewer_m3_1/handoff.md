# Milestone 3 Review & Adversarial Challenge Report: Smart Orthogonal Connector Routing

**Author:** Reviewer 1 (`reviewer_m3_1`)  
**Roles:** reviewer, critic  
**Target:** Milestone 3 (Advanced Canvas & Whiteboard Engine — R3)  
**Parent Orchestrator:** `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`  
**Date:** 2026-10-24T21:20:00Z  
**Verdict:** **APPROVE**  

---

## 1. Observation

Direct observations from source code inspection and test execution:

1. **Orthogonal Routing Core (`src/renderer/components/canvas/orthogonalRouting.ts`)**:
   - Lines 22–48: `lineIntersectsBox(p1: Point, p2: Point, box: Box, margin = 0)` calculates bounding envelope containment and performs exact orthogonal segment intersection against the inflated box interior (`p1.x > minX && p1.x < maxX && segMaxY > minY && segMinY < maxY` for vertical lines; horizontal symmetric). Tangential boundary passes do not trigger false intersections.
   - Lines 53–71: `getStubPoint(x, y, position, stubLength = 24)` correctly offsets outward in all cardinal directions (`top`: `y - stubLength`, `bottom`: `y + stubLength`, `left`: `x - stubLength`, `right`: `x + stubLength`) with `position?.toLowerCase()` case-insensitive resilience.
   - Lines 76–96: `simplifyCollinearPoints(points: Point[])` iterates through points and eliminates redundant intermediate points when consecutive segments share the same X or Y coordinate (`Math.abs(prev.x - curr.x) < 0.001 && Math.abs(curr.x - next.x) < 0.001`).
   - Lines 101–138: `pointsToSmoothPath(points: Point[], cornerRadius = 8)` constructs valid W3C SVG path strings (`d` attribute) utilizing quadratic Bézier curves (`Q cur.x cur.y endX endY`). The corner radius is bounded by `r = Math.min(cornerRadius, len1 / 2, len2 / 2)`, and if `r <= 1` it safely falls back to sharp vertices `L cur.x cur.y`, preventing division by zero on zero-length or sub-pixel segments.
   - Lines 143–305: `calculateObstacleAvoidanceRoute(source, target, obstacles: Box[], padding = 20)`:
     - Derives coordinate grid lines from source/target stubs and inflated obstacle perimeters (`b.x - padding`, `b.x + b.width + padding`).
     - Executes an A* search on the orthogonal grid with Manhattan distance heuristic and a turn penalty (`+60` cost per bend) to ensure minimal-bend paths.
     - Tests segments against `lineIntersectsBox(..., padding - 2)` so movements along boundary grid lines clear the obstacle without false collisions.
     - Provides a fallback to deterministic midpoint stubs (`(startStub.x + endStub.x) / 2`) if obstacles completely trap the route or if iterations exceed `maxIterations = 800`.
     - Returns simplified points via `simplifyCollinearPoints`.

2. **React Flow Edge Integration (`src/renderer/components/canvas/WhiteboardCanvas.tsx`)**:
   - Line 51: Imports `calculateObstacleAvoidanceRoute, Box, HandleSpec` from `./orthogonalRouting`.
   - Lines 2868–2916: Inside `WhiteboardCustomEdge`, `waypoints` dynamically extracts obstacles from `reactFlow.getNodes()`, filtering out the edge's own `source` and `target` nodes so connectors do not collide with their own endpoints. Bounding box coordinates are bounded within a local search window (`minBoundX` to `maxBoundX`).
   - Lines 2940–2947: Calls `pointsToSmoothPath(waypoints, 10)` to produce `edgePath`, and positions the edge label (`labelX`, `labelY`) on the midpoint segment.
   - Lines 3144–3148: Renders `<BaseEdge id={id} path={edgePath} ... />` with marker ends and styling.

3. **Auto-Layout & Interactive Cards**:
   - `src/renderer/utils/canvasAutoLayout.ts:21-116`: `autoLayoutWhiteboardNodes` implements 60 iterations of physics relaxation: center-of-mass gravity (`0.004`), anti-overlap bounding box repulsion with deterministic perturbation for coincident coordinates, edge spring attraction toward equilibrium distance (`idealDist = max(260, (w1+w2)/2 + 50)`), and velocity damping (`0.85`).
   - `src/renderer/components/canvas/WhiteboardCanvas.tsx:300-588`: `CanvasCardNode` implements interactive inline summary toggle (`isExpanded` expanding height to >=220px), quick-status tags, category badge with icon/color, and "Open Codex" navigation button (`openTab({ title, type: 'wiki', targetId })`).
   - `src/renderer/components/canvas/WhiteboardCanvas.tsx:4426-4464`: `handleCanvasDrop` extracts `application/oros-entity-id` (set by `Sidebar.tsx` and `CardGallery.tsx`) and instantiates `canvasCard` nodes at canvas coordinates.
   - `src/renderer/components/canvas/WhiteboardCanvas.tsx:4514-4527`: `handleAutoLayout` organizes nodes with undo snapshot, store persistence, and toast notification.

4. **Integrity Audit**:
   - No hardcoded test fixtures or outputs embedded in `orthogonalRouting.ts` or `canvasAutoLayout.ts`.
   - Implementations are full, self-contained algorithms without facades or stubs.
   - Test suite `tests/e2e/helpers/canvasLayoutHelper.ts` re-exports directly from production files (`src/renderer/components/canvas/orthogonalRouting` and `src/renderer/utils/canvasAutoLayout`), proving tests exercise real code.

5. **Independent Verification Execution**:
   - `pnpm.cmd exec tsc --noEmit`: Exited code `0` (clean compile, 0 errors).
   - `pnpm.cmd exec vitest run tests/e2e/canvas_layout.test.ts`: Exited code `0` (22/22 tests passed in 59ms).
   - `pnpm.cmd test`: Exited code `0` (10 test files passed, 247/247 tests passed in 12.12s).
   - `pnpm.cmd run build`: Exited code `0` (Vite transformed 1934 modules, built web bundle in 26.54s, built electron bundles in 263ms).

---

## 2. Logic Chain

1. *From Observation 1 & 2*:
   - `orthogonalRouting.ts` implements the exact mathematical contracts required: orthogonal grid generation from handle stubs and inflated obstacle perimeters, A* search with turn penalty for minimal bends, collinear point simplification, and smooth SVG path generation with clamped fillet radii.
   - In `WhiteboardCanvas.tsx`, `WhiteboardCustomEdge` connects this engine to XYFlow/React Flow, dynamically passing all canvas nodes (except source and target) as obstacles.
   - Therefore, connectors automatically route around obstacle cards without overlapping them directly, satisfying Acceptance Criterion R3.

2. *From Observation 3*:
   - `canvasAutoLayout.ts` provides deterministic 60-iteration physics relaxation that eliminates node overlaps while preserving connected edge clusters.
   - `WhiteboardCanvas.tsx` exposes this via the Auto-Layout button (`handleAutoLayout`), allowing users to clean up disorganized canvases in one click with full undo support.
   - `CanvasCardNode` adds rich entity cards with expandable summaries and Codex links, and HTML5 drag-and-drop from the sidebar and gallery instantiates cards accurately.
   - Therefore, the canvas whiteboard engine enhancements meet the functional requirements of R3.

3. *From Observation 4 & 5*:
   - All tests run against genuine production modules without mock facades or hardcoded branches.
   - Independent verification across TypeScript typechecking (`tsc`), specific e2e tests (`vitest run tests/e2e/canvas_layout.test.ts`), the complete test suite (`pnpm test`), and production compilation (`pnpm run build`) passed with zero errors or warnings.
   - Therefore, the implementation is robust, correct, and ready for integration.

---

## 3. Adversarial Challenges & Stress Testing

| # | Scenario / Assumption | Stress Test Behavior | Result |
|---|-----------------------|----------------------|--------|
| **C1** | **Degenerate or coincident segments in SVG generator** (`pointsToSmoothPath`): If points are identical or distance <= 1, will division by zero occur? | Inspected lines 116–120: `r = Math.min(cornerRadius, len1 / 2, len2 / 2)`. If `len1 === 0`, `r = 0 <= 1`, which immediately triggers straight segment `L cur.x cur.y` without dividing by `len1`. | **PASS** |
| **C2** | **Route trapped inside overlapping obstacles**: If a target node is surrounded with zero line of sight or within `padding` of obstacles, will A* hang or freeze the UI? | Inspected lines 209–213 & 294–298: `maxIterations = 800` caps the A* loop. If no path reaches the target stub, the graceful fallback returns direct stubs with a midpoint orthogonal bend `(startStub.x + endStub.x) / 2`. The UI never freezes. | **PASS** |
| **C3** | **Coincident nodes in Auto-Layout**: If two or more cards share identical `(x, y)` coordinates, does repulsion divide by zero or yield `NaN`? | Inspected `canvasAutoLayout.ts:59-63`: Deterministic perturbation alters `dx` and `dy` when `Math.abs(dx) < 1 && Math.abs(dy) < 1`. Tested in T2.2: `Number.isFinite(pos.x)` passes and overlap is resolved. | **PASS** |
| **C4** | **Tangential obstacle collision**: Do segments running along the boundary padding get falsely flagged as intersecting? | Tested in T2.5 and checked `lineIntersectsBox`: grid lines travel along `padding`, while intersection is checked at `padding - 2`. The 2px clearance buffer allows navigation along obstacle borders without collision. | **PASS** |
| **C5** | **Source and target node self-obstruction**: Does the router mistake the source or target card itself for an obstacle? | `WhiteboardCanvas.tsx:2886` explicitly excludes `source` and `target` IDs from the obstacle list, allowing handle stubs to exit cleanly. | **PASS** |

---

## 4. Caveats

- **No Caveats**: The implementation strictly adheres to the architecture, introduces no new external dependencies, and all 247 tests in the workspace pass cleanly.

---

## 5. Conclusion

**Verdict: APPROVE**

Milestone 3 (Advanced Canvas & Whiteboard Engine — R3) has been thoroughly verified. The implementation satisfies all functional, architectural, and quality standards:
1. `src/renderer/components/canvas/orthogonalRouting.ts`: Robust A* obstacle-avoiding orthogonal router with turn penalties, collinear point reduction, and smooth Bézier corner fillets.
2. `src/renderer/utils/canvasAutoLayout.ts`: Deterministic 60-iteration physics relaxation layout and overlap detector.
3. `src/renderer/components/canvas/WhiteboardCanvas.tsx`: Clean integration into `WhiteboardCustomEdge`, toolbar Auto-Layout button with undo support, interactive `CanvasCardNode` with summary toggles and Codex jumps, and HTML5 drag-and-drop.
4. Independent verification is 100% green: `tsc` (0 errors), `canvas_layout.test.ts` (22/22), `pnpm test` (247/247), `pnpm run build` (success).

The codebase is ready for Milestone 3 review gate clearance and proceeding to Milestone 4.

---

## 6. Verification Method

To reproduce and verify:

```powershell
# 1. Typecheck
pnpm.cmd exec tsc --noEmit

# 2. Canvas layout E2E suite
pnpm.cmd exec vitest run tests/e2e/canvas_layout.test.ts

# 3. Complete test suite
pnpm.cmd test

# 4. Production build
pnpm.cmd run build
```
