import { Component, type ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

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
        <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
          <Card className="max-w-md space-y-4 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
              <WarningCircle size={24} weight="fill" />
            </span>
            <h1 className="font-semibold">Une erreur est survenue</h1>
            <p className="text-sm text-text-muted">
              Quelque chose s'est mal passé. Essaie de recharger la page ; si le problème persiste
              après un import ou une donnée corrompue, tu peux réinitialiser tes données locales
              depuis les outils de développement du navigateur (localStorage, clé
              "guitar-progress").
            </p>
            <Button className="mx-auto" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
