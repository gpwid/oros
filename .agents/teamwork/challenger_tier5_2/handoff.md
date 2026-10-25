# Tier 5 Adversarial Coverage Hardening Gap Report & Handoff

**Instance**: `challenger_tier5_2`  
**Milestone**: Milestone 6 Phase 2 (Tier 5 White-Box Adversarial Coverage Hardening)  
**Date**: 2026-10-25T02:08:00Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

A dedicated Tier 5 adversarial test suite was authored at `tests/e2e/tier5_calendar_bridges_adversarial.test.ts` (19 test cases) challenging the 4 core domains:
1. Calendar math extremes (complex multi-tier leap rules with offsets/exclusions/reinstatements, BCE/CE boundaries, fractional day/hour transitions, extreme millennial range `[-100,000, 100,000]`).
2. Celestial conjunctions (3+ moons with co-prime orbital periods, retrograde orbit configurations, exact syzygy threshold boundaries, 8-phase canonical transitions).
3. Obsidian bridge (complex nested frontmatter with unicode emojis, multiline strings with comments/anchors, deep directory hierarchies, code block protection, multi-file native import without `id:`).
4. Foundry VTT bridge (non-standard hex grids type 2, tokens with extreme sizes 0.5–4.0 and 0 HP, zero-distance subpixel wall discard, complete door state matrix).

Execution command:
`pnpm.cmd test tests/e2e/tier5_calendar_bridges_adversarial.test.ts`

### Verbatim Failures:

```
 FAIL  tests/e2e/tier5_calendar_bridges_adversarial.test.ts > Tier 5 Adversarial Coverage Hardening: Calendar Math & Ecosystem Bridges > 2. Celestial Conjunctions & Multi-Moon Orbits > 2.3: Exact syzygy threshold boundaries and tolerance limits (tolerance = 0.04)
AssertionError: expected undefined to be 'grand_full_conjunction' // Object.is equality

- Expected:
"grand_full_conjunction"

+ Received:
undefined

 ❯ tests/e2e/tier5_calendar_bridges_adversarial.test.ts:313:36
    311|       const insideFull = [createPhaseResult('m1', 0.54), createPhaseResult('m2', 0.46)]
    312|       const conjInsideFull = detectCelestialConjunctions(insideFull, 0.04)
    313|       expect(conjInsideFull?.type).toBe('grand_full_conjunction')
```

```
 FAIL  tests/e2e/tier5_calendar_bridges_adversarial.test.ts > Tier 5 Adversarial Coverage Hardening: Calendar Math & Ecosystem Bridges > 2. Celestial Conjunctions & Multi-Moon Orbits > 2.4: 8-Phase Canonical Boundary Transitions
AssertionError: expected 'Waxing Crescent' to be 'First Quarter' // Object.is equality

Expected: "First Quarter"
Received: "Waxing Crescent"

 ❯ tests/e2e/tier5_calendar_bridges_adversarial.test.ts:367:52
    365|
    366|       expect(categorizeLunarPhase(0.2199).phaseName).toBe('Waxing Crescent')
    367|       expect(categorizeLunarPhase(0.22).phaseName).toBe('First Quarter')
       |                                                    ^
    368|       expect(categorizeLunarPhase(0.22).isMajorPhase).toBe(true)
```

```
 FAIL  tests/e2e/tier5_calendar_bridges_adversarial.test.ts > Tier 5 Adversarial Coverage Hardening: Calendar Math & Ecosystem Bridges > 3. Obsidian Bridge Adversarial Stress > 3.5: Multi-file native Obsidian import without id frontmatter resolves distinct entities and wiki-links
AssertionError: expected '<p>Arthur meets <span data-type="ment…' to contain 'data-id="entity-2"'

Expected: "data-id="entity-2""
Received: "<p>Arthur meets <span data-type="mention" data-id="entity-1" data-label="Lancelot">@Lancelot</span>.</p>"

 ❯ tests/e2e/tier5_calendar_bridges_adversarial.test.ts:602:30
    600|       const lancelot = result.entities.find(e => e.title === 'Lancelot')!
    601|       expect(arthur.id).not.toBe(lancelot.id)
    602|       expect(arthur.content).toContain(`data-id="${lancelot.id}"`)
       |                              ^
    603|       expect(lancelot.content).toContain(`data-id="${arthur.id}"`)
```

---

## 2. Logic Chain

### Bug 1: `obsidianBridge.ts` entity ID collision during native Obsidian markdown import (first pass)
1. In `src/renderer/utils/obsidianBridge.ts` lines 416–437:
   ```typescript
   const entities: LoreEntity[] = []
   ...
   for (const [filePath, content] of Object.entries(files)) {
     if (!filePath.endsWith('.md')) continue
     const { frontmatter } = parseFrontmatter(content)
     const title = ...
     const id = frontmatter.id || `entity-${entities.length + 1}`
     entityTitleMap.set(title.toLowerCase(), id)
   ```
2. During the first pass, `entities` is an empty array and no items are pushed into it (`entities.push` only occurs during the second pass on line 506).
3. Therefore, `entities.length` is evaluated as `0` for every file processed during the first pass.
4. For native Obsidian vaults or markdown files without an explicit `id` frontmatter attribute, `frontmatter.id` is undefined. Every file evaluated receives the identical ID: `entity-${0 + 1}` = `'entity-1'`.
5. As a result, `entityTitleMap` maps every entity title in the vault to `'entity-1'`.
6. During the second pass, `entities.push` does increment `entities.length`, generating `entity-1`, `entity-2`, etc. But all internal wiki-links converted via `obsidianMarkdownToHtmlContent(body, entityTitleMap)` look up titles in `entityTitleMap`, resolving all mentions to `entity-1`.
7. Test 3.5 proves this empirically: `Arthur` and `Lancelot` are imported from files without `id:`. Both receive different entity IDs in `result.entities` (`entity-1` and `entity-2`), but in `Arthur.md`, `[[Lancelot]]` resolves to `<span ... data-id="entity-1" ...>` (Arthur's own ID).

### Bug 2: `calendarMath.ts` `floorMod` floating point artifact causes phase misclassification in `categorizeLunarPhase`
1. In `src/renderer/utils/calendarMath.ts` line 321:
   ```typescript
   export function categorizeLunarPhase(fraction: number) {
     const f = floorMod(fraction, 1.0)
     if (f >= 0.97 || f < 0.03) {
       return { phaseName: 'New Moon', isMajorPhase: true }
     } else if (f >= 0.03 && f < 0.22) {
       return { phaseName: 'Waxing Crescent', isMajorPhase: false }
     } else if (f >= 0.22 && f < 0.28) {
       return { phaseName: 'First Quarter', isMajorPhase: true }
   ```
2. In IEEE 754 floating point arithmetic, `floorMod(0.22, 1.0)`:
   `((0.22 % 1.0) + 1.0) % 1.0` evaluates to `1.22 % 1.0 = 0.21999999999999997`.
3. Because `0.21999999999999997 < 0.22`, the condition `else if (f >= 0.03 && f < 0.22)` evaluates to `true`.
4. As a result, fraction `0.22` (the exact First Quarter boundary) is categorized as `Waxing Crescent` with `isMajorPhase: false` instead of `First Quarter` with `isMajorPhase: true`.

### Bug 3: `calendarMath.ts` floating point subtraction error in `detectCelestialConjunctions` syzygy alignment check
1. In `src/renderer/utils/calendarMath.ts` line 381:
   ```typescript
   const allFull = phases.every(p => Math.abs(p.phaseFraction - 0.5) <= tolerance)
   ```
2. When testing the exact boundary with `tolerance = 0.04` and `p.phaseFraction = 0.54`:
   `0.54 - 0.5 = 0.040000000000000036`.
3. In JavaScript, `0.040000000000000036 <= 0.04` evaluates to `false`.
4. Both moons (`0.54` and `0.46`) are within the intended 0.04 tolerance of Full Moon (0.50), but the Grand Full Conjunction check fails. Pairwise difference `|0.54 - 0.46| = 0.08 > 0.04` also fails, causing `detectCelestialConjunctions` to return `null`.

---

## 3. Caveats

- Implementation code was strictly NOT modified in accordance with Review-Only constraints.
- Existing tests in the suite did not detect these bugs because:
  - Previous Obsidian tests always tested roundtripped entities that already possessed serialized `id: "entity-xyz"` in frontmatter.
  - Previous celestial tests used interior fractions (e.g. 0.25, 0.50, 0.75) rather than exact canonical transition boundaries (0.22).
  - Previous conjunction tests used exact 0.50 fractions or wide tolerances rather than exact boundary values.

---

## 4. Conclusion

Verdict: **REQUEST_CHANGES**

Three concrete, reproducible bugs were exposed by Tier 5 adversarial testing:
1. `src/renderer/utils/obsidianBridge.ts`: `entities.length` reference in pass 1 causes entity ID collision (`entity-1`) for all imported native Obsidian files lacking `frontmatter.id`.
2. `src/renderer/utils/calendarMath.ts`: IEEE-754 precision loss in `floorMod(0.22, 1.0)` produces `0.21999999999999997`, misclassifying First Quarter boundary as Waxing Crescent.
3. `src/renderer/utils/calendarMath.ts`: IEEE-754 subtraction error in `Math.abs(0.54 - 0.5) <= 0.04` fails Grand Full Conjunction detection at exact boundary.

Remediations required:
1. In `obsidianBridge.ts` line 428: Track a separate counter across pass 1 and pass 2, e.g. mapping `filePath` to assigned ID, or using `entityTitleMap.size + 1`.
2. In `calendarMath.ts` line 321: Apply epsilon / precision rounding before threshold comparisons in `categorizeLunarPhase` (e.g. `const f = Math.round(floorMod(fraction, 1.0) * 1e8) / 1e8`).
3. In `calendarMath.ts` line 381: Add epsilon tolerance to floating point boundary checks in `detectCelestialConjunctions` (e.g. `Math.abs(p.phaseFraction - 0.5) <= tolerance + 1e-9`).

---

## 5. Verification Method

To independently reproduce the failures:
```powershell
pnpm.cmd test tests/e2e/tier5_calendar_bridges_adversarial.test.ts
```

Inspect failures in tests:
- `2.3: Exact syzygy threshold boundaries and tolerance limits (tolerance = 0.04)`
- `2.4: 8-Phase Canonical Boundary Transitions`
- `3.5: Multi-file native Obsidian import without id frontmatter resolves distinct entities and wiki-links`

Invalidation conditions:
Once the three bug fixes are applied to `obsidianBridge.ts` and `calendarMath.ts`, running `pnpm.cmd test tests/e2e/tier5_calendar_bridges_adversarial.test.ts` will pass 19/19 with 0 failures, and `pnpm.cmd test` will pass 19/19 test files.
