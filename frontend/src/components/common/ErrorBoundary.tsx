import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Custom fallback UI — receives the error */
  fallback?: (error: Error) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Class-based Error Boundary that catches render-phase errors in its subtree.
 * Displays a friendly error card; accepts an optional custom fallback renderer.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with a real logger (e.g. Sentry) in production
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      if (fallback) return fallback(error)

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
        >
          <AlertTriangle
            size={40}
            className="text-red-500"
            aria-hidden="true"
          />
          <div>
            <h2 className="mb-1 text-lg font-semibold text-red-700">
              Something went wrong
            </h2>
            <p className="text-sm text-red-600">
              {error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-full bg-[#2D6A2D] px-4 py-2 text-sm font-medium text-white hover:bg-[#245424] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A2D] focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )
    }

    return children
  }
}
