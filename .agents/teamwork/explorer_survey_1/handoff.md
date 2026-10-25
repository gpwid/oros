# Comprehensive Exploratory Survey Report: Project Baseline, UI Architecture & Requirement R1 (De-vibecoding & Performance)

**Working Directory**: `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\explorer_survey_1`  
**Target Milestone**: Phase 1 — UI Unification, De-vibecoding, Performance Optimization & Test Infrastructure  
**Author**: Explorer Agent (`explorer_survey_1`)  
**Date**: 2026-10-25T01:16:00Z  

---

## 1. Observation

### 1.1 Project Setup, Build, and Tooling Baseline
- **Package Manager & Lockfile**: `pnpm` (lockfile version `v3` in `pnpm-lock.yaml`, PNPM version 9.x/10.x compatible).
- **TypeScript Compiler Health**:
  - Command: `pnpm.cmd exec tsc --noEmit`
  - Exit Code: `0`
  - Output: `0` errors found. Full strict type checking passes cleanly.
- **Production Bundle Health**:
  - Command: `pnpm.cmd run build`
  - Exit Code: `0`
  - Output: Built in `2.53s` via Vite 6.4.4. Chunks generated:
    - `dist/assets/vendor-lucide-*.js`: 71.94 kB (gzip: 15.69 kB)
    - `dist/assets/vendor-react-*.js`: 183.35 kB (gzip: 59.84 kB)
    - `dist/assets/vendor-xyflow-*.js`: 283.47 kB (gzip: 82.20 kB)
    - `dist/assets/vendor-tiptap-*.js`: 395.73 kB (gzip: 111.45 kB)
    - `dist/assets/index-*.js`: 577.82 kB (gzip: 139.69 kB)
    - `dist/assets/index-*.css`: 85.34 kB (gzip: 14.33 kB)
- **Test Infrastructure Deficit**:
  - In `package.json` (lines 10–17), the `"scripts"` section defines:
    ```json
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview",
      "build:electron": "tsc && vite build && electron-builder",
      "typecheck": "tsc --noEmit",
      "clean": "rimraf dist dist-electron"
    }
    ```
  - Direct search for test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`) returned `0 results`.
  - Neither `vitest` nor `jest` is installed in `devDependencies`.

---

### 1.2 Design System Tokens & Styling Architecture
- **Palette**: Defined in `tailwind.config.js` (lines 9–31) and `src/renderer/index.css` (lines 7–34).
  - 13-step neutral palette (`oros-50` through `oros-950`), mapped to CSS variables `--oros-50` through `--oros-950`.
  - Dark mode base background is `oros-950` (`#090a0d`), primary surface `oros-900` (`#12141a`), secondary surface `oros-850` (`#181b22`), hairline borders `oros-750` (`#262b36`) and `oros-800` (`#1f242e`).
  - Accent colors: Gold (`#d4a359`), Amber (`#d97706`), Violet (`#8b5cf6`), Rose (`#f43f5e`), Emerald (`#10b981`), Sky (`#0ea5e9`), Slate (`#94a3b8`).
- **Typography & Radii Rules** (`DESIGN.md`):
  - Sans-serif primary: `Inter`, `ui-sans-serif`, system-ui.
  - Serif headings/prose: `Literata`, `ui-serif`, Georgia.
  - Monospace tags/metadata/stats: `JetBrains Mono`, `ui-monospace`.
  - Micro-radii specification:
    - Containers & Modals: `rounded-[4px]`
    - Buttons & Interactive Controls: `rounded-[2px]` or `rounded-[3px]`
    - Badges & Pills: `rounded-[2px]`
    - Explicit prohibition: *`NEVER use rounded-lg, rounded-xl, or pill styles (>4px) on UI panels/chrome.`*
- **Modal Chrome Architectural Standard**:
  - Triple-container pattern: Pinned Header (`shrink-0 border-b border-oros-750 bg-oros-950/60`), Scrollable Body (`flex-1 overflow-y-auto p-4`), and Pinned Footer (`shrink-0 border-t border-oros-750 bg-oros-950/60 flex items-center justify-end gap-2`).

---

### 1.3 Verbatim Inventory of "Vibecoded" & Marketing Artifacts (Requirement R1)

#### A. `src/renderer/components/settings/SettingsModal.tsx`
1. **Mock Theme Marketplace & Roadmapped Stub** (lines 796–848):
   - Line 804: `<span className="text-[10.5px] text-oros-400 block">Coming soon in v0.2.0</span>`
   - Line 808: Pill badge with text `"Roadmap Feature"`
   - Lines 818–836: Non-functional preview cards:
     - Card 1: `"Cyberpunk Neon"` with `<span className="text-[9.5px] font-mono text-accent mt-1">Available Soon</span>`
     - Card 2: `"Solarized Parchment"` with `<span className="text-[9.5px] font-mono text-accent mt-1">Available Soon</span>`
   - Lines 839–844: Fake button:
     ```tsx
     <button
       type="button"
       onClick={() => addToast('Community theme marketplace will launch in Oros v0.2.0!', 'info')}
       className="px-3 py-1.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 text-oros-200 border border-oros-750 text-xs font-medium transition-colors"
     >
       Explore Themes
     </button>
     ```
2. **Interactive Playground Dummy Copy** (lines 171 & 178):
   - Line 171: `<span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded-[2px] border border-accent/20">Try editing the text!</span>`
   - Line 178: Placeholder text: `"Click here and start typing to test your font size, line spacing, and typeface live..."`

#### B. `src/renderer/components/home/HomePage.tsx`
1. **"BETA" Badge on TTRPG Tab** (line 235):
   ```tsx
   <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest font-semibold">
     BETA
   </span>
   ```
2. **Marketing & Explanatory AI Fluff Blurbs**:
   - Line 476: Quick Start Template blurb: `"Create a new world with pre-structured categories, sample characters, locations, and lore."`
   - Line 527: `"Launch empty workspace — clean slate for absolute freedom"`
   - Line 642: Feature blurb: `"Everything you create in Oros is saved directly to your local file system as plain Markdown, JSON, and standard image files."`
   - Line 683: `"Obsidian & World Anvil Migration"`
   - Line 692: `"Single-file SQLite or flat Markdown folder vaults. Switch storage backends without losing a single link or tag."`

#### C. `src/renderer/components/layout/WorkspaceTabs.tsx`
1. **Command Atelier Quick-Launch Explanatory Subtitles** (lines 174–184 & 950–1017):
   - Line 175: `"Interactive node board for visual thinking"`
   - Line 178: `"Network diagram of world relationships"`
   - Line 181: `"Interactive historical chronology"`
   - Line 184: `"Distraction-free markdown prose suite"`
   - Lines 953, 970, 987, 1004, 1017: Secondary description spans rendered below primary tool names in the dropdown menu.

#### D. `src/renderer/components/common/CommandPalette.tsx`
1. **Redundant Explanatory Subtitles** (lines 74–179):
   - Line 81: `"Create a pre-structured character sheet"`
   - Line 97: `"Create an empty folder to organize articles"`
   - Line 110: `"Switch to visual node-based whiteboard"`
   - Line 179: `"Reveal storage in Windows File Explorer"`

#### E. `src/renderer/components/wiki/WikiArticleView.tsx`
1. **Outdated Link Syntax Helper** (line 1047):
   - References obsolete mention syntax `@title`:
     `Type [[ to link cards or @title to mention` instead of standard `[[query]]` wiki-link syntax.

---

### 1.4 Inconsistent Modal Shells & Nested Card Border Accumulation
- **Modal Violations of Micro-Radius & Border Token Discipline**:
  - `src/renderer/components/writer/ManuscriptCompilerModal.tsx`:
    - Line 696: Uses `rounded-lg border border-oros-800` instead of `rounded-[4px] border border-oros-750`.
    - Line 1081: E-reader preview uses `rounded-lg border border-oros-800`.
  - `src/renderer/components/ttrpg/NewCampaignModal.tsx`:
    - Line 84: Uses a flat `p-6 space-y-5` card rather than standard pinned header / scrollable body / pinned footer architecture.
  - `src/renderer/components/ttrpg/NewCharacterModal.tsx`:
    - Line 107: Uses flat `p-6 space-y-5` without scroll isolation.
    - Lines 209 & 217: Uses `rounded` (Tailwind 0.25rem = 4px) inside stat grids rather than explicit micro-radii `rounded-[2px]`.
- **Nested Card Border Stacking**:
  - In `src/renderer/components/cards/CardGallery.tsx`:
    - Outer card: `border border-oros-800` (line 168).
    - Image banner: `border-b border-oros-800` (line 172).
    - Category badge inside banner: `border border-xxx/50` (line 185).
    - Infobox highlight rows: `border-t border-oros-800/60` (line 222).
    - Footer action row: `border-t border-oros-800` (line 231).
    - Result: Excessive visual vibration from 4 horizontal lines within an 80px vertical span.

---

### 1.5 Render Tree & Performance Bottlenecks
- **Root Store Subscription in `App.tsx`** (lines 20–35):
  ```tsx
  const {
    worlds, activeWorldId, tabs, activeTabId, ...
  } = useWorldStore()
  ```
  `App.tsx` subscribes to root store fields without selector slicing. Any store update (e.g. updating an entity tag) triggers a top-level render of `App`.
- **Canvas Destruction & Remounting on Tab Switch** (`App.tsx` line 170):
  ```tsx
  <div key={activeTabId || currentTabType} className="flex-1 flex overflow-hidden">
    {currentTabType === 'whiteboard' && <WhiteboardCanvas />}
    {currentTabType === 'wiki' && <WikiArticleView />}
    {currentTabType === 'graph' && <RelationGraphCanvas />}
    ...
  </div>
  ```
  The wrapping `key={activeTabId || currentTabType}` forcibly unmounts and remounts the entire view component subtree on every tab switch.
  - For `WhiteboardCanvas.tsx` (5,532 lines with ReactFlow state, SVG renderer, snap engines), unmounting destroys the viewport coordinates, selections, zoom levels, and history state, while re-mounting incurs expensive React reconciliations and layout recalculations.
- **Monolithic File Sizes**:
  - `src/renderer/components/canvas/WhiteboardCanvas.tsx`: 5,532 lines, 213.5 kB. Contains toolbar, shape math, text editors, snap engines, and export logic in a single file.
  - `src/renderer/components/writer/ManuscriptCompilerModal.tsx`: 1,125 lines, 44.5 kB. Contains HTML/print templates, markdown compiler, and preview iframe renderer.

---

## 2. Logic Chain

1. **Premise**: The goal of Requirement R1 is to elevate Oros from an AI-vibecoded prototype into an unopinionated, razor-sharp, production-grade desktop studio.
2. **Observation → Inference (De-vibecoding)**:
   - Observation: `SettingsModal.tsx` contains a "Theme Marketplace Preview" card tagged "Coming soon in v0.2.0" that fires a fake toast message when clicked (1.3.A).
   - Observation: `HomePage.tsx` contains a prominent "BETA" badge and promotional copy (1.3.B).
   - Inference: Roadmapped stubs, fake toasts, and "Coming Soon" marketing banners are hallmarks of vibecoding. In a serious local-first desktop application, features either work or their UI should not exist. Removing them cleanses the interface and prevents user frustration.
3. **Observation → Inference (Subtitles & Secondary Blurbs)**:
   - Observation: `WorkspaceTabs.tsx` and `CommandPalette.tsx` render redundant secondary subtitles ("Interactive node board for visual thinking", "Create an empty folder to organize articles") (1.3.C, 1.3.D).
   - Inference: Professional creative suites (Obsidian, VS Code, Affinity, Scrivener) do not explain what a folder or canvas is beneath every command button. Removing these subtitles reduces visual noise, tightens button padding, and allows tools to feel immediate and adult.
4. **Observation → Inference (Design & Modal Consistency)**:
   - Observation: `DESIGN.md` mandates `rounded-[4px]` containers and hairline `border-oros-750`, yet `ManuscriptCompilerModal.tsx` uses `rounded-lg` and `border-oros-800`, while `NewCampaignModal` and `NewCharacterModal` lack scroll-isolated bodies (1.4).
   - Inference: Standardizing all modals onto the canonical pinned header / scrollable body / pinned footer triple-container pattern ensures resilient responsive rendering across all screen sizes (including low-height laptop viewports) and visual uniformity.
5. **Observation → Inference (Tab Switching & View Retention)**:
   - Observation: `App.tsx` forces unmount/remount via `key={activeTabId || currentTabType}` (1.5).
   - Inference: Destroying and mounting 5,000+ line components like `WhiteboardCanvas` on every tab toggle causes noticeable frame drops, input latency, and loss of user context. Implementing a display-based tab cache (`hidden` / CSS style toggling or keep-alive memoization) will eliminate mounting latency and preserve scroll/pan states.
6. **Observation → Inference (Test Framework Baseline)**:
   - Observation: The repository currently has 0 test files and no test runner configured in `package.json` (1.1).
   - Inference: Before implementing complex features in subsequent milestones (e.g. wiki-link regex, backlink indexers, calendar leap math, Obsidian/Foundry schema round-tripping), a fast test runner (`vitest`) must be installed and wired to `pnpm test`.

---

## 3. Caveats

1. **Electron Main Process Untouched**: This survey focused primarily on the renderer layer (`src/renderer`) and root configuration. The Electron main process (`src/main`) and IPC channels (`src/preload`) were verified to compile via `pnpm.cmd run build` and `tsc`, but specific OS window frame behaviors (e.g. Windows custom titlebar snap integration) were not dynamically profiled in runtime execution.
2. **Third-party Dependency Audits**: Dependencies such as `@xyflow/react` and `@tiptap/core` are pinned at stable versions and build cleanly. However, deep-dive tree-shaking opportunities in `WhiteboardCanvas.tsx` require careful step-by-step extraction so as not to break canvas node bindings.
3. **Non-destructive Removal**: De-vibecoding removals must only eliminate the marketing chrome, fake toasts, and redundant blurbs; the underlying functional settings, theme selectors, and command palette navigation actions must remain fully intact.

---

## 4. Conclusion & Actionable Roadmap for Implementation

Phase 1 / Requirement R1 implementation can proceed with high confidence along four targeted workstreams:

### Workstream 1: Test Harness Establishment
- Install `vitest`, `@testing-library/react`, and `@types/node` via `pnpm add -D vitest @testing-library/react`.
- Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json`.
- Add initial test suites for existing helper modules:
  - `src/renderer/utils/exportUtils.ts` (JSON/Markdown serialization sanity).
  - `src/renderer/utils/snapEngine.ts` (smart snap coordinate math).

### Workstream 2: UI De-vibecoding & Copy Modernization
- **`SettingsModal.tsx`**:
  - Remove "Theme Marketplace Preview" card (lines 796–848).
  - Clean up the typography preview area (remove the "Try editing the text!" pill and simplify placeholder copy).
- **`HomePage.tsx`**:
  - Remove the "BETA" badge from the TTRPG tab header (line 235).
  - Eliminate promotional/marketing blurbs in template cards (lines 476, 527, 642, 683, 692), keeping clear, concise functional titles.
- **`WorkspaceTabs.tsx`**:
  - Remove secondary descriptive blurbs from the Command Atelier quick-launch items (lines 174–184 & 953–1017).
- **`CommandPalette.tsx`**:
  - Strip redundant explanatory subtitles from actions (lines 81, 97, 110, 179).
- **`WikiArticleView.tsx`**:
  - Update link syntax helper text from `@title` to standard `[[query]]` (line 1047).

### Workstream 3: Design Unification & Modal Standardization
- Standardize all modals (`ManuscriptCompilerModal.tsx`, `NewCampaignModal.tsx`, `NewCharacterModal.tsx`) to strict `rounded-[4px]`, `border-oros-750`, and the triple-container layout (pinned header, scrollable body `overflow-y-auto`, pinned footer).
- In `CardGallery.tsx`: Flatten stacked internal borders (remove redundant separator lines between infobox rows and image banner, relying on subtle background tints and hairline cards).

### Workstream 4: View Transition & Tab Performance Optimization
- In `App.tsx`: Refactor the tab container to preserve mounted views instead of completely destroying the component tree with `key={activeTabId || currentTabType}`.
- Use selective Zustand selectors (`useWorldStore(s => s.activeTabId)`) instead of broad root object destructuring in top-level containers.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Verify TypeScript Strict Compilation**:
   ```powershell
   pnpm.cmd exec tsc --noEmit
   ```
   *Expected outcome*: Exit code 0, 0 diagnostic errors.

2. **Verify Production Build**:
   ```powershell
   pnpm.cmd run build
   ```
   *Expected outcome*: Vite builds in < 3s, outputting clean bundles to `dist/`.

3. **Verify De-vibecoding Target Locations**:
   - Inspect `src/renderer/components/settings/SettingsModal.tsx` lines 796–848 to confirm presence of theme marketplace mock and fake toast.
   - Inspect `src/renderer/components/home/HomePage.tsx` line 235 for BETA badge and lines 476, 527, 642 for marketing blurbs.
   - Inspect `src/renderer/components/layout/WorkspaceTabs.tsx` lines 174–184 and 950–1017 for Atelier subtitles.
   - Inspect `src/renderer/components/common/CommandPalette.tsx` lines 74–179 for action subtitles.
   - Inspect `src/renderer/components/writer/ManuscriptCompilerModal.tsx` lines 696 and 1081 for `rounded-lg` violations.
   - Inspect `src/renderer/App.tsx` line 170 for `key={activeTabId || currentTabType}` remounting mechanism.

4. **Verify Test Harness Absence**:
   ```powershell
   dir -Recurse *.test.ts, *.test.tsx, *.spec.ts
   ```
   *Expected outcome*: No matching files found.
