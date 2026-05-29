import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md">
            <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2 font-outfit">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto"
            >
              <RefreshCw size={16} /> Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
