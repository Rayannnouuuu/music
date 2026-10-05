import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

const routes: [string, string][] = [
  ['/', 'Dashboard'],
  ['/exercises', 'Exercices'],
  ['/exercises/1', "Détail de l'exercice"],
  ['/tabs', 'Bibliothèque de tabs'],
  ['/tabs/1', 'Tab introuvable.'],
  ['/tuner', 'Tuner'],
  ['/progression', 'Progression'],
  ['/resources', 'Ressources'],
]

describe('App routing', () => {
  for (const [path, expectedText] of routes) {
    test(`renders "${expectedText}" at ${path}`, () => {
      window.history.pushState({}, '', path)
      render(<App />)
      const main = screen.getByRole('main')
      expect(within(main).getByText(expectedText)).toBeInTheDocument()
    })
  }
})
