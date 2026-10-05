import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'
import { ProgressionProvider } from './lib/progression/ProgressionContext'

const routes: [string, string][] = [
  ['/', 'Dashboard'],
  ['/parcours', 'Parcours'],
  ['/exercises', 'Exercices'],
  ['/exercises/1', 'Exercice introuvable.'],
  ['/tabs', 'Bibliothèque de tabs'],
  ['/tabs/new', 'Créer une tab'],
  ['/tabs/1', 'Tab introuvable.'],
  ['/tuner', 'Tuner'],
  ['/progression', 'Progression'],
  ['/resources', 'Ressources'],
]

describe('App routing', () => {
  for (const [path, expectedText] of routes) {
    test(`renders "${expectedText}" at ${path}`, () => {
      window.history.pushState({}, '', path)
      render(
        <ProgressionProvider>
          <App />
        </ProgressionProvider>,
      )
      const main = screen.getByRole('main')
      expect(within(main).getByText(expectedText)).toBeInTheDocument()
    })
  }
})
