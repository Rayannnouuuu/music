import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import App from './App.tsx'
import { ProgressionProvider } from './lib/progression/ProgressionContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressionProvider>
        <App />
      </ProgressionProvider>
    </ErrorBoundary>
  </StrictMode>,
)
