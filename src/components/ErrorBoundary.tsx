import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
          <div className="max-w-md space-y-3 bg-panel border border-border rounded-lg p-6">
            <h1 className="font-semibold">Une erreur est survenue</h1>
            <p className="text-text-muted text-sm">
              Quelque chose s'est mal passé. Essaie de recharger la page ; si le problème persiste
              après un import ou une donnée corrompue, tu peux réinitialiser tes données locales
              depuis les outils de développement du navigateur (localStorage, clé
              "guitar-progress").
            </p>
            <button
              className="text-accent font-semibold"
              onClick={() => window.location.reload()}
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
