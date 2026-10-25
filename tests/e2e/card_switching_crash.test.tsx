import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useWorldStore } from '../../src/renderer/store/useWorldStore'
import { ErrorBoundary } from '../../src/renderer/components/common/ErrorBoundary'

describe('Card Switching & Workspace Crash Prevention Suite', () => {
  const projectRoot = path.resolve(process.cwd())
  const wikiArticleViewPath = path.join(projectRoot, 'src/renderer/components/wiki/WikiArticleView.tsx')
  const appPath = path.join(projectRoot, 'src/renderer/App.tsx')

  describe('Static Code & Architecture Verification', () => {
    it('WikiArticleView accepts isActive prop with a safe default', () => {
      const content = fs.readFileSync(wikiArticleViewPath, 'utf-8')
      expect(content).toContain('isActive?: boolean')
      expect(content).toMatch(/isActive\s*=\s*true/)
    })

    it('WikiArticleView does NOT include selectedEntityId in its synchronization useEffect dependencies', () => {
      const content = fs.readFileSync(wikiArticleViewPath, 'utf-8')
      // Look for the useEffect block syncing selectedEntityId
      const effectMatch = content.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?setSelectedEntityId[\s\S]*?\}, \[([\s\S]*?)\]\)/)
      expect(effectMatch).not.toBeNull()
      if (effectMatch) {
        const deps = effectMatch[1]
        // selectedEntityId MUST NOT be in the dependency array to prevent cross-tab infinite bounce loops
        expect(deps).not.toContain('selectedEntityId')
        expect(deps).toContain('isActive')
        expect(deps).toContain('entityId')
      }
    })

    it('WikiArticleView guards setSelectedEntityId with isActive and state comparison', () => {
      const content = fs.readFileSync(wikiArticleViewPath, 'utf-8')
      expect(content).toContain('if (isActive && entityId')
      expect(content).toContain('useWorldStore.getState().selectedEntityId !== entityId')
    })

    it('App.tsx wraps the workspace layout and individual tab views with ErrorBoundary', () => {
      const content = fs.readFileSync(appPath, 'utf-8')
      expect(content).toContain('<ErrorBoundary viewName=')
      expect(content).toContain('<ErrorBoundary viewName="Main Workspace">')
    })

    it('App.tsx passes isActive prop to WikiArticleView in TabViewContainer', () => {
      const content = fs.readFileSync(appPath, 'utf-8')
      expect(content).toContain('<WikiArticleView entityId={tab.targetId} isActive={isActive} />')
    })
  })

  describe('Store-level Multi-Tab Switching Invariants', () => {
    it('seamlessly switches between multiple card tabs without state corruption', () => {
      const store = useWorldStore.getState()

      // Reset tabs
      store.closeAllTabs()
      expect(useWorldStore.getState().openTabs.length).toBe(0)

      // Open Card 1
      store.openTab({
        id: 'tab-card-1',
        title: 'Aethelgard High Citadel',
        type: 'wiki',
        targetId: 'entity-citadel-1'
      })
      expect(useWorldStore.getState().openTabs.length).toBe(1)
      expect(useWorldStore.getState().activeTabId).toBe('tab-card-1')
      expect(useWorldStore.getState().selectedEntityId).toBe('entity-citadel-1')

      // Open Card 2
      store.openTab({
        id: 'tab-card-2',
        title: 'Whispering Mire',
        type: 'wiki',
        targetId: 'entity-mire-2'
      })
      expect(useWorldStore.getState().openTabs.length).toBe(2)
      expect(useWorldStore.getState().activeTabId).toBe('tab-card-2')
      expect(useWorldStore.getState().selectedEntityId).toBe('entity-mire-2')

      // Switch back to Card 1
      store.setActiveTabId('tab-card-1')
      expect(useWorldStore.getState().activeTabId).toBe('tab-card-1')
      expect(useWorldStore.getState().selectedEntityId).toBe('entity-citadel-1')

      // Switch back to Card 2
      store.setActiveTabId('tab-card-2')
      expect(useWorldStore.getState().activeTabId).toBe('tab-card-2')
      expect(useWorldStore.getState().selectedEntityId).toBe('entity-mire-2')

      // Open Card 3
      store.openTab({
        id: 'tab-card-3',
        title: 'Lord Malakar',
        type: 'wiki',
        targetId: 'entity-malakar-3'
      })
      expect(useWorldStore.getState().openTabs.length).toBe(3)
      expect(useWorldStore.getState().activeTabId).toBe('tab-card-3')
      expect(useWorldStore.getState().selectedEntityId).toBe('entity-malakar-3')

      // Close middle tab (Card 2)
      store.closeTab('tab-card-2')
      const remainingTabs = useWorldStore.getState().openTabs
      expect(remainingTabs.length).toBe(2)
      expect(remainingTabs.map((t) => t.id)).toEqual(['tab-card-1', 'tab-card-3'])
    })
  })

  describe('ErrorBoundary Component Resilience', () => {
    it('renders children safely when no error is thrown', () => {
      const html = renderToStaticMarkup(
        <ErrorBoundary viewName="Test View">
          <div data-testid="child-content">Normal Content</div>
        </ErrorBoundary>
      )
      expect(html).toContain('Normal Content')
      expect(html).not.toContain('Encountered an Error')
    })

    it('traps render errors and derives error state with reload ability', () => {
      const onResetMock = vi.fn()
      const boundary = new ErrorBoundary({
        children: null,
        viewName: 'Faulty Card View',
        onReset: onResetMock
      })

      expect(boundary.state.hasError).toBe(false)
      expect(boundary.state.error).toBeNull()

      // Simulate React catching an error
      const error = new Error('Simulated Component Crash')
      const derivedState = ErrorBoundary.getDerivedStateFromError(error)
      expect(derivedState.hasError).toBe(true)
      expect(derivedState.error?.message).toBe('Simulated Component Crash')

      // Apply state to boundary instance
      boundary.state = {
        hasError: true,
        error,
        errorInfo: { componentStack: 'at FaultyComponent' }
      }

      // Render should now return fallback UI
      const renderedNode = boundary.render() as React.ReactElement
      const html = renderToStaticMarkup(renderedNode)
      expect(html).toContain('Faulty Card View Encountered an Error')
      expect(html).toContain('Simulated Component Crash')
      expect(html).toContain('Reload View')

      // Mock setState for unmounted unit instance testing
      boundary.setState = vi.fn().mockImplementation((updater) => {
        const next = typeof updater === 'function' ? updater(boundary.state, boundary.props) : updater
        boundary.state = { ...boundary.state, ...next }
      })

      // Verify handleReset
      boundary.handleReset()
      expect(boundary.state.hasError).toBe(false)
      expect(boundary.state.error).toBeNull()
      expect(boundary.setState).toHaveBeenCalled()
      expect(onResetMock).toHaveBeenCalledTimes(1)
    })
  })
})
