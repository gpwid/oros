## 2026-10-24T18:19:58Z
You are a Worker implementing Milestone 1 for Oros Worldbuilding Studio.
Your Working Directory: c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m1
Project Root: c:\Users\azisk\Documents\codes\orosapp

You MUST read:
- c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\azisk\Documents\codes\orosapp\PROJECT.md
- c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\explorer_survey_1\handoff.md

Your exclusive write ownership:
- package.json
- vitest.config.ts
- src/renderer/components/settings/SettingsModal.tsx
- src/renderer/components/home/HomePage.tsx
- src/renderer/components/layout/WorkspaceTabs.tsx
- src/renderer/components/common/CommandPalette.tsx
- src/renderer/components/writer/ManuscriptCompilerModal.tsx
- src/renderer/components/ttrpg/NewCampaignModal.tsx
- src/renderer/components/ttrpg/NewCharacterModal.tsx
- src/renderer/components/cards/CardGallery.tsx
- src/renderer/App.tsx
- src/renderer/components/wiki/WikiArticleView.tsx (line 1047 helper text only)

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks for Milestone 1:
1. Test Harness Baseline:
   - Install vitest via `pnpm.cmd add -D vitest @types/node` (on Windows use pnpm.cmd).
   - Add `"test": "vitest run"` and `"test:watch": "vitest"` to package.json scripts.
   - Create `vitest.config.ts`.
   - Create initial unit tests for `src/renderer/utils/exportUtils.ts` and `src/renderer/utils/snapEngine.ts` to ensure `pnpm.cmd test` executes and passes cleanly.
2. UI De-vibecoding:
   - In `SettingsModal.tsx`: remove Theme Marketplace preview card (lines 796-848), roadmap badges, fake toast, and demo editing pill/placeholder in font settings.
   - In `HomePage.tsx`: remove "BETA" badge on TTRPG tab (line 235). Remove marketing/promotional blurbs in template cards (lines 476, 527, 642, 683, 692), keeping clear, concise functional titles.
   - In `WorkspaceTabs.tsx`: remove secondary descriptive blurbs from Command Atelier quick-launch items (lines 174-184 & 953-1017).
   - In `CommandPalette.tsx`: remove redundant action subtitles (lines 81, 97, 110, 179).
   - In `WikiArticleView.tsx`: update link syntax helper text from `@title` to standard `[[query]]` (line 1047).
3. Design Unification & Modal Standardization:
   - Standardize modals (`ManuscriptCompilerModal.tsx`, `NewCampaignModal.tsx`, `NewCharacterModal.tsx`) to strict `rounded-[4px]`, `border-oros-750`, and triple-container layout (pinned header `shrink-0 border-b border-oros-750 bg-oros-950/60`, scrollable body `flex-1 overflow-y-auto p-4`, pinned footer `shrink-0 border-t border-oros-750 bg-oros-950/60`).
   - In `CardGallery.tsx`: flatten stacked internal borders (remove redundant separator lines between infobox rows and image banner, relying on subtle background tints and hairline cards).
4. View Retention & Tab Performance Optimization:
   - In `App.tsx`: refactor the tab container to preserve mounted views instead of completely destroying the component tree with `key={activeTabId || currentTabType}` on every tab toggle. Use CSS hidden styling or memoized view cache so heavy views like WhiteboardCanvas retain state and do not incur remount latency.
5. Verification:
   - Run `pnpm.cmd exec tsc --noEmit` and confirm 0 errors.
   - Run `pnpm.cmd run build` and confirm 0 errors/warnings.
   - Run `pnpm.cmd test` and confirm tests pass.

Document all changes, files modified, and build/test outputs in:
c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m1\handoff.md
Update progress.md in your working directory as you work.
When done, notify the orchestrator via send_message.
