import fs from 'node:fs'
import path from 'node:path'

export interface UIViolation {
  file: string;
  line: number;
  type: 'marketing_blurb' | 'forbidden_phrase' | 'non_compliant_radius' | 'stacked_border' | 'deprecated_syntax';
  matchedSnippet: string;
  description: string;
}

// Banned generic promotional phrases and marketing fluff
export const FORBIDDEN_MARKETING_PATTERNS = [
  /Theme Marketplace/i,
  /Preview community palettes/i,
  /BETA/i,
  /AI-powered/i,
  /Stunning worldbuilding/i,
  /Unleash your creativity/i,
  /Next-generation storytelling/i,
  /Explore our roadmap/i,
  /Upvote upcoming features/i,
  /Demo typing speed/i,
  /The quick brown fox/i
]

/**
 * Scans a file's content for violations of UI de-vibecoding guidelines
 */
export function auditFileContent(filePath: string, content: string): UIViolation[] {
  const violations: UIViolation[] = []
  const lines = content.split(/\r?\n/)
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1

    // 1. Audit SettingsModal.tsx
    if (relPath.includes('SettingsModal.tsx')) {
      if (line.includes('Theme Marketplace') || line.includes('Marketplace') && line.includes('palette')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'marketing_blurb',
          matchedSnippet: line.trim(),
          description: 'Forbidden Theme Marketplace card present in SettingsModal'
        })
      }
      if (line.includes('Roadmap') || line.includes('roadmap-badge')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'marketing_blurb',
          matchedSnippet: line.trim(),
          description: 'Forbidden Roadmap stubs present in SettingsModal'
        })
      }
      if (line.includes('The quick brown fox') || line.includes('demo typing')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'marketing_blurb',
          matchedSnippet: line.trim(),
          description: 'Forbidden demo typing preview pill present in SettingsModal'
        })
      }
    }

    // 2. Audit HomePage.tsx
    if (relPath.includes('HomePage.tsx')) {
      if (line.includes('BETA') && (line.includes('TTRPG') || line.includes('badge'))) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'marketing_blurb',
          matchedSnippet: line.trim(),
          description: 'Forbidden BETA badge present on TTRPG tab in HomePage'
        })
      }
    }

    // 3. Audit CommandPalette.tsx
    if (relPath.includes('CommandPalette.tsx')) {
      // Subtitles like "Create a new article in the codex", etc.
      if (line.includes('Create a new article in the codex') || line.includes('Start a new tactical campaign') || line.includes('Draw on whiteboard')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'marketing_blurb',
          matchedSnippet: line.trim(),
          description: 'Redundant action subtitle present in CommandPalette'
        })
      }
    }

    // 4. Audit WikiArticleView.tsx for @title deprecation
    if (relPath.includes('WikiArticleView.tsx')) {
      if (line.includes('Type @ to mention') || line.includes('Type @title')) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'deprecated_syntax',
          matchedSnippet: line.trim(),
          description: 'Deprecated @title syntax text found; must use standard [[query]]'
        })
      }
    }

    // 5. Audit non-compliant large modal radii in modal components
    if (relPath.includes('Modal.tsx')) {
      if (/rounded-(?:xl|2xl|3xl)/.test(line) && (line.includes('dialog') || line.includes('fixed inset-0'))) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'non_compliant_radius',
          matchedSnippet: line.trim(),
          description: 'Modal container uses non-compliant rounded class; must use rounded-[4px]'
        })
      }
    }
  })

  return violations
}

/**
 * Scans directory recursively for UI files
 */
export function scanDirectoryForUIViolations(dirPath: string): UIViolation[] {
  const violations: UIViolation[] = []
  if (!fs.existsSync(dirPath)) return violations

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      violations.push(...scanDirectoryForUIViolations(fullPath))
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      violations.push(...auditFileContent(fullPath, content))
    }
  }

  return violations
}
