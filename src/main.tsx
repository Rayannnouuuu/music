import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import App from './App.tsx'
import { ProgressionProvider } from './lib/progression/ProgressionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressionProvider>
      <App />
    </ProgressionProvider>
  </StrictMode>,
)
