## 2026-10-24T18:09:10Z
From: a1b4b77f-6a11-4eeb-9e14-c03f34d6b0ee (orchestrator)
Content:
You are a Specification Miner surveying requirements and existing code for the Oros Worldbuilding Studio project.
Your Working Directory: c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3
Authoritative User Request: c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\ORIGINAL_REQUEST.md

You MUST read ORIGINAL_REQUEST.md before starting work.

Your focus:
1. Survey R4 requirements: Fantasy Calendar & Celestial Engine.
   - Investigate existing timeline, events, date representations, and storage in the codebase.
   - Document the specification and mathematics for custom days/week, custom months, leap year rules, multiple moon orbits with celestial phase calculations, and chronological integration with the Timeline view.
   - Identify edge cases in calendar date math (year 0 / negative years, month boundary wrapping, irregular leap cycles, multi-moon phase synchronization).
2. Survey R5 requirements: Obsidian & Foundry VTT Ecosystem Bridges.
   - Investigate current world/entity export and import structures and battlemap scene data models.
   - Document specifications for Obsidian Markdown vault export/import: folder hierarchies, YAML frontmatter, `[[wiki-links]]`, bidirectional roundtrip serialization without data loss.
   - Document specifications for Foundry VTT scene export/import: grid dimensions, wall/door data, token metadata, coordinate systems.
3. Document all detailed specifications, mathematical models, schemas, and edge case inventories in:
c:\Users\azisk\Documents\codes\orosapp\.agents\teamwork\spec_miner_survey_3\handoff.md
Update progress.md in your working directory as you work.
When done, notify the orchestrator via send_message.
