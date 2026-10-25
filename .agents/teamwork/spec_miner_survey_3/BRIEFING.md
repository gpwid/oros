# BRIEFING — 2026-10-24T18:18:00Z

## Mission
Discover and document authoritative specifications, mathematical models, schemas, and edge case inventories for R4 (Fantasy Calendar & Celestial Engine) and R5 (Obsidian & Foundry VTT Ecosystem Bridges) in Oros Worldbuilding Studio.

## 🔒 My Identity
- Archetype: specification_miner
- Roles: Specification Miner, Teamwork Specialist
- Working directory: c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3
- Original parent: a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee
- Milestone: Milestone 2 Survey (R4 Calendar & Celestial Engine, R5 Ecosystem Bridges)

## 🔒 Key Constraints
- Do NOT implement anything — read-only specification mining and documentation.
- Prioritize authoritative sources (ORIGINAL_REQUEST.md, codebase, schemas, domain standards) over LLM prior knowledge.
- Be thorough: document custom days/week, custom months, leap rules, multi-moon orbit math & phases, timeline integration, Obsidian vault roundtrip spec, Foundry VTT scene format spec.
- Fully probe and document all edge cases (negative/zero years, intercalary days, irregular leap cycles, phase sync, coordinate transforms, markdown roundtrip fidelity).
- Write comprehensive handoff.md in working directory.

## Current Parent
- Conversation ID: a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee
- Updated: 2026-10-24T18:18:00Z

## Loaded Skills
- None explicitly assigned in dispatch.

## Task Summary
- **What to build/survey**:
  1. R4: Fantasy Calendar & Celestial Engine mathematical specification, data structures, and timeline integration.
  2. R5: Obsidian Markdown Vault adapter specification (bidirectional roundtrip, frontmatter, wiki-links) and Foundry VTT scene adapter specification (grid, walls, doors, coordinates, tokens).
- **Success criteria**:
  - Full mathematical model for fantasy calendar (epoch, day-of-week, month offsets, leap years, moon synodic periods & phases).
  - Concrete TypeScript interface definitions / schemas for Calendar, Moon, CelestialEvent, TimelineEvent integration.
  - Concrete TypeScript interface definitions / schemas for Obsidian export/import and Foundry VTT Scene export/import.
  - Comprehensive edge case inventory (16 detailed edge cases documented).
  - Handoff report with 5 components (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- **Interface contracts**: ORIGINAL_REQUEST.md, existing codebase types in `src/shared/types.ts`.
- **Code layout**: `src/` (components, models, stores, utils, services).

## Key Decisions Made
- Audited current implementation of `TimelineCalendarView.tsx`, `TimelineLineView.tsx`, `calendarDefaults.ts`, `exportUtils.ts`, `useWorldStore.ts`, and `useTtrpgStore.ts`.
- Identified critical mathematical deficiencies in current weekday calculation (`Math.abs` negative modulo bug, lack of leap year support, integer year timeline coordinates).
- Formulated complete mathematical equations for epoch day count, floor-modulo weekday arithmetic, multi-tier leap rule evaluation, multi-moon orbital phase angles $\theta_k(D)$, illumination $I_k(D)$, 8 canonical lunar phases, and syzygy alignment detection.
- Formulated complete bidirectional conversion rules between Oros LoreEntity/TipTap and Obsidian Markdown + YAML Frontmatter.
- Formulated complete bidirectional conversion rules and geometric coordinate transformations between Oros TTRPGBattlemap and Foundry VTT Scene JSON (v10-v12) including walls, doors, padding offsets, and token metadata.

## Artifact Index
- `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3\handoff.md` — Authoritative specification mining report.
- `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3\progress.md` — Liveness and progress tracker.
- `c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3\DISPATCH.md` — Dispatch log.
