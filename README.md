# Oros — Free & Open-Source Worldbuilding Studio

> **Oros** (ὄρος - *mountain / sovereign landmark*) is a free, open-source, desktop-first worldbuilding platform designed for fantasy and sci-fi novelists, tabletop roleplaying (TTRPG) Game Masters, screenwriters, and lore enthusiasts.

Inspired by modern worldbuilding suites like [vvd.world](https://vvd.world/) and [World Anvil], **Oros** is built from the ground up to eliminate paywalls, proprietary subscriptions, and cloud lock-in.

---

## 🏛️ Core Features

* 📖 **Wikipedia-Grade Encyclopedia**:
  * Authentic MediaWiki-style layout with structured Infoboxes.
  * Collapsible Table of Contents, footnotes, and bidirectional backlinks ("What Links Here").
  * Dynamic, no-code custom attribute schema designer.
* 🗂️ **Dynamic Lore Codex Cards**:
  * Unified building blocks for Characters, Settlements, Factions, Relics, Pantheons, and Magic Systems.
  * Instant tag filtering, custom alias resolution, and gallery grids.
* 🗺️ **Multi-Layered Deep-Zoom Cartography**:
  * Zoom and pan high-resolution fantasy raster maps without lag.
  * Drop interactive pins with custom iconography and drill down to child maps.
  * Draw territory boundaries and political borders with translucent vector polygons.
* 🕸️ **Relational Knowledge Graph**:
  * Infinite canvas powered by `@xyflow/react`.
  * Visualizes family trees, political alliances, feuds, and vassal hierarchies.
  * Interactive drag-and-drop nodes with directed, labeled relationship vectors.
* ⏳ **Chronological Multi-Era Timelines**:
  * Track historical events across custom fantasy eras (First Age, Golden Era, Concord).
  * Significance tiers (Mythic, Major, Minor) with direct entity cross-referencing.
* ✍️ **Studio Writer (Split-Screen Manuscript Editor)**:
  * Distraction-free chapter drafting with live word counting.
  * Collapsible **World Codex** drawer to search and verify lore facts without leaving your prose.
* 🔒 **Local-First & Private**:
  * All data stored in human-readable JSON vaults directly on your machine.
  * One-click export to standalone world archives (`.oros.json`).
  * Player vs. Game Master (GM) secret mode toggle to hide spoilers during live sessions.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ or v22+)
* [pnpm](https://pnpm.io/) (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/oros.git
cd orosapp

# Install dependencies
pnpm install

# Run Desktop Development App
pnpm dev
```

### Production Build & Packaging
```bash
# Build web renderer & electron main/preload
pnpm build

# Package standalone Windows desktop application (.exe and .zip)
pnpm run package
```
The output executable will be created in `release/Oros-win32-x64/Oros.exe`, and a portable `.zip` bundle ready for GitHub Releases will be placed in `release/Oros-v0.1.0-Windows-x64.zip`.


---

## 🛠️ Tech Stack
* **Desktop Shell**: Electron 34
* **Build System**: Vite 6 + TypeScript 5
* **Frontend**: React 18 + Tailwind CSS + Lucide Icons
* **Rich Text / Wiki**: TipTap 2 (ProseMirror engine)
* **Graph Canvas**: XYFlow / React Flow 12
* **State Management**: Zustand 5
* **Storage**: Local Vault Persistence (Desktop IPC)

---

## 📜 License
Distributed under the **MIT License**. Free to use, modify, self-host, and distribute.
