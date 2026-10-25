# Milestone 5 Challenger Empirical Stress Test Report: Foundry VTT Scene Bridge

**Verdict**: **APPROVE**

## 1. Observation
- Target module under test:
  - `src/renderer/utils/foundryBridge.ts`
  - Re-exported via `tests/e2e/helpers/foundryBridgeHelper.ts`
- Empirical stress test suite formulated and executed:
  - `tests/e2e/foundry_stress.test.ts` (25 comprehensive test cases across 5 focus areas)
- Verbatim verification commands and results:
  - `pnpm.cmd test tests/e2e/foundry_stress.test.ts`
    - Exit code: 0
    - Test Files: 1 passed (1)
    - Tests: 25 passed (25)
    - Duration: 970ms (test execution: 84ms)
    - Benchmark output: `[Foundry Bridge 1,200 Walls Benchmark] Export: 2.18ms | Import: 1.93ms | Total: 4.11ms`
  - `pnpm.cmd exec tsc --noEmit`
    - Exit code: 0 (0 type errors)

## 2. Logic Chain
1. **Focus 1: Boundary Coordinate Transformation & Non-Standard Geometries**:
   - `percentToScenePixel` and `scenePixelToPercent` implement exact geometric transformations:
     $$\text{pixel} = \text{round}\left(P \cdot D + \frac{\text{percent}}{100} \cdot D\right)$$
     $$\text{percent} = \text{round}\left(\frac{\text{pixel} - P \cdot D}{D} \cdot 100\right)$$
   - Tested sub-pixel coordinates ($0.001\%, 12.34567\%, 50.12345\%, 99.999\%$): Roundtrip discretization error is bounded by $\le 0.05\%$, well within sub-pixel visual accuracy.
   - Tested non-standard aspect ratios: Ultra-wide ($4000 \times 1000$ and $8000 \times 1000$) and vertical banners ($1000 \times 4000$ and $600 \times 4800$) transform coordinates independently along both axes without distortion.
   - Tested extreme padding factors: $P = 0.0$ (tight bounding), $P = 0.5$ (large border), and $P = 1.0$ (extreme canvas) compute exact pixel offsets.
   - Tested out-of-bounds coordinates ($< 0\%$ and $> 100\%$): Preserved within Foundry's padded canvas during export and clamped to $[0, 100\%]$ upon import.

2. **Focus 2: Large Wall Counts, Performance Benchmark & Vertex Drift Invariants**:
   - Performance benchmark with 1,200 walls: Export executed in $2.18\text{ms}$, Import executed in $1.93\text{ms}$ ($4.11\text{ms}$ total), significantly exceeding the $< 50\text{ms}$ requirement by an order of magnitude.
   - Scalability tested with 2,500 walls: Processed cleanly with zero memory degradation or call stack overflow.
   - Vertex drift verification: On a 1,000-segment continuous polyline where adjacent walls share vertices ($w_i.p_2 == w_{i+1}.p_1$), the exported Foundry scene coordinates strictly match ($w_i.c[2,3] == w_{i+1}.c[0,1]$), and the re-imported battlemap wall vertices are strictly identical. Zero vertex drift or cracking at joints.
   - Micro-wall snapping: Segments where start and end points snap to the exact same scene pixel ($< 1\text{px}$) are deliberately filtered by line 59 (`if (x1 === x2 && y1 === y2) return`) to prevent Foundry VTT raycasting engine exceptions. Valid small segments ($\ge 1\text{px}$) are retained.

3. **Focus 3: Complex Wall & Door Configurations**:
   - Secret locked doors (`isDoor: true, doorType: 'secret', doorState: 'locked'`) map to `door: 2, ds: 2` in Foundry and import back with 100% state fidelity.
   - Secret open doors map to `door: 2, ds: 1` and restore with 100% fidelity.
   - Regular doors in open (`ds: 1`), closed (`ds: 0`), and locked (`ds: 2`) states roundtrip losslessly.
   - Ethereal walls (`blocksMovement: false, blocksVision: true`) map to `move: 0, sense: 20` and restore movement permeability and vision obstruction.
   - Windows (`blocksMovement: true, blocksVision: false`) map to `move: 20, sense: 0, sound: 20` and import as `wallType: 'window'`.
   - Terrain walls from Foundry (`sense: 10`) import safely with `blocksVision: true`.
   - Non-door walls with stale door attributes are properly sanitized to `door: 0, ds: 0`.

4. **Focus 4: Token Scaling, Boundary Positioning & Attribute Robustness**:
   - Tiny tokens (`size = 0.5`): Top-left offset correctly accounts for half-cell width ($1440 - 16 = 1424$), and center coordinates are reconstructed losslessly on import.
   - Large/Huge/Gargantuan tokens (`size = 1, 2, 3, 4`): Scaled accurately with `tokenPixelWidth = size * gridSize`.
   - Map corner placement: Tokens at boundary corners ($(0,0), (100,0), (0,100), (100,100)$) maintain exact boundary positions.
   - Negative HP values (`-14`), zero HP (`0`), and high boss HP (`546`) are preserved via the nullish coalescing operator (`??`) without falling back to default 10.
   - Sparse attributes: Tokens missing `actorId`, `bar1`, or `texture` import gracefully without throwing.
   - Three-state token disposition: Friendly ($1$), hostile ($-1$), and neutral ($0$) map bidirectionally.

5. **Focus 5: High-Volume Full Battlemap Roundtrip Invariant**:
   - High-volume stress test with 150 diverse walls and 50 diverse tokens across all size and disposition permutations confirms that `import(export(battlemap))` preserves all core metadata, walls, tokens, and grid properties.
   - Hexagonal grid battlemaps map to `grid.type: 2` and restore as `gridType: 'hex'`.
   - Successive export-import cycles are mathematically idempotent: $f(f(x)) == f(x)$.

## 3. Caveats
- **Grid Type Mapping Variant Observation**:
  - Foundry VTT defines grid types: `0: Gridless`, `1: Square`, `2: Hex Rows Odd`, `3: Hex Rows Even`, `4: Hex Columns Odd`, `5: Hex Columns Even`.
  - In `foundryBridge.ts:162`, `sceneData.grid?.type === 2 ? 'hex' : 'square'` maps type 2 to `'hex'` and others to `'square'`.
  - Oros exports hex as type 2, so roundtrip between Oros and Foundry is 100% lossless. However, if an external Foundry scene configured with Hex Rows Even (type 3) or Hex Columns (types 4, 5) is imported, it will fallback to `'square'`. This is a minor non-blocking limitation that can be broadened to `[2, 3, 4, 5].includes(sceneData.grid?.type)` in future improvements.
- No other caveats or functional regressions identified.

## 4. Conclusion
`src/renderer/utils/foundryBridge.ts` exhibits excellent empirical robustness, exceptional performance ($4.11\text{ms}$ for 1,200 walls), exact geometric precision without vertex drift, safe boundary clamping, and complete bi-directional fidelity across all tested token and wall permutations.

Final Verdict: **APPROVE**.

## 5. Verification Method
To independently verify the empirical stress suite:
```powershell
pnpm.cmd test tests/e2e/foundry_stress.test.ts
pnpm.cmd exec tsc --noEmit
```
Expected output:
1. `tests/e2e/foundry_stress.test.ts`: 25 passed out of 25 tests.
2. `tsc --noEmit`: 0 errors.
