# Review & Adversarial Challenge Report: Milestone 2 Deliverables

**Agent:** Reviewer 2 (`reviewer_m2_2`)  
**Roles:** reviewer, critic  
**Recipient / Parent:** `a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee`  
**Timestamp:** 2026-10-24T19:12:30Z  
**Verdict:** **APPROVE**  
**Type:** Hard Handoff (Review Complete)

---

## 1. Observation

### Verification Commands & Results
1. **TypeScript Type Check (`pnpm.cmd exec tsc --noEmit`):**
   - Command: `pnpm.cmd exec tsc --noEmit`
   - Exit code: `0`
   - Stdout/Stderr: Empty (0 compiler errors).

2. **Production Build (`pnpm.cmd run build`):**
   - Command: `pnpm.cmd run build`
   - Exit code: `0`
   - Output summary:
     - Vite built 24 assets in `dist/` (`dist/index.html`, `dist/assets/vendor-tiptap-*.js`, `dist/assets/WikiArticleView-*.js`, etc.).
     - Electron main process built `dist-electron/index.js` (18.61 kB) in 839ms.
     - Electron preload built `dist-electron/preload.cjs` (1.84 kB) in 707ms.

3. **Vitest Unit & E2E Test Suite (`pnpm.cmd test`):**
   - Command: `pnpm.cmd test`
   - Exit code: `0`
   - Output:
     ```
     ✓ src/__tests__/snapEngine.test.ts (10 tests)
     ✓ tests/e2e/wiki_linking.test.ts (24 tests)
     ✓ tests/e2e/wiki_linking_adversarial.test.ts (26 tests)
     ✓ tests/e2e/canvas_layout.test.ts (22 tests)
     ✓ tests/e2e/obsidian_foundry_serialization.test.ts (37 tests)
     ✓ tests/e2e/calendar_math.test.ts (38 tests)
     ✓ tests/e2e/ui_standards.test.ts (32 tests)
     ✓ src/__tests__/exportUtils.test.ts (6 tests)
     ✓ src/__tests__/adversarial.test.ts (31 tests)

     Test Files  9 passed (9)
          Tests  226 passed (226)
       Duration  5.06s
     ```

### Codebase Observations

1. **Hover Preview & Navigation (`src/renderer/components/wiki/WikiArticleView.tsx`):**
   - Lines 254–282 (`handleProseMouseOver`): Uses `.closest('.oros-wiki-link, .oros-mention')` to identify target link. Resolves entity via `data-id` or case-insensitive title/alias match. Clamps horizontal position with `Math.min(Math.max(16, rect.left), window.innerWidth - 340)` and checks vertical clearance against `popoverHeight = 320` to flip above or below.
   - Lines 284–292 (`handleProseMouseOut`): Checks `e.relatedTarget.closest(...)` against `currentLink` to avoid jitter when mousing between child nodes of the link.
   - Lines 303–343 (`handleProseClick`): Intercepts click events on `.oros-wiki-link, .oros-mention`, prevents default browser link jump, clears hover popover state, updates `selectedEntityId`, and calls `openTab({ title: targetEntity.title, type: 'wiki', targetId: targetEntity.id })`.
   - Lines 1255–1265: Mounts `<QuickPeekCard entity={hoveredEntity} />` wrapped in a `fixed z-50 pointer-events-none` container, ensuring the card itself never interrupts mouse events.
   - Lines 1150–1224: Renders "Outgoing & Forward Links" section under article body displaying target entities, sections, labels, and infobox vs. content link source tags.

2. **Battlemap Deep Search Indexing (`src/renderer/utils/deepSearchEngine.ts`):**
   - Line 3: `SearchDomain = 'all' | 'lore' | 'manuscript' | 'timeline' | 'map' | 'conlang' | 'battlemap'`.
   - Line 8: `DeepSearchResult.domain` includes `'battlemap'`.
   - Lines 341–408: Traverses `Object.entries(battlemaps)`. Handles `(bmaps || [])` safely.
     - Exact name match: score 100 with badge `BATTLEMAP · ${gridType}`.
     - Partial name match: score 80.
     - Description match: score 50 with 60-character snippet.
     - Token name match: score 45 with badge `Token: ${name}` and snippet indicating Enemy/Ally.

3. **Command Palette Integration (`src/renderer/components/common/CommandPalette.tsx`):**
   - Lines 30–33: Imports `battlemaps`, `setActiveCampaignId`, `setActiveBattlemapId` from `useTtrpgStore`.
   - Lines 34–39: `useEffect` watches `selectedIndex` and calls `itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })`.
   - Lines 202–204: Passes `battlemaps` into `searchDeepVault`.
   - Lines 256–267: On selecting a battlemap search result, identifies campaign ID from `battlemaps`, calls `setActiveCampaignId(cId)`, calls `setActiveBattlemapId(res.targetId)`, and opens a map workspace tab via `openTab({ title: res.title, type: 'map', targetId: res.targetId })`.
   - Lines 331–352: Adds `'battlemap'` domain filter pill labeled `'Battlemaps'` with `Swords` icon in Rose accent color.
   - Lines 369 & 423: Binds DOM elements to `itemRefs.current[idx]`.

---

## 2. Logic Chain

1. **Verification of Integrity:**
   - No hardcoded test responses or static bypasses were found in source code. Grep searches for dummy/mock logic in `src/renderer/` confirm only authentic business logic.
   - All tests in `tests/e2e/wiki_linking.test.ts` and `tests/e2e/wiki_linking_adversarial.test.ts` execute real assertions against pure engine functions and mock stores.

2. **Hover Preview & Click Navigation Correctness:**
   - Observing `WikiArticleView.tsx:254-282`: Event delegation at the `.oros-wiki-prose` level correctly captures hovered elements matching `.oros-wiki-link` (from TipTap WikiLink atom nodes) and `.oros-mention` (from Mention extension).
   - Entity lookup handles both primary IDs and aliases.
   - Popover boundary clamping prevents off-screen rendering on both small laptop viewports and dual-monitor widths.
   - `pointer-events-none` on the popover container prevents the cursor from hitting the card and triggering accidental `mouseout` flicker.
   - Click delegation intercepts events, prevents native URL changes, and activates both `selectedEntityId` in `useWorldStore` and workspace tab navigation.

3. **Battlemap Search & Navigation Correctness:**
   - In `deepSearchEngine.ts`, battlemap indexing operates across all campaigns in `useTtrpgStore.getState().battlemaps`.
   - Scoring hierarchy places exact title matches (100) above partial titles (80), descriptions (50), and tokens (45).
   - In `CommandPalette.tsx`, selecting a battlemap activates its parent campaign ID and the specific battlemap ID before opening the tab, ensuring that when the map view renders, the correct battlemap is loaded in state.
   - Arrow key navigation drives `selectedIndex`, which immediately triggers `scrollIntoView({ block: 'nearest' })` on the corresponding DOM ref, ensuring off-screen search results remain visible in the palette.

---

## 3. Adversarial Challenges & Stress Testing

### Challenge 1: Hover Popover Mouse Jitter / Infinite Hover-Out Loop
- **Hypothesis**: Moving the cursor across a wiki-link into the popover could cause a flickering loop if the popover intercepts mouse events and triggers `mouseout` on the link.
- **Stress Test**: Inspected CSS and event binding in `WikiArticleView.tsx:1257` and `handleProseMouseOut`.
- **Finding**: Mitigated. The popover wrapper has `pointer-events-none`. Additionally, `handleProseMouseOut` checks `relatedTarget.closest(...)` against `currentLink`.
- **Verdict**: PASS.

### Challenge 2: Popover Viewport Overflow on Edge Anchors
- **Hypothesis**: Wiki-links near the right window edge or bottom window border could push `<QuickPeekCard>` offscreen, making content unreadable.
- **Stress Test**: Evaluated clamping math: `x = Math.min(Math.max(16, rect.left), window.innerWidth - 340)`. For `rect.left = window.innerWidth - 100`, `x` clamps to `window.innerWidth - 340`, keeping the 320px card safely within the viewport. For `rect.bottom + 8 + 320 >= window.innerHeight`, `y` flips to `rect.top - 320 - 8`.
- **Finding**: Math correctly clamps both X and Y axes.
- **Verdict**: PASS.

### Challenge 3: Battlemap Deep Search with Empty or Malformed Campaigns
- **Hypothesis**: Passing empty objects, campaigns with `null` battlemap lists, or battlemaps missing `description`/`tokens` could throw null-reference exceptions in `deepSearchEngine.ts`.
- **Stress Test**: Analyzed defensive fallbacks in `deepSearchEngine.ts:343-393`: uses `(bmaps || [])`, `(bm.description || '').toLowerCase()`, and `(bm.tokens || []).find(...)`.
- **Finding**: Completely protected against null/undefined member access.
- **Verdict**: PASS.

### Challenge 4: Rapid Keyboard Navigation Desynchronization in Command Palette
- **Hypothesis**: Rapidly pressing ArrowDown/ArrowUp across 16+ search results could cause `scrollIntoView` to target stale or unmounted element refs.
- **Stress Test**: In `CommandPalette.tsx`, `itemRefs.current[idx]` is attached on every render of `combinedItems`. `selectedIndex` is reset to `0` whenever `search` changes. `scrollIntoView({ block: 'nearest' })` uses optional chaining `itemRefs.current[selectedIndex]?.scrollIntoView(...)`.
- **Finding**: No runtime exceptions or desynchronization.
- **Verdict**: PASS.

---

## 4. Caveats

- **No caveats.** All requirements for Milestone 2 have been verified against the codebase, test suite, and production build pipelines.

---

## 5. Conclusion & Final Verdict

**Explicit Verdict:** **`APPROVE`**

Milestone 2 deliverable meets all functional and design requirements:
1. Wiki article view supports hover popover cards (`QuickPeekCard`) with clamped coordinates and click navigation on `.oros-wiki-link` and `.oros-mention`.
2. Outgoing and forward links are indexed and rendered.
3. TTRPG battlemaps from `useTtrpgStore` are indexed with domain `'battlemap'` in `deepSearchEngine.ts`.
4. Command Palette provides keyboard navigation with `scrollIntoView({ block: 'nearest' })`, domain filtering for battlemaps, and campaign activation on selection.
5. `tsc --noEmit`, `pnpm run build`, and `pnpm test` (226/226 tests) pass with zero errors.

---

## 6. Verification Method

To independently reproduce this verification:
```powershell
# 1. Type check
pnpm.cmd exec tsc --noEmit

# 2. Production build
pnpm.cmd run build

# 3. Test execution
pnpm.cmd test
```
All commands must terminate with exit code 0.
