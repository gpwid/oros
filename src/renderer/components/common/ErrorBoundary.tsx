import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onReset?: () => void
  viewName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Oros ErrorBoundary] Caught render error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function' && this.state.error) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      if (this.props.fallback && typeof this.props.fallback !== 'function') {
        return this.props.fallback
      }

      const { error } = this.state
      const viewTitle = this.props.viewName || 'Workspace View'

      return (
        <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-6 bg-oros-950 text-oros-100 select-text">
          <div className="w-full max-w-lg bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-oros-800">
              <div className="w-6 h-6 rounded-[2px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 truncate">
                  {viewTitle} Encountered an Error
                </h3>
                <p className="text-[11px] text-oros-400 font-sans mt-0.5">
                  An unexpected render exception was trapped. Your vault data is safe.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-oros-950 border border-oros-800 rounded-[2px] p-3 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono mb-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold break-all">{error?.name || 'Error'}:</span>
              </div>
              <p className="font-mono text-[11px] text-oros-300 whitespace-pre-wrap break-words leading-relaxed">
                {error?.message || 'Unknown render error occurred.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-oros-800/60">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-accent px-3 py-1.5 rounded-[2px] font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload View</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
