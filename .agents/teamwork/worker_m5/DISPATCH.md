## 2026-10-25T01:00:23Z
You are worker_m5 for Milestone 5 (Obsidian & Foundry VTT Ecosystem Bridges) in Oros Worldbuilding Studio.

Your working directory is:
c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\worker_m5

You MUST read the following authoritative files first before starting work:
1. ORIGINAL_REQUEST.md at:
   c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md
2. PROJECT.md at:
   c:\Users\azisk\Documents\codes\orosapp\PROJECT.md
3. Test suite at:
   c:\Users\azisk\Documents\codes\orosapp\tests\e2e\obsidian_foundry_serialization.test.ts
4. Helpers at:
   c:\Users\azisk\Documents\codes\orosapp\tests\e2e\helpers\obsidianBridgeHelper.ts
   c:\Users\azisk\Documents\codes\orosapp\tests\e2e\helpers\foundryBridgeHelper.ts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE & IMPLEMENTATION REQUIREMENTS:
1. Data Models (`src/shared/types.ts`):
   - Define and export `TTRPGWall`:
     ```ts
     export interface TTRPGWall {
       id: string;
       battlemapId: string;
       p1: { x: number; y: number }; // percentage 0-100
       p2: { x: number; y: number }; // percentage 0-100
       wallType: 'wall' | 'window' | 'terrain' | 'ethereal';
       blocksMovement: boolean;
       blocksVision: boolean;
       blocksSound?: boolean;
       isDoor?: boolean;
       doorType?: 'regular' | 'secret';
       doorState?: 'closed' | 'open' | 'locked';
     }
     ```
   - Export Foundry VTT data structures: `FoundryWallData`, `FoundryTokenData`, `FoundrySceneData`.
   - Export Obsidian bridge result types: `ObsidianExportResult`, `ObsidianImportResult`.
   - Update `TTRPGBattlemap` to include optional `walls?: TTRPGWall[]`.

2. Obsidian Markdown Vault Bridge (`src/renderer/utils/obsidianBridge.ts`):
   - `exportWorldToObsidianFiles(worldName, entities, folders, directoryItems): ObsidianExportResult`
     - Preserves nested folder hierarchy from `DirectoryFolder` / `DirectoryItem`.
     - Places unfiled entities in default folders based on entity type (`Characters`, `Locations`, `Factions`, etc.).
     - Sanitizes filenames against Windows/Unix illegal characters (`<>:"/\\|?*`) while preserving original titles in YAML frontmatter (`originalTitle`).
     - YAML frontmatter serialization for entity ID, title, originalTitle, type, isSecret, tags, aliases, summary, avatarUrl, bannerUrl, infobox (sections, fields, targetEntityId), customProperties.
     - Translates TipTap mentions and `[[wiki-links]]` into Obsidian `[[Target]]` and `[[Target|Label]]` markdown syntax.
   - `importObsidianFilesToWorld(files: Record<string, string>): ObsidianImportResult`
     - Parses YAML frontmatter and restores full `LoreEntity` objects.
     - Reconstructs `DirectoryFolder` hierarchy and `DirectoryItem` mappings.
     - Converts Obsidian `[[Target]]` / `[[Target|Label]]` links into TipTap mention markup (`<span data-type="mention"...>`).
     - Ensures 100% lossless roundtrip fidelity: `import(export(world)) == world`.
   - Export helper utilities: `serializeFrontmatter`, `parseFrontmatter`, `sanitizeFilename`, `htmlContentToObsidianMarkdown`, `obsidianMarkdownToHtmlContent`.

3. Foundry VTT Scene Bridge (`src/renderer/utils/foundryBridge.ts`):
   - `exportBattlemapToFoundryScene(battlemap, campaignName, walls, imageDimensions, padding): FoundrySceneData`
     - Applies padding factor $P = 0.25$ coordinate transformation from percentage (0-100%) to scene pixel space.
     - Transforms wall segments with movement/vision blocking and door states (regular, secret, open, closed, locked). Discards zero-length walls.
     - Converts token positions from percentage center to top-left scene pixel space, mapping disposition (-1 hostile, 0 neutral, 1 friendly), HP, AC, size, actor ID.
     - Grid mapping: square (1) and hex (2), cell size and distance.
   - `importFoundrySceneToBattlemap(sceneData, campaignId): { battlemap: TTRPGBattlemap; walls: TTRPGWall[] }`
     - Reconstructs `TTRPGBattlemap`, `TTRPGWall[]`, and `TTRPGToken[]` from Foundry Scene JSON, reversing the padding coordinate transformation back to percentage space.
   - Export helper utilities: `percentToScenePixel`, `scenePixelToPercent`.

4. Bridge Helpers in `tests/e2e/helpers/`:
   - Ensure `tests/e2e/helpers/obsidianBridgeHelper.ts` and `tests/e2e/helpers/foundryBridgeHelper.ts` re-export from `src/renderer/utils/obsidianBridge.ts` and `src/renderer/utils/foundryBridge.ts` so tests directly exercise the production modules.

5. UI Integration:
   - In `src/renderer/components/common/ExportDropdown.tsx`, add options for Obsidian Vault and Foundry VTT Scene export where applicable.

VERIFICATION REQUIREMENTS:
- In Windows PowerShell, ALWAYS run commands using `pnpm.cmd`:
  - `pnpm.cmd exec tsc --noEmit` must pass with 0 errors.
  - `pnpm.cmd test` must pass 100% of tests (all existing 334 tests + 37 obsidian/foundry tests = 371+ passing tests).
  - `pnpm.cmd run build` must succeed cleanly with 0 errors.
- Document all file changes, verification outputs, and passing test results in `handoff.md` in your working directory.
- Send a message to orchestrator with your results upon completion.
