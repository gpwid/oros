# DISPATCH — Tier 5 Remediation Worker (worker_tier5_fix)

**Assigned Role**: Tier 5 Remediation Implementation Worker  
**Working Directory**: `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_tier5_fix`  
**Parent Orchestrator ID**: `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`  

---

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## Operating Constraints
- Operating System: Windows (PowerShell shell).
- ALWAYS execute npm/pnpm commands via `pnpm.cmd` (e.g., `pnpm.cmd test`, `pnpm.cmd exec tsc --noEmit`, `pnpm.cmd run build`).

---

## Mandatory Files to Read Before Starting
1. `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md` (authoritative request)
2. `c:\Users\azisk\Documents\codes\orosapp\PROJECT.md` (architecture, layout, interface contracts)
3. `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\challenger_tier5_2\handoff.md` (detailed adversarial gap report)
4. `c:\Users\azisk\Documents\codes\orosapp\tests\e2e\tier5_calendar_bridges_adversarial.test.ts` (19 adversarial tests)

---

## Task Description
Remediate the 3 concrete defects exposed by `challenger_tier5_2`:

### 1. `src/renderer/utils/obsidianBridge.ts`
- **Defect**: During pass 1 of `importObsidianFilesToWorld` (line ~428), `entities.length` is evaluated as 0 because the `entities` array is empty until pass 2. For files lacking an explicit `frontmatter.id`, assigning `frontmatter.id || 'entity-' + (entities.length + 1)` generates the identical ID `'entity-1'` for all files. Consequently, `entityTitleMap` maps every title to `'entity-1'`, causing all wiki-links in native Obsidian vaults to resolve to the first entity.
- **Remediation**: Track unique IDs generated during pass 1 consistently across pass 1 and pass 2 (for example, maintain a `fileIdMap = new Map<string, string>()` or increment an explicit counter `let autoIdCounter = 1` whenever `frontmatter.id` is missing). Store this assigned ID in `fileIdMap.set(filePath, id)` and in `entityTitleMap.set(title.toLowerCase(), id)`, and in pass 2 assign the entity ID from `fileIdMap.get(filePath)!`.

### 2. `src/renderer/utils/calendarMath.ts` (Lunar Phase Boundary Precision)
- **Defect**: In `categorizeLunarPhase` (line ~321), IEEE-754 precision loss in `floorMod(0.22, 1.0)` evaluates to `0.21999999999999997`. Because `0.21999999999999997 < 0.22`, the exact boundary value `0.22` is misclassified as `Waxing Crescent` instead of `First Quarter`.
- **Remediation**: Apply rounding / epsilon to normalized phase fraction before threshold comparisons (e.g. `const f = Math.round(floorMod(fraction, 1.0) * 1e8) / 1e8;` or equivalent epsilon adjustment).

### 3. `src/renderer/utils/calendarMath.ts` (Syzygy Conjunction Tolerance Precision)
- **Defect**: In `detectCelestialConjunctions` (line ~381), `Math.abs(p.phaseFraction - 0.5) <= tolerance` fails at the exact boundary when `tolerance = 0.04` and `p.phaseFraction = 0.54` because `0.54 - 0.5 = 0.040000000000000036` which is `> 0.04`.
- **Remediation**: Add an epsilon tolerance to floating-point comparisons (e.g., `Math.abs(p.phaseFraction - 0.5) <= tolerance + 1e-9`).

---

## Verification Requirements
1. `pnpm.cmd test tests/e2e/tier5_calendar_bridges_adversarial.test.ts` (All 19 tests must pass).
2. `pnpm.cmd test tests/e2e/tier5_ui_canvas_adversarial.test.ts` (All 28 tests must pass).
3. `pnpm.cmd test` (100% of all test files must pass).
4. `pnpm.cmd exec tsc --noEmit` (0 errors).
5. `pnpm.cmd run build` (Clean production build).
6. Write `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_tier5_fix\handoff.md` with:
   - Observation: Exact changes made and test outputs
   - Logic Chain: Why the fixes resolve the edge cases
   - Caveats: Any side effects or nuances
   - Conclusion: Verification summary
   - Verification Method: Exact commands to reproduce
7. Send a completion message back to parent orchestrator (`a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`).
