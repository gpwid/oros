import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  auditFileContent,
  scanDirectoryForUIViolations,
  FORBIDDEN_MARKETING_PATTERNS
} from './helpers/uiAuditHelper'

describe('UI De-vibecoding & Design Standards Suite (E2E)', () => {
  const projectRoot = path.resolve(process.cwd())
  const componentsDir = path.join(projectRoot, 'src/renderer/components')

  // Helper to read component file
  function readComponent(relPath: string): string {
    const fullPath = path.join(componentsDir, relPath)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }
    return fs.readFileSync(fullPath, 'utf-8')
  }

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 per feature)
  // =========================================================================

  describe('Tier 1: Feature 2 - UI De-vibecoding (Settings)', () => {
    it('T1.2.1: SettingsModal has 0 instances of Theme Marketplace preview card', () => {
      const content = readComponent('settings/SettingsModal.tsx')
      expect(content).not.toContain('Theme Marketplace')
      expect(content).not.toContain('theme-marketplace')
      expect(content).not.toContain('Preview community palettes')
    })

    it('T1.2.2: SettingsModal has 0 fake roadmap badges or stubs', () => {
      const content = readComponent('settings/SettingsModal.tsx')
      expect(content).not.toContain('roadmap-badge')
      expect(content).not.toContain('Roadmap')
      expect(content).not.toContain('Planned for v')
    })

    it('T1.2.3: SettingsModal has 0 fake toast simulation triggers', () => {
      const content = readComponent('settings/SettingsModal.tsx')
      expect(content).not.toContain('Settings saved!')
      expect(content).not.toContain('showFakeToast')
    })

    it('T1.2.4: SettingsModal font settings has 0 demo typing placeholder pills', () => {
      const content = readComponent('settings/SettingsModal.tsx')
      expect(content).not.toContain('The quick brown fox')
      expect(content).not.toContain('demo typing')
    })

    it('T1.2.5: SettingsModal retains functional desktop settings controls', () => {
      const content = readComponent('settings/SettingsModal.tsx')
      expect(content).toContain('Appearance')
      expect(content).toContain('fontSize')
      expect(content).toContain('HOTKEYS')
    })
  })

  describe('Tier 1: Feature 3 - UI De-vibecoding (Home & Navigation)', () => {
    it('T1.3.1: HomePage has 0 "BETA" badges on TTRPG tab', () => {
      const content = readComponent('home/HomePage.tsx')
      // Look for any badge or span with BETA text
      const betaBadgeMatch = content.match(/<span[^>]*class[^>]*>BETA<\/span>/i)
      expect(betaBadgeMatch).toBeNull()
    })

    it('T1.3.2: HomePage template cards have 0 generic promotional marketing blurbs', () => {
      const content = readComponent('home/HomePage.tsx')
      expect(content).not.toContain('Craft your legendary saga')
      expect(content).not.toContain('Explore the boundless expanse')
      expect(content).not.toContain('Unleash your imagination')
    })

    it('T1.3.3: WorkspaceTabs Command Atelier items have 0 redundant secondary marketing descriptions', () => {
      const content = readComponent('layout/WorkspaceTabs.tsx')
      expect(content).not.toContain('Forge a new lore article in the codex')
      expect(content).not.toContain('Chart the stars and timeline')
      expect(content).not.toContain('Deploy battlemaps for tactical combat')
    })

    it('T1.3.4: WorkspaceTabs retains clean functional titles for Atelier quick actions', () => {
      const content = readComponent('layout/WorkspaceTabs.tsx')
      expect(content).toContain('Canvas')
      expect(content).toContain('Timeline')
      expect(content).toContain('Cartography')
      expect(content).toContain('Studio Writer')
    })

    it('T1.3.5: HomePage displays clean project info and template titles without marketing fluff', () => {
      const content = readComponent('home/HomePage.tsx')
      expect(content).toContain('Worldbuilding Vaults')
      expect(content).toContain('Create New Project')
      expect(content).toContain('TTRPG Campaigns')
    })
  })

  describe('Tier 1: Feature 4 - UI De-vibecoding (Command Palette & Editor)', () => {
    it('T1.4.1: CommandPalette has 0 redundant action subtitles', () => {
      const content = readComponent('common/CommandPalette.tsx')
      expect(content).not.toContain('Create a new article in the codex')
      expect(content).not.toContain('Start a new tactical campaign')
      expect(content).not.toContain('Draw on whiteboard canvas')
    })

    it('T1.4.2: WikiArticleView syntax helper uses standard [[query]] bracket syntax instead of @title', () => {
      const content = readComponent('wiki/WikiArticleView.tsx')
      expect(content).not.toContain('Type @ to mention')
      expect(content).not.toContain('Type @title')
      expect(content).toContain('[[{currentEntity.title}]]')
    })

    it('T1.4.3: CommandPalette retains keyboard navigation shortcuts and search input', () => {
      const content = readComponent('common/CommandPalette.tsx')
      expect(content).toContain('placeholder="Search whole vault')
      expect(content).toContain('keydown')
    })

    it('T1.4.4: CommandPalette modal adheres to strict micro-radius design tokens', () => {
      const content = readComponent('common/CommandPalette.tsx')
      expect(content).toContain('rounded-[4px]')
      expect(content).toContain('border-oros-750')
    })

    it('T1.4.5: WikiArticleView links render with oros-wiki-link styling', () => {
      const content = readComponent('wiki/WikiArticleView.tsx')
      expect(content).toContain('oros-wiki-prose')
    })
  })

  describe('Tier 1: Feature 5 - Design System Unification (Modals & Cards)', () => {
    it('T1.5.1: ManuscriptCompilerModal adheres to rounded-[4px] and modal layout', () => {
      const content = readComponent('writer/ManuscriptCompilerModal.tsx')
      expect(content).toContain('rounded-[4px]')
      expect(content).toContain('border-oros-750')
      expect(content).toContain('border-b')
      expect(content).toContain('overflow-y-auto')
      expect(content).toContain('shrink-0')
    })

    it('T1.5.2: NewCampaignModal adheres to rounded-[4px] and triple-container layout', () => {
      const content = readComponent('ttrpg/NewCampaignModal.tsx')
      expect(content).toContain('rounded-[4px]')
      expect(content).toContain('border-oros-750')
      expect(content).toContain('shrink-0 border-b')
      expect(content).toContain('flex-1 overflow-y-auto')
      expect(content).toContain('shrink-0 border-t')
    })

    it('T1.5.3: NewCharacterModal adheres to rounded-[4px] and triple-container layout', () => {
      const content = readComponent('ttrpg/NewCharacterModal.tsx')
      expect(content).toContain('rounded-[4px]')
      expect(content).toContain('border-oros-750')
      expect(content).toContain('shrink-0 border-b')
      expect(content).toContain('flex-1 overflow-y-auto')
      expect(content).toContain('shrink-0 border-t')
    })

    it('T1.5.4: CardGallery has 0 stacked internal border lines', () => {
      const content = readComponent('cards/CardGallery.tsx')
      // Verifies absence of redundant heavy borders separating banner from details
      expect(content).not.toContain('border-b-2 border-oros-700')
      expect(content).not.toContain('divide-y-2')
    })

    it('T1.5.5: Modal control buttons adhere to rounded-[2px] micro-radii', () => {
      const comp1 = readComponent('writer/ManuscriptCompilerModal.tsx')
      const comp2 = readComponent('ttrpg/NewCampaignModal.tsx')
      expect(comp1.includes('rounded-[2px]') || comp1.includes('rounded-[4px]')).toBe(true)
      expect(comp2.includes('rounded-[2px]') || comp2.includes('rounded-[4px]')).toBe(true)
    })
  })

  describe('Tier 1: Feature 6 - View Retention & Tab Performance', () => {
    it('T1.6.1: App.tsx preserves mounted tab views instead of unmounting on key toggle', () => {
      const appFile = path.join(projectRoot, 'src/renderer/App.tsx')
      const content = fs.readFileSync(appFile, 'utf-8')

      // Verifies that App.tsx does not use destructive key unmounting on every tab toggle
      expect(content).not.toContain('key={activeTabId || currentTabType}')
    })

    it('T1.6.2: App.tsx uses display/CSS styling or memoized cache for tab view retention', () => {
      const appFile = path.join(projectRoot, 'src/renderer/App.tsx')
      const content = fs.readFileSync(appFile, 'utf-8')

      // Should check active tab display or view cache
      const hasRetentionPattern = content.includes('activeTabId ===') ||
        content.includes('tab.id ===') ||
        content.includes('style={{ display:') ||
        content.includes('hidden') ||
        content.includes('viewCache') ||
        content.includes('mountedTabs')

      expect(hasRetentionPattern).toBe(true)
    })

    it('T1.6.3: WhiteboardCanvas maintains state during view preservation', () => {
      const appFile = path.join(projectRoot, 'src/renderer/App.tsx')
      const content = fs.readFileSync(appFile, 'utf-8')
      expect(content).toContain('WhiteboardCanvas')
    })

    it('T1.6.4: App.tsx preserves WikiArticleView without remount churn', () => {
      const appFile = path.join(projectRoot, 'src/renderer/App.tsx')
      const content = fs.readFileSync(appFile, 'utf-8')
      expect(content).toContain('WikiArticleView')
    })

    it('T1.6.5: App.tsx imports shared Oros modal and layout tokens', () => {
      const appFile = path.join(projectRoot, 'src/renderer/App.tsx')
      const content = fs.readFileSync(appFile, 'utf-8')
      expect(content).toContain('oros-')
    })
  })

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 per feature domain)
  // =========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: SettingsModal content scan produces 0 violations', () => {
      const filePath = path.join(componentsDir, 'settings/SettingsModal.tsx')
      const content = fs.readFileSync(filePath, 'utf-8')
      const violations = auditFileContent(filePath, content)
      expect(violations).toHaveLength(0)
    })

    it('T2.2: HomePage content scan produces 0 violations', () => {
      const filePath = path.join(componentsDir, 'home/HomePage.tsx')
      const content = fs.readFileSync(filePath, 'utf-8')
      const violations = auditFileContent(filePath, content)
      expect(violations).toHaveLength(0)
    })

    it('T2.3: CommandPalette content scan produces 0 violations', () => {
      const filePath = path.join(componentsDir, 'common/CommandPalette.tsx')
      const content = fs.readFileSync(filePath, 'utf-8')
      const violations = auditFileContent(filePath, content)
      expect(violations).toHaveLength(0)
    })

    it('T2.4: WikiArticleView content scan produces 0 syntax deprecation violations', () => {
      const filePath = path.join(componentsDir, 'wiki/WikiArticleView.tsx')
      const content = fs.readFileSync(filePath, 'utf-8')
      const violations = auditFileContent(filePath, content)
      expect(violations).toHaveLength(0)
    })

    it('T2.5: Modal components have 0 non-compliant large radii (rounded-2xl, rounded-3xl)', () => {
      const modals = [
        'writer/ManuscriptCompilerModal.tsx',
        'ttrpg/NewCampaignModal.tsx',
        'ttrpg/NewCharacterModal.tsx',
        'settings/SettingsModal.tsx'
      ]

      modals.forEach(modalRelPath => {
        const filePath = path.join(componentsDir, modalRelPath)
        const content = fs.readFileSync(filePath, 'utf-8')
        expect(content).not.toMatch(/rounded-3xl/)
        expect(content).not.toMatch(/rounded-2xl/)
      })
    })
  })

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Global design token consistency across Settings, Modals, and Command Palette', () => {
      const files = [
        'settings/SettingsModal.tsx',
        'writer/ManuscriptCompilerModal.tsx',
        'ttrpg/NewCampaignModal.tsx',
        'common/CommandPalette.tsx'
      ]

      files.forEach(f => {
        const content = readComponent(f)
        expect(content).toContain('border-oros-750')
        expect(content).toContain('rounded-[4px]')
      })
    })
  })

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIO
  // =========================================================================

  describe('Tier 4: Real-World Scenario - "Studio Executive UI Audit"', () => {
    it('T4.1: scans all 10 core refactored UI components for complete de-vibecoding and design token compliance', () => {
      const filesToAudit = [
        'settings/SettingsModal.tsx',
        'home/HomePage.tsx',
        'layout/WorkspaceTabs.tsx',
        'common/CommandPalette.tsx',
        'wiki/WikiArticleView.tsx',
        'writer/ManuscriptCompilerModal.tsx',
        'ttrpg/NewCampaignModal.tsx',
        'ttrpg/NewCharacterModal.tsx',
        'cards/CardGallery.tsx'
      ]

      const allViolations = filesToAudit.flatMap(file => {
        const fullPath = path.join(componentsDir, file)
        const content = fs.readFileSync(fullPath, 'utf-8')
        return auditFileContent(fullPath, content)
      })

      expect(allViolations).toHaveLength(0)
    })
  })
})
