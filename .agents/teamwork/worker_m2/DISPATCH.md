## 2026-10-24T18:46:47Z
You are a Worker implementing Milestone 2 for Oros Worldbuilding Studio.
Your Working Directory: c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m2
Project Root: c:\Users\azisk\Documents\codes\orosapp

You MUST read:
- c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\azisk\Documents\codes\orosapp\PROJECT.md
- c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\explorer_survey_2\handoff.md
- c:\Users\azisk\Documents\codes\orosapp\TEST_INFRA.md
- c:\Users\azisk\Documents\codes\orosapp\tests\e2e\wiki_linking.test.ts

Your exclusive write ownership:
- src/renderer/components/wiki/wikiLinkExtension.ts
- src/renderer/components/wiki/WikiEditor.tsx
- src/renderer/components/wiki/WikiArticleView.tsx
- src/renderer/utils/backlinksEngine.ts
- src/renderer/utils/deepSearchEngine.ts
- src/renderer/components/common/CommandPalette.tsx

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks for Milestone 2:
1. Wiki-Link Autocomplete (`[[query]]`):
   - Implement `src/renderer/components/wiki/wikiLinkExtension.ts` utilizing TipTap 2 (`@tiptap/core`, `@tiptap/suggestion`) with `char: '[['` and custom regex matcher `/(?:^|\s)\[\[([^\]]*)$/`.
   - Mount suggestion list dropdown (similar to `MentionList`) filtering world entities by title and aliases.
   - Upon selection, insert a wiki-link node or markup: `<span class="oros-wiki-link" data-type="wiki-link" data-id="${entity.id}" data-title="${entity.title}">[[${entity.title}]]</span>`.
   - Register `WikiLink` extension in `WikiEditor.tsx:40-52`.
2. Bi-directional Link Indexing:
   - In `src/renderer/utils/backlinksEngine.ts`: extend with `findForwardLinksForEntity(sourceEntity, allEntities)` to extract outgoing references (wiki links, mentions, infobox entity links).
   - In `src/renderer/components/wiki/WikiArticleView.tsx`: display an Outgoing / Forward Links panel alongside the Backlinks panel.
3. Hover Preview Popovers & Navigation:
   - In `WikiArticleView.tsx`: attach delegated `mouseover`, `mouseleave`, and `click` listeners to `.oros-wiki-prose`.
   - When hovering an element with `.oros-wiki-link` or `.oros-mention`: read `data-id` (or `data-title`), locate entity in `worldEntities`, and set `hoveredEntity` with coordinates to render `<QuickPeekCard entity={hoveredEntity} />`.
   - On link click, navigate to target entity via `openTab({ title, type: 'wiki', targetId })` and update selected entity.
4. Global Spotlight Search (`Ctrl+K`):
   - In `src/renderer/utils/deepSearchEngine.ts`: accept `battlemaps: Record<string, TTRPGBattlemap[]>` (from `useTtrpgStore`) and index battlemaps with category/domain `'battlemap'`.
   - In `src/renderer/components/common/CommandPalette.tsx`: pass `battlemaps` into `searchDeepVault`. Selecting a battlemap navigates to it. Ensure keyboard Arrow Up/Down navigation uses `scrollIntoView({ block: 'nearest' })` on active item index so results remain visible.
5. Verification:
   - `pnpm.cmd exec tsc --noEmit` -> 0 errors.
   - `pnpm.cmd run build` -> 0 errors.
   - `pnpm.cmd test` -> all tests pass.

Document all changes, files modified, and build/test outputs in:
c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m2\handoff.md
Update progress.md in your working directory as you work.
When done, notify the orchestrator via send_message.
