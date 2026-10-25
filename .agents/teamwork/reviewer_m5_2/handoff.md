# Milestone 5 Review & Adversarial Evaluation Report: Foundry VTT Scene Bridge

**Reviewer**: `reviewer_m5_2`  
**Working Directory**: `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\reviewer_m5_2`  
**Target Milestone**: Milestone 5 — Foundry VTT Scene Bridge (Geometry, Padding & Walls/Doors)  
**Verdict**: **APPROVE**  
**Integrity Assessment**: **CLEAN** — Zero integrity violations detected. No hardcoded test fixtures, facade implementations, dummy stubs, or bypasses.

---

## 1. Observation

### Verification Commands & Results (Executed via `pnpm.cmd`)
1. **TypeScript Static Typecheck**:
   ```powershell
   pnpm.cmd exec tsc --noEmit
   ```
   - **Result**: Exit code 0 (0 errors, clean typecheck across all 804 lines of `src/shared/types.ts` and `src/renderer/utils/foundryBridge.ts`).

2. **Milestone 5 Target Test Suite**:
   ```powershell
   pnpm.cmd test tests/e2e/obsidian_foundry_serialization.test.ts
   ```
   - **Result**: Exit code 0.
   - **Output**:
     ```
     ✓ tests/e2e/obsidian_foundry_serialization.test.ts (37 tests) 28ms
     Test Files  1 passed (1)
          Tests  37 passed (37)
     ```

3. **Foundry VTT Empirical Stress & Adversarial Suite**:
   ```powershell
   pnpm.cmd test tests/e2e/foundry_stress.test.ts
   ```
   - **Result**: Exit code 0.
   - **Output**:
     ```
     [Foundry Bridge 1,200 Walls Benchmark] Export: 1.97ms | Import: 1.74ms | Total: 3.70ms
     ✓ tests/e2e/foundry_stress.test.ts (24 tests) 81ms
     Test Files  1 passed (1)
          Tests  24 passed (24)
     ```

---

### Code Inspection Observations by Task Area

#### 1. Coordinate Transformation Mathematics (`src/renderer/utils/foundryBridge.ts:8-28`)
- **Forward conversion (`percentToScenePixel`)**:
  ```ts
  const baseOffset = padding * dimension
  return Math.round(baseOffset + (percent / 100) * dimension)
  ```
  With $P = 0.25$, $D = 1920$:
  $\text{baseOffset} = 0.25 \times 1920 = 480\text{px}$.
  At 0%: $480\text{px}$.
  At 50%: $480 + 960 = 1440\text{px}$.
  At 100%: $480 + 1920 = 2400\text{px}$.
  Conforms to Foundry VTT scene canvas padding specification.
- **Reverse conversion (`scenePixelToPercent`)**:
  ```ts
  const baseOffset = padding * dimension
  const rawPercent = ((pixel - baseOffset) / dimension) * 100
  return Math.round(rawPercent * 100) / 100
  ```
  Rounds to 2 decimal places to remove floating point discretization artifacts.
- **Clamping to $[0, 100\%]$** (`foundryBridge.ts:172-175, 210-211`):
  Both imported walls and tokens strictly apply `Math.max(0, Math.min(100, scenePixelToPercent(...)))`.

#### 2. Walls & Doors Mapping (`src/renderer/utils/foundryBridge.ts:51-83, 170-196`)
- **Move & Vision flags**:
  - Export: `move = wall.blocksMovement ? 20 : 0`, `sense = wall.blocksVision ? 20 : 0`, `sound = wall.blocksSound ? 20 : 0`.
  - Windows (`wallType: 'window'`, `blocksMovement: true, blocksVision: false`): exports `move: 20, sense: 0`.
  - Ethereal walls (`blocksMovement: false, blocksVision: true`): exports `move: 0, sense: 20`.
  - Import: `blocksMovement: fw.move > 0`, `blocksVision: fw.sense > 0`, `blocksSound: (fw.sound ?? 0) > 0`.
- **Door states**:
  - Export: `door = wall.doorType === 'secret' ? 2 : 1` when `wall.isDoor` is true; `0` otherwise.
  - Door state: `ds = 1` for `'open'`, `ds = 2` for `'locked'`, `ds = 0` for `'closed'`. Stale door properties are ignored when `isDoor` is false.
  - Import: `isDoor: fw.door > 0`, `doorType: fw.door === 2 ? 'secret' : 'regular'`, `doorState: fw.ds === 1 ? 'open' : fw.ds === 2 ? 'locked' : 'closed'`.
  - Roundtrip fidelity: 100% verified across open, closed, and locked regular and secret doors.

#### 3. Zero-Length Wall Filtering (`src/renderer/utils/foundryBridge.ts:58-60`)
- Exact implementation:
  ```ts
  // Discard zero-length walls
  if (x1 === x2 && y1 === y2) return
  ```
  Cleanly discards both identical vertex definitions and sub-pixel microsegments that discretize to identical pixels, preventing Foundry raycasting engine crashes. Verified in tests `T2.2` and `foundry_stress 2.4`.

#### 4. Token Mapping (`src/renderer/utils/foundryBridge.ts:89-124, 202-231`)
- **Center to Top-Left Coordinate Translation**:
  - Export:
    ```ts
    const centerSceneX = percentToScenePixel(token.x, imageDimensions.width, padding)
    const topleftX = centerSceneX - (size * gridSize) / 2
    ```
  - Import:
    ```ts
    const centerSceneX = ft.x + (size * gridSize) / 2
    const pctX = Math.max(0, Math.min(100, scenePixelToPercent(centerSceneX, width, padding)))
    ```
  - Roundtrip error: $\le 0.05\%$, verified across sizes 0.5 (Tiny), 1 (Medium), 2 (Large), 3 (Huge), 4 (Gargantuan).
- **Attributes**:
  - Actor ID: `actorId = token.characterId || null` $\leftrightarrow$ `characterId = ft.actorId || undefined`.
  - Disposition: Friendly (`isEnemy: false`) $\rightarrow 1$; Hostile (`isEnemy: true`) $\rightarrow -1$; Neutral (`isEnemy: undefined`) $\rightarrow 0$.
  - HP: Preserves negative, 0, and extreme values (`token.hpCurrent ?? 10` preserves `0`).
  - AC (Armor Class): Not mapped in `FoundryTokenData` (noted as minor finding below).

#### 5. UI Export Integration
- `src/renderer/components/common/ExportDropdown.tsx`:
  - Added `VTT` badge with `Layers` Lucide icon.
  - Exported factory: `createFoundryExportOption(onClick, label = 'Foundry VTT Scene')`.
  - Accessible dropdown with outside click and Escape key listeners.
- `src/renderer/components/ttrpg/TTRPGBattlemapViewer.tsx`:
  - Line 17: Imports `ExportDropdown, ExportOption, createFoundryExportOption`.
  - Line 18: Imports `exportBattlemapToFoundry, downloadJsonFile`.
  - Lines 961-970: `handleExportFoundryScene` calls `exportBattlemapToFoundry(currentBattlemap, campaign.title, currentBattlemap.walls)` with toast notifications.
  - Lines 983-994: `battlemapExportOptions` memoized options array.
  - Lines 1174-1178: Renders `<ExportDropdown options={battlemapExportOptions} align="left" ... />` directly in the map header toolbar.
- `src/renderer/utils/exportUtils.ts:481-489`:
  - `exportBattlemapToFoundry` packages `exportBattlemapToFoundryScene` into `${safeName}_foundry_scene.json` and triggers browser download.

---

## 2. Logic Chain

1. **Premise 1 (Spec Compliance)**:
   - `PROJECT.md` and `ORIGINAL_REQUEST.md` (R5) require a robust Foundry VTT scene bridge translating grid dimensions, wall/door geometry, and token metadata.
   - `foundryBridge.ts` provides `exportBattlemapToFoundryScene` and `importFoundrySceneToBattlemap` conforming to Foundry V11/V12 Scene Document specifications.
2. **Premise 2 (Mathematical Accuracy & Inversion Invariants)**:
   - Coordinate transformation equations:
     $$\text{pixel} = \text{round}\left(P \cdot D + \frac{\text{percent}}{100} \cdot D\right)$$
     $$\text{percent} = \text{round}\left(\frac{\text{pixel} - P \cdot D}{D} \cdot 100\right)$$
   - Inversion satisfies $f^{-1}(f(x)) = x$ within pixel discretization limits ($\le 0.05\%$).
   - Idempotence is verified over 3 continuous cycles ($f(f(x)) == f(x)$).
3. **Premise 3 (Integrity Verification)**:
   - Inspection confirms all transformations are implemented via genuine arithmetic and logic.
   - No mock dictionaries or hardcoded test returns exist in `foundryBridge.ts`.
4. **Premise 4 (Empirical Execution & Performance)**:
   - All 37 target tests pass cleanly in 28ms.
   - Stress benchmark transforms 1,200 walls in 3.7ms ($<50\text{ms}$ threshold).
   - Zero vertex drift is maintained along chained polylines of 1,000 segments.
   - Full TypeScript check passes with 0 errors.

---

## 3. Adversarial Findings & Observations

### [Minor] Finding 1: Token Armor Class (AC) Not Mapped in FoundryTokenData
- **Location**: `src/renderer/utils/foundryBridge.ts:117-121`, `src/shared/types.ts:750-763`
- **What**: `TTRPGToken` defines `armorClass?: number` (`types.ts:434`), but `FoundryTokenData` does not have a field or `bar2` mapping for AC.
- **Why**: In Foundry VTT (D&D 5e system), tokens typically map AC to `bar2: { attribute: 'attributes.ac.value', value: token.armorClass }`. Currently, only HP (`bar1`) is serialized.
- **Blast Radius**: Low. Token positions, HP, size, name, and disposition are fully preserved; AC is an optional combat property.
- **Suggestion**: Add optional `bar2?: { attribute?: string; value?: number; max?: number }` to `FoundryTokenData` and map `token.armorClass` when present.

### [Minor] Finding 2: Terrain Wall `sense: 10` Export Mapping
- **Location**: `src/renderer/utils/foundryBridge.ts:72, 188`
- **What**: Foundry VTT supports `sense: 10` for limited-vision terrain walls (`CONST.WALL_SENSE_TYPES.LIMITED`). On import, `fw.sense: 10` is imported as `blocksVision: true` and `wallType: 'wall'`. On re-export, it is exported as `sense: 20` (standard full block).
- **Blast Radius**: Low. Vision is still obstructed; only Foundry's double-wall visibility mechanic is simplified.
- **Suggestion**: In `foundryBridge.ts`, check `if (wall.wallType === 'terrain') sense = 10;` and on import check `if (fw.sense === 10) wallType = 'terrain';`.

### [Minor] Finding 3: Defensive Zero-Length Filtering on Import
- **Location**: `src/renderer/utils/foundryBridge.ts:170-196`
- **What**: While `exportBattlemapToFoundryScene` filters zero-length walls (`if (x1 === x2 && y1 === y2) return`), `importFoundrySceneToBattlemap` does not check `if (p1x === p2x && p1y === p2y)`. If external Foundry data has degenerate walls, or if margin walls clamp to the same boundary point, they are retained in `walls`.
- **Blast Radius**: Low. They are cleanly filtered out if re-exported.
- **Suggestion**: Add `if (p1x === p2x && p1y === p2y) return` on import.

---

## 4. Caveats

- **Lighting & Ambience**: Foundry Scene `lights` array defaults to `[]`. Dynamic ambient light source export is outside the scope of Milestone 5.
- **Image Dimensions in Headless Mode**: When exported via the UI without image metadata, `exportBattlemapToFoundry` uses standard 1920x1080 default scene dimensions, which perfectly preserves all relative percentage geometries.

---

## 5. Conclusion

Milestone 5 (Foundry VTT Scene Bridge: Geometry, Padding & Walls/Doors) is **APPROVED**.

The implementation is correct, computationally efficient ($O(N)$, $<4\text{ms}$ for 1,200 walls), resilient against floating-point discretization drift, preserves all door states losslessly, and integrates seamlessly into the desktop UI.

---

## 6. Verification Method

To independently verify this evaluation:

```powershell
# 1. Verify TypeScript compiles without errors
pnpm.cmd exec tsc --noEmit

# 2. Run target serialization suite
pnpm.cmd test tests/e2e/obsidian_foundry_serialization.test.ts

# 3. Run empirical stress and benchmark suite
pnpm.cmd test tests/e2e/foundry_stress.test.ts
```

**Invalidation Conditions**:
- Any error output from `tsc --noEmit`.
- Any test failure in `obsidian_foundry_serialization.test.ts` or `foundry_stress.test.ts`.
- Inaccurate coordinate mapping or door state distortion during roundtrip import/export.
