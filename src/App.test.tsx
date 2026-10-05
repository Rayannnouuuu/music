import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

const routes: [string, string][] = [
  ['/', 'Dashboard'],
  ['/exercises', 'Exercices'],
  ['/exercises/1', "Détail de l'exercice"],
  ['/tabs', 'Bibliothèque de tabs'],
  ['/tabs/1', 'Riff de démonstration'],
  ['/tuner', 'Tuner'],
  ['/progression', 'Progression'],
  ['/resources', 'Ressources'],
]

describe('App routing', () => {
  for (const [path, title] of routes) {
    test(`renders "${title}" at ${path}`, () => {
      window.history.pushState({}, '', path)
      render(<App />)
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    })
  }
})
